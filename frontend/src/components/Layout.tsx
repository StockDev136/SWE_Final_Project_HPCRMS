import { Link, Outlet, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import logoFullWhite from "../assets/logo-full-white.png";

export default function Layout() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const isStaff = user?.role !== "CUSTOMER";
  const isAdmin = user?.role === "SYSTEM_ADMINISTRATOR";
  const canAssist = user?.role !== undefined && user.role !== "CUSTOMER" && user.role !== "FINANCE_DEPARTMENT";

  function handleLogout() {
    logout();
    navigate("/");
  }

  return (
    <div className="min-h-screen bg-slate-50">
      <header className="bg-[#122A4D] text-white px-6 py-3 flex items-center justify-between flex-wrap gap-3">
        <div className="flex items-center gap-6">
          <Link to={isStaff ? "/staff" : "/vehicles"}>
            <img src={logoFullWhite} alt="HPCRMS" className="h-9 w-auto" />
          </Link>
          <nav className="flex items-center gap-4 text-sm">
            {isStaff ? (
              <>
                <Link to="/staff" className="hover:text-[#FF6B35] transition">
                  Dashboard
                </Link>
                <Link to="/staff/reservations" className="hover:text-[#FF6B35] transition">
                  Reservations
                </Link>
                {canAssist && (
                  <Link to="/staff/assist" className="hover:text-[#FF6B35] transition">
                    Assist Customer
                  </Link>
                )}
                <Link to="/staff/vehicles" className="hover:text-[#FF6B35] transition">
                  Fleet
                </Link>
                <Link to="/staff/branches" className="hover:text-[#FF6B35] transition">
                  Branches
                </Link>
                {isAdmin && (
                  <Link to="/staff/employees" className="hover:text-[#FF6B35] transition">
                    Employees
                  </Link>
                )}
              </>
            ) : (
              <>
                <Link to="/vehicles" className="hover:text-[#FF6B35] transition">
                  Search Vehicles
                </Link>
                <Link to="/reservations" className="hover:text-[#FF6B35] transition">
                  My Reservations
                </Link>
                <Link to="/pickup" className="hover:text-[#FF6B35] transition">
                  Pickup
                </Link>
              </>
            )}
          </nav>
        </div>
        <div className="flex items-center gap-4 text-sm">
          <span className="text-slate-300">
            {user?.email} <span className="text-[#FF6B35] font-semibold">({user?.role})</span>
          </span>
          <button
            onClick={handleLogout}
            className="bg-white/10 hover:bg-white/20 px-3 py-1.5 rounded-md transition"
          >
            Log out
          </button>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-6 py-8">
        <Outlet />
      </main>
    </div>
  );
}
