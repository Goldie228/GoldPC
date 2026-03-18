/**
 * ComponentSlot - Slot for PC Builder component selection
 * 
 * Features:
 * - Dark background with gold border
 * - Icon, name, price display
 * - Select/Change button
 * - Empty, Selected, and Incompatible states
 */

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
    <div className={`component-slot component-slot--${state}`}>
      <div className="component-slot__inner">
        {/* Icon */}
        <div className="component-slot__icon">
          {icon}
        </div>

        {/* Info */}
        <div className="component-slot__info">
          <span className="component-slot__type">{type}</span>
          <div className={`component-slot__name ${state === 'empty' ? 'component-slot__name--empty' : ''}`}>
            {name}
          </div>
          {specs && specs.length > 0 && (
            <div className="component-slot__specs">
              {specs.map((spec, index) => (
                <span key={index} className="component-slot__spec">{spec}</span>
              ))}
            </div>
          )}
          {warning && state === 'incompatible' && (
            <div className="component-slot__warning">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/>
                <line x1="12" y1="9" x2="12" y2="13"/>
                <line x1="12" y1="17" x2="12.01" y2="17"/>
              </svg>
              {warning}
            </div>
          )}
        </div>

        {/* Price */}
        <div className="component-slot__price">
          {price !== null ? (
            <div className="component-slot__price-value">{price.toLocaleString('ru-RU')} BYN</div>
          ) : (
            <div className="component-slot__price-empty">—</div>
          )}
        </div>

        {/* Button */}
        <button 
          className={`component-slot__btn component-slot__btn--${getButtonVariant()}`}
          onClick={onSelect}
        >
          {getButtonText()}
        </button>
      </div>
    </div>
  );
}