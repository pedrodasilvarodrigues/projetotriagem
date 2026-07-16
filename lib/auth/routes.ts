export function defaultRouteForRole(role?: string | null) {
  if (role === "admin") return "/admin";
  if (role === "company") return "/company";
  if (role === "client") return "/client";
  return "/professional";
}
