package com.hpcrms.backend.dto.request;

import com.hpcrms.backend.entity.enums.VehicleStatus;
import jakarta.validation.constraints.NotNull;
import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class UpdateVehicleStatusRequest {

    @NotNull
    private VehicleStatus status;
}
