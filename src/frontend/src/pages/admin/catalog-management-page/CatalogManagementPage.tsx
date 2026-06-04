/**
 * Страница управления каталогом
 * Список продуктов с возможностью редактирования и удаления
 */

import { useState, useEffect } from 'react';
import { catalogAdminApi, type UpdateProductRequest } from '../../../api/admin';
import { useToast } from '../../../hooks/useToast';
import { hasValidProductImage } from '../../../utils/image';
import type { Product, ProductCategory } from '../../../api/types';
import { Edit2, Trash2, RefreshCw, Loader2, ChevronLeft, ChevronRight, PackageX } from 'lucide-react';

const CATEGORY_LABELS: Record<ProductCategory, string> = {
  cpu: 'Процессоры',
  gpu: 'Видеокарты',
  motherboard: 'Материнские платы',
  ram: 'Оперативная память',
  storage: 'Накопители',
  psu: 'Блоки питания',
  case: 'Корпуса',
  cooling: 'Охлаждение',
  fan: 'Вентиляторы',
  monitor: 'Мониторы',
  keyboard: 'Клавиатуры',
  mouse: 'Мыши',
  headphones: 'Наушники',
};

const CATEGORY_OPTIONS: ProductCategory[] = [
  'cpu', 'gpu', 'motherboard', 'ram', 'storage', 'psu', 'case', 'cooling', 'fan', 'monitor', 'keyboard', 'mouse', 'headphones'
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
  const { showToast } = useToast();
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
    void fetchProducts();
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
      showToast('Не удалось сохранить изменения', 'error');
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
      showToast('Не удалось удалить товар', 'error');
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
    <div className="p-8 max-w-[1400px] mx-auto">
      <header className="mb-8">
        <h1 className="text-2xl font-semibold text-foreground mb-2">Управление каталогом</h1>
        <p className="text-sm text-muted-foreground">
          Всего товаров: {totalItems}
        </p>
      </header>

      <div className="flex gap-4 mb-6 flex-wrap">
        <select
          className="px-4 py-3 border border-border rounded-lg text-sm bg-card cursor-pointer min-w-[150px] focus:outline-none focus:border-info-blue"
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
          className="px-4 py-3 border border-border rounded-lg text-sm bg-card cursor-pointer min-w-[150px] focus:outline-none focus:border-info-blue"
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

        <button className="px-5 py-3 bg-card border border-border rounded-lg text-sm cursor-pointer hover:bg-elevated transition-colors" onClick={() => void fetchProducts()}>
          <RefreshCw className="w-4 h-4 inline mr-1" /> Обновить
        </button>
      </div>

      {/* Edit Modal */}
      {editingProduct && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-[1000]" onClick={handleEditCancel}>
          <div className="bg-card border border-border rounded-xl p-6 w-full max-w-[480px] mx-4" onClick={(e) => e.stopPropagation()}>
            <h2 className="text-xl font-semibold text-foreground mb-6">Редактирование товара</h2>

            <div className="flex flex-col gap-4">
              <div className="flex flex-col gap-2">
                <label htmlFor="name" className="text-sm font-medium text-muted-foreground">Название</label>
                <input
                  id="name"
                  type="text"
                  className="px-3 py-3 bg-elevated border border-border rounded-lg text-sm text-foreground focus:outline-none focus:border-info-blue focus:ring-3 focus:ring-info-blue/30"
                  value={editForm.name}
                  onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="flex flex-col gap-2">
                  <label htmlFor="price" className="text-sm font-medium text-muted-foreground">Цена (BYN)</label>
                  <input
                    id="price"
                    type="number"
                    className="px-3 py-3 bg-elevated border border-border rounded-lg text-sm text-foreground focus:outline-none focus:border-info-blue focus:ring-3 focus:ring-info-blue/30"
                    value={editForm.price}
                    onChange={(e) => setEditForm({ ...editForm, price: e.target.value })}
                  />
                </div>

                <div className="flex flex-col gap-2">
                  <label htmlFor="stock" className="text-sm font-medium text-muted-foreground">Остаток</label>
                  <input
                    id="stock"
                    type="number"
                    className="px-3 py-3 bg-elevated border border-border rounded-lg text-sm text-foreground focus:outline-none focus:border-info-blue focus:ring-3 focus:ring-info-blue/30"
                    value={editForm.stock}
                    onChange={(e) => setEditForm({ ...editForm, stock: e.target.value })}
                  />
                </div>
              </div>

              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="isActive"
                  className="w-4.5 h-4.5 cursor-pointer"
                  checked={editForm.isActive}
                  onChange={(e) => setEditForm({ ...editForm, isActive: e.target.checked })}
                />
                <label htmlFor="isActive" className="text-sm text-foreground cursor-pointer">Товар активен</label>
              </div>
            </div>

            <div className="flex justify-end gap-3 mt-6">
              <button
                className="px-5 py-3 bg-transparent border border-border rounded-lg text-sm text-muted-foreground cursor-pointer hover:bg-elevated transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                onClick={handleEditCancel}
                disabled={saving}
              >
                Отмена
              </button>
              <button
                className="px-5 py-3 bg-accent text-gold-ink border-none rounded-lg text-sm cursor-pointer hover:bg-accent-bright transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                onClick={() => void handleEditSave()}
                disabled={saving}
              >
                {saving ? 'Сохранение...' : 'Сохранить'}
              </button>
            </div>
          </div>
        </div>
      )}

      {loading && (
        <div className="flex flex-col items-center justify-center py-12 text-muted-foreground">
          <Loader2 className="w-8 h-8 animate-spin text-accent mb-4" />
          <p>Загрузка товаров...</p>
        </div>
      )}

      {error && (
        <div className="text-center py-12 text-error">
          <p>{error}</p>
          <button onClick={() => void fetchProducts()} className="mt-4 px-4 py-2 bg-accent text-gold-ink rounded-lg text-sm hover:bg-accent-bright transition-colors">
            Попробовать снова
          </button>
        </div>
      )}

      {!loading && !error && (
        <>
          <div className="overflow-x-auto bg-card border border-border">
            <table className="w-full border-collapse text-sm">
              <thead>
                <tr className="bg-elevated border-b border-border">
                  <th className="px-4 py-4 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wide">SKU</th>
                  <th className="px-4 py-4 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wide">Название</th>
                  <th className="px-4 py-4 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wide">Категория</th>
                  <th className="px-4 py-4 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wide">Цена</th>
                  <th className="px-4 py-4 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wide">Остаток</th>
                  <th className="px-4 py-4 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wide">Статус</th>
                  <th className="px-4 py-4 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wide">Обновлено</th>
                  <th className="px-4 py-4 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wide">Действия</th>
                </tr>
              </thead>
              <tbody>
                {products.map((product) => (
                  <tr key={product.id} className={`border-b border-border hover:bg-elevated ${!product.isActive ? 'opacity-60' : ''}`}>
                    <td className="px-4 py-4 font-mono text-xs text-muted-foreground">{product.sku}</td>
                    <td className="px-4 py-4">
                      <div className="flex items-center gap-3 max-w-[250px]">
                        {hasValidProductImage(product.mainImage?.url) && product.mainImage ? (
                          <img
                            src={product.mainImage.url}
                            alt={product.name}
                            className="w-10 h-10 rounded-md object-cover flex-shrink-0"
                          />
                        ) : (
                          <svg viewBox="0 0 60 60" fill="none" className="w-10 h-10 rounded-md flex-shrink-0">
                            <rect x="5" y="5" width="50" height="50" rx="4" fill="var(--color-surface-card)" stroke="var(--color-hairline-dark)"/>
                            <text x="30" y="35" textAnchor="middle" fill="var(--color-gold-300)" fontSize="10">Нет фото</text>
                          </svg>
                        )}
                        <span className="text-foreground">{product.name}</span>
                      </div>
                    </td>
                    <td className="px-4 py-4">
                      <span className="inline-block px-3 py-1 bg-elevated border border-border rounded-full text-xs font-medium text-muted-foreground">
                        {CATEGORY_LABELS[product.category]}
                      </span>
                    </td>
                    <td className="px-4 py-4 whitespace-nowrap">
                      {formatPrice(product.price)}
                      {product.oldPrice && (
                        <span className="block text-xs text-muted-foreground line-through">
                          {formatPrice(product.oldPrice)}
                        </span>
                      )}
                    </td>
                    <td className="px-4 py-4 font-medium">
                      <span className={product.stock === 0 ? 'text-destructive' : 'text-foreground'}>
                        {product.stock} шт.
                      </span>
                    </td>
                    <td className="px-4 py-4">
                      <span className={`inline-block px-3 py-1 rounded-full text-xs font-medium ${
                        product.isActive ? 'bg-green-500/15 text-green-500' : 'bg-red-500/15 text-red-500'
                      }`}>
                        {product.isActive ? 'Активен' : 'Неактивен'}
                      </span>
                    </td>
                    <td className="px-4 py-4 text-sm text-muted-foreground">{product.updatedAt ? formatDate(product.updatedAt) : '—'}</td>
                    <td className="px-4 py-4">
                      <div className="flex gap-2">
                        <button
                          className="w-8 h-8 flex items-center justify-center bg-transparent border border-border rounded-md cursor-pointer hover:bg-elevated transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                          onClick={() => handleEditClick(product)}
                          title="Редактировать"
                        >
                          <Edit2 className="w-4 h-4" />
                        </button>
                        <button
                          className="w-8 h-8 flex items-center justify-center bg-transparent border border-border rounded-md cursor-pointer hover:bg-elevated hover:text-destructive transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                          onClick={() => void handleDelete(product)}
                          disabled={deleting === product.id}
                          title="Удалить"
                        >
                          {deleting === product.id ? <Loader2 className="w-4 h-4 animate-spin" /> : <Trash2 className="w-4 h-4" />}
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {products.length === 0 && (
            <div className="flex flex-col items-center justify-center py-12 text-muted-foreground">
              <PackageX className="w-12 h-12 text-muted-foreground mb-4" />
              <p>Товары не найдены</p>
            </div>
          )}

          {totalPages > 1 && (
            <div className="flex items-center justify-center gap-4 mt-6 py-4">
              <button
                className="px-4 py-2 bg-card border border-border rounded-md cursor-pointer text-sm hover:bg-elevated hover:border-info-blue transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                disabled={page === 1}
                onClick={() => setPage(page - 1)}
              >
                <ChevronLeft className="w-4 h-4 inline" /> Назад
              </button>
              <span className="text-sm text-muted-foreground">
                Страница {page} из {totalPages}
              </span>
              <button
                className="px-4 py-2 bg-card border border-border rounded-md cursor-pointer text-sm hover:bg-elevated hover:border-info-blue transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                disabled={page === totalPages}
                onClick={() => setPage(page + 1)}
              >
                Вперёд <ChevronRight className="w-4 h-4 inline" />
              </button>
            </div>
          )}
        </>
      )}
    </div>
  );
}