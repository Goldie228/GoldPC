/**
 * ComponentSlot - Slot for PC Builder component selection
 *
 * Features:
 * - Dark background with gold/gray/red borders (3 states)
 * - 64x64 product thumbnail in white frame
 * - Inline StatusBadge for compatibility errors
 * - Smooth transitions 0.3s, scale on add
 * - CPU/GPU priority placement (120% size)
 * - Staggered animations
 */

import { motion, useReducedMotion } from 'framer-motion';
import { AlertTriangle } from 'lucide-react';
import './ComponentSlot.css';

export interface ComponentSlotProps {
  /** Component type label (e.g., "Процессор", "Видеокарта") */
  type: string;
  /** Component name (or placeholder if empty) */
  name: string;
  /** Component price in BYN */
  price: number | null;
  /** Slot state */
  state: 'empty' | 'selected' | 'incompatible';
  /** Icon SVG element */
  icon: React.ReactNode;
  /** Optional specs array */
  specs?: string[];
  /** Optional warning message for compatibility errors */
  warning?: string;
  /** Button click handler */
  onSelect: () => void;
  /** Снять выбор (кнопка «Снять» рядом с основным действием) */
  onClear?: () => void;
  /** Button text (default: "Выбрать" for empty, "Изменить" for selected) */
  buttonText?: string;
  /** Animation index for staggered entry */
  index?: number;
  /** Product image URL for 64x64 thumbnail */
  imageUrl?: string;
  /** Is this a priority slot (CPU/GPU) - gets 120% size */
  isPriority?: boolean;
  /** Short description/hint for the component type (e.g., "Мозг компьютера. Отвечает за все вычисления.") */
  description?: string;
  /** Current quantity for multi-slot types (RAM, fan, storage) */
  quantity?: number;
  /** Max quantity for this multi-slot type */
  maxQuantity?: number;
  /** Change quantity: negative = remove, positive = add more */
  onChangeQuantity?: (delta: number) => void;
}

/** Inline StatusBadge for compatibility errors */
function StatusBadge({ message, duration }: { message: string; duration: number }) {
  return (
    <motion.div
      className="component-slot__status-badge"
      initial={{ opacity: 0, scale: 0.8, y: -4 }}
      animate={{ opacity: 1, scale: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.8 }}
      transition={{ duration, ease: [0.22, 1, 0.36, 1] }}
    >
      <AlertTriangle size={12} />
      <span>{message}</span>
    </motion.div>
  );
}

export function ComponentSlot({
  type,
  name,
  price,
  state,
  icon,
  specs,
  warning,
  onSelect,
  onClear,
  buttonText,
  index = 0,
  imageUrl,
  isPriority = false,
  description,
  quantity,
  maxQuantity,
  onChangeQuantity,
}: ComponentSlotProps) {
  /** BUG-24: Respect prefers-reduced-motion to disable JS animations for a11y */
  const reducedMotion = useReducedMotion();
  const animDuration = reducedMotion ? 0 : 0.3;

  const getButtonText = () => {
    if (buttonText) return buttonText;
    if (state === 'empty') return 'Выбрать';
    if (state === 'incompatible') return 'Выбрать другой';
    return 'Изменить';
  };

  const getButtonVariant = () => {
    if (state === 'empty') return 'primary';
    if (state === 'incompatible') return 'default';
    return 'ghost';
  };

  return (
    <motion.div
      title={description}
      className={`component-slot component-slot--${state}${isPriority ? ' component-slot--priority' : ''}`}
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{
        duration: animDuration,
        delay: index * 0.08,
        ease: [0.22, 1, 0.36, 1],
      }}
      layout="position"
    >
      {description && <div className="component-slot__tooltip">{description}</div>}
      <div className="component-slot__inner">
        {/* Icon or Thumbnail */}
        <motion.div
          className={`component-slot__icon${state !== 'empty' && imageUrl ? ' component-slot__icon--has-thumbnail' : ''}`}
          animate={{
            scale: state === 'selected' ? 1.12 : 1,
          }}
          transition={{ duration: animDuration, ease: [0.22, 1, 0.36, 1] }}
        >
          {state !== 'empty' && imageUrl ? (
            <div className="component-slot__thumbnail">
              <img src={imageUrl} alt={name} loading="lazy" />
            </div>
          ) : (
            icon
          )}
        </motion.div>

        {/* Info */}
        <div className="component-slot__info">
          <div className="component-slot__type-row">
            <span className="component-slot__type">{type}</span>
          </div>
          {quantity !== undefined && maxQuantity && onChangeQuantity && quantity > 0 && (
            <div className="component-slot__qty">
              <button
                type="button"
                className="component-slot__qty-btn"
                onClick={(e) => { e.stopPropagation(); if (quantity > 1) { onChangeQuantity(-1); } else { onClear?.(); } }}
                aria-label="Уменьшить количество"
              >
                −
              </button>
              <span className="component-slot__qty-value">{quantity}</span>
              <button
                type="button"
                className="component-slot__qty-btn"
                onClick={(e) => { e.stopPropagation(); if (quantity < maxQuantity) onChangeQuantity(1); }}
                aria-label="Увеличить количество"
                disabled={quantity >= maxQuantity}
              >
                +
              </button>
            </div>
          )}
          <motion.div
            initial={{ opacity: 0, y: 5 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: animDuration }}
            className={`component-slot__name ${state === 'empty' ? 'component-slot__name--empty' : ''}`}
          >
            {name}
          </motion.div>
          {specs && specs.length > 0 && (
            <motion.div
              className="component-slot__specs"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: reducedMotion ? 0 : 0.15, duration: animDuration }}
            >
              {specs.map((spec, i) => (
                <span key={i} className="component-slot__spec">
                  {spec}
                </span>
              ))}
            </motion.div>
          )}
          {/* Inline StatusBadge for incompatible state */}
          {warning && state === 'incompatible' && <StatusBadge message={warning} duration={animDuration} />}
        </div>

        {/* Price */}
        <div className="component-slot__price">
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: animDuration }}
          >
            {price !== null ? (
              <div className="component-slot__price-value">{price.toLocaleString('ru-BY')} BYN</div>
            ) : (
              <div className="component-slot__price-empty">—</div>
            )}
          </motion.div>
        </div>

        {/* Снять + основное действие — одна группа справа */}
        <div className="component-slot__actions">
          {onClear && (state === 'selected' || state === 'incompatible') && (
            <button
              type="button"
              className="component-slot__clear"
              onClick={e => {
                e.stopPropagation();
                onClear();
              }}
            >
              Снять
            </button>
          )}
          <button
            type="button"
            className={`component-slot__btn component-slot__btn--${getButtonVariant()}`}
            onClick={onSelect}
          >
            {getButtonText()}
          </button>
        </div>
      </div>
    </motion.div>
  );
}
