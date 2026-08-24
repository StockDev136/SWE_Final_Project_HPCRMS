import apiClient from "./client";
import type { ReservationResponse, ReservationStatus } from "../types";

export interface CreateReservationPayload {
  vehicleId: number;
  startDate: string;
  endDate: string;
  pickupTime: string;
  returnTime: string;
  dropoffBranchId?: number;
}

export async function createReservation(
  payload: CreateReservationPayload,
): Promise<ReservationResponse> {
  const response = await apiClient.post<ReservationResponse>(
    "/reservations",
    payload,
  );
  return response.data;
}

export interface AssistedReservationPayload {
  customerId: number;
  vehicleId: number;
  startDate: string;
  endDate: string;
  pickupTime: string;
  returnTime: string;
  dropoffBranchId?: number;
}

export async function createReservationForCustomer(
  payload: AssistedReservationPayload,
): Promise<ReservationResponse> {
  const response = await apiClient.post<ReservationResponse>(
    "/reservations/assist",
    payload,
  );
  return response.data;
}

export async function getMyReservations(): Promise<ReservationResponse[]> {
  const response =
    await apiClient.get<ReservationResponse[]>("/reservations/me");
  return response.data;
}

export async function getAllReservations(
  status?: ReservationStatus,
  branchId?: number,
): Promise<ReservationResponse[]> {
  const response = await apiClient.get<ReservationResponse[]>("/reservations", {
    params: {
      ...(status ? { status } : {}),
      ...(branchId ? { branchId } : {}),
    },
  });
  return response.data;
}

export async function getReservationById(
  id: number,
): Promise<ReservationResponse> {
  const response = await apiClient.get<ReservationResponse>(
    `/reservations/${id}`,
  );
  return response.data;
}

export async function cancelReservation(
  id: number,
): Promise<ReservationResponse> {
  const response = await apiClient.delete<ReservationResponse>(
    `/reservations/${id}`,
  );
  return response.data;
}

export interface ModifyReservationPayload {
  startDate: string;
  endDate: string;
}

export async function modifyReservation(
  id: number,
  payload: ModifyReservationPayload,
): Promise<ReservationResponse> {
  const response = await apiClient.put<ReservationResponse>(
    `/reservations/${id}`,
    payload,
  );
  return response.data;
}
