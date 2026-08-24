import { useEffect, useState } from "react";
import {
  downloadReportCsv,
  getBranchPerformanceReport,
  getRevenueReport,
  getUtilizationReport,
  type BranchPerformance,
  type RevenueReport,
  type UtilizationReport,
} from "../api/reports";
import { getErrorMessage } from "../api/errors";

function todayIso(): string {
  const d = new Date();
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function daysAgoIso(days: number): string {
  const d = new Date();
  d.setDate(d.getDate() - days);
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function pct(rate: number): string {
  return `${(rate * 100).toFixed(1)}%`;
}

export default function ReportsPage() {
  const [startDate, setStartDate] = useState(daysAgoIso(30));
  const [endDate, setEndDate] = useState(todayIso());

  const [utilization, setUtilization] = useState<UtilizationReport | null>(null);
  const [revenue, setRevenue] = useState<RevenueReport | null>(null);
  const [branchPerformance, setBranchPerformance] = useState<BranchPerformance[]>([]);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [exportingReport, setExportingReport] = useState<string | null>(null);

  async function loadReports() {
    setLoading(true);
    setError("");
    try {
      const [utilData, revenueData, branchData] = await Promise.all([
        getUtilizationReport(),
        getRevenueReport(startDate, endDate),
        getBranchPerformanceReport(startDate, endDate),
      ]);
      setUtilization(utilData);
      setRevenue(revenueData);
      setBranchPerformance(branchData);
    } catch (err) {
      setError(getErrorMessage(err, "Could not load reports"));
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadReports();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function handleExport(report: "utilization" | "revenue" | "branch-performance", filename: string) {
    setExportingReport(report);
    try {
      await downloadReportCsv(report, filename, startDate, endDate);
    } catch (err) {
      setError(getErrorMessage(err, "Could not export report"));
    } finally {
      setExportingReport(null);
    }
  }

  return (
    <div>
      <h1 className="text-2xl font-bold text-[#122A4D] mb-1">Reports &amp; Analytics</h1>
      <p className="text-slate-500 text-sm mb-6">
        Fleet utilization, revenue, and branch performance across the system.
      </p>

      <form
        onSubmit={(e) => {
          e.preventDefault();
          loadReports();
        }}
        className="bg-white rounded-xl shadow-sm p-5 flex flex-wrap gap-4 items-end mb-6"
      >
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">From</label>
          <input
            type="date"
            required
            max={endDate}
            value={startDate}
            onChange={(e) => setStartDate(e.target.value)}
            className="rounded-md border border-slate-300 px-3 py-2 text-sm"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">To</label>
          <input
            type="date"
            required
            min={startDate}
            max={todayIso()}
            value={endDate}
            onChange={(e) => setEndDate(e.target.value)}
            className="rounded-md border border-slate-300 px-3 py-2 text-sm"
          />
        </div>
        <button
          type="submit"
          disabled={loading}
          className="bg-[#122A4D] hover:bg-[#0B1B33] text-white font-semibold px-5 py-2 rounded-md transition disabled:opacity-50"
        >
          {loading ? "Loading…" : "Update Reports"}
        </button>
      </form>

      {error && (
        <div className="mb-6 text-sm text-red-700 bg-red-50 border border-red-200 rounded-md px-3 py-2">
          {error}
        </div>
      )}

      {loading ? (
        <p className="text-slate-500">Loading reports…</p>
      ) : (
        <div className="space-y-6">
          {/* Utilization */}
          <div className="bg-white rounded-xl shadow-sm p-6">
            <div className="flex items-start justify-between flex-wrap gap-2 mb-4">
              <div>
                <h2 className="font-semibold text-[#122A4D]">Fleet Utilization</h2>
                <p className="text-xs text-slate-500">Current snapshot — not date-filtered</p>
              </div>
              <button
                onClick={() => handleExport("utilization", "utilization-report.csv")}
                disabled={exportingReport === "utilization"}
                className="text-sm text-[#122A4D] font-semibold underline underline-offset-2 disabled:opacity-50"
              >
                {exportingReport === "utilization" ? "Exporting…" : "Export CSV"}
              </button>
            </div>
            {utilization && (
              <>
                <div className="grid sm:grid-cols-3 gap-4 mb-5">
                  <div className="bg-slate-50 rounded-lg p-4">
                    <p className="text-xs text-slate-500 mb-1">Total Vehicles</p>
                    <p className="text-2xl font-bold text-[#122A4D]">{utilization.totalVehicles}</p>
                  </div>
                  <div className="bg-slate-50 rounded-lg p-4">
                    <p className="text-xs text-slate-500 mb-1">Currently Rented</p>
                    <p className="text-2xl font-bold text-[#122A4D]">{utilization.activeRentals}</p>
                  </div>
                  <div className="bg-slate-50 rounded-lg p-4">
                    <p className="text-xs text-slate-500 mb-1">Utilization Rate</p>
                    <p className="text-2xl font-bold text-[#FF6B35]">{pct(utilization.utilizationRate)}</p>
                  </div>
                </div>
                <table className="w-full text-sm">
                  <thead className="text-slate-500 text-xs uppercase border-b border-slate-100">
                    <tr>
                      <th className="text-left py-2">Category</th>
                      <th className="text-right py-2">Total</th>
                      <th className="text-right py-2">Rented</th>
                      <th className="text-right py-2">Utilization</th>
                    </tr>
                  </thead>
                  <tbody>
                    {utilization.byCategory.map((c) => (
                      <tr key={c.category} className="border-b border-slate-50">
                        <td className="py-2 font-medium text-[#122A4D]">{c.category}</td>
                        <td className="py-2 text-right">{c.totalVehicles}</td>
                        <td className="py-2 text-right">{c.activeRentals}</td>
                        <td className="py-2 text-right">{pct(c.utilizationRate)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </>
            )}
          </div>

          {/* Revenue */}
          <div className="bg-white rounded-xl shadow-sm p-6">
            <div className="flex items-start justify-between flex-wrap gap-2 mb-4">
              <div>
                <h2 className="font-semibold text-[#122A4D]">Revenue</h2>
                <p className="text-xs text-slate-500">
                  {startDate} to {endDate}
                </p>
              </div>
              <button
                onClick={() => handleExport("revenue", "revenue-report.csv")}
                disabled={exportingReport === "revenue"}
                className="text-sm text-[#122A4D] font-semibold underline underline-offset-2 disabled:opacity-50"
              >
                {exportingReport === "revenue" ? "Exporting…" : "Export CSV"}
              </button>
            </div>
            {revenue && (
              <div className="grid sm:grid-cols-3 gap-4">
                <div className="bg-slate-50 rounded-lg p-4">
                  <p className="text-xs text-slate-500 mb-1">Total Revenue</p>
                  <p className="text-2xl font-bold text-[#122A4D]">${revenue.totalRevenue}</p>
                </div>
                <div className="bg-slate-50 rounded-lg p-4">
                  <p className="text-xs text-slate-500 mb-1">Payments</p>
                  <p className="text-2xl font-bold text-[#122A4D]">{revenue.paymentCount}</p>
                </div>
                <div className="bg-slate-50 rounded-lg p-4">
                  <p className="text-xs text-slate-500 mb-1">Average Payment</p>
                  <p className="text-2xl font-bold text-[#122A4D]">${revenue.averagePaymentAmount}</p>
                </div>
              </div>
            )}
          </div>

          {/* Branch Performance */}
          <div className="bg-white rounded-xl shadow-sm p-6">
            <div className="flex items-start justify-between flex-wrap gap-2 mb-4">
              <div>
                <h2 className="font-semibold text-[#122A4D]">Branch Performance</h2>
                <p className="text-xs text-slate-500">
                  {startDate} to {endDate}
                </p>
              </div>
              <button
                onClick={() => handleExport("branch-performance", "branch-performance-report.csv")}
                disabled={exportingReport === "branch-performance"}
                className="text-sm text-[#122A4D] font-semibold underline underline-offset-2 disabled:opacity-50"
              >
                {exportingReport === "branch-performance" ? "Exporting…" : "Export CSV"}
              </button>
            </div>
            {branchPerformance.length === 0 ? (
              <p className="text-slate-500 text-sm">No reservations in this date range.</p>
            ) : (
              <table className="w-full text-sm">
                <thead className="text-slate-500 text-xs uppercase border-b border-slate-100">
                  <tr>
                    <th className="text-left py-2">Branch</th>
                    <th className="text-right py-2">Reservations</th>
                    <th className="text-right py-2">Cancelled</th>
                    <th className="text-right py-2">Revenue</th>
                  </tr>
                </thead>
                <tbody>
                  {branchPerformance.map((b) => {
                    const totalAttempts = b.reservationCount + b.cancelledCount;
                    const cancelRate = totalAttempts === 0 ? 0 : (b.cancelledCount / totalAttempts) * 100;
                    return (
                      <tr key={b.branchId} className="border-b border-slate-50">
                        <td className="py-2 font-medium text-[#122A4D]">{b.branchName}</td>
                        <td className="py-2 text-right">{b.reservationCount}</td>
                        <td className={`py-2 text-right ${cancelRate > 30 ? "text-red-600 font-semibold" : "text-slate-500"}`}>
                          {b.cancelledCount} {totalAttempts > 0 && `(${cancelRate.toFixed(0)}%)`}
                        </td>
                        <td className="py-2 text-right">${b.revenue}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
