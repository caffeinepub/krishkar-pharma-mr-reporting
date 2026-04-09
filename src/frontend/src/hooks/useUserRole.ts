import { getSession } from "../lib/sessionManager";

export type AppRole = "admin" | "user" | "rsm" | "asm" | "guest" | null;

function mapRoleString(roleStr: string | null | undefined): AppRole {
  if (!roleStr) return "guest";
  const r = roleStr.toLowerCase();
  if (r === "admin") return "admin";
  if (r === "rsm") return "rsm";
  if (r === "asm") return "asm";
  if (r === "mr" || r === "user") return "user";
  return "guest";
}

export function useUserRole(): { role: AppRole; isLoading: boolean } {
  const session = getSession();
  const role = mapRoleString(session?.role ?? null);
  return { role, isLoading: false };
}
