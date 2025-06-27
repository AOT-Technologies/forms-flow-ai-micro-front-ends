import { useState, useEffect, useCallback } from "react";

/**
 * Configuration options for the success countdown
 */
interface SuccessCountdownOptions {
  /** Duration of each countdown tick in milliseconds */
  intervalDelay?: number;
}

/**
 * State object for the success countdown
 */
interface SuccessState {
  /** Whether the success message is currently showing */
  showSuccess: boolean;
  /** Current countdown value in seconds */
  countdown: number;
}

/**
 * Custom hook that provides a timed success state with countdown
 * Useful for showing temporary success messages that automatically dismiss
 * 
 * @param options - Configuration options for the countdown
 * @returns Object containing success state and function to trigger the countdown
 */
const useSuccessCountdown = (options: SuccessCountdownOptions = {}) => {
  const { intervalDelay = 1000 } = options;

  const [successState, setSuccessState] = useState<SuccessState>({
    showSuccess: false,
    countdown: 0,
  });
  
  const [onCountdownEnd, setOnCountdownEnd] = useState<(() => void) | null>(null);

  /**
   * Starts the success countdown with the specified callback and duration
   * 
   * @param callback - Function to call when countdown reaches zero
   * @param initialCount - Initial countdown value in seconds (default: 2)
   */
  const startSuccessCountdown = useCallback((
    callback?: () => void,
    initialCount: number = 2
  ) => {
    setSuccessState({ showSuccess: true, countdown: initialCount });
    setOnCountdownEnd(() => callback || null);
  }, []);

  useEffect(() => {
    if (successState.countdown >= 0 && successState.showSuccess) {
      const interval = setInterval(() => {
        setSuccessState((prev) => {
          if (prev.countdown <= 0) {
            clearInterval(interval);
            if (onCountdownEnd) onCountdownEnd();
            return { showSuccess: false, countdown: 0 };
          }
          return { ...prev, countdown: prev.countdown - 1 };
        });
      }, intervalDelay);

      return () => clearInterval(interval);
    }
  }, [successState.countdown, successState.showSuccess, intervalDelay, onCountdownEnd]);

  return {
    successState,
    startSuccessCountdown,
  };
};

export default useSuccessCountdown;