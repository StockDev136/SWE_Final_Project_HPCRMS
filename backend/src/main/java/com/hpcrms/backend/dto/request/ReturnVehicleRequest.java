package com.hpcrms.backend.dto.request;

import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotNull;
import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class ReturnVehicleRequest {

    @NotNull
    private Long reservationId;

    @NotNull
    @Min(0)
    private Integer mileage;

    @NotNull
    @Min(0)
    private Integer fuelLevel;

    private String conditionNotes;

    /**
     * Only relevant when the vehicle is returned before the reservation's
     * scheduled end date. false (default): early return is the customer's
     * choice — full reserved amount is still charged, no discount for unused
     * days. true: the vehicle itself was the reason for the early return
     * (mechanical/safety issue) — the customer is only charged for days
     * actually used.
     */
    private boolean vehicleIssue;
}
