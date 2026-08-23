package com.hpcrms.backend.dto.request;

import jakarta.validation.constraints.NotBlank;
import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class PickupRequest {

    @NotBlank
    private String pickupCode;
}
