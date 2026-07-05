/**
 * SpecificationsTab — вкладка «Характеристики»
 *
 * Динамический редактор на основе мета-данных из БД.
 * Каждая категория имеет свой набор характеристик с типами, единицами и валидацией.
 *
 * Все характеристики отображаются в едином списке, сгруппированном по groupName.
 * Характеристики без мета-данных автоматически определяют тип по значению.
 * Сортировка совпадает с ProductPage: приоритетные ключи → алфавит.
 */

import { useState, useEffect, useMemo, useRef } from 'react';
import { Info, Plus, Trash2, Search, X, ChevronDown, Check } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { dictionariesApi } from '@/api/admin';
import { catalogAdminApi } from '@/api/admin';
import { catalogApi } from '@/api/catalog';
import { specLabel } from '@/utils/specifications';
import { FRONTEND_TO_BACKEND } from '@/utils/category-mappings';
import { mergeDescriptionIntoSpecifications, normalizeMergedSpecKey } from '@/utils/productDescriptionSpecs';
import type { ProductEditForm } from '../types';
import type { SpecificationAttributeDto, ProductCategory, FilterFacetAttribute } from '@/api/types';

// 
// Пропсы
// 
interface SpecificationsTabProps {
  form: ProductEditForm;
  onChange: (field: string, value: string | number | boolean | null) => void;
}

// 
// Приоритетные ключи (как на странице товара)
// 
const PRIORITY_KEYS = ['socket', 'chipset', 'cores', 'threads', 'vram', 'capacity', 'frequency'];

/** Сравнение ключей: приоритетные — в начале, остальные — по алфавиту */
function compareSpecKeys(a: string, b: string): number {
  const ia = PRIORITY_KEYS.indexOf(a);
  const ib = PRIORITY_KEYS.indexOf(b);
  if (ia !== -1 && ib !== -1) return ia - ib;
  if (ia !== -1) return -1;
  if (ib !== -1) return 1;
  return a.localeCompare(b);
}

// 
// Вспомогательные функции
// 
function removeKey(
  record: Record<string, string | number | boolean>,
  targetKey: string,
): Record<string, string | number | boolean> {
  const result: Record<string, string | number | boolean> = {};
  for (const [k, v] of Object.entries(record)) {
    if (k !== targetKey) result[k] = v;
  }
  return result;
}

/** Получить значение характеристики из form.specifications по ключу */
function getSpecValue(
  specs: Record<string, string | number | boolean | undefined>,
  key: string,
): string {
  const v = specs[key];
  if (v === undefined || v === null) return '';
  return String(v);
}

// 
// Определение типа для характеристик без мета-данных
// 

/** Проверяет, является ли строка числом */
function isNumericValue(val: string): boolean {
  if (!val.trim()) return false;
  return /^\d+(\.\d+)?$/.test(val.trim());
}

/** Проверяет, является ли значение «Да»/«Нет» */
function isYesNoValue(val: string): boolean {
  const v = val.trim().toLowerCase();
  return ['да', 'нет', 'yes', 'no'].includes(v);
}

/** Определяет тип инпута для характеристики без мета-данных */
function detectAutoType(val: string): 'number' | 'yesno' | 'text' {
  if (!val.trim()) return 'text';
  if (isYesNoValue(val)) return 'yesno';
  if (isNumericValue(val)) return 'number';
  return 'text';
}

/**
 * Парсит строку с числом и единицей измерения.
 * "93.6 дБ" → { number: "93.6", unit: "дБ" }
 * "28 мм"   → { number: "28", unit: "мм" }
 * "пластик" → null (текст)
 */
function parseNumberWithUnit(value: string): { number: string; unit: string } | null {
  const match = value.trim().match(/^([\d.,]+)\s*(.+)$/);
  if (!match) return null;
  // Нормализуем запятую к точке для number input
  return { number: match[1].replace(',', '.'), unit: match[2].trim() };
}

// 
// 
// Обёртка для select с иконкой стрелки вниз
// 
function SelectWrapper({ children, className = '' }: { children: React.ReactNode; className?: string }) {
  return (
    <div className={`relative ${className}`}>
      {children}
      <ChevronDown className="absolute right-2 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground pointer-events-none" />
    </div>
  );
}

/**
 * Select с опцией «+ Создать новое значение».
 * При выборе этой опции select заменяется на inline input с кнопками «Готово» / «Отмена».
 */
function CreatableSelect({
  value,
  onChange,
  placeholder = '— Не выбрано —',
  children,
}: {
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  children: React.ReactNode;
}) {
  const [isCreating, setIsCreating] = useState(false);
  const [newValue, setNewValue] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);
  const wrapperRef = useRef<HTMLDivElement>(null);

  // Авто-фокус при входе в режим создания
  useEffect(() => {
    if (isCreating && inputRef.current) {
      inputRef.current.focus();
    }
  }, [isCreating]);

  // Закрытие при клике вне
  useEffect(() => {
    if (!isCreating) return;
    const handler = (e: MouseEvent) => {
      if (wrapperRef.current && !wrapperRef.current.contains(e.target as Node)) {
        setIsCreating(false);
        setNewValue('');
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [isCreating]);

  const handleConfirm = () => {
    const trimmed = newValue.trim();
    if (trimmed) {
      onChange(trimmed);
    }
    setIsCreating(false);
    setNewValue('');
  };

  const handleCancel = () => {
    setIsCreating(false);
    setNewValue('');
  };

  const handleSelectChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    if (e.target.value === '__new__') {
      setIsCreating(true);
    } else {
      onChange(e.target.value);
    }
  };

  // Режим создания: inline input с кнопками
  if (isCreating) {
    return (
      <div ref={wrapperRef} className="flex items-center gap-1.5">
        <input
          ref={inputRef}
          type="text"
          value={newValue}
          onChange={(e) => setNewValue(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter') handleConfirm();
            if (e.key === 'Escape') handleCancel();
          }}
          placeholder="Введите новое значение"
          className="bg-surface-card border border-hairline-dark rounded-md px-3 py-2 text-sm text-body-text placeholder:text-muted-foreground focus:border-gold focus:ring-1 focus:ring-gold outline-none transition-colors flex-1"
        />
        <button
          type="button"
          onClick={handleConfirm}
          className="p-1.5 text-gold hover:text-gold/80 transition-colors"
          title="Готово"
        >
          <Check className="w-4 h-4" />
        </button>
        <button
          type="button"
          onClick={handleCancel}
          className="p-1.5 text-muted-foreground hover:text-body-text transition-colors"
          title="Отмена"
        >
          <X className="w-4 h-4" />
        </button>
      </div>
    );
  }

  // Обычный select с опцией создания
  return (
    <SelectWrapper>
      <select
        className="bg-surface-card border border-hairline-dark rounded-md px-3 py-2 pr-8 text-sm text-body-text focus:border-gold focus:ring-1 focus:ring-gold outline-none transition-colors w-full cursor-pointer appearance-none"
        value={value}
        onChange={handleSelectChange}
      >
        <option value="">{placeholder}</option>
        {children}
        <option value="__new__">+ Создать новое значение</option>
      </select>
    </SelectWrapper>
  );
}

// Единое представление строки характеристики
// 
interface SpecEntry {
  key: string;
  label: string;
  groupName: string;
  hasMeta: boolean;
  attr?: SpecificationAttributeDto;
  /** Тип для характеристик без мета (auto-detect) */
  autoType?: 'number' | 'yesno' | 'text';
  /** Фасет из FilterFacetAttribute (для атрибутов без мета) */
  facet?: FilterFacetAttribute;
  /** Уникальные значения из других товаров той же категории (для dropdown) */
  uniqueValues?: string[];
}

// 
// Input компоненты для разных типов
// 

/** Числовой input с единицей измерения */
function NumberSpecInput({
  attr,
  value,
  onChange,
}: {
  attr: SpecificationAttributeDto;
  value: string;
  onChange: (v: string) => void;
}) {
  const min = attr.validationMin ?? undefined;
  const max = attr.validationMax ?? undefined;
  const step = attr.validationStep ?? undefined;

  return (
    <div className="flex items-center gap-2">
      <input
        type="number"
        className="bg-surface-card border border-hairline-dark rounded-md px-3 py-2 text-sm text-body-text placeholder:text-muted-foreground focus:border-gold focus:ring-1 focus:ring-gold outline-none transition-colors w-full"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={`${min ?? 0} – ${max ?? '...'}`}
        min={min}
        max={max}
        step={step}
      />
      {attr.unit && (
        <span className="text-sm text-muted-foreground whitespace-nowrap min-w-[2ch]">
          {attr.unit}
        </span>
      )}
    </div>
  );
}

/** Числовой input без мета (auto-detect) */
function AutoNumberInput({
  value,
  onChange,
}: {
  value: string;
  onChange: (v: string) => void;
}) {
  return (
    <input
      type="number"
      className="bg-surface-card border border-hairline-dark rounded-md px-3 py-2 text-sm text-body-text placeholder:text-muted-foreground focus:border-gold focus:ring-1 focus:ring-gold outline-none transition-colors w-full"
      value={value}
      onChange={(e) => onChange(e.target.value)}
      placeholder="Введите число"
    />
  );
}

/** Числовой input с единицей (auto-detect: "93.6 дБ", "28 мм") */
function AutoNumberWithUnitInput({
  numberValue,
  unit,
  onChange,
}: {
  numberValue: string;
  unit: string;
  onChange: (v: string) => void;
}) {
  return (
    <div className="flex items-center gap-2">
      <input
        type="number"
        className="bg-surface-card border border-hairline-dark rounded-md px-3 py-2 text-sm text-body-text placeholder:text-muted-foreground focus:border-gold focus:ring-1 focus:ring-gold outline-none transition-colors w-full"
        value={numberValue}
        onChange={(e) => onChange(e.target.value)}
        placeholder="Введите число"
      />
      <span className="text-sm text-muted-foreground whitespace-nowrap min-w-[2ch]">
        {unit}
      </span>
    </div>
  );
}

/** Выпадающий список из канонических значений (с опцией создания нового) */
function SelectSpecInput({
  attr,
  value,
  onChange,
}: {
  attr: SpecificationAttributeDto;
  value: string;
  onChange: (v: string) => void;
}) {
  return (
    <CreatableSelect value={value} onChange={onChange}>
      {attr.options.map((opt) => (
        <option key={opt} value={opt}>
          {opt}
        </option>
      ))}
    </CreatableSelect>
  );
}

/** Select Да/Нет для характеристик без мета */
function AutoYesNoInput({
  value,
  onChange,
}: {
  value: string;
  onChange: (v: string) => void;
}) {
  // Нормализуем значение к «Да»/«Нет»
  const normalized = (() => {
    const v = value.trim().toLowerCase();
    if (['да', 'yes', 'true', '1'].includes(v)) return 'Да';
    if (['нет', 'no', 'false', '0'].includes(v)) return 'Нет';
    return value;
  })();

  return (
    <SelectWrapper>
      <select
        className="bg-surface-card border border-hairline-dark rounded-md px-3 py-2 pr-8 text-sm text-body-text focus:border-gold focus:ring-1 focus:ring-gold outline-none transition-colors w-full cursor-pointer appearance-none"
        value={normalized}
        onChange={(e) => onChange(e.target.value)}
      >
        <option value="">— Не выбрано —</option>
        <option value="Да">Да</option>
        <option value="Нет">Нет</option>
      </select>
    </SelectWrapper>
  );
}

/** Текстовое поле */
function TextSpecInput({
  attr,
  value,
  onChange,
}: {
  attr: SpecificationAttributeDto;
  value: string;
  onChange: (v: string) => void;
}) {
  return (
    <input
      type="text"
      className="bg-surface-card border border-hairline-dark rounded-md px-3 py-2 text-sm text-body-text placeholder:text-muted-foreground focus:border-gold focus:ring-1 focus:ring-gold outline-none transition-colors w-full"
      value={value}
      onChange={(e) => onChange(e.target.value)}
      placeholder={`Введите ${attr.displayName.toLowerCase()}`}
    />
  );
}

/** Текстовое поле для характеристик без мета */
function AutoTextInput({
  label,
  value,
  onChange,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
}) {
  return (
    <input
      type="text"
      className="bg-surface-card border border-hairline-dark rounded-md px-3 py-2 text-sm text-body-text placeholder:text-muted-foreground focus:border-gold focus:ring-1 focus:ring-gold outline-none transition-colors w-full"
      value={value}
      onChange={(e) => onChange(e.target.value)}
      placeholder={`Введите ${label.toLowerCase()}`}
    />
  );
}

/** Авто-определение нужного поля ввода (для атрибутов с мета) */
function SpecInput({
  attr,
  value,
  onChange,
}: {
  attr: SpecificationAttributeDto;
  value: string;
  onChange: (v: string) => void;
}) {
  // Range (числовой) — всегда number input
  if (attr.valueType === 'range') {
    return <NumberSpecInput attr={attr} value={value} onChange={onChange} />;
  }

  // Select с опциями — dropdown
  if (attr.options.length > 0) {
    return <SelectSpecInput attr={attr} value={value} onChange={onChange} />;
  }

  // Select без опций — text input
  return <TextSpecInput attr={attr} value={value} onChange={onChange} />;
}

/** Авто-определение поля ввода для характеристик без мета */
function AutoSpecInput({
  entry,
  value,
  onChange,
}: {
  entry: SpecEntry;
  value: string;
  onChange: (v: string) => void;
}) {
  // Если есть уникальные значения (>1 вариант) — dropdown
  if (entry.uniqueValues && entry.uniqueValues.length > 1) {
    return <UniqueValueSelect values={entry.uniqueValues} value={value} onChange={onChange} />;
  }
  // Если есть фасет с опциями — показываем dropdown
  if (entry.facet?.options && entry.facet.options.length > 0) {
    return <FacetSelectInput facet={entry.facet} value={value} onChange={onChange} />;
  }
  // Если фасет типа range — числовой input
  if (entry.facet?.filterType === 'range') {
    return <FacetRangeInput facet={entry.facet} value={value} onChange={onChange} />;
  }
  // Если значение похоже на число с единицей — number input + unit label
  const numWithUnit = parseNumberWithUnit(value);
  if (numWithUnit) {
    return (
      <AutoNumberWithUnitInput
        numberValue={numWithUnit.number}
        unit={numWithUnit.unit}
        onChange={onChange}
      />
    );
  }
  // Fallback: авто-определение по текущему значению
  switch (entry.autoType) {
    case 'number':
      return <AutoNumberInput value={value} onChange={onChange} />;
    case 'yesno':
      return <AutoYesNoInput value={value} onChange={onChange} />;
    default:
      return <AutoTextInput label={entry.label} value={value} onChange={onChange} />;
  }
}

/** Выпадающий список на основе FilterFacetAttribute (с опцией создания нового) */
function FacetSelectInput({
  facet,
  value,
  onChange,
}: {
  facet: FilterFacetAttribute;
  value: string;
  onChange: (v: string) => void;
}) {
  const options = facet.options ?? [];
  return (
    <CreatableSelect value={value} onChange={onChange}>
      {options.map((opt) => (
        <option key={opt.value} value={opt.value}>
          {opt.value}
        </option>
      ))}
    </CreatableSelect>
  );
}

/** Числовой input для range-фасетов (с мин/макс из FilterFacetAttribute) */
function FacetRangeInput({
  facet,
  value,
  onChange,
}: {
  facet: FilterFacetAttribute;
  value: string;
  onChange: (v: string) => void;
}) {
  return (
    <input
      type="number"
      className="bg-surface-card border border-hairline-dark rounded-md px-3 py-2 text-sm text-body-text placeholder:text-muted-foreground focus:border-gold focus:ring-1 focus:ring-gold outline-none transition-colors w-full"
      value={value}
      onChange={(e) => onChange(e.target.value)}
      placeholder={facet.minValue != null && facet.maxValue != null
        ? `${facet.minValue} – ${facet.maxValue}`
        : 'Введите число'
      }
      min={facet.minValue ?? undefined}
      max={facet.maxValue ?? undefined}
    />
  );
}

/** Выпадающий список на основе уникальных значений из других товаров (с опцией создания нового) */
function UniqueValueSelect({
  values,
  value,
  onChange,
}: {
  values: string[];
  value: string;
  onChange: (v: string) => void;
}) {
  return (
    <CreatableSelect value={value} onChange={onChange}>
      {values.map((opt) => (
        <option key={opt} value={opt}>
          {opt}
        </option>
      ))}
    </CreatableSelect>
  );
}

// 
// GroupSection — группа характеристик
// 
function GroupSection({
  groupName,
  entries,
  specs,
  metaKeys,
  onValueChange,
  onDelete,
}: {
  groupName: string;
  entries: SpecEntry[];
  specs: Record<string, string | number | boolean | undefined>;
  metaKeys: Set<string>;
  onValueChange: (key: string, value: string) => void;
  onDelete: (key: string) => void;
}) {
  if (entries.length === 0) return null;

  return (
    <div className="bg-surface-elevated rounded-lg overflow-hidden">
      {groupName && (
        <div className="px-4 py-2 bg-surface-card border-b border-hairline-dark">
          <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            {groupName}
          </h3>
        </div>
      )}
      <div className="divide-y divide-hairline-dark">
        {entries.map((entry) => {
          const value = getSpecValue(specs, entry.key);
          const isPresent = entry.key in specs;

          return (
            <div
              key={entry.key}
              className="grid grid-cols-[1fr_1fr_auto] gap-3 items-center px-4 py-3"
            >
              {/* Лейбл */}
              <div className="flex items-center gap-1.5">
                <label className="text-sm text-body-text font-medium">
                  {entry.label}
                  {entry.attr?.isRequired && (
                    <span className="text-price-rise ml-0.5">*</span>
                  )}
                </label>
              </div>

              {/* Инпут */}
              {isPresent ? (
                entry.hasMeta ? (
                  <SpecInput
                    attr={entry.attr!}
                    value={value}
                    onChange={(v) => onValueChange(entry.key, v)}
                  />
                ) : (
                  <AutoSpecInput
                    entry={entry}
                    value={value}
                    onChange={(v) => onValueChange(entry.key, v)}
                  />
                )
              ) : (
                <button
                  type="button"
                  onClick={() => onValueChange(entry.key, '')
                  }
                  className="text-xs text-gold hover:text-gold/80 transition-colors text-left cursor-pointer"
                >
                  + Добавить
                </button>
              )}

              {/* Удалить — только для ключей без мета */}
              {isPresent && !metaKeys.has(entry.key) && (
                <button
                  type="button"
                  onClick={() => onDelete(entry.key)}
                  className="p-1.5 text-muted-foreground hover:text-price-rise transition-colors cursor-pointer"
                  title="Удалить"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

// 
// AddSpecDropdown — кнопка «Добавить характеристику» с выпадающим списком
// 
function AddSpecDropdown({
  specMeta,
  currentKeys,
  onAddKey,
}: {
  specMeta: SpecificationAttributeDto[];
  currentKeys: Set<string>;
  onAddKey: (key: string) => void;
}) {
  const [isOpen, setIsOpen] = useState(false);
  const [search, setSearch] = useState('');
  const [customKey, setCustomKey] = useState('');
  const [showCustomInput, setShowCustomInput] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Ключи из specMeta, которых нет в текущем товаре
  const availableKeys = useMemo(() => {
    return specMeta.filter((attr) => {
      const nk = normalizeMergedSpecKey(attr.key);
      return !currentKeys.has(attr.key) && !(nk && currentKeys.has(nk));
    });
  }, [specMeta, currentKeys]);

  // Фильтрация по поиску
  const filteredKeys = useMemo(() => {
    if (!search.trim()) return availableKeys;
    const q = search.toLowerCase();
    return availableKeys.filter(
      (attr) =>
        attr.displayName.toLowerCase().includes(q) ||
        attr.key.toLowerCase().includes(q),
    );
  }, [availableKeys, search]);

  // Закрытие при клике вне
  useEffect(() => {
    if (!isOpen) return;
    const handler = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setIsOpen(false);
        setSearch('');
        setShowCustomInput(false);
        setCustomKey('');
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [isOpen]);

  const handleSelectKey = (key: string) => {
    onAddKey(key);
    setIsOpen(false);
    setSearch('');
  };

  const handleAddCustom = () => {
    const trimmed = customKey.trim();
    if (trimmed) {
      onAddKey(trimmed);
      setCustomKey('');
      setIsOpen(false);
      setShowCustomInput(false);
      setSearch('');
    }
  };

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center justify-center gap-2 px-4 py-3 border border-dashed border-hairline-dark rounded-md text-sm text-muted-foreground hover:text-body-text hover:border-body-text transition-colors cursor-pointer w-full"
      >
        <Plus className="w-4 h-4" />
        Добавить характеристику
      </button>

      {isOpen && (
        <div className="absolute bottom-full left-0 right-0 mb-1 bg-surface-card border border-hairline-dark rounded-lg shadow-lg z-50 max-h-64 overflow-hidden flex flex-col">
          {/* Поиск */}
          <div className="p-2 border-b border-hairline-dark">
            <div className="relative">
              <Search className="absolute left-2 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground" />
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Найти характеристику..."
                className="w-full pl-7 pr-2 py-1.5 text-sm bg-surface-elevated border border-hairline-dark rounded-md text-body-text placeholder:text-muted-foreground focus:border-gold focus:ring-1 focus:ring-gold outline-none"
                autoFocus
              />
            </div>
          </div>

          {/* Список доступных ключей */}
          <div className="overflow-y-auto flex-1">
            {filteredKeys.length > 0 ? (
              filteredKeys.map((attr) => (
                <button
                  key={attr.key}
                  type="button"
                  onClick={() => handleSelectKey(attr.key)}
                  className="w-full text-left px-3 py-2 text-sm text-body-text hover:bg-surface-elevated transition-colors cursor-pointer"
                >
                  {attr.displayName}
                  <span className="text-muted-foreground ml-1.5 text-xs">({attr.key})</span>
                </button>
              ))
            ) : (
              <div className="px-3 py-2 text-xs text-muted-foreground">
                {search ? 'Ничего не найдено' : 'Все характеристики из мета уже добавлены'}
              </div>
            )}
          </div>

          {/* Свой ключ */}
          <div className="p-2 border-t border-hairline-dark">
            {showCustomInput ? (
              <div className="flex gap-2">
                <input
                  type="text"
                  value={customKey}
                  onChange={(e) => setCustomKey(e.target.value)}
                  placeholder="Введите ключ (например, weight)"
                  className="flex-1 px-2 py-1.5 text-sm bg-surface-elevated border border-hairline-dark rounded-md text-body-text placeholder:text-muted-foreground focus:border-gold focus:ring-1 focus:ring-gold outline-none"
                  autoFocus
                  onKeyDown={(e) => e.key === 'Enter' && handleAddCustom()}
                />
                <button
                  type="button"
                  onClick={handleAddCustom}
                  className="px-2 py-1.5 text-sm text-gold hover:text-gold/80 transition-colors"
                >
                  OK
                </button>
                <button
                  type="button"
                  onClick={() => { setShowCustomInput(false); setCustomKey(''); }}
                  className="p-1.5 text-muted-foreground hover:text-body-text transition-colors"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>
            ) : (
              <button
                type="button"
                onClick={() => setShowCustomInput(true)}
                className="w-full text-left px-2 py-1.5 text-sm text-muted-foreground hover:text-body-text transition-colors cursor-pointer"
              >
                ✏️ Ввести свой ключ...
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

// 
// Компонент
// 
export function SpecificationsTab({ form, onChange }: SpecificationsTabProps) {
  const [specMeta, setSpecMeta] = useState<SpecificationAttributeDto[]>([]);
  const [loadingMeta, setLoadingMeta] = useState(false);
  const [filterFacets, setFilterFacets] = useState<FilterFacetAttribute[]>([]);

  // Загружаем категории для поиска UUID по slug
  const { data: categories } = useQuery({
    queryKey: ['dictionaries-categories'],
    queryFn: () => dictionariesApi.getCategories(),
  });

  // Находим UUID категории по slug или имени из формы
  const categoryId = useMemo(() => {
    if (!form.category || !categories) return null;
    // Ищем по slug (английский) или по name (русское название)
    const found = categories.find(
      (c) => c.slug === form.category || c.name === form.category
    );
    return found?.id ?? null;
  }, [form.category, categories]);

  // Загружаем мета-данные характеристик для категории
  useEffect(() => {
    if (!categoryId) {
      setSpecMeta([]);
      return;
    }

    let cancelled = false;
    setLoadingMeta(true);

    catalogAdminApi
      .getCategorySpecifications(categoryId)
      .then((data) => {
        if (!cancelled) {
          setSpecMeta(data.attributes);
        }
      })
      .catch(() => {
        if (!cancelled) setSpecMeta([]);
      })
      .finally(() => {
        if (!cancelled) setLoadingMeta(false);
      });

    return () => {
      cancelled = true;
    };
  }, [categoryId]);

  // === Загрузка фасетов фильтров (FilterFacetAttribute) для атрибутов без мета ===
  useEffect(() => {
    if (!form.category) {
      setFilterFacets([]);
      return;
    }
    let cancelled = false;
    const backendSlug = FRONTEND_TO_BACKEND[form.category as ProductCategory];
    if (!backendSlug) {
      setFilterFacets([]);
      return;
    }
    catalogApi
      .getFilterFacets(backendSlug)
      .then((attrs) => {
        if (!cancelled) setFilterFacets(attrs);
      })
      .catch(() => {
        if (!cancelled) setFilterFacets([]);
      });
    return () => { cancelled = true; };
  }, [form.category]);

  // === Загрузка уникальных значений характеристик для категории ===
  const { data: uniqueSpecValues } = useQuery({
    queryKey: ['admin-unique-spec-values', categoryId],
    queryFn: () => catalogAdminApi.getUniqueSpecValues(categoryId!),
    enabled: !!categoryId,
  });

  // Уникальные значения для каждого ключа характеристик из товаров той же категории
  // Используется для атрибутов без specMeta и без filterFacets
  const uniqueValuesByKey = useMemo(() => {
    const map = new Map<string, string[]>();
    if (!uniqueSpecValues) return map;

    for (const [key, values] of Object.entries(uniqueSpecValues)) {
      if (!values?.length) continue;
      const sorted = [...values].sort();
      // По английскому ключу
      map.set(key, sorted);
      const nk = normalizeMergedSpecKey(key);
      if (nk && nk !== key && !map.has(nk)) map.set(nk, sorted);
    }

    // Также индексируем по русскому displayName из specMeta
    for (const attr of specMeta) {
      const engKey = attr.key;
      const values = map.get(engKey);
      if (values && attr.displayName) {
        map.set(attr.displayName, values);
        const ndk = normalizeMergedSpecKey(attr.displayName);
        if (ndk && ndk !== attr.displayName && !map.has(ndk)) map.set(ndk, values);
      }
    }

    return map;
  }, [uniqueSpecValues, specMeta]);

  // --- Обработчики ---

  const updateSpecs = (newSpecs: Record<string, string | number | boolean>) => {
    (onChange as (field: string, value: unknown) => void)('specifications', newSpecs);
  };

  const handleValueChange = (key: string, value: string) => {
    updateSpecs({ ...form.specifications, [key]: value });
  };

  const handleDelete = (key: string) => {
    updateSpecs(removeKey(form.specifications, key));
  };

  // Добавление характеристики по ключу (из specMeta или пользовательского)
  const handleAddKey = (key: string) => {
    updateSpecs({ ...form.specifications, [key]: '' });
  };

  // --- Вычисляемые значения ---

  // Мержим спецификации из API с парами ключ-значение из описания
  const mergedSpecs = useMemo(
    () => mergeDescriptionIntoSpecifications(form.specifications, form.description),
    [form.specifications, form.description],
  );

  // Все ключи из merged specifications товара (без кастомных _new_)
  const allSpecKeys = useMemo(
    () => Object.keys(mergedSpecs).filter((k) => !k.startsWith('_new_')),
    [mergedSpecs],
  );

  // Маппинг ключ → мета
  const metaByKey = useMemo(
    () => new Map(specMeta.map((a) => [a.key, a])),
    [specMeta],
  );

  // Маппинг ключ (нормализованный) → фасет из FilterFacetAttribute
  // Также индексируем по displayName (русское название) для маппинга русских ключей товара
  const facetByKey = useMemo(() => {
    const map = new Map<string, FilterFacetAttribute>();
    for (const facet of filterFacets) {
      // По английски ключу (type, frequency_range)
      map.set(facet.key, facet);
      const nk = normalizeMergedSpecKey(facet.key);
      if (nk && nk !== facet.key) map.set(nk, facet);
      // По русскому displayName (Тип, Диапазон частот, Гц)
      if (facet.displayName) {
        map.set(facet.displayName, facet);
        const ndk = normalizeMergedSpecKey(facet.displayName);
        if (ndk && ndk !== facet.displayName) map.set(ndk, facet);
      }
    }
    return map;
  }, [filterFacets]);

  // Множество ключей с мета-данными (нормализованные для сравнения)
  const metaKeys = useMemo(() => {
    const normalized = new Set<string>();
    for (const attr of specMeta) {
      const nk = normalizeMergedSpecKey(attr.key);
      if (nk) normalized.add(nk);
      // Также добавляем оригинальный ключ (может совпадать с normalized)
      normalized.add(attr.key);
    }
    return normalized;
  }, [specMeta]);

  // Группировка атрибутов с мета по groupName
  const groupedMetaAttrs = useMemo(() => {
    const groups = new Map<string, SpecificationAttributeDto[]>();
    const noGroup: SpecificationAttributeDto[] = [];

    for (const attr of specMeta) {
      if (attr.groupName && attr.groupName !== 'Прочее') {
        const list = groups.get(attr.groupName);
        if (list) list.push(attr);
        else groups.set(attr.groupName, [attr]);
      } else {
        noGroup.push(attr);
      }
    }

    // Сортируем внутри каждой группы по sortOrder
    for (const [, attrs] of groups) {
      attrs.sort((a, b) => a.sortOrder - b.sortOrder);
    }
    noGroup.sort((a, b) => a.sortOrder - b.sortOrder);

    return { groups, noGroup };
  }, [specMeta]);

  // Строим единый список SpecEntry для ВСЕХ характеристик
  const allEntries = useMemo<SpecEntry[]>(() => {
    const entries: SpecEntry[] = [];
    const addedKeys = new Set<string>(); // для отслеживания дублей

    // 1. Характеристики с мета-данными (сгруппированные по groupName)
    for (const groupName of [...groupedMetaAttrs.groups.keys()]) {
      const attrs = groupedMetaAttrs.groups.get(groupName)!;
      for (const attr of attrs) {
        // Нормализуем ключ для сравнения
        const nk = normalizeMergedSpecKey(attr.key);
        // Показываем только если значение есть в mergedSpecs
        if (attr.key in mergedSpecs || nk in mergedSpecs || attr.key in form.specifications || nk in form.specifications) {
          entries.push({
            key: nk || attr.key, // используем нормализованный ключ
            label: attr.displayName,
            groupName: groupName,
            hasMeta: true,
            attr,
          });
          if (nk) addedKeys.add(nk);
          addedKeys.add(attr.key);
        }
      }
    }
    // Характеристики с мета без группы
    for (const attr of groupedMetaAttrs.noGroup) {
      const nk = normalizeMergedSpecKey(attr.key);
      if (attr.key in mergedSpecs || nk in mergedSpecs || attr.key in form.specifications || nk in form.specifications) {
        entries.push({
          key: nk || attr.key,
          label: attr.displayName,
          groupName: '',
          hasMeta: true,
          attr,
        });
        if (nk) addedKeys.add(nk);
        addedKeys.add(attr.key);
      }
    }

    // 2. Характеристики без мета-данных (groupName = «Характеристики»)
    for (const key of allSpecKeys) {
      const nk = normalizeMergedSpecKey(key);
      // Пропускаем если уже добавлено (по нормализованному или оригинальному ключу)
      if (addedKeys.has(key) || (nk && addedKeys.has(nk))) continue;
      // Ищем фасет по нормализованному или оригинальному ключу
      const facet: FilterFacetAttribute | undefined = nk ? facetByKey.get(nk) : facetByKey.get(key);
      // Уникальные значения из других товаров категории (для dropdown)
      const uv: string[] | undefined = nk ? uniqueValuesByKey.get(nk) : uniqueValuesByKey.get(key);
      entries.push({
        key,
        label: specLabel(key),
        groupName: 'Характеристики',
        hasMeta: false,
        autoType: detectAutoType(getSpecValue(mergedSpecs, key)),
        facet,
        uniqueValues: uv,
      });
    }

    return entries;
  }, [mergedSpecs, form.specifications, groupedMetaAttrs, allSpecKeys, facetByKey, uniqueValuesByKey]);

  // Группируем все записи по groupName для рендера
  const groupedEntries = useMemo(() => {
    const groups = new Map<string, SpecEntry[]>();
    const noGroup: SpecEntry[] = [];

    for (const entry of allEntries) {
      if (entry.groupName) {
        const list = groups.get(entry.groupName);
        if (list) list.push(entry);
        else groups.set(entry.groupName, [entry]);
      } else {
        noGroup.push(entry);
      }
    }

    // Сортируем внутри каждой группы по приоритету → алфавиту
    for (const [, items] of groups) {
      items.sort((a, b) => compareSpecKeys(a.key, b.key));
    }
    noGroup.sort((a, b) => compareSpecKeys(a.key, b.key));

    return { groups, noGroup };
  }, [allEntries]);

  // Порядок групп для рендера: сначала именованные (кроме «Дата выпуска»), потом без группы, потом «Дата выпуска»
  const groupOrder = useMemo(() => {
    const names = [...groupedEntries.groups.keys()].sort((a, b) => {
      if (a === 'Дата выпуска') return 1;
      if (b === 'Дата выпуска') return -1;
      return 0;
    });
    return names;
  }, [groupedEntries]);

  // Множество ключей текущего товара (для AddSpecDropdown — исключаем уже добавленные)
  const currentSpecKeys = useMemo(() => {
    const keys = new Set(Object.keys(form.specifications));
    // Добавляем нормализованные ключи
    for (const k of Object.keys(form.specifications)) {
      const nk = normalizeMergedSpecKey(k);
      if (nk) keys.add(nk);
    }
    return keys;
  }, [form.specifications]);

  // --- Рендер ---

  if (!form.category) {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-muted-foreground">
        <Info className="w-10 h-10 mb-3" />
        <p className="text-sm">Сначала выберите категорию товара</p>
      </div>
    );
  }

  if (loadingMeta) {
    return (
      <div className="flex items-center justify-center py-16 text-muted-foreground">
        <p className="text-sm">Загрузка характеристик...</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-4">
      {/* Легенда */}
      {(specMeta.length > 0 || allSpecKeys.length > 0) && (
        <div className="bg-surface-elevated rounded-lg px-4 py-2 flex items-center gap-3 text-xs text-muted-foreground">
          <span className="text-price-rise">*</span> — обязательное поле
          {specMeta.some((a) => a.valueType === 'range') && (
            <>
              <span className="text-border-muted">|</span>
              <span>Числовые поля принимают только цифры</span>
            </>
          )}
          {allSpecKeys.length > 0 && (
            <>
              <span className="text-border-muted">|</span>
              <span>Всего: {allSpecKeys.length} {allSpecKeys.length === 1 ? 'характеристика' : 'характеристик'}</span>
            </>
          )}
        </div>
      )}

      {/* Сгруппированные характеристики */}
      {groupOrder.map((gName) => {
        const items = groupedEntries.groups.get(gName)!;
        return (
          <GroupSection
            key={gName}
            groupName={gName}
            entries={items}
            specs={mergedSpecs}
            metaKeys={metaKeys}
            onValueChange={handleValueChange}
            onDelete={handleDelete}
          />
        );
      })}

      {/* Без группы */}
      {groupedEntries.noGroup.length > 0 && (
        <GroupSection
          groupName=""
          entries={groupedEntries.noGroup}
          specs={mergedSpecs}
          metaKeys={metaKeys}
          onValueChange={handleValueChange}
          onDelete={handleDelete}
        />
      )}

      {/* Пустое состояние — только если совсем нет характеристик */}
      {allSpecKeys.length === 0 && specMeta.length === 0 && (
        <div className="text-center py-8 text-sm text-muted-foreground">
          <p>Для этой категории пока нет предопределённых характеристик.</p>
          <p className="mt-1">Добавьте свою характеристику вручную.</p>
        </div>
      )}

      {/* Кнопка добавления характеристику */}
      <AddSpecDropdown
        specMeta={specMeta}
        currentKeys={currentSpecKeys}
        onAddKey={handleAddKey}
      />
    </div>
  );
}
