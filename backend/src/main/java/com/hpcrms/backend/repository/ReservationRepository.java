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
}
