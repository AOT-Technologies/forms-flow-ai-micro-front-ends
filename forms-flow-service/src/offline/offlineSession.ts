/**
 * The saved "pass" that lets the app start without internet (FFF-3 offline).
 *
 * Saved after every online sign-in and token refresh; read when the app starts
 * offline. Kept in localStorage on purpose: the existing logout and tenant
 * switch (StorageService.clear / localStorage.clear) already wipe it.
 *
 * Holds only standard OpenID Connect data, so nothing here depends on Keycloak.
 */

const OFFLINE_SESSION_KEY = "ff_offline_session";
const HOUR_MS = 60 * 60 * 1000;
const DEFAULT_MAX_HOURS = 24;

export interface OfflineSession {
  clientId: string;
  sub?: string;
  token: string;
  refreshToken?: string;
  idToken?: string;
  roles: string[];
  userDetails?: unknown;
  /** When the user was last signed in online (ms since epoch). */
  lastOnlineAuthAt: number;
}

const env = () => (window as any)._env_ || {};

export const isOfflineEnabled = (): boolean => {
  const value = env().REACT_APP_OFFLINE_ENABLED;
  return value === "true" || value === true;
};

export const getOfflineMaxHours = (): number => {
  const hours = Number(env().REACT_APP_OFFLINE_MAX_HOURS);
  return hours > 0 ? hours : DEFAULT_MAX_HOURS;
};

export const saveOfflineSession = (session: OfflineSession): void => {
  try {
    localStorage.setItem(OFFLINE_SESSION_KEY, JSON.stringify(session));
  } catch (error) {
    // Storage full or blocked (e.g. some private modes): offline start-up is
    // simply not available; online use is unaffected.
    console.error("Could not save the offline session", error);
  }
};

export const loadOfflineSession = (): OfflineSession | null => {
  try {
    const raw = localStorage.getItem(OFFLINE_SESSION_KEY);
    return raw ? (JSON.parse(raw) as OfflineSession) : null;
  } catch (error) {
    return null;
  }
};

export const clearOfflineSession = (): void => {
  try {
    localStorage.removeItem(OFFLINE_SESSION_KEY);
  } catch (error) {
    // nothing to clear
  }
};

/**
 * A saved pass can start the app offline only if it belongs to the same
 * sign-in client (same tenant) and is younger than the offline time limit.
 */
export const isUsableOfflineSession = (
  session: OfflineSession | null,
  clientId: string,
  now: number = Date.now(),
  maxHours: number = getOfflineMaxHours()
): session is OfflineSession =>
  !!session &&
  !!session.token &&
  session.clientId === clientId &&
  now - session.lastOnlineAuthAt <= maxHours * HOUR_MS;
