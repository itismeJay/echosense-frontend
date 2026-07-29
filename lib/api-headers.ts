export function buildApiHeaders(
  token?: string,
  initialHeaders?: HeadersInit
): Headers {
  const headers = new Headers(initialHeaders);
  if (token) headers.set("Authorization", `Bearer ${token}`);
  return headers;
}
