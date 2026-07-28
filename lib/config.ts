const DEFAULT_API_URL = "https://echosense-backend-75h3.onrender.com";

export const API_URL = (
  process.env.NEXT_PUBLIC_API_URL?.trim() || DEFAULT_API_URL
).replace(/\/+$/, "");
