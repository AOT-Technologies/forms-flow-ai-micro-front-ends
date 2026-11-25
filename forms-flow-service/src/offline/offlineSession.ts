/**
 * The saved "pass" that lets the app start without internet (FFF-3 offline).
 *
 * Saved after every online sign-in and token refresh; read when the app starts
 * offline. Kept in localStorage on purpose: the existing logout and tenant
 * switch (StorageService.clear / localStorage.clear) already wipe it.
 *
 * Holds only standard OpenID Connect data, so nothing here depends on Keycloak.
 * No refresh token or ID token (decided 3 Nov 2026): a script that reads
 * localStorage must not be able to get new tokens. After an offline start the
 * user signs in again once the connection is back.
 */

const OFFLINE_SESSION_KEY = "ff_offline_session";
const HOUR_MS = 60 * 60 * 1000;
const DEFAULT_MAX_HOURS = 24;

export interface OfflineSession {
  clientId: string;
  sub?: string;
  token: string;
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

/** The installation allows auto sync (REACT_APP_OFFLINE_AUTO_SYNC_ENABLED). */
export const isAutoSyncEnvEnabled = (): boolean => {
  const value = env().REACT_APP_OFFLINE_AUTO_SYNC_ENABLED;
  return isOfflineEnabled() && (value === "true" || value === true);
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
    if (!raw) return null;
    // A pass saved by an older version may still hold them: never used.
    const { refreshToken, idToken, ...session } = JSON.parse(raw);
    return session as OfflineSession;
  } catch {
    // No storage access or a broken saved pass: no offline start possible.
    return null;
  }
};

/**
 * A pass saved by an older version still holds a refresh and ID token:
 * removes them (at app start). An online sign-in also replaces the pass.
 */
export const dropTokensFromSavedPass = (): void => {
  try {
    const raw = localStorage.getItem(OFFLINE_SESSION_KEY);
    if (!raw) return;
    const stored = JSON.parse(raw);
    if (stored.refreshToken || stored.idToken) saveOfflineSession(loadOfflineSession()!);
  } catch (error) {
    // Unreadable pass: loadOfflineSession treats it as none.
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
  Number.isFinite(session.lastOnlineAuthAt) &&
  // A sign-in time in the future (the clock was set back) would stretch the
  // offline time limit: refused, the user signs in online again.
  session.lastOnlineAuthAt <= now &&
  now - session.lastOnlineAuthAt <= maxHours * HOUR_MS;
