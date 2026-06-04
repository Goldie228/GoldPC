import type { LucideIcon } from 'lucide-react';
import { ArrowUp, ArrowDown } from 'lucide-react';

interface StatCardProps {
  label: string;
  value: string | number;
  trend?: { direction: 'up' | 'down'; value: string };
  icon?: LucideIcon;
  variant?: 'default' | 'callout';
}

/**
 * StatCard — карточка статистики.
 * Не использует gold для value (только для callout variant).
 * Использует font-tabular для цифр.
 * Responsive: на mobile 2 колонки.
 */
export function StatCard({
  label,
  value,
  trend,
  icon: Icon,
  variant = 'default',
}: StatCardProps) {
  const valueColor =
    variant === 'callout' ? 'text-gold' : 'text-foreground';

  return (
    <div className="bg-card rounded-xl border border-border p-4">
      <div className="flex items-start justify-between">
        <div className="flex-1 min-w-0">
          <div
            className={`text-2xl font-bold font-tabular ${valueColor}`}
          >
            {value}
          </div>
          <div className="text-sm text-muted-foreground mt-1">{label}</div>
          {trend && (
            <div className="flex items-center gap-1 mt-1">
              {trend.direction === 'up' ? (
                <ArrowUp size={14} className="text-price-drop" />
              ) : (
                <ArrowDown size={14} className="text-price-rise" />
              )}
              <span className="text-xs text-muted-foreground">{trend.value}</span>
            </div>
          )}
        </div>
        {Icon && (
          <div className="w-10 h-10 rounded-lg bg-surface-elevated flex items-center justify-center shrink-0 ml-3">
            <Icon size={20} className="text-muted-foreground" />
          </div>
        )}
      </div>
    </div>
  );
}
