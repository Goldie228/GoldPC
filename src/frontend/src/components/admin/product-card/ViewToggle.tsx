/**
 * ViewToggle — переключатель между табличным и карточным видом
 * Сохраняет выбор в localStorage('admin-catalog-view')
 */

import { useEffect } from 'react';
import { List, Grid } from 'lucide-react';

const STORAGE_KEY = 'admin-catalog-view';

interface ViewToggleProps {
  viewMode: 'table' | 'grid';
  onChange: (mode: 'table' | 'grid') => void;
}

export function ViewToggle({ viewMode, onChange }: ViewToggleProps) {
  // Синхронизация с localStorage при изменении
  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, viewMode);
  }, [viewMode]);

  return (
    <div className="flex items-center bg-surface-card border border-hairline-dark rounded-lg p-0.5">
      <button
        onClick={() => onChange('table')}
        className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md text-sm font-medium transition-all cursor-pointer ${
          viewMode === 'table'
            ? 'bg-gold text-black'
            : 'bg-surface-card text-muted-foreground hover:text-body-text'
        }`}
        title="Табличный вид"
      >
        <List className="w-4 h-4" />
        <span className="hidden sm:inline">Таблица</span>
      </button>
      <button
        onClick={() => onChange('grid')}
        className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md text-sm font-medium transition-all cursor-pointer ${
          viewMode === 'grid'
            ? 'bg-gold text-black'
            : 'bg-surface-card text-muted-foreground hover:text-body-text'
        }`}
        title="Карточный вид"
      >
        <Grid className="w-4 h-4" />
        <span className="hidden sm:inline">Сетка</span>
      </button>
    </div>
  );
}
