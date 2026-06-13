import type { StatusVariant } from '@/components/ui/StatusBadge';

// Маппинг статусов сервисных заявок (числовые enum значения + строковые ключи)
const SERVICE_STATUS_MAP: Record<string, { label: string; variant: StatusVariant }> = {
  // Числовые ключи (из backend enum)
  '0': { label: 'Новая', variant: 'info' },
  '1': { label: 'В работе', variant: 'warning' },
  '2': { label: 'Ожидает запчасти', variant: 'info' },
  '3': { label: 'Завершена', variant: 'success' },
  '4': { label: 'Закрыта', variant: 'neutral' },
  // Строковые ключи (для обратной совместимости)
  new: { label: 'Новая', variant: 'info' },
  submitted: { label: 'Новая', variant: 'info' },
  inprogress: { label: 'В работе', variant: 'warning' },
  in_progress: { label: 'В работе', variant: 'warning' },
  awaitingparts: { label: 'Ожидает запчасти', variant: 'info' },
  awaiting_parts: { label: 'Ожидает запчасти', variant: 'info' },
  completed: { label: 'Завершена', variant: 'success' },
  closed: { label: 'Закрыта', variant: 'neutral' },
};

export function getServiceStatusConfig(status: string | number | undefined): { label: string; variant: StatusVariant } {
  const key = String(status ?? '').toLowerCase();
  return SERVICE_STATUS_MAP[key] ?? { label: String(status ?? '--'), variant: 'neutral' };
}

// Список статусов для фильтра
export const SERVICE_STATUS_OPTIONS = [
  { value: '', label: 'Все статусы' },
  { value: '0', label: 'Новая' },
  { value: '1', label: 'В работе' },
  { value: '2', label: 'Ожидает запчасти' },
  { value: '3', label: 'Завершена' },
  { value: '4', label: 'Закрыта' },
];