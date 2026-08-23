import { useState, type FormEvent } from "react";
import { useSearchParams } from "react-router-dom";
import { pickupVehicle } from "../api/pickup";
import { getErrorMessage } from "../api/errors";
import type { PickupResponse } from "../types";

export default function PickupPage() {
  const [searchParams] = useSearchParams();
  const [code, setCode] = useState(searchParams.get("code") ?? "");
  const [result, setResult] = useState<PickupResponse | null>(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError("");
    setResult(null);
    setLoading(true);
    try {
      const data = await pickupVehicle(code);
      setResult(data);
    } catch (err) {
      setError(getErrorMessage(err, "Invalid or expired pickup code"));
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="max-w-md">
      <h1 className="text-2xl font-bold text-[#122A4D] mb-2">Vehicle Pickup</h1>
      <p className="text-slate-500 text-sm mb-6">
        Enter the pickup code from your checked-in reservation to release your vehicle.
      </p>

      <form onSubmit={handleSubmit} className="bg-white rounded-xl shadow-sm p-5 space-y-4">
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">Pickup code</label>
          <input
            required
            value={code}
            onChange={(e) => setCode(e.target.value.toUpperCase())}
            placeholder="e.g. A1B2C3D4"
            className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm font-mono tracking-wider focus:outline-none focus:ring-2 focus:ring-[#FF6B35]"
          />
        </div>

        {error && (
          <div className="text-sm text-red-700 bg-red-50 border border-red-200 rounded-md px-3 py-2">
            {error}
          </div>
        )}

        <button
          type="submit"
          disabled={loading}
          className="w-full bg-[#122A4D] hover:bg-[#0B1B33] text-white font-semibold py-2 rounded-md transition disabled:opacity-50"
        >
          {loading ? "Checking…" : "Pick Up Vehicle"}
        </button>
      </form>

      {result && (
        <div className="mt-6 bg-emerald-50 border border-emerald-200 rounded-xl p-5">
          <h2 className="font-bold text-emerald-900 mb-1">Vehicle Released!</h2>
          <p className="text-sm text-emerald-800 mb-3">{result.instructions}</p>
          <dl className="text-sm text-emerald-900 space-y-1">
            <div className="flex justify-between">
              <dt className="text-emerald-700">Vehicle</dt>
              <dd className="font-semibold">
                {result.vehicleMake} {result.vehicleModel} ({result.vehicleLicensePlate})
              </dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-emerald-700">Branch</dt>
              <dd className="font-semibold">{result.pickupBranchName}</dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-emerald-700">Address</dt>
              <dd className="font-semibold">{result.pickupBranchAddress}</dd>
            </div>
          </dl>
        </div>
      )}
    </div>
  );
}
