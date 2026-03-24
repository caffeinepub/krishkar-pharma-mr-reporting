import { useEffect, useRef } from "react";
import type { LocationData } from "../backend";
import { useActor } from "./useActor";

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
  const { actor, isFetching } = useActor();
  const actorRef = useRef(actor);
  actorRef.current = actor;

  useEffect(() => {
    if (!actor || isFetching) return;

    let cancelled = false;

    async function sendLocation() {
      if (cancelled || !actorRef.current) return;
      try {
        const pos = await getCurrentPosition();
        if (!pos || cancelled) return;
        // Try to get user profile for the name
        let userName = "";
        try {
          const profile = await actorRef.current.getCallerUserProfile();
          userName = profile?.name ?? "";
        } catch {
          // silently ignore
        }
        const location: LocationData = {
          latitude: pos.coords.latitude,
          longitude: pos.coords.longitude,
          accuracy: pos.coords.accuracy,
          userName,
          userRole,
          timestamp: BigInt(Date.now()) * BigInt(1_000_000), // ms -> ns
        };
        await actorRef.current.updateLatestLocation(location);
      } catch {
        // Fail silently — never show UI errors for GPS
      }
    }

    // Send immediately on mount
    sendLocation();

    // Then every 3 minutes
    const interval = setInterval(sendLocation, UPDATE_INTERVAL_MS);

    return () => {
      cancelled = true;
      clearInterval(interval);
    };
  }, [actor, isFetching, userRole]);
}
