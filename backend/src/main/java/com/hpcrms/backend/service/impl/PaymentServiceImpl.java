package com.hpcrms.backend.service.impl;

import com.hpcrms.backend.dto.response.PaymentResponse;
import com.hpcrms.backend.entity.Payment;
import com.hpcrms.backend.entity.Reservation;
import com.hpcrms.backend.entity.enums.PaymentMethod;
import com.hpcrms.backend.entity.enums.PaymentStatus;
import com.hpcrms.backend.entity.enums.ReservationStatus;
import com.hpcrms.backend.exception.ResourceNotFoundException;
import com.hpcrms.backend.mapper.PaymentMapper;
import com.hpcrms.backend.repository.PaymentRepository;
import com.hpcrms.backend.repository.ReservationRepository;
import com.hpcrms.backend.service.PaymentService;
import lombok.RequiredArgsConstructor;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.UUID;

@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class PaymentServiceImpl implements PaymentService {

    private final PaymentRepository paymentRepository;
    private final ReservationRepository reservationRepository;
    private final PaymentMapper paymentMapper;

    @Override
    @Transactional
    public PaymentResponse processPayment(Long reservationId, PaymentMethod method, String requesterEmail, boolean isStaff) {
        Reservation reservation = reservationRepository.findById(reservationId)
                .orElseThrow(() -> new ResourceNotFoundException("Reservation not found: " + reservationId));
        verifyOwnership(reservation, requesterEmail, isStaff);

        if (reservation.getStatus() != ReservationStatus.READY_FOR_PICKUP) {
            throw new IllegalStateException(
                    "Reservation must be checked in (READY_FOR_PICKUP) before payment, current status: " + reservation.getStatus());
        }

        String gatewayTransactionId = "TXN-" + UUID.randomUUID();

        Payment payment = Payment.builder()
                .reservation(reservation)
                .amount(reservation.getEstimatedCost())
                .method(method)
                .status(PaymentStatus.COMPLETED)
                .gatewayTransactionId(gatewayTransactionId)
                .build();
        payment = paymentRepository.save(payment);

        reservation.setPaid(true);
        reservationRepository.save(reservation);

        return paymentMapper.toResponse(payment);
    }

    @Override
    public List<PaymentResponse> getPaymentsByReservationId(Long reservationId, String requesterEmail, boolean isStaff) {
        Reservation reservation = reservationRepository.findById(reservationId)
                .orElseThrow(() -> new ResourceNotFoundException("Reservation not found: " + reservationId));
        verifyOwnership(reservation, requesterEmail, isStaff);
        return paymentMapper.toResponseList(paymentRepository.findByReservationId(reservationId));
    }

    @Override
    @Transactional
    public PaymentResponse refundPayment(Long paymentId, String requesterEmail, boolean isStaff) {
        Payment payment = paymentRepository.findById(paymentId)
                .orElseThrow(() -> new ResourceNotFoundException("Payment not found: " + paymentId));
        verifyOwnership(payment.getReservation(), requesterEmail, isStaff);

        if (payment.getStatus() != PaymentStatus.COMPLETED) {
            throw new IllegalStateException("Only a COMPLETED payment can be refunded, current status: " + payment.getStatus());
        }

        payment.setStatus(PaymentStatus.REFUNDED);
        return paymentMapper.toResponse(paymentRepository.save(payment));
    }

    private void verifyOwnership(Reservation reservation, String requesterEmail, boolean isStaff) {
        if (!isStaff && !reservation.getCustomer().getEmail().equals(requesterEmail)) {
            throw new AccessDeniedException("You do not have permission to access this reservation");
        }
    }
}
