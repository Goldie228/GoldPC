/**
 * useRamTrim — Auto-trim RAM modules to motherboard slot limit
 * Isolated side effect: state update based on slot limits
 */

import { useEffect } from 'react';
import type { PCBuilderSelectedState } from '@/features/pc-builder/logic/types';

interface UseRamTrimOptions {
  ramModules: PCBuilderSelectedState['ram'];
  maxModules: number;
  onTrim: (trimmedRam: PCBuilderSelectedState['ram']) => void;
}

export function useRamTrim(options: UseRamTrimOptions): void {
  const { ramModules, maxModules, onTrim } = options;

  useEffect(() => {
    if (ramModules.length > maxModules) {
      onTrim(ramModules.slice(0, maxModules));
    }
  }, [ramModules.length, maxModules]);
}