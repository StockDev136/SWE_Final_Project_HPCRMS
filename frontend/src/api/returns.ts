import apiClient from "./client";
import type { ReturnResponse } from "../types";

export interface ReturnVehiclePayload {
  reservationId: number;
  mileage: number;
  fuelLevel: number;
  conditionNotes?: string;
  vehicleIssue?: boolean;
}

export async function returnVehicle(payload: ReturnVehiclePayload): Promise<ReturnResponse> {
  const response = await apiClient.post<ReturnResponse>("/return", payload);
  return response.data;
}
