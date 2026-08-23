package com.hpcrms.backend.dto.request;

import com.hpcrms.backend.entity.enums.PaymentMethod;
import jakarta.validation.constraints.NotNull;
import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class ProcessPaymentRequest {

    @NotNull
    private Long reservationId;

    @NotNull
    private PaymentMethod method;
}
