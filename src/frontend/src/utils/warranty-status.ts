import type { StatusVariant } from '@/components/ui/StatusBadge';

// Маппинг статусов гарантийных претензий (числовые enum значения + строковые ключи)
const WARRANTY_STATUS_MAP: Record<string, { label: string; variant: StatusVariant }> = {
  // Числовые ключи (из backend enum)
  '0': { label: 'Новая', variant: 'info' },
  '1': { label: 'В обработке', variant: 'warning' },
  '2': { label: 'Одобрена', variant: 'success' },
  '3': { label: 'Отклонена', variant: 'neutral' },
  '4': { label: 'Завершена', variant: 'success' },
  // Строковые ключи (для обратной совместимости)
  new: { label: 'Новая', variant: 'info' },
  inprogress: { label: 'В обработке', variant: 'warning' },
  in_progress: { label: 'В обработке', variant: 'warning' },
  approved: { label: 'Одобрена', variant: 'success' },
  rejected: { label: 'Отклонена', variant: 'neutral' },
  completed: { label: 'Завершена', variant: 'success' },
};

export function getWarrantyStatusConfig(status: string | number | undefined): { label: string; variant: StatusVariant } {
  const key = String(status ?? '').toLowerCase();
  return WARRANTY_STATUS_MAP[key] ?? { label: String(status ?? '--'), variant: 'neutral' };
}

// Список статусов для фильтра
export const WARRANTY_STATUS_OPTIONS = [
  { value: '', label: 'Все статусы' },
  { value: '0', label: 'Новая' },
  { value: '1', label: 'В обработке' },
  { value: '2', label: 'Одобрена' },
  { value: '3', label: 'Отклонена' },
  { value: '4', label: 'Завершена' },
];
