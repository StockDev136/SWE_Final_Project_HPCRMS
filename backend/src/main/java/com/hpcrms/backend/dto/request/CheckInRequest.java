package com.hpcrms.backend.dto.request;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class CheckInRequest {

    @NotNull
    private Long reservationId;

    @NotBlank
    private String signatureData;
}
