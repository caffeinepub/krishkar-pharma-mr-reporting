export const SESSION_KEY = "mr_session";
export const SESSION_EXPIRY_MS = 24 * 60 * 60 * 1000; // 24 hours

export interface StoredSession {
  token: string;
  userId: string;
  role: string;
  mustChangePassword: boolean;
  expiryTime: number;
}

export function saveSession(
  token: string,
  userId: string,
  role: string,
  mustChangePassword: boolean,
): void {
  const session: StoredSession = {
    token,
    userId,
    role,
    mustChangePassword,
    expiryTime: Date.now() + SESSION_EXPIRY_MS,
  };
  localStorage.setItem(SESSION_KEY, JSON.stringify(session));
}

export function getSession(): StoredSession | null {
  try {
    const raw = localStorage.getItem(SESSION_KEY);
    if (!raw) return null;
    const session: StoredSession = JSON.parse(raw);
    if (Date.now() > session.expiryTime) {
      clearSession();
      return null;
    }
    return session;
  } catch {
    clearSession();
    return null;
  }
}

export function clearSession(): void {
  localStorage.removeItem(SESSION_KEY);
}

export function isSessionValid(): boolean {
  return getSession() !== null;
}

export function updateMustChangePassword(value: boolean): void {
  const session = getSession();
  if (!session) return;
  session.mustChangePassword = value;
  localStorage.setItem(SESSION_KEY, JSON.stringify(session));
}
