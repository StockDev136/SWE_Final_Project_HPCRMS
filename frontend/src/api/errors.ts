import { isAxiosError } from "axios";
import type { ApiErrorResponse } from "../types";

export function getErrorMessage(err: unknown, fallback: string): string {
  if (isAxiosError<ApiErrorResponse>(err) && err.response?.data?.message) {
    return err.response.data.message;
  }
  return fallback;
}
