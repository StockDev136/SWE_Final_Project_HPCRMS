package com.hpcrms.backend.service.impl;

import com.hpcrms.backend.dto.response.BranchPerformanceResponse;
import com.hpcrms.backend.dto.response.RevenueReportResponse;
import com.hpcrms.backend.dto.response.UtilizationReportResponse;
import com.hpcrms.backend.entity.enums.VehicleCategory;
import com.hpcrms.backend.repository.BranchRepository;
import com.hpcrms.backend.repository.PaymentRepository;
import com.hpcrms.backend.repository.ReservationRepository;
import com.hpcrms.backend.repository.VehicleRepository;
import com.hpcrms.backend.service.ReportService;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.LocalTime;
import java.util.ArrayList;
import java.util.EnumMap;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

/**
 * UC-10: Generate Reports and Analytics. Deliberately does NOT include
 * demand forecasting from the original SRS scope — that requires genuine
 * predictive modeling, and a naive average-of-past-data stand-in would be a
 * misleading thing to present as "forecasting." Utilization, revenue, and
 * branch performance are all computed from real, current data.
 */
@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class ReportServiceImpl implements ReportService {

    private final ReservationRepository reservationRepository;
    private final PaymentRepository paymentRepository;
    private final VehicleRepository vehicleRepository;
    private final BranchRepository branchRepository;

    @Override
    public UtilizationReportResponse getUtilizationReport() {
        long totalVehicles = vehicleRepository.count();
        long activeRentals = reservationRepository.countActiveRentals();

        Map<VehicleCategory, Long> vehiclesByCategory = new EnumMap<>(VehicleCategory.class);
        for (Object[] row : vehicleRepository.countVehiclesByCategory()) {
            vehiclesByCategory.put((VehicleCategory) row[0], (Long) row[1]);
        }
        Map<VehicleCategory, Long> activeByCategory = new EnumMap<>(VehicleCategory.class);
        for (Object[] row : reservationRepository.countActiveRentalsByCategory()) {
            activeByCategory.put((VehicleCategory) row[0], (Long) row[1]);
        }

        List<UtilizationReportResponse.CategoryUtilization> byCategory = new ArrayList<>();
        for (VehicleCategory category : VehicleCategory.values()) {
            long catTotal = vehiclesByCategory.getOrDefault(category, 0L);
            long catActive = activeByCategory.getOrDefault(category, 0L);
            byCategory.add(UtilizationReportResponse.CategoryUtilization.builder()
                    .category(category.name())
                    .totalVehicles((int) catTotal)
                    .activeRentals((int) catActive)
                    .utilizationRate(catTotal == 0 ? 0.0 : (double) catActive / catTotal)
                    .build());
        }

        return UtilizationReportResponse.builder()
                .totalVehicles((int) totalVehicles)
                .activeRentals((int) activeRentals)
                .utilizationRate(totalVehicles == 0 ? 0.0 : (double) activeRentals / totalVehicles)
                .byCategory(byCategory)
                .build();
    }

    @Override
    public RevenueReportResponse getRevenueReport(LocalDate startDate, LocalDate endDate) {
        LocalDateTime start = startDate.atStartOfDay();
        LocalDateTime end = endDate.atTime(LocalTime.MAX);

        List<Object[]> summaryRows = paymentRepository.getRevenueSummary(start, end);
        Object[] summary = summaryRows.isEmpty() ? new Object[]{BigDecimal.ZERO, 0L} : summaryRows.get(0);
        BigDecimal total = (BigDecimal) summary[0];
        long count = (Long) summary[1];

        BigDecimal average = count == 0
                ? BigDecimal.ZERO
                : total.divide(BigDecimal.valueOf(count), 2, RoundingMode.HALF_UP);

        return RevenueReportResponse.builder()
                .startDate(startDate)
                .endDate(endDate)
                .totalRevenue(total)
                .paymentCount(count)
                .averagePaymentAmount(average)
                .build();
    }

    @Override
    public List<BranchPerformanceResponse> getBranchPerformanceReport(LocalDate startDate, LocalDate endDate) {
        LocalDateTime start = startDate.atStartOfDay();
        LocalDateTime end = endDate.atTime(LocalTime.MAX);

        Map<Long, Long> reservationCounts = new HashMap<>();
        Map<Long, String> branchNames = new HashMap<>();
        for (Object[] row : reservationRepository.countReservationsByBranch(start, end)) {
            Long branchId = (Long) row[0];
            branchNames.put(branchId, (String) row[1]);
            reservationCounts.put(branchId, (Long) row[2]);
        }

        Map<Long, Long> cancelledCounts = new HashMap<>();
        for (Object[] row : reservationRepository.countCancelledReservationsByBranch(start, end)) {
            cancelledCounts.put((Long) row[0], (Long) row[1]);
        }

        Map<Long, BigDecimal> revenueByBranch = new HashMap<>();
        for (Object[] row : paymentRepository.getRevenueByBranch(start, end)) {
            revenueByBranch.put((Long) row[0], (BigDecimal) row[1]);
        }

        List<BranchPerformanceResponse> results = new ArrayList<>();
        branchRepository.findAll().forEach(branch -> results.add(
                BranchPerformanceResponse.builder()
                        .branchId(branch.getId())
                        .branchName(branch.getName())
                        .reservationCount(reservationCounts.getOrDefault(branch.getId(), 0L))
                        .cancelledCount(cancelledCounts.getOrDefault(branch.getId(), 0L))
                        .revenue(revenueByBranch.getOrDefault(branch.getId(), BigDecimal.ZERO))
                        .build()));
        return results;
    }
}
