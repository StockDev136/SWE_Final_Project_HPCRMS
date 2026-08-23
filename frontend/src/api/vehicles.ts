import apiClient from "./client";
import type { VehicleCategory, VehicleResponse, VehicleStatus } from "../types";

export async function searchVehicles(
  branchId: number,
  startDate: string,
  endDate: string,
  category?: VehicleCategory
): Promise<VehicleResponse[]> {
  const response = await apiClient.get<VehicleResponse[]>("/vehicles/search", {
    params: { branchId, startDate, endDate, ...(category ? { category } : {}) },
  });
  return response.data;
}

export async function getAllVehicles(branchId?: number): Promise<VehicleResponse[]> {
  const response = await apiClient.get<VehicleResponse[]>("/vehicles", {
    params: branchId ? { branchId } : {},
  });
  return response.data;
}

export interface CreateVehiclePayload {
  licensePlate: string;
  make: string;
  model: string;
  category: VehicleCategory;
  branchId: number;
  dailyRate: number;
  imageUrl?: string;
}

export async function createVehicle(payload: CreateVehiclePayload): Promise<VehicleResponse> {
  const response = await apiClient.post<VehicleResponse>("/vehicles", payload);
  return response.data;
}

export async function updateVehicleStatus(
  id: number,
  status: VehicleStatus
): Promise<VehicleResponse> {
  const response = await apiClient.patch<VehicleResponse>(`/vehicles/${id}/status`, { status });
  return response.data;
}
