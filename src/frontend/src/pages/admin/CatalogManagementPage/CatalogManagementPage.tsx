/**
 * Страница управления каталогом
 * Список продуктов с возможностью редактирования и удаления
 */

import { useState, useEffect } from 'react';
import { catalogAdminApi, type UpdateProductRequest } from '../../../api/admin';
import { hasValidProductImage } from '../../../utils/image';
import type { Product, ProductCategory } from '../../../api/types';
import styles from './CatalogManagementPage.module.css';

const CATEGORY_LABELS: Record<ProductCategory, string> = {
  cpu: 'Процессоры',
  gpu: 'Видеокарты',
  motherboard: 'Материнские платы',
  ram: 'Оперативная память',
  storage: 'Накопители',
  psu: 'Блоки питания',
  case: 'Корпуса',
  cooling: 'Охлаждение',
  monitor: 'Мониторы',
  keyboard: 'Клавиатуры',
  mouse: 'Мыши',
  headphones: 'Наушники',
};

const CATEGORY_OPTIONS: ProductCategory[] = [
  'cpu', 'gpu', 'motherboard', 'ram', 'storage', 'psu', 'case', 'cooling', 'monitor', 'keyboard', 'mouse', 'headphones'
];

interface EditFormData {
  name: string;
  price: string;
  stock: string;
  isActive: boolean;
}

/**
 * Страница управления каталогом
 */
export function CatalogManagementPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [categoryFilter, setCategoryFilter] = useState<ProductCategory | ''>('');
  const [activeFilter, setActiveFilter] = useState<string>('');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalItems, setTotalItems] = useState(0);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [editForm, setEditForm] = useState<EditFormData>({ name: '', price: '', stock: '', isActive: true });
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState<string | null>(null);

  useEffect(() => {
    fetchProducts();
  }, [page, categoryFilter, activeFilter]);

  const fetchProducts = async () => {
    setLoading(true);
    setError(null);
    
    try {
      const params: { page: number; pageSize: number; category?: ProductCategory; isActive?: boolean } = {
        page,
        pageSize: 10,
      };
      
      if (categoryFilter) {
        params.category = categoryFilter;
      }

      if (activeFilter) {
        params.isActive = activeFilter === 'true';
      }
      
      const response = await catalogAdminApi.getProducts(params);
      setProducts(response.data);
      setTotalPages(response.meta.totalPages);
      setTotalItems(response.meta.totalItems);
    } catch (err) {
      setError('Не удалось загрузить товары. Попробуйте позже.');
      console.error('Failed to fetch products:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleEditClick = (product: Product) => {
    setEditingProduct(product);
    setEditForm({
      name: product.name,
      price: product.price.toString(),
      stock: product.stock.toString(),
      isActive: product.isActive,
    });
  };

  const handleEditCancel = () => {
    setEditingProduct(null);
    setEditForm({ name: '', price: '', stock: '', isActive: true });
  };

  const handleEditSave = async () => {
    if (!editingProduct) return;
    
    setSaving(true);
    try {
      const updateData: UpdateProductRequest = {
        name: editForm.name,
        price: parseFloat(editForm.price),
        stock: parseInt(editForm.stock, 10),
        isActive: editForm.isActive,
      };

      const updatedProduct = await catalogAdminApi.updateProduct(editingProduct.id, updateData);
      setProducts(products.map(p => p.id === editingProduct.id ? updatedProduct : p));
      setEditingProduct(null);
    } catch (err) {
      console.error('Failed to update product:', err);
      alert('Не удалось сохранить изменения');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (product: Product) => {
    if (!confirm(`Вы уверены, что хотите удалить "${product.name}"?`)) {
      return;
    }

    setDeleting(product.id);
    try {
      await catalogAdminApi.deleteProduct(product.id);
      setProducts(products.map(p => 
        p.id === product.id ? { ...p, isActive: false } : p
      ));
    } catch (err) {
      console.error('Failed to delete product:', err);
      alert('Не удалось удалить товар');
    } finally {
      setDeleting(null);
    }
  };

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('ru-BY', {
      style: 'currency',
      currency: 'BYN',
      minimumFractionDigits: 0,
    }).format(price);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('ru-RU', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
    });
  };

  return (
    <div className={styles.container}>
      <header className={styles.header}>
        <h1 className={styles.title}>Управление каталогом</h1>
        <p className={styles.subtitle}>
          Всего товаров: {totalItems}
        </p>
      </header>

      <div className={styles.filters}>
        <select
          className={styles.filterSelect}
          value={categoryFilter}
          onChange={(e) => {
            setCategoryFilter(e.target.value as ProductCategory | '');
            setPage(1);
          }}
        >
          <option value="">Все категории</option>
          {CATEGORY_OPTIONS.map((cat) => (
            <option key={cat} value={cat}>
              {CATEGORY_LABELS[cat]}
            </option>
          ))}
        </select>

        <select
          className={styles.filterSelect}
          value={activeFilter}
          onChange={(e) => {
            setActiveFilter(e.target.value);
            setPage(1);
          }}
        >
          <option value="">Все статусы</option>
          <option value="true">Активные</option>
          <option value="false">Неактивные</option>
        </select>

        <button className={styles.refreshBtn} onClick={fetchProducts}>
          🔄 Обновить
        </button>
      </div>

      {/* Edit Modal */}
      {editingProduct && (
        <div className={styles.modalOverlay} onClick={handleEditCancel}>
          <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
            <h2 className={styles.modalTitle}>Редактирование товара</h2>
            
            <div className={styles.modalContent}>
              <div className={styles.formGroup}>
                <label htmlFor="name">Название</label>
                <input
                  id="name"
                  type="text"
                  value={editForm.name}
                  onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
                />
              </div>

              <div className={styles.formRow}>
                <div className={styles.formGroup}>
                  <label htmlFor="price">Цена (BYN)</label>
                  <input
                    id="price"
                    type="number"
                    value={editForm.price}
                    onChange={(e) => setEditForm({ ...editForm, price: e.target.value })}
                  />
                </div>

                <div className={styles.formGroup}>
                  <label htmlFor="stock">Остаток</label>
                  <input
                    id="stock"
                    type="number"
                    value={editForm.stock}
                    onChange={(e) => setEditForm({ ...editForm, stock: e.target.value })}
                  />
                </div>
              </div>

              <div className={styles.formGroup}>
                <label className={styles.checkboxLabel}>
                  <input
                    type="checkbox"
                    checked={editForm.isActive}
                    onChange={(e) => setEditForm({ ...editForm, isActive: e.target.checked })}
                  />
                  Товар активен
                </label>
              </div>
            </div>

            <div className={styles.modalActions}>
              <button 
                className={styles.cancelBtn} 
                onClick={handleEditCancel}
                disabled={saving}
              >
                Отмена
              </button>
              <button 
                className={styles.saveBtn} 
                onClick={handleEditSave}
                disabled={saving}
              >
                {saving ? 'Сохранение...' : 'Сохранить'}
              </button>
            </div>
          </div>
        </div>
      )}

      {loading && (
        <div className={styles.loading}>
          <div className={styles.spinner}></div>
          <p>Загрузка товаров...</p>
        </div>
      )}

      {error && (
        <div className={styles.error}>
          <p>{error}</p>
          <button onClick={fetchProducts} className={styles.retryBtn}>
            Попробовать снова
          </button>
        </div>
      )}

      {!loading && !error && (
        <>
          <div className={styles.tableWrapper}>
            <table className={styles.table}>
              <thead>
                <tr>
                  <th>SKU</th>
                  <th>Название</th>
                  <th>Категория</th>
                  <th>Цена</th>
                  <th>Остаток</th>
                  <th>Статус</th>
                  <th>Обновлено</th>
                  <th>Действия</th>
                </tr>
              </thead>
              <tbody>
                {products.map((product) => (
                  <tr key={product.id} className={!product.isActive ? styles.inactiveRow : ''}>
                    <td className={styles.sku}>{product.sku}</td>
                    <td className={styles.productName}>
                      {hasValidProductImage(product.mainImage?.url) && product.mainImage ? (
                        <img 
                          src={product.mainImage.url} 
                          alt={product.name}
                          className={styles.productImage}
                        />
                      ) : (
                        <svg viewBox="0 0 60 60" fill="none" className={styles.productImagePlaceholder}>
                          <rect x="5" y="5" width="50" height="50" rx="4" fill="#1a1a1e" stroke="#3a3a3e"/>
                          <text x="30" y="35" textAnchor="middle" fill="#d4a574" fontSize="10">Нет фото</text>
                        </svg>
                      )}
                      <span>{product.name}</span>
                    </td>
                    <td>
                      <span className={styles.categoryBadge}>
                        {CATEGORY_LABELS[product.category]}
                      </span>
                    </td>
                    <td className={styles.price}>
                      {formatPrice(product.price)}
                      {product.oldPrice && (
                        <span className={styles.oldPrice}>
                          {formatPrice(product.oldPrice)}
                        </span>
                      )}
                    </td>
                    <td>
                      <span className={`${styles.stock} ${product.stock === 0 ? styles.outOfStock : ''}`}>
                        {product.stock} шт.
                      </span>
                    </td>
                    <td>
                      <span className={`${styles.statusBadge} ${product.isActive ? styles.active : styles.inactive}`}>
                        {product.isActive ? 'Активен' : 'Неактивен'}
                      </span>
                    </td>
                    <td>{product.updatedAt ? formatDate(product.updatedAt) : '—'}</td>
                    <td>
                      <div className={styles.actions}>
                        <button
                          className={`${styles.actionBtn} ${styles.editBtn}`}
                          onClick={() => handleEditClick(product)}
                          title="Редактировать"
                        >
                          ✏️
                        </button>
                        <button
                          className={`${styles.actionBtn} ${styles.deleteBtn}`}
                          onClick={() => handleDelete(product)}
                          disabled={deleting === product.id}
                          title="Удалить"
                        >
                          {deleting === product.id ? '⏳' : '🗑️'}
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {products.length === 0 && (
            <div className={styles.empty}>
              <p>Товары не найдены</p>
            </div>
          )}

          {totalPages > 1 && (
            <div className={styles.pagination}>
              <button
                className={styles.pageBtn}
                disabled={page === 1}
                onClick={() => setPage(page - 1)}
              >
                ← Назад
              </button>
              <span className={styles.pageInfo}>
                Страница {page} из {totalPages}
              </span>
              <button
                className={styles.pageBtn}
                disabled={page === totalPages}
                onClick={() => setPage(page + 1)}
              >
                Вперёд →
              </button>
            </div>
          )}
        </>
      )}
    </div>
  );
}