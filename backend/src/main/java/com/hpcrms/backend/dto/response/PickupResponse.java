package com.hpcrms.backend.dto.response;

import com.hpcrms.backend.entity.enums.ReservationStatus;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class PickupResponse {
    private Long reservationId;
    private ReservationStatus status;
    private String vehicleLicensePlate;
    private String vehicleMake;
    private String vehicleModel;
    private String pickupBranchName;
    private String pickupBranchAddress;
    private Double currentLatitude;
    private Double currentLongitude;
    private String instructions;
}
