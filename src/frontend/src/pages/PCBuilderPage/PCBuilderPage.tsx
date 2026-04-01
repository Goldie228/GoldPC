/**
 * PCBuilderPage - PC Configuration Builder
 *
 * Features:
 * - Split-screen layout: left 60% (component slots), right 40% (sticky summary)
 * - Breadcrumbs: Главная / Конструктор ПК
 * - Toolbar with Back button, title, quick filters (Игровой / Офисный / Рабочая станция)
 * - Dark theme, gold accents (#d4a574). No green colors.
 * - Compatibility checking with status indicators
 * - Modal-based component selection from catalog
 */

import { useState, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { ChevronLeft, Gamepad2, Briefcase, Monitor } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { ComponentSlot, BuildSummaryPanel } from '../../components/pc-builder';
import { Breadcrumbs } from '../../components/layout/Breadcrumbs/Breadcrumbs';
import { Modal } from '../../components/ui';
import { Skeleton } from '../../components/ui/Skeleton';
import { ApiErrorBanner } from '../../components/ui/ApiErrorBanner';
import { usePCBuilder, useProducts, PC_BUILDER_SLOTS, type PCComponentType } from '../../hooks';
import type { Product, ProductCategory } from '../../api/types';
import './PCBuilderPage.css';

/** Preset filter types */
type PresetFilter = 'gaming' | 'office' | 'workstation' | null;

/** SVG Icons for component types */
const icons = {
  cpu: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
      <rect x="4" y="4" width="16" height="16" rx="2"/>
      <rect x="9" y="9" width="6" height="6"/>
      <path d="M9 1v3M15 1v3M9 20v3M15 20v3M20 9h3M20 14h3M1 9h3M1 14h3"/>
    </svg>
  ),
  gpu: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
      <rect x="2" y="6" width="20" height="12" rx="2"/>
      <path d="M6 10h4v4H6z"/>
      <path d="M14 10h4M14 14h4M18 6V4M6 6V4"/>
    </svg>
  ),
  motherboard: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
      <rect x="2" y="2" width="20" height="20" rx="2"/>
      <rect x="5" y="5" width="6" height="4"/>
      <rect x="13" y="5" width="4" height="8"/>
      <circle cx="8" cy="14" r="2"/>
      <rect x="5" y="17" width="4" height="3"/>
    </svg>
  ),
  ram: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
      <rect x="2" y="8" width="20" height="8" rx="1"/>
      <path d="M6 8V6M10 8V6M14 8V6M18 8V6"/>
      <rect x="5" y="11" width="3" height="2"/>
      <rect x="10" y="11" width="3" height="2"/>
      <rect x="15" y="11" width="3" height="2"/>
    </svg>
  ),
  storage: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
      <rect x="3" y="6" width="18" height="12" rx="2"/>
      <circle cx="7" cy="12" r="1"/>
      <circle cx="12" cy="12" r="1"/>
      <circle cx="17" cy="12" r="1"/>
    </svg>
  ),
  psu: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
      <rect x="3" y="4" width="18" height="16" rx="2"/>
      <circle cx="8" cy="10" r="2"/>
      <path d="M7 15h2M12 15h2M17 15h2M14 8h4M16 6v4"/>
    </svg>
  ),
  case: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
      <rect x="4" y="2" width="16" height="20" rx="2"/>
      <rect x="7" y="5" width="10" height="6" rx="1"/>
      <circle cx="8" cy="15" r="1"/>
      <circle cx="12" cy="15" r="1"/>
      <path d="M15 14h2v2h-2z"/>
    </svg>
  ),
  cooling: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
      <circle cx="12" cy="12" r="10"/>
      <circle cx="12" cy="12" r="3"/>
      <path d="M12 2v4M12 18v4M2 12h4M18 12h4"/>
    </svg>
  ),
};

/** Preset build configurations */
const PRESET_CONFIGS: Record<Exclude<PresetFilter, null>, Record<string, string>> = {
  gaming: {
    cpu: 'Процессор с 8+ ядрами, высокая тактовая частота',
    gpu: 'Видеокарта RTX 4070 и выше',
    ram: '32GB DDR5 5600MHz+',
    storage: 'NVMe SSD 1TB+',
    psu: 'Блок питания 750W+ 80+ Gold',
  },
  office: {
    cpu: 'Процессор 4-6 ядер, энергоэффективный',
    gpu: 'Интегрированная графика',
    ram: '16GB DDR4/DDR5',
    storage: 'SSD 512GB',
    psu: 'Блок питания 450W+',
  },
  workstation: {
    cpu: 'Процессор 12+ ядер, много потоков',
    gpu: 'Видеокарта 16GB+ VRAM',
    ram: '64GB DDR5',
    storage: 'NVMe SSD 2TB+',
    psu: 'Блок питания 850W+ 80+ Platinum',
  },
};

// Map PCComponentType to ProductCategory
const componentTypeToCategory: Record<PCComponentType, ProductCategory> = {
  cpu: 'cpu',
  gpu: 'gpu',
  motherboard: 'motherboard',
  ram: 'ram',
  storage: 'storage',
  psu: 'psu',
  case: 'case',
  cooling: 'cooling',
};

// Helper to get icon by type
function getIcon(type: PCComponentType): React.ReactNode {
  return icons[type] || icons.cpu;
}

export function PCBuilderPage() {
  // Use the PC Builder hook
  const {
    selectedComponents,
    compatibility,
    totalPrice,
    selectedCount,
    totalCount,
    selectComponent,
    removeComponent,
    getSlotState,
    isCompatible,
    powerConsumption,
    addToCart,
  } = usePCBuilder();

  // Modal state
  const [modalOpen, setModalOpen] = useState(false);
  const [selectedSlot, setSelectedSlot] = useState<PCComponentType | null>(null);

  // Quick filter state
  const [activeFilter, setActiveFilter] = useState<PresetFilter>(null);

  // Fetch products for selected category
  const { data: productsResponse, isLoading, error, refetch } = useProducts(
    selectedSlot ? { category: componentTypeToCategory[selectedSlot], pageSize: 50 } : undefined
  );

  // Handle slot click - opens modal for component selection
  const handleSelect = (type: PCComponentType) => {
    setSelectedSlot(type);
    setModalOpen(true);
  };

  // Handle component removal
  const handleRemove = (type: PCComponentType) => {
    removeComponent(type);
  };

  // Handle product selection from modal
  const handleProductSelect = (product: Product) => {
    if (selectedSlot) {
      selectComponent(selectedSlot, product);
    }
    setModalOpen(false);
    setSelectedSlot(null);
  };

  // Close modal
  const handleCloseModal = () => {
    setModalOpen(false);
    setSelectedSlot(null);
  };

  // Handle quick filter toggle
  const handleFilterClick = useCallback((filter: PresetFilter) => {
    setActiveFilter((prev) => (prev === filter ? null : filter));
  }, []);

  // Get specs array for display
  const getDisplaySpecs = (type: PCComponentType, product: Product | undefined): string[] => {
    if (!product?.specifications) {
      const placeholderSpecs: Record<PCComponentType, string[]> = {
        cpu: ['AM5', 'LGA1700'],
        gpu: ['PCIe 4.0', 'Ray Tracing'],
        motherboard: ['ATX', 'mATX'],
        ram: ['DDR5', '32GB'],
        storage: ['NVMe', 'SATA SSD'],
        psu: ['750W', '80+ Gold'],
        case: ['Mid Tower', 'ATX'],
        cooling: ['240mm AIO', 'Air Cooler'],
      };
      return placeholderSpecs[type] || [];
    }

    const specs = product.specifications;
    const result: string[] = [];

    switch (type) {
      case 'cpu':
        if (specs.cores) result.push(`${specs.cores}C / ${specs.threads}T`);
        if (specs.baseClock) result.push(`${specs.baseClock} GHz`);
        if (specs.socket) result.push(specs.socket as string);
        break;
      case 'gpu':
        if (specs.memory) result.push(`${specs.memory}GB ${specs.memoryType}`);
        if (specs.tdp) result.push(`${specs.tdp}W TDP`);
        break;
      case 'motherboard':
        if (specs.socket) result.push(specs.socket as string);
        if (specs.memoryType) result.push(specs.memoryType as string);
        if (specs.formFactor) result.push(specs.formFactor as string);
        break;
      case 'ram':
        if (specs.memoryType) result.push(specs.memoryType as string);
        if (specs.capacity) result.push(`${specs.capacity}GB`);
        if (specs.speed) result.push(`${specs.speed} MHz`);
        break;
      case 'storage':
        if (specs.type) result.push(specs.type as string);
        if (specs.capacity) result.push(`${specs.capacity}GB`);
        break;
      case 'psu':
        if (specs.wattage) result.push(`${specs.wattage}W`);
        if (specs.efficiency) result.push(specs.efficiency as string);
        break;
      default:
        break;
    }

    return result;
  };

  // Get products for modal
  const modalProducts = productsResponse?.data ?? [];

  // Get current slot label
  const currentSlotLabel = PC_BUILDER_SLOTS.find((s) => s.key === selectedSlot)?.label || '';

  return (
    <div
      className="pc-builder"
      role="region"
      aria-labelledby="pc-builder-title"
      aria-describedby="pc-builder-kbd-hint"
    >
      <p id="pc-builder-kbd-hint" className="sr-only">
        Клавиатура: Tab — переход между слотами и кнопками. Enter или пробел — выбрать или изменить
        компонент в слоте.
      </p>

      {/* Toolbar with Back, Title, and Quick Filters */}
      <nav className="pc-builder__toolbar" aria-label="Навигация конструктора ПК">
        <div className="pc-builder__toolbar-left">
          <Link to="/catalog" className="pc-builder__back">
            <ChevronLeft size={18} aria-hidden />
            Назад
          </Link>
          <h1 id="pc-builder-title" className="pc-builder__toolbar-title">
            Конструктор ПК
          </h1>
        </div>

        <div className="pc-builder__toolbar-filters">
          <button
            className={`pc-builder__filter-btn ${activeFilter === 'gaming' ? 'pc-builder__filter-btn--active' : ''}`}
            onClick={() => handleFilterClick('gaming')}
            aria-pressed={activeFilter === 'gaming'}
            type="button"
          >
            <Gamepad2 size={16} aria-hidden />
            Игровой
          </button>
          <button
            className={`pc-builder__filter-btn ${activeFilter === 'office' ? 'pc-builder__filter-btn--active' : ''}`}
            onClick={() => handleFilterClick('office')}
            aria-pressed={activeFilter === 'office'}
            type="button"
          >
            <Briefcase size={16} aria-hidden />
            Офисный
          </button>
          <button
            className={`pc-builder__filter-btn ${activeFilter === 'workstation' ? 'pc-builder__filter-btn--active' : ''}`}
            onClick={() => handleFilterClick('workstation')}
            aria-pressed={activeFilter === 'workstation'}
            type="button"
          >
            <Monitor size={16} aria-hidden />
            Рабочая станция
          </button>
        </div>

        <div className="pc-builder__toolbar-total" aria-live="polite">
          <span className="pc-builder__total-label">Итого</span>
          <span className="pc-builder__total-value">{totalPrice.toLocaleString('ru-BY')} BYN</span>
        </div>
      </nav>

      {/* Breadcrumbs */}
      <div className="pc-builder__breadcrumbs pageShell">
        <Breadcrumbs
          items={[
            { label: 'Главная', to: '/' },
            { label: 'Конструктор ПК' },
          ]}
        />
      </div>

      {/* Preset hint banner */}
      <AnimatePresence>
        {activeFilter && (
          <motion.div
            className="pc-builder__preset-hint pageShell"
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.25 }}
          >
            <div className="pc-builder__preset-hint-inner">
              <span className="pc-builder__preset-hint-label">
                Рекомендация ({activeFilter === 'gaming' ? 'Игровой' : activeFilter === 'office' ? 'Офисный' : 'Рабочая станция'}):
              </span>
              <span className="pc-builder__preset-hint-text">
                {Object.values(PRESET_CONFIGS[activeFilter]).join(' · ')}
              </span>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <main className="pc-builder__main">
        <div className="pc-builder__content">
          {/* Left: Configuration List (60%) */}
          <div className="pc-builder__left">
            <div className="pc-builder__section-header">
              <h2 className="pc-builder__section-title">Комплектующие</h2>
              <div
                className={`pc-builder__status ${isCompatible ? 'pc-builder__status--ok' : 'pc-builder__status--warning'}`}
                role="status"
                aria-live="polite"
              >
                {isCompatible ? (
                  <>
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
                      <polyline points="20 6 9 17 4 12"/>
                    </svg>
                    Совместимо
                  </>
                ) : (
                  <>
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
                      <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/>
                      <line x1="12" y1="9" x2="12" y2="13"/>
                      <line x1="12" y1="17" x2="12.01" y2="17"/>
                    </svg>
                    Есть проблемы
                  </>
                )}
              </div>
            </div>

            {/* Compatibility errors list */}
            {compatibility.errors.length > 0 && (
              <div className="pc-builder__errors">
                {compatibility.errors.map((err, index) => (
                  <div key={index} className="pc-builder__error">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <circle cx="12" cy="12" r="10"/>
                      <line x1="15" y1="9" x2="9" y2="15"/>
                      <line x1="9" y1="9" x2="15" y2="15"/>
                    </svg>
                    {err}
                  </div>
                ))}
              </div>
            )}

            <div className="pc-builder__slots">
              {PC_BUILDER_SLOTS.map((slot, index) => {
                const selectedComponent = selectedComponents[slot.key];
                const product = selectedComponent?.product;
                const slotState = getSlotState(slot.key);

                return (
                  <ComponentSlot
                    key={slot.key}
                    index={index}
                    type={slot.label}
                    icon={getIcon(slot.key)}
                    name={slotState.state === 'empty' ? 'Выберите компонент' : product?.name || ''}
                    price={product?.price ?? null}
                    state={slotState.state}
                    specs={getDisplaySpecs(slot.key, product)}
                    warning={slotState.warning}
                    onSelect={() => handleSelect(slot.key)}
                    imageUrl={product?.mainImage?.url}
                    isPriority={slot.key === 'cpu' || slot.key === 'gpu'}
                  />
                );
              })}
            </div>
          </div>

          {/* Right: Summary Panel (40%, sticky) */}
          <div className="pc-builder__right">
            <BuildSummaryPanel
              selectedComponents={selectedComponents}
              totalPrice={totalPrice}
              powerConsumption={powerConsumption}
              isCompatible={isCompatible}
              selectedCount={selectedCount}
              totalCount={totalCount}
              onAddToCart={addToCart}
            />
          </div>
        </div>
      </main>

      {/* Checkout Bar (Fixed Bottom) */}
      <div className="pc-builder__checkout-bar">
        <div className="pc-builder__checkout-container">
          <div className="pc-builder__checkout-info">
            <div className="pc-builder__checkout-count">
              Выбрано <strong>{selectedCount} из {totalCount}</strong> компонентов
            </div>
            {compatibility.errors.length > 0 && (
              <div className="pc-builder__checkout-warning">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <circle cx="12" cy="12" r="10"/>
                  <line x1="12" y1="8" x2="12" y2="12"/>
                  <line x1="12" y1="16" x2="12.01" y2="16"/>
                </svg>
                Есть проблемы совместимости ({compatibility.errors.length})
              </div>
            )}
          </div>
          <button className="pc-builder__checkout-btn" disabled={!isCompatible || selectedCount === 0}>
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M6 2L3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z"/>
              <line x1="3" y1="6" x2="21" y2="6"/>
            </svg>
            <span>Оформить</span>
            <span className="pc-builder__checkout-price">{totalPrice.toLocaleString('ru-BY')} BYN</span>
          </button>
        </div>
      </div>

      {/* Component Selection Modal */}
      <Modal isOpen={modalOpen} onClose={handleCloseModal} title={`Выбор: ${currentSlotLabel}`} size="large">
        {/* Show currently selected */}
        {selectedSlot && selectedComponents[selectedSlot] && (
          <div className="pc-builder__modal-selected">
            <span>Выбрано: {selectedComponents[selectedSlot]?.product.name}</span>
            <button
              className="pc-builder__modal-btn pc-builder__modal-btn--danger"
              onClick={() => {
                handleRemove(selectedSlot);
                handleCloseModal();
              }}
            >
              Удалить
            </button>
          </div>
        )}

        {/* Loading state */}
        {isLoading && (
          <div className="pc-builder__modal-loading">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="pc-builder__modal-skeleton-row">
                <Skeleton width={44} height={44} borderRadius="sm" />
                <div className="pc-builder__modal-skeleton-text">
                  <Skeleton width="70%" height={18} borderRadius="sm" />
                  <Skeleton width="45%" height={14} borderRadius="sm" className="pc-builder__modal-skeleton-sub" />
                </div>
                <Skeleton width={88} height={24} borderRadius="sm" />
              </div>
            ))}
          </div>
        )}

        {error && (
          <div className="pc-builder__modal-error">
            <ApiErrorBanner message="Не удалось загрузить список комплектующих." onRetry={() => refetch()} />
          </div>
        )}

        {/* Product list */}
        {!isLoading && !error && (
          <div className="pc-builder__modal-products">
            {modalProducts.map((product) => (
              <div
                key={product.id}
                className="pc-builder__modal-product"
                onClick={() => handleProductSelect(product as Product)}
              >
                <div className="pc-builder__modal-product-icon">{getIcon(selectedSlot!)}</div>
                <div className="pc-builder__modal-product-info">
                  <div className="pc-builder__modal-product-name">{product.name}</div>
                  <div className="pc-builder__modal-product-specs">
                    {getDisplaySpecs(selectedSlot!, product as Product).join(' · ')}
                  </div>
                </div>
                <div className="pc-builder__modal-product-price">
                  {product.price.toLocaleString('ru-BY')} BYN
                </div>
              </div>
            ))}
            {modalProducts.length === 0 && <p className="pc-builder__modal-text">Нет доступных компонентов для выбора.</p>}
          </div>
        )}
      </Modal>
    </div>
  );
}
