import { useQuery } from "@tanstack/react-query";
import { useActor } from "./useActor";

export type AppRole = "admin" | "user" | "rsm" | "asm" | "guest" | null;

// Candid `opt text` arrives as [] | [string] from the IC JS agent
function unwrapOptText(val: unknown): string | undefined {
  if (Array.isArray(val)) return val[0] as string | undefined;
  if (typeof val === "string") return val;
  return undefined;
}

function withTimeout<T>(promise: Promise<T>, ms: number): Promise<T> {
  return Promise.race([
    promise,
    new Promise<T>((_, reject) =>
      setTimeout(
        () =>
          reject(new Error(`ROLE_TIMEOUT:Role query timed out after ${ms}ms`)),
        ms,
      ),
    ),
  ]);
}

export function useUserRole() {
  const { actor, isFetching } = useActor();

  const {
    data: role,
    isLoading,
    isError,
  } = useQuery<AppRole>({
    queryKey: ["userRole"],
    queryFn: async () => {
      if (!actor) return null;
      // Let timeout errors propagate so react-query retries them.
      // Only catch errors that clearly mean "no role" (non-network failures).
      const roleInfo = await withTimeout(actor.getCallerRoleInfo(), 10000);
      const baseRole = roleInfo.baseRole;
      const managerRole = unwrapOptText(roleInfo.managerRole);
      if (baseRole === "admin") return "admin";
      if (baseRole === "guest") return "guest";
      if (baseRole === "mr" || baseRole === "user") {
        if (managerRole === "RSM") return "rsm";
        if (managerRole === "ASM") return "asm";
        return "user";
      }
      return (baseRole as AppRole) ?? "guest";
    },
    enabled: !!actor && !isFetching,
    staleTime: 1000 * 60 * 5,
    retry: 3,
    retryDelay: 2000,
  });

  return {
    role: isError ? ("guest" as AppRole) : (role ?? null),
    isLoading: isFetching || isLoading,
  };
}
