const DEFAULT_API_URL = "https://echosense-backend-75h3.onrender.com";

export function normalizeApiUrl(value: string): string {
  return value.trim().replace(/\/+$/, "");
}

export const API_URL = normalizeApiUrl(
  process.env.NEXT_PUBLIC_API_URL?.trim() || DEFAULT_API_URL
);
