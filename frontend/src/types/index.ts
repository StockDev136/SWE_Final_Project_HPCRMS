// ---------- Auth ----------
export interface RegisterRequest {
  firstName: string;
  lastName: string;
  email: string;
  phone?: string;
  password: string;
}

export interface LoginRequest {
  email: string;
  password: string;
}

export interface AuthResponse {
  token: string;
  tokenType: string;
  email: string;
  role: string;
}

// ---------- Vehicle ----------
export type VehicleCategory =
  | "ECONOMY"
  | "COMPACT"
  | "SEDAN"
  | "SUV"
  | "TRUCK"
  | "LUXURY"
  | "VAN";

export type VehicleStatus =
  | "AVAILABLE"
  | "RESERVED"
  | "RENTED"
  | "MAINTENANCE"
  | "UNAVAILABLE";

export type MaintenanceStatus = "SCHEDULED" | "IN_PROGRESS" | "COMPLETED";

export interface VehicleResponse {
  id: number;
  licensePlate: string;
  make: string;
  model: string;
  category: VehicleCategory;
  branchName: string;
  dailyRate: number;
  status: VehicleStatus;
  mileage: number;
  imageUrl: string | null;
  parkingStall: string | null;
}

// ---------- Reservation ----------
export type ReservationStatus =
  | "PENDING"
  | "READY_FOR_PICKUP"
  | "ACTIVE_RENTAL"
  | "COMPLETED"
  | "CANCELLED";

export interface ReservationResponse {
  id: number;
  customerId: number;
  customerName: string;
  vehicle: VehicleResponse | null;
  pickupBranchName: string;
  dropoffBranchName: string | null;
  startDate: string;
  endDate: string;
  pickupTime: string | null;
  returnTime: string | null;
  estimatedCost: number;
  finalCost: number | null;
  status: ReservationStatus;
  paid: boolean;
  pickupCode: string | null;
  identityVerified: boolean;
}

// ---------- Branch ----------
export interface BranchResponse {
  id: number;
  name: string;
  address: string;
  city: string;
  phone: string | null;
}

// ---------- API error shape (matches GlobalExceptionHandler.ErrorResponse) ----------
export interface ApiErrorResponse {
  timestamp: string;
  status: number;
  error: string;
  message: string;
}

// ---------- RentalAgreement (Check-In) ----------
export interface RentalAgreementResponse {
  id: number;
  reservationId: number;
  contractText: string;
  signedDate: string;
}

// ---------- Payment ----------
export type PaymentMethod = "CREDIT_CARD" | "DEBIT_CARD";
export type PaymentStatus = "PENDING" | "COMPLETED" | "FAILED" | "REFUNDED";

export interface PaymentResponse {
  id: number;
  reservationId: number;
  amount: number;
  method: PaymentMethod;
  status: PaymentStatus;
  gatewayTransactionId: string;
  paymentDate: string;
}

// ---------- Pickup ----------
export interface PickupResponse {
  reservationId: number;
  status: ReservationStatus;
  vehicleLicensePlate: string;
  vehicleMake: string;
  vehicleModel: string;
  parkingStall: string | null;
  pickupBranchName: string;
  pickupBranchAddress: string;
  currentLatitude: number | null;
  currentLongitude: number | null;
  instructions: string;
}

// ---------- Employee ----------
export type EmployeeRole =
  | "RENTAL_AGENT"
  | "BRANCH_MANAGER"
  | "FLEET_MANAGER"
  | "FINANCE_DEPARTMENT"
  | "SYSTEM_ADMINISTRATOR";

export interface EmployeeResponse {
  id: number;
  firstName: string;
  lastName: string;
  email: string;
  role: EmployeeRole;
  branchName: string | null;
  mfaEnabled: boolean;
  active: boolean;
}

// ---------- Customer (staff-facing) ----------
export interface CustomerResponse {
  id: number;
  firstName: string;
  lastName: string;
  email: string;
  phone: string | null;
  identityVerified: boolean;
}

// ---------- Return ----------
export interface ReturnResponse {
  reservationId: number;
  finalCost: number;
  returnedToBranchName: string;
  finalMileage: number;
  earlyReturn: boolean;
  prorated: boolean;
}
