/**
 * ComponentSlot - Слот для выбора компонента в конструкторе ПК
 *
 * Особенности:
 * - Тёмный фон с золотистыми/серыми/красными рамками (3 состояния)
 * - Миниатюра товара 64x64 в белой рамке
 * - Встроенный StatusBadge для ошибок совместимости
 * - Плавные переходы 0.3s, масштабирование при добавлении
 * - Приоритетное размещение CPU/GPU (размер 120%)
 * - Поэтапные анимации
 */

import React from 'react';
import { motion, useReducedMotion } from 'framer-motion';
import { AlertTriangle } from 'lucide-react';
import './ComponentSlot.css';

export interface ComponentSlotProps {
  /** Тип компонента (например, "Процессор", "Видеокарта") */
  type: string;
  /** Название компонента (или плейсхолдер если пусто) */
  name: string;
  /** Цена компонента в BYN */
  price: number | null;
  /** Состояние слота */
  state: 'empty' | 'selected' | 'incompatible';
  /** SVG-элемент иконки */
  icon: React.ReactNode;
  /** Необязательный массив спецификаций */
  specs?: string[];
  /** Необязательное сообщение об ошибке совместимости */
  warning?: string;
  /** Обработчик нажатия кнопки */
  onSelect: () => void;
  /** Снять выбор (кнопка «Снять» рядом с основным действием) */
  onClear?: () => void;
  /** Текст кнопки (по умолчанию: "Выбрать" для пустого, "Изменить" для выбранного) */
  buttonText?: string;
  /** Индекс анимации для поэтапного появления */
  index?: number;
  /** URL изображения товара для миниатюры 64x64 */
  imageUrl?: string;
  /** Приоритетный слот (CPU/GPU) — размер 120% */
  isPriority?: boolean;
  /** Краткое описание/подсказка для типа компонента (например, "Мозг компьютера. Отвечает за все вычисления.") */
  description?: string;
  /** Текущее количество для мульти-слотовых типов (ОЗУ, вентилятор, накопитель) */
  quantity?: number;
  /** Максимальное количество для этого мульти-слотового типа */
  maxQuantity?: number;
  /** Изменение количества: отрицательное = удалить, положительное = добавить */
  onChangeQuantity?: (delta: number) => void;
}

/** Встроенный StatusBadge для ошибок совместимости */
function StatusBadge({ message, duration }: { message: string; duration: number }) {
  return (
    <motion.div
      className="component-slot__status-badge"
      initial={{ opacity: 0, scale: 0.8, y: -4 }}
      animate={{ opacity: 1, scale: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.8 }}
      transition={{ duration, ease: [0.22, 1, 0.36, 1] as const }}
    >
      <AlertTriangle size={12} />
      <span>{message}</span>
    </motion.div>
  );
}

export const ComponentSlot = React.memo(function ComponentSlot(componentSlotProps: ComponentSlotProps) {
  const {
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
  } = componentSlotProps;
  /** BUG-24: Учитываем prefers-reduced-motion для отключения JS-анимаций (а11y) */
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
        ease: [0.22, 1, 0.36, 1] as const,
      }}
      layout="position"
    >
      {description && (
        <div className="component-slot__tooltip">{description}</div>
      )}
      <div className="component-slot__inner">
        {/* Иконка или миниатюра */}
        <motion.div
          className={`component-slot__icon${state !== 'empty' && imageUrl ? ' component-slot__icon--has-thumbnail' : ''}`}
          animate={{
            scale: state === 'selected' ? 1.12 : 1,
          }}
          transition={{ duration: animDuration, ease: [0.22, 1, 0.36, 1] as const }}
        >
          {state !== 'empty' && imageUrl ? (
            <div className="component-slot__thumbnail">
              <img src={imageUrl} alt={name} loading="lazy" />
            </div>
          ) : (
            icon
          )}
        </motion.div>

        {/* Информация */}
        <div className="component-slot__info">
          {state === 'empty' && (
            <div className="component-slot__type-row">
              <span className="component-slot__type">{type}</span>
            </div>
          )}
          {quantity !== undefined && maxQuantity && onChangeQuantity && quantity > 0 && type !== 'Накопитель' && (
            <div className="component-slot__qty">
              <button
                type="button"
                className="component-slot__qty-btn"
                onClick={(e) => {
                  e.stopPropagation();
                  e.preventDefault();
                  // Двойная проверка: проверяем и текущее состояние, и немедленное значение
                  if (quantity > 1) {
                    onChangeQuantity(-1);
                  }
                }}
                aria-label="Уменьшить количество"
                disabled={quantity <= 1}
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
          {/* Встроенный StatusBadge для несовместимого состояния */}
          {warning && state === 'incompatible' && <StatusBadge message={warning} duration={animDuration} />}
        </div>

        {/* Цена */}
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
});
