package com.hpcrms.backend.repository;

import com.hpcrms.backend.entity.Payment;
import com.hpcrms.backend.entity.enums.PaymentStatus;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;

public interface PaymentRepository extends JpaRepository<Payment, Long> {
    List<Payment> findByReservationId(Long reservationId);
    List<Payment> findByReservationIdAndStatus(Long reservationId, PaymentStatus status);

    /** UC-10 revenue report — total collected and payment count over a date range. */
    @Query("""
            SELECT COALESCE(SUM(p.amount), 0), COUNT(p)
            FROM Payment p
            WHERE p.status = com.hpcrms.backend.entity.enums.PaymentStatus.COMPLETED
            AND p.paymentDate BETWEEN :start AND :end
            """)
    List<Object[]> getRevenueSummary(
            @Param("start") java.time.LocalDateTime start,
            @Param("end") java.time.LocalDateTime end);

    /** UC-10 branch performance report — revenue attributable to each branch over a date range. */
    @Query("""
            SELECT p.reservation.pickupBranch.id, COALESCE(SUM(p.amount), 0)
            FROM Payment p
            WHERE p.status = com.hpcrms.backend.entity.enums.PaymentStatus.COMPLETED
            AND p.paymentDate BETWEEN :start AND :end
            GROUP BY p.reservation.pickupBranch.id
            """)
    List<Object[]> getRevenueByBranch(
            @Param("start") java.time.LocalDateTime start,
            @Param("end") java.time.LocalDateTime end);
}
