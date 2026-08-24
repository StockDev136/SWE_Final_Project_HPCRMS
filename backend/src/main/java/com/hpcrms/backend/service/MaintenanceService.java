package com.hpcrms.backend.service;

import com.hpcrms.backend.dto.response.MaintenanceRecordResponse;
import com.hpcrms.backend.entity.enums.MaintenanceStatus;

import java.time.LocalDate;
import java.util.List;

public interface MaintenanceService {

    MaintenanceRecordResponse scheduleMaintenance(Long vehicleId, LocalDate scheduledDate, String description);

    MaintenanceRecordResponse startMaintenance(Long id);

    MaintenanceRecordResponse completeMaintenance(Long id, String completionNotes);

    List<MaintenanceRecordResponse> getAllMaintenanceRecords(MaintenanceStatus status, Long vehicleId);
}
