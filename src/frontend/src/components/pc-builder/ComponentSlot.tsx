/**
 * ComponentSlot - Slot for PC Builder component selection
 * 
 * Features:
 * - Dark background with gold border
 * - Icon, name, price display
 * - Select/Change button
 * - Empty, Selected, and Incompatible states
 */

import { motion } from 'framer-motion';
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
  /** Optional warning message */
  warning?: string;
  /** Button click handler */
  onSelect: () => void;
  /** Button text (default: "Выбрать" for empty, "Изменить" for selected) */
  buttonText?: string;
  /** Animation index for staggered entry */
  index?: number;
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
  buttonText,
  index = 0,
}: ComponentSlotProps) {
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
      className={`component-slot component-slot--${state}`}
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ 
        duration: 0.4, 
        delay: index * 0.05,
        ease: [0.22, 1, 0.36, 1] 
      }}
      layout
    >
      <div className="component-slot__inner">
        {/* Icon */}
        <motion.div 
          className="component-slot__icon"
          animate={{ 
            scale: state === 'selected' ? 1.1 : 1,
            color: state === 'selected' ? 'var(--gold-primary)' : 'inherit'
          }}
        >
          {icon}
        </motion.div>

        {/* Info */}
        <div className="component-slot__info">
          <span className="component-slot__type">{type}</span>
          <motion.div 
            key={name}
            initial={{ opacity: 0, y: 5 }}
            animate={{ opacity: 1, y: 0 }}
            className={`component-slot__name ${state === 'empty' ? 'component-slot__name--empty' : ''}`}
          >
            {name}
          </motion.div>
          {specs && specs.length > 0 && (
            <motion.div 
              className="component-slot__specs"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.2 }}
            >
              {specs.map((spec, index) => (
                <span key={index} className="component-slot__spec">{spec}</span>
              ))}
            </motion.div>
          )}
          {warning && state === 'incompatible' && (
            <motion.div 
              className="component-slot__warning"
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
            >
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/>
                <line x1="12" y1="9" x2="12" y2="13"/>
                <line x1="12" y1="17" x2="12.01" y2="17"/>
              </svg>
              {warning}
            </motion.div>
          )}
        </div>

        {/* Price */}
        <div className="component-slot__price">
          <motion.div 
            key={price}
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
          >
            {price !== null ? (
              <div className="component-slot__price-value">{price.toLocaleString('ru-BY')} BYN</div>
            ) : (
              <div className="component-slot__price-empty">—</div>
            )}
          </motion.div>
        </div>

        {/* Button */}
        <button 
          className={`component-slot__btn component-slot__btn--${getButtonVariant()}`}
          onClick={onSelect}
        >
          {getButtonText()}
        </button>
      </div>
    </motion.div>
  );
}