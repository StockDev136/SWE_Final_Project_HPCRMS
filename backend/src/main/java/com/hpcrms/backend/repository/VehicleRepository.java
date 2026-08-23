package com.hpcrms.backend.repository;

import com.hpcrms.backend.entity.Vehicle;
import com.hpcrms.backend.entity.enums.ReservationStatus;
import com.hpcrms.backend.entity.enums.VehicleCategory;
import com.hpcrms.backend.entity.enums.VehicleStatus;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.time.LocalDate;
import java.util.List;
import java.util.Optional;

public interface VehicleRepository extends JpaRepository<Vehicle, Long> {
    Optional<Vehicle> findByLicensePlate(String licensePlate);

    List<Vehicle> findByBranchIdAndCategoryAndStatus(
            Long branchId, VehicleCategory category, VehicleStatus status);

    List<Vehicle> findByBranchId(Long branchId);

    List<Vehicle> findByStatus(VehicleStatus status);

    /**
     * A vehicle is available for a period if it isn't disabled (MAINTENANCE /
     * UNAVAILABLE) and has no reservation whose dates overlap the requested
     * period. This checks actual date-range availability, not just the
     * vehicle's current status — a vehicle rented out today can still be free
     * next month, and a currently-idle vehicle can already be booked for the
     * dates being searched.
     *
     * Deliberately date-inclusive (<=, >=) rather than strict — search has no
     * time-of-day input, so a vehicle already booked anywhere on the search's
     * start/end date is conservatively treated as unavailable that day, even
     * though the exact minute-level slot might actually be free. The precise,
     * time-aware check happens at actual reservation creation.
     */
    @Query("""
            SELECT v FROM Vehicle v
            WHERE v.branch.id = :branchId
            AND (:category IS NULL OR v.category = :category)
            AND v.status NOT IN :disabledStatuses
            AND v NOT IN (
                SELECT r.vehicle FROM Reservation r
                WHERE r.vehicle IS NOT NULL
                AND r.status IN :blockingStatuses
                AND r.startDate <= :endDate
                AND r.endDate >= :startDate
            )
            """)
    List<Vehicle> findAvailableForPeriod(
            @Param("branchId") Long branchId,
            @Param("category") VehicleCategory category,
            @Param("startDate") LocalDate startDate,
            @Param("endDate") LocalDate endDate,
            @Param("disabledStatuses") List<VehicleStatus> disabledStatuses,
            @Param("blockingStatuses") List<ReservationStatus> blockingStatuses);
}
