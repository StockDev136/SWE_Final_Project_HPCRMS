package com.hpcrms.backend.repository;

import com.hpcrms.backend.entity.VehicleInspection;
import com.hpcrms.backend.entity.enums.InspectionType;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface VehicleInspectionRepository extends JpaRepository<VehicleInspection, Long> {
    List<VehicleInspection> findByReservationId(Long reservationId);
    Optional<VehicleInspection> findByReservationIdAndType(Long reservationId, InspectionType type);
}
