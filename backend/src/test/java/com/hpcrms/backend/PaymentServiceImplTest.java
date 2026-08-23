package com.hpcrms.backend.service.impl;

import com.hpcrms.backend.dto.response.PaymentResponse;
import com.hpcrms.backend.entity.Customer;
import com.hpcrms.backend.entity.Payment;
import com.hpcrms.backend.entity.Reservation;
import com.hpcrms.backend.entity.enums.PaymentMethod;
import com.hpcrms.backend.entity.enums.PaymentStatus;
import com.hpcrms.backend.entity.enums.ReservationStatus;
import com.hpcrms.backend.exception.ResourceNotFoundException;
import com.hpcrms.backend.mapper.PaymentMapper;
import com.hpcrms.backend.repository.PaymentRepository;
import com.hpcrms.backend.repository.ReservationRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.security.access.AccessDeniedException;

import java.math.BigDecimal;
import java.util.List;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

/**
 * Unit tests for the Payment use case (UC-5). Covers the READY_FOR_PICKUP
 * precondition, the amount actually charged, the ownership rule, and the
 * refund status transition.
 *
 * No location/fleet-specific fixture data is used here, so nothing needed
 * updating for the US branch/vehicle data refresh.
 */
@ExtendWith(MockitoExtension.class)
class PaymentServiceImplTest {

    @Mock
    private PaymentRepository paymentRepository;
    @Mock
    private ReservationRepository reservationRepository;
    @Mock
    private PaymentMapper paymentMapper;

    @InjectMocks
    private PaymentServiceImpl paymentService;

    private Reservation reservation;

    @BeforeEach
    void setUp() {
        Customer customer = Customer.builder().id(10L).firstName("Jane").lastName("Doe").email("jane@example.com").build();

        reservation = Reservation.builder()
                .id(1L)
                .customer(customer)
                .status(ReservationStatus.READY_FOR_PICKUP)
                .estimatedCost(new BigDecimal("135.00"))
                .build();

        lenient().when(paymentMapper.toResponse(any(Payment.class))).thenReturn(new PaymentResponse());
        lenient().when(paymentMapper.toResponseList(any())).thenReturn(List.of());
    }

    // ---------- Normal cases ----------

    @Test
    void processPayment_readyForPickupReservation_marksReservationPaid() {
        when(reservationRepository.findById(1L)).thenReturn(Optional.of(reservation));
        when(paymentRepository.save(any(Payment.class))).thenAnswer(inv -> inv.getArgument(0));

        PaymentResponse response = paymentService.processPayment(1L, PaymentMethod.CREDIT_CARD, "jane@example.com", false);

        assertNotNull(response);
        assertTrue(reservation.isPaid());
        verify(reservationRepository).save(reservation);
    }

    @Test
    void refundPayment_completedPayment_transitionsToRefunded() {
        Payment payment = Payment.builder().id(5L).reservation(reservation).status(PaymentStatus.COMPLETED).build();
        when(paymentRepository.findById(5L)).thenReturn(Optional.of(payment));
        when(paymentRepository.save(any(Payment.class))).thenAnswer(inv -> inv.getArgument(0));

        paymentService.refundPayment(5L, "agent@hpcrms.com", true);

        assertEquals(PaymentStatus.REFUNDED, payment.getStatus());
    }

    // ---------- Boundary cases ----------

    @Test
    void processPayment_chargesExactlyTheReservationsEstimatedCost() {
        when(reservationRepository.findById(1L)).thenReturn(Optional.of(reservation));
        when(paymentRepository.save(any(Payment.class))).thenAnswer(inv -> inv.getArgument(0));

        paymentService.processPayment(1L, PaymentMethod.DEBIT_CARD, "jane@example.com", false);

        ArgumentCaptor<Payment> captor = ArgumentCaptor.forClass(Payment.class);
        verify(paymentRepository).save(captor.capture());
        assertEquals(0, reservation.getEstimatedCost().compareTo(captor.getValue().getAmount()));
        assertEquals(PaymentStatus.COMPLETED, captor.getValue().getStatus());
    }

    @Test
    void getPaymentsByReservationId_noPaymentsYet_returnsEmptyListNotError() {
        when(reservationRepository.findById(1L)).thenReturn(Optional.of(reservation));
        when(paymentRepository.findByReservationId(1L)).thenReturn(List.of());

        List<PaymentResponse> result = paymentService.getPaymentsByReservationId(1L, "jane@example.com", false);

        assertNotNull(result);
        assertTrue(result.isEmpty());
    }

    // ---------- Error cases ----------

    @Test
    void processPayment_reservationNotReadyForPickup_throwsIllegalState() {
        reservation.setStatus(ReservationStatus.PENDING);
        when(reservationRepository.findById(1L)).thenReturn(Optional.of(reservation));

        assertThrows(IllegalStateException.class,
                () -> paymentService.processPayment(1L, PaymentMethod.CREDIT_CARD, "jane@example.com", false));
        verify(paymentRepository, never()).save(any());
    }

    @Test
    void processPayment_nonOwnerCustomer_throwsAccessDenied() {
        when(reservationRepository.findById(1L)).thenReturn(Optional.of(reservation));

        assertThrows(AccessDeniedException.class,
                () -> paymentService.processPayment(1L, PaymentMethod.CREDIT_CARD, "someone-else@example.com", false));
    }

    @Test
    void refundPayment_alreadyRefunded_throwsIllegalState() {
        Payment payment = Payment.builder().id(5L).reservation(reservation).status(PaymentStatus.REFUNDED).build();
        when(paymentRepository.findById(5L)).thenReturn(Optional.of(payment));

        assertThrows(IllegalStateException.class,
                () -> paymentService.refundPayment(5L, "agent@hpcrms.com", true));
        verify(paymentRepository, never()).save(any());
    }

    @Test
    void refundPayment_paymentNotFound_throwsResourceNotFound() {
        when(paymentRepository.findById(999L)).thenReturn(Optional.empty());

        assertThrows(ResourceNotFoundException.class,
                () -> paymentService.refundPayment(999L, "agent@hpcrms.com", true));
    }

    @Test
    void getPaymentsByReservationId_reservationNotFound_throwsResourceNotFound() {
        when(reservationRepository.findById(999L)).thenReturn(Optional.empty());

        assertThrows(ResourceNotFoundException.class,
                () -> paymentService.getPaymentsByReservationId(999L, "jane@example.com", false));
    }
}
