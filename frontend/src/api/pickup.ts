import apiClient from "./client";
import type { PickupResponse } from "../types";

export async function pickupVehicle(pickupCode: string): Promise<PickupResponse> {
  const response = await apiClient.post<PickupResponse>("/pickup", { pickupCode });
  return response.data;
}
