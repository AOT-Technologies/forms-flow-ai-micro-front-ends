import ConnectivityService, { ConnectionSample } from "./connectivityService";
import OfflineSettingsService from "../offline/offlineSettings";

/**
 * How good the connection is (FFF-3 offline, Phase 6). Not only online or
 * offline, but four levels, so the app can choose how to send forms:
 *
 *   good     — the last checks were fast and none failed
 *   slow     — checks take GOOD_MS..SLOW_MS (median), or the browser says 2G
 *   unstable — UNSTABLE_FAILURES or more of the last 5 checks failed, or the
 *              checks take longer than SLOW_MS
 *   offline  — ConnectivityService says our API cannot be reached
 *
 * Checks: our small HEAD /checkpoint (timed; every 60 s while the tab is
 * visible) and API calls that got no answer (count as failed). Normal API
 * call times are not used: a slow server page is not a slow network.
 *
 * The level goes down at once, and up only after 3 better checks in a row,
 * so it does not flicker. The limits can be set by env keys.
 */
export type NetworkLevel = "good" | "slow" | "unstable" | "offline";
type Listener = (level: NetworkLevel) => void;

export interface NetworkLimits {
  goodMs: number;
  slowMs: number;
  unstableFailures: number;
}

const RANK: Record<NetworkLevel, number> = { good: 0, slow: 1, unstable: 2, offline: 3 };
const SAMPLES_KEPT = 5;
const BETTER_CHECKS_TO_GO_UP = 3;
const PROBE_EVERY_MS = 60000;

const env = (): Record<string, unknown> =>
  (typeof window !== "undefined" && (window as any)._env_) || {};

const positiveFromEnv = (key: string, fallback: number): number => {
  const value = Number(env()[key]);
  return Number.isFinite(value) && value > 0 ? value : fallback;
};

export const getNetworkLimits = (): NetworkLimits => ({
  goodMs: positiveFromEnv("REACT_APP_OFFLINE_NETWORK_GOOD_MS", 300),
  slowMs: positiveFromEnv("REACT_APP_OFFLINE_NETWORK_SLOW_MS", 1500),
  unstableFailures: positiveFromEnv("REACT_APP_OFFLINE_NETWORK_UNSTABLE_FAILURES", 2),
});

const median = (values: number[]): number => {
  const sorted = [...values].sort((a, b) => a - b);
  const middle = Math.floor(sorted.length / 2);
  return sorted.length % 2 ? sorted[middle] : (sorted[middle - 1] + sorted[middle]) / 2;
};

/** Chrome, Edge and Android only: the browser's own guess of the network. */
const browserSaysSlow = (): boolean => {
  const connection = (typeof navigator !== "undefined" && (navigator as any).connection) || null;
  return connection?.effectiveType === "2g" || connection?.effectiveType === "slow-2g";
};

/** The level the last checks point to (before the "no flicker" rule). */
export const levelFromSamples = (
  samples: ConnectionSample[],
  limits: NetworkLimits,
  browserSlow = false
): Exclude<NetworkLevel, "offline"> => {
  const failures = samples.filter((sample) => !sample.ok).length;
  if (failures >= limits.unstableFailures) return "unstable";
  const times = samples
    .filter((sample) => sample.ok && sample.source === "probe")
    .map((sample) => sample.ms);
  if (times.length) {
    const typical = median(times);
    if (typical > limits.slowMs) return "unstable";
    if (typical >= limits.goodMs) return "slow";
  }
  return browserSlow ? "slow" : "good";
};

class NetworkQualityService {
  private static samples: ConnectionSample[] = [];
  private static level: Exclude<NetworkLevel, "offline"> = "good";
  private static betterInARow = 0;
  private static listeners = new Set<Listener>();
  private static started = false;
  private static lastSent: NetworkLevel | null = null;

  /** The current level. */
  public static getLevel(): NetworkLevel {
    return ConnectivityService.isOnline() ? this.level : "offline";
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
    this.lastSent = this.getLevel();
    ConnectivityService.subscribeSamples((sample) => this.addSample(sample));
    ConnectivityService.subscribe((online) => {
      // Back online: old failures from the offline time say nothing about
      // the connection now, so start fresh.
      if (online) this.resetSamples();
      this.notify();
    });
    setInterval(() => this.checkNow(), PROBE_EVERY_MS);
    const connection = (typeof navigator !== "undefined" && (navigator as any).connection) || null;
    connection?.addEventListener?.("change", () => this.update(false));
  }

  // The 60 s check: only while offline forms are on, the tab is visible and
  // we are online (while offline, ConnectivityService re-checks by itself).
  private static checkNow(): void {
    if (!OfflineSettingsService.isOfflineAllowed()) return;
    if (typeof document !== "undefined" && document.visibilityState === "hidden") return;
    if (!ConnectivityService.isOnline()) return;
    ConnectivityService.check();
  }

  private static addSample(sample: ConnectionSample): void {
    // Checks while offline only tell "still offline".
    if (!ConnectivityService.isOnline()) return;
    this.samples = [...this.samples, sample].slice(-SAMPLES_KEPT);
    this.update(true);
  }

  private static update(fromCheck: boolean): void {
    const next = levelFromSamples(this.samples, getNetworkLimits(), browserSaysSlow());
    if (RANK[next] > RANK[this.level]) {
      this.level = next; // worse: at once
      this.betterInARow = 0;
    } else if (RANK[next] < RANK[this.level]) {
      if (fromCheck) this.betterInARow += 1;
      if (this.betterInARow >= BETTER_CHECKS_TO_GO_UP) {
        this.level = next; // better: only after 3 better checks in a row
        this.betterInARow = 0;
      }
    } else {
      this.betterInARow = 0;
    }
    this.notify();
  }

  private static resetSamples(): void {
    this.samples = [];
    this.level = "good";
    this.betterInARow = 0;
  }

  private static notify(): void {
    const level = this.getLevel();
    if (level === this.lastSent) return;
    this.lastSent = level;
    this.listeners.forEach((listener) => listener(level));
  }
}

export default NetworkQualityService;
