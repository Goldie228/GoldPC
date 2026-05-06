import { ArrowUpDown, LayoutGrid, List, Table2, SlidersHorizontal } from 'lucide-react';

export type SortOption = 'popular' | 'price-asc' | 'price-desc' | 'rating' | 'newest' | 'name';
export type ViewMode = 'grid' | 'list' | 'table';

const SORT_OPTIONS: { value: SortOption; label: string }[] = [
  { value: 'popular', label: 'По популярности' },
  { value: 'price-asc', label: 'Цена: по возрастанию' },
  { value: 'price-desc', label: 'Цена: по убыванию' },
  { value: 'rating', label: 'По рейтингу' },
  { value: 'newest', label: 'Новинки' },
  { value: 'name', label: 'Название: А → Я' },
];

const VIEW_MODES: { value: ViewMode; icon: React.ReactNode; label: string }[] = [
  { value: 'grid', icon: <LayoutGrid size={15} />, label: 'Сетка' },
  { value: 'list', icon: <List size={15} />, label: 'Список' },
  { value: 'table', icon: <Table2 size={15} />, label: 'Таблица' },
];

export function Toolbar({
  sortBy,
  onSortChange,
  viewMode,
  onViewModeChange,
  activeFilterCount,
  onFilterClick,
}: {
  sortBy: SortOption;
  onSortChange: (s: SortOption) => void;
  viewMode: ViewMode;
  onViewModeChange: (v: ViewMode) => void;
  activeFilterCount: number;
  onFilterClick: () => void;
}): JSX.Element {
  return (
    <div className="bg-surface-card/95 backdrop-blur-md border-b border-hairline-dark sticky top-0 z-30 shadow-lg shadow-black/10">
      <div className="max-w-[1440px] mx-auto px-4 md:px-8 h-12 flex items-center gap-3">
        {/* Сортировка */}
        <div className="flex items-center gap-2">
          <ArrowUpDown size={14} className="text-muted-text flex-shrink-0" />
          <select
            value={sortBy}
            onChange={(e) => onSortChange(e.target.value as SortOption)}
            className="h-9 bg-surface-elevated text-body-text text-sm rounded-lg px-3 pr-8 border border-hairline-dark focus:outline-none focus:ring-2 focus:ring-gold/30 cursor-pointer appearance-none bg-[url('data:image/svg+xml;charset=utf-8,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20width%3D%2212%22%20height%3D%2212%22%20fill%3D%22%23707a8a%22%20viewBox%3D%220%200%2016%2016%22%3E%3Cpath%20d%3D%22M8%2011L3%206h10z%22%2F%3E%3C%2Fsvg%3E')] bg-[position:right_10px_center] bg-no-repeat hover:border-muted-strong transition-colors"
          >
            {SORT_OPTIONS.map(opt => (
              <option key={opt.value} value={opt.value}>{opt.label}</option>
            ))}
          </select>
        </div>

        <div className="flex-1" />

        {/* Кнопка фильтров — мобильная */}
        <button
          onClick={onFilterClick}
          className="lg:hidden h-9 px-4 bg-surface-elevated text-body-text text-sm rounded-lg border border-hairline-dark flex items-center gap-2 hover:bg-surface-card transition-colors"
        >
          <SlidersHorizontal size={14} />
          <span>Фильтры</span>
          {activeFilterCount > 0 && (
            <span className="h-5 min-w-5 px-1.5 bg-gold text-gold-ink text-[10px] font-bold rounded-full flex items-center justify-center">
              {activeFilterCount}
            </span>
          )}
        </button>

        {/* Режим отображения */}
        <div className="hidden md:flex items-center bg-surface-elevated rounded-lg p-0.5 border border-hairline-dark">
          {VIEW_MODES.map(mode => (
            <button
              key={mode.value}
              onClick={() => onViewModeChange(mode.value)}
              className={`w-9 h-8 rounded-md flex items-center justify-center transition-all ${
                viewMode === mode.value
                  ? 'bg-gold text-gold-ink shadow-sm'
                  : 'text-muted-text hover:text-body-text'
              }`}
              title={mode.label}
            >
              {mode.value === 'grid' ? <LayoutGrid size={18} /> : 
               mode.value === 'list' ? <List size={18} /> : 
               <Table2 size={18} />}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
