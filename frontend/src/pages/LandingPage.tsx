import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { getBranches } from "../api/branches";
import { searchVehicles } from "../api/vehicles";
import { getErrorMessage } from "../api/errors";
import { defaultImageForCategory } from "../utils/vehicleImages";
import { useAuth } from "../context/AuthContext";
import logoFullWhite from "../assets/logo-full-white.png";
import type { BranchResponse, VehicleResponse } from "../types";

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

export default function LandingPage() {
  const { user, isAuthenticated } = useAuth();
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

  useEffect(() => {
    getBranches()
      .then((data) => {
        setBranches(data);
        if (data.length > 0) setBranchId(data[0].id);
      })
      .catch(() => setError("Could not load branches"));
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

  return (
    <div className="min-h-screen bg-slate-50">
      <header className="bg-[#122A4D] text-white px-6 py-4 flex items-center justify-between flex-wrap gap-3">
        <img src={logoFullWhite} alt="HPCRMS" className="h-9 w-auto" />
        <div className="flex items-center gap-3 text-sm">
          {isAuthenticated ? (
            <button
              onClick={() => navigate(user?.role === "CUSTOMER" ? "/vehicles" : "/staff")}
              className="bg-[#FF6B35] hover:bg-[#E85320] font-semibold px-4 py-2 rounded-md transition"
            >
              Go to My Account
            </button>
          ) : (
            <>
              <Link to="/login" className="bg-white/10 hover:bg-white/20 font-semibold px-4 py-2 rounded-md transition">
                Log In
              </Link>
              <Link to="/register" className="bg-[#FF6B35] hover:bg-[#E85320] font-semibold px-4 py-2 rounded-md transition">
                Create Account
              </Link>
            </>
          )}
        </div>
      </header>

      <section className="bg-[#122A4D] text-white px-6 pt-8 pb-16 text-center">
        <h1 className="text-3xl sm:text-4xl font-bold mb-3">Find your next rental in seconds</h1>
        <p className="text-slate-300 max-w-xl mx-auto">
          Search real-time vehicle availability, reserve online, and skip the counter with a digital
          check-in and QR pickup code.
        </p>
      </section>

      <section className="px-6">
        <form
          onSubmit={handleSearch}
          className="max-w-4xl mx-auto -mt-10 bg-white rounded-xl shadow-lg p-5 flex flex-wrap gap-4 items-end"
        >
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Branch</label>
            <select
              value={branchId}
              onChange={(e) => setBranchId(Number(e.target.value))}
              className="rounded-md border border-slate-300 px-3 py-2 text-sm min-w-[200px]"
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
            className="bg-[#FF6B35] hover:bg-[#E85320] text-white font-semibold px-6 py-2 rounded-md transition disabled:opacity-50"
          >
            {searching ? "Searching…" : "Search Vehicles"}
          </button>
        </form>
      </section>

      <section className="px-6 py-10 max-w-5xl mx-auto">
        {error && (
          <div className="mb-4 text-sm text-red-700 bg-red-50 border border-red-200 rounded-md px-3 py-2">
            {error}
          </div>
        )}

        {searched && vehicles.length === 0 && (
          <p className="text-slate-500 text-sm text-center">
            No vehicles are free for that branch and date range. Try different dates.
          </p>
        )}

        {searched && vehicles.length > 0 && (
          <>
            <p className="text-sm text-slate-500 mb-4">
              <span className="font-semibold text-[#122A4D]">{vehicles.length}</span> vehicle
              {vehicles.length !== 1 ? "s" : ""} available · {formatDate(startDate)} – {formatDate(endDate)}
            </p>
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {vehicles.map((v) => (
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
          </>
        )}
      </section>

      <section className="bg-white px-6 py-14">
        <div className="max-w-3xl mx-auto text-center">
          <h2 className="text-2xl font-bold text-[#122A4D] mb-4">About HPCRMS</h2>
          <p className="text-slate-600 leading-relaxed">
            HPCRMS (High Priority Car Rental Management System) is a modern car rental platform built to
            eliminate the friction of traditional rental counters. From browsing available vehicles to
            picking up your car with a simple QR code, every step is designed to be fast, transparent, and
            entirely digital — no waiting in line, no paperwork.
          </p>
        </div>
      </section>

      <section className="px-6 py-14 bg-slate-50">
        <div className="max-w-4xl mx-auto grid sm:grid-cols-2 gap-6">
          <div className="bg-white rounded-xl shadow-sm p-6">
            <h3 className="text-lg font-bold text-[#122A4D] mb-2">Our Vision</h3>
            <p className="text-slate-600 text-sm leading-relaxed">
              To transform traditional vehicle rental operations into a seamless digital experience —
              minimizing customer wait times, automating rental processes, and providing fast, secure, and
              convenient access to vehicles at every location.
            </p>
          </div>
          <div className="bg-white rounded-xl shadow-sm p-6">
            <h3 className="text-lg font-bold text-[#122A4D] mb-2">Our Mission</h3>
            <p className="text-slate-600 text-sm leading-relaxed">
              To deliver a fast, secure, and fully digital rental experience — from search to pickup — that
              respects our customers' time, while giving our team the tools to run every branch
              efficiently and reliably.
            </p>
          </div>
        </div>
      </section>

      <footer className="bg-[#122A4D] text-slate-300 text-center text-xs px-6 py-6">
        © {new Date().getFullYear()} HPCRMS — High Priority Car Rental Management System
      </footer>
    </div>
  );
}
