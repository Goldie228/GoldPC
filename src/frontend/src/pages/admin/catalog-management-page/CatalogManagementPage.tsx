/**
 * Страница управления каталогом
 * Список продуктов с возможностью редактирования и удаления
 */

import { useState, useEffect } from 'react';
import { catalogAdminApi, type UpdateProductRequest } from '../../../api/admin';
import { hasValidProductImage } from '../../../utils/image';
import type { Product, ProductCategory } from '../../../api/types';

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
    <div className="p-8 max-w-[1400px] mx-auto">
      <header className="mb-8">
        <h1 className="text-2xl font-semibold text-gray-900 mb-2">Управление каталогом</h1>
        <p className="text-sm text-gray-600">
          Всего товаров: {totalItems}
        </p>
      </header>

      <div className="flex gap-4 mb-6 flex-wrap">
        <select
          className="px-4 py-3 border border-gray-200 rounded-lg text-sm bg-white cursor-pointer min-w-[150px] focus:outline-none focus:border-blue-500"
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
          className="px-4 py-3 border border-gray-200 rounded-lg text-sm bg-white cursor-pointer min-w-[150px] focus:outline-none focus:border-blue-500"
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

        <button className="px-5 py-3 bg-gray-100 border border-gray-200 rounded-lg text-sm cursor-pointer hover:bg-gray-200 transition-colors" onClick={fetchProducts}>
          🔄 Обновить
        </button>
      </div>

      {/* Edit Modal */}
      {editingProduct && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-[1000]" onClick={handleEditCancel}>
          <div className="bg-white rounded-xl p-6 w-full max-w-[480px] mx-4 shadow-xl" onClick={(e) => e.stopPropagation()}>
            <h2 className="text-xl font-semibold text-gray-900 mb-6">Редактирование товара</h2>

            <div className="flex flex-col gap-4">
              <div className="flex flex-col gap-2">
                <label htmlFor="name" className="text-sm font-medium text-gray-700">Название</label>
                <input
                  id="name"
                  type="text"
                  className="px-3 py-3 border border-gray-200 rounded-lg text-sm focus:outline-none focus:border-blue-500 focus:ring-3 focus:ring-blue-100"
                  value={editForm.name}
                  onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="flex flex-col gap-2">
                  <label htmlFor="price" className="text-sm font-medium text-gray-700">Цена (BYN)</label>
                  <input
                    id="price"
                    type="number"
                    className="px-3 py-3 border border-gray-200 rounded-lg text-sm focus:outline-none focus:border-blue-500 focus:ring-3 focus:ring-blue-100"
                    value={editForm.price}
                    onChange={(e) => setEditForm({ ...editForm, price: e.target.value })}
                  />
                </div>

                <div className="flex flex-col gap-2">
                  <label htmlFor="stock" className="text-sm font-medium text-gray-700">Остаток</label>
                  <input
                    id="stock"
                    type="number"
                    className="px-3 py-3 border border-gray-200 rounded-lg text-sm focus:outline-none focus:border-blue-500 focus:ring-3 focus:ring-blue-100"
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
                <label htmlFor="isActive" className="text-sm cursor-pointer">Товар активен</label>
              </div>
            </div>

            <div className="flex justify-end gap-3 mt-6">
              <button
                className="px-5 py-3 bg-white border border-gray-200 rounded-lg text-sm cursor-pointer hover:bg-gray-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                onClick={handleEditCancel}
                disabled={saving}
              >
                Отмена
              </button>
              <button
                className="px-5 py-3 bg-blue-500 text-white border-none rounded-lg text-sm cursor-pointer hover:bg-blue-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
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
        <div className="flex flex-col items-center justify-center py-12 text-gray-600">
          <div className="w-8 h-8 border-2 border-gray-200 border-t-blue-500 rounded-full animate-spin mb-4"></div>
          <p>Загрузка товаров...</p>
        </div>
      )}

      {error && (
        <div className="text-center py-12 text-red-600">
          <p>{error}</p>
          <button onClick={fetchProducts} className="mt-4 px-4 py-2 bg-blue-500 text-white rounded-lg text-sm hover:bg-blue-600 transition-colors">
            Попробовать снова
          </button>
        </div>
      )}

      {!loading && !error && (
        <>
          <div className="overflow-x-auto bg-white rounded-xl shadow-sm border border-gray-200">
            <table className="w-full border-collapse text-sm">
              <thead>
                <tr className="bg-gray-50 border-b border-gray-200">
                  <th className="px-4 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wide">SKU</th>
                  <th className="px-4 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wide">Название</th>
                  <th className="px-4 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wide">Категория</th>
                  <th className="px-4 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wide">Цена</th>
                  <th className="px-4 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wide">Остаток</th>
                  <th className="px-4 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wide">Статус</th>
                  <th className="px-4 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wide">Обновлено</th>
                  <th className="px-4 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wide">Действия</th>
                </tr>
              </thead>
              <tbody>
                {products.map((product) => (
                  <tr key={product.id} className={`border-b border-gray-100 hover:bg-gray-50 ${!product.isActive ? 'opacity-60' : ''}`}>
                    <td className="px-4 py-4 font-mono text-xs text-gray-600">{product.sku}</td>
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
                            <rect x="5" y="5" width="50" height="50" rx="4" fill="#1a1a1e" stroke="#3a3a3e"/>
                            <text x="30" y="35" textAnchor="middle" fill="#d4a574" fontSize="10">Нет фото</text>
                          </svg>
                        )}
                        <span className="text-gray-900">{product.name}</span>
                      </div>
                    </td>
                    <td className="px-4 py-4">
                      <span className="inline-block px-3 py-1 bg-gray-100 rounded-full text-xs font-medium">
                        {CATEGORY_LABELS[product.category]}
                      </span>
                    </td>
                    <td className="px-4 py-4 whitespace-nowrap">
                      {formatPrice(product.price)}
                      {product.oldPrice && (
                        <span className="block text-xs text-gray-400 line-through">
                          {formatPrice(product.oldPrice)}
                        </span>
                      )}
                    </td>
                    <td className="px-4 py-4 font-medium">
                      <span className={product.stock === 0 ? 'text-red-600' : ''}>
                        {product.stock} шт.
                      </span>
                    </td>
                    <td className="px-4 py-4">
                      <span className={`inline-block px-3 py-1 rounded-full text-xs font-medium ${
                        product.isActive ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                      }`}>
                        {product.isActive ? 'Активен' : 'Неактивен'}
                      </span>
                    </td>
                    <td className="px-4 py-4 text-sm text-gray-600">{product.updatedAt ? formatDate(product.updatedAt) : '—'}</td>
                    <td className="px-4 py-4">
                      <div className="flex gap-2">
                        <button
                          className="w-8 h-8 flex items-center justify-center bg-transparent border border-gray-200 rounded-md cursor-pointer text-base hover:bg-gray-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                          onClick={() => handleEditClick(product)}
                          title="Редактировать"
                        >
                          ✏️
                        </button>
                        <button
                          className="w-8 h-8 flex items-center justify-center bg-transparent border border-gray-200 rounded-md cursor-pointer text-base hover:bg-red-50 hover:border-red-300 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
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
            <div className="flex flex-col items-center justify-center py-12 text-gray-600">
              <p>Товары не найдены</p>
            </div>
          )}

          {totalPages > 1 && (
            <div className="flex items-center justify-center gap-4 mt-6 py-4">
              <button
                className="px-4 py-2 bg-white border border-gray-200 rounded-md cursor-pointer text-sm hover:bg-gray-50 hover:border-blue-500 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                disabled={page === 1}
                onClick={() => setPage(page - 1)}
              >
                ← Назад
              </button>
              <span className="text-sm text-gray-600">
                Страница {page} из {totalPages}
              </span>
              <button
                className="px-4 py-2 bg-white border border-gray-200 rounded-md cursor-pointer text-sm hover:bg-gray-50 hover:border-blue-500 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
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