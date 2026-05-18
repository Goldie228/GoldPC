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

type TabType = 'categories' | 'manufacturers' | 'attributes';

/**
 * Страница управления справочниками
 */
export function DictionariesPage() {
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
      alert('Не удалось удалить запись');
    }
  };

  const handleSave = async () => {
    if (!formData.name.trim()) {
      alert('Введите название');
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
      alert('Не удалось сохранить запись');
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
        <div className="flex flex-col items-center justify-center py-12 text-gray-400">
          <div className="w-8 h-8 border-2 border-gray-600 border-t-blue-500 rounded-full animate-spin mb-4"></div>
          <p>Загрузка...</p>
        </div>
      );
    }

    if (error) {
      return (
        <div className="text-center py-12 text-red-600">
          <p>{error}</p>
          <button onClick={() => void fetchData()} className="mt-4 px-4 py-2 bg-blue-500 text-white rounded-lg text-sm hover:bg-blue-600 transition-colors">
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
        <div className="flex flex-col items-center justify-center py-12 text-gray-400">
          <p>Нет записей</p>
        </div>
      );
    }

    return (
      <div className="bg-gray-800 border border-gray-700">
        <table className="w-full border-collapse">
          <thead>
            <tr>
              <th className="px-5 py-3.5 text-left text-[0.7rem] font-semibold text-gray-400 uppercase tracking-[0.08em] bg-gray-700 border-b border-gray-700">ID</th>
              <th className="px-5 py-3.5 text-left text-[0.7rem] font-semibold text-gray-400 uppercase tracking-[0.08em] bg-gray-700 border-b border-gray-700">Название</th>
              <th className="px-5 py-3.5 text-left text-[0.7rem] font-semibold text-gray-400 uppercase tracking-[0.08em] bg-gray-700 border-b border-gray-700">Slug</th>
              {activeTab !== 'attributes' && <th className="px-5 py-3.5 text-left text-[0.7rem] font-semibold text-gray-400 uppercase tracking-[0.08em] bg-gray-700 border-b border-gray-700">Товаров</th>}
              <th className="px-5 py-3.5 text-left text-[0.7rem] font-semibold text-gray-400 uppercase tracking-[0.08em] bg-gray-700 border-b border-gray-700">Статус</th>
              <th className="px-5 py-3.5 text-left text-[0.7rem] font-semibold text-gray-400 uppercase tracking-[0.08em] bg-gray-700 border-b border-gray-700"></th>
            </tr>
          </thead>
          <tbody>
            {filteredItems.map((item, index) => (
              <tr key={item.id} className="hover:bg-gray-700">
                <td className="px-5 py-3.5 text-sm font-mono text-xs text-gray-400">#{String(index + 1).padStart(3, '0')}</td>
                <td className="px-5 py-3.5 text-sm font-medium text-gray-900">{item.name}</td>
                <td className="px-5 py-3.5 text-sm font-mono text-xs text-gray-400">{item.slug}</td>
                {activeTab !== 'attributes' && (
                  <td className="px-5 py-3.5 text-sm font-mono text-xs text-gray-400">
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
                      className="w-8 h-8 flex items-center justify-center bg-transparent border border-gray-600 text-gray-400 cursor-pointer hover:border-blue-500 hover:bg-blue-500/10 transition-colors text-sm"
                      title="Редактировать"
                      onClick={() => handleEdit(item)}
                    >
                      ✏️
                    </button>
                    <button
                      className="w-8 h-8 flex items-center justify-center bg-transparent border border-gray-600 text-gray-400 cursor-pointer hover:border-red-300 hover:text-red-500 hover:bg-red-500/10 transition-colors text-sm"
                      title="Удалить"
                      onClick={() => void handleDelete(item.id)}
                    >
                      🗑️
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
          <h1 className="text-2xl font-semibold text-gray-900 mb-2 tracking-tight">Справочники</h1>
          <div className="flex items-center gap-2 text-xs text-gray-500">
            <a href="#" className="text-gray-400 hover:text-blue-500 transition-colors no-underline">Admin</a>
            <span>→</span>
            <span className="text-gray-400">Справочники</span>
          </div>
        </div>
      </header>

      {/* Tabs */}
      <div className="flex gap-0 border-b border-gray-200 mb-8">
        <button
          className={`px-6 py-3 text-sm font-medium bg-transparent border-none cursor-pointer relative transition-colors ${
            activeTab === 'categories' ? 'text-blue-500' : 'text-gray-400 hover:text-gray-900'
          }`}
          onClick={() => setActiveTab('categories')}
        >
          Категории
          {activeTab === 'categories' && <div className="absolute bottom-[-1px] left-0 right-0 h-0.5 bg-blue-500"></div>}
        </button>
        <button
          className={`px-6 py-3 text-sm font-medium bg-transparent border-none cursor-pointer relative transition-colors ${
            activeTab === 'manufacturers' ? 'text-blue-500' : 'text-gray-400 hover:text-gray-900'
          }`}
          onClick={() => setActiveTab('manufacturers')}
        >
          Производители
          {activeTab === 'manufacturers' && <div className="absolute bottom-[-1px] left-0 right-0 h-0.5 bg-blue-500"></div>}
        </button>
        <button
          className={`px-6 py-3 text-sm font-medium bg-transparent border-none cursor-pointer relative transition-colors ${
            activeTab === 'attributes' ? 'text-blue-500' : 'text-gray-400 hover:text-gray-900'
          }`}
          onClick={() => setActiveTab('attributes')}
        >
          Характеристики
          {activeTab === 'attributes' && <div className="absolute bottom-[-1px] left-0 right-0 h-0.5 bg-blue-500"></div>}
        </button>
      </div>

      {/* Toolbar */}
      <div className="flex justify-between items-center mb-6 gap-4 flex-wrap">
        <div className="flex items-center gap-3 px-4 py-2.5 bg-gray-800 border border-gray-700 min-w-[320px]">
          <span className="text-gray-400">🔍</span>
          <input
            type="text"
            className="flex-1 bg-transparent border-none text-gray-900 text-sm outline-none placeholder-gray-400"
            placeholder="Поиск по названию..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
        <button className="flex items-center gap-2 px-5 py-2.5 bg-blue-500 text-white border-none text-sm font-semibold cursor-pointer hover:bg-blue-600 transition-colors" onClick={handleAdd}>
          <span>+</span> Добавить
        </button>
      </div>

      {/* Table */}
      {renderTable()}

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-[200]" onClick={() => setShowModal(false)}>
          <div className="bg-gray-800 border border-gray-700 w-full max-w-[480px]" onClick={(e) => e.stopPropagation()}>
            <div className="flex justify-between items-center px-6 py-5 border-b border-gray-700">
              <h3 className="text-base font-semibold m-0">
                {editingItem ? 'Редактировать' : 'Новая запись'}
              </h3>
              <button className="w-8 h-8 flex items-center justify-center bg-transparent border-none text-gray-400 cursor-pointer hover:text-gray-900 transition-colors" onClick={() => setShowModal(false)}>
                ✕
              </button>
            </div>
             <div className="p-6">
               <div className="mb-5">
                 <label className="block text-sm font-medium text-gray-400 mb-2">Название</label>
                 <input
                   type="text"
                   className="w-full px-4 py-3 bg-gray-700 border border-gray-600 text-gray-900 text-sm transition-colors focus:outline-none focus:border-blue-500"
                   placeholder="Введите название"
                   value={formData.name}
                   onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                 />
               </div>
               <div className="mb-5">
                 <label className="block text-sm font-medium text-gray-400 mb-2">Slug (URL)</label>
                 <input
                   type="text"
                   className="w-full px-4 py-3 bg-gray-700 border border-gray-600 text-gray-900 text-sm transition-colors focus:outline-none focus:border-blue-500"
                   placeholder="auto-generated-slug"
                   value={formData.slug}
                   onChange={(e) => setFormData({ ...formData, slug: e.target.value })}
                 />
               </div>
             </div>
             <div className="flex justify-end gap-3 px-6 py-5 border-t border-gray-700">
               <button
                 className="px-5 py-2.5 bg-transparent border border-gray-600 text-gray-400 text-sm font-semibold cursor-pointer hover:border-gray-400 hover:text-gray-900 transition-colors"
                 onClick={() => setShowModal(false)}
               >
                 Отмена
               </button>
               <button
                 className="px-5 py-2.5 bg-blue-500 text-white border-none text-sm font-semibold cursor-pointer hover:bg-blue-600 transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
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