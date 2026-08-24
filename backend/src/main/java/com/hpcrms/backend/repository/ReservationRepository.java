package com.hpcrms.backend.repository;

import com.hpcrms.backend.entity.Reservation;
import com.hpcrms.backend.entity.enums.ReservationStatus;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.time.LocalDate;
import java.util.List;
import java.util.Optional;

public interface ReservationRepository extends JpaRepository<Reservation, Long> {
    List<Reservation> findByCustomerId(Long customerId);
    List<Reservation> findByStatus(ReservationStatus status);
    List<Reservation> findByVehicleIdAndStatus(Long vehicleId, ReservationStatus status);
    Optional<Reservation> findByPickupCode(String pickupCode);

    /**
     * Fetches reservations whose DATE range could possibly overlap the given
     * period — deliberately broad/inclusive (<=, >=) so same-day bookings on
     * shared boundary dates aren't missed. The service layer then checks
     * genuine minute-level overlap using each reservation's actual pickup/
     * return times, which this date-only query can't determine on its own
     * (two reservations both dated "today" don't conflict if one returns at
     * 9am and the other picks up at 3pm).
     */
    @Query("""
            SELECT r FROM Reservation r
            WHERE r.vehicle.id = :vehicleId
            AND r.status IN :blockingStatuses
            AND r.startDate <= :endDate
            AND r.endDate >= :startDate
            AND (:excludeReservationId IS NULL OR r.id <> :excludeReservationId)
            """)
    List<Reservation> findCandidateOverlaps(
            @Param("vehicleId") Long vehicleId,
            @Param("startDate") LocalDate startDate,
            @Param("endDate") LocalDate endDate,
            @Param("blockingStatuses") List<ReservationStatus> blockingStatuses,
            @Param("excludeReservationId") Long excludeReservationId);

    /**
     * Same broad date-range candidate fetch as findCandidateOverlaps, but
     * scoped to a CUSTOMER rather than a vehicle — used to stop one customer
     * from holding multiple overlapping reservations (regardless of which
     * vehicle each one is for). Different vehicles at the same branch for
     * the same dates is normal and fine; the same customer holding several
     * simultaneous bookings for one trip generally isn't.
     */
    @Query("""
            SELECT r FROM Reservation r
            WHERE r.customer.id = :customerId
            AND r.status IN :blockingStatuses
            AND r.startDate <= :endDate
            AND r.endDate >= :startDate
            AND (:excludeReservationId IS NULL OR r.id <> :excludeReservationId)
            """)
    List<Reservation> findCandidateOverlapsForCustomer(
            @Param("customerId") Long customerId,
            @Param("startDate") LocalDate startDate,
            @Param("endDate") LocalDate endDate,
            @Param("blockingStatuses") List<ReservationStatus> blockingStatuses,
            @Param("excludeReservationId") Long excludeReservationId);

    /**
     * Staff-facing view — unlike findByCustomerId (used for a customer's own
     * "/me" list), this lets Rental Agents and managers browse every
     * reservation, optionally narrowed to a status (e.g. current/active) or
     * a branch, which was previously not possible at all for staff.
     */
    @Query("""
            SELECT r FROM Reservation r
            WHERE (:status IS NULL OR r.status = :status)
            AND (:branchId IS NULL OR r.pickupBranch.id = :branchId)
            ORDER BY r.id DESC
            """)
    List<Reservation> findAllForStaff(
            @Param("status") ReservationStatus status,
            @Param("branchId") Long branchId);

    /** UC-10 utilization report — how many vehicles are out right now. */
    @Query("SELECT COUNT(r) FROM Reservation r WHERE r.status = com.hpcrms.backend.entity.enums.ReservationStatus.ACTIVE_RENTAL")
    long countActiveRentals();

    @Query("""
            SELECT r.vehicle.category, COUNT(r)
            FROM Reservation r
            WHERE r.status = com.hpcrms.backend.entity.enums.ReservationStatus.ACTIVE_RENTAL
            GROUP BY r.vehicle.category
            """)
    List<Object[]> countActiveRentalsByCategory();

    /**
     * UC-10 branch performance report — reservation volume per branch over a
     * date range. Deliberately excludes CANCELLED reservations: counting
     * those as "performance" is misleading, since a cancelled reservation
     * never became real business — a branch with a high cancellation rate
     * would look artificially strong instead of flagging a real problem.
     */
    @Query("""
            SELECT r.pickupBranch.id, r.pickupBranch.name, COUNT(r)
            FROM Reservation r
            WHERE r.createdAt BETWEEN :start AND :end
            AND r.status <> com.hpcrms.backend.entity.enums.ReservationStatus.CANCELLED
            GROUP BY r.pickupBranch.id, r.pickupBranch.name
            """)
    List<Object[]> countReservationsByBranch(
            @Param("start") java.time.LocalDateTime start,
            @Param("end") java.time.LocalDateTime end);

    /**
     * Companion to countReservationsByBranch — cancelled counts are excluded
     * from "performance" but not hidden entirely. A branch with a high
     * cancellation rate relative to its real reservation count is itself a
     * meaningful signal worth surfacing, not burying.
     */
    @Query("""
            SELECT r.pickupBranch.id, COUNT(r)
            FROM Reservation r
            WHERE r.createdAt BETWEEN :start AND :end
            AND r.status = com.hpcrms.backend.entity.enums.ReservationStatus.CANCELLED
            GROUP BY r.pickupBranch.id
            """)
    List<Object[]> countCancelledReservationsByBranch(
            @Param("start") java.time.LocalDateTime start,
            @Param("end") java.time.LocalDateTime end);
}
