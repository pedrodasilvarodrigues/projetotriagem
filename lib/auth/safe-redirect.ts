export function safeInternalRedirect(value: FormDataEntryValue | string | null | undefined, fallback: string) {
  const path = String(value ?? "").trim();
  if (!path.startsWith("/") || path.startsWith("//") || path.includes("\\")) return fallback;
  return path;
}

export function appendSearchParam(path: string, key: string, value: string | null) {
  if (!value) return path;
  const separator = path.includes("?") ? "&" : "?";
  return `${path}${separator}${encodeURIComponent(key)}=${encodeURIComponent(value)}`;
}
