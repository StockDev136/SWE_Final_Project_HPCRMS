import { Navigate, Outlet } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

const ALLOWED_ROLES = ["BRANCH_MANAGER", "FLEET_MANAGER", "FINANCE_DEPARTMENT", "SYSTEM_ADMINISTRATOR"];

export default function ReportsRoute() {
  const { user } = useAuth();
  return user?.role && ALLOWED_ROLES.includes(user.role) ? <Outlet /> : <Navigate to="/staff" replace />;
}
