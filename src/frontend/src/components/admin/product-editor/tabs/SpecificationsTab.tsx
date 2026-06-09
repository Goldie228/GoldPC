/**
 * SpecificationsTab — вкладка «Характеристики»
 * Динамический редактор на основе мета-данных из БД
 * Каждая категория имеет свой набор характеристик с типами, единицами и валидацией
 */

import { useState, useEffect, useMemo } from 'react';
import { Info, Plus, Trash2 } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { dictionariesApi } from '@/api/admin';
import { catalogAdminApi } from '@/api/admin';
import type { ProductEditForm } from '../types';
import type { SpecificationAttributeDto } from '@/api/types';

// ---------------------------------------------------------------------------
// Props
// ---------------------------------------------------------------------------
interface SpecificationsTabProps {
  form: ProductEditForm;
  onChange: (field: string, value: string | number | boolean | null) => void;
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------
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
  specs: Record<string, string | number | boolean>,
  key: string,
): string {
  const v = specs[key];
  if (v === undefined || v === null) return '';
  return String(v);
}

// ---------------------------------------------------------------------------
// Input компоненты для разных типов
// ---------------------------------------------------------------------------

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
        className="bg-[var(--bg-card)] border border-[var(--border-muted)] rounded-[var(--radius-md)] px-3 py-2 text-sm text-[var(--color-body-text)] placeholder:text-muted-foreground focus:border-gold focus:ring-1 focus:ring-gold outline-none transition-colors w-full"
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

/** Select из канонических значений */
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
    <select
      className="bg-[var(--bg-card)] border border-[var(--border-muted)] rounded-[var(--radius-md)] px-3 py-2 text-sm text-[var(--color-body-text)] focus:border-gold focus:ring-1 focus:ring-gold outline-none transition-colors w-full cursor-pointer appearance-none"
      value={value}
      onChange={(e) => onChange(e.target.value)}
    >
      <option value="">— Не выбрано —</option>
      {attr.options.map((opt) => (
        <option key={opt} value={opt}>
          {opt}
        </option>
      ))}
    </select>
  );
}

/** Текстовый input (для select-атрибутов без предопределённых значений) */
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
      className="bg-[var(--bg-card)] border border-[var(--border-muted)] rounded-[var(--radius-md)] px-3 py-2 text-sm text-[var(--color-body-text)] placeholder:text-muted-foreground focus:border-gold focus:ring-1 focus:ring-gold outline-none transition-colors w-full"
      value={value}
      onChange={(e) => onChange(e.target.value)}
      placeholder={`Введите ${attr.displayName.toLowerCase()}`}
    />
  );
}

/** Авто-определение нужного input */
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

// ---------------------------------------------------------------------------
// GroupSection — группа характеристик
// ---------------------------------------------------------------------------
function GroupSection({
  groupName,
  attributes,
  specs,
  onValueChange,
}: {
  groupName: string;
  attributes: SpecificationAttributeDto[];
  specs: Record<string, string | number | boolean>;
  onValueChange: (key: string, value: string) => void;
}) {
  return (
    <div className="bg-surface-elevated rounded-lg overflow-hidden">
      {groupName && (
        <div className="px-4 py-2 bg-[var(--bg-card)] border-b border-[var(--border-muted)]">
          <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            {groupName}
          </h3>
        </div>
      )}
      <div className="divide-y divide-[var(--border-muted)]">
        {attributes.map((attr) => {
          const value = getSpecValue(specs, attr.key);
          const isPresent = attr.key in specs;

          return (
            <div
              key={attr.key}
              className={`grid grid-cols-[1fr_1fr_auto] gap-3 items-center px-4 py-3 ${
                !isPresent ? 'opacity-40' : ''
              }`}
            >
              {/* Label */}
              <div className="flex items-center gap-1.5">
                <label className="text-sm text-body-text font-medium">
                  {attr.displayName}
                  {attr.isRequired && (
                    <span className="text-price-rise ml-0.5">*</span>
                  )}
                </label>
                {attr.unit && attr.valueType === 'range' && (
                  <span className="text-xs text-muted-foreground">({attr.unit})</span>
                )}
              </div>

              {/* Input */}
              {isPresent ? (
                <SpecInput
                  attr={attr}
                  value={value}
                  onChange={(v) => onValueChange(attr.key, v)}
                />
              ) : (
                <button
                  type="button"
                  onClick={() => onValueChange(attr.key, '')}
                  className="text-xs text-gold hover:text-gold/80 transition-colors text-left cursor-pointer"
                >
                  + Добавить
                </button>
              )}

              {/* Delete */}
              {isPresent && (
                <button
                  type="button"
                  onClick={() => {
                    const newSpecs = removeKey(specs, attr.key);
                    (onValueChange as unknown as (field: string, value: unknown) => void)(
                      'specifications',
                      newSpecs,
                    );
                  }}
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

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------
export function SpecificationsTab({ form, onChange }: SpecificationsTabProps) {
  const [specMeta, setSpecMeta] = useState<SpecificationAttributeDto[]>([]);
  const [loadingMeta, setLoadingMeta] = useState(false);

  // Загружаем категории для поиска UUID по slug
  const { data: categories } = useQuery({
    queryKey: ['dictionaries-categories'],
    queryFn: () => dictionariesApi.getCategories(),
  });

  // Находим UUID категории по slug из формы
  const categoryId = useMemo(() => {
    if (!form.category || !categories) return null;
    const found = categories.find((c) => c.slug === form.category);
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

  // Группируем атрибуты по groupName
  const groupedAttrs = useMemo(() => {
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

    // Сортируем внутри каждой группы
    for (const [, attrs] of groups) {
      attrs.sort((a, b) => a.sortOrder - b.sortOrder);
    }
    noGroup.sort((a, b) => a.sortOrder - b.sortOrder);

    return { groups, noGroup };
  }, [specMeta]);

  // --- Handlers ---

  const updateSpecs = (newSpecs: Record<string, string | number | boolean>) => {
    (onChange as (field: string, value: unknown) => void)('specifications', newSpecs);
  };

  const handleValueChange = (key: string, value: string) => {
    updateSpecs({ ...form.specifications, [key]: value });
  };

  const handleAddCustom = () => {
    const tempKey = `_new_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`;
    updateSpecs({ ...form.specifications, [tempKey]: '' });
  };

  // --- Derived ---

  // Пользовательские ключи (которых нет в мета-данных)
  const metaKeys = useMemo(
    () => new Set(specMeta.map((a) => a.key)),
    [specMeta],
  );
  const customEntries = Object.entries(form.specifications).filter(
    ([k]) => !metaKeys.has(k) && !k.startsWith('_new_'),
  );

  // --- Render ---

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

  const groupNames = [...groupedAttrs.groups.keys()].sort((a, b) => {
    // Дата выпуска всегда последняя
    if (a === 'Дата выпуска') return 1;
    if (b === 'Дата выпуска') return -1;
    return 0;
  });

  return (
    <div className="flex flex-col gap-4">
      {/* Легенда */}
      {specMeta.length > 0 && (
        <div className="bg-surface-elevated rounded-lg px-4 py-2 flex items-center gap-3 text-xs text-muted-foreground">
          <span className="text-price-rise">*</span> — обязательное поле
          {specMeta.some((a) => a.valueType === 'range') && (
            <>
              <span className="text-border-muted">|</span>
              <span>Числовые поля принимают только цифры</span>
            </>
          )}
        </div>
      )}

      {/* Сгруппированные характеристики */}
      {groupNames.map((gName) => {
        const attrs = groupedAttrs.groups.get(gName)!;
        return (
          <GroupSection
            key={gName}
            groupName={gName}
            attributes={attrs}
            specs={form.specifications}
            onValueChange={handleValueChange}
          />
        );
      })}

      {/* Без группы */}
      {groupedAttrs.noGroup.length > 0 && (
        <GroupSection
          groupName=""
          attributes={groupedAttrs.noGroup}
          specs={form.specifications}
          onValueChange={handleValueChange}
        />
      )}

      {/* Пользовательские характеристики (не из мета-данных) */}
      {customEntries.length > 0 && (
        <div className="bg-surface-elevated rounded-lg overflow-hidden">
          <div className="px-4 py-2 bg-[var(--bg-card)] border-b border-[var(--border-muted)]">
            <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              Дополнительно
            </h3>
          </div>
          <div className="divide-y divide-[var(--border-muted)]">
            {customEntries.map(([key, value], index) => (
              <div
                key={index}
                className="grid grid-cols-[1fr_1fr_auto] gap-3 items-center px-4 py-3"
              >
                <input
                  type="text"
                  className="bg-[var(--bg-card)] border border-[var(--border-muted)] rounded-[var(--radius-md)] px-3 py-2 text-sm text-[var(--color-body-text)] placeholder:text-muted-foreground focus:border-gold focus:ring-1 focus:ring-gold outline-none transition-colors w-full"
                  value={key}
                  placeholder="Название"
                  onChange={() => {}}
                />
                <input
                  type="text"
                  className="bg-[var(--bg-card)] border border-[var(--border-muted)] rounded-[var(--radius-md)] px-3 py-2 text-sm text-[var(--color-body-text)] placeholder:text-muted-foreground focus:border-gold focus:ring-1 focus:ring-gold outline-none transition-colors w-full"
                  value={String(value)}
                  onChange={(e) => handleValueChange(key, e.target.value)}
                  placeholder="Значение"
                />
                <button
                  type="button"
                  onClick={() => {
                    updateSpecs(removeKey(form.specifications, key));
                  }}
                  className="p-1.5 text-muted-foreground hover:text-price-rise transition-colors cursor-pointer"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Пустое состояние */}
      {specMeta.length === 0 && customEntries.length === 0 && (
        <div className="text-center py-8 text-sm text-muted-foreground">
          <p>Для этой категории пока нет предопределённых характеристик.</p>
          <p className="mt-1">Добавьте свою характеристику вручную.</p>
        </div>
      )}

      {/* Кнопка добавления кастомной хар-ки */}
      <button
        type="button"
        onClick={handleAddCustom}
        className="flex items-center justify-center gap-2 px-4 py-3 border border-dashed border-hairline-dark rounded-[var(--radius-md)] text-sm text-muted-foreground hover:text-body-text hover:border-body-text transition-colors cursor-pointer"
      >
        <Plus className="w-4 h-4" />
        + Добавить свою характеристику
      </button>
    </div>
  );
}
