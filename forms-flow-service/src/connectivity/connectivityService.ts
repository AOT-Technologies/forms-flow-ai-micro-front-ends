import { WEB_BASE_URL } from "../constants/constants";

/**
 * Tells whether the formsflow API can really be reached (FFF-3 offline).
 *
 * `navigator.onLine` alone is not trusted: it can say "online" on captive
 * Wi-Fi or a dead connection. When the browser says online, a small HEAD
 * request to our own API (`/checkpoint`, no login needed) decides. It never
 * asks the login server, so it does not depend on the identity provider.
 */
type Listener = (online: boolean) => void;

/** One connection check: did it work, and how long did it take (ms). */
export interface ConnectionSample {
  ok: boolean;
  ms: number;
  /** "probe" = our HEAD /checkpoint; "api" = an API call got no answer. */
  source: "probe" | "api";
}
type SampleListener = (sample: ConnectionSample) => void;

// How long one HEAD /checkpoint may take before it counts as failed. It must
// be longer than the slowest network we still want to call "online": 3G adds
// about 2 s to every request, so the old fixed 2 s made 3G look offline.
// Env key REACT_APP_OFFLINE_NETWORK_PROBE_TIMEOUT_MS; 6 s if not set.
const DEFAULT_PROBE_TIMEOUT_MS = 6000;

/** A positive number from `window._env_[key]`, or `fallback`. */
export const positiveFromEnv = (key: string, fallback: number): number => {
  const env = (typeof window !== "undefined" && (window as any)._env_) || {};
  const value = Number(env[key]);
  return Number.isFinite(value) && value > 0 ? value : fallback;
};

export const getProbeTimeoutMs = (): number =>
  positiveFromEnv(
    "REACT_APP_OFFLINE_NETWORK_PROBE_TIMEOUT_MS",
    DEFAULT_PROBE_TIMEOUT_MS
  );
// While offline, check again this often (FFF-3: 10 s, decided 19 Oct).
const OFFLINE_RECHECK_MS = 10000;
// A failed probe while online is tried once more, this long after the first
// one STARTED: 3 s after a quick failure, at once after a timeout (the time
// has passed already). Worst case to "offline": 2 × the probe wait (12 s).
const SECOND_PROBE_AFTER_MS = 3000;
// After an API call fails with no answer, probe at most this often.
const NETWORK_ERROR_PROBE_GAP_MS = 5000;

class ConnectivityService {
  private static online =
    typeof navigator === "undefined" ? true : navigator.onLine !== false;
  private static readonly listeners = new Set<Listener>();
  private static readonly sampleListeners = new Set<SampleListener>();
  private static started = false;
  private static recheckTimer: ReturnType<typeof setInterval> | null = null;
  private static pendingCheck: Promise<boolean> | null = null;
  private static lastNetworkErrorProbeAt = 0;

  /** Last known state (updated by `check()`). */
  public static isOnline(): boolean {
    return this.online;
  }

  /**
   * Probes the API once and returns (and broadcasts) the result. Checks that
   * start while one is running share it, so a burst of calls makes one probe.
   */
  public static check(): Promise<boolean> {
    this.pendingCheck ??= this.checkTwiceIfOnline()
      .then((online) => {
        this.setOnline(online);
        return online;
      })
      .finally(() => {
        this.pendingCheck = null;
      });
    return this.pendingCheck;
  }

  /**
   * Starts a check when nobody waits for its result (timers, browser
   * events). The probe itself never fails; only a listener that throws can
   * make the check fail, and that is logged here instead of becoming an
   * unhandled promise rejection.
   */
  private static checkInBackground(): void {
    this.check().catch((error) => {
      console.error("Connection check failed", error);
    });
  }

  /**
   * One failed probe while online may be a bump on a shaky network, not an
   * outage (Phase 6): probe once more after a short wait, and go offline only
   * if that fails too. The first failure still counts for the network level
   * ("unstable"). The browser's own "offline" never waits.
   */
  private static async checkTwiceIfOnline(): Promise<boolean> {
    const firstStartedAt = Date.now();
    if (await this.timedProbe()) return true;
    const browserOffline =
      typeof navigator !== "undefined" && navigator.onLine === false;
    if (!this.online || browserOffline) return false;
    const wait = SECOND_PROBE_AFTER_MS - (Date.now() - firstStartedAt);
    if (wait > 0) await new Promise((resolve) => setTimeout(resolve, wait));
    return this.timedProbe();
  }

  private static async timedProbe(): Promise<boolean> {
    const startedAt = Date.now();
    const online = await this.probe();
    this.emitSample({ ok: online, ms: Date.now() - startedAt, source: "probe" });
    return online;
  }

  /**
   * An API call got no answer at all (network error). The browser may still
   * say "online" — e.g. Wi-Fi without internet, or our API is down — and then
   * no "offline" event comes. Probe now (at most every few seconds) so the app
   * switches to offline instead of waiting for the next token refresh.
   *
   * The failed call itself is not counted for the network level: only the
   * probe decides. When the probe works, the network is fine and the call
   * failed for a server reason the browser hides (e.g. a refused CORS
   * pre-check); when it fails, the probe's own sample counts.
   */
  public static reportNetworkError(): void {
    const now = Date.now();
    if (now - this.lastNetworkErrorProbeAt < NETWORK_ERROR_PROBE_GAP_MS) return;
    this.lastNetworkErrorProbeAt = now;
    this.checkInBackground();
  }

  /**
   * Calls `listener` after every check with its result and timing (used by
   * NetworkQualityService). Returns an unsubscribe function.
   */
  public static subscribeSamples(listener: SampleListener): () => void {
    this.sampleListeners.add(listener);
    return () => {
      this.sampleListeners.delete(listener);
    };
  }

  private static emitSample(sample: ConnectionSample): void {
    this.sampleListeners.forEach((listener) => listener(sample));
  }

  /**
   * Calls `listener` whenever the state changes. Returns an unsubscribe
   * function. Starts watching the browser online/offline events on first use.
   */
  public static subscribe(listener: Listener): () => void {
    this.listeners.add(listener);
    this.start();
    return () => {
      this.listeners.delete(listener);
    };
  }

  private static async probe(): Promise<boolean> {
    if (typeof navigator !== "undefined" && navigator.onLine === false) {
      return false;
    }
    const controller =
      typeof AbortController === "undefined" ? null : new AbortController();
    const timeout = setTimeout(() => controller?.abort(), getProbeTimeoutMs());
    try {
      const response = await fetch(`${WEB_BASE_URL}/checkpoint`, {
        method: "HEAD",
        cache: "no-store",
        signal: controller?.signal,
      });
      return response.ok;
    } catch {
      // No answer (network error, or aborted after the probe wait): the
      // reason does not matter, the API simply cannot be reached.
      return false;
    } finally {
      clearTimeout(timeout);
    }
  }

  private static setOnline(online: boolean): void {
    if (online === this.online) return;
    this.online = online;
    if (online) this.stopRecheck();
    else this.startRecheck();
    this.listeners.forEach((listener) => listener(online));
  }

  // While offline, re-probe now and then: the browser "online" event alone
  // does not prove the API is reachable again.
  private static startRecheck(): void {
    if (this.recheckTimer) return;
    this.recheckTimer = setInterval(() => {
      this.checkInBackground();
    }, OFFLINE_RECHECK_MS);
  }

  private static stopRecheck(): void {
    if (!this.recheckTimer) return;
    clearInterval(this.recheckTimer);
    this.recheckTimer = null;
  }

  private static start(): void {
    if (this.started || typeof window === "undefined") return;
    if (typeof window.addEventListener !== "function") return;
    this.started = true;
    window.addEventListener("online", () => {
      this.checkInBackground();
    });
    window.addEventListener("offline", () => this.setOnline(false));
  }
}

export default ConnectivityService;
