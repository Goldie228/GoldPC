/**
 * PC Builder Local Storage utilities
 *
 * Save/load PC configurations to localStorage with 30-day auto-expiry.
 */

const STORAGE_PREFIX = 'goldpc_builder_';
const EXPIRY_MS = 30 * 24 * 60 * 60 * 1000; // 30 days

interface StorageEnvelope<T> {
  data: T;
  savedAt: number;
  expiresAt: number;
}

/**
 * Save data to localStorage with 30-day expiry.
 * Silently fails if storage is full or unavailable.
 */
export function saveToLocalStorage<T>(key: string, data: T): boolean {
  try {
    if (typeof localStorage === 'undefined') return false;
    const now = Date.now();
    const envelope: StorageEnvelope<T> = {
      data,
      savedAt: now,
      expiresAt: now + EXPIRY_MS,
    };
    localStorage.setItem(STORAGE_PREFIX + key, JSON.stringify(envelope));
    return true;
  } catch {
    return false;
  }
}

/**
 * Load data from localStorage. Returns null if missing or expired.
 */
export function loadFromLocalStorage<T>(key: string): T | null {
  try {
    if (typeof localStorage === 'undefined') return null;
    const raw = localStorage.getItem(STORAGE_PREFIX + key);
    if (!raw) return null;
    const envelope: StorageEnvelope<T> = JSON.parse(raw);
    if (Date.now() > envelope.expiresAt) {
      localStorage.removeItem(STORAGE_PREFIX + key);
      return null;
    }
    return envelope.data;
  } catch {
    return null;
  }
}

/**
 * Remove a specific key from storage.
 */
export function removeFromLocalStorage(key: string): void {
  try {
    localStorage.removeItem(STORAGE_PREFIX + key);
  } catch { /* noop */ }
}

/**
 * Clear all GoldPC builder entries from localStorage.
 */
export function clearBuilderStorage(): void {
  try {
    const keys: string[] = [];
    for (let i = 0; i < localStorage.length; i++) {
      const k = localStorage.key(i);
      if (k && k.startsWith(STORAGE_PREFIX)) keys.push(k);
    }
    keys.forEach(k => localStorage.removeItem(k));
  } catch { /* noop */ }
}

/**
 * Get all saved configuration keys.
 */
export function getSavedConfigKeys(): string[] {
  try {
    const keys: string[] = [];
    for (let i = 0; i < localStorage.length; i++) {
      const k = localStorage.key(i);
      if (k && k.startsWith(STORAGE_PREFIX)) {
        keys.push(k.slice(STORAGE_PREFIX.length));
      }
    }
    return keys;
  } catch {
    return [];
  }
}

/**
 * Check if a key exists and is not expired.
 */
export function hasStoredConfig(key: string): boolean {
  return loadFromLocalStorage(key) !== null;
}

/**
 * Get remaining time in ms before expiry, or 0 if expired/missing.
 */
export function getTimeUntilExpiry(key: string): number {
  try {
    const raw = localStorage.getItem(STORAGE_PREFIX + key);
    if (!raw) return 0;
    const envelope: StorageEnvelope<unknown> = JSON.parse(raw);
    return Math.max(0, envelope.expiresAt - Date.now());
  } catch {
    return 0;
  }
}
