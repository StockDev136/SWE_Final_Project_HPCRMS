package com.hpcrms.backend.controller;

import com.hpcrms.backend.dto.response.BranchPerformanceResponse;
import com.hpcrms.backend.dto.response.RevenueReportResponse;
import com.hpcrms.backend.dto.response.UtilizationReportResponse;
import com.hpcrms.backend.service.ReportService;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDate;
import java.util.List;

@RestController
@RequestMapping("/api/v1/reports")
@RequiredArgsConstructor
@Tag(name = "Reports")
@PreAuthorize("hasAnyRole('BRANCH_MANAGER', 'FLEET_MANAGER', 'FINANCE_DEPARTMENT', 'SYSTEM_ADMINISTRATOR')")
public class ReportController {

    private final ReportService reportService;

    @GetMapping("/utilization")
    public UtilizationReportResponse getUtilization() {
        return reportService.getUtilizationReport();
    }

    @GetMapping("/utilization/export")
    public ResponseEntity<String> exportUtilization() {
        UtilizationReportResponse report = reportService.getUtilizationReport();
        StringBuilder csv = new StringBuilder("Category,Total Vehicles,Active Rentals,Utilization Rate\n");
        for (UtilizationReportResponse.CategoryUtilization row : report.getByCategory()) {
            csv.append(row.getCategory()).append(',')
                    .append(row.getTotalVehicles()).append(',')
                    .append(row.getActiveRentals()).append(',')
                    .append(String.format("%.1f%%", row.getUtilizationRate() * 100)).append('\n');
        }
        csv.append("TOTAL,").append(report.getTotalVehicles()).append(',')
                .append(report.getActiveRentals()).append(',')
                .append(String.format("%.1f%%", report.getUtilizationRate() * 100)).append('\n');
        return csvResponse(csv.toString(), "utilization-report.csv");
    }

    @GetMapping("/revenue")
    public RevenueReportResponse getRevenue(
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate startDate,
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate endDate) {
        return reportService.getRevenueReport(startDate, endDate);
    }

    @GetMapping("/revenue/export")
    public ResponseEntity<String> exportRevenue(
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate startDate,
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate endDate) {
        RevenueReportResponse report = reportService.getRevenueReport(startDate, endDate);
        String csv = "Period Start,Period End,Total Revenue,Payment Count,Average Payment\n"
                + report.getStartDate() + ',' + report.getEndDate() + ','
                + report.getTotalRevenue() + ',' + report.getPaymentCount() + ','
                + report.getAveragePaymentAmount() + '\n';
        return csvResponse(csv, "revenue-report.csv");
    }

    @GetMapping("/branch-performance")
    public List<BranchPerformanceResponse> getBranchPerformance(
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate startDate,
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate endDate) {
        return reportService.getBranchPerformanceReport(startDate, endDate);
    }

    @GetMapping("/branch-performance/export")
    public ResponseEntity<String> exportBranchPerformance(
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate startDate,
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate endDate) {
        List<BranchPerformanceResponse> data = reportService.getBranchPerformanceReport(startDate, endDate);
        StringBuilder csv = new StringBuilder("Branch,Reservations,Cancelled,Revenue\n");
        for (BranchPerformanceResponse row : data) {
            csv.append(escapeCsv(row.getBranchName())).append(',')
                    .append(row.getReservationCount()).append(',')
                    .append(row.getCancelledCount()).append(',')
                    .append(row.getRevenue()).append('\n');
        }
        return csvResponse(csv.toString(), "branch-performance-report.csv");
    }

    private ResponseEntity<String> csvResponse(String csv, String filename) {
        return ResponseEntity.ok()
                .header(HttpHeaders.CONTENT_DISPOSITION, "attachment; filename=\"" + filename + "\"")
                .contentType(MediaType.parseMediaType("text/csv"))
                .body(csv);
    }

    private String escapeCsv(String value) {
        if (value == null) return "";
        if (value.contains(",") || value.contains("\"")) {
            return "\"" + value.replace("\"", "\"\"") + "\"";
        }
        return value;
    }
}
