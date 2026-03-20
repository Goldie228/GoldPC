import { useState, type ReactNode, type ReactElement } from 'react';
import styles from './Tabs.module.css';

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
 * <Tabs
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
    <div className={`${styles.tabsContainer} ${className ?? ''}`}>
      {/* Tab Headers */}
      <div className={styles.tabHeaders} role="tablist">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            role="tab"
            aria-selected={activeTab === tab.id}
            className={`${styles.tabHeader} ${activeTab === tab.id ? styles.tabHeaderActive : ''}`}
            onClick={() => setActiveTab(tab.id)}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Tab Content */}
      <div className={styles.tabContent} role="tabpanel">
        {activeContent}
      </div>
    </div>
  );
}

export default Tabs;