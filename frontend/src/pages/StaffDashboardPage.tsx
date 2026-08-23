import { Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

export default function StaffDashboardPage() {
  const { user } = useAuth();
  const isAdmin = user?.role === "SYSTEM_ADMINISTRATOR";
  const canAssist = user?.role !== undefined && user.role !== "CUSTOMER" && user.role !== "FINANCE_DEPARTMENT";

  const cards = [
    {
      to: "/staff/reservations",
      title: "Reservations",
      description: "See every current and active reservation across the system.",
    },
    ...(canAssist
      ? [
          {
            to: "/staff/assist",
            title: "Assist a Customer",
            description: "Look up a customer and create a reservation on their behalf.",
          },
        ]
      : []),
    {
      to: "/staff/vehicles",
      title: "Fleet Management",
      description: "Browse the fleet, add vehicles, and update their status.",
    },
    {
      to: "/staff/branches",
      title: "Branches",
      description: "View branch locations and add new ones.",
    },
    ...(isAdmin
      ? [
          {
            to: "/staff/employees",
            title: "Employees",
            description: "Create staff accounts, assign roles, and deactivate access.",
          },
        ]
      : []),
  ];

  return (
    <div>
      <h1 className="text-2xl font-bold text-[#122A4D] mb-1">Staff Dashboard</h1>
      <p className="text-slate-500 text-sm mb-6">
        Signed in as <span className="font-semibold">{user?.email}</span> ({user?.role})
      </p>

      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {cards.map((c) => (
          <Link
            key={c.to}
            to={c.to}
            className="bg-white rounded-xl shadow-sm p-5 hover:shadow-md transition block"
          >
            <h3 className="font-bold text-[#122A4D] text-lg mb-1">{c.title}</h3>
            <p className="text-sm text-slate-500">{c.description}</p>
          </Link>
        ))}
      </div>
    </div>
  );
}
