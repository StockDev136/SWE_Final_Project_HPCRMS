package com.hpcrms.backend.dto.request;

import jakarta.validation.constraints.AssertTrue;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Pattern;
import lombok.Getter;
import lombok.Setter;

import java.time.LocalDate;

@Getter
@Setter
public class VerifyIdentityRequest {

    @NotNull
    private Long reservationId;

    @NotBlank
    @Pattern(regexp = "^[A-Za-z0-9]{5,20}$", message = "License number must be 5-20 alphanumeric characters")
    private String licenseNumber;

    @NotNull
    private LocalDate dateOfBirth;

    @NotNull
    private LocalDate licenseExpirationDate;

    @AssertTrue(message = "Selfie confirmation is required to verify identity")
    private boolean selfieConfirmed;
}
