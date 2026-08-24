package com.hpcrms.backend.dto.response;

import lombok.*;

import java.math.BigDecimal;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class BranchPerformanceResponse {
    private Long branchId;
    private String branchName;
    private long reservationCount;
    private long cancelledCount;
    private BigDecimal revenue;
}
