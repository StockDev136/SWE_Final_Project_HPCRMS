package com.hpcrms.backend.dto.response;

import lombok.*;

import java.util.List;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class UtilizationReportResponse {
    private int totalVehicles;
    private int activeRentals;
    private double utilizationRate;
    private List<CategoryUtilization> byCategory;

    @Getter
    @Setter
    @NoArgsConstructor
    @AllArgsConstructor
    @Builder
    public static class CategoryUtilization {
        private String category;
        private int totalVehicles;
        private int activeRentals;
        private double utilizationRate;
    }
}
