import { useEffect, useState } from "react";
import { getBranches } from "../api/branches";
import { createVehicle, getAllVehicles, updateVehicleStatus } from "../api/vehicles";
import { getErrorMessage } from "../api/errors";
import { defaultImageForCategory } from "../utils/vehicleImages";
import type { BranchResponse, VehicleCategory, VehicleResponse, VehicleStatus } from "../types";

const CATEGORIES: VehicleCategory[] = [
  "ECONOMY",
  "COMPACT",
  "SEDAN",
  "SUV",
  "TRUCK",
  "LUXURY",
  "VAN",
];

const STATUSES: VehicleStatus[] = ["AVAILABLE", "RESERVED", "RENTED", "MAINTENANCE", "UNAVAILABLE"];

const STATUS_STYLES: Record<VehicleStatus, string> = {
  AVAILABLE: "bg-emerald-100 text-emerald-800",
  RESERVED: "bg-blue-100 text-blue-800",
  RENTED: "bg-amber-100 text-amber-800",
  MAINTENANCE: "bg-slate-200 text-slate-700",
  UNAVAILABLE: "bg-red-100 text-red-700",
};

export default function VehicleManagementPage() {
  const [branches, setBranches] = useState<BranchResponse[]>([]);
  const [branchFilter, setBranchFilter] = useState<number | "">("");
  const [vehicles, setVehicles] = useState<VehicleResponse[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [showForm, setShowForm] = useState(false);
  const [licensePlate, setLicensePlate] = useState("");
  const [make, setMake] = useState("");
  const [model, setModel] = useState("");
  const [category, setCategory] = useState<VehicleCategory>("SEDAN");
  const [formBranchId, setFormBranchId] = useState<number | "">("");
  const [dailyRate, setDailyRate] = useState("");
  const [parkingStall, setParkingStall] = useState("");
  const [formError, setFormError] = useState("");
  const [saving, setSaving] = useState(false);

  const [updatingId, setUpdatingId] = useState<number | null>(null);

  async function loadVehicles(branchId?: number) {
    setLoading(true);
    setError("");
    try {
      const data = await getAllVehicles(branchId);
      setVehicles(data);
    } catch (err) {
      setError(getErrorMessage(err, "Could not load vehicles"));
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    getBranches().then((data) => {
      setBranches(data);
      if (data.length > 0) setFormBranchId(data[0].id);
    });
    loadVehicles();
  }, []);

  function handleFilterChange(value: string) {
    const id = value === "" ? "" : Number(value);
    setBranchFilter(id);
    loadVehicles(id === "" ? undefined : id);
  }

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    if (formBranchId === "") return;
    setFormError("");
    setSaving(true);
    try {
      await createVehicle({
        licensePlate,
        make,
        model,
        category,
        branchId: formBranchId,
        dailyRate: Number(dailyRate),
        imageUrl: defaultImageForCategory(category),
        parkingStall: parkingStall.trim() || undefined,
      });
      setShowForm(false);
      setLicensePlate("");
      setMake("");
      setModel("");
      setDailyRate("");
      setParkingStall("");
      await loadVehicles(branchFilter === "" ? undefined : branchFilter);
    } catch (err) {
      setFormError(getErrorMessage(err, "Could not add vehicle"));
    } finally {
      setSaving(false);
    }
  }

  async function handleStatusChange(id: number, status: VehicleStatus) {
    setUpdatingId(id);
    setError("");
    try {
      await updateVehicleStatus(id, status);
      await loadVehicles(branchFilter === "" ? undefined : branchFilter);
    } catch (err) {
      setError(getErrorMessage(err, "Could not update vehicle status"));
    } finally {
      setUpdatingId(null);
    }
  }

  return (
    <div>
      <div className="flex items-start justify-between flex-wrap gap-3 mb-6">
        <div>
          <h1 className="text-2xl font-bold text-[#122A4D] mb-1">Fleet Management</h1>
          <p className="text-slate-500 text-sm">Browse, add, and update vehicles.</p>
        </div>
        <button
          onClick={() => setShowForm((v) => !v)}
          className="bg-[#122A4D] hover:bg-[#0B1B33] text-white font-semibold px-4 py-2 rounded-md transition text-sm"
        >
          {showForm ? "Cancel" : "+ Add Vehicle"}
        </button>
      </div>

      {showForm && (
        <form onSubmit={handleCreate} className="bg-white rounded-xl shadow-sm p-5 mb-6 space-y-4">
          {formError && (
            <div className="text-sm text-red-700 bg-red-50 border border-red-200 rounded-md px-3 py-2">
              {formError}
            </div>
          )}
          <div className="grid sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">License plate</label>
              <input
                required
                value={licensePlate}
                onChange={(e) => setLicensePlate(e.target.value)}
                className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">Daily rate ($)</label>
              <input
                type="number"
                required
                min="1"
                step="0.01"
                value={dailyRate}
                onChange={(e) => setDailyRate(e.target.value)}
                className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">Make</label>
              <input
                required
                value={make}
                onChange={(e) => setMake(e.target.value)}
                className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">Model</label>
              <input
                required
                value={model}
                onChange={(e) => setModel(e.target.value)}
                className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">Category</label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value as VehicleCategory)}
                className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm"
              >
                {CATEGORIES.map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">Branch</label>
              <select
                value={formBranchId}
                onChange={(e) => setFormBranchId(Number(e.target.value))}
                className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm"
              >
                {branches.map((b) => (
                  <option key={b.id} value={b.id}>
                    {b.name}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">
                Parking stall <span className="text-slate-400 font-normal">(optional)</span>
              </label>
              <input
                value={parkingStall}
                onChange={(e) => setParkingStall(e.target.value)}
                placeholder="e.g. A-12"
                className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm"
              />
            </div>
          </div>
          <button
            type="submit"
            disabled={saving}
            className="bg-[#FF6B35] hover:bg-[#E85320] text-white text-sm font-semibold px-4 py-2 rounded-md transition disabled:opacity-50"
          >
            {saving ? "Adding…" : "Add Vehicle"}
          </button>
        </form>
      )}

      <div className="mb-4">
        <label className="block text-xs font-medium text-slate-700 mb-1">Filter by branch</label>
        <select
          value={branchFilter}
          onChange={(e) => handleFilterChange(e.target.value)}
          className="rounded-md border border-slate-300 px-3 py-2 text-sm min-w-[220px]"
        >
          <option value="">All branches</option>
          {branches.map((b) => (
            <option key={b.id} value={b.id}>
              {b.name}
            </option>
          ))}
        </select>
      </div>

      {error && (
        <div className="mb-4 text-sm text-red-700 bg-red-50 border border-red-200 rounded-md px-3 py-2">
          {error}
        </div>
      )}

      {loading ? (
        <p className="text-slate-500">Loading fleet…</p>
      ) : (
        <div className="bg-white rounded-xl shadow-sm overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-slate-50 text-slate-500 text-xs uppercase">
              <tr>
                <th className="text-left px-4 py-3">Photo</th>
                <th className="text-left px-4 py-3">Vehicle</th>
                <th className="text-left px-4 py-3">Plate</th>
                <th className="text-left px-4 py-3">Stall</th>
                <th className="text-left px-4 py-3">Branch</th>
                <th className="text-left px-4 py-3">Rate</th>
                <th className="text-left px-4 py-3">Status</th>
              </tr>
            </thead>
            <tbody>
              {vehicles.map((v) => (
                <tr key={v.id} className="border-t border-slate-100">
                  <td className="px-4 py-3">
                    <img
                      src={v.imageUrl || defaultImageForCategory(v.category)}
                      alt={`${v.make} ${v.model}`}
                      className="w-16 h-10 object-cover rounded bg-slate-100"
                    />
                  </td>
                  <td className="px-4 py-3">
                    <div className="font-semibold text-[#122A4D]">
                      {v.make} {v.model}
                    </div>
                    <div className="text-xs text-slate-400">{v.category}</div>
                  </td>
                  <td className="px-4 py-3 font-mono text-xs">{v.licensePlate}</td>
                  <td className="px-4 py-3 text-xs">
                    {v.parkingStall ? (
                      <span className="font-semibold text-[#122A4D]">{v.parkingStall}</span>
                    ) : (
                      <span className="text-slate-400">Not set</span>
                    )}
                  </td>
                  <td className="px-4 py-3">{v.branchName}</td>
                  <td className="px-4 py-3">${v.dailyRate}/day</td>
                  <td className="px-4 py-3">
                    <select
                      value={v.status}
                      disabled={updatingId === v.id}
                      onChange={(e) => handleStatusChange(v.id, e.target.value as VehicleStatus)}
                      className={`text-xs font-semibold rounded-full px-2.5 py-1 border-0 ${STATUS_STYLES[v.status]}`}
                    >
                      {STATUSES.map((s) => (
                        <option key={s} value={s}>
                          {s}
                        </option>
                      ))}
                    </select>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {vehicles.length === 0 && (
            <p className="text-slate-500 text-sm px-4 py-6 text-center">No vehicles found.</p>
          )}
        </div>
      )}
    </div>
  );
}
