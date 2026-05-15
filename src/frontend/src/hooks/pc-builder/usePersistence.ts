/**
 * usePersistence — LocalStorage sync for PC Builder
 * Isolated side effect: localStorage read/write
 */

import { useEffect, useRef } from 'react';
import { saveToLocalStorage, loadFromLocalStorage } from '@/features/pc-builder/logic/persistence';
import type { PCBuilderSelectedState } from '@/features/pc-builder/logic/types';

interface UsePersistenceOptions {
  initialState: PCBuilderSelectedState;
  onClearStorage: () => void;
}

export function usePersistence(
  components: PCBuilderSelectedState,
  options: UsePersistenceOptions
): void {
  const isFirstRender = useRef(true);

  useEffect(() => {
    if (isFirstRender.current) {
      isFirstRender.current = false;
      return;
    }
    saveToLocalStorage(components);
  }, [components]);

  useEffect(() => {
    return () => {
      isFirstRender.current = true;
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