import { useActor } from "@caffeineai/core-infrastructure";
import { useEffect, useRef } from "react";
import { createActor } from "../backend";
import { getSession } from "../lib/sessionManager";

const UPDATE_INTERVAL_MS = 3 * 60 * 1000; // 3 minutes

async function getCurrentPosition(): Promise<GeolocationPosition | null> {
  return new Promise((resolve) => {
    if (!navigator?.geolocation) {
      resolve(null);
      return;
    }
    navigator.geolocation.getCurrentPosition(
      (pos) => resolve(pos),
      () => resolve(null),
      { timeout: 10000, maximumAge: 60000 },
    );
  });
}

export function useGPSUpdater(userRole = "MR") {
  const { actor } = useActor(createActor);
  const actorRef = useRef(actor);
  actorRef.current = actor;
  const userRoleRef = useRef(userRole);
  userRoleRef.current = userRole;

  useEffect(() => {
    if (!actor) return;

    let cancelled = false;

    async function sendLocation() {
      if (cancelled || !actorRef.current) return;
      try {
        const pos = await getCurrentPosition();
        if (!pos || cancelled) return;

        const session = getSession();
        const userName = session?.userId ?? "";

        await actorRef.current.updateLatestLocation({
          latitude: pos.coords.latitude,
          longitude: pos.coords.longitude,
          accuracy: pos.coords.accuracy,
          userName,
          userRole: userRoleRef.current,
          timestamp: BigInt(Date.now()) * BigInt(1_000_000),
        });
      } catch {
        // Fail silently
      }
    }

    sendLocation();
    const interval = setInterval(sendLocation, UPDATE_INTERVAL_MS);

    return () => {
      cancelled = true;
      clearInterval(interval);
    };
  }, [actor]);
}
