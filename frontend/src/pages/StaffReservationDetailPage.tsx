import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { getReservationById } from "../api/reservations";
import { completeCheckIn, verifyIdentity } from "../api/checkin";
import { processPayment } from "../api/payments";
import { pickupVehicle } from "../api/pickup";
import { returnVehicle } from "../api/returns";
import { getErrorMessage } from "../api/errors";
import StatusBadge from "../components/StatusBadge";
import { generateAgreementText, isValidFullName } from "../utils/rentalAgreement";
import {
  cvvLengthForBrand,
  detectCardBrand,
  formatCardNumber,
  formatExpiry,
  isValidCardLength,
  isValidExpiry,
  isValidLuhn,
  type CardBrand,
} from "../utils/cardValidation";
import type { PaymentMethod, PickupResponse, ReservationResponse, ReturnResponse } from "../types";

function todayIso(): string {
  const d = new Date();
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function formatDate(iso: string): string {
  return new Date(`${iso}T00:00:00`).toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

function formatTime(time: string | null): string {
  if (!time) return "";
  const [h, m] = time.split(":");
  const d = new Date();
  d.setHours(Number(h), Number(m));
  return d.toLocaleTimeString(undefined, { hour: "numeric", minute: "2-digit" });
}

function isPickupDateReached(startDate: string): boolean {
  return startDate <= todayIso();
}

const BRAND_STYLES: Record<CardBrand, string> = {
  VISA: "bg-blue-100 text-blue-800",
  MASTERCARD: "bg-orange-100 text-orange-800",
  AMEX: "bg-teal-100 text-teal-800",
  DISCOVER: "bg-amber-100 text-amber-800",
  UNKNOWN: "bg-slate-100 text-slate-500",
};
const BRAND_LABELS: Record<CardBrand, string> = {
  VISA: "Visa", MASTERCARD: "Mastercard", AMEX: "Amex", DISCOVER: "Discover", UNKNOWN: "",
};

export default function StaffReservationDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const reservationId = Number(id);

  const [reservation, setReservation] = useState<ReservationResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [actionLoading, setActionLoading] = useState(false);

  const [licenseNumber, setLicenseNumber] = useState("");
  const [dateOfBirth, setDateOfBirth] = useState("");
  const [licenseExpirationDate, setLicenseExpirationDate] = useState("");
  const [selfieConfirmed, setSelfieConfirmed] = useState(false);
  const [verifyError, setVerifyError] = useState("");

  const [signature, setSignature] = useState("");
  const [agreementAccepted, setAgreementAccepted] = useState(false);

  const [method, setMethod] = useState<PaymentMethod>("CREDIT_CARD");
  const [cardNumber, setCardNumber] = useState("");
  const [cardExpiry, setCardExpiry] = useState("");
  const [cardCvv, setCardCvv] = useState("");
  const [cardholderName, setCardholderName] = useState("");
  const [paymentError, setPaymentError] = useState("");

  const [mileage, setMileage] = useState("");
  const [fuelLevel, setFuelLevel] = useState("100");
  const [conditionNotes, setConditionNotes] = useState("");
  const [vehicleIssue, setVehicleIssue] = useState(false);

  const [pickupResult, setPickupResult] = useState<PickupResponse | null>(null);
  const [returnResult, setReturnResult] = useState<ReturnResponse | null>(null);

  const cardBrand = detectCardBrand(cardNumber);

  async function load() {
    setLoading(true);
    setError("");
    try {
      const data = await getReservationById(reservationId);
      setReservation(data);
    } catch (err) {
      setError(getErrorMessage(err, "Could not load reservation"));
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    if (reservationId) load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [reservationId]);

  async function handleVerifyIdentity(e: React.FormEvent) {
    e.preventDefault();
    setVerifyError("");

    const age = dateOfBirth
      ? Math.floor((Date.now() - new Date(dateOfBirth).getTime()) / (365.25 * 24 * 60 * 60 * 1000))
      : 0;
    if (age < 21) {
      setVerifyError("Customer must be at least 21 years old to rent a vehicle");
      return;
    }
    if (licenseExpirationDate < todayIso()) {
      setVerifyError("This driver's license has expired");
      return;
    }
    if (!/^[A-Za-z0-9]{5,20}$/.test(licenseNumber)) {
      setVerifyError("License number must be 5-20 letters/numbers");
      return;
    }

    setActionLoading(true);
    try {
      await verifyIdentity({ reservationId, licenseNumber, dateOfBirth, licenseExpirationDate, selfieConfirmed });
      setLicenseNumber("");
      setDateOfBirth("");
      setLicenseExpirationDate("");
      setSelfieConfirmed(false);
      await load();
    } catch (err) {
      setVerifyError(getErrorMessage(err, "Identity verification failed"));
    } finally {
      setActionLoading(false);
    }
  }

  async function handleCheckIn(e: React.FormEvent) {
    e.preventDefault();
    if (!agreementAccepted || !isValidFullName(signature)) return;
    setError("");
    setActionLoading(true);
    try {
      await completeCheckIn({ reservationId, signatureData: signature });
      setSignature("");
      setAgreementAccepted(false);
      await load();
    } catch (err) {
      setError(getErrorMessage(err, "Check-in failed"));
    } finally {
      setActionLoading(false);
    }
  }

  async function handlePayment(e: React.FormEvent) {
    e.preventDefault();
    setPaymentError("");
    if (!isValidLuhn(cardNumber)) {
      setPaymentError("That card number doesn't look valid");
      return;
    }
    if (!isValidCardLength(cardNumber, cardBrand)) {
      setPaymentError(`${BRAND_LABELS[cardBrand] || "Card"} numbers should be ${cardBrand === "AMEX" ? 15 : 16} digits`);
      return;
    }
    if (!isValidExpiry(cardExpiry)) {
      setPaymentError("Enter a valid, non-expired expiry date (MM/YY)");
      return;
    }
    if (cardCvv.length !== cvvLengthForBrand(cardBrand)) {
      setPaymentError(`CVV should be ${cvvLengthForBrand(cardBrand)} digits`);
      return;
    }
    if (!cardholderName.trim()) {
      setPaymentError("Enter the name on the card");
      return;
    }

    setActionLoading(true);
    try {
      await processPayment({ reservationId, method });
      setCardNumber("");
      setCardExpiry("");
      setCardCvv("");
      setCardholderName("");
      await load();
    } catch (err) {
      setPaymentError(getErrorMessage(err, "Payment failed"));
    } finally {
      setActionLoading(false);
    }
  }

  async function handlePickup() {
    if (!reservation?.pickupCode) return;
    setError("");
    setActionLoading(true);
    try {
      const result = await pickupVehicle(reservation.pickupCode);
      setPickupResult(result);
      await load();
    } catch (err) {
      setError(getErrorMessage(err, "Could not complete pickup"));
    } finally {
      setActionLoading(false);
    }
  }

  async function handleReturn(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setActionLoading(true);
    try {
      const result = await returnVehicle({
        reservationId,
        mileage: Number(mileage),
        fuelLevel: Number(fuelLevel),
        conditionNotes: conditionNotes || undefined,
        vehicleIssue,
      });
      setReturnResult(result);
      await load();
    } catch (err) {
      setError(getErrorMessage(err, "Could not complete return"));
    } finally {
      setActionLoading(false);
    }
  }

  if (loading) return <p className="text-slate-500">Loading reservation…</p>;
  if (!reservation) {
    return (
      <div>
        {error && (
          <div className="text-sm text-red-700 bg-red-50 border border-red-200 rounded-md px-3 py-2">{error}</div>
        )}
      </div>
    );
  }

  const r = reservation;

  return (
    <div className="max-w-2xl">
      <button onClick={() => navigate("/staff/reservations")} className="text-sm text-slate-500 hover:text-slate-700 mb-4">
        ← All Reservations
      </button>

      <div className="bg-white rounded-xl shadow-sm p-6 mb-6">
        <div className="flex items-start justify-between flex-wrap gap-2 mb-4">
          <div>
            <p className="text-xs text-slate-400">Reservation #{r.id}</p>
            <h1 className="text-xl font-bold text-[#122A4D]">{r.customerName}</h1>
            <p className="text-sm text-slate-500">
              {r.vehicle ? `${r.vehicle.make} ${r.vehicle.model} (${r.vehicle.licensePlate})` : "No vehicle assigned"}
            </p>
            <p className="text-sm text-slate-500">
              Pickup: {r.pickupBranchName} · {formatDate(r.startDate)}
              {r.pickupTime && ` at ${formatTime(r.pickupTime)}`}
            </p>
            <p className="text-sm text-slate-500">
              Return: {r.dropoffBranchName ?? r.pickupBranchName} · {formatDate(r.endDate)}
              {r.returnTime && ` at ${formatTime(r.returnTime)}`}
              {r.dropoffBranchName && (
                <span className="ml-1 text-xs text-[#FF6B35] font-semibold">(different drop-off)</span>
              )}
            </p>
          </div>
          <StatusBadge status={r.status} />
        </div>

        <div className="flex flex-wrap gap-4 text-sm border-t border-slate-100 pt-4">
          <span className={r.identityVerified ? "text-emerald-600 font-semibold" : "text-amber-600 font-semibold"}>
            {r.identityVerified ? "Identity Verified ✓" : "Identity Not Verified"}
          </span>
          <span className={r.paid ? "text-emerald-600 font-semibold" : "text-amber-600 font-semibold"}>
            {r.paid ? "Paid ✓" : "Not Paid"}
          </span>
          <span className="text-slate-500">
            {r.status === "COMPLETED" && r.finalCost !== null ? `Final cost: $${r.finalCost}` : `Est. cost: $${r.estimatedCost}`}
          </span>
        </div>
      </div>

      {error && (
        <div className="mb-4 text-sm text-red-700 bg-red-50 border border-red-200 rounded-md px-3 py-2">{error}</div>
      )}

      {/* Step: Verify Identity */}
      {r.status === "PENDING" && !r.identityVerified && (
        <form onSubmit={handleVerifyIdentity} className="bg-white rounded-xl shadow-sm p-6 space-y-4">
          <h2 className="font-semibold text-[#122A4D]">Verify Identity</h2>
          <p className="text-xs text-slate-500">
            Simulated identity check — the license, age, and expiration checks below are real validations.
          </p>
          {verifyError && (
            <div className="text-sm text-red-700 bg-red-50 border border-red-200 rounded-md px-3 py-2">{verifyError}</div>
          )}
          <div>
            <label className="block text-xs font-medium text-slate-700 mb-1">Driver&apos;s license number</label>
            <input
              required
              value={licenseNumber}
              onChange={(e) => setLicenseNumber(e.target.value)}
              placeholder="e.g. AB123456"
              className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm"
            />
          </div>
          <div className="grid sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">Date of birth</label>
              <input
                type="date"
                required
                max={todayIso()}
                value={dateOfBirth}
                onChange={(e) => setDateOfBirth(e.target.value)}
                className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">License expires</label>
              <input
                type="date"
                required
                value={licenseExpirationDate}
                onChange={(e) => setLicenseExpirationDate(e.target.value)}
                className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm"
              />
            </div>
          </div>
          <label className="flex items-center gap-2 text-sm text-slate-700">
            <input
              type="checkbox"
              required
              checked={selfieConfirmed}
              onChange={(e) => setSelfieConfirmed(e.target.checked)}
              className="rounded border-slate-300"
            />
            Selfie matches license photo
          </label>
          <button
            type="submit"
            disabled={actionLoading}
            className="bg-[#122A4D] hover:bg-[#0B1B33] text-white font-semibold px-5 py-2 rounded-md transition disabled:opacity-50"
          >
            {actionLoading ? "Verifying…" : "Verify Identity"}
          </button>
        </form>
      )}

      {/* Step: Check-In */}
      {r.status === "PENDING" && r.identityVerified && (
        <form onSubmit={handleCheckIn} className="bg-white rounded-xl shadow-sm p-6 space-y-4">
          <h2 className="font-semibold text-[#122A4D]">Complete Check-In</h2>
          <div>
            <label className="block text-xs font-medium text-slate-700 mb-1">Rental Agreement</label>
            <div className="border border-slate-200 rounded-md p-3 h-48 overflow-y-auto text-xs text-slate-600 whitespace-pre-line bg-slate-50">
              {generateAgreementText(r)}
            </div>
          </div>
          <label className="flex items-start gap-2 text-sm text-slate-700">
            <input
              type="checkbox"
              required
              checked={agreementAccepted}
              onChange={(e) => setAgreementAccepted(e.target.checked)}
              className="rounded border-slate-300 mt-0.5"
            />
            <span>Customer has read and agrees to the Rental Agreement terms above</span>
          </label>
          <div>
            <label className="block text-xs font-medium text-slate-700 mb-1">
              Customer signature — full legal name (as on file: {r.customerName})
            </label>
            <input
              required
              value={signature}
              onChange={(e) => setSignature(e.target.value)}
              placeholder="First Last"
              className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm"
            />
            {signature.length > 0 && !isValidFullName(signature) && (
              <p className="text-xs text-red-600 mt-1">Enter the customer&apos;s full first and last name</p>
            )}
          </div>
          <button
            type="submit"
            disabled={actionLoading || !agreementAccepted || !isValidFullName(signature)}
            className="bg-[#122A4D] hover:bg-[#0B1B33] text-white font-semibold px-5 py-2 rounded-md transition disabled:opacity-50"
          >
            {actionLoading ? "Submitting…" : "Sign & Check In"}
          </button>
        </form>
      )}

      {/* Step: Payment */}
      {r.status === "READY_FOR_PICKUP" && !r.paid && (
        <form onSubmit={handlePayment} className="bg-white rounded-xl shadow-sm p-6 space-y-4">
          <h2 className="font-semibold text-[#122A4D]">Collect Payment</h2>
          {paymentError && (
            <div className="text-sm text-red-700 bg-red-50 border border-red-200 rounded-md px-3 py-2">{paymentError}</div>
          )}
          <div className="flex gap-2">
            {(["CREDIT_CARD", "DEBIT_CARD"] as PaymentMethod[]).map((m) => (
              <button
                key={m}
                type="button"
                onClick={() => setMethod(m)}
                className={`flex-1 text-sm font-semibold py-2 rounded-md border transition ${
                  method === m ? "bg-[#122A4D] text-white border-[#122A4D]" : "bg-white text-slate-600 border-slate-300"
                }`}
              >
                {m === "CREDIT_CARD" ? "Credit" : "Debit"}
              </button>
            ))}
          </div>
          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="block text-xs font-medium text-slate-700">Card number</label>
              {cardBrand !== "UNKNOWN" && (
                <span className={`text-xs font-bold px-2 py-0.5 rounded ${BRAND_STYLES[cardBrand]}`}>
                  {BRAND_LABELS[cardBrand]}
                </span>
              )}
            </div>
            <input
              required
              inputMode="numeric"
              value={cardNumber}
              onChange={(e) => setCardNumber(formatCardNumber(e.target.value))}
              placeholder="4242 4242 4242 4242"
              className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm font-mono"
            />
          </div>
          <div className="grid sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">Expiry (MM/YY)</label>
              <input
                required
                inputMode="numeric"
                value={cardExpiry}
                onChange={(e) => setCardExpiry(formatExpiry(e.target.value))}
                placeholder="12/28"
                className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm font-mono"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">CVV</label>
              <input
                required
                inputMode="numeric"
                maxLength={4}
                value={cardCvv}
                onChange={(e) => setCardCvv(e.target.value.replace(/\D/g, "").slice(0, 4))}
                placeholder="123"
                className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm font-mono"
              />
            </div>
          </div>
          <div>
            <label className="block text-xs font-medium text-slate-700 mb-1">Name on card</label>
            <input
              required
              value={cardholderName}
              onChange={(e) => setCardholderName(e.target.value)}
              placeholder="Jane Doe"
              className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm"
            />
          </div>
          <button
            type="submit"
            disabled={actionLoading}
            className="bg-[#FF6B35] hover:bg-[#E85320] text-white font-semibold px-5 py-2 rounded-md transition disabled:opacity-50"
          >
            {actionLoading ? "Processing…" : `Collect $${r.estimatedCost}`}
          </button>
        </form>
      )}

      {/* Step: Pickup */}
      {r.status === "READY_FOR_PICKUP" && r.paid && !pickupResult && (
        <div className="bg-white rounded-xl shadow-sm p-6 space-y-4">
          <h2 className="font-semibold text-[#122A4D]">Release Vehicle</h2>
          <p className="text-sm text-slate-500">
            Pickup code: <span className="font-mono font-bold">{r.pickupCode}</span>
          </p>
          {isPickupDateReached(r.startDate) ? (
            <button
              onClick={handlePickup}
              disabled={actionLoading}
              className="bg-[#FF6B35] hover:bg-[#E85320] text-white font-semibold px-5 py-2 rounded-md transition disabled:opacity-50"
            >
              {actionLoading ? "Processing…" : "Complete Pickup"}
            </button>
          ) : (
            <p className="text-sm text-amber-600 font-medium">
              This reservation can&apos;t be picked up before {formatDate(r.startDate)}.
            </p>
          )}
        </div>
      )}

      {pickupResult && !returnResult && r.status === "ACTIVE_RENTAL" && (
        <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-6 mb-6">
          <h2 className="font-bold text-emerald-900 mb-1">Vehicle Released!</h2>
          <p className="text-sm text-emerald-800 mb-3">{pickupResult.instructions}</p>
          <dl className="text-sm text-emerald-900 space-y-1">
            <div className="flex justify-between">
              <dt className="text-emerald-700">Vehicle</dt>
              <dd className="font-semibold">
                {pickupResult.vehicleMake} {pickupResult.vehicleModel} ({pickupResult.vehicleLicensePlate})
              </dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-emerald-700">Branch</dt>
              <dd className="font-semibold">{pickupResult.pickupBranchName}</dd>
            </div>
          </dl>
        </div>
      )}

      {/* Step: Return */}
      {r.status === "ACTIVE_RENTAL" && !returnResult && (
        <form onSubmit={handleReturn} className="bg-white rounded-xl shadow-sm p-6 space-y-4">
          <h2 className="font-semibold text-[#122A4D]">Process Return</h2>
          <p className="text-xs text-slate-500">
            Inspect the vehicle and record its condition to complete the rental.
            {r.dropoffBranchName && (
              <> The vehicle will be moved to <span className="font-semibold">{r.dropoffBranchName}</span>.</>
            )}
          </p>
          <div className="grid sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">Odometer (mileage)</label>
              <input
                type="number"
                required
                min={0}
                value={mileage}
                onChange={(e) => setMileage(e.target.value)}
                className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">Fuel level (%)</label>
              <input
                type="number"
                required
                min={0}
                max={100}
                value={fuelLevel}
                onChange={(e) => setFuelLevel(e.target.value)}
                className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm"
              />
            </div>
          </div>
          <div>
            <label className="block text-xs font-medium text-slate-700 mb-1">Condition notes (optional)</label>
            <textarea
              value={conditionNotes}
              onChange={(e) => setConditionNotes(e.target.value)}
              rows={3}
              className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm"
            />
          </div>

          {todayIso() < r.endDate && (
            <div className="bg-amber-50 border border-amber-200 rounded-md p-3 space-y-2">
              <p className="text-xs text-amber-800">
                This is an <span className="font-semibold">early return</span> — the reservation runs through{" "}
                {formatDate(r.endDate)}.
              </p>
              <label className="flex items-center gap-2 text-sm text-amber-900">
                <input
                  type="checkbox"
                  checked={vehicleIssue}
                  onChange={(e) => setVehicleIssue(e.target.checked)}
                  className="rounded border-amber-300"
                />
                This early return is due to a vehicle issue (mechanical/safety problem)
              </label>
              <p className="text-xs text-amber-700">
                {vehicleIssue
                  ? "Customer will only be charged for days actually used."
                  : "Full reserved amount will still be charged — no discount for unused days."}
              </p>
            </div>
          )}

          <button
            type="submit"
            disabled={actionLoading}
            className="bg-[#FF6B35] hover:bg-[#E85320] text-white font-semibold px-5 py-2 rounded-md transition disabled:opacity-50"
          >
            {actionLoading ? "Processing…" : "Complete Return"}
          </button>
        </form>
      )}

      {returnResult && (
        <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-6">
          <h2 className="font-bold text-emerald-900 mb-1">Rental Completed!</h2>
          {returnResult.earlyReturn && (
            <p className="text-xs text-emerald-700 mb-2">
              {returnResult.prorated ? "Vehicle issue — charged only for days used." : "Early return — full reserved amount charged."}
            </p>
          )}
          <dl className="text-sm text-emerald-900 space-y-1 mt-3">
            <div className="flex justify-between">
              <dt className="text-emerald-700">Final cost</dt>
              <dd className="font-semibold">${returnResult.finalCost}</dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-emerald-700">Vehicle returned to</dt>
              <dd className="font-semibold">{returnResult.returnedToBranchName}</dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-emerald-700">Final mileage</dt>
              <dd className="font-semibold">{returnResult.finalMileage.toLocaleString()} mi</dd>
            </div>
          </dl>
        </div>
      )}

      {r.status === "CANCELLED" && (
        <div className="bg-slate-100 border border-slate-200 rounded-xl p-6 text-slate-600 text-sm">
          This reservation was cancelled — no further action is available.
        </div>
      )}
      {r.status === "COMPLETED" && !returnResult && (
        <div className="bg-slate-100 border border-slate-200 rounded-xl p-6 text-slate-600 text-sm">
          This rental is complete — no further action is available.
        </div>
      )}
    </div>
  );
}
