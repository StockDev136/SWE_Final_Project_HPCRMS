import { useEffect, useState } from "react";
import { createBranch, getBranches } from "../api/branches";
import { getErrorMessage } from "../api/errors";
import { useAuth } from "../context/AuthContext";
import type { BranchResponse } from "../types";

export default function BranchManagementPage() {
  const { user } = useAuth();
  const isAdmin = user?.role === "SYSTEM_ADMINISTRATOR";

  const [branches, setBranches] = useState<BranchResponse[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [showForm, setShowForm] = useState(false);
  const [name, setName] = useState("");
  const [address, setAddress] = useState("");
  const [city, setCity] = useState("");
  const [phone, setPhone] = useState("");
  const [formError, setFormError] = useState("");
  const [saving, setSaving] = useState(false);

  async function loadBranches() {
    setLoading(true);
    setError("");
    try {
      const data = await getBranches();
      setBranches(data);
    } catch (err) {
      setError(getErrorMessage(err, "Could not load branches"));
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadBranches();
  }, []);

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    setFormError("");
    setSaving(true);
    try {
      await createBranch({ name, address, city, phone: phone || undefined });
      setShowForm(false);
      setName("");
      setAddress("");
      setCity("");
      setPhone("");
      await loadBranches();
    } catch (err) {
      setFormError(getErrorMessage(err, "Could not add branch"));
    } finally {
      setSaving(false);
    }
  }

  return (
    <div>
      <div className="flex items-start justify-between flex-wrap gap-3 mb-6">
        <div>
          <h1 className="text-2xl font-bold text-[#122A4D] mb-1">Branches</h1>
          <p className="text-slate-500 text-sm">All HPCRMS rental locations.</p>
        </div>
        {isAdmin && (
          <button
            onClick={() => setShowForm((v) => !v)}
            className="bg-[#122A4D] hover:bg-[#0B1B33] text-white font-semibold px-4 py-2 rounded-md transition text-sm"
          >
            {showForm ? "Cancel" : "+ Add Branch"}
          </button>
        )}
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
              <label className="block text-xs font-medium text-slate-700 mb-1">Branch name</label>
              <input
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">City</label>
              <input
                required
                value={city}
                onChange={(e) => setCity(e.target.value)}
                className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm"
              />
            </div>
            <div className="sm:col-span-2">
              <label className="block text-xs font-medium text-slate-700 mb-1">Address</label>
              <input
                required
                value={address}
                onChange={(e) => setAddress(e.target.value)}
                className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">Phone (optional)</label>
              <input
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm"
              />
            </div>
          </div>
          <button
            type="submit"
            disabled={saving}
            className="bg-[#FF6B35] hover:bg-[#E85320] text-white text-sm font-semibold px-4 py-2 rounded-md transition disabled:opacity-50"
          >
            {saving ? "Adding…" : "Add Branch"}
          </button>
        </form>
      )}

      {error && (
        <div className="mb-4 text-sm text-red-700 bg-red-50 border border-red-200 rounded-md px-3 py-2">
          {error}
        </div>
      )}

      {loading ? (
        <p className="text-slate-500">Loading branches…</p>
      ) : (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {branches.map((b) => (
            <div key={b.id} className="bg-white rounded-xl shadow-sm p-5">
              <h3 className="font-bold text-[#122A4D] mb-1">{b.name}</h3>
              <p className="text-sm text-slate-500">{b.address}</p>
              <p className="text-sm text-slate-500 mb-2">{b.city}</p>
              {b.phone && <p className="text-xs text-slate-400">{b.phone}</p>}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
