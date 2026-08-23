import { useEffect, useMemo, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { getBranches } from "../api/branches";
import { searchVehicles } from "../api/vehicles";
import { getErrorMessage } from "../api/errors";
import { defaultImageForCategory } from "../utils/vehicleImages";
import type { BranchResponse, VehicleCategory, VehicleResponse } from "../types";

const CATEGORIES: VehicleCategory[] = [
  "ECONOMY",
  "COMPACT",
  "SEDAN",
  "SUV",
  "TRUCK",
  "LUXURY",
  "VAN",
];

const DISPLAY_OPTIONS = [10, 20, 50] as const;

function todayIso(): string {
  const d = new Date();
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function nowTimeString(): string {
  const d = new Date();
  const hours = String(d.getHours()).padStart(2, "0");
  const minutes = String(d.getMinutes()).padStart(2, "0");
  return `${hours}:${minutes}`;
}

function formatDate(iso: string): string {
  return new Date(`${iso}T00:00:00`).toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

export default function VehiclesPage() {
  const location = useLocation();
  const navigate = useNavigate();

  const [branches, setBranches] = useState<BranchResponse[]>([]);
  const [branchId, setBranchId] = useState<number | "">("");
  const [startDate, setStartDate] = useState(todayIso());
  const [endDate, setEndDate] = useState("");
  const [pickupTime, setPickupTime] = useState("10:00");
  const [returnTime, setReturnTime] = useState("10:00");
  const [dropoffBranchId, setDropoffBranchId] = useState<number | "">("");

  const [searched, setSearched] = useState(false);
  const [vehicles, setVehicles] = useState<VehicleResponse[]>([]);
  const [searching, setSearching] = useState(false);
  const [error, setError] = useState("");

  const [categoryFilter, setCategoryFilter] = useState<VehicleCategory | "ALL">("ALL");
  const [displayCount, setDisplayCount] = useState<number | "ALL">(10);

  useEffect(() => {
    getBranches()
      .then((data) => {
        setBranches(data);
        if (data.length > 0) setBranchId(data[0].id);
      })
      .catch(() => setError("Could not load branches"));
  }, []);

  // If we just arrived here after an auto-reservation attempt failed (e.g.
  // during the post-login "continue where you left off" flow), show the real
  // reason instead of silently dropping the user here with no explanation.
  useEffect(() => {
    const state = location.state as { pendingReservationError?: string } | null;
    if (state?.pendingReservationError) {
      setError(state.pendingReservationError);
      window.history.replaceState({}, document.title);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function handleSearch(e: React.FormEvent) {
    e.preventDefault();
    if (branchId === "" || !startDate || !endDate) return;
    if (endDate < startDate) {
      setError("Return date cannot be before pickup date");
      return;
    }
    if (endDate === startDate && returnTime <= pickupTime) {
      setError("On a same-day rental, return time must be after pickup time");
      return;
    }
    if (startDate === todayIso() && pickupTime <= nowTimeString()) {
      setError("Pickup time cannot be in the past");
      return;
    }
    setError("");
    setSearching(true);
    setSearched(false);
    setCategoryFilter("ALL");
    setDisplayCount(10);
    try {
      const results = await searchVehicles(branchId, startDate, endDate);
      setVehicles(results);
      setSearched(true);
    } catch (err) {
      setError(getErrorMessage(err, "Search failed"));
    } finally {
      setSearching(false);
    }
  }

  function handleReserve(vehicle: VehicleResponse) {
    const dropoffBranch = branches.find((b) => b.id === dropoffBranchId);
    navigate("/confirm-reservation", {
      state: {
        vehicle,
        startDate,
        endDate,
        pickupTime,
        returnTime,
        dropoffBranchId: dropoffBranchId === "" ? undefined : dropoffBranchId,
        dropoffBranchName: dropoffBranch?.name,
      },
    });
  }

  const filteredVehicles = useMemo(
    () => (categoryFilter === "ALL" ? vehicles : vehicles.filter((v) => v.category === categoryFilter)),
    [vehicles, categoryFilter]
  );

  const visibleVehicles = useMemo(
    () => (displayCount === "ALL" ? filteredVehicles : filteredVehicles.slice(0, displayCount)),
    [filteredVehicles, displayCount]
  );

  return (
    <div>
      <h1 className="text-2xl font-bold text-[#122A4D] mb-2">Search Vehicles</h1>
      <p className="text-slate-500 text-sm mb-6">
        Choose your rental dates first — only vehicles genuinely free for that whole period are shown.
      </p>

      <form onSubmit={handleSearch} className="bg-white rounded-xl shadow-sm p-5 flex flex-wrap gap-4 items-end mb-6">
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">Pickup branch</label>
          <select
            value={branchId}
            onChange={(e) => setBranchId(Number(e.target.value))}
            className="rounded-md border border-slate-300 px-3 py-2 text-sm min-w-[180px]"
          >
            {branches.map((b) => (
              <option key={b.id} value={b.id}>
                {b.name}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">Pickup date</label>
          <input
            type="date"
            required
            min={todayIso()}
            value={startDate}
            onChange={(e) => setStartDate(e.target.value)}
            className="rounded-md border border-slate-300 px-3 py-2 text-sm"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">Pickup time</label>
          <input
            type="time"
            required
            value={pickupTime}
            onChange={(e) => setPickupTime(e.target.value)}
            className="rounded-md border border-slate-300 px-3 py-2 text-sm"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">Return date</label>
          <input
            type="date"
            required
            min={startDate}
            value={endDate}
            onChange={(e) => setEndDate(e.target.value)}
            className="rounded-md border border-slate-300 px-3 py-2 text-sm"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">Return time</label>
          <input
            type="time"
            required
            value={returnTime}
            onChange={(e) => setReturnTime(e.target.value)}
            className="rounded-md border border-slate-300 px-3 py-2 text-sm"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">Drop off at</label>
          <select
            value={dropoffBranchId}
            onChange={(e) => setDropoffBranchId(e.target.value === "" ? "" : Number(e.target.value))}
            className="rounded-md border border-slate-300 px-3 py-2 text-sm min-w-[180px]"
          >
            <option value="">Same as pickup</option>
            {branches.map((b) => (
              <option key={b.id} value={b.id}>
                {b.name}
              </option>
            ))}
          </select>
        </div>
        <button
          type="submit"
          disabled={searching}
          className="bg-[#122A4D] hover:bg-[#0B1B33] text-white font-semibold px-5 py-2 rounded-md transition disabled:opacity-50"
        >
          {searching ? "Searching…" : "Search"}
        </button>
      </form>

      {error && (
        <div className="mb-4 text-sm text-red-700 bg-red-50 border border-red-200 rounded-md px-3 py-2">
          {error}
        </div>
      )}

      {searched && vehicles.length === 0 && (
        <p className="text-slate-500 text-sm">
          No vehicles are free for that branch and date range. Try different dates.
        </p>
      )}

      {searched && vehicles.length > 0 && (
        <div className="flex flex-wrap items-end justify-between gap-3 mb-4">
          <p className="text-sm text-slate-500">
            <span className="font-semibold text-[#122A4D]">{filteredVehicles.length}</span> of{" "}
            {vehicles.length} vehicle{vehicles.length !== 1 ? "s" : ""} available · {formatDate(startDate)} –{" "}
            {formatDate(endDate)}
          </p>
          <div className="flex items-end gap-3">
            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">Category</label>
              <select
                value={categoryFilter}
                onChange={(e) => setCategoryFilter(e.target.value as VehicleCategory | "ALL")}
                className="rounded-md border border-slate-300 px-3 py-1.5 text-sm"
              >
                <option value="ALL">All Categories</option>
                {CATEGORIES.map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">Show</label>
              <select
                value={displayCount}
                onChange={(e) => setDisplayCount(e.target.value === "ALL" ? "ALL" : Number(e.target.value))}
                className="rounded-md border border-slate-300 px-3 py-1.5 text-sm"
              >
                {DISPLAY_OPTIONS.map((n) => (
                  <option key={n} value={n}>
                    {n}
                  </option>
                ))}
                <option value="ALL">All</option>
              </select>
            </div>
          </div>
        </div>
      )}

      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {visibleVehicles.map((v) => (
          <div key={v.id} className="bg-white rounded-xl shadow-sm overflow-hidden">
            <img
              src={v.imageUrl || defaultImageForCategory(v.category)}
              alt={`${v.make} ${v.model}`}
              className="w-full h-36 object-cover bg-slate-100"
            />
            <div className="p-5">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-semibold uppercase tracking-wide text-[#FF6B35]">
                  {v.category}
                </span>
                <span className="text-xs text-slate-400">{v.licensePlate}</span>
              </div>
              <h3 className="font-bold text-[#122A4D] text-lg">
                {v.make} {v.model}
              </h3>
              <p className="text-sm text-slate-500 mb-1">{v.branchName}</p>
              <p className="text-sm text-slate-500 mb-4">{v.mileage.toLocaleString()} mi</p>
              <div className="flex items-center justify-between">
                <span className="text-xl font-bold text-[#122A4D]">${v.dailyRate}/day</span>
                <button
                  onClick={() => handleReserve(v)}
                  className="bg-[#FF6B35] hover:bg-[#E85320] text-white text-sm font-semibold px-4 py-2 rounded-md transition"
                >
                  Reserve
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {searched && filteredVehicles.length > visibleVehicles.length && (
        <div className="text-center mt-6">
          <button
            onClick={() =>
              setDisplayCount((prev) =>
                prev === "ALL" ? "ALL" : Math.min((prev as number) + 10, filteredVehicles.length)
              )
            }
            className="text-sm text-[#122A4D] font-semibold underline underline-offset-2"
          >
            Show 10 more ({filteredVehicles.length - visibleVehicles.length} remaining)
          </button>
        </div>
      )}
    </div>
  );
}
