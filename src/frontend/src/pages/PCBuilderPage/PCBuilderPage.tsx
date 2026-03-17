import { useState } from 'react';
import './PCBuilderPage.css';

/**
 * PCBuilderPage - PC Configuration Builder
 * 
 * Features:
 * - Dark interface with component slots
 * - Compatibility status: Green (OK) or Red (Error) with gold borders
 * - Real-time price calculation
 * - Save/Share configuration
 */
export function PCBuilderPage() {
  const [config] = useState({
    cpu: { name: 'AMD Ryzen 7 7800X3D', price: 38990, compatible: true },
    gpu: { name: 'NVIDIA RTX 4070 Super', price: 58990, compatible: true },
    mb: { name: 'ASUS ROG Strix B650E-F', price: 28990, compatible: true },
    ram: { name: 'G.Skill Trident Z5 32GB DDR5-6000', price: 12990, compatible: true },
    storage: { name: 'Samsung 980 Pro 1TB NVMe', price: 9990, compatible: true },
    psu: { name: 'Corsair RM750x 750W', price: 11990, compatible: true },
    case: { name: 'Lian Li O11 Dynamic EVO', price: 14990, compatible: true },
    cooling: { name: 'NZXT Kraken X63 RGB', price: 16990, compatible: true },
  });

  const totalPrice = Object.values(config).reduce((sum, item) => sum + item.price, 0);
  const allCompatible = Object.values(config).every(item => item.compatible);

  const componentSlots = [
    { key: 'cpu', label: 'Процессор', icon: '🔲' },
    { key: 'gpu', label: 'Видеокарта', icon: '🎮' },
    { key: 'mb', label: 'Материнская плата', icon: '📋' },
    { key: 'ram', label: 'Оперативная память', icon: '💾' },
    { key: 'storage', label: 'Накопитель', icon: '💿' },
    { key: 'psu', label: 'Блок питания', icon: '⚡' },
    { key: 'case', label: 'Корпус', icon: '🖥️' },
    { key: 'cooling', label: 'Охлаждение', icon: '❄️' },
  ];

  return (
    <div className="pc-builder">
      <div className="pc-builder__container">
        {/* Header */}
        <div className="pc-builder__header">
          <h1 className="pc-builder__title">
            ⚡ Конфигуратор ПК
          </h1>
          <p className="pc-builder__subtitle">
            Соберите компьютер своей мечты с проверкой совместимости
          </p>
        </div>

        {/* Compatibility Status Bar */}
        <div className={`pc-builder__status ${allCompatible ? 'pc-builder__status--ok' : 'pc-builder__status--error'}`}>
          <span className="pc-builder__status-icon">
            {allCompatible ? '✅' : '⚠️'}
          </span>
          <span className="pc-builder__status-text">
            {allCompatible 
              ? 'Все компоненты совместимы!' 
              : 'Обнаружены проблемы совместимости'}
          </span>
        </div>

        <div className="pc-builder__content">
          {/* Component Slots */}
          <div className="pc-builder__slots">
            {componentSlots.map((slot) => {
              const component = config[slot.key as keyof typeof config];
              return (
                <div 
                  key={slot.key}
                  className={`component-slot ${component.compatible ? 'component-slot--ok' : 'component-slot--error'}`}
                >
                  <div className="component-slot__header">
                    <span className="component-slot__icon">{slot.icon}</span>
                    <span className="component-slot__label">{slot.label}</span>
                    <span className={`component-slot__status ${component.compatible ? 'component-slot__status--ok' : 'component-slot__status--error'}`}>
                      {component.compatible ? '✓ OK' : '✗ Ошибка'}
                    </span>
                  </div>
                  
                  <div className="component-slot__body">
                    <span className="component-slot__name">{component.name}</span>
                    <span className="component-slot__price">
                      {component.price.toLocaleString('ru-RU')} ₽
                    </span>
                  </div>
                  
                  <div className="component-slot__actions">
                    <button className="component-slot__btn component-slot__btn--change">
                      Заменить
                    </button>
                    <button className="component-slot__btn component-slot__btn--remove">
                      ✕
                    </button>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Summary Panel */}
          <div className="pc-builder__summary">
            <div className="summary-panel">
              <h3 className="summary-panel__title">📦 Ваша сборка</h3>
              
              <div className="summary-panel__list">
                {componentSlots.map((slot) => {
                  const component = config[slot.key as keyof typeof config];
                  return (
                    <div key={slot.key} className="summary-panel__item">
                      <span className="summary-panel__item-label">{slot.label}</span>
                      <span className="summary-panel__item-price">
                        {component.price.toLocaleString('ru-RU')} ₽
                      </span>
                    </div>
                  );
                })}
              </div>

              <div className="summary-panel__divider" />

              <div className="summary-panel__total">
                <span>Итого:</span>
                <span className="summary-panel__total-price">
                  {totalPrice.toLocaleString('ru-RU')} ₽
                </span>
              </div>

              <button className="btn-gold-shimmer">
                🛒 Добавить сборку в корзину
              </button>

              <div className="summary-panel__secondary-actions">
                <button className="summary-panel__secondary-btn">
                  💾 Сохранить
                </button>
                <button className="summary-panel__secondary-btn">
                  🔗 Поделиться
                </button>
              </div>
            </div>

            {/* Compatibility Details */}
            <div className="compatibility-panel">
              <h4 className="compatibility-panel__title">🔍 Проверка совместимости</h4>
              <ul className="compatibility-panel__list">
                <li className="compatibility-panel__item compatibility-panel__item--ok">
                  <span className="compatibility-panel__check">✓</span>
                  Сокет процессора совместим с материнской платой
                </li>
                <li className="compatibility-panel__item compatibility-panel__item--ok">
                  <span className="compatibility-panel__check">✓</span>
                  Видеокарта помещается в корпус
                </li>
                <li className="compatibility-panel__item compatibility-panel__item--ok">
                  <span className="compatibility-panel__check">✓</span>
                  Блока питания достаточно для системы
                </li>
                <li className="compatibility-panel__item compatibility-panel__item--ok">
                  <span className="compatibility-panel__check">✓</span>
                  Охлаждение достаточно для процессора
                </li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}