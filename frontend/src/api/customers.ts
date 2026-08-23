import apiClient from "./client";
import type { CustomerResponse } from "../types";

export async function searchCustomers(term: string): Promise<CustomerResponse[]> {
  const response = await apiClient.get<CustomerResponse[]>("/customers/search", {
    params: { term },
  });
  return response.data;
}
