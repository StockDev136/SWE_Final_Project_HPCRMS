package com.hpcrms.backend.dto.request;

import jakarta.validation.constraints.FutureOrPresent;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.Getter;
import lombok.Setter;

import java.time.LocalDate;

@Getter
@Setter
public class ScheduleMaintenanceRequest {

    @NotNull
    private Long vehicleId;

    @NotNull
    @FutureOrPresent
    private LocalDate scheduledDate;

    @NotBlank
    private String description;
}
