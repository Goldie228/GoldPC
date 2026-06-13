import type { StatusVariant } from '@/components/ui/StatusBadge';

// Маппинг статусов заказа (числовые enum значения из OrderStatus.cs + строковые ключи)
const STATUS_MAP: Record<string, { label: string; variant: StatusVariant }> = {
  // Числовые ключи (из backend enum)
  '0': { label: 'Новый', variant: 'info' },
  '1': { label: 'В обработке', variant: 'warning' },
  '2': { label: 'Оплачен', variant: 'info' },
  '3': { label: 'В сборке', variant: 'warning' },
  '4': { label: 'Готов', variant: 'success' },
  '5': { label: 'Выдан', variant: 'success' },
  '6': { label: 'Отменён', variant: 'neutral' },
  // Строковые ключи (для обратной совместимости)
  new: { label: 'Новый', variant: 'info' },
  pending: { label: 'Ожидает', variant: 'info' },
  processing: { label: 'В обработке', variant: 'warning' },
  paid: { label: 'Оплачен', variant: 'info' },
  inprogress: { label: 'В сборке', variant: 'warning' },
  in_progress: { label: 'В сборке', variant: 'warning' },
  ready: { label: 'Готов', variant: 'success' },
  shipped: { label: 'Отправлен', variant: 'info' },
  delivered: { label: 'Доставлен', variant: 'success' },
  completed: { label: 'Выдан', variant: 'success' },
  cancelled: { label: 'Отменён', variant: 'neutral' },
};

export function getStatusConfig(status: string | number | undefined): { label: string; variant: StatusVariant } {
  const key = String(status ?? '').toLowerCase();
  return STATUS_MAP[key] ?? { label: String(status ?? '--'), variant: 'neutral' };
}

// Список статусов для фильтра
export const ORDER_STATUS_OPTIONS = [
  { value: '', label: 'Все статусы' },
  { value: '0', label: 'Новый' },
  { value: '1', label: 'В обработке' },
  { value: '2', label: 'Оплачен' },
  { value: '3', label: 'В сборке' },
  { value: '4', label: 'Готов' },
  { value: '5', label: 'Выдан' },
  { value: '6', label: 'Отменён' },
];
