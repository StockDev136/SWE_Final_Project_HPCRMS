// sessionStorage, deliberately — this should survive back/forward
// navigation within the current tab (so returning from the confirmation
// page restores your results instead of forcing a re-search), but should
// NOT persist indefinitely across days/sessions the way localStorage would,
// since stale dates from a week-old search aren't useful to restore.
const KEY = "hpcrms_last_vehicle_search";

export interface LastVehicleSearch {
  branchId: number;
  startDate: string;
  endDate: string;
  pickupTime: string;
  returnTime: string;
  dropoffBranchId?: number;
}

export function saveLastVehicleSearch(data: LastVehicleSearch): void {
  sessionStorage.setItem(KEY, JSON.stringify(data));
}

export function getLastVehicleSearch(): LastVehicleSearch | null {
  const raw = sessionStorage.getItem(KEY);
  return raw ? JSON.parse(raw) : null;
}

export function clearLastVehicleSearch(): void {
  sessionStorage.removeItem(KEY);
}
