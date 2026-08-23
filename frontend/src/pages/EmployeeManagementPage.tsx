import { useEffect, useState } from "react";
import { getBranches } from "../api/branches";
import { createEmployee, deactivateEmployee, getEmployees, reactivateEmployee } from "../api/employees";
import { getErrorMessage } from "../api/errors";
import type { BranchResponse, EmployeeResponse, EmployeeRole } from "../types";

const EMAIL_DOMAIN = "@hpcrms.com";

const ROLES: EmployeeRole[] = [
  "RENTAL_AGENT",
  "BRANCH_MANAGER",
  "FLEET_MANAGER",
  "FINANCE_DEPARTMENT",
  "SYSTEM_ADMINISTRATOR",
];

export default function EmployeeManagementPage() {
  const [branches, setBranches] = useState<BranchResponse[]>([]);
  const [employees, setEmployees] = useState<EmployeeResponse[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [showForm, setShowForm] = useState(false);
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [emailLocalPart, setEmailLocalPart] = useState("");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState<EmployeeRole>("RENTAL_AGENT");
  const [branchId, setBranchId] = useState<number | "">("");
  const [formError, setFormError] = useState("");
  const [saving, setSaving] = useState(false);

  const [deactivatingId, setDeactivatingId] = useState<number | null>(null);

  async function loadEmployees() {
    setLoading(true);
    setError("");
    try {
      const data = await getEmployees();
      setEmployees(data);
    } catch (err) {
      setError(getErrorMessage(err, "Could not load employees"));
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    getBranches().then(setBranches);
    loadEmployees();
  }, []);

  function sanitizeLocalPart(value: string): string {
    // Guard against someone pasting a full email out of habit — strip
    // anything from @ onward and any characters an email local-part
    // shouldn't have, since the domain is appended automatically.
    return value.split("@")[0].replace(/\s/g, "");
  }

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    setFormError("");

    const trimmed = emailLocalPart.trim().toLowerCase();
    if (!trimmed) {
      setFormError("Enter a username for the employee's email");
      return;
    }

    setSaving(true);
    try {
      await createEmployee({
        firstName,
        lastName,
        email: `${trimmed}${EMAIL_DOMAIN}`,
        password,
        role,
        branchId: branchId === "" ? undefined : branchId,
      });
      setShowForm(false);
      setFirstName("");
      setLastName("");
      setEmailLocalPart("");
      setPassword("");
      setRole("RENTAL_AGENT");
      setBranchId("");
      await loadEmployees();
    } catch (err) {
      setFormError(getErrorMessage(err, "Could not create employee"));
    } finally {
      setSaving(false);
    }
  }

  async function handleDeactivate(id: number) {
    setDeactivatingId(id);
    setError("");
    try {
      await deactivateEmployee(id);
      await loadEmployees();
    } catch (err) {
      setError(getErrorMessage(err, "Could not deactivate employee"));
    } finally {
      setDeactivatingId(null);
    }
  }

  async function handleReactivate(id: number) {
    setDeactivatingId(id);
    setError("");
    try {
      await reactivateEmployee(id);
      await loadEmployees();
    } catch (err) {
      setError(getErrorMessage(err, "Could not reactivate employee"));
    } finally {
      setDeactivatingId(null);
    }
  }

  return (
    <div>
      <div className="flex items-start justify-between flex-wrap gap-3 mb-6">
        <div>
          <h1 className="text-2xl font-bold text-[#122A4D] mb-1">Employees</h1>
          <p className="text-slate-500 text-sm">Create staff accounts and manage access.</p>
        </div>
        <button
          onClick={() => setShowForm((v) => !v)}
          className="bg-[#122A4D] hover:bg-[#0B1B33] text-white font-semibold px-4 py-2 rounded-md transition text-sm"
        >
          {showForm ? "Cancel" : "+ Add Employee"}
        </button>
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
              <label className="block text-xs font-medium text-slate-700 mb-1">First name</label>
              <input
                required
                value={firstName}
                onChange={(e) => setFirstName(e.target.value)}
                className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">Last name</label>
              <input
                required
                value={lastName}
                onChange={(e) => setLastName(e.target.value)}
                className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">Email</label>
              <div className="flex items-stretch rounded-md border border-slate-300 overflow-hidden focus-within:ring-2 focus-within:ring-[#FF6B35]">
                <input
                  required
                  value={emailLocalPart}
                  onChange={(e) => setEmailLocalPart(sanitizeLocalPart(e.target.value))}
                  placeholder="e.g. jane.doe"
                  className="flex-1 min-w-0 px-3 py-2 text-sm border-0 focus:outline-none"
                />
                <span className="flex items-center px-3 text-sm text-slate-500 bg-slate-50 border-l border-slate-300 whitespace-nowrap">
                  {EMAIL_DOMAIN}
                </span>
              </div>
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">Temporary password</label>
              <input
                type="password"
                required
                minLength={8}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">Role</label>
              <select
                value={role}
                onChange={(e) => setRole(e.target.value as EmployeeRole)}
                className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm"
              >
                {ROLES.map((r) => (
                  <option key={r} value={r}>
                    {r}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">Branch (optional)</label>
              <select
                value={branchId}
                onChange={(e) => setBranchId(e.target.value === "" ? "" : Number(e.target.value))}
                className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm"
              >
                <option value="">No specific branch</option>
                {branches.map((b) => (
                  <option key={b.id} value={b.id}>
                    {b.name}
                  </option>
                ))}
              </select>
            </div>
          </div>
          <button
            type="submit"
            disabled={saving}
            className="bg-[#FF6B35] hover:bg-[#E85320] text-white text-sm font-semibold px-4 py-2 rounded-md transition disabled:opacity-50"
          >
            {saving ? "Creating…" : "Create Employee"}
          </button>
        </form>
      )}

      {error && (
        <div className="mb-4 text-sm text-red-700 bg-red-50 border border-red-200 rounded-md px-3 py-2">
          {error}
        </div>
      )}

      {loading ? (
        <p className="text-slate-500">Loading employees…</p>
      ) : (
        <div className="bg-white rounded-xl shadow-sm overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-slate-50 text-slate-500 text-xs uppercase">
              <tr>
                <th className="text-left px-4 py-3">Name</th>
                <th className="text-left px-4 py-3">Email</th>
                <th className="text-left px-4 py-3">Role</th>
                <th className="text-left px-4 py-3">Branch</th>
                <th className="text-left px-4 py-3">Status</th>
                <th className="text-left px-4 py-3"></th>
              </tr>
            </thead>
            <tbody>
              {employees.map((emp) => (
                <tr key={emp.id} className="border-t border-slate-100">
                  <td className="px-4 py-3 font-semibold text-[#122A4D]">
                    {emp.firstName} {emp.lastName}
                  </td>
                  <td className="px-4 py-3">{emp.email}</td>
                  <td className="px-4 py-3 text-xs">{emp.role}</td>
                  <td className="px-4 py-3">{emp.branchName ?? "—"}</td>
                  <td className="px-4 py-3">
                    <span
                      className={`text-xs font-semibold px-2.5 py-1 rounded-full ${
                        emp.active ? "bg-emerald-100 text-emerald-800" : "bg-red-100 text-red-700"
                      }`}
                    >
                      {emp.active ? "Active" : "Deactivated"}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    {emp.active ? (
                      <button
                        onClick={() => handleDeactivate(emp.id)}
                        disabled={deactivatingId === emp.id}
                        className="text-xs text-red-600 hover:text-red-800 font-semibold disabled:opacity-50"
                      >
                        Deactivate
                      </button>
                    ) : (
                      <button
                        onClick={() => handleReactivate(emp.id)}
                        disabled={deactivatingId === emp.id}
                        className="text-xs text-emerald-600 hover:text-emerald-800 font-semibold disabled:opacity-50"
                      >
                        Reactivate
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {employees.length === 0 && (
            <p className="text-slate-500 text-sm px-4 py-6 text-center">No employees found.</p>
          )}
        </div>
      )}
    </div>
  );
}
