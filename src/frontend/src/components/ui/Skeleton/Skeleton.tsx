import type { CSSProperties, ReactElement } from 'react';

export interface SkeletonProps {
  /**
   * Ширина скелетона (число в пикселях или строка CSS)
   */
  width?: number | string;
  /**
   * Высота скелетона (число в пикселях или строка CSS)
   */
  height?: number | string;
  /**
   * Дополнительный CSS класс
   */
  className?: string;
  /**
   * Inline стили
   */
  style?: CSSProperties;
  /**
   * Скругление углов
   */
  borderRadius?: 'none' | 'sm' | 'md' | 'lg' | 'full';
  /**
   * Анимация пульсации
   */
  animate?: boolean;
}

/**
 * Преобразовать значение в CSS строку
 */
function toCssValue(value: number | string | undefined): string | undefined {
  if (value === undefined) return undefined;
  return typeof value === 'number' ? `${value}px` : value;
}

/**
 * Получить класс скругления
 */
function getBorderRadiusClass(radius: SkeletonProps['borderRadius']): string | undefined {
  const radiusMap: Record<string, string> = {
    none: 'rounded-none',
    sm: 'rounded',
    md: 'rounded-md',
    lg: 'rounded-lg',
    full: 'rounded-full',
  };
  return radiusMap[radius ?? 'md'];
}

/**
 * Базовый компонент скелетона - серый пульсирующий блок
 * Используется для отображения состояния загрузки
 */
export function Skeleton({
  width,
  height,
  className,
  style,
  borderRadius = 'md',
  animate = true,
}: SkeletonProps): ReactElement {
  const cssWidth = toCssValue(width);
  const cssHeight = toCssValue(height);

  const combinedClassName = [
    "bg-surface-elevated animate-pulse",
    getBorderRadiusClass(borderRadius),
    className,
  ]
    .filter(Boolean)
    .join(' ');

  return (
    <div
      className={combinedClassName}
      style={{
        width: cssWidth,
        height: cssHeight,
        ...style,
      }}
      aria-hidden="true"
    />
  );
}

export default Skeleton;