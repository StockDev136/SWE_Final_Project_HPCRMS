package com.hpcrms.backend.controller;

import com.hpcrms.backend.dto.request.ProcessPaymentRequest;
import com.hpcrms.backend.dto.response.PaymentResponse;
import com.hpcrms.backend.security.UserPrincipal;
import com.hpcrms.backend.service.PaymentService;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/v1/payments")
@RequiredArgsConstructor
@Tag(name = "Payments")
public class PaymentController {

    private final PaymentService paymentService;

    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    public PaymentResponse process(@AuthenticationPrincipal UserPrincipal principal,
                                    @Valid @RequestBody ProcessPaymentRequest request) {
        return paymentService.processPayment(
                request.getReservationId(), request.getMethod(), principal.getUsername(), principal.isStaff());
    }

    @GetMapping("/reservation/{reservationId}")
    public List<PaymentResponse> getByReservation(@AuthenticationPrincipal UserPrincipal principal,
                                                    @PathVariable Long reservationId) {
        return paymentService.getPaymentsByReservationId(reservationId, principal.getUsername(), principal.isStaff());
    }

    @PostMapping("/{id}/refund")
    public PaymentResponse refund(@AuthenticationPrincipal UserPrincipal principal, @PathVariable Long id) {
        return paymentService.refundPayment(id, principal.getUsername(), principal.isStaff());
    }
}
