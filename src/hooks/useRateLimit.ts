import { useState, useEffect, useCallback } from 'react';

interface RateLimitState {
  attempts: number;
  isLocked: boolean;
  lockoutEnd: number | null;
  lastAttempt: number | null;
}

interface UseRateLimitOptions {
  maxAttempts?: number;
  lockoutDuration?: number; // in seconds
  resetPeriod?: number; // in seconds
  storageKey?: string;
}

export function useRateLimit(options: UseRateLimitOptions = {}) {
  const {
    maxAttempts = 5,
    lockoutDuration = 300, // 5 minutes
    resetPeriod = 900, // 15 minutes
    storageKey = 'auth_rate_limit'
  } = options;

  const [state, setState] = useState<RateLimitState>({
    attempts: 0,
    isLocked: false,
    lockoutEnd: null,
    lastAttempt: null
  });

  // Load state from localStorage on mount
  useEffect(() => {
    const stored = localStorage.getItem(storageKey);
    if (stored) {
      try {
        const parsedState = JSON.parse(stored) as RateLimitState;
        const now = Date.now();
        
        // Check if lockout period has expired
        if (parsedState.lockoutEnd && now > parsedState.lockoutEnd) {
          setState({
            attempts: 0,
            isLocked: false,
            lockoutEnd: null,
            lastAttempt: null
          });
        } else if (parsedState.lastAttempt && now - parsedState.lastAttempt > resetPeriod * 1000) {
          // Reset attempts after reset period
          setState({
            attempts: 0,
            isLocked: false,
            lockoutEnd: null,
            lastAttempt: null
          });
        } else {
          setState(parsedState);
        }
      } catch (error) {
        console.error('Error parsing rate limit state:', error);
      }
    }
  }, [storageKey, resetPeriod]);

  // Save state to localStorage whenever it changes
  useEffect(() => {
    localStorage.setItem(storageKey, JSON.stringify(state));
  }, [state, storageKey]);

  // Check lockout status periodically
  useEffect(() => {
    if (!state.isLocked || !state.lockoutEnd) return;

    const checkLockout = () => {
      const now = Date.now();
      if (now > state.lockoutEnd!) {
        setState(prev => ({
          ...prev,
          isLocked: false,
          lockoutEnd: null
        }));
      }
    };

    const interval = setInterval(checkLockout, 1000);
    return () => clearInterval(interval);
  }, [state.isLocked, state.lockoutEnd]);

  const recordAttempt = useCallback((successful: boolean = false) => {
    const now = Date.now();
    
    setState(prev => {
      if (successful) {
        // Reset on successful attempt
        return {
          attempts: 0,
          isLocked: false,
          lockoutEnd: null,
          lastAttempt: now
        };
      }

      const newAttempts = prev.attempts + 1;
      const shouldLock = newAttempts >= maxAttempts;
      
      return {
        attempts: newAttempts,
        isLocked: shouldLock,
        lockoutEnd: shouldLock ? now + (lockoutDuration * 1000) : null,
        lastAttempt: now
      };
    });
  }, [maxAttempts, lockoutDuration]);

  const reset = useCallback(() => {
    setState({
      attempts: 0,
      isLocked: false,
      lockoutEnd: null,
      lastAttempt: null
    });
  }, []);

  const getRemainingLockoutTime = useCallback(() => {
    if (!state.isLocked || !state.lockoutEnd) return 0;
    return Math.max(0, state.lockoutEnd - Date.now());
  }, [state.isLocked, state.lockoutEnd]);

  const canAttempt = useCallback(() => {
    return !state.isLocked;
  }, [state.isLocked]);

  return {
    attempts: state.attempts,
    maxAttempts,
    isLocked: state.isLocked,
    lockoutDuration,
    remainingAttempts: Math.max(0, maxAttempts - state.attempts),
    recordAttempt,
    reset,
    canAttempt,
    getRemainingLockoutTime
  };
}