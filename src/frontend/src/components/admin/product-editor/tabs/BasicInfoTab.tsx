/**
 * BasicInfoTab — вкладка «Основное»
 * Поля: название, категория, цена, старая цена, остаток, активность
 */

import { useState } from 'react';
import { Loader2 } from 'lucide-react';
import type { ProductEditForm } from '../types';
import type { ProductCategory } from '@/api/types';
import { catalogAdminApi } from '@/api/admin';
import { CATEGORY_LABELS, CATEGORY_ORDER } from '@/utils/category-mappings';

interface BasicInfoTabProps {
  form: ProductEditForm;
  onChange: (field: string, value: string | number | boolean | null) => void;
}

export function BasicInfoTab({ form, onChange }: BasicInfoTabProps) {
  const [isGenerating, setIsGenerating] = useState(false);

  const handleGenerateName = async () => {
    setIsGenerating(true);
    try {
      const result = await catalogAdminApi.generateProductName({
        manufacturerName: form.specifications?.['manufacturer'] as string | undefined,
        categorySlug: form.category || undefined,
        specifications: form.specifications,
      });
      if (result.name) {
        onChange('name', result.name);
      }
    } catch {
      // Ошибка генерации названия — не критична, пользователь может ввести вручную
    } finally {
      setIsGenerating(false);
    }
  };

  const canGenerate = !isGenerating && (form.category || Object.keys(form.specifications || {}).length > 0);

  return (
    <div className="flex flex-col gap-4">
      {/* Name */}
      <div className="flex flex-col gap-1.5">
        <label htmlFor="pe-name" className="text-sm font-medium text-muted-foreground">
          Название
        </label>
        <div className="flex gap-2">
          <input
            id="pe-name"
            type="text"
            className="flex-1 bg-surface-card border border-hairline-dark rounded-md px-3 py-2 text-sm text-body-text placeholder:text-muted-foreground focus:border-gold focus:ring-1 focus:ring-gold outline-none transition-colors"
            placeholder="Введите название товара"
            value={form.name}
            onChange={(e) => onChange('name', e.target.value)}
          />
          <button
            type="button"
            onClick={handleGenerateName}
            disabled={!canGenerate}
            className="inline-flex items-center gap-1.5 px-3 py-2 text-sm font-medium text-gold border border-gold/30 rounded-md hover:bg-gold/10 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            title="Сгенерировать название по шаблону"
          >
            {isGenerating ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <span>✨</span>
            )}
            <span className="hidden sm:inline">Сгенерировать</span>
          </button>
        </div>
      </div>

      {/* Category */}
      <div className="flex flex-col gap-1.5">
        <label htmlFor="pe-category" className="text-sm font-medium text-muted-foreground">
          Категория
          {form.isCategoryAutoDetected && (
            <span className="ml-2 inline-flex items-center rounded-full bg-gold/10 px-2 py-0.5 text-xs font-medium text-gold">
              Авто-определена
            </span>
          )}
        </label>
        <select
          id="pe-category"
          className="bg-surface-card border border-hairline-dark rounded-md px-3 py-2 text-sm text-body-text focus:border-gold focus:ring-1 focus:ring-gold outline-none transition-colors cursor-pointer"
          value={form.category}
          onChange={(e) => onChange('category', e.target.value)}
        >
          <option value="">Выберите категорию</option>
          {CATEGORY_ORDER.map((cat) => (
            <option key={cat} value={cat}>
              {CATEGORY_LABELS[cat]}
            </option>
          ))}
        </select>
      </div>

      {/* Price + Old Price */}
      <div className="grid grid-cols-2 gap-4">
        <div className="flex flex-col gap-1.5">
          <label htmlFor="pe-price" className="text-sm font-medium text-muted-foreground">
            Цена (BYN)
          </label>
          <input
            id="pe-price"
            type="number"
            min={0}
            step="0.01"
            className="bg-surface-card border border-hairline-dark rounded-md px-3 py-2 text-sm text-body-text placeholder:text-muted-foreground focus:border-gold focus:ring-1 focus:ring-gold outline-none transition-colors"
            placeholder="0"
            value={form.price}
            onChange={(e) => onChange('price', parseFloat(e.target.value) || 0)}
          />
        </div>
        <div className="flex flex-col gap-1.5">
          <label htmlFor="pe-oldprice" className="text-sm font-medium text-muted-foreground">
            Старая цена (BYN)
          </label>
          <input
            id="pe-oldprice"
            type="number"
            min={0}
            step="0.01"
            className="bg-surface-card border border-hairline-dark rounded-md px-3 py-2 text-sm text-body-text placeholder:text-muted-foreground focus:border-gold focus:ring-1 focus:ring-gold outline-none transition-colors"
            placeholder="0"
            value={form.oldPrice ?? ''}
            onChange={(e) =>
              onChange('oldPrice', e.target.value ? parseFloat(e.target.value) : null)
            }
          />
        </div>
      </div>

      {/* Stock */}
      <div className="flex flex-col gap-1.5">
        <label htmlFor="pe-stock" className="text-sm font-medium text-muted-foreground">
          Остаток
        </label>
        <input
          id="pe-stock"
          type="number"
          min={0}
          step="1"
          className="bg-surface-card border border-hairline-dark rounded-md px-3 py-2 text-sm text-body-text placeholder:text-muted-foreground focus:border-gold focus:ring-1 focus:ring-gold outline-none transition-colors"
          placeholder="0"
          value={form.stock}
          onChange={(e) => onChange('stock', parseInt(e.target.value, 10) || 0)}
        />
      </div>

      {/* isActive toggle */}
      <div className="flex items-center gap-3 pt-1">
        <button
          type="button"
          role="switch"
          aria-checked={form.isActive}
          onClick={() => onChange('isActive', !form.isActive)}
          className={`relative inline-flex h-5 w-9 shrink-0 cursor-pointer items-center rounded-full border border-hairline-dark transition-colors ${
            form.isActive ? 'bg-price-drop' : 'bg-surface-elevated'
          }`}
        >
          <span
            className={`inline-block h-3.5 w-3.5 transform rounded-full bg-white shadow-sm transition-transform ${
              form.isActive ? 'translate-x-[18px]' : 'translate-x-[3px]'
            }`}
          />
        </button>
        <label
          onClick={() => onChange('isActive', !form.isActive)}
          className="text-sm text-body-text cursor-pointer select-none"
        >
          Товар активен
        </label>
      </div>
    </div>
  );
}
