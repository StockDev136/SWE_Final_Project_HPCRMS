import { useEffect, useState } from "react";
import { getAllVehicles } from "../api/vehicles";
import {
  completeMaintenance,
  getMaintenanceRecords,
  scheduleMaintenance,
  startMaintenance,
  type MaintenanceRecord,
} from "../api/maintenance";
import { getErrorMessage } from "../api/errors";
import type { MaintenanceStatus, VehicleResponse } from "../types";

function todayIso(): string {
  const d = new Date();
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

const STATUS_STYLES: Record<MaintenanceStatus, string> = {
  SCHEDULED: "bg-amber-100 text-amber-800",
  IN_PROGRESS: "bg-blue-100 text-blue-800",
  COMPLETED: "bg-emerald-100 text-emerald-800",
};

export default function MaintenancePage() {
  const [vehicles, setVehicles] = useState<VehicleResponse[]>([]);
  const [records, setRecords] = useState<MaintenanceRecord[]>([]);
  const [statusFilter, setStatusFilter] = useState<MaintenanceStatus | "ALL">("ALL");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [showForm, setShowForm] = useState(false);
  const [vehicleId, setVehicleId] = useState<number | "">("");
  const [scheduledDate, setScheduledDate] = useState(todayIso());
  const [description, setDescription] = useState("");
  const [formError, setFormError] = useState("");
  const [saving, setSaving] = useState(false);

  const [actioningId, setActioningId] = useState<number | null>(null);

  async function loadRecords() {
    setLoading(true);
    setError("");
    try {
      const data = await getMaintenanceRecords(statusFilter === "ALL" ? undefined : statusFilter);
      setRecords(data.sort((a, b) => b.id - a.id));
    } catch (err) {
      setError(getErrorMessage(err, "Could not load maintenance records"));
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    getAllVehicles().then(setVehicles).catch(() => setError("Could not load vehicles"));
  }, []);

  useEffect(() => {
    loadRecords();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [statusFilter]);

  async function handleSchedule(e: React.FormEvent) {
    e.preventDefault();
    setFormError("");
    if (vehicleId === "") {
      setFormError("Select a vehicle");
      return;
    }
    setSaving(true);
    try {
      await scheduleMaintenance({ vehicleId, scheduledDate, description });
      setShowForm(false);
      setVehicleId("");
      setScheduledDate(todayIso());
      setDescription("");
      await loadRecords();
    } catch (err) {
      setFormError(getErrorMessage(err, "Could not schedule maintenance"));
    } finally {
      setSaving(false);
    }
  }

  async function handleStart(id: number) {
    setActioningId(id);
    setError("");
    try {
      await startMaintenance(id);
      await loadRecords();
    } catch (err) {
      setError(getErrorMessage(err, "Could not start maintenance"));
    } finally {
      setActioningId(null);
    }
  }

  async function handleComplete(id: number) {
    setActioningId(id);
    setError("");
    try {
      await completeMaintenance(id);
      await loadRecords();
    } catch (err) {
      setError(getErrorMessage(err, "Could not complete maintenance"));
    } finally {
      setActioningId(null);
    }
  }

  return (
    <div>
      <div className="flex items-start justify-between flex-wrap gap-3 mb-6">
        <div>
          <h1 className="text-2xl font-bold text-[#122A4D] mb-1">Vehicle Maintenance</h1>
          <p className="text-slate-500 text-sm">
            Scheduling a vehicle for service pulls it out of bookable inventory until completed.
          </p>
        </div>
        <button
          onClick={() => setShowForm((v) => !v)}
          className="bg-[#122A4D] hover:bg-[#0B1B33] text-white font-semibold px-4 py-2 rounded-md transition text-sm"
        >
          {showForm ? "Cancel" : "+ Schedule Maintenance"}
        </button>
      </div>

      {showForm && (
        <form onSubmit={handleSchedule} className="bg-white rounded-xl shadow-sm p-5 mb-6 space-y-4">
          {formError && (
            <div className="text-sm text-red-700 bg-red-50 border border-red-200 rounded-md px-3 py-2">
              {formError}
            </div>
          )}
          <div className="grid sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">Vehicle</label>
              <select
                required
                value={vehicleId}
                onChange={(e) => setVehicleId(e.target.value === "" ? "" : Number(e.target.value))}
                className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm"
              >
                <option value="">Select a vehicle</option>
                {vehicles.map((v) => (
                  <option key={v.id} value={v.id}>
                    {v.make} {v.model} ({v.licensePlate}) — {v.status}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">Scheduled date</label>
              <input
                type="date"
                required
                min={todayIso()}
                value={scheduledDate}
                onChange={(e) => setScheduledDate(e.target.value)}
                className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm"
              />
            </div>
          </div>
          <div>
            <label className="block text-xs font-medium text-slate-700 mb-1">What needs service</label>
            <textarea
              required
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={3}
              placeholder="e.g. Oil change and brake inspection"
              className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm"
            />
          </div>
          <button
            type="submit"
            disabled={saving}
            className="bg-[#FF6B35] hover:bg-[#E85320] text-white text-sm font-semibold px-4 py-2 rounded-md transition disabled:opacity-50"
          >
            {saving ? "Scheduling…" : "Schedule Maintenance"}
          </button>
        </form>
      )}

      {error && (
        <div className="mb-4 text-sm text-red-700 bg-red-50 border border-red-200 rounded-md px-3 py-2">
          {error}
        </div>
      )}

      <div className="flex items-center gap-3 mb-4">
        <label className="text-xs font-medium text-slate-700">Status</label>
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value as MaintenanceStatus | "ALL")}
          className="rounded-md border border-slate-300 px-3 py-1.5 text-sm"
        >
          <option value="ALL">All</option>
          <option value="SCHEDULED">Scheduled</option>
          <option value="IN_PROGRESS">In Progress</option>
          <option value="COMPLETED">Completed</option>
        </select>
      </div>

      {loading ? (
        <p className="text-slate-500">Loading maintenance records…</p>
      ) : (
        <div className="bg-white rounded-xl shadow-sm overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-slate-50 text-slate-500 text-xs uppercase">
              <tr>
                <th className="text-left px-4 py-3">Vehicle</th>
                <th className="text-left px-4 py-3">Scheduled</th>
                <th className="text-left px-4 py-3">Completed</th>
                <th className="text-left px-4 py-3">Description</th>
                <th className="text-left px-4 py-3">Status</th>
                <th className="text-left px-4 py-3"></th>
              </tr>
            </thead>
            <tbody>
              {records.map((r) => (
                <tr key={r.id} className="border-t border-slate-100">
                  <td className="px-4 py-3 font-semibold text-[#122A4D]">{r.vehicleDescription}</td>
                  <td className="px-4 py-3">{r.scheduledDate}</td>
                  <td className="px-4 py-3">{r.completedDate ?? "—"}</td>
                  <td className="px-4 py-3 max-w-xs truncate" title={r.description}>
                    {r.description}
                  </td>
                  <td className="px-4 py-3">
                    <span className={`text-xs font-semibold px-2.5 py-1 rounded-full ${STATUS_STYLES[r.status]}`}>
                      {r.status.replace("_", " ")}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    {r.status === "SCHEDULED" && (
                      <button
                        onClick={() => handleStart(r.id)}
                        disabled={actioningId === r.id}
                        className="text-xs text-[#122A4D] hover:text-[#0B1B33] font-semibold disabled:opacity-50"
                      >
                        Start
                      </button>
                    )}
                    {r.status === "IN_PROGRESS" && (
                      <button
                        onClick={() => handleComplete(r.id)}
                        disabled={actioningId === r.id}
                        className="text-xs text-emerald-600 hover:text-emerald-800 font-semibold disabled:opacity-50"
                      >
                        Complete
                      </button>
                    )}
                    {r.status === "SCHEDULED" && (
                      <button
                        onClick={() => handleComplete(r.id)}
                        disabled={actioningId === r.id}
                        className="text-xs text-emerald-600 hover:text-emerald-800 font-semibold ml-3 disabled:opacity-50"
                      >
                        Complete
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {records.length === 0 && (
            <p className="text-slate-500 text-sm px-4 py-6 text-center">No maintenance records found.</p>
          )}
        </div>
      )}
    </div>
  );
}
