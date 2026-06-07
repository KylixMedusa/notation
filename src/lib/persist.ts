/**
 * Ask the browser to persist storage so the offline cache (and, later, Firestore's IndexedDB
 * cache) isn't evicted under storage pressure. Matters especially on iOS, which can clear
 * storage after ~7 days of non-use. No-op where unsupported.
 */
export async function requestPersistentStorage(): Promise<void> {
  if (typeof navigator !== "undefined" && navigator.storage?.persist) {
    try {
      await navigator.storage.persist();
    } catch {
      /* ignore — best effort */
    }
  }
}
