package com.hpcrms.backend.service;

import com.hpcrms.backend.dto.response.PaymentResponse;
import com.hpcrms.backend.entity.enums.PaymentMethod;

import java.util.List;

public interface PaymentService {

    PaymentResponse processPayment(Long reservationId, PaymentMethod method, String requesterEmail, boolean isStaff);

    List<PaymentResponse> getPaymentsByReservationId(Long reservationId, String requesterEmail, boolean isStaff);

    PaymentResponse refundPayment(Long paymentId, String requesterEmail, boolean isStaff);
}
