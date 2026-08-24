import { Navigate, Outlet } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

const ALLOWED_ROLES = ["FLEET_MANAGER", "SYSTEM_ADMINISTRATOR"];

export default function MaintenanceRoute() {
  const { user } = useAuth();
  return user?.role && ALLOWED_ROLES.includes(user.role) ? <Outlet /> : <Navigate to="/staff" replace />;
}
