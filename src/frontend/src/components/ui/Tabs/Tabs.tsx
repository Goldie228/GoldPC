import { useState, type ReactNode, type ReactElement } from 'react';

export interface Tab {
  id: string;
  label: string;
  content: ReactNode;
}

export interface TabsProps {
  tabs: Tab[];
  defaultTab?: string;
  className?: string;
}

/**
 * Компонент Tabs — переключаемые вкладки
 * 
 * @example
 * <Вкладки
 *   tabs={[
 *     { id: 'specs', label: 'Характеристики', content: <SpecsTable /> },
 *     { id: 'desc', label: 'Описание', content: <p>Описание товара</p> },
 *     { id: 'reviews', label: 'Отзывы', content: <Reviews /> },
 *   ]}
 * />
 */
export function Tabs({ tabs, defaultTab, className }: TabsProps): ReactElement {
  const [activeTab, setActiveTab] = useState(defaultTab ?? tabs[0]?.id);

  const activeContent = tabs.find((tab) => tab.id === activeTab)?.content;

  return (
    <div className={`${className ?? ''}`}>
      {/* Tab Headers */}
      <div className="flex border-b border-hairline-dark" role="tablist">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            role="tab"
            aria-selected={activeTab === tab.id}
            className={`px-4 py-2.5 text-sm font-medium transition-colors border-b-2 -mb-px ${
              activeTab === tab.id
                ? 'text-gold border-gold'
                : 'text-muted-text border-transparent hover:text-body-text'
            }`}
            onClick={() => setActiveTab(tab.id)}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Tab Content */}
      <div className="p-4" role="tabpanel">
        {activeContent}
      </div>
    </div>
  );
}

export default Tabs;