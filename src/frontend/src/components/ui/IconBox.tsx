import type { LucideIcon } from 'lucide-react';

interface IconBoxProps {
  icon: LucideIcon;
  size?: number;
  containerSize?: 'sm' | 'md' | 'lg';
  variant?: 'default' | 'gold';
}

const containerSizeMap: Record<string, string> = {
  sm: 'w-10 h-10',
  md: 'w-12 h-12',
  lg: 'w-14 h-14',
};

const iconSizeMap: Record<string, number> = {
  sm: 18,
  md: 22,
  lg: 26,
};

/**
 * IconBox — контейнер для иконки с фоновым заполнением.
 * Заменяет паттерн `w-12 h-12 bg-gold/10 text-gold rounded-lg`.
 * Дефолтный вариант — без gold (bg-surface-elevated).
 * variant="gold" — только для brand moments.
 */
export function IconBox({
  icon: Icon,
  size,
  containerSize = 'md',
  variant = 'default',
}: IconBoxProps) {
  const containerClass = containerSizeMap[containerSize] || containerSizeMap.md;
  const iconSize = size || iconSizeMap[containerSize] || 22;

  const variantClass =
    variant === 'gold'
      ? 'bg-gold/10 text-gold'
      : 'bg-surface-elevated text-muted-foreground';

  return (
    <div
      className={`${containerClass} rounded-lg ${variantClass} flex items-center justify-center shrink-0`}
    >
      <Icon size={iconSize} />
    </div>
  );
}
