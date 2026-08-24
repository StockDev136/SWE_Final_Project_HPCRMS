import { useState, type FormEvent } from "react";
import { Link, useNavigate } from "react-router-dom";
import { register } from "../api/auth";
import { createReservation } from "../api/reservations";
import { getErrorMessage } from "../api/errors";
import { useAuth } from "../context/AuthContext";
import { clearPendingReservation, getPendingReservation } from "../utils/pendingReservation";

function isPasswordComplex(password: string): boolean {
  return (
    password.length >= 8 &&
    /[a-z]/.test(password) &&
    /[A-Z]/.test(password) &&
    /\d/.test(password) &&
    /[^a-zA-Z0-9]/.test(password)
  );
}

export default function RegisterPage() {
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const { login: setAuthUser } = useAuth();
  const navigate = useNavigate();

  const pending = getPendingReservation();

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError("");

    if (!isPasswordComplex(password)) {
      setError("Password does not meet the complexity requirements");
      return;
    }

    setLoading(true);
    try {
      const data = await register({ firstName, lastName, email, phone, password });
      setAuthUser(data);

      if (pending) {
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

      navigate("/vehicles");
    } catch (err) {
      setError(getErrorMessage(err, "Registration failed"));
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50 px-4 py-8">
      <div className="w-full max-w-sm">
        <Link to="/" className="inline-block mb-4 text-sm text-slate-500 hover:text-slate-700">
          ← Back to home
        </Link>
        <div className="bg-white rounded-xl shadow-md p-8">
        <h1 className="text-2xl font-bold text-[#122A4D] mb-1">Create your account</h1>
        <p className="text-slate-500 text-sm mb-6">Join HPCRMS to start renting</p>

        {pending && (
          <div className="mb-4 text-sm text-blue-800 bg-blue-50 border border-blue-200 rounded-md px-3 py-2">
            Create an account to complete your reservation for{" "}
            <span className="font-semibold">{pending.vehicleLabel}</span> ({pending.startDate} →{" "}
            {pending.endDate})
          </div>
        )}

        {error && (
          <div className="mb-4 text-sm text-red-700 bg-red-50 border border-red-200 rounded-md px-3 py-2">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">First name</label>
              <input
                required
                value={firstName}
                onChange={(e) => setFirstName(e.target.value)}
                className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#FF6B35]"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Last name</label>
              <input
                required
                value={lastName}
                onChange={(e) => setLastName(e.target.value)}
                className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#FF6B35]"
              />
            </div>
          </div>
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
            <label className="block text-sm font-medium text-slate-700 mb-1">Phone (optional)</label>
            <input
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#FF6B35]"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Password</label>
            <input
              type="password"
              required
              minLength={8}
              pattern="^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[^a-zA-Z0-9]).{8,}$"
              title="At least 8 characters, with an uppercase letter, a lowercase letter, a number, and a special character"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#FF6B35]"
            />
            <ul className="text-xs mt-1 space-y-0.5">
              <li className={password.length >= 8 ? "text-emerald-600" : "text-slate-400"}>
                ✓ At least 8 characters
              </li>
              <li className={/[A-Z]/.test(password) ? "text-emerald-600" : "text-slate-400"}>
                ✓ One uppercase letter
              </li>
              <li className={/[a-z]/.test(password) ? "text-emerald-600" : "text-slate-400"}>
                ✓ One lowercase letter
              </li>
              <li className={/\d/.test(password) ? "text-emerald-600" : "text-slate-400"}>
                ✓ One number
              </li>
              <li className={/[^a-zA-Z0-9]/.test(password) ? "text-emerald-600" : "text-slate-400"}>
                ✓ One special character
              </li>
            </ul>
          </div>
          <button
            type="submit"
            disabled={loading}
            className="w-full bg-[#122A4D] hover:bg-[#0B1B33] text-white font-semibold py-2 rounded-md transition disabled:opacity-50"
          >
            {loading ? "Creating account…" : "Register"}
          </button>
        </form>

        <p className="mt-6 text-center text-sm text-slate-500">
          Already have an account?{" "}
          <Link to="/login" className="text-[#FF6B35] font-medium hover:underline">
            Log in
          </Link>
        </p>
        </div>
      </div>
    </div>
  );
}
