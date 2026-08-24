package com.hpcrms.backend.service;

import com.hpcrms.backend.dto.response.BranchPerformanceResponse;
import com.hpcrms.backend.dto.response.RevenueReportResponse;
import com.hpcrms.backend.dto.response.UtilizationReportResponse;

import java.time.LocalDate;
import java.util.List;

public interface ReportService {

    UtilizationReportResponse getUtilizationReport();

    RevenueReportResponse getRevenueReport(LocalDate startDate, LocalDate endDate);

    List<BranchPerformanceResponse> getBranchPerformanceReport(LocalDate startDate, LocalDate endDate);
}
