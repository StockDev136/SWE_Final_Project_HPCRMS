package com.hpcrms.backend.dto.request;

import jakarta.validation.constraints.NotNull;
import lombok.Getter;
import lombok.Setter;

import java.time.LocalDate;

@Getter
@Setter
public class ModifyReservationRequest {

    @NotNull
    private LocalDate startDate;

    @NotNull
    private LocalDate endDate;
}
