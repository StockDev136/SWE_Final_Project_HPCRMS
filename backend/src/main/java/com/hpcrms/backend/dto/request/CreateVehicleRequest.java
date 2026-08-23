package com.hpcrms.backend.dto.request;

import com.hpcrms.backend.entity.enums.VehicleCategory;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Positive;
import lombok.Getter;
import lombok.Setter;

import java.math.BigDecimal;

@Getter
@Setter
public class CreateVehicleRequest {

    @NotBlank
    private String licensePlate;

    @NotBlank
    private String make;

    @NotBlank
    private String model;

    @NotNull
    private VehicleCategory category;

    @NotNull
    private Long branchId;

    @NotNull
    @Positive
    private BigDecimal dailyRate;

    private String imageUrl;
}
