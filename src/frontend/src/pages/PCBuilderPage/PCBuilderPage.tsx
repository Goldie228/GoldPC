/**
 * PCBuilderPage — конструктор ПК: слоты слева, итог справа, модалка выбора из каталога.
 */

import React, { useState, useMemo, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Cpu, Gpu, CircuitBoard, MemoryStick, HardDrive,
  Zap, Box, Snowflake, Fan, Monitor, Keyboard,
  Mouse, Headphones,
} from 'lucide-react';
import {
  ComponentSlot,
  BuildSummaryPanel,
  PdfExportModal,
  ComponentPickerModal,
} from '../../components/pc-builder';
import { Breadcrumbs } from '../../components/layout/Breadcrumbs/Breadcrumbs';
import {
  usePCBuilder,
  PC_BUILDER_SLOTS,
  type PCComponentType,
  type PCBuilderSelectedState,
} from '../../hooks';
import { extractSocket } from '../../utils/compatibilityUtils';
import type { Product, ProductCategory } from '../../api/types';
import { useToastStore } from '../../store/toastStore';
import './PCBuilderPage.css';

const icons = {
  cpu: <Cpu />,
  gpu: <Gpu />,
  motherboard: <CircuitBoard />,
  ram: <MemoryStick />,
  storage: <HardDrive />,
  psu: <Zap />,
  case: <Box />,
  cooling: <Snowflake />,
  fan: <Fan />,
  monitor: <Monitor />,
  keyboard: <Keyboard />,
  mouse: <Mouse />,
  headphones: <Headphones />,
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
  fan: 'cooling',
  monitor: 'monitor',
  keyboard: 'keyboard',
  mouse: 'mouse',
  headphones: 'headphones',
};

/** Тип фильтра по спецификации 'type' в модалке выбора cooling-категории */
const componentTypeFilter: Record<PCComponentType, string | string[] | null> = {
  cpu: null,
  gpu: null,
  motherboard: null,
  ram: null,
  storage: null,
  psu: null,
  case: null,
  fan: 'Корпусный вентилятор',
  cooling: ['Башенный кулер', 'Жидкостное охлаждение'],
  monitor: null,
  keyboard: null,
  mouse: null,
  headphones: null,
};

// Short descriptions for each component type slot (shown as tooltip on hover)
const slotDescriptions: Record<PCComponentType, string> = Object.fromEntries(
  PC_BUILDER_SLOTS.map((s) => [s.key, s.description]),
) as Record<PCComponentType, string>;

function getIcon(type: PCComponentType): React.ReactNode {
  return icons[type] ?? icons.cpu;
}

type SlotRow =
  | { kind: 'single'; key: PCComponentType; label: string; anim: number }
  | { kind: 'ram'; rowIndex: number; label: string; anim: number }
  | { kind: 'storage'; rowIndex: number; label: string; anim: number }
  | { kind: 'fan'; rowIndex: number; label: string; anim: number };

export interface MemoizedSlotRowProps {
  row: SlotRow;
  selectedComponents: import('../../hooks').PCBuilderSelectedState;
  getSlotState: (type: import('../../hooks').PCComponentType, index?: number) => import('../../hooks').ComponentCompatibility;
  getDisplaySpecs: (type: import('../../hooks').PCComponentType, product: Product | undefined) => string[];
  onSelect: (type: import('../../hooks').PCComponentType, index?: number) => void;
  onRemove: (type: import('../../hooks').PCComponentType, index?: number) => void;
  onChangeQuantity: (slotType: import('../../hooks').PCComponentType, rowIndex: number, delta: number) => void;
  maxRamModules: number;
  maxStorageModules: number;
  maxFanModules: number;
}

export const MemoizedSlotRow = React.memo(function MemoizedSlotRow({
  row,
  selectedComponents,
  getSlotState,
  getDisplaySpecs,
  onSelect,
  onRemove,
  onChangeQuantity,
  maxRamModules,
  maxStorageModules,
  maxFanModules,
}: MemoizedSlotRowProps) {
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
        onSelect={() => onSelect(row.key)}
        onClear={
          slotState.state === 'selected' || slotState.state === 'incompatible'
            ? () => onRemove(row.key)
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
        onSelect={() => onSelect('ram', row.rowIndex)}
        onClear={
          !isEmpty
            ? () => onRemove('ram', row.rowIndex)
            : undefined
        }
        imageUrl={product?.mainImage?.url}
        isPriority={false}
        description={slotDescriptions.ram}
        quantity={
          row.rowIndex === 0 ? selectedComponents.ram.length : undefined
        }
        maxQuantity={maxRamModules}
        onChangeQuantity={
          row.rowIndex === 0
            ? (delta) => onChangeQuantity('ram', row.rowIndex, delta)
            : undefined
        }
      />
    );
  }

  if (row.kind === 'storage') {
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
        onSelect={() => onSelect('storage', row.rowIndex)}
        onClear={
          !isEmpty ? () => onRemove('storage', row.rowIndex) : undefined
        }
        imageUrl={product?.mainImage?.url}
        isPriority={false}
        description={slotDescriptions.storage}
        quantity={
          row.rowIndex === 0 ? selectedComponents.storage.length : undefined
        }
        maxQuantity={maxStorageModules}
        onChangeQuantity={
          row.rowIndex === 0
            ? (delta) => onChangeQuantity('storage', row.rowIndex, delta)
            : undefined
        }
      />
    );
  }

  // fan rows
  const fans = selectedComponents.fan;
  const product = fans[row.rowIndex]?.product;
  const slotState = getSlotState('fan', row.rowIndex);
  const isEmpty = slotState.state === 'empty';
  return (
    <ComponentSlot
      key={`fan-${row.rowIndex}`}
      index={row.anim}
      type={row.label}
      icon={getIcon('fan')}
      name={isEmpty ? 'Выберите компонент' : product?.name || ''}
      price={product?.price ?? null}
      state={slotState.state}
      specs={getDisplaySpecs('fan', product)}
      warning={slotState.warning}
      onSelect={() => onSelect('fan', row.rowIndex)}
      onClear={
        !isEmpty ? () => onRemove('fan', row.rowIndex) : undefined
      }
      imageUrl={product?.mainImage?.url}
      isPriority={false}
      description={slotDescriptions.fan}
      quantity={
        row.rowIndex === 0 ? selectedComponents.fan.length : undefined
      }
      maxQuantity={maxFanModules}
      onChangeQuantity={
        row.rowIndex === 0
          ? (delta) => onChangeQuantity('fan', row.rowIndex, delta)
          : undefined
      }
    />
  );
});

function buildSlotRows(
  state: PCBuilderSelectedState,
  maxRam: number,
  maxStorage: number,
  maxFan: number,
): SlotRow[] {
  const rows: SlotRow[] = [];
  let anim = 0;

  // cpu -> motherboard (single slots)
  for (const s of [
    { key: 'cpu', label: 'Процессор' as const },
    { key: 'motherboard', label: 'Материнская плата' as const },
  ]) {
    rows.push({ kind: 'single', key: s.key, label: s.label, anim: anim++ });
  }

  // RAM: всегда 1 слот, количество управляется через qty контроллер
  const ramQty = state.ram.length;
  rows.push({
    kind: 'ram',
    rowIndex: 0,
    label: ramQty > 0 ? `Оперативная память (×${ramQty})` : 'Оперативная память',
    anim: anim++,
  });

  const stCount = state.storage.length >= maxStorage ? maxStorage : state.storage.length + 1;
  for (let i = 0; i < stCount; i++) {
    rows.push({
      kind: 'storage',
      rowIndex: i,
      label: stCount > 1 ? `Накопитель (${i + 1})` : 'Накопитель',
      anim: anim++,
    });
  }

  // cooling (single)
  rows.push({ kind: 'single', key: 'cooling' as PCComponentType, label: 'Охлаждение' as const, anim: anim++ });

  // gpu (single)
  rows.push({ kind: 'single', key: 'gpu' as PCComponentType, label: 'Видеокарта' as const, anim: anim++ });

  // psu, case (single slots)
  for (const s of [
    { key: 'psu', label: 'Блок питания' as const },
    { key: 'case', label: 'Корпус' as const },
  ]) {
    rows.push({ kind: 'single', key: s.key, label: s.label, anim: anim++ });
  }

  // Fan: всегда 1 слот, количество управляется через qty контроллер
  const fanQty = state.fan.length;
  rows.push({
    kind: 'fan',
    rowIndex: 0,
    label: fanQty > 0 ? `Вентилятор (×${fanQty})` : 'Вентилятор',
    anim: anim++,
  });

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
    duplicateModule,
    removeComponent,
    getSlotState,
    isCompatible,
    powerConsumption,
    recommendedPsu,
    estimatedFps,
    bottleneck,
    isApiLoading,
    apiFpsData,
    addToCart,
    maxRamModules,
    maxRamQty,
    maxStorageModules,
    maxFanModules,
  } = usePCBuilder();

  const showToast = useToastStore((s) => s.showToast);

  const [modalOpen, setModalOpen] = useState(false);
  const [selectedSlot, setSelectedSlot] = useState<PCComponentType | null>(null);
  const [multiIndex, setMultiIndex] = useState<number | undefined>(undefined);
  const [pdfModalOpen, setPdfModalOpen] = useState(false);

  const slotRows = useMemo(() => buildSlotRows(selectedComponents, maxRamQty, maxStorageModules, maxFanModules), [selectedComponents, maxRamQty, maxStorageModules, maxFanModules]);

  const mfrPlatform = useMemo(() => {
    // Determine socket from MB or CPU to restrict brands
    const mbSocket = extractSocket(selectedComponents.motherboard?.product?.specifications);
    const cpuSocket = extractSocket(selectedComponents.cpu?.product?.specifications);
    const socket = mbSocket ?? cpuSocket;
    if (!socket) return undefined;
    if (socket === 'AM4' || socket === 'AM5') return 'amd' as const;
    if (socket === 'LGA1200' || socket === 'LGA1700' || socket === 'LGA1851') return 'intel' as const;
    return undefined;
  }, [selectedComponents.motherboard?.product, selectedComponents.cpu?.product]);

  const openPicker = useCallback((type: PCComponentType, idx?: number) => {
    setSelectedSlot(type);
    setMultiIndex(idx);
    setModalOpen(true);
  }, []);

  const handleRemove = useCallback((type: PCComponentType, idx?: number) => {
    // Confirm before removing CPU or motherboard if they have dependent components
    if (type === 'cpu') {
      const hasMb = !!selectedComponents.motherboard;
      const hasRam = selectedComponents.ram.length > 0;
      if (hasMb || hasRam) {
        const msg = 'Удаление процессора также удалит материнскую плату и оперативную память. Продолжить?';
        if (window.confirm(msg)) {
          removeComponent(type, idx);
        }
        return;
      }
    }
    if (type === 'motherboard') {
      const hasRam = selectedComponents.ram.length > 0;
      if (hasRam) {
        const msg = 'Удаление материнской платы также удалит оперативную память. Продолжить?';
        if (window.confirm(msg)) {
          removeComponent(type, idx);
        }
        return;
      }
    }
    removeComponent(type, idx);
  }, [selectedComponents.motherboard, selectedComponents.ram.length, removeComponent]);

  const handleChangeQuantity = useCallback(
    (slotType: PCComponentType, rowIndex: number, delta: number) => {
    if (delta < 0) {
      // Remove — clear all (single-slot types) or remove last (storage)
      if (slotType === 'ram' && selectedComponents.ram.length > 0) {
        removeComponent(slotType);
      } else if (slotType === 'storage' && selectedComponents.storage.length > 0) {
        removeComponent(slotType, selectedComponents.storage.length - 1);
      } else if (slotType === 'fan' && selectedComponents.fan.length > 0) {
        removeComponent(slotType);
      }
    } else {
      // Add — duplicate first module
      if (slotType === 'ram' && selectedComponents.ram.length > 0) {
        duplicateModule('ram');
      } else if (slotType === 'storage' && selectedComponents.storage.length > 0) {
        const product = selectedComponents.storage[rowIndex]?.product;
        if (product) selectComponent(slotType, product);
      } else if (slotType === 'fan' && selectedComponents.fan.length > 0) {
        duplicateModule('fan');
      }
    }
  }, [selectedComponents.ram, selectedComponents.storage, selectedComponents.fan, selectComponent, duplicateModule, removeComponent]);

  const handleProductSelect = (product: Product) => {
    if (!selectedSlot) return;
    if (selectedSlot === 'ram' || selectedSlot === 'storage' || selectedSlot === 'fan') {
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

  const getDisplaySpecs = useCallback((type: PCComponentType, product: Product | undefined): string[] => {
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
      case 'fan':
        if (specs.type) result.push(specs.type as string);
        if (specs.fanSize) result.push(`${specs.fanSize}mm`);
        if (specs.rpm) result.push(`${specs.rpm} RPM`);
        break;
      case 'case':
        if (specs.formFactor) result.push(specs.formFactor as string);
        break;
      case 'monitor':
        if (specs.sizeInch) result.push(`${specs.sizeInch}"`);
        if (specs.resolution) result.push(specs.resolution as string);
        if (specs.refreshRate) result.push(`${specs.refreshRate}Hz`);
        break;
      case 'keyboard':
        if (specs.layout) result.push(specs.layout as string);
        if (specs.type) result.push(specs.type as string);
        break;
      case 'mouse':
        if (specs.dpi) result.push(`${specs.dpi} DPI`);
        if (specs.type) result.push(specs.type as string);
        break;
      case 'headphones':
        if (specs.type) result.push(specs.type as string);
        if (specs.connectivity) result.push(specs.connectivity as string);
        break;
      default:
        break;
    }

    return result;
  // eslint-disable-next-line react-hooks/exhaustive-deps -- getDisplaySpecs is pure, no external deps needed
  }, []);

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

  const handleAddToCart = () => {
    const count = selectedCount;
    addToCart();
    const ending = count === 1 ? 'добавлен в корзину' : count < 5 ? 'добавлены в корзину' : 'добавлены в корзину';
    const noun = count === 1 ? 'товар' : count < 5 ? 'товара' : 'товаров';
    showToast(`${count} ${noun} ${ending}`, 'success', 4000);
  };

  const currentSlotLabel = useMemo(() => {
    if (!selectedSlot) return '';
    if (selectedSlot === 'ram' || selectedSlot === 'storage' || selectedSlot === 'fan') {
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
    if (selectedSlot === 'fan' && multiIndex !== undefined) {
      return selectedComponents.fan[multiIndex]?.product ?? null;
    }
    if (selectedSlot !== 'ram' && selectedSlot !== 'storage' && selectedSlot !== 'fan') {
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
                {slotRows.map((row) => (
                  <MemoizedSlotRow
                    key={`slot-${row.kind}-${row.kind === 'single' ? row.key : row.rowIndex}`}
                    row={row}
                    selectedComponents={selectedComponents}
                    getSlotState={getSlotState}
                    getDisplaySpecs={getDisplaySpecs}
                    onSelect={openPicker}
                    onRemove={handleRemove}
                    onChangeQuantity={handleChangeQuantity}
                    maxRamModules={maxRamModules}
                    maxStorageModules={maxStorageModules}
                    maxFanModules={maxFanModules}
                  />
                ))}
              </div>

              {/* Периферия */}
              <div className="pc-builder__section-header pc-builder__section-header--periph">
                <h2 className="pc-builder__section-title pc-builder__section-title--periph">Периферия</h2>
              </div>
              <div className="pc-builder__slots">
                {(['monitor', 'keyboard', 'mouse', 'headphones'] as const).map((key, idx) => (
                  <MemoizedSlotRow
                    key={key}
                    row={{ kind: 'single', key, label: PC_BUILDER_SLOTS.find((s) => s.key === key)?.label ?? key, anim: slotRows.length + idx }}
                    selectedComponents={selectedComponents}
                    getSlotState={getSlotState}
                    getDisplaySpecs={getDisplaySpecs}
                    onSelect={openPicker}
                    onRemove={handleRemove}
                    onChangeQuantity={handleChangeQuantity}
                    maxRamModules={maxRamModules}
                    maxStorageModules={maxStorageModules}
                    maxFanModules={maxFanModules}
                  />
                ))}
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
                compatibilityErrors={compatibility.errors}
                compatibilityWarnings={compatibility.warnings}
                selectedCount={selectedCount}
                totalCount={totalCount}
                apiFpsData={apiFpsData}
                isApiLoading={isApiLoading}
                onAddToCart={handleAddToCart}
                onSave={() => showToast('Сборка сохранена', 'success', 3000)}
                onCheckout={handleCheckout}
                onExportPdf={() => {
                  setPdfModalOpen(true);
                  showToast('Подготовка к печати...', 'info', 3000);
                }}
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
            if (selectedSlot === 'ram' || selectedSlot === 'storage' || selectedSlot === 'fan') {
              handleRemove(selectedSlot, multiIndex);
            } else {
              handleRemove(selectedSlot);
            }
          }}
          getDisplaySpecs={getDisplaySpecs}
          typeFilter={componentTypeFilter[selectedSlot] ?? undefined}
          selectedCount={selectedCount}
          totalCount={totalCount}
        />
      )}

      <PdfExportModal
        isOpen={pdfModalOpen}
        onClose={() => setPdfModalOpen(false)}
        selectedComponents={selectedComponents}
        totalPrice={totalPrice}
        powerConsumption={powerConsumption}
        recommendedPsu={recommendedPsu}
        isCompatible={isCompatible}
        compatibilityErrors={compatibility.errors}
        compatibilityWarnings={compatibility.warnings}
      />
    </div>
  );
}
