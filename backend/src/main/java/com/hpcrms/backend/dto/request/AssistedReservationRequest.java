package com.hpcrms.backend.dto.request;

import jakarta.validation.constraints.NotNull;
import lombok.Getter;
import lombok.Setter;

import java.time.LocalDate;
import java.time.LocalTime;

@Getter
@Setter
public class AssistedReservationRequest {

    @NotNull
    private Long customerId;

    @NotNull
    private Long vehicleId;

    @NotNull
    private LocalDate startDate;

    @NotNull
    private LocalDate endDate;

    @NotNull
    private LocalTime pickupTime;

    @NotNull
    private LocalTime returnTime;

    private Long dropoffBranchId;
}
