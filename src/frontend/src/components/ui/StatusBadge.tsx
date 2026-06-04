import { motion } from 'framer-motion';

export type StatusVariant =
  | 'info'      // bg-info-blue/10 text-info-blue — "Активен", "Доставлен"
  | 'warning'   // bg-warning/10 text-warning — "В обработке", "Ожидает"
  | 'neutral'   // bg-muted/10 text-muted-foreground — "Отменён", "Истекла"
  | 'success'   // bg-price-drop/10 text-price-drop — ТОЛЬКО для оплачено
  | 'pending';  // bg-surface-elevated text-foreground — "Черновик"

interface StatusBadgeProps {
  variant: StatusVariant;
  label: string;
  pulse?: boolean;
}

const variantStyles: Record<StatusVariant, string> = {
  info: 'bg-info-blue/10 text-info-blue',
  warning: 'bg-warning/15 text-warning',
  neutral: 'bg-muted/10 text-muted-foreground',
  success: 'bg-price-drop/10 text-price-drop',
  pending: 'bg-surface-elevated text-foreground',
};

const dotStyles: Record<StatusVariant, string> = {
  info: 'bg-info-blue',
  warning: 'bg-warning',
  neutral: 'bg-muted-foreground',
  success: 'bg-price-drop',
  pending: 'bg-muted-foreground',
};

/**
 * StatusBadge — бейдж статуса.
 * price-drop/price-rise используются ТОЛЬКО для ценовых сигналов.
 * Статусы используют info/warning/neutral.
 * Размер rounded-sm (4px) как в DESIGN.md.
 */
export function StatusBadge({ variant, label, pulse }: StatusBadgeProps) {
  return (
    <motion.span
      className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-sm text-xs font-medium ${variantStyles[variant]}`}
      animate={pulse ? { scale: [1, 1.05, 1], opacity: [1, 0.85, 1] } : undefined}
      transition={pulse ? { duration: 2, repeat: Infinity, ease: 'easeInOut' } : undefined}
    >
      <span className={`w-1.5 h-1.5 rounded-full ${dotStyles[variant]}`} />
      {label}
    </motion.span>
  );
}
