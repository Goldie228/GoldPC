/**
 * BIOS checking logic - extracted from compatibilityUtils.ts
 * Handles BIOS update warnings based on CPU socket and motherboard chipset
 */

import type { CompatibilityWarning } from './types';
import type { CompatibilityRulesConfig, SocketGroup } from '../../../config/compatibilityTypes';
import rulesConfig from '../../../config/compatibilityRules.json';

const config: CompatibilityRulesConfig = rulesConfig as unknown as CompatibilityRulesConfig;
const SOCKET_GROUPS: SocketGroup[] = config.socketCompatibility.groups;

function findSocketGroup(socket: string): SocketGroup | null {
  return SOCKET_GROUPS.find(g => g.sockets.some(s => s.toUpperCase() === socket.toUpperCase())) ?? null;
}

export function checkBiosWarning(cpuSocket: string | null, chipset: string | null): CompatibilityWarning | null {
  if (!cpuSocket) return null;
  const group = findSocketGroup(cpuSocket);
  if (!group || !group.biosWarning.enabled) return null;
  if (chipset && group.biosWarning.affectedChipsets?.length) {
    const isAffected = group.biosWarning.affectedChipsets.some(
      c => c.toUpperCase() === chipset.toUpperCase()
    );
    if (!isAffected) return null;
  }
  return {
    severity: 'Warning',
    component: 'BIOS',
    message: group.biosWarning.message ?? 'Требуется обновление BIOS',
    suggestion: `Вероятность: ${group.biosWarning.probability}`,
  };
}