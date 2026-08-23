package com.hpcrms.backend.dto.request;

import jakarta.validation.constraints.NotNull;
import lombok.Getter;
import lombok.Setter;

import java.time.LocalDate;
import java.time.LocalTime;

@Getter
@Setter
public class CreateReservationRequest {

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

    /** Optional — omit if the vehicle is returned to the pickup branch. */
    private Long dropoffBranchId;
}
