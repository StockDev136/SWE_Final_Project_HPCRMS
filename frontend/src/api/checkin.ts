import apiClient from "./client";
import type { RentalAgreementResponse, ReservationResponse } from "../types";

export interface VerifyIdentityPayload {
  reservationId: number;
  licenseNumber: string;
  dateOfBirth: string;
  licenseExpirationDate: string;
  selfieConfirmed: boolean;
}

export async function verifyIdentity(
  payload: VerifyIdentityPayload
): Promise<ReservationResponse> {
  const response = await apiClient.post<ReservationResponse>("/checkin/verify-identity", payload);
  return response.data;
}

export interface CheckInPayload {
  reservationId: number;
  signatureData: string;
}

export async function completeCheckIn(
  payload: CheckInPayload
): Promise<RentalAgreementResponse> {
  const response = await apiClient.post<RentalAgreementResponse>("/checkin", payload);
  return response.data;
}
