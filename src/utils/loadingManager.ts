// Centralized loading state manager to prevent race conditions
class LoadingStateManager {
  private loadingStates = new Map<string, boolean>();
  private callbacks = new Map<string, Set<(loading: boolean) => void>>();

  setLoading(key: string, loading: boolean) {
    const currentState = this.loadingStates.get(key);
    if (currentState === loading) return; // No change needed
    
    this.loadingStates.set(key, loading);
    const keyCallbacks = this.callbacks.get(key);
    if (keyCallbacks) {
      keyCallbacks.forEach(callback => callback(loading));
    }
  }

  isLoading(key: string): boolean {
    return this.loadingStates.get(key) || false;
  }

  subscribe(key: string, callback: (loading: boolean) => void) {
    if (!this.callbacks.has(key)) {
      this.callbacks.set(key, new Set());
    }
    this.callbacks.get(key)!.add(callback);
    
    // Immediately call with current state
    callback(this.isLoading(key));
    
    return () => {
      this.callbacks.get(key)?.delete(callback);
    };
  }

  reset() {
    this.loadingStates.clear();
    this.callbacks.clear();
  }
}

export const loadingManager = new LoadingStateManager();