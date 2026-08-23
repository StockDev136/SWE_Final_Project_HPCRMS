package com.hpcrms.backend.dto.response;

import com.hpcrms.backend.entity.enums.ReservationStatus;
import lombok.*;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalTime;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class ReservationResponse {
    private Long id;
    private Long customerId;
    private String customerName;
    private VehicleResponse vehicle;
    private String pickupBranchName;
    private String dropoffBranchName;
    private LocalDate startDate;
    private LocalDate endDate;
    private LocalTime pickupTime;
    private LocalTime returnTime;
    private BigDecimal estimatedCost;
    private BigDecimal finalCost;
    private ReservationStatus status;
    private boolean paid;
    private String pickupCode;
    private boolean identityVerified;
}
