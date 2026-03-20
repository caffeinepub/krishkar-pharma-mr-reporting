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
        const roleInfo = await actor.getCallerRoleInfo();
        const { baseRole, managerRole } = roleInfo;
        if (baseRole === "admin") return "admin";
        if (baseRole === "guest") return "guest";
        if (baseRole === "user") {
          if (managerRole === "RSM") return "rsm";
          if (managerRole === "ASM") return "asm";
          return "user";
        }
        return baseRole as AppRole;
      } catch {
        return "guest";
      }
    },
    enabled: !!actor && !isFetching,
    staleTime: 1000 * 60 * 5,
    retry: 1,
  });

  return {
    role: isError ? ("guest" as AppRole) : (role ?? null),
    isLoading: isFetching || isLoading,
  };
}
