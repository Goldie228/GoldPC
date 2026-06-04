/**
 * Страница управления справочниками
 * Категории, производители, характеристики
 */

import { useState, useEffect } from 'react';
import {
  dictionariesApi,
  type DictionaryCategory,
  type DictionaryManufacturer,
  type DictionaryItem,
} from '../../../api/admin';
import { useToast } from '../../../hooks/useToast';
import { Search, Edit2, Trash2, Plus, X, Loader2 } from 'lucide-react';

type TabType = 'categories' | 'manufacturers' | 'attributes';

/**
 * Страница управления справочниками
 */
export function DictionariesPage() {
  const { showToast } = useToast();
  const [activeTab, setActiveTab] = useState<TabType>('categories');
  const [categories, setCategories] = useState<DictionaryCategory[]>([]);
  const [manufacturers, setManufacturers] = useState<DictionaryManufacturer[]>([]);
  const [attributes, setAttributes] = useState<DictionaryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [editingItem, setEditingItem] = useState<DictionaryItem | null>(null);
  const [formData, setFormData] = useState({ name: '', slug: '' });
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    void fetchData();
  }, [activeTab]);

  const fetchData = async () => {
    setLoading(true);
    setError(null);
    
    try {
      switch (activeTab) {
        case 'categories':
          const cats = await dictionariesApi.getCategories();
          setCategories(cats);
          break;
        case 'manufacturers':
          const mans = await dictionariesApi.getManufacturers();
          setManufacturers(mans);
          break;
        case 'attributes':
          const attrs = await dictionariesApi.getAttributes();
          setAttributes(attrs);
          break;
      }
    } catch (err) {
      setError('Не удалось загрузить данные. Попробуйте позже.');
      console.error('Failed to fetch dictionary data:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleAdd = () => {
    setEditingItem(null);
    setFormData({ name: '', slug: '' });
    setShowModal(true);
  };

  const handleEdit = (item: DictionaryItem) => {
    setEditingItem(item);
    setFormData({ name: item.name, slug: item.slug });
    setShowModal(true);
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Удалить эту запись?')) return;

    try {
      await dictionariesApi.deleteItem(activeTab, id);
      void fetchData();
    } catch (err) {
      console.error('Failed to delete:', err);
      showToast('Не удалось удалить запись', 'error');
    }
  };

  const handleSave = async () => {
    if (!formData.name.trim()) {
      showToast('Введите название', 'error');
      return;
    }

    setSaving(true);
    try {
      if (editingItem != null) {
        await dictionariesApi.updateItem(activeTab, editingItem.id, {
          name: formData.name,
          slug: formData.slug || formData.name.toLowerCase().replace(/\s+/g, '-'),
        });
      } else {
        await dictionariesApi.createItem(activeTab, {
          name: formData.name,
          slug: formData.slug || formData.name.toLowerCase().replace(/\s+/g, '-'),
        });
      }
      setShowModal(false);
      void fetchData();
    } catch (err) {
      console.error('Failed to save:', err);
      showToast('Не удалось сохранить запись', 'error');
    } finally {
      setSaving(false);
    }
  };

  const filterItems = <T extends DictionaryItem>(items: T[]): T[] => {
    if (!searchQuery) return items;
    return items.filter(
      (item) =>
        item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.slug.toLowerCase().includes(searchQuery.toLowerCase())
    );
  };

  const renderTable = () => {
    if (loading) {
      return (
        <div className="flex flex-col items-center justify-center py-12 text-muted-foreground">
          <Loader2 className="w-8 h-8 animate-spin text-accent mb-4" />
          <p>Загрузка...</p>
        </div>
      );
    }

    if (error) {
      return (
        <div className="text-center py-12 text-error">
          <p>{error}</p>
          <button onClick={() => void fetchData()} className="mt-4 px-4 py-2 bg-accent text-gold-ink rounded-lg text-sm hover:bg-accent-bright transition-colors">
            Попробовать снова
          </button>
        </div>
      );
    }

    let filteredItems: DictionaryItem[] = [];
    const itemCounts: Record<string, number> = {};

    switch (activeTab) {
      case 'categories':
        filteredItems = filterItems(categories);
        categories.forEach((c) => {
          itemCounts[c.id] = c.productCount;
        });
        break;
      case 'manufacturers':
        filteredItems = filterItems(manufacturers);
        manufacturers.forEach((m) => {
          itemCounts[m.id] = m.productCount;
        });
        break;
      case 'attributes':
        filteredItems = filterItems(attributes);
        break;
    }

    if (filteredItems.length === 0) {
      return (
        <div className="flex flex-col items-center justify-center py-12 text-muted-foreground">
          <p>Нет записей</p>
        </div>
      );
    }

    return (
      <div className="bg-card border border-border">
        <table className="w-full border-collapse">
          <thead>
            <tr>
              <th className="px-5 py-3.5 text-left text-[0.7rem] font-semibold text-muted-foreground uppercase tracking-[0.08em] bg-elevated border-b border-border">ID</th>
              <th className="px-5 py-3.5 text-left text-[0.7rem] font-semibold text-muted-foreground uppercase tracking-[0.08em] bg-elevated border-b border-border">Название</th>
              <th className="px-5 py-3.5 text-left text-[0.7rem] font-semibold text-muted-foreground uppercase tracking-[0.08em] bg-elevated border-b border-border">Slug</th>
              {activeTab !== 'attributes' && <th className="px-5 py-3.5 text-left text-[0.7rem] font-semibold text-muted-foreground uppercase tracking-[0.08em] bg-elevated border-b border-border">Товаров</th>}
              <th className="px-5 py-3.5 text-left text-[0.7rem] font-semibold text-muted-foreground uppercase tracking-[0.08em] bg-elevated border-b border-border">Статус</th>
              <th className="px-5 py-3.5 text-left text-[0.7rem] font-semibold text-muted-foreground uppercase tracking-[0.08em] bg-elevated border-b border-border"></th>
            </tr>
          </thead>
          <tbody>
            {filteredItems.map((item, index) => (
              <tr key={item.id} className="hover:bg-elevated">
                <td className="px-5 py-3.5 text-sm font-mono text-xs text-muted-foreground">#{String(index + 1).padStart(3, '0')}</td>
                <td className="px-5 py-3.5 text-sm font-medium text-foreground">{item.name}</td>
                <td className="px-5 py-3.5 text-sm font-mono text-xs text-muted-foreground">{item.slug}</td>
                {activeTab !== 'attributes' && (
                  <td className="px-5 py-3.5 text-sm font-mono text-xs text-muted-foreground">
                    {itemCounts[item.id] || 0}
                  </td>
                )}
                <td className="px-5 py-3.5 text-sm">
                  <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 text-[0.7rem] font-medium uppercase tracking-[0.05em] rounded ${
                    item.isActive
                      ? 'bg-green-500/15 text-green-500'
                      : 'bg-amber-500/15 text-amber-500'
                  }`}>
                    {item.isActive ? 'Активна' : 'Скрыта'}
                  </span>
                </td>
                <td className="px-5 py-3.5 text-sm">
                  <div className="flex gap-1">
                      <button
                        className="w-8 h-8 flex items-center justify-center bg-transparent border border-border text-muted-foreground cursor-pointer hover:border-accent hover:bg-accent/10 transition-colors"
                        title="Редактировать"
                        onClick={() => handleEdit(item)}
                      >
                        <Edit2 className="w-4 h-4" />
                      </button>
                      <button
                        className="w-8 h-8 flex items-center justify-center bg-transparent border border-border text-muted-foreground cursor-pointer hover:border-destructive hover:text-destructive hover:bg-destructive/10 transition-colors"
                        title="Удалить"
                        onClick={() => void handleDelete(item.id)}
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    <button
                      className="w-8 h-8 flex items-center justify-center bg-transparent border border-border text-muted-foreground cursor-pointer hover:border-destructive hover:text-destructive hover:bg-destructive/10 transition-colors"
                      title="Удалить"
                      onClick={() => void handleDelete(item.id)}
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    );
  };

  return (
    <div className="p-8 max-w-[1400px] mx-auto">
      <header className="flex justify-between items-start mb-8">
        <div>
          <h1 className="text-2xl font-semibold text-foreground mb-2 tracking-tight">Справочники</h1>
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <a href="#" className="text-muted-foreground hover:text-accent transition-colors no-underline">Admin</a>
            <span>→</span>
            <span className="text-muted-foreground">Справочники</span>
          </div>
        </div>
      </header>

      {/* Tabs */}
      <div className="flex gap-0 border-b border-border mb-8">
        <button
          className={`px-6 py-3 text-sm font-medium bg-transparent border-none cursor-pointer relative transition-colors ${
            activeTab === 'categories' ? 'text-accent' : 'text-muted-foreground hover:text-foreground'
          }`}
          onClick={() => setActiveTab('categories')}
        >
          Категории
          {activeTab === 'categories' && <div className="absolute bottom-[-1px] left-0 right-0 h-0.5 bg-accent"></div>}
        </button>
        <button
          className={`px-6 py-3 text-sm font-medium bg-transparent border-none cursor-pointer relative transition-colors ${
            activeTab === 'manufacturers' ? 'text-accent' : 'text-muted-foreground hover:text-foreground'
          }`}
          onClick={() => setActiveTab('manufacturers')}
        >
          Производители
          {activeTab === 'manufacturers' && <div className="absolute bottom-[-1px] left-0 right-0 h-0.5 bg-accent"></div>}
        </button>
        <button
          className={`px-6 py-3 text-sm font-medium bg-transparent border-none cursor-pointer relative transition-colors ${
            activeTab === 'attributes' ? 'text-accent' : 'text-muted-foreground hover:text-foreground'
          }`}
          onClick={() => setActiveTab('attributes')}
        >
          Характеристики
          {activeTab === 'attributes' && <div className="absolute bottom-[-1px] left-0 right-0 h-0.5 bg-accent"></div>}
        </button>
      </div>

      {/* Toolbar */}
      <div className="flex justify-between items-center mb-6 gap-4 flex-wrap">
        <div className="flex items-center gap-3 px-4 py-2.5 bg-card border border-border min-w-[320px]">
          <Search className="w-4 h-4 text-muted-foreground flex-shrink-0" />
          <input
            type="text"
            className="flex-1 bg-transparent border-none text-foreground text-sm outline-none placeholder-muted-foreground"
            placeholder="Поиск по названию..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
        <button className="flex items-center gap-2 px-5 py-2.5 bg-accent text-gold-ink border-none text-sm font-semibold cursor-pointer hover:bg-accent-bright transition-colors" onClick={handleAdd}>
          <Plus className="w-4 h-4" /> Добавить
        </button>
      </div>

      {/* Table */}
      {renderTable()}

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-[200]" onClick={() => setShowModal(false)}>
          <div className="bg-card border border-border w-full max-w-[480px]" onClick={(e) => e.stopPropagation()}>
            <div className="flex justify-between items-center px-6 py-5 border-b border-border">
              <h3 className="text-base font-semibold m-0">
                {editingItem ? 'Редактировать' : 'Новая запись'}
              </h3>
              <button className="w-8 h-8 flex items-center justify-center bg-transparent border-none text-muted-foreground cursor-pointer hover:text-foreground transition-colors" onClick={() => setShowModal(false)}>
                <X className="w-4 h-4" />
              </button>
            </div>
             <div className="p-6">
               <div className="mb-5">
                 <label className="block text-sm font-medium text-muted-foreground mb-2">Название</label>
                 <input
                   type="text"
                   className="w-full px-4 py-3 bg-elevated border border-border text-foreground text-sm transition-colors focus:outline-none focus:border-info-blue"
                   placeholder="Введите название"
                   value={formData.name}
                   onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                 />
               </div>
               <div className="mb-5">
                 <label className="block text-sm font-medium text-muted-foreground mb-2">Slug (URL)</label>
                 <input
                   type="text"
                   className="w-full px-4 py-3 bg-elevated border border-border text-foreground text-sm transition-colors focus:outline-none focus:border-info-blue"
                   placeholder="auto-generated-slug"
                   value={formData.slug}
                   onChange={(e) => setFormData({ ...formData, slug: e.target.value })}
                 />
               </div>
             </div>
             <div className="flex justify-end gap-3 px-6 py-5 border-t border-border">
               <button
                 className="px-5 py-2.5 bg-transparent border border-border text-muted-foreground text-sm font-semibold cursor-pointer hover:border-muted-foreground hover:text-foreground transition-colors"
                 onClick={() => setShowModal(false)}
               >
                 Отмена
               </button>
               <button
                 className="px-5 py-2.5 bg-accent text-gold-ink border-none text-sm font-semibold cursor-pointer hover:bg-accent-bright transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
                  onClick={() => void handleSave()}
                 disabled={saving}
               >
                 {saving ? 'Сохранение...' : 'Сохранить'}
               </button>
             </div>
          </div>
        </div>
      )}
    </div>
  );
}