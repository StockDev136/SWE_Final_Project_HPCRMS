package com.hpcrms.backend.service.impl;

import com.hpcrms.backend.dto.response.MaintenanceRecordResponse;
import com.hpcrms.backend.entity.MaintenanceRecord;
import com.hpcrms.backend.entity.Vehicle;
import com.hpcrms.backend.entity.enums.MaintenanceStatus;
import com.hpcrms.backend.entity.enums.VehicleStatus;
import com.hpcrms.backend.exception.ResourceNotFoundException;
import com.hpcrms.backend.mapper.MaintenanceMapper;
import com.hpcrms.backend.repository.MaintenanceRecordRepository;
import com.hpcrms.backend.repository.VehicleRepository;
import com.hpcrms.backend.service.MaintenanceService;
import com.hpcrms.backend.service.VehicleService;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.util.List;

/**
 * UC-9: Schedule Vehicle Maintenance. Covers the SRS's two basic-flow steps
 * (schedule, complete) plus a lightweight "start" transition into
 * MaintenanceStatus.IN_PROGRESS, which the entity already modeled but had
 * no service using yet.
 *
 * Deliberately NOT built: the "urgent maintenance mid-rental flags the
 * reservation for Branch Manager review" sub-flow from the SRS — that needs
 * a real review/notification workflow of its own (who gets notified, how
 * they act on it, what happens to the in-progress rental), which is a
 * separate feature, not a corner of this one.
 *
 * Also deliberately simple: scheduling immediately pulls the vehicle out of
 * bookable inventory (sets it to MAINTENANCE), even if scheduledDate is in
 * the future. A real system would only do that once the maintenance window
 * actually starts, via a scheduled job — this project has no background
 * scheduler, so "scheduled" and "unavailable" happen together instead.
 */
@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class MaintenanceServiceImpl implements MaintenanceService {

    private final MaintenanceRecordRepository maintenanceRecordRepository;
    private final VehicleRepository vehicleRepository;
    private final VehicleService vehicleService;
    private final MaintenanceMapper maintenanceMapper;

    @Override
    @Transactional
    public MaintenanceRecordResponse scheduleMaintenance(Long vehicleId, LocalDate scheduledDate, String description) {
        Vehicle vehicle = vehicleRepository.findById(vehicleId)
                .orElseThrow(() -> new ResourceNotFoundException("Vehicle not found: " + vehicleId));

        MaintenanceRecord record = MaintenanceRecord.builder()
                .vehicle(vehicle)
                .scheduledDate(scheduledDate)
                .description(description)
                .status(MaintenanceStatus.SCHEDULED)
                .build();
        record = maintenanceRecordRepository.save(record);

        vehicleService.updateVehicleStatus(vehicleId, VehicleStatus.MAINTENANCE);

        return maintenanceMapper.toResponse(record);
    }

    @Override
    @Transactional
    public MaintenanceRecordResponse startMaintenance(Long id) {
        MaintenanceRecord record = findOrThrow(id);
        if (record.getStatus() != MaintenanceStatus.SCHEDULED) {
            throw new IllegalStateException("Only a SCHEDULED maintenance record can be started");
        }
        record.setStatus(MaintenanceStatus.IN_PROGRESS);
        return maintenanceMapper.toResponse(maintenanceRecordRepository.save(record));
    }

    @Override
    @Transactional
    public MaintenanceRecordResponse completeMaintenance(Long id, String completionNotes) {
        MaintenanceRecord record = findOrThrow(id);
        if (record.getStatus() == MaintenanceStatus.COMPLETED) {
            throw new IllegalStateException("This maintenance record is already completed");
        }

        record.setStatus(MaintenanceStatus.COMPLETED);
        record.setCompletedDate(LocalDate.now());
        if (completionNotes != null && !completionNotes.isBlank()) {
            record.setDescription(record.getDescription() + " — Completed: " + completionNotes);
        }
        record = maintenanceRecordRepository.save(record);

        vehicleService.updateVehicleStatus(record.getVehicle().getId(), VehicleStatus.AVAILABLE);

        return maintenanceMapper.toResponse(record);
    }

    @Override
    public List<MaintenanceRecordResponse> getAllMaintenanceRecords(MaintenanceStatus status, Long vehicleId) {
        List<MaintenanceRecord> records;
        if (vehicleId != null && status != null) {
            records = maintenanceRecordRepository.findByVehicleIdAndStatus(vehicleId, status);
        } else if (vehicleId != null) {
            records = maintenanceRecordRepository.findByVehicleId(vehicleId);
        } else if (status != null) {
            records = maintenanceRecordRepository.findByStatus(status);
        } else {
            records = maintenanceRecordRepository.findAll();
        }
        return maintenanceMapper.toResponseList(records);
    }

    private MaintenanceRecord findOrThrow(Long id) {
        return maintenanceRecordRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Maintenance record not found: " + id));
    }
}
