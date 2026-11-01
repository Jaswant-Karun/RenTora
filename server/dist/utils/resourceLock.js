"use strict";
/**
 * RENTORA Concurrency & Atomic Resource Lock Strategy
 *
 * Prevents race conditions and duplicate reservations when simultaneous
 * booking requests target the same institutional resource or time window.
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.resourceLock = void 0;
class ResourceLockManager {
    locks = new Map();
    /**
     * Execute an asynchronous task within a sequential lock keyed by resourceId.
     * Concurrent requests for the same resource are queued and executed one after another,
     * guaranteeing that atomic overlap verification and reservation creation never collide.
     */
    async withLock(resourceId, task) {
        const key = `res:${resourceId}`;
        while (this.locks.has(key)) {
            try {
                await this.locks.get(key);
            }
            catch {
                // Previous operation finished, continue
            }
        }
        let releaseLock;
        const lockPromise = new Promise((resolve) => {
            releaseLock = resolve;
        });
        this.locks.set(key, lockPromise);
        try {
            return await task();
        }
        finally {
            this.locks.delete(key);
            releaseLock();
        }
    }
}
exports.resourceLock = new ResourceLockManager();
