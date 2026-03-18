import { useQuery } from "@tanstack/react-query";
import type { UserRole } from "../backend.d";
import { useActor } from "./useActor";

export function useUserRole() {
  const { actor, isFetching } = useActor();

  const { data: role, isLoading } = useQuery<UserRole | null>({
    queryKey: ["userRole"],
    queryFn: async () => {
      if (!actor) return null;
      return actor.getCallerUserRole();
    },
    enabled: !!actor && !isFetching,
    staleTime: 1000 * 60 * 5,
  });

  return {
    role: role ?? null,
    isLoading: isFetching || isLoading,
  };
}
