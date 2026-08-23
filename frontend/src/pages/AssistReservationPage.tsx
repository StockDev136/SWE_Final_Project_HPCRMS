import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { searchCustomers } from "../api/customers";
import { getBranches } from "../api/branches";
import { searchVehicles } from "../api/vehicles";
import { createReservationForCustomer } from "../api/reservations";
import { getErrorMessage } from "../api/errors";
import { defaultImageForCategory } from "../utils/vehicleImages";
import type { BranchResponse, CustomerResponse, VehicleResponse } from "../types";

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

export default function AssistReservationPage() {
  const navigate = useNavigate();

  // Step 1: find the customer
  const [term, setTerm] = useState("");
  const [customers, setCustomers] = useState<CustomerResponse[]>([]);
  const [searchingCustomers, setSearchingCustomers] = useState(false);
  const [customerError, setCustomerError] = useState("");
  const [selectedCustomer, setSelectedCustomer] = useState<CustomerResponse | null>(null);

  // Step 2: find a vehicle for them
  const [branches, setBranches] = useState<BranchResponse[]>([]);
  const [branchId, setBranchId] = useState<number | "">("");
  const [startDate, setStartDate] = useState(todayIso());
  const [endDate, setEndDate] = useState("");
  const [pickupTime, setPickupTime] = useState("10:00");
  const [returnTime, setReturnTime] = useState("10:00");
  const [dropoffBranchId, setDropoffBranchId] = useState<number | "">("");
  const [vehicles, setVehicles] = useState<VehicleResponse[]>([]);
  const [searched, setSearched] = useState(false);
  const [searchingVehicles, setSearchingVehicles] = useState(false);
  const [vehicleError, setVehicleError] = useState("");

  const [reservingId, setReservingId] = useState<number | null>(null);

  useEffect(() => {
    getBranches().then((data) => {
      setBranches(data);
      if (data.length > 0) setBranchId(data[0].id);
    });
  }, []);

  async function handleCustomerSearch(e: React.FormEvent) {
    e.preventDefault();
    if (!term.trim()) return;
    setCustomerError("");
    setSearchingCustomers(true);
    try {
      const results = await searchCustomers(term.trim());
      setCustomers(results);
    } catch (err) {
      setCustomerError(getErrorMessage(err, "Customer search failed"));
    } finally {
      setSearchingCustomers(false);
    }
  }

  function selectCustomer(customer: CustomerResponse) {
    setSelectedCustomer(customer);
    setVehicles([]);
    setSearched(false);
  }

  async function handleVehicleSearch(e: React.FormEvent) {
    e.preventDefault();
    if (branchId === "" || !startDate || !endDate) return;
    if (endDate < startDate) {
      setVehicleError("Return date cannot be before pickup date");
      return;
    }
    if (endDate === startDate && returnTime <= pickupTime) {
      setVehicleError("On a same-day rental, return time must be after pickup time");
      return;
    }
    if (startDate === todayIso() && pickupTime <= nowTimeString()) {
      setVehicleError("Pickup time cannot be in the past");
      return;
    }
    setVehicleError("");
    setSearchingVehicles(true);
    setSearched(false);
    try {
      const results = await searchVehicles(branchId, startDate, endDate);
      setVehicles(results);
      setSearched(true);
    } catch (err) {
      setVehicleError(getErrorMessage(err, "Search failed"));
    } finally {
      setSearchingVehicles(false);
    }
  }

  async function handleReserve(vehicle: VehicleResponse) {
    if (!selectedCustomer) return;
    setVehicleError("");
    setReservingId(vehicle.id);
    try {
      const reservation = await createReservationForCustomer({
        customerId: selectedCustomer.id,
        vehicleId: vehicle.id,
        startDate,
        endDate,
        pickupTime,
        returnTime,
        dropoffBranchId: dropoffBranchId === "" ? undefined : dropoffBranchId,
      });
      navigate(`/staff/reservations/${reservation.id}`);
    } catch (err) {
      setVehicleError(getErrorMessage(err, "Could not create reservation"));
    } finally {
      setReservingId(null);
    }
  }

  return (
    <div>
      <h1 className="text-2xl font-bold text-[#122A4D] mb-1">Assist a Customer</h1>
      <p className="text-slate-500 text-sm mb-6">
        Look up a customer and create a reservation on their behalf.
      </p>

      {/* Step 1: find customer */}
      <div className="bg-white rounded-xl shadow-sm p-5 mb-6">
        <h2 className="font-semibold text-[#122A4D] mb-3">1. Find the customer</h2>
        <form onSubmit={handleCustomerSearch} className="flex flex-wrap gap-3 items-end mb-3">
          <div className="flex-1 min-w-[220px]">
            <label className="block text-xs font-medium text-slate-700 mb-1">Name or email</label>
            <input
              value={term}
              onChange={(e) => setTerm(e.target.value)}
              placeholder="e.g. Jane Doe or jane@example.com"
              className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm"
            />
          </div>
          <button
            type="submit"
            disabled={searchingCustomers}
            className="bg-[#122A4D] hover:bg-[#0B1B33] text-white font-semibold px-5 py-2 rounded-md transition disabled:opacity-50"
          >
            {searchingCustomers ? "Searching…" : "Search"}
          </button>
        </form>

        {customerError && (
          <div className="text-sm text-red-700 bg-red-50 border border-red-200 rounded-md px-3 py-2 mb-3">
            {customerError}
          </div>
        )}

        {customers.length > 0 && (
          <div className="divide-y divide-slate-100 border border-slate-100 rounded-md">
            {customers.map((c) => (
              <button
                key={c.id}
                onClick={() => selectCustomer(c)}
                className={`w-full text-left px-4 py-2.5 text-sm hover:bg-slate-50 transition flex items-center justify-between ${
                  selectedCustomer?.id === c.id ? "bg-blue-50" : ""
                }`}
              >
                <span>
                  <span className="font-semibold text-[#122A4D]">
                    {c.firstName} {c.lastName}
                  </span>{" "}
                  <span className="text-slate-400">· {c.email}</span>
                </span>
                {selectedCustomer?.id === c.id && (
                  <span className="text-xs text-blue-700 font-semibold">Selected ✓</span>
                )}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Step 2: search + reserve vehicle */}
      {selectedCustomer && (
        <div className="bg-white rounded-xl shadow-sm p-5">
          <h2 className="font-semibold text-[#122A4D] mb-1">
            2. Reserve a vehicle for {selectedCustomer.firstName} {selectedCustomer.lastName}
          </h2>
          <p className="text-xs text-slate-400 mb-4">{selectedCustomer.email}</p>

          <form onSubmit={handleVehicleSearch} className="flex flex-wrap gap-4 items-end mb-4">
            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">Branch</label>
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
              <label className="block text-xs font-medium text-slate-700 mb-1">Pickup date</label>
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
              <label className="block text-xs font-medium text-slate-700 mb-1">Pickup time</label>
              <input
                type="time"
                required
                value={pickupTime}
                onChange={(e) => setPickupTime(e.target.value)}
                className="rounded-md border border-slate-300 px-3 py-2 text-sm"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">Return date</label>
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
              <label className="block text-xs font-medium text-slate-700 mb-1">Return time</label>
              <input
                type="time"
                required
                value={returnTime}
                onChange={(e) => setReturnTime(e.target.value)}
                className="rounded-md border border-slate-300 px-3 py-2 text-sm"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">Drop off at</label>
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
              disabled={searchingVehicles}
              className="bg-[#122A4D] hover:bg-[#0B1B33] text-white font-semibold px-5 py-2 rounded-md transition disabled:opacity-50"
            >
              {searchingVehicles ? "Searching…" : "Search Vehicles"}
            </button>
          </form>

          {vehicleError && (
            <div className="mb-4 text-sm text-red-700 bg-red-50 border border-red-200 rounded-md px-3 py-2">
              {vehicleError}
            </div>
          )}

          {searched && vehicles.length === 0 && (
            <p className="text-slate-500 text-sm">No vehicles are free for that branch and date range.</p>
          )}

          <div className="grid sm:grid-cols-2 gap-4">
            {vehicles.map((v) => (
              <div key={v.id} className="border border-slate-100 rounded-lg overflow-hidden">
                <img
                  src={v.imageUrl || defaultImageForCategory(v.category)}
                  alt={`${v.make} ${v.model}`}
                  className="w-full h-28 object-cover bg-slate-100"
                />
                <div className="p-4">
                <div className="flex items-center justify-between mb-1">
                  <span className="text-xs font-semibold uppercase tracking-wide text-[#FF6B35]">
                    {v.category}
                  </span>
                  <span className="text-xs text-slate-400">{v.licensePlate}</span>
                </div>
                <h3 className="font-bold text-[#122A4D]">
                  {v.make} {v.model}
                </h3>
                <div className="flex items-center justify-between mt-2">
                  <span className="font-bold text-[#122A4D]">${v.dailyRate}/day</span>
                  <button
                    onClick={() => handleReserve(v)}
                    disabled={reservingId === v.id}
                    className="bg-[#FF6B35] hover:bg-[#E85320] text-white text-sm font-semibold px-4 py-1.5 rounded-md transition disabled:opacity-50"
                  >
                    {reservingId === v.id ? "Reserving…" : "Reserve"}
                  </button>
                </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
