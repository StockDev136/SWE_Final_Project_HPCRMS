package com.hpcrms.backend.dto.response;

import com.hpcrms.backend.entity.enums.PaymentMethod;
import com.hpcrms.backend.entity.enums.PaymentStatus;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.math.BigDecimal;
import java.time.LocalDateTime;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class PaymentResponse {
    private Long id;
    private Long reservationId;
    private BigDecimal amount;
    private PaymentMethod method;
    private PaymentStatus status;
    private String gatewayTransactionId;
    private LocalDateTime paymentDate;
}
