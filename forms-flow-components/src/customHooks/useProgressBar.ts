// forms-flow-components/src/components/CustomComponents/ProgressBar.tsx

import { useState, useEffect, useRef, useCallback } from 'react';

export interface UseProgressBarOptions {
  /**
   * Progress increment value (default: 5)
   */
  increment?: number;
  /**
   * Interval in milliseconds (default: 300)
   */
  interval?: number;
  /**
   * Maximum progress value before completion (default: 100)
   */
  maxProgress?: number;
  /**
   * Cap value for simulation (default: 90). Progress will stop here until manually completed
   */
  capProgress?: number;
  /**
   * Whether to use the capProgress pattern (default: false)
   * When true, progress stops at capProgress until complete() is called
   * When false, progress increments continuously until maxProgress
   */
  useCap?: boolean;
  /**
   * Initial progress value (default: 0)
   */
  initialProgress?: number;
}

export interface UseProgressBarReturn {
  /**
   * Current progress value (0-100)
   */
  progress: number;
  /**
   * Start the progress simulation
   */
  start: () => void;
  /**
   * Stop the progress simulation
   */
  stop: () => void;
  /**
   * Complete the progress (sets to maxProgress)
   */
  complete: () => void;
  /**
   * Reset progress to initial value
   */
  reset: () => void;
  /**
   * Set progress to a specific value
   */
  setProgress: (value: number) => void;
  /**
   * Check if progress is currently running
   */
  isRunning: boolean;
}

/**
 * Custom hook for managing progress bar state and simulation
 * Supports independent instances for multiple operations
 * 
 * @param options Configuration options for the progress bar
 * @returns Progress bar state and control functions
 * 
 * @example
 * // Upload pattern (continuous increment)
 * const { progress, start, stop, complete, reset } = useProgressBar({
 *   increment: 5,
 *   interval: 300,
 *   useCap: false
 * });
 * 
 * @example
 * // Export pattern (cap at 90%)
 * const { progress, start, complete, reset } = useProgressBar({
 *   increment: 10,
 *   interval: 200,
 *   useCap: true,
 *   capProgress: 90
 * });
 */
export const useProgressBar = (options: UseProgressBarOptions = {}): UseProgressBarReturn => {
  const {
    increment = 5,
    interval = 300,
    maxProgress = 100,
    capProgress = 90,
    useCap = false,
    initialProgress = 0,
  } = options;

  const [progress, setProgressState] = useState<number>(initialProgress);
  const [isRunning, setIsRunning] = useState<boolean>(false);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  // Clear interval helper
  const clearProgressInterval = useCallback(() => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
  }, []);

  // Start progress simulation
  const start = useCallback(() => {
    clearProgressInterval();
    setIsRunning(true);
    
    intervalRef.current = setInterval(() => {
      setProgressState((prevProgress) => {
        if (useCap) {
          // Cap pattern: stop at capProgress
          if (prevProgress >= capProgress) {
            clearProgressInterval();
            setIsRunning(false);
            return capProgress;
          }
          return prevProgress + increment;
        } else {
          // Continuous pattern: increment until maxProgress
          const nextProgress = prevProgress + increment;
          if (nextProgress >= maxProgress) {
            clearProgressInterval();
            setIsRunning(false);
            return maxProgress;
          }
          return nextProgress;
        }
      });
    }, interval);
  }, [increment, interval, maxProgress, capProgress, useCap, clearProgressInterval]);

  // Stop progress simulation
  const stop = useCallback(() => {
    clearProgressInterval();
    setIsRunning(false);
  }, [clearProgressInterval]);

  // Complete progress (set to maxProgress)
  const complete = useCallback(() => {
    clearProgressInterval();
    setIsRunning(false);
    setProgressState(maxProgress);
  }, [maxProgress, clearProgressInterval]);

  // Reset progress to initial value
  const reset = useCallback(() => {
    clearProgressInterval();
    setIsRunning(false);
    setProgressState(initialProgress);
  }, [initialProgress, clearProgressInterval]);

  // Set progress to specific value
  const setProgress = useCallback((value: number) => {
    setProgressState(Math.max(0, Math.min(maxProgress, value)));
  }, [maxProgress]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      clearProgressInterval();
    };
  }, [clearProgressInterval]);

  return {
    progress,
    start,
    stop,
    complete,
    reset,
    setProgress,
    isRunning,
  };
};

// Export the hook as default for convenience
export default useProgressBar;