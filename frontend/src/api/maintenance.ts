import apiClient from "./client";
import type { MaintenanceStatus } from "../types";

export interface MaintenanceRecord {
  id: number;
  vehicleId: number;
  vehicleDescription: string;
  scheduledDate: string;
  completedDate: string | null;
  description: string;
  status: MaintenanceStatus;
}

export interface ScheduleMaintenancePayload {
  vehicleId: number;
  scheduledDate: string;
  description: string;
}
export async function scheduleMaintenance(
  payload: ScheduleMaintenancePayload
): Promise<MaintenanceRecord> {
  const response = await apiClient.post<MaintenanceRecord>("/maintenance", payload);
  return response.data;
}

export async function startMaintenance(id: number): Promise<MaintenanceRecord> {
  const response = await apiClient.patch<MaintenanceRecord>(`/maintenance/${id}/start`, {});
  return response.data;
}

export async function completeMaintenance(
  id: number,
  completionNotes?: string
): Promise<MaintenanceRecord> {
  const response = await apiClient.patch<MaintenanceRecord>(`/maintenance/${id}/complete`, {
    completionNotes,
  });
  return response.data;
}

export async function getMaintenanceRecords(
  status?: MaintenanceStatus,
  vehicleId?: number
): Promise<MaintenanceRecord[]> {
  const response = await apiClient.get<MaintenanceRecord[]>("/maintenance", {
    params: { ...(status ? { status } : {}), ...(vehicleId ? { vehicleId } : {}) },
  });
  return response.data;
}
