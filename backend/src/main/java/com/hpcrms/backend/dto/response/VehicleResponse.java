package com.hpcrms.backend.dto.response;

import com.hpcrms.backend.entity.enums.VehicleCategory;
import com.hpcrms.backend.entity.enums.VehicleStatus;
import lombok.*;

import java.math.BigDecimal;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class VehicleResponse {
    private Long id;
    private String licensePlate;
    private String make;
    private String model;
    private VehicleCategory category;
    private String branchName;
    private BigDecimal dailyRate;
    private VehicleStatus status;
    private int mileage;
    private String imageUrl;
    private String parkingStall;
}
