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
import styles from './DictionariesPage.module.css';

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
    fetchData();
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
      fetchData();
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
      if (editingItem) {
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
      fetchData();
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
        <div className={styles.loading}>
          <div className={styles.spinner}></div>
          <p>Загрузка...</p>
        </div>
      );
    }

    if (error) {
      return (
        <div className={styles.error}>
          <p>{error}</p>
          <button onClick={fetchData} className={styles.retryBtn}>
            Попробовать снова
          </button>
        </div>
      );
    }

    const getItemId = (index: number): string => {
      switch (activeTab) {
        case 'categories':
          return categories[index]?.id || '';
        case 'manufacturers':
          return manufacturers[index]?.id || '';
        case 'attributes':
          return attributes[index]?.id || '';
        default:
          return '';
      }
    };

    let filteredItems: DictionaryItem[] = [];
    let itemCounts: Record<string, number> = {};

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
        <div className={styles.empty}>
          <p>Нет записей</p>
        </div>
      );
    }

    return (
      <div className={styles.tableCard}>
        <table className={styles.table}>
          <thead>
            <tr>
              <th>ID</th>
              <th>Название</th>
              <th>Slug</th>
              {activeTab !== 'attributes' && <th>Товаров</th>}
              <th>Статус</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {filteredItems.map((item, index) => (
              <tr key={item.id}>
                <td>
                  <span className={styles.itemId}>#{String(index + 1).padStart(3, '0')}</span>
                </td>
                <td>
                  <span className={styles.itemName}>{item.name}</span>
                </td>
                <td>
                  <span className={styles.itemSlug}>{item.slug}</span>
                </td>
                {activeTab !== 'attributes' && (
                  <td>
                    <span className={styles.itemCount}>
                      {itemCounts[item.id] || 0}
                    </span>
                  </td>
                )}
                <td>
                  <span
                    className={`${styles.itemStatus} ${
                      item.isActive ? styles.active : styles.inactive
                    }`}
                  >
                    {item.isActive ? 'Активна' : 'Скрыта'}
                  </span>
                </td>
                <td>
                  <div className={styles.itemActions}>
                    <button
                      className={styles.actionBtn}
                      title="Редактировать"
                      onClick={() => handleEdit(item)}
                    >
                      ✏️
                    </button>
                    <button
                      className={`${styles.actionBtn} ${styles.delete}`}
                      title="Удалить"
                      onClick={() => handleDelete(item.id)}
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
    <div className={styles.container}>
      <header className={styles.header}>
        <div>
          <h1 className={styles.title}>Справочники</h1>
          <div className={styles.breadcrumb}>
            <a href="#">Admin</a>
            <span>→</span>
            <span>Справочники</span>
          </div>
        </div>
      </header>

      {/* Tabs */}
      <div className={styles.tabs}>
        <button
          className={`${styles.tab} ${activeTab === 'categories' ? styles.active : ''}`}
          onClick={() => setActiveTab('categories')}
        >
          Категории
        </button>
        <button
          className={`${styles.tab} ${activeTab === 'manufacturers' ? styles.active : ''}`}
          onClick={() => setActiveTab('manufacturers')}
        >
          Производители
        </button>
        <button
          className={`${styles.tab} ${activeTab === 'attributes' ? styles.active : ''}`}
          onClick={() => setActiveTab('attributes')}
        >
          Характеристики
        </button>
      </div>

      {/* Toolbar */}
      <div className={styles.toolbar}>
        <div className={styles.searchBox}>
          <span>🔍</span>
          <input
            type="text"
            placeholder="Поиск по названию..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
        <button className={styles.addBtn} onClick={handleAdd}>
          <span>+</span> Добавить
        </button>
      </div>

      {/* Table */}
      {renderTable()}

      {/* Modal */}
      {showModal && (
        <div className={styles.modalOverlay} onClick={() => setShowModal(false)}>
          <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
            <div className={styles.modalHeader}>
              <h3 className={styles.modalTitle}>
                {editingItem ? 'Редактировать' : 'Новая запись'}
              </h3>
              <button className={styles.modalClose} onClick={() => setShowModal(false)}>
                ✕
              </button>
            </div>
            <div className={styles.modalBody}>
              <div className={styles.formGroup}>
                <label className={styles.formLabel}>Название</label>
                <input
                  type="text"
                  className={styles.formInput}
                  placeholder="Введите название"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                />
              </div>
              <div className={styles.formGroup}>
                <label className={styles.formLabel}>Slug (URL)</label>
                <input
                  type="text"
                  className={styles.formInput}
                  placeholder="auto-generated-slug"
                  value={formData.slug}
                  onChange={(e) => setFormData({ ...formData, slug: e.target.value })}
                />
              </div>
            </div>
            <div className={styles.modalFooter}>
              <button
                className={styles.cancelBtn}
                onClick={() => setShowModal(false)}
              >
                Отмена
              </button>
              <button
                className={styles.saveBtn}
                onClick={handleSave}
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