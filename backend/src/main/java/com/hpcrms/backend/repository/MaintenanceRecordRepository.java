package com.hpcrms.backend.repository;

import com.hpcrms.backend.entity.MaintenanceRecord;
import com.hpcrms.backend.entity.enums.MaintenanceStatus;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface MaintenanceRecordRepository extends JpaRepository<MaintenanceRecord, Long> {
    List<MaintenanceRecord> findByVehicleId(Long vehicleId);
    List<MaintenanceRecord> findByStatus(MaintenanceStatus status);
    List<MaintenanceRecord> findByVehicleIdAndStatus(Long vehicleId, MaintenanceStatus status);
}
