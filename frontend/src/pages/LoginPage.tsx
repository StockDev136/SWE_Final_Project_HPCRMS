import { useState, type FormEvent } from "react";
import { Link, useNavigate } from "react-router-dom";
import { login } from "../api/auth";
import { createReservation } from "../api/reservations";
import { getErrorMessage } from "../api/errors";
import { useAuth } from "../context/AuthContext";
import { clearPendingReservation, getPendingReservation } from "../utils/pendingReservation";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const { login: setAuthUser } = useAuth();
  const navigate = useNavigate();

  const pending = getPendingReservation();

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const data = await login({ email, password });
      setAuthUser(data);

      if (pending && data.role === "CUSTOMER") {
        try {
          await createReservation({
            vehicleId: pending.vehicleId,
            startDate: pending.startDate,
            endDate: pending.endDate,
            pickupTime: pending.pickupTime,
            returnTime: pending.returnTime,
            dropoffBranchId: pending.dropoffBranchId,
          });
          clearPendingReservation();
          navigate("/reservations");
          return;
        } catch (pendingErr) {
          // Do NOT silently drop this — a stale pickup time (time passed
          // while the user was logging in) or the vehicle being taken by
          // someone else are both real, explainable failures. Carry the
          // actual reason forward so the search page can show it.
          clearPendingReservation();
          navigate("/vehicles", {
            state: {
              pendingReservationError: getErrorMessage(
                pendingErr,
                "We couldn't complete your reservation automatically — please search and reserve again."
              ),
            },
          });
          return;
        }
      }

      navigate(data.role === "CUSTOMER" ? "/vehicles" : "/staff");
    } catch (err) {
      setError(getErrorMessage(err, "Invalid email or password"));
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50 px-4">
      <div className="w-full max-w-sm bg-white rounded-xl shadow-md p-8">
        <h1 className="text-2xl font-bold text-[#122A4D] mb-1">Welcome back</h1>
        <p className="text-slate-500 text-sm mb-6">Log in to your HPCRMS account</p>

        {pending && (
          <div className="mb-4 text-sm text-blue-800 bg-blue-50 border border-blue-200 rounded-md px-3 py-2">
            Log in to complete your reservation for <span className="font-semibold">{pending.vehicleLabel}</span>{" "}
            ({pending.startDate} → {pending.endDate})
          </div>
        )}

        {error && (
          <div className="mb-4 text-sm text-red-700 bg-red-50 border border-red-200 rounded-md px-3 py-2">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Email</label>
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#FF6B35]"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Password</label>
            <input
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#FF6B35]"
            />
          </div>
          <button
            type="submit"
            disabled={loading}
            className="w-full bg-[#122A4D] hover:bg-[#0B1B33] text-white font-semibold py-2 rounded-md transition disabled:opacity-50"
          >
            {loading ? "Logging in…" : "Log In"}
          </button>
        </form>

        <p className="mt-6 text-center text-sm text-slate-500">
          Don&apos;t have an account?{" "}
          <Link to="/register" className="text-[#FF6B35] font-medium hover:underline">
            Register
          </Link>
        </p>
      </div>
    </div>
  );
}
