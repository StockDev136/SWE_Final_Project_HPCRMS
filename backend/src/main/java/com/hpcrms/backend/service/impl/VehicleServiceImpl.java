package com.hpcrms.backend.service.impl;

import com.hpcrms.backend.dto.response.VehicleResponse;
import com.hpcrms.backend.entity.Branch;
import com.hpcrms.backend.entity.Vehicle;
import com.hpcrms.backend.entity.enums.ReservationStatus;
import com.hpcrms.backend.entity.enums.VehicleCategory;
import com.hpcrms.backend.entity.enums.VehicleStatus;
import com.hpcrms.backend.exception.ResourceNotFoundException;
import com.hpcrms.backend.mapper.VehicleMapper;
import com.hpcrms.backend.repository.BranchRepository;
import com.hpcrms.backend.repository.VehicleRepository;
import com.hpcrms.backend.service.VehicleService;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.util.List;

@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class VehicleServiceImpl implements VehicleService {

    private static final List<VehicleStatus> DISABLED_STATUSES =
            List.of(VehicleStatus.MAINTENANCE, VehicleStatus.UNAVAILABLE);

    private static final List<ReservationStatus> BLOCKING_RESERVATION_STATUSES =
            List.of(ReservationStatus.PENDING, ReservationStatus.READY_FOR_PICKUP, ReservationStatus.ACTIVE_RENTAL);

    private final VehicleRepository vehicleRepository;
    private final BranchRepository branchRepository;
    private final VehicleMapper vehicleMapper;

    @Override
    public List<VehicleResponse> searchAvailableVehicles(Long branchId, VehicleCategory category,
                                                           LocalDate startDate, LocalDate endDate) {
        if (endDate.isBefore(startDate)) {
            throw new IllegalArgumentException("endDate cannot be before startDate");
        }
        List<Vehicle> vehicles = vehicleRepository.findAvailableForPeriod(
                branchId, category, startDate, endDate, DISABLED_STATUSES, BLOCKING_RESERVATION_STATUSES);
        return vehicleMapper.toResponseList(vehicles);
    }

    @Override
    public List<VehicleResponse> getAllVehicles(Long branchId) {
        List<Vehicle> vehicles = branchId != null
                ? vehicleRepository.findByBranchId(branchId)
                : vehicleRepository.findAll();
        return vehicleMapper.toResponseList(vehicles);
    }

    @Override
    public VehicleResponse getVehicleById(Long id) {
        return vehicleMapper.toResponse(findVehicleOrThrow(id));
    }

    @Override
    @Transactional
    public VehicleResponse createVehicle(Vehicle vehicle) {
        Branch branch = branchRepository.findById(vehicle.getBranch().getId())
                .orElseThrow(() -> new ResourceNotFoundException("Branch not found: " + vehicle.getBranch().getId()));
        vehicle.setBranch(branch);
        return vehicleMapper.toResponse(vehicleRepository.save(vehicle));
    }

    @Override
    @Transactional
    public VehicleResponse updateVehicle(Long id, Vehicle updates) {
        Vehicle vehicle = findVehicleOrThrow(id);
        vehicle.setMake(updates.getMake());
        vehicle.setModel(updates.getModel());
        vehicle.setCategory(updates.getCategory());
        if (updates.getBranch() != null) {
            Branch branch = branchRepository.findById(updates.getBranch().getId())
                    .orElseThrow(() -> new ResourceNotFoundException("Branch not found: " + updates.getBranch().getId()));
            vehicle.setBranch(branch);
        }
        vehicle.setDailyRate(updates.getDailyRate());
        vehicle.setMileage(updates.getMileage());
        vehicle.setImageUrl(updates.getImageUrl());
        return vehicleMapper.toResponse(vehicleRepository.save(vehicle));
    }

    @Override
    @Transactional
    public VehicleResponse updateVehicleStatus(Long id, VehicleStatus status) {
        Vehicle vehicle = findVehicleOrThrow(id);
        vehicle.setStatus(status);
        return vehicleMapper.toResponse(vehicleRepository.save(vehicle));
    }

    private Vehicle findVehicleOrThrow(Long id) {
        return vehicleRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Vehicle not found: " + id));
    }
}
