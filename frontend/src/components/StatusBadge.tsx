import type { ReservationStatus } from "../types";

const STYLES: Record<ReservationStatus, string> = {
  PENDING: "bg-amber-100 text-amber-800",
  READY_FOR_PICKUP: "bg-blue-100 text-blue-800",
  ACTIVE_RENTAL: "bg-emerald-100 text-emerald-800",
  COMPLETED: "bg-slate-200 text-slate-700",
  CANCELLED: "bg-red-100 text-red-700",
};

const LABELS: Record<ReservationStatus, string> = {
  PENDING: "Pending Check-In",
  READY_FOR_PICKUP: "Ready for Pickup",
  ACTIVE_RENTAL: "Active Rental",
  COMPLETED: "Completed",
  CANCELLED: "Cancelled",
};

export default function StatusBadge({ status }: { status: ReservationStatus }) {
  return (
    <span className={`inline-block px-2.5 py-1 rounded-full text-xs font-semibold ${STYLES[status]}`}>
      {LABELS[status]}
    </span>
  );
}
