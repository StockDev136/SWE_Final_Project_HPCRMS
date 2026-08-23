import apiClient from "./client";
import type { PaymentMethod, PaymentResponse } from "../types";

export interface ProcessPaymentPayload {
  reservationId: number;
  method: PaymentMethod;
}

export async function processPayment(
  payload: ProcessPaymentPayload
): Promise<PaymentResponse> {
  const response = await apiClient.post<PaymentResponse>("/payments", payload);
  return response.data;
}
