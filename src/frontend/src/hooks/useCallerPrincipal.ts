import { useActor } from "@caffeineai/core-infrastructure";
import { Principal } from "@icp-sdk/core/principal";
import { useQuery } from "@tanstack/react-query";
import { createActor } from "../backend";
import { getSession } from "../lib/sessionManager";

export function useCallerPrincipal(): Principal | null {
  const { actor, isFetching } = useActor(createActor);
  const session = getSession();

  const { data: principalId } = useQuery<string | null>({
    queryKey: ["caller-principal", session?.token],
    queryFn: async () => {
      if (!actor || !session?.token) return null;
      const result = await actor.validateSession(session.token);
      if (result.__kind__ === "ok") return result.ok.principalId;
      return null;
    },
    enabled: !!actor && !isFetching && !!session?.token,
    staleTime: 60 * 60 * 1000, // cache for 1 hour
  });

  if (!principalId) return null;
  try {
    return Principal.fromText(principalId);
  } catch {
    return null;
  }
}
