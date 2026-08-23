import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { getBranches } from "../api/branches";
import { getAllReservations } from "../api/reservations";
import { getErrorMessage } from "../api/errors";
import StatusBadge from "../components/StatusBadge";
import type { BranchResponse, ReservationResponse, ReservationStatus } from "../types";

const STATUSES: ReservationStatus[] = [
  "PENDING",
  "READY_FOR_PICKUP",
  "ACTIVE_RENTAL",
  "COMPLETED",
  "CANCELLED",
];

export default function StaffReservationsPage() {
  const navigate = useNavigate();
  const [branches, setBranches] = useState<BranchResponse[]>([]);
  const [statusFilter, setStatusFilter] = useState<ReservationStatus | "ALL">("ALL");
  const [branchFilter, setBranchFilter] = useState<number | "">("");
  const [reservations, setReservations] = useState<ReservationResponse[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  async function load(status: ReservationStatus | "ALL", branchId: number | "") {
    setLoading(true);
    setError("");
    try {
      const data = await getAllReservations(
        status === "ALL" ? undefined : status,
        branchId === "" ? undefined : branchId
      );
      setReservations(data);
    } catch (err) {
      setError(getErrorMessage(err, "Could not load reservations"));
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    getBranches().then(setBranches);
    load("ALL", "");
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function handleStatusChange(value: string) {
    const status = value as ReservationStatus | "ALL";
    setStatusFilter(status);
    load(status, branchFilter);
  }

  function handleBranchChange(value: string) {
    const id = value === "" ? "" : Number(value);
    setBranchFilter(id);
    load(statusFilter, id);
  }

  return (
    <div>
      <h1 className="text-2xl font-bold text-[#122A4D] mb-1">All Reservations</h1>
      <p className="text-slate-500 text-sm mb-6">
        Every reservation across the system — filter to find current or active rentals.
      </p>

      <div className="flex flex-wrap gap-4 mb-4">
        <div>
          <label className="block text-xs font-medium text-slate-700 mb-1">Status</label>
          <select
            value={statusFilter}
            onChange={(e) => handleStatusChange(e.target.value)}
            className="rounded-md border border-slate-300 px-3 py-2 text-sm min-w-[180px]"
          >
            <option value="ALL">All statuses</option>
            {STATUSES.map((s) => (
              <option key={s} value={s}>
                {s.replace(/_/g, " ")}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className="block text-xs font-medium text-slate-700 mb-1">Branch</label>
          <select
            value={branchFilter}
            onChange={(e) => handleBranchChange(e.target.value)}
            className="rounded-md border border-slate-300 px-3 py-2 text-sm min-w-[200px]"
          >
            <option value="">All branches</option>
            {branches.map((b) => (
              <option key={b.id} value={b.id}>
                {b.name}
              </option>
            ))}
          </select>
        </div>
      </div>

      {error && (
        <div className="mb-4 text-sm text-red-700 bg-red-50 border border-red-200 rounded-md px-3 py-2">
          {error}
        </div>
      )}

      {loading ? (
        <p className="text-slate-500">Loading reservations…</p>
      ) : (
        <div className="bg-white rounded-xl shadow-sm overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-slate-50 text-slate-500 text-xs uppercase">
              <tr>
                <th className="text-left px-4 py-3">#</th>
                <th className="text-left px-4 py-3">Customer</th>
                <th className="text-left px-4 py-3">Vehicle</th>
                <th className="text-left px-4 py-3">Branch</th>
                <th className="text-left px-4 py-3">Dates</th>
                <th className="text-left px-4 py-3">Paid</th>
                <th className="text-left px-4 py-3">Status</th>
              </tr>
            </thead>
            <tbody>
              {reservations.map((r) => (
                <tr
                  key={r.id}
                  onClick={() => navigate(`/staff/reservations/${r.id}`)}
                  className="border-t border-slate-100 hover:bg-slate-50 cursor-pointer transition"
                >
                  <td className="px-4 py-3 text-xs text-slate-400">#{r.id}</td>
                  <td className="px-4 py-3 font-semibold text-[#122A4D]">{r.customerName}</td>
                  <td className="px-4 py-3">
                    {r.vehicle ? `${r.vehicle.make} ${r.vehicle.model}` : "—"}
                  </td>
                  <td className="px-4 py-3">{r.pickupBranchName}</td>
                  <td className="px-4 py-3 text-xs">
                    {r.startDate} → {r.endDate}
                  </td>
                  <td className="px-4 py-3">
                    {r.paid ? (
                      <span className="text-emerald-600 font-semibold text-xs">Paid</span>
                    ) : (
                      <span className="text-slate-400 text-xs">Unpaid</span>
                    )}
                  </td>
                  <td className="px-4 py-3">
                    <StatusBadge status={r.status} />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {reservations.length === 0 && (
            <p className="text-slate-500 text-sm px-4 py-6 text-center">No reservations found.</p>
          )}
        </div>
      )}
    </div>
  );
}
