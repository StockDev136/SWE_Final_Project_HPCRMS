import { useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { createReservation } from "../api/reservations";
import { getErrorMessage } from "../api/errors";
import { savePendingReservation } from "../utils/pendingReservation";
import { defaultImageForCategory } from "../utils/vehicleImages";
import { useAuth } from "../context/AuthContext";
import type { VehicleResponse } from "../types";

export interface ConfirmReservationState {
  vehicle: VehicleResponse;
  startDate: string;
  endDate: string;
  pickupTime: string;
  returnTime: string;
  dropoffBranchId?: number;
  dropoffBranchName?: string;
}

function formatDate(iso: string): string {
  return new Date(`${iso}T00:00:00`).toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

function formatTime(time: string): string {
  const [h, m] = time.split(":");
  const d = new Date();
  d.setHours(Number(h), Number(m));
  return d.toLocaleTimeString(undefined, { hour: "numeric", minute: "2-digit" });
}

function estimatedDays(startDate: string, endDate: string): number {
  const start = new Date(`${startDate}T00:00:00`).getTime();
  const end = new Date(`${endDate}T00:00:00`).getTime();
  const days = Math.round((end - start) / (24 * 60 * 60 * 1000));
  return Math.max(1, days);
}

export default function ConfirmReservationPage() {
  const location = useLocation();
  const navigate = useNavigate();
  const { isAuthenticated } = useAuth();

  const state = location.state as ConfirmReservationState | null;
  const [confirming, setConfirming] = useState(false);
  const [error, setError] = useState("");

  if (!state?.vehicle) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50 px-4">
        <div className="max-w-sm text-center">
          <h1 className="text-xl font-bold text-[#122A4D] mb-2">No vehicle selected</h1>
          <p className="text-slate-500 text-sm mb-4">
            Your reservation details weren&apos;t found — this can happen after a page refresh.
          </p>
          <button
            type="button"
            onClick={() => navigate(-1)}
            className="text-[#FF6B35] font-semibold underline"
          >
            Search vehicles again
          </button>
        </div>
      </div>
    );
  }

  const { vehicle, startDate, endDate, pickupTime, returnTime, dropoffBranchId, dropoffBranchName } = state;
  const days = estimatedDays(startDate, endDate);
  const estimatedCost = (vehicle.dailyRate * days).toFixed(2);

  async function handleConfirm() {
    setError("");
    setConfirming(true);
    try {
      const reservation = await createReservation({
        vehicleId: vehicle.id,
        startDate,
        endDate,
        pickupTime,
        returnTime,
        dropoffBranchId,
      });
      navigate("/reservations", { state: { justCreatedId: reservation.id } });
    } catch (err) {
      setError(getErrorMessage(err, "Could not create reservation"));
    } finally {
      setConfirming(false);
    }
  }

  function handleAuthRequired(destination: "/login" | "/register") {
    savePendingReservation({
      vehicleId: vehicle.id,
      startDate,
      endDate,
      pickupTime,
      returnTime,
      dropoffBranchId,
      vehicleLabel: `${vehicle.make} ${vehicle.model}`,
    });
    navigate(destination);
  }

  return (
    <div className="min-h-screen bg-slate-50 px-4 py-10">
      <div className="max-w-lg mx-auto">
        <button
          type="button"
          onClick={() => navigate(-1)}
          className="text-sm text-slate-500 hover:text-slate-700"
        >
          ← Back to search
        </button>

        <div className="bg-white rounded-xl shadow-sm overflow-hidden mt-4">
          <img
            src={vehicle.imageUrl || defaultImageForCategory(vehicle.category)}
            alt={`${vehicle.make} ${vehicle.model}`}
            className="w-full h-44 object-cover bg-slate-100"
          />
          <div className="p-6">
            <span className="text-xs font-semibold uppercase tracking-wide text-[#FF6B35]">
              {vehicle.category}
            </span>
            <h1 className="text-2xl font-bold text-[#122A4D] mb-1">
              {vehicle.make} {vehicle.model}
            </h1>
            <p className="text-sm text-slate-500 mb-4">{vehicle.licensePlate}</p>

            <dl className="text-sm space-y-2 mb-6 border-t border-slate-100 pt-4">
              <div className="flex justify-between">
                <dt className="text-slate-500">Pickup</dt>
                <dd className="font-semibold text-[#122A4D]">
                  {vehicle.branchName} · {formatDate(startDate)} at {formatTime(pickupTime)}
                </dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-slate-500">Return</dt>
                <dd className="font-semibold text-[#122A4D]">
                  {dropoffBranchName ?? vehicle.branchName} · {formatDate(endDate)} at {formatTime(returnTime)}
                </dd>
              </div>
              {dropoffBranchName && (
                <div className="flex justify-between">
                  <dt className="text-slate-500">Drop-off location</dt>
                  <dd className="font-semibold text-[#FF6B35]">{dropoffBranchName} (different from pickup)</dd>
                </div>
              )}
              <div className="flex justify-between">
                <dt className="text-slate-500">Rate</dt>
                <dd className="font-semibold text-[#122A4D]">${vehicle.dailyRate}/day × {days} day{days !== 1 ? "s" : ""}</dd>
              </div>
              <div className="flex justify-between text-base pt-2 border-t border-slate-100">
                <dt className="font-semibold text-[#122A4D]">Estimated total</dt>
                <dd className="font-bold text-[#122A4D]">${estimatedCost}</dd>
              </div>
            </dl>

            {error && (
              <div className="mb-4 text-sm text-red-700 bg-red-50 border border-red-200 rounded-md px-3 py-2">
                {error}
              </div>
            )}

            {isAuthenticated ? (
              <button
                onClick={handleConfirm}
                disabled={confirming}
                className="w-full bg-[#FF6B35] hover:bg-[#E85320] text-white font-semibold py-2.5 rounded-md transition disabled:opacity-50"
              >
                {confirming ? "Confirming…" : "Confirm Reservation"}
              </button>
            ) : (
              <div className="space-y-2">
                <p className="text-xs text-slate-500 text-center mb-1">
                  Log in or create an account to complete this reservation
                </p>
                <button
                  onClick={() => handleAuthRequired("/login")}
                  className="w-full bg-[#122A4D] hover:bg-[#0B1B33] text-white font-semibold py-2.5 rounded-md transition"
                >
                  Log In to Complete
                </button>
                <button
                  onClick={() => handleAuthRequired("/register")}
                  className="w-full bg-white border border-slate-300 hover:bg-slate-50 text-[#122A4D] font-semibold py-2.5 rounded-md transition"
                >
                  Create Account
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
