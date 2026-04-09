import { useActor } from "@caffeineai/core-infrastructure";
import { useCallback, useEffect, useRef, useState } from "react";
import { createActor } from "../backend";
import { clearSession, getSession, saveSession } from "../lib/sessionManager";

export interface SessionAuthState {
  isAuthenticated: boolean;
  userId: string | null;
  sessionToken: string | null;
  mustChangePassword: boolean;
  role: string | null;
  isLoading: boolean;
  error: string | null;
  login: (userId: string, password: string) => Promise<boolean>;
  logout: () => void;
  clearError: () => void;
  setMustChangePassword: (value: boolean) => void;
}

export function useSessionAuth(): SessionAuthState {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [userId, setUserId] = useState<string | null>(null);
  const [sessionToken, setSessionToken] = useState<string | null>(null);
  const [mustChangePassword, setMustChangePasswordState] = useState(false);
  const [role, setRole] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // useActor is always called unconditionally (hooks rules). The actor may be
  // null if the canisterId is invalid (e.g. env.json has 'undefined' as value).
  const { actor } = useActor(createActor);

  // Safety valve: if isLoading is still true after 8 seconds, force it to
  // false so the login screen always renders — even when the actor never
  // initializes due to a bad canisterId in env.json.
  const loadingTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  useEffect(() => {
    loadingTimerRef.current = setTimeout(() => {
      setIsLoading((prev) => {
        if (prev) {
          console.warn(
            "[useSessionAuth] Loading timed out — forcing login screen",
          );
          return false;
        }
        return prev;
      });
    }, 8000);
    return () => {
      if (loadingTimerRef.current) clearTimeout(loadingTimerRef.current);
    };
  }, []);

  // On mount: restore session from localStorage
  useEffect(() => {
    try {
      const session = getSession();
      if (session) {
        setIsAuthenticated(true);
        setUserId(session.userId);
        setSessionToken(session.token);
        setMustChangePasswordState(session.mustChangePassword);
        setRole(session.role);
      }
    } catch (e) {
      console.warn("[useSessionAuth] Failed to restore session:", e);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const login = useCallback(
    async (inputUserId: string, password: string): Promise<boolean> => {
      if (!actor) {
        setError(
          "Unable to connect to server. Please refresh the page and try again.",
        );
        return false;
      }
      setIsLoading(true);
      setError(null);
      try {
        const result = await actor.authenticateUser(
          inputUserId.trim(),
          password,
        );

        if (result.__kind__ === "err") {
          setError(result.err);
          setIsLoading(false);
          return false;
        }

        const { sessionToken: token, userId: uid, role: r } = result.ok;
        const mustChange = false;

        saveSession(token, uid, r, mustChange);
        setIsAuthenticated(true);
        setUserId(uid);
        setSessionToken(token);
        setMustChangePasswordState(mustChange);
        setRole(r);
        setIsLoading(false);
        return true;
      } catch (err) {
        const msg =
          err instanceof Error ? err.message : "Login failed. Please retry.";
        setError(msg);
        setIsLoading(false);
        return false;
      }
    },
    [actor],
  );

  const logout = useCallback(() => {
    try {
      const session = getSession();
      if (session?.token && actor) {
        // Best-effort backend logout — don't await
        actor.logoutUser(session.token).catch(() => {});
      }
    } catch {
      // Ignore logout errors
    }
    clearSession();
    setIsAuthenticated(false);
    setUserId(null);
    setSessionToken(null);
    setMustChangePasswordState(false);
    setRole(null);
    setError(null);
  }, [actor]);

  const clearError = useCallback(() => setError(null), []);

  const setMustChangePassword = useCallback((value: boolean) => {
    setMustChangePasswordState(value);
    try {
      const session = getSession();
      if (session) {
        session.mustChangePassword = value;
        localStorage.setItem("mr_session", JSON.stringify(session));
      }
    } catch {
      // Ignore storage errors
    }
  }, []);

  return {
    isAuthenticated,
    userId,
    sessionToken,
    mustChangePassword,
    role,
    isLoading,
    error,
    login,
    logout,
    clearError,
    setMustChangePassword,
  };
}
