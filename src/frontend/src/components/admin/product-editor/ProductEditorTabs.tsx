/**
 * ProductEditorTabs — управление табами редактора товара
 */

import { BasicInfoTab } from './tabs/BasicInfoTab';
import { SpecificationsTab } from './tabs/SpecificationsTab';
import { ImagesTab } from './tabs/ImagesTab';
import { PriceHistoryTab } from './tabs/PriceHistoryTab';
import type { ProductEditForm } from './types';
import type { ProductImage } from '@/api/types';

export type TabKey = 'basic' | 'specs' | 'images' | 'price-history';

export interface TabDefinition {
  key: TabKey;
  label: string;
}

export const TABS: TabDefinition[] = [
  { key: 'basic', label: 'Основное' },
  { key: 'specs', label: 'Характеристики' },
  { key: 'images', label: 'Изображения' },
  { key: 'price-history', label: 'История цен' },
];

interface ProductEditorTabsProps {
  activeTab: TabKey;
  onTabChange: (tab: TabKey) => void;
  form: ProductEditForm;
  onChange: (field: string, value: string | number | boolean | null) => void;
  productId: string;
  onImagesChange: (images: ProductImage[]) => void;
}

export function ProductEditorTabs({
  activeTab,
  onTabChange,
  form,
  onChange,
  productId,
  onImagesChange,
}: ProductEditorTabsProps) {
  const renderTabContent = () => {
    switch (activeTab) {
      case 'basic':
        return <BasicInfoTab form={form} onChange={onChange} />;
      case 'specs':
        return <SpecificationsTab form={form} onChange={onChange} />;
      case 'images':
        return (
          <ImagesTab
            productId={productId}
            images={form.images}
            onImagesChange={onImagesChange}
          />
        );
      case 'price-history':
        return <PriceHistoryTab productId={productId} currentPrice={form.price} />;
      default:
        return null;
    }
  };

  return (
    <div className="flex flex-col flex-1">
      {/* Tab bar */}
      <div className="flex border-b border-[var(--border-muted)] px-6">
        {TABS.map((tab) => (
          <button
            key={tab.key}
            type="button"
            onClick={() => onTabChange(tab.key)}
            className={`px-4 py-3 text-sm font-medium border-b-2 transition-colors cursor-pointer ${
              activeTab === tab.key
                ? 'border-gold text-gold'
                : 'border-transparent text-muted-foreground hover:text-body-text'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Tab content */}
      <div className="flex-1 p-6 overflow-y-auto">
        {renderTabContent()}
      </div>
    </div>
  );
}
