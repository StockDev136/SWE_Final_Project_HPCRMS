import { Navigate, Route, Routes } from "react-router-dom";
import LandingPage from "./pages/LandingPage";
import LoginPage from "./pages/LoginPage";
import RegisterPage from "./pages/RegisterPage";
import ConfirmReservationPage from "./pages/ConfirmReservationPage";
import VehiclesPage from "./pages/VehiclesPage";
import ReservationsPage from "./pages/ReservationsPage";
import PickupPage from "./pages/PickupPage";
import StaffDashboardPage from "./pages/StaffDashboardPage";
import VehicleManagementPage from "./pages/VehicleManagementPage";
import BranchManagementPage from "./pages/BranchManagementPage";
import EmployeeManagementPage from "./pages/EmployeeManagementPage";
import StaffReservationsPage from "./pages/StaffReservationsPage";
import StaffReservationDetailPage from "./pages/StaffReservationDetailPage";
import AssistReservationPage from "./pages/AssistReservationPage";
import ReportsPage from "./pages/ReportsPage";
import MaintenancePage from "./pages/MaintenancePage";
import ProtectedRoute from "./components/ProtectedRoute";
import StaffRoute from "./components/StaffRoute";
import AdminRoute from "./components/AdminRoute";
import ReportsRoute from "./components/ReportsRoute";
import MaintenanceRoute from "./components/MaintenanceRoute";
import Layout from "./components/Layout";

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<LandingPage />} />
      <Route path="/login" element={<LoginPage />} />
      <Route path="/register" element={<RegisterPage />} />
      <Route path="/confirm-reservation" element={<ConfirmReservationPage />} />

      <Route element={<ProtectedRoute />}>
        <Route element={<Layout />}>
          {/* Customer routes */}
          <Route path="/vehicles" element={<VehiclesPage />} />
          <Route path="/reservations" element={<ReservationsPage />} />
          <Route path="/pickup" element={<PickupPage />} />

          {/* Staff routes */}
          <Route element={<StaffRoute />}>
            <Route path="/staff" element={<StaffDashboardPage />} />
            <Route path="/staff/vehicles" element={<VehicleManagementPage />} />
            <Route path="/staff/branches" element={<BranchManagementPage />} />
            <Route path="/staff/reservations" element={<StaffReservationsPage />} />
            <Route path="/staff/reservations/:id" element={<StaffReservationDetailPage />} />
            <Route path="/staff/assist" element={<AssistReservationPage />} />

            <Route element={<AdminRoute />}>
              <Route path="/staff/employees" element={<EmployeeManagementPage />} />
            </Route>

            <Route element={<ReportsRoute />}>
              <Route path="/staff/reports" element={<ReportsPage />} />
            </Route>

            <Route element={<MaintenanceRoute />}>
              <Route path="/staff/maintenance" element={<MaintenancePage />} />
            </Route>
          </Route>
        </Route>
      </Route>

      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
