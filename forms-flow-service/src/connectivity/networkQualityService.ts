import ConnectivityService, {
  ConnectionSample,
  positiveFromEnv,
} from "./connectivityService";
import OfflineSettingsService from "../offline/offlineSettings";

/**
 * How good the connection is (FFF-3 offline, Phase 6). Not only online or
 * offline, but four levels, so the app can choose how to send forms:
 *
 *   good     — our checks answer under GOOD_MS and none failed
 *   slow     — our checks answer in GOOD_MS..SLOW_MS (median of the last 5)
 *   unstable — our checks answer slower than SLOW_MS, or UNSTABLE_FAILURES
 *              or more of the last 5 checks failed
 *   offline  — ConnectivityService says our API cannot be reached
 *
 * Who decides (decided 6 Nov, for real networks, not only throttling):
 *   - OUR CHECK measures: a small HEAD /checkpoint, timed. It goes the real
 *     way (device → network → our server), so a far or busy server counts
 *     too. Every 60 s while good, every 15 s while slow or unstable.
 *   - THE BROWSER WARNS (Chrome, Edge, Android: Network Information API).
 *     Its estimate is for the device's network in general, not for our
 *     server, and may be wrong. So it is
 *       a trigger — its "change" event starts our check right away (at most
 *                   once per QUICK_CHECK_GAP_MS), and
 *       a hint    — it can make the level worse, never better, and on its
 *                   own no worse than "slow".
 *   - A QUICK CHANGE: a check that points to another level than our checks
 *     so far is checked once more 1 s later. When both agree, the history
 *     is dropped and the new value is used at once (both directions). When
 *     not, it was a bump: both count as normal checks.
 *   - Otherwise the level goes down at once, and up only after 3 better
 *     checks in a row, so it does not flicker.
 * Failed checks (ours, or API calls with no answer) count. Normal API call
 * times are not used: a slow server page is not a slow network (server
 * errors are for the outbox's retry wait). Limits: env keys.
 */
export type NetworkLevel = "good" | "slow" | "unstable" | "offline";
type OnlineLevel = Exclude<NetworkLevel, "offline">;
type Listener = (level: NetworkLevel) => void;

export interface NetworkLimits {
  goodMs: number;
  slowMs: number;
  unstableFailures: number;
}

const RANK: Record<NetworkLevel, number> = {
  good: 0,
  slow: 1,
  unstable: 2,
  offline: 3,
};
const SAMPLES_KEPT = 5;
const BETTER_CHECKS_TO_GO_UP = 3;
// How often our check runs: less often while all is well.
const PROBE_EVERY_MS = 60000;
const PROBE_EVERY_WEAK_MS = 15000;
// The timer looks this often whether a check is due.
const TICK_MS = 5000;
// A check that points to another level is checked again after this wait.
const CONFIRM_AFTER_MS = 1000;
// The browser may report several changes in a row while its estimate
// settles: start our check for them at most this often.
const QUICK_CHECK_GAP_MS = 5000;
// The browser's hint alone never makes the level worse than this.
const HINT_CAP: OnlineLevel = "slow";

export const getNetworkLimits = (): NetworkLimits => ({
  goodMs: positiveFromEnv("REACT_APP_OFFLINE_NETWORK_GOOD_MS", 300),
  slowMs: positiveFromEnv("REACT_APP_OFFLINE_NETWORK_SLOW_MS", 1500),
  unstableFailures: positiveFromEnv(
    "REACT_APP_OFFLINE_NETWORK_UNSTABLE_FAILURES",
    2
  ),
});

const median = (values: number[]): number => {
  const sorted = [...values].sort((a, b) => a - b);
  const middle = Math.floor(sorted.length / 2);
  return sorted.length % 2
    ? sorted[middle]
    : (sorted[middle - 1] + sorted[middle]) / 2;
};

const worse = <T extends NetworkLevel>(a: T, b: T): T =>
  RANK[a] >= RANK[b] ? a : b;

/** The level of one round trip time. */
export const levelFromMs = (ms: number, limits: NetworkLimits): OnlineLevel => {
  if (ms > limits.slowMs) return "unstable";
  if (ms >= limits.goodMs) return "slow";
  return "good";
};

const EFFECTIVE_TYPE_LEVEL: Record<string, OnlineLevel> = {
  "slow-2g": "unstable",
  "2g": "unstable",
  "3g": "slow",
  "4g": "good",
};

const browserConnection = (): any =>
  (typeof navigator !== "undefined" && (navigator as any).connection) || null;

/**
 * What the browser's own estimate (Network Information API) says, or null
 * when the browser has none (Safari, Firefox). `rtt` first (ms, rounded by
 * the browser); `effectiveType` when rtt is missing or 0 (no estimate yet).
 */
export const levelFromBrowser = (
  connection: any,
  limits: NetworkLimits
): OnlineLevel | null => {
  if (!connection) return null;
  const rtt = Number(connection.rtt);
  if (Number.isFinite(rtt) && rtt > 0) return levelFromMs(rtt, limits);
  return EFFECTIVE_TYPE_LEVEL[connection.effectiveType] || null;
};

/** The browser's estimate as a hint: "good" (no effect) up to HINT_CAP. */
export const hintFromBrowser = (
  connection: any,
  limits: NetworkLimits
): OnlineLevel => {
  const level = levelFromBrowser(connection, limits);
  if (!level) return "good";
  return RANK[level] > RANK[HINT_CAP] ? HINT_CAP : level;
};

/** The level our last checks point to (before the "no flicker" rule). */
export const levelFromSamples = (
  samples: ConnectionSample[],
  limits: NetworkLimits
): OnlineLevel => {
  const failures = samples.filter((sample) => !sample.ok).length;
  if (failures >= limits.unstableFailures) return "unstable";
  const times = samples
    .filter((sample) => sample.ok && sample.source === "probe")
    .map((sample) => sample.ms);
  return times.length ? levelFromMs(median(times), limits) : "good";
};

const isTimedProbe = (sample: ConnectionSample) =>
  sample.ok && sample.source === "probe";

class NetworkQualityService {
  private static samples: ConnectionSample[] = [];
  // The level our checks give (with the "no flicker" rule).
  private static checkLevel: OnlineLevel = "good";
  private static betterInARow = 0;
  private static readonly listeners = new Set<Listener>();
  private static started = false;
  private static lastSent: NetworkLevel | null = null;
  // The last check that worked while we were still offline (see start()).
  private static lastOfflineProbe: ConnectionSample | null = null;
  private static lastCheckAt = 0;
  private static lastQuickCheckAt = -Infinity;
  // A check that pointed to another level, waiting for its second check.
  private static candidate: ConnectionSample | null = null;
  private static confirmTimer: ReturnType<typeof setTimeout> | null = null;

  /** The current level: our checks, made worse by the browser's hint. */
  public static getLevel(): NetworkLevel {
    if (!ConnectivityService.isOnline()) return "offline";
    return worse(this.checkLevel, this.hint());
  }

  /**
   * Calls `listener` when the level changes. Returns an unsubscribe function.
   * Starts the checks on first use.
   */
  public static subscribe(listener: Listener): () => void {
    this.listeners.add(listener);
    this.start();
    return () => {
      this.listeners.delete(listener);
    };
  }

  private static start(): void {
    if (this.started) return;
    this.started = true;
    this.lastCheckAt = Date.now();
    this.lastSent = this.getLevel();
    ConnectivityService.subscribeSamples((sample) => this.addSample(sample));
    ConnectivityService.subscribe((online) => {
      // Back online: old failures from the offline time say nothing about
      // the connection now, so start fresh, but from the check that proved
      // we are back (it came in while still "offline"). Without it the level
      // is "good" until the next check, and the first send after the
      // reconnect (auto sync) would always go over HTTPS.
      if (online) {
        this.startFreshFrom(
          this.lastOfflineProbe ? [this.lastOfflineProbe] : []
        );
      }
      this.lastOfflineProbe = null;
      this.notify();
    });
    setInterval(() => this.checkIfDue(), TICK_MS);
    // The browser saw a change: its hint applies at once, and our check
    // finds out how the way to our server is now.
    browserConnection()?.addEventListener?.("change", () => {
      this.notify();
      if (Date.now() - this.lastQuickCheckAt < QUICK_CHECK_GAP_MS) return;
      // Only a check really sent uses up the gap (not one skipped because
      // the tab is hidden, or offline forms are off).
      if (this.checkNow()) this.lastQuickCheckAt = Date.now();
    });
  }

  private static hint(): OnlineLevel {
    return hintFromBrowser(browserConnection(), getNetworkLimits());
  }

  // Our check: only while offline forms are on, the tab is visible and we
  // are online (while offline, ConnectivityService re-checks by itself).
  private static checkIfDue(): void {
    const weak = this.getLevel() !== "good";
    const every = weak ? PROBE_EVERY_WEAK_MS : PROBE_EVERY_MS;
    if (Date.now() - this.lastCheckAt < every) return;
    this.checkNow();
  }

  // Returns true when a check was started.
  private static checkNow(): boolean {
    if (!OfflineSettingsService.isOfflineAllowed()) return false;
    if (
      typeof document !== "undefined" &&
      document.visibilityState === "hidden"
    ) {
      return false;
    }
    if (!ConnectivityService.isOnline()) return false;
    this.lastCheckAt = Date.now();
    // Nobody waits for the result: the level comes from the sample the
    // check sends to addSample(). A failure is only logged.
    ConnectivityService.check().catch((error) => {
      console.error("Network level check failed", error);
    });
    return true;
  }

  private static addSample(sample: ConnectionSample): void {
    this.lastCheckAt = Date.now();
    // Checks while offline only tell "still offline", except the last one
    // that worked: it is the check that brings us back online.
    if (!ConnectivityService.isOnline()) {
      if (isTimedProbe(sample)) this.lastOfflineProbe = sample;
      return;
    }
    if (this.isQuickChange(sample)) return;
    this.samples = [...this.samples, sample].slice(-SAMPLES_KEPT);
    this.update();
  }

  /**
   * A timed check that points to another level than our checks so far may
   * be a bump or a real change. Check once more soon: when that agrees, it
   * is a quick change and the new value is used at once (history dropped);
   * when not, both count as normal checks. Returns true when `sample` was
   * used here.
   */
  private static isQuickChange(sample: ConnectionSample): boolean {
    // A failed check in between: not a clean change, so the waiting
    // candidate is dropped (it must not be matched later, and the failure
    // must stay in the history).
    if (!sample.ok) {
      this.dropCandidate();
      return false;
    }
    if (!isTimedProbe(sample)) return false;
    const limits = getNetworkLimits();
    // Unstable because checks failed: a shaky network, not a speed change.
    // Fast checks then go up the normal way (3 better checks in a row).
    const failures = this.samples.filter((one) => !one.ok).length;
    if (failures >= limits.unstableFailures) return false;
    const own = levelFromMs(sample.ms, limits);
    const candidate = this.candidate;
    if (candidate) {
      this.dropCandidate(); // answered: its timer's check is not needed
      const agree = own === levelFromMs(candidate.ms, limits);
      if (agree && own !== this.checkLevel) {
        this.startFreshFrom([candidate, sample]);
        this.notify();
        return true;
      }
      return false;
    }
    if (own !== this.checkLevel && !this.confirmTimer) {
      this.candidate = sample;
      this.confirmTimer = setTimeout(() => {
        this.confirmTimer = null;
        this.checkNow();
      }, CONFIRM_AFTER_MS);
    }
    return false;
  }

  private static update(): void {
    const next = levelFromSamples(this.samples, getNetworkLimits());
    if (RANK[next] > RANK[this.checkLevel]) {
      this.checkLevel = next; // worse: at once
      this.betterInARow = 0;
    } else if (RANK[next] < RANK[this.checkLevel]) {
      this.betterInARow += 1;
      if (this.betterInARow >= BETTER_CHECKS_TO_GO_UP) {
        this.checkLevel = next; // better: only after 3 better checks in a row
        this.betterInARow = 0;
      }
    } else {
      this.betterInARow = 0;
    }
    this.notify();
  }

  // Forgets earlier checks; the level then comes from `fresh` alone. Not
  // through the "no flicker" rule: there is no older level to protect.
  private static startFreshFrom(fresh: ConnectionSample[]): void {
    this.samples = fresh;
    this.checkLevel = levelFromSamples(this.samples, getNetworkLimits());
    this.betterInARow = 0;
    this.dropCandidate();
  }

  private static dropCandidate(): void {
    this.candidate = null;
    if (this.confirmTimer) clearTimeout(this.confirmTimer);
    this.confirmTimer = null;
  }

  private static notify(): void {
    const level = this.getLevel();
    if (level === this.lastSent) return;
    this.lastSent = level;
    this.listeners.forEach((listener) => listener(level));
  }
}

export default NetworkQualityService;
