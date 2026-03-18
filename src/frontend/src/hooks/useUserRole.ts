import { useQuery } from "@tanstack/react-query";
import { useActor } from "./useActor";

export type AppRole = "admin" | "user" | "rsm" | "asm" | "guest" | null;

export function useUserRole() {
  const { actor, isFetching } = useActor();

  const { data: role, isLoading } = useQuery<AppRole>({
    queryKey: ["userRole"],
    queryFn: async () => {
      if (!actor) return null;
      const baseRole = await actor.getCallerUserRole();
      if (baseRole === "admin") return "admin";
      if (baseRole === "guest") return "guest";
      if (baseRole === "user") {
        const a = actor as any;
        const managerProfile = await a.getManagerProfile();
        if (managerProfile) {
          if (managerProfile.managerRole === "RSM") return "rsm";
          if (managerProfile.managerRole === "ASM") return "asm";
        }
        return "user";
      }
      return baseRole as AppRole;
    },
    enabled: !!actor && !isFetching,
    staleTime: 1000 * 60 * 5,
  });

  return {
    role: role ?? null,
    isLoading: isFetching || isLoading,
  };
}
