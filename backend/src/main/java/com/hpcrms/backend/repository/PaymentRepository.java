package com.hpcrms.backend.repository;

import com.hpcrms.backend.entity.Payment;
import com.hpcrms.backend.entity.enums.PaymentStatus;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface PaymentRepository extends JpaRepository<Payment, Long> {
    List<Payment> findByReservationId(Long reservationId);
    List<Payment> findByReservationIdAndStatus(Long reservationId, PaymentStatus status);
}
