import apiClient from "./client";
import type { EmployeeResponse, EmployeeRole } from "../types";

export interface CreateEmployeePayload {
  firstName: string;
  lastName: string;
  email: string;
  password: string;
  role: EmployeeRole;
  branchId?: number;
}

export async function getEmployees(): Promise<EmployeeResponse[]> {
  const response = await apiClient.get<EmployeeResponse[]>("/employees");
  return response.data;
}

export async function createEmployee(
  payload: CreateEmployeePayload,
): Promise<EmployeeResponse> {
  const response = await apiClient.post<EmployeeResponse>(
    "/employees",
    payload,
  );
  return response.data;
}

export async function deactivateEmployee(
  id: number,
): Promise<EmployeeResponse> {
  const response = await apiClient.patch<EmployeeResponse>(
    `/employees/${id}/deactivate`,
    {},
  );
  return response.data;
}

export async function reactivateEmployee(
  id: number,
): Promise<EmployeeResponse> {
  const response = await apiClient.patch<EmployeeResponse>(
    `/employees/${id}/reactivate`,
    {},
  );
  return response.data;
}
