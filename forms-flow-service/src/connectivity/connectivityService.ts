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

const PROBE_TIMEOUT_MS = 2000;
// While offline, check again this often (FFF-3: 10 s, decided 19 Oct).
const OFFLINE_RECHECK_MS = 10000;
// A failed probe while online is tried once more after this wait.
const SECOND_PROBE_AFTER_MS = 3000;
// After an API call fails with no answer, probe at most this often.
const NETWORK_ERROR_PROBE_GAP_MS = 5000;

class ConnectivityService {
  private static online =
    typeof navigator === "undefined" ? true : navigator.onLine !== false;
  private static listeners = new Set<Listener>();
  private static sampleListeners = new Set<SampleListener>();
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
    if (!this.pendingCheck) {
      this.pendingCheck = this.checkTwiceIfOnline()
        .then((online) => {
          this.setOnline(online);
          return online;
        })
        .finally(() => {
          this.pendingCheck = null;
        });
    }
    return this.pendingCheck;
  }

  /**
   * One failed probe while online may be a bump on a shaky network, not an
   * outage (Phase 6): probe once more after a short wait, and go offline only
   * if that fails too. The first failure still counts for the network level
   * ("unstable"). The browser's own "offline" never waits.
   */
  private static async checkTwiceIfOnline(): Promise<boolean> {
    if (await this.timedProbe()) return true;
    const browserOffline =
      typeof navigator !== "undefined" && navigator.onLine === false;
    if (!this.online || browserOffline) return false;
    await new Promise((resolve) => setTimeout(resolve, SECOND_PROBE_AFTER_MS));
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
   */
  public static reportNetworkError(): void {
    const now = Date.now();
    if (now - this.lastNetworkErrorProbeAt < NETWORK_ERROR_PROBE_GAP_MS) return;
    this.lastNetworkErrorProbeAt = now;
    // The failed call itself counts as a failed check (network level).
    this.emitSample({ ok: false, ms: 0, source: "api" });
    this.check();
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
    const timeout = setTimeout(() => controller?.abort(), PROBE_TIMEOUT_MS);
    try {
      const response = await fetch(`${WEB_BASE_URL}/checkpoint`, {
        method: "HEAD",
        cache: "no-store",
        signal: controller?.signal,
      });
      return response.ok;
    } catch (error) {
      return false;
    } finally {
      clearTimeout(timeout);
    }
  }

  private static setOnline(online: boolean): void {
    if (online === this.online) return;
    this.online = online;
    this.toggleRecheck(!online);
    this.listeners.forEach((listener) => listener(online));
  }

  // While offline, re-probe now and then: the browser "online" event alone
  // does not prove the API is reachable again.
  private static toggleRecheck(enable: boolean): void {
    if (enable && !this.recheckTimer) {
      this.recheckTimer = setInterval(() => {
        this.check();
      }, OFFLINE_RECHECK_MS);
    } else if (!enable && this.recheckTimer) {
      clearInterval(this.recheckTimer);
      this.recheckTimer = null;
    }
  }

  private static start(): void {
    if (this.started || typeof window === "undefined") return;
    if (typeof window.addEventListener !== "function") return;
    this.started = true;
    window.addEventListener("online", () => {
      this.check();
    });
    window.addEventListener("offline", () => this.setOnline(false));
  }
}

export default ConnectivityService;
