import apiClient from "./client";
import type { BranchResponse } from "../types";

export async function getBranches(): Promise<BranchResponse[]> {
  const response = await apiClient.get<BranchResponse[]>("/branches");
  return response.data;
}

export interface CreateBranchPayload {
  name: string;
  address: string;
  city: string;
  phone?: string;
}

export async function createBranch(payload: CreateBranchPayload): Promise<BranchResponse> {
  const response = await apiClient.post<BranchResponse>("/branches", payload);
  return response.data;
}
