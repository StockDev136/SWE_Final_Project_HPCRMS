import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { cancelReservation, getMyReservations, modifyReservation } from "../api/reservations";
import { completeCheckIn, verifyIdentity } from "../api/checkin";
import { processPayment } from "../api/payments";
import { getErrorMessage } from "../api/errors";
import {
  generateAgreementText,
  isValidFullName,
} from "../utils/rentalAgreement";
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
import StatusBadge from "../components/StatusBadge";
import type { PaymentMethod, ReservationResponse } from "../types";

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

function isPickupDateReached(startDate: string): boolean {
  return startDate <= todayIso();
}

function nowTimeString(): string {
  const d = new Date();
  const hours = String(d.getHours()).padStart(2, "0");
  const minutes = String(d.getMinutes()).padStart(2, "0");
  return `${hours}:${minutes}`;
}

function formatTime(time: string | null): string {
  if (!time) return "";
  const [h, m] = time.split(":");
  const d = new Date();
  d.setHours(Number(h), Number(m));
  return d.toLocaleTimeString(undefined, { hour: "numeric", minute: "2-digit" });
}

const BRAND_STYLES: Record<CardBrand, string> = {
  VISA: "bg-blue-100 text-blue-800",
  MASTERCARD: "bg-orange-100 text-orange-800",
  AMEX: "bg-teal-100 text-teal-800",
  DISCOVER: "bg-amber-100 text-amber-800",
  UNKNOWN: "bg-slate-100 text-slate-500",
};
const BRAND_LABELS: Record<CardBrand, string> = {
  VISA: "Visa",
  MASTERCARD: "Mastercard",
  AMEX: "Amex",
  DISCOVER: "Discover",
  UNKNOWN: "",
};

export default function ReservationsPage() {
  const [reservations, setReservations] = useState<ReservationResponse[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [verifyingId, setVerifyingId] = useState<number | null>(null);
  const [licenseNumber, setLicenseNumber] = useState("");
  const [dateOfBirth, setDateOfBirth] = useState("");
  const [licenseExpirationDate, setLicenseExpirationDate] = useState("");
  const [selfieConfirmed, setSelfieConfirmed] = useState(false);
  const [verifyError, setVerifyError] = useState("");

  const [modifyingId, setModifyingId] = useState<number | null>(null);
  const [modifyStartDate, setModifyStartDate] = useState("");
  const [modifyEndDate, setModifyEndDate] = useState("");
  const [modifyError, setModifyError] = useState("");

  const [checkingInId, setCheckingInId] = useState<number | null>(null);
  const [signature, setSignature] = useState("");
  const [agreementAccepted, setAgreementAccepted] = useState(false);

  const [payingId, setPayingId] = useState<number | null>(null);
  const [method, setMethod] = useState<PaymentMethod>("CREDIT_CARD");
  const [cardNumber, setCardNumber] = useState("");
  const [cardExpiry, setCardExpiry] = useState("");
  const [cardCvv, setCardCvv] = useState("");
  const [cardholderName, setCardholderName] = useState("");
  const [paymentError, setPaymentError] = useState("");

  const [actionError, setActionError] = useState("");
  const [actionLoading, setActionLoading] = useState(false);

  const navigate = useNavigate();
  const cardBrand = detectCardBrand(cardNumber);

  async function loadReservations() {
    setLoading(true);
    setError("");
    try {
      const data = await getMyReservations();
      setReservations(data.sort((a, b) => b.id - a.id));
    } catch (err) {
      setError(getErrorMessage(err, "Could not load reservations"));
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadReservations();
  }, []);

  async function handleCancel(id: number) {
    setActionError("");
    setActionLoading(true);
    try {
      await cancelReservation(id);
      await loadReservations();
    } catch (err) {
      setActionError(getErrorMessage(err, "Could not cancel reservation"));
    } finally {
      setActionLoading(false);
    }
  }

  async function handleModify(
    e: React.FormEvent,
    id: number,
    pickupTime: string | null,
    returnTime: string | null,
  ) {
    e.preventDefault();
    setModifyError("");

    if (modifyEndDate < modifyStartDate) {
      setModifyError("Return date cannot be before pickup date");
      return;
    }
    // Time can't be changed here — only the reservation's existing pickup/
    // return times apply, so a same-day modification is only valid if those
    // original times still work out in the new order.
    if (modifyEndDate === modifyStartDate && pickupTime && returnTime && returnTime <= pickupTime) {
      setModifyError("This reservation's pickup and return times don't allow a same-day date");
      return;
    }
    if (modifyStartDate === todayIso() && pickupTime && pickupTime <= nowTimeString()) {
      setModifyError("Pickup time has already passed today — choose a later date");
      return;
    }

    setActionLoading(true);
    try {
      await modifyReservation(id, { startDate: modifyStartDate, endDate: modifyEndDate });
      setModifyingId(null);
      await loadReservations();
    } catch (err) {
      setModifyError(getErrorMessage(err, "Could not update reservation dates"));
    } finally {
      setActionLoading(false);
    }
  }

  async function handleVerifyIdentity(e: React.FormEvent, id: number) {
    e.preventDefault();
    setVerifyError("");

    const age = dateOfBirth
      ? Math.floor(
          (Date.now() - new Date(dateOfBirth).getTime()) /
            (365.25 * 24 * 60 * 60 * 1000),
        )
      : 0;
    if (age < 21) {
      setVerifyError("You must be at least 21 years old to rent a vehicle");
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
      await verifyIdentity({
        reservationId: id,
        licenseNumber,
        dateOfBirth,
        licenseExpirationDate,
        selfieConfirmed,
      });
      setVerifyingId(null);
      setLicenseNumber("");
      setDateOfBirth("");
      setLicenseExpirationDate("");
      setSelfieConfirmed(false);
      await loadReservations();
    } catch (err) {
      setVerifyError(getErrorMessage(err, "Identity verification failed"));
    } finally {
      setActionLoading(false);
    }
  }

  async function handleCheckIn(e: React.FormEvent, id: number) {
    e.preventDefault();
    if (!agreementAccepted || !isValidFullName(signature)) return;
    setActionError("");
    setActionLoading(true);
    try {
      await completeCheckIn({ reservationId: id, signatureData: signature });
      setCheckingInId(null);
      setSignature("");
      setAgreementAccepted(false);
      await loadReservations();
    } catch (err) {
      setActionError(getErrorMessage(err, "Check-in failed"));
    } finally {
      setActionLoading(false);
    }
  }

  async function handlePay(e: React.FormEvent, id: number) {
    e.preventDefault();
    setPaymentError("");
    if (!isValidLuhn(cardNumber)) {
      setPaymentError("That card number doesn't look valid");
      return;
    }
    if (!isValidCardLength(cardNumber, cardBrand)) {
      setPaymentError(
        `${BRAND_LABELS[cardBrand] || "Card"} numbers should be ${cardBrand === "AMEX" ? 15 : 16} digits`,
      );
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
      await processPayment({ reservationId: id, method });
      setPayingId(null);
      setCardNumber("");
      setCardExpiry("");
      setCardCvv("");
      setCardholderName("");
      await loadReservations();
    } catch (err) {
      setPaymentError(getErrorMessage(err, "Payment failed"));
    } finally {
      setActionLoading(false);
    }
  }

  if (loading)
    return <p className="text-slate-500">Loading your reservations…</p>;

  return (
    <div>
      <h1 className="text-2xl font-bold text-[#122A4D] mb-6">
        My Reservations
      </h1>

      {error && (
        <div className="mb-4 text-sm text-red-700 bg-red-50 border border-red-200 rounded-md px-3 py-2">
          {error}
        </div>
      )}
      {actionError && (
        <div className="mb-4 text-sm text-red-700 bg-red-50 border border-red-200 rounded-md px-3 py-2">
          {actionError}
        </div>
      )}

      {reservations.length === 0 && !error && (
        <p className="text-slate-500 text-sm">
          You don&apos;t have any reservations yet.{" "}
          <button
            onClick={() => navigate("/vehicles")}
            className="text-[#FF6B35] font-medium underline"
          >
            Search vehicles
          </button>{" "}
          to get started.
        </p>
      )}

      <div className="space-y-4">
        {reservations.map((r) => (
          <div key={r.id} className="bg-white rounded-xl shadow-sm p-5">
            <div className="flex items-start justify-between flex-wrap gap-2 mb-3">
              <div>
                <p className="text-xs text-slate-400">Reservation #{r.id}</p>
                <h3 className="font-bold text-[#122A4D]">
                  {r.vehicle
                    ? `${r.vehicle.make} ${r.vehicle.model}`
                    : "Vehicle pending assignment"}
                </h3>
                <p className="text-sm text-slate-500">
                  {r.pickupBranchName} · {r.startDate} → {r.endDate}
                  {r.dropoffBranchName && (
                    <span className="ml-1 text-xs text-[#FF6B35] font-semibold">
                      (drop off at {r.dropoffBranchName})
                    </span>
                  )}
                </p>
              </div>
              <StatusBadge status={r.status} />
            </div>

            <div className="flex items-center justify-between text-sm mb-3">
              <span className="text-slate-600">
                {r.status === "COMPLETED" && r.finalCost !== null ? (
                  <>
                    Final cost:{" "}
                    <span className="font-semibold text-[#122A4D]">
                      ${r.finalCost}
                    </span>
                  </>
                ) : (
                  <>
                    Est. cost:{" "}
                    <span className="font-semibold text-[#122A4D]">
                      ${r.estimatedCost}
                    </span>
                  </>
                )}
                {r.paid && (
                  <span className="ml-2 text-emerald-600 font-semibold">
                    Paid ✓
                  </span>
                )}
              </span>
              {r.status === "PENDING" && (
                <span
                  className={`text-xs font-semibold ${r.identityVerified ? "text-emerald-600" : "text-amber-600"}`}
                >
                  {r.identityVerified
                    ? "Identity Verified ✓"
                    : "Identity Not Verified"}
                </span>
              )}
            </div>

            {r.pickupCode && r.status === "READY_FOR_PICKUP" && (
              <div className="mb-3 bg-blue-50 border border-blue-100 rounded-md px-3 py-2">
                <div className="flex items-center justify-between flex-wrap gap-2">
                  <span className="text-sm text-blue-800">
                    Pickup code:{" "}
                    <span className="font-mono font-bold">{r.pickupCode}</span>
                  </span>
                  {r.paid && isPickupDateReached(r.startDate) && (
                    <button
                      onClick={() => navigate(`/pickup?code=${r.pickupCode}`)}
                      className="text-sm text-blue-900 font-semibold underline underline-offset-2"
                    >
                      Go to Pickup →
                    </button>
                  )}
                </div>
                {r.paid && !isPickupDateReached(r.startDate) && (
                  <p className="text-xs text-blue-600 mt-1">
                    Save this code — pickup opens on {formatDate(r.startDate)}
                  </p>
                )}
              </div>
            )}

            <div className="flex flex-wrap gap-2">
              {r.status === "PENDING" && !r.identityVerified && (
                <>
                  <button
                    onClick={() => {
                      setVerifyingId(r.id);
                      setLicenseNumber("");
                      setDateOfBirth("");
                      setLicenseExpirationDate("");
                      setSelfieConfirmed(false);
                      setVerifyError("");
                    }}
                    className="bg-[#122A4D] hover:bg-[#0B1B33] text-white text-sm font-semibold px-4 py-1.5 rounded-md transition"
                  >
                    Verify Identity
                  </button>
                  <button
                    onClick={() => handleCancel(r.id)}
                    disabled={actionLoading}
                    className="text-sm text-red-600 hover:text-red-800 px-2 disabled:opacity-50"
                  >
                    Cancel Reservation
                  </button>
                </>
              )}

              {r.status === "PENDING" && r.identityVerified && (
                <>
                  <button
                    onClick={() => {
                      setCheckingInId(r.id);
                      setSignature("");
                      setAgreementAccepted(false);
                      setActionError("");
                    }}
                    className="bg-[#122A4D] hover:bg-[#0B1B33] text-white text-sm font-semibold px-4 py-1.5 rounded-md transition"
                  >
                    Check In
                  </button>
                  <button
                    onClick={() => handleCancel(r.id)}
                    disabled={actionLoading}
                    className="text-sm text-red-600 hover:text-red-800 px-2 disabled:opacity-50"
                  >
                    Cancel Reservation
                  </button>
                </>
              )}

              {r.status === "PENDING" && (
                <button
                  onClick={() => {
                    setModifyingId(r.id);
                    setModifyStartDate(r.startDate);
                    setModifyEndDate(r.endDate);
                    setModifyError("");
                  }}
                  className="bg-white border border-slate-300 hover:bg-slate-50 text-[#122A4D] text-sm font-semibold px-4 py-1.5 rounded-md transition"
                >
                  Modify Dates
                </button>
              )}

              {r.status === "READY_FOR_PICKUP" && !r.paid && (
                <button
                  onClick={() => {
                    setPayingId(r.id);
                    setCardNumber("");
                    setCardExpiry("");
                    setCardCvv("");
                    setCardholderName("");
                    setPaymentError("");
                  }}
                  className="bg-[#FF6B35] hover:bg-[#E85320] text-white text-sm font-semibold px-4 py-1.5 rounded-md transition"
                >
                  Pay Now
                </button>
              )}
            </div>

            {modifyingId === r.id && (
              <form
                onSubmit={(e) => handleModify(e, r.id, r.pickupTime, r.returnTime)}
                className="mt-4 pt-4 border-t border-slate-100 space-y-3"
              >
                <p className="text-xs text-slate-500">
                  Only pickup and return dates can be changed here — the existing pickup time
                  ({r.pickupTime ? formatTime(r.pickupTime) : "n/a"}) and return time
                  ({r.returnTime ? formatTime(r.returnTime) : "n/a"}) will still apply on the new dates.
                </p>
                {modifyError && (
                  <div className="text-xs text-red-700 bg-red-50 border border-red-200 rounded-md px-2 py-1.5">
                    {modifyError}
                  </div>
                )}
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-medium text-slate-700 mb-1">Pickup date</label>
                    <input
                      type="date"
                      required
                      min={todayIso()}
                      value={modifyStartDate}
                      onChange={(e) => setModifyStartDate(e.target.value)}
                      className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-slate-700 mb-1">Return date</label>
                    <input
                      type="date"
                      required
                      min={modifyStartDate}
                      value={modifyEndDate}
                      onChange={(e) => setModifyEndDate(e.target.value)}
                      className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm"
                    />
                  </div>
                </div>
                <div className="flex gap-2">
                  <button
                    type="submit"
                    disabled={actionLoading}
                    className="bg-[#122A4D] hover:bg-[#0B1B33] text-white text-sm font-semibold px-4 py-1.5 rounded-md transition disabled:opacity-50"
                  >
                    {actionLoading ? "Updating…" : "Update Dates"}
                  </button>
                  <button
                    type="button"
                    onClick={() => setModifyingId(null)}
                    className="px-3 text-sm text-slate-500 hover:text-slate-700"
                  >
                    Cancel
                  </button>
                </div>
              </form>
            )}

            {verifyingId === r.id && (
              <form
                onSubmit={(e) => handleVerifyIdentity(e, r.id)}
                className="mt-4 pt-4 border-t border-slate-100 space-y-3"
              >
                <p className="text-xs text-slate-500">
                  Simulated identity check — no real License Verification
                  Service is connected yet, but the license, age, and expiration
                  checks below are real validations.
                </p>
                {verifyError && (
                  <div className="text-xs text-red-700 bg-red-50 border border-red-200 rounded-md px-2 py-1.5">
                    {verifyError}
                  </div>
                )}
                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1">
                    Driver&apos;s license number
                  </label>
                  <input
                    required
                    value={licenseNumber}
                    onChange={(e) => setLicenseNumber(e.target.value)}
                    placeholder="e.g. AB123456"
                    className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm"
                  />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-medium text-slate-700 mb-1">
                      Date of birth
                    </label>
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
                    <label className="block text-xs font-medium text-slate-700 mb-1">
                      License expires
                    </label>
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
                  I confirm my selfie matches my license photo
                </label>
                <div className="flex gap-2">
                  <button
                    type="submit"
                    disabled={actionLoading}
                    className="bg-[#122A4D] hover:bg-[#0B1B33] text-white text-sm font-semibold px-4 py-1.5 rounded-md transition disabled:opacity-50"
                  >
                    {actionLoading ? "Verifying…" : "Verify Identity"}
                  </button>
                  <button
                    type="button"
                    onClick={() => setVerifyingId(null)}
                    className="px-3 text-sm text-slate-500 hover:text-slate-700"
                  >
                    Cancel
                  </button>
                </div>
              </form>
            )}

            {checkingInId === r.id && (
              <form
                onSubmit={(e) => handleCheckIn(e, r.id)}
                className="mt-4 pt-4 border-t border-slate-100 space-y-3"
              >
                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1">
                    Rental Agreement
                  </label>
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
                  <span>
                    I have read and agree to the Rental Agreement terms above
                  </span>
                </label>
                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1">
                    Sign by typing your full legal name (as on file:{" "}
                    {r.customerName})
                  </label>
                  <input
                    required
                    value={signature}
                    onChange={(e) => setSignature(e.target.value)}
                    placeholder="First Last"
                    className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm"
                  />
                  {signature.length > 0 && !isValidFullName(signature) && (
                    <p className="text-xs text-red-600 mt-1">
                      Please enter your full first and last name
                    </p>
                  )}
                </div>
                <div className="flex gap-2">
                  <button
                    type="submit"
                    disabled={
                      actionLoading ||
                      !agreementAccepted ||
                      !isValidFullName(signature)
                    }
                    className="bg-[#122A4D] hover:bg-[#0B1B33] text-white text-sm font-semibold py-1.5 px-4 rounded-md transition disabled:opacity-50"
                  >
                    {actionLoading ? "Submitting…" : "Sign & Check In"}
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setCheckingInId(null);
                      setAgreementAccepted(false);
                    }}
                    className="px-3 text-sm text-slate-500 hover:text-slate-700"
                  >
                    Cancel
                  </button>
                </div>
              </form>
            )}

            {payingId === r.id && (
              <form
                onSubmit={(e) => handlePay(e, r.id)}
                className="mt-4 pt-4 border-t border-slate-100 space-y-3"
              >
                {paymentError && (
                  <div className="text-xs text-red-700 bg-red-50 border border-red-200 rounded-md px-2 py-1.5">
                    {paymentError}
                  </div>
                )}
                <div className="flex gap-2">
                  {(["CREDIT_CARD", "DEBIT_CARD"] as PaymentMethod[]).map(
                    (m) => (
                      <button
                        key={m}
                        type="button"
                        onClick={() => setMethod(m)}
                        className={`flex-1 text-sm font-semibold py-1.5 rounded-md border transition ${
                          method === m
                            ? "bg-[#122A4D] text-white border-[#122A4D]"
                            : "bg-white text-slate-600 border-slate-300"
                        }`}
                      >
                        {m === "CREDIT_CARD" ? "Credit" : "Debit"}
                      </button>
                    ),
                  )}
                </div>
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="block text-xs font-medium text-slate-700">
                      Card number
                    </label>
                    {cardBrand !== "UNKNOWN" && (
                      <span
                        className={`text-xs font-bold px-2 py-0.5 rounded ${BRAND_STYLES[cardBrand]}`}
                      >
                        {BRAND_LABELS[cardBrand]}
                      </span>
                    )}
                  </div>
                  <input
                    required
                    inputMode="numeric"
                    value={cardNumber}
                    onChange={(e) =>
                      setCardNumber(formatCardNumber(e.target.value))
                    }
                    placeholder="4242 4242 4242 4242"
                    className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm font-mono"
                  />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-medium text-slate-700 mb-1">
                      Expiry (MM/YY)
                    </label>
                    <input
                      required
                      inputMode="numeric"
                      value={cardExpiry}
                      onChange={(e) =>
                        setCardExpiry(formatExpiry(e.target.value))
                      }
                      placeholder="12/28"
                      className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm font-mono"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-slate-700 mb-1">
                      CVV
                    </label>
                    <input
                      required
                      inputMode="numeric"
                      maxLength={4}
                      value={cardCvv}
                      onChange={(e) =>
                        setCardCvv(
                          e.target.value.replace(/\D/g, "").slice(0, 4),
                        )
                      }
                      placeholder="123"
                      className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm font-mono"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1">
                    Name on card
                  </label>
                  <input
                    required
                    value={cardholderName}
                    onChange={(e) => setCardholderName(e.target.value)}
                    placeholder="Jane Doe"
                    className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm"
                  />
                </div>
                <div className="flex gap-2">
                  <button
                    type="submit"
                    disabled={actionLoading}
                    className="bg-[#FF6B35] hover:bg-[#E85320] text-white text-sm font-semibold px-4 py-1.5 rounded-md transition disabled:opacity-50"
                  >
                    {actionLoading ? "Processing…" : `Pay $${r.estimatedCost}`}
                  </button>
                  <button
                    type="button"
                    onClick={() => setPayingId(null)}
                    className="px-3 text-sm text-slate-500 hover:text-slate-700"
                  >
                    Cancel
                  </button>
                </div>
              </form>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
