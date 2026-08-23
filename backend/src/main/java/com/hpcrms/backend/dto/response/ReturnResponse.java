package com.hpcrms.backend.dto.response;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.math.BigDecimal;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class ReturnResponse {
    private Long reservationId;
    private BigDecimal finalCost;
    private String returnedToBranchName;
    private int finalMileage;
    private boolean earlyReturn;
    private boolean prorated;
}
