import { Navigate, Outlet } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

export default function StaffRoute() {
  const { user } = useAuth();
  const isStaff = user?.role !== "CUSTOMER";
  return isStaff ? <Outlet /> : <Navigate to="/vehicles" replace />;
}
