const KEY = "hpcrms_pending_reservation";

export interface PendingReservation {
  vehicleId: number;
  startDate: string;
  endDate: string;
  pickupTime: string;
  returnTime: string;
  dropoffBranchId?: number;
  vehicleLabel: string;
}

export function savePendingReservation(data: PendingReservation): void {
  localStorage.setItem(KEY, JSON.stringify(data));
}

export function getPendingReservation(): PendingReservation | null {
  const raw = localStorage.getItem(KEY);
  return raw ? JSON.parse(raw) : null;
}

export function clearPendingReservation(): void {
  localStorage.removeItem(KEY);
}
