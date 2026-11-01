/**
 * RENTORA Concurrency & Atomic Resource Lock Strategy
 * 
 * Prevents race conditions and duplicate reservations when simultaneous
 * booking requests target the same institutional resource or time window.
 */

class ResourceLockManager {
  private locks: Map<string, Promise<void>> = new Map();

  /**
   * Execute an asynchronous task within a sequential lock keyed by resourceId.
   * Concurrent requests for the same resource are queued and executed one after another,
   * guaranteeing that atomic overlap verification and reservation creation never collide.
   */
  async withLock<T>(resourceId: string, task: () => Promise<T>): Promise<T> {
    const key = `res:${resourceId}`;

    while (this.locks.has(key)) {
      try {
        await this.locks.get(key);
      } catch {
        // Previous operation finished, continue
      }
    }

    let releaseLock: () => void;
    const lockPromise = new Promise<void>((resolve) => {
      releaseLock = resolve;
    });

    this.locks.set(key, lockPromise);

    try {
      return await task();
    } finally {
      this.locks.delete(key);
      releaseLock!();
    }
  }
}

export const resourceLock = new ResourceLockManager();
