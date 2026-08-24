import apiClient from "./client";

export interface CategoryUtilization {
  category: string;
  totalVehicles: number;
  activeRentals: number;
  utilizationRate: number;
}
export interface UtilizationReport {
  totalVehicles: number;
  activeRentals: number;
  utilizationRate: number;
  byCategory: CategoryUtilization[];
}
export async function getUtilizationReport(): Promise<UtilizationReport> {
  const response = await apiClient.get<UtilizationReport>("/reports/utilization");
  return response.data;
}

export interface RevenueReport {
  startDate: string;
  endDate: string;
  totalRevenue: number;
  paymentCount: number;
  averagePaymentAmount: number;
}
export async function getRevenueReport(startDate: string, endDate: string): Promise<RevenueReport> {
  const response = await apiClient.get<RevenueReport>("/reports/revenue", { params: { startDate, endDate } });
  return response.data;
}

export interface BranchPerformance {
  branchId: number;
  branchName: string;
  reservationCount: number;
  cancelledCount: number;
  revenue: number;
}
export async function getBranchPerformanceReport(
  startDate: string,
  endDate: string
): Promise<BranchPerformance[]> {
  const response = await apiClient.get<BranchPerformance[]>("/reports/branch-performance", {
    params: { startDate, endDate },
  });
  return response.data;
}

type ReportKind = "utilization" | "revenue" | "branch-performance";

/**
 * Report exports require the auth header, so a plain <a href> or
 * window.open() won't work — the browser wouldn't attach the Bearer token.
 * Fetching as a blob through the same authenticated axios client and
 * triggering the download client-side is the correct pattern here.
 */
export async function downloadReportCsv(
  report: ReportKind,
  filename: string,
  startDate?: string,
  endDate?: string
): Promise<void> {
  const params: Record<string, string> = {};
  if (startDate) params.startDate = startDate;
  if (endDate) params.endDate = endDate;

  const response = await apiClient.get(`/reports/${report}/export`, {
    params,
    responseType: "blob",
  });
  const url = window.URL.createObjectURL(new Blob([response.data]));
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  link.remove();
  window.URL.revokeObjectURL(url);
}
