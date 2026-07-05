/**
 * usePersistence — LocalStorage + optional API синхронный for PC Builder
 * Isolated side effect: localStorage read/write + debounced API auto-save
 */

import { useEffect, useRef, useCallback } from 'react';
import { saveToLocalStorage, loadFromLocalStorage } from '@/features/pc-builder/logic/persistence';
import type { PCBuilderSelectedState } from '@/features/pc-builder/logic/types';

interface UsePersistenceOptions {
  initialState: PCBuilderSelectedState;
  onClearStorage: () => void;
  /** When provided, auto-save is debounced and sent to the API */
  autoSaveToApi?: (state: PCBuilderSelectedState) => Promise<void>;
  /** When current is true, skip saving to localStorage and API (used during config loading) */
  skipSaveRef?: { current: boolean };
}

export function usePersistence(
  components: PCBuilderSelectedState,
  options: UsePersistenceOptions
): void {
  const isFirstRender = useRef(true);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const autoSaveToApi = options.autoSaveToApi;
  const skipSaveRef = options.skipSaveRef;

  // Always save to localStorage (immediate) — skip during config loading
  useEffect(() => {
    if (isFirstRender.current) {
      isFirstRender.current = false;
      return;
    }
    if (skipSaveRef?.current) return;
    saveToLocalStorage(components);
  }, [components, skipSaveRef]);

  // Debounced API auto-save (when autoSaveToApi is provided)
  const debouncedApiSave = useCallback(
    (state: PCBuilderSelectedState) => {
      if (!autoSaveToApi) return;
      if (debounceRef.current) clearTimeout(debounceRef.current);
      debounceRef.current = setTimeout(() => {
        void autoSaveToApi(state);
      }, 2000); // 2 second debounce
    },
    [autoSaveToApi]
  );

  useEffect(() => {
    if (isFirstRender.current) return;
    if (skipSaveRef?.current) return;
    debouncedApiSave(components);
  }, [components, debouncedApiSave, skipSaveRef]);

  useEffect(() => {
    return () => {
      isFirstRender.current = true;
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, []);

  const handleClear = options.onClearStorage;
  useEffect(() => {
    if (!isFirstRender.current) {
      handleClear();
    }
  }, [handleClear]);
}

export function loadInitialState() {
  return loadFromLocalStorage();
}
