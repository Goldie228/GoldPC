/**
 * PCBuilderPage — конструктор ПК: слоты слева, итог справа, модалка выбора из каталога.
 */

import { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  ComponentSlot,
  BuildSummaryPanel,
  SaveConfigurationModal,
  ComponentPickerModal,
} from '../../components/pc-builder';
import { Breadcrumbs } from '../../components/layout/Breadcrumbs/Breadcrumbs';
import {
  usePCBuilder,
  PC_BUILDER_SLOTS,
  MAX_RAM_MODULES,
  MAX_STORAGE_MODULES,
  type PCComponentType,
  type PCBuilderSelectedState,
} from '../../hooks';
import type { Product, ProductCategory } from '../../api/types';
import './PCBuilderPage.css';

const icons = {
  cpu: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
      <rect x="4" y="4" width="16" height="16" rx="2" />
      <rect x="9" y="9" width="6" height="6" />
      <path d="M9 1v3M15 1v3M9 20v3M15 20v3M20 9h3M20 14h3M1 9h3M1 14h3" />
    </svg>
  ),
  gpu: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
      <rect x="2" y="6" width="20" height="12" rx="2" />
      <path d="M6 10h4v4H6z" />
      <path d="M14 10h4M14 14h4M18 6V4M6 6V4" />
    </svg>
  ),
  motherboard: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
      <rect x="2" y="2" width="20" height="20" rx="2" />
      <rect x="5" y="5" width="6" height="4" />
      <rect x="13" y="5" width="4" height="8" />
      <circle cx="8" cy="14" r="2" />
      <rect x="5" y="17" width="4" height="3" />
    </svg>
  ),
  ram: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
      <rect x="2" y="8" width="20" height="8" rx="1" />
      <path d="M6 8V6M10 8V6M14 8V6M18 8V6" />
      <rect x="5" y="11" width="3" height="2" />
      <rect x="10" y="11" width="3" height="2" />
      <rect x="15" y="11" width="3" height="2" />
    </svg>
  ),
  storage: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
      <rect x="3" y="6" width="18" height="12" rx="2" />
      <circle cx="7" cy="12" r="1" />
      <circle cx="12" cy="12" r="1" />
      <circle cx="17" cy="12" r="1" />
    </svg>
  ),
  psu: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
      <rect x="3" y="4" width="18" height="16" rx="2" />
      <circle cx="8" cy="10" r="2" />
      <path d="M7 15h2M12 15h2M17 15h2M14 8h4M16 6v4" />
    </svg>
  ),
  case: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
      <rect x="4" y="2" width="16" height="20" rx="2" />
      <rect x="7" y="5" width="10" height="6" rx="1" />
      <circle cx="8" cy="15" r="1" />
      <circle cx="12" cy="15" r="1" />
      <path d="M15 14h2v2h-2z" />
    </svg>
  ),
  cooling: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
      <circle cx="12" cy="12" r="10" />
      <circle cx="12" cy="12" r="3" />
      <path d="M12 2v4M12 18v4M2 12h4M18 12h4" />
    </svg>
  ),
};

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

// Short descriptions for each component type slot (shown as tooltip on hover)
const slotDescriptions: Record<PCComponentType, string> = Object.fromEntries(
  PC_BUILDER_SLOTS.map((s) => [s.key, s.description]),
) as Record<PCComponentType, string>;

function getIcon(type: PCComponentType): React.ReactNode {
  return icons[type] || icons.cpu;
}

type SlotRow =
  | { kind: 'single'; key: PCComponentType; label: string; anim: number }
  | { kind: 'ram'; rowIndex: number; label: string; anim: number }
  | { kind: 'storage'; rowIndex: number; label: string; anim: number };

function buildSlotRows(state: PCBuilderSelectedState): SlotRow[] {
  const rows: SlotRow[] = [];
  let anim = 0;
  const singles: { key: PCComponentType; label: string }[] = [
    { key: 'cpu', label: 'Процессор' },
    { key: 'gpu', label: 'Видеокарта' },
    { key: 'motherboard', label: 'Материнская плата' },
  ];
  for (const s of singles) {
    rows.push({ kind: 'single', key: s.key, label: s.label, anim: anim++ });
  }

  const ramCount =
    state.ram.length >= MAX_RAM_MODULES ? MAX_RAM_MODULES : state.ram.length + 1;
  for (let i = 0; i < ramCount; i++) {
    rows.push({
      kind: 'ram',
      rowIndex: i,
      label: ramCount > 1 ? `ОЗУ (${i + 1})` : 'Оперативная память',
      anim: anim++,
    });
  }

  const stCount =
    state.storage.length >= MAX_STORAGE_MODULES
      ? MAX_STORAGE_MODULES
      : state.storage.length + 1;
  for (let i = 0; i < stCount; i++) {
    rows.push({
      kind: 'storage',
      rowIndex: i,
      label: stCount > 1 ? `Накопитель (${i + 1})` : 'Накопитель',
      anim: anim++,
    });
  }

  const tail: { key: PCComponentType; label: string }[] = [
    { key: 'psu', label: 'Блок питания' },
    { key: 'case', label: 'Корпус' },
    { key: 'cooling', label: 'Охлаждение' },
  ];
  for (const s of tail) {
    rows.push({ kind: 'single', key: s.key, label: s.label, anim: anim++ });
  }

  return rows;
}

export function PCBuilderPage() {
  const navigate = useNavigate();

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
    recommendedPsu,
    estimatedFps,
    bottleneck,
    isApiLoading,
    addToCart,
  } = usePCBuilder();

  const [modalOpen, setModalOpen] = useState(false);
  const [selectedSlot, setSelectedSlot] = useState<PCComponentType | null>(null);
  const [multiIndex, setMultiIndex] = useState<number | undefined>(undefined);
  const [saveModalOpen, setSaveModalOpen] = useState(false);

  const slotRows = useMemo(() => buildSlotRows(selectedComponents), [selectedComponents]);

  const openPicker = (type: PCComponentType, idx?: number) => {
    setSelectedSlot(type);
    setMultiIndex(idx);
    setModalOpen(true);
  };

  const handleRemove = (type: PCComponentType, idx?: number) => {
    removeComponent(type, idx);
  };

  const handleProductSelect = (product: Product) => {
    if (!selectedSlot) return;
    if (selectedSlot === 'ram' || selectedSlot === 'storage') {
      selectComponent(selectedSlot, product, { multiIndex });
    } else {
      selectComponent(selectedSlot, product);
    }
    setModalOpen(false);
    setSelectedSlot(null);
    setMultiIndex(undefined);
  };

  const handleCloseModal = () => {
    setModalOpen(false);
    setSelectedSlot(null);
    setMultiIndex(undefined);
  };

  const getDisplaySpecs = (type: PCComponentType, product: Product | undefined): string[] => {
    if (!product?.specifications) {
      return [];
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

  const psuWattageRaw = selectedComponents.psu?.product.specifications?.wattage;
  const psuWattage =
    typeof psuWattageRaw === 'number' && !Number.isNaN(psuWattageRaw)
      ? psuWattageRaw
      : typeof psuWattageRaw === 'string'
        ? (() => {
            const n = parseFloat(psuWattageRaw);
            return Number.isNaN(n) ? undefined : n;
          })()
        : undefined;

  const handleCheckout = () => {
    addToCart();
    navigate('/cart');
  };

  const currentSlotLabel = useMemo(() => {
    if (!selectedSlot) return '';
    if (selectedSlot === 'ram' || selectedSlot === 'storage') {
      const n = (multiIndex ?? 0) + 1;
      return `${PC_BUILDER_SLOTS.find((s) => s.key === selectedSlot)?.label ?? ''} (${n})`;
    }
    return PC_BUILDER_SLOTS.find((s) => s.key === selectedSlot)?.label || '';
  }, [selectedSlot, multiIndex]);

  const modalCurrentProduct = useMemo(() => {
    if (!selectedSlot) return null;
    if (selectedSlot === 'ram' && multiIndex !== undefined) {
      return selectedComponents.ram[multiIndex]?.product ?? null;
    }
    if (selectedSlot === 'storage' && multiIndex !== undefined) {
      return selectedComponents.storage[multiIndex]?.product ?? null;
    }
    if (selectedSlot !== 'ram' && selectedSlot !== 'storage') {
      return selectedComponents[selectedSlot]?.product ?? null;
    }
    return null;
  }, [selectedSlot, multiIndex, selectedComponents]);

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
      <h1 id="pc-builder-title" className="sr-only">
        Конструктор ПК
      </h1>

      <div className="pc-builder__container pageShell pageShellWide">
        <div className="pc-builder__breadcrumb">
          <Breadcrumbs
            items={[
              { label: 'Главная', to: '/' },
              { label: 'Конструктор ПК' },
            ]}
          />
        </div>

        <main className="pc-builder__main">
          <div className="pc-builder__content">
            <div className="pc-builder__left">
              <div className="pc-builder__section-header">
                <h2 className="pc-builder__section-title">Комплектующие</h2>
                {!isCompatible && (
                  <div
                    className="pc-builder__status pc-builder__status--warning"
                    role="status"
                    aria-live="polite"
                  >
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
                      <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" />
                      <line x1="12" y1="9" x2="12" y2="13" />
                      <line x1="12" y1="17" x2="12.01" y2="17" />
                    </svg>
                    Есть проблемы
                  </div>
                )}
              </div>

              {compatibility.errors.length > 0 && (
                <div className="pc-builder__errors">
                  {compatibility.errors.map((err, index) => (
                    <div key={index} className="pc-builder__error">
                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <circle cx="12" cy="12" r="10" />
                        <line x1="15" y1="9" x2="9" y2="15" />
                        <line x1="9" y1="9" x2="15" y2="15" />
                      </svg>
                      {err}
                    </div>
                  ))}
                </div>
              )}

              <div className="pc-builder__slots">
                {slotRows.map((row) => {
                  if (row.kind === 'single') {
                    const product = selectedComponents[row.key]?.product;
                    const slotState = getSlotState(row.key);
                    return (
                      <ComponentSlot
                        key={row.key}
                        index={row.anim}
                        type={row.label}
                        icon={getIcon(row.key)}
                        name={slotState.state === 'empty' ? 'Выберите компонент' : product?.name || ''}
                        price={product?.price ?? null}
                        state={slotState.state}
                        specs={getDisplaySpecs(row.key, product)}
                        warning={slotState.warning}
                        onSelect={() => openPicker(row.key)}
                        onClear={
                          slotState.state === 'selected' || slotState.state === 'incompatible'
                            ? () => handleRemove(row.key)
                            : undefined
                        }
                        imageUrl={product?.mainImage?.url}
                        isPriority={row.key === 'cpu' || row.key === 'gpu'}
                        description={slotDescriptions[row.key]}
                      />
                    );
                  }

                  if (row.kind === 'ram') {
                    const product = selectedComponents.ram[row.rowIndex]?.product;
                    const slotState = getSlotState('ram', row.rowIndex);
                    const isEmpty = slotState.state === 'empty';
                    return (
                      <ComponentSlot
                        key={`ram-${row.rowIndex}`}
                        index={row.anim}
                        type={row.label}
                        icon={getIcon('ram')}
                        name={isEmpty ? 'Выберите компонент' : product?.name || ''}
                        price={product?.price ?? null}
                        state={slotState.state}
                        specs={getDisplaySpecs('ram', product)}
                        warning={slotState.warning}
                        onSelect={() => openPicker('ram', row.rowIndex)}
                        onClear={
                          !isEmpty
                            ? () => handleRemove('ram', row.rowIndex)
                            : undefined
                        }
                        imageUrl={product?.mainImage?.url}
                        isPriority={false}
                        description={slotDescriptions.ram}
                      />
                    );
                  }

                  const product = selectedComponents.storage[row.rowIndex]?.product;
                  const slotState = getSlotState('storage', row.rowIndex);
                  const isEmpty = slotState.state === 'empty';
                  return (
                    <ComponentSlot
                      key={`storage-${row.rowIndex}`}
                      index={row.anim}
                      type={row.label}
                      icon={getIcon('storage')}
                      name={isEmpty ? 'Выберите компонент' : product?.name || ''}
                      price={product?.price ?? null}
                      state={slotState.state}
                      specs={getDisplaySpecs('storage', product)}
                      warning={slotState.warning}
                      onSelect={() => openPicker('storage', row.rowIndex)}
                      onClear={
                        !isEmpty ? () => handleRemove('storage', row.rowIndex) : undefined
                      }
                      imageUrl={product?.mainImage?.url}
                      isPriority={false}
                      description={slotDescriptions.storage}
                    />
                  );
                })}
              </div>
            </div>

            <div className="pc-builder__right">
              <BuildSummaryPanel
                selectedComponents={selectedComponents}
                totalPrice={totalPrice}
                powerConsumption={powerConsumption}
                recommendedPsu={recommendedPsu}
                psuWattage={psuWattage}
                isCompatible={isCompatible}
                selectedCount={selectedCount}
                totalCount={totalCount}
                onAddToCart={addToCart}
                onSave={() => setSaveModalOpen(true)}
                onCheckout={handleCheckout}
              />
            </div>
          </div>
        </main>
      </div>

      {modalOpen && selectedSlot && (
        <ComponentPickerModal
          key={`${selectedSlot}-${multiIndex ?? 'x'}`}
          isOpen={modalOpen}
          onClose={handleCloseModal}
          category={componentTypeToCategory[selectedSlot]}
          slotType={selectedSlot}
          slotLabel={currentSlotLabel}
          currentProduct={modalCurrentProduct}
          buildContext={selectedComponents}
          onConfirm={handleProductSelect}
          onRemoveCurrent={() => {
            if (selectedSlot === 'ram' || selectedSlot === 'storage') {
              handleRemove(selectedSlot, multiIndex);
            } else {
              handleRemove(selectedSlot);
            }
          }}
          getDisplaySpecs={getDisplaySpecs}
        />
      )}

      <SaveConfigurationModal
        isOpen={saveModalOpen}
        onClose={() => setSaveModalOpen(false)}
        selectedComponents={selectedComponents}
        totalPrice={totalPrice}
        isCompatible={isCompatible}
        selectedCount={selectedCount}
        totalCount={totalCount}
        compatibilityErrors={compatibility.errors}
        compatibilityWarnings={compatibility.warnings}
      />
    </div>
  );
}
