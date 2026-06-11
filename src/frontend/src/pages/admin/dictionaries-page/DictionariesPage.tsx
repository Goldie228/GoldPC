/**
 * Страница управления справочниками (Справочники)
 * 3 вкладки: Категории, Производители, Характеристики
 * Inline-редактирование, добавление, удаление с подтверждением
 */

import { useState, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  dictionariesApi,
  type DictionaryCategory,
  type DictionaryManufacturer,
  type DictionaryItem,
  type CreateDictionaryItemRequest,
  type UpdateDictionaryItemRequest,
} from '@/api/admin';
import { useToast } from '@/hooks/useToast';
import {
  BookOpen,
  Search,
  Plus,
  Edit2,
  Trash2,
  Check,
  X,
  Loader2,
} from 'lucide-react';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

type TabType = 'categories' | 'manufacturers' | 'attributes';

interface TabConfig {
  key: TabType;
  label: string;
}

interface ItemFormData {
  name: string;
  slug: string;
}

type DictionaryUnion = DictionaryCategory | DictionaryManufacturer | DictionaryItem;

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const TABS: TabConfig[] = [
  { key: 'categories', label: 'Категории' },
  { key: 'manufacturers', label: 'Производители' },
  { key: 'attributes', label: 'Характеристики' },
];

function isCategory(item: DictionaryUnion): item is DictionaryCategory {
  return 'productCount' in item && !('country' in item);
}

function isManufacturer(item: DictionaryUnion): item is DictionaryManufacturer {
  return 'country' in item;
}

function deriveSlug(name: string): string {
  return name
    .toLowerCase()
    .replace(/[^\wа-яё\s-]/gi, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '');
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export function DictionariesPage() {
  const { showToast } = useToast();
  const queryClient = useQueryClient();

  // ----- Tab & filter state -----------------------------------------------
  const [activeTab, setActiveTab] = useState<TabType>('categories');
  const [searchQuery, setSearchQuery] = useState('');

  // ----- Inline edit state ------------------------------------------------
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editForm, setEditForm] = useState<ItemFormData>({ name: '', slug: '' });

  // ----- Add-new-row state -------------------------------------------------
  const [showAddForm, setShowAddForm] = useState(false);
  const [addForm, setAddForm] = useState<ItemFormData>({ name: '', slug: '' });

  // ===== React Query: fetch per tab =======================================

  const categoriesQuery = useQuery({
    queryKey: ['admin', 'dictionaries', 'categories'],
    queryFn: () => dictionariesApi.getCategories(),
    enabled: activeTab === 'categories',
  });

  const manufacturersQuery = useQuery({
    queryKey: ['admin', 'dictionaries', 'manufacturers'],
    queryFn: () => dictionariesApi.getManufacturers(),
    enabled: activeTab === 'manufacturers',
  });

  const attributesQuery = useQuery({
    queryKey: ['admin', 'dictionaries', 'attributes'],
    queryFn: () => dictionariesApi.getAttributes(),
    enabled: activeTab === 'attributes',
  });

  // ----- Resolve active query ---------------------------------------------
  const activeQuery =
    activeTab === 'categories'
      ? categoriesQuery
      : activeTab === 'manufacturers'
        ? manufacturersQuery
        : attributesQuery;

  const allData = (activeQuery.data ?? []) as DictionaryUnion[];
  const isLoading = activeQuery.isLoading;
  const isError = activeQuery.isError;

  // ----- Search filter ----------------------------------------------------
  const filteredData = useMemo(() => {
    if (!searchQuery.trim()) return allData;
    const q = searchQuery.toLowerCase();
    return allData.filter(
      (item) =>
        item.name.toLowerCase().includes(q) ||
        item.slug.toLowerCase().includes(q),
    );
  }, [allData, searchQuery]);

  // ===== Mutations =========================================================

  const invalidateAll = () => {
    queryClient.invalidateQueries({ queryKey: ['admin', 'dictionaries'] });
  };

  const createMutation = useMutation({
    mutationFn: (payload: CreateDictionaryItemRequest) =>
      dictionariesApi.createItem(activeTab, payload),
    onSuccess: () => {
      invalidateAll();
      setShowAddForm(false);
      setAddForm({ name: '', slug: '' });
      showToast('Запись добавлена', 'success');
    },
    onError: () => {
      showToast('Не удалось добавить запись', 'error');
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: UpdateDictionaryItemRequest }) =>
      dictionariesApi.updateItem(activeTab, id, data),
    onSuccess: () => {
      invalidateAll();
      setEditingId(null);
      showToast('Запись обновлена', 'success');
    },
    onError: () => {
      showToast('Не удалось обновить запись', 'error');
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => dictionariesApi.deleteItem(activeTab, id),
    onSuccess: () => {
      invalidateAll();
      showToast('Запись удалена', 'success');
    },
    onError: () => {
      showToast('Не удалось удалить запись', 'error');
    },
  });

  // ===== Handlers ===========================================================

  const handleStartEdit = (item: DictionaryItem) => {
    setEditingId(item.id);
    setEditForm({ name: item.name, slug: item.slug });
  };

  const handleCancelEdit = () => {
    setEditingId(null);
  };

  const handleSaveEdit = (id: string) => {
    if (!editForm.name.trim()) {
      showToast('Введите название', 'error');
      return;
    }
    updateMutation.mutate({
      id,
      data: {
        name: editForm.name.trim(),
        slug: editForm.slug.trim() || deriveSlug(editForm.name),
      },
    });
  };

  const handleDelete = (item: DictionaryItem) => {
    if (!window.confirm(`Удалить "${item.name}"?\nЭто действие нельзя отменить.`)) return;
    deleteMutation.mutate(item.id);
  };

  const handleStartAdd = () => {
    setShowAddForm(true);
    setAddForm({ name: '', slug: '' });
  };

  const handleSaveAdd = () => {
    if (!addForm.name.trim()) {
      showToast('Введите название', 'error');
      return;
    }
    createMutation.mutate({
      name: addForm.name.trim(),
      slug: addForm.slug.trim() || deriveSlug(addForm.name),
    });
  };

  const handleCancelAdd = () => {
    setShowAddForm(false);
    setAddForm({ name: '', slug: '' });
  };

  // ===== Render helpers =====================================================

  /** Renders a status badge (active / inactive) */
  const StatusBadge = ({ isActive }: { isActive: boolean }) => (
    <span
      className={`inline-flex items-center gap-1.5 px-2.5 py-1 text-xs font-medium rounded-md ${
        isActive
          ? 'bg-price-drop/15 text-price-drop'
          : 'bg-warning/15 text-warning'
      }`}
    >
      {isActive ? 'Активна' : 'Неактивна'}
    </span>
  );

  /** Renders loading skeleton */
  const LoadingState = () => (
    <div className="flex flex-col items-center justify-center py-16 text-muted-foreground">
      <Loader2 className="w-8 h-8 animate-spin text-gold mb-4" />
      <p className="text-sm">Загрузка...</p>
    </div>
  );

  /** Renders error with retry */
  const ErrorState = () => (
    <div className="flex flex-col items-center justify-center py-16 text-muted-foreground">
      <p className="text-sm text-price-rise mb-4">Не удалось загрузить данные. Попробуйте позже.</p>
      <button
        onClick={() => activeQuery.refetch()}
        className="inline-flex items-center gap-2 px-4 py-2 bg-surface-card text-body-text text-sm font-medium rounded-md border border-hairline-dark hover:bg-surface-elevated transition-colors"
      >
        <Loader2 className="w-4 h-4" />
        Попробовать снова
      </button>
    </div>
  );

  /** Renders empty-state placeholder */
  const EmptyState = () => (
    <div className="flex flex-col items-center justify-center py-16 text-muted-foreground">
      <BookOpen className="w-12 h-12 mb-4 opacity-40" />
      <p className="text-sm">Нет записей</p>
    </div>
  );

  /** Renders an inline input cell used in both edit and add modes */
  const InlineInput = ({
    value,
    onChange,
    placeholder,
  }: {
    value: string;
    onChange: (v: string) => void;
    placeholder?: string;
  }) => (
    <input
      type="text"
      className="w-full min-w-0 bg-surface-card border border-hairline-dark rounded-md px-3 py-1.5 text-sm text-body-text placeholder:text-muted-foreground focus:border-gold focus:ring-1 focus:ring-gold outline-none"
      value={value}
      onChange={(e) => onChange(e.target.value)}
      placeholder={placeholder}
    />
  );

  // ----- Table body ---------------------------------------------------------
  const renderTableBody = () => {
    if (isLoading) return <tr><td colSpan={100}><LoadingState /></td></tr>;
    if (isError) return <tr><td colSpan={100}><ErrorState /></td></tr>;

    if (filteredData.length === 0 && !showAddForm) {
      return <tr><td colSpan={100}><EmptyState /></td></tr>;
    }

    return (
      <>
        {/* ---- Add-new row ---- */}
        {showAddForm && (
          <tr className="bg-surface-elevated/30">
            {renderAddRowCells()}
            <td className="py-3 px-4 border-b border-hairline-dark">
              <div className="flex items-center gap-2">
                <button
                  onClick={() => handleSaveAdd()}
                  disabled={createMutation.isPending}
                  className="w-8 h-8 flex items-center justify-center bg-gold text-black rounded-md hover:brightness-110 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                  title="Сохранить"
                >
                  {createMutation.isPending ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <Check className="w-4 h-4" />
                  )}
                </button>
                <button
                  onClick={handleCancelAdd}
                  disabled={createMutation.isPending}
                  className="w-8 h-8 flex items-center justify-center bg-surface-card text-muted-foreground rounded-md border border-hairline-dark hover:text-body-text hover:bg-surface-elevated transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                  title="Отмена"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </td>
          </tr>
        )}

        {/* ---- Existing rows ---- */}
        {filteredData.map((item) => {
          const isEditing = editingId === item.id;
          const isPending =
            updateMutation.isPending && updateMutation.variables?.id === item.id;

          return (
            <tr
              key={item.id}
              className={`border-b border-hairline-dark transition-colors ${
                isEditing ? 'bg-surface-elevated/20' : 'hover:bg-surface-elevated/10'
              }`}
            >
              {isEditing ? renderEditRowCells(item) : renderNormalRowCells(item)}
              <td className="py-3 px-4 border-b border-hairline-dark">
                <div className="flex items-center gap-2">
                  {isEditing ? (
                    <>
                      <button
                        onClick={() => handleSaveEdit(item.id)}
                        disabled={isPending}
                        className="w-8 h-8 flex items-center justify-center bg-gold text-black rounded-md hover:brightness-110 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                        title="Сохранить"
                      >
                        {isPending ? (
                          <Loader2 className="w-4 h-4 animate-spin" />
                        ) : (
                          <Check className="w-4 h-4" />
                        )}
                      </button>
                      <button
                        onClick={handleCancelEdit}
                        disabled={isPending}
                        className="w-8 h-8 flex items-center justify-center bg-surface-card text-muted-foreground rounded-md border border-hairline-dark hover:text-body-text hover:bg-surface-elevated transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                        title="Отмена"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </>
                  ) : (
                    <>
                      <button
                        onClick={() => handleStartEdit(item)}
                        className="w-8 h-8 flex items-center justify-center bg-surface-card text-muted-foreground rounded-md border border-hairline-dark hover:text-gold hover:border-gold transition-all"
                        title="Редактировать"
                      >
                        <Edit2 className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleDelete(item)}
                        disabled={deleteMutation.isPending && deleteMutation.variables === item.id}
                        className="w-8 h-8 flex items-center justify-center bg-surface-card text-muted-foreground rounded-md border border-hairline-dark hover:text-price-rise hover:border-price-rise transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                        title="Удалить"
                      >
                        {deleteMutation.isPending && deleteMutation.variables === item.id ? (
                          <Loader2 className="w-4 h-4 animate-spin" />
                        ) : (
                          <Trash2 className="w-4 h-4" />
                        )}
                      </button>
                    </>
                  )}
                </div>
              </td>
            </tr>
          );
        })}
      </>
    );
  };

  // --- Normal row cells (read-only) ---
  const renderNormalRowCells = (item: DictionaryUnion) => {
    const showProductCount = isCategory(item) || isManufacturer(item);

    return (
      <>
        <td className="py-3 px-4 text-sm text-body-text font-medium border-b border-hairline-dark">
          {item.name}
        </td>
        <td className="py-3 px-4 text-sm text-muted-foreground font-mono border-b border-hairline-dark">
          {item.slug}
        </td>
        {isManufacturer(item) && (
          <td className="py-3 px-4 text-sm text-muted-foreground border-b border-hairline-dark">
            {item.country ?? '—'}
          </td>
        )}
        {showProductCount && (
          <td className="py-3 px-4 text-sm text-muted-foreground border-b border-hairline-dark">
            <span className="font-mono">{item.productCount}</span>
          </td>
        )}
        <td className="py-3 px-4 border-b border-hairline-dark">
          <StatusBadge isActive={item.isActive} />
        </td>
      </>
    );
  };

  // --- Edit row cells (inline inputs) ---
  const renderEditRowCells = (item: DictionaryUnion) => {
    const showProductCount = isCategory(item) || isManufacturer(item);

    return (
      <>
        <td className="py-3 px-4 border-b border-hairline-dark">
          <InlineInput
            value={editForm.name}
            onChange={(v) => setEditForm((p) => ({ ...p, name: v }))}
            placeholder="Название"
          />
        </td>
        <td className="py-3 px-4 border-b border-hairline-dark">
          <InlineInput
            value={editForm.slug}
            onChange={(v) => setEditForm((p) => ({ ...p, slug: v }))}
            placeholder={deriveSlug(editForm.name)}
          />
        </td>
        {isManufacturer(item) && (
          <td className="py-3 px-4 text-sm text-muted-foreground border-b border-hairline-dark">
            {item.country ?? '—'}
          </td>
        )}
        {showProductCount && (
          <td className="py-3 px-4 text-sm text-muted-foreground border-b border-hairline-dark">
            <span className="font-mono">{item.productCount}</span>
          </td>
        )}
        <td className="py-3 px-4 border-b border-hairline-dark">
          <StatusBadge isActive={item.isActive} />
        </td>
      </>
    );
  };

  // --- Add row cells ---
  const renderAddRowCells = () => {
    const showProductCount = activeTab !== 'attributes';

    return (
      <>
        <td className="py-3 px-4 border-b border-hairline-dark">
          <InlineInput
            value={addForm.name}
            onChange={(v) => setAddForm((p) => ({ ...p, name: v }))}
            placeholder="Введите название"
          />
        </td>
        <td className="py-3 px-4 border-b border-hairline-dark">
          <InlineInput
            value={addForm.slug}
            onChange={(v) => setAddForm((p) => ({ ...p, slug: v }))}
            placeholder={deriveSlug(addForm.name)}
          />
        </td>
        {activeTab === 'manufacturers' && (
          <td className="py-3 px-4 text-sm text-muted-foreground border-b border-hairline-dark">
            —
          </td>
        )}
        {showProductCount && (
          <td className="py-3 px-4 text-sm text-muted-foreground border-b border-hairline-dark">
            <span className="font-mono">0</span>
          </td>
        )}
        <td className="py-3 px-4 border-b border-hairline-dark">
          <StatusBadge isActive={true} />
        </td>
      </>
    );
  };

  // ===== Main render ========================================================

  return (
    <div className="bg-canvas-dark min-h-screen">
      <div className="p-8 max-w-[1400px] mx-auto">
        {/* ---- Page header ---- */}
        <header className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-lg font-semibold text-body-text">Справочники</h1>
            <p className="text-sm text-muted-foreground mt-1">
              Управление категориями, производителями и характеристиками
            </p>
          </div>
        </header>

        {/* ---- Tabs ---- */}
        <div className="bg-surface-card rounded-xl p-1 inline-flex gap-1 mb-6">
          {TABS.map((tab) => (
            <button
              key={tab.key}
              onClick={() => {
                setActiveTab(tab.key);
                setEditingId(null);
                setShowAddForm(false);
                setSearchQuery('');
              }}
              className={`inline-flex px-4 py-2 text-sm font-medium rounded-md transition-colors ${
                activeTab === tab.key
                  ? 'bg-gold text-black'
                  : 'text-muted-foreground hover:text-body-text hover:bg-surface-elevated'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* ---- Toolbar: search + add button ---- */}
        <div className="flex items-center justify-between gap-4 mb-6">
          <div className="relative flex-1 max-w-sm">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground pointer-events-none" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Поиск по названию..."
              className="w-full pl-10 pr-4 py-2 bg-surface-card border border-hairline-dark rounded-md text-sm text-body-text placeholder:text-muted-foreground focus:border-gold focus:ring-1 focus:ring-gold outline-none transition-colors"
            />
          </div>

          <button
            onClick={handleStartAdd}
            disabled={showAddForm}
            className="inline-flex items-center gap-2 px-4 py-2 bg-gold text-black text-sm font-semibold rounded-md hover:brightness-110 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Plus className="w-4 h-4" />
            Добавить
          </button>
        </div>

        {/* ---- Table ---- */}
        <div className="bg-surface-card rounded-xl overflow-hidden">
          <table className="w-full border-collapse">
            <thead>
              <tr className="bg-surface-elevated/50">
                <th className="py-3 px-4 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider border-b border-hairline-dark">
                  Название
                </th>
                <th className="py-3 px-4 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider border-b border-hairline-dark">
                  Slug
                </th>
                {activeTab === 'manufacturers' && (
                  <th className="py-3 px-4 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider border-b border-hairline-dark">
                    Страна
                  </th>
                )}
                {activeTab !== 'attributes' && (
                  <th className="py-3 px-4 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider border-b border-hairline-dark">
                    Товаров
                  </th>
                )}
                <th className="py-3 px-4 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider border-b border-hairline-dark">
                  Статус
                </th>
                <th className="py-3 px-4 text-right text-xs font-medium text-muted-foreground uppercase tracking-wider border-b border-hairline-dark">
                  Действия
                </th>
              </tr>
            </thead>
            <tbody>{renderTableBody()}</tbody>
          </table>
        </div>

        {/* ---- Summary footer ---- */}
        {!isLoading && !isError && filteredData.length > 0 && (
          <p className="text-xs text-muted-foreground mt-3 text-right">
            {showAddForm
              ? 'Добавление новой записи'
              : `Всего: ${filteredData.length} ${filteredData.length % 10 === 1 && filteredData.length % 100 !== 11 ? 'запись' : filteredData.length % 10 >= 2 && filteredData.length % 10 <= 4 && (filteredData.length % 100 < 10 || filteredData.length % 100 >= 20) ? 'записи' : 'записей'}`}
          </p>
        )}
      </div>
    </div>
  );
}
