import { useQuery } from "@tanstack/react-query";
import { useActor } from "./useActor";

export type AppRole = "admin" | "user" | "rsm" | "asm" | "guest" | null;

export function useUserRole() {
  const { actor, isFetching } = useActor();

  const {
    data: role,
    isLoading,
    isError,
  } = useQuery<AppRole>({
    queryKey: ["userRole"],
    queryFn: async () => {
      if (!actor) return "guest";
      try {
        const baseRole = await actor.getCallerUserRole();
        if (baseRole === "admin") return "admin";
        if (baseRole === "guest") return "guest";
        if (baseRole === "user") {
          try {
            const managerProfile = await actor.getManagerProfile();
            if (managerProfile) {
              if (managerProfile.managerRole === "RSM") return "rsm";
              if (managerProfile.managerRole === "ASM") return "asm";
            }
          } catch {
            // If getManagerProfile fails, treat as regular user
          }
          return "user";
        }
        return baseRole as AppRole;
      } catch {
        return "guest";
      }
    },
    enabled: !!actor && !isFetching,
    staleTime: 1000 * 60 * 5,
    retry: 2,
  });

  return {
    role: isError ? ("guest" as AppRole) : (role ?? null),
    isLoading: isFetching || isLoading,
  };
}
