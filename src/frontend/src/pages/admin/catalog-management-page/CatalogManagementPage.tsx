/**
 * Страница управления каталогом
 * Таблица товаров с поиском, фильтрацией по категории, пагинацией
 * и модалкой создания/редактирования товара
 */

import { useState, useEffect, useRef } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { catalogAdminApi, type CreateProductRequest } from '@/api/admin';
import { useToast } from '@/hooks/useToast';
import { hasValidProductImage } from '@/utils/image';
import { CATEGORY_LABELS, CATEGORY_ORDER } from '@/utils/category-mappings';
import type { Product, ProductCategory } from '@/api/types';
import {
  Package,
  Plus,
  Edit2,
  Trash2,
  X,
  Search,
  ChevronLeft,
  ChevronRight,
  Loader2,
} from 'lucide-react';
import { ProductCardGrid } from '@/components/admin/product-card/ProductCardGrid';
import { ViewToggle } from '@/components/admin/product-card/ViewToggle';
import { ProductEditorDrawer } from '@/components/admin/product-editor/ProductEditorDrawer';

const PAGE_SIZE_OPTIONS = [10, 25, 50, 100] as const;

interface ProductFormData {
  name: string;
  price: string;
  category: ProductCategory | '';
  stock: string;
  description: string;
  isActive: boolean;
}

const EMPTY_FORM: ProductFormData = {
  name: '',
  price: '',
  category: '',
  stock: '',
  description: '',
  isActive: true,
};

/**
 * Страница управления каталогом
 */
export function CatalogManagementPage() {
  const queryClient = useQueryClient();
  const { showToast } = useToast();

  // Filter & pagination state
  const [searchInput, setSearchInput] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<ProductCategory | ''>('');
  const [activeFilter, setActiveFilter] = useState<'all' | 'active' | 'inactive'>('all');
  const [pageSize, setPageSize] = useState<number>(10);
  const [page, setPage] = useState(1);

  const debounceRef = useRef<ReturnType<typeof setTimeout>>(undefined);

  useEffect(() => {
    clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      setSearchQuery(searchInput);
      setPage(1);
    }, 300);
    return () => clearTimeout(debounceRef.current);
  }, [searchInput]);

  // View mode state (table/grid) with localStorage persistence
  const [viewMode, setViewMode] = useState<'table' | 'grid'>(() => {
    const saved = localStorage.getItem('admin-catalog-view');
    return saved === 'table' || saved === 'grid' ? saved : 'grid';
  });

  // Drawer state (редактирование)
  const [editingProductId, setEditingProductId] = useState<string | null>(null);

  // Modal state (только создание)
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [formData, setFormData] = useState<ProductFormData>(EMPTY_FORM);

  // Build query params
  const queryParams = {
    page,
    pageSize,
    ...(categoryFilter ? { category: categoryFilter } : {}),
    ...(searchQuery ? { search: searchQuery } : {}),
    ...(activeFilter !== 'all' ? { isActive: activeFilter === 'active' } : {}),
  };

  // Products query
  const {
    data: productsResponse,
    isLoading,
    isError,
    error,
    refetch,
  } = useQuery({
    queryKey: ['adminProducts', queryParams],
    queryFn: () => catalogAdminApi.getProducts(queryParams as Parameters<typeof catalogAdminApi.getProducts>[0]),
  });

  const products = productsResponse?.data ?? [];
  const totalItems = productsResponse?.meta?.totalItems ?? 0;
  const totalPages = productsResponse?.meta?.totalPages ?? 1;

  // Create mutation
  const createMutation = useMutation({
    mutationFn: (data: CreateProductRequest) => catalogAdminApi.createProduct(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['adminProducts'] });
      closeModal();
      showToast('Товар успешно создан', 'success');
    },
    onError: () => {
      showToast('Не удалось создать товар', 'error');
    },
  });

  // Delete mutation
  const deleteMutation = useMutation({
    mutationFn: (productId: string) => catalogAdminApi.deleteProduct(productId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['adminProducts'] });
      showToast('Товар удалён', 'success');
    },
    onError: () => {
      showToast('Не удалось удалить товар', 'error');
    },
  });

  const isSaving = createMutation.isPending;
  const isDeleting = deleteMutation.isPending;

  // --- Handlers ---

  const openCreateModal = () => {
    setFormData(EMPTY_FORM);
    setIsModalOpen(true);
  };

  const openEditDrawer = (product: Product) => {
    setEditingProductId(product.id);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setFormData(EMPTY_FORM);
  };

  const closeDrawer = () => {
    setEditingProductId(null);
  };

  const handleSave = () => {
    if (!formData.name || !formData.category) return;

    createMutation.mutate({
      name: formData.name,
      sku: `ADMIN-${Date.now()}`,
      category: formData.category,
      price: parseFloat(formData.price) || 0,
      stock: parseInt(formData.stock, 10) || 0,
      description: formData.description || undefined,
      isActive: formData.isActive,
    });
  };

  const handleDelete = (product: Product) => {
    if (!window.confirm(`Вы уверены, что хотите удалить "${product.name}"?`)) return;
    deleteMutation.mutate(product.id);
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setPage(1);
  };

  // --- Helpers ---

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('ru-BY', {
      style: 'currency',
      currency: 'BYN',
      minimumFractionDigits: 0,
    }).format(price);
  };

  const startItem = totalItems === 0 ? 0 : (page - 1) * pageSize + 1;
  const endItem = Math.min(page * pageSize, totalItems);

  return (
    <div className="bg-canvas-dark min-h-screen">
      <div className="max-w-[1400px] mx-auto pb-6 space-y-6">
        {/* Page Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-lg font-semibold text-body-text">Управление каталогом</h1>
            <p className="text-sm text-muted-foreground mt-1">
              Всего товаров: {totalItems}
            </p>
          </div>
          <button
            onClick={openCreateModal}
            className="inline-flex items-center gap-2 bg-gold text-gold-ink hover:bg-gold-active rounded-md px-4 py-2 text-sm font-semibold transition-colors cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            Добавить товар
          </button>
        </div>

        {/* Stats Bar */}
        <div className="bg-surface-card rounded-xl p-6">
          <div className="flex gap-6">
            <div className="flex items-center gap-3">
              <span className="font-mono text-xl font-medium text-gold">
                {totalItems.toLocaleString('ru-RU')}
              </span>
              <span className="text-xs text-muted-foreground">Всего товаров</span>
            </div>
            <div className="flex items-center gap-3">
              <span className="font-mono text-xl font-medium text-gold">
                {products.filter((p) => p.isActive).length}
              </span>
              <span className="text-xs text-muted-foreground">Активных на странице</span>
            </div>
          </div>
        </div>

        {/* Filters */}
        <div className="flex gap-3 flex-wrap items-center">
          <form onSubmit={handleSearch} className="flex gap-2 flex-1 min-w-[280px]">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground pointer-events-none" />
              <input
                type="text"
                className="w-full pl-9 pr-3 py-2 bg-surface-card border border-hairline-dark rounded-md text-sm text-body-text placeholder:text-muted-foreground focus:border-gold focus:ring-1 focus:ring-gold outline-none transition-colors"
                placeholder="Поиск по названию или артикулу (SKU)..."
                value={searchInput}
                onChange={(e) => setSearchInput(e.target.value)}
              />
            </div>
            <button
              type="submit"
              className="px-4 py-2 bg-surface-card text-body-text border border-hairline-dark rounded-md text-sm font-medium hover:bg-surface-elevated transition-colors cursor-pointer"
            >
              Найти
            </button>
          </form>

          <div className="flex items-center gap-2">
            <label className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
              Категория
            </label>
            <select
              className="px-3 py-2 pr-8 bg-surface-card border border-hairline-dark rounded-md text-sm text-body-text cursor-pointer appearance-none bg-[url('data:image/svg+xml,%3Csvg xmlns=%27http://www.w3.org/2000/svg%27 width=%2712%27 height=%2712%27 viewBox=%270 0 24 24%27 fill=%27none%27 stroke=%27%23707a8a%27 stroke-width=%272%27%3E%3Cpolyline points=%276 9 12 15 18 9%27/%3E%3C/svg%3E')] bg-no-repeat bg-[right_8px_center] focus:border-gold focus:ring-1 focus:ring-gold outline-none transition-colors"
              value={categoryFilter}
              onChange={(e) => {
                setCategoryFilter(e.target.value as ProductCategory | '');
                setPage(1);
              }}
            >
              <option value="">Все категории</option>
              {CATEGORY_ORDER.map((cat) => (
                <option key={cat} value={cat}>
                  {CATEGORY_LABELS[cat]}
                </option>
              ))}
            </select>
          </div>
          <div className="flex items-center gap-2">
            <label className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
              Статус
            </label>
            <select
              className="px-3 py-2 pr-8 bg-surface-card border border-hairline-dark rounded-md text-sm text-body-text cursor-pointer appearance-none bg-[url('data:image/svg+xml,%3Csvg xmlns=%27http://www.w3.org/2000/svg%27 width=%2712%27 height=%2712%27 viewBox=%270 0 24 24%27 fill=%27none%27 stroke=%27%23707a8a%27 stroke-width=%272%27%3E%3Cpolyline points=%276 9 12 15 18 9%27/%3E%3C/svg%3E')] bg-no-repeat bg-[right_8px_center] focus:border-gold focus:ring-1 focus:ring-gold outline-none transition-colors"
              value={activeFilter}
              onChange={(e) => {
                setActiveFilter(e.target.value as 'all' | 'active' | 'inactive');
                setPage(1);
              }}
            >
              <option value="all">Все</option>
              <option value="active">Активные</option>
              <option value="inactive">Неактивные</option>
            </select>
          </div>
          <ViewToggle viewMode={viewMode} onChange={setViewMode} />
        </div>

        {/* Loading State */}
        {isLoading && (
          <div className="bg-surface-card rounded-xl p-6">
            <div className="flex flex-col items-center justify-center py-12 text-muted-foreground">
              <Loader2 className="w-8 h-8 animate-spin text-gold mb-4" />
              <p>Загрузка товаров...</p>
            </div>
          </div>
        )}

        {/* Error State */}
        {isError && !isLoading && (
          <div className="bg-surface-card rounded-xl p-6">
            <div className="flex flex-col items-center justify-center py-12">
              <p className="text-sm text-price-rise mb-4">
                {error instanceof Error ? error.message : 'Не удалось загрузить товары. Попробуйте позже.'}
              </p>
              <button
                onClick={() => refetch()}
                className="bg-surface-card text-body-text border border-hairline-dark rounded-md px-4 py-2 text-sm font-semibold hover:bg-surface-elevated transition-colors cursor-pointer"
              >
                Попробовать снова
              </button>
            </div>
          </div>
        )}

        {/* Content (Table or Grid) + Pagination */}
        {!isLoading && !isError && (
          <>
            {viewMode === 'grid' ? (
              <ProductCardGrid
                products={products}
                onEdit={openEditDrawer}
                onDelete={handleDelete}
              />
            ) : (
              <div className="bg-surface-card rounded-xl overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full border-collapse">
                    <thead>
                      <tr>
                        <th className="text-left py-3 px-4 text-xs font-medium text-muted-foreground uppercase tracking-wider bg-surface-elevated border-b border-hairline-dark">
                          Название
                        </th>
                        <th className="text-left py-3 px-4 text-xs font-medium text-muted-foreground uppercase tracking-wider bg-surface-elevated border-b border-hairline-dark">
                          Артикул
                        </th>
                        <th className="text-left py-3 px-4 text-xs font-medium text-muted-foreground uppercase tracking-wider bg-surface-elevated border-b border-hairline-dark">
                          Категория
                        </th>
                        <th className="text-left py-3 px-4 text-xs font-medium text-muted-foreground uppercase tracking-wider bg-surface-elevated border-b border-hairline-dark">
                          Цена
                        </th>
                        <th className="text-left py-3 px-4 text-xs font-medium text-muted-foreground uppercase tracking-wider bg-surface-elevated border-b border-hairline-dark">
                          Остаток
                        </th>
                        <th className="text-left py-3 px-4 text-xs font-medium text-muted-foreground uppercase tracking-wider bg-surface-elevated border-b border-hairline-dark">
                          Статус
                        </th>
                        <th className="text-right py-3 px-4 text-xs font-medium text-muted-foreground uppercase tracking-wider bg-surface-elevated border-b border-hairline-dark">
                          Действия
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {products.length === 0 ? (
                        <tr>
                          <td colSpan={7} className="py-12">
                            <div className="flex flex-col items-center justify-center text-muted-foreground">
                              <Package className="w-12 h-12 mb-4" />
                              <p>Товары не найдены</p>
                            </div>
                          </td>
                        </tr>
                      ) : (
                        products.map((product, index) => (
                          <tr
                            key={product.id}
                            className={`border-b border-hairline-dark transition-colors hover:bg-surface-elevated/50 ${
                              !product.isActive ? 'opacity-60' : ''
                            } ${index % 2 === 0 ? 'bg-surface-card' : 'bg-surface-card/50'}`}
                          >
                            {/* Name + Image */}
                            <td className="py-3 px-4 text-sm text-body-text">
                              <div className="flex items-center gap-3 max-w-[280px]">
                                {hasValidProductImage(product.mainImage?.url) && product.mainImage ? (
                                  <img
                                    src={product.mainImage.url}
                                    alt={product.name}
                                    className="w-10 h-10 rounded-md object-cover flex-shrink-0"
                                  />
                                ) : (
                                  <div className="w-10 h-10 rounded-md bg-surface-elevated flex items-center justify-center flex-shrink-0">
                                    <Package className="w-5 h-5 text-muted-foreground" />
                                  </div>
                                )}
                                <span className="truncate font-medium">{product.name}</span>
                              </div>
                            </td>

                            {/* SKU */}
                            <td className="py-3 px-4 text-sm font-mono text-muted-foreground">
                              {product.sku}
                            </td>

                            {/* Category */}
                            <td className="py-3 px-4 text-sm">
                              <span className="inline-block px-2.5 py-1 bg-surface-elevated border border-hairline-dark rounded-full text-xs font-medium text-muted-foreground">
                                {CATEGORY_LABELS[product.category]}
                              </span>
                            </td>

                            {/* Price */}
                            <td className="py-3 px-4 text-sm text-body-text font-tabular whitespace-nowrap">
                              {formatPrice(product.price)}
                              {product.oldPrice && (
                                <span className="block text-xs text-muted-foreground line-through">
                                  {formatPrice(product.oldPrice)}
                                </span>
                              )}
                            </td>

                            {/* Stock */}
                            <td className="py-3 px-4 text-sm">
                              <span className={`font-tabular ${product.stock === 0 ? 'text-price-rise' : 'text-body-text'}`}>
                                {product.stock} шт.
                              </span>
                            </td>

                            {/* Status */}
                            <td className="py-3 px-4 text-sm">
                              <span
                                className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium ${
                                  product.isActive
                                    ? 'bg-price-drop/15 text-price-drop'
                                    : 'bg-price-rise/15 text-price-rise'
                                }`}
                              >
                                {product.isActive ? 'Активен' : 'Неактивен'}
                              </span>
                            </td>

                            {/* Actions */}
                            <td className="py-3 px-4 text-sm text-right">
                              <div className="flex gap-2 justify-end">
                                <button
                                  onClick={() => openEditDrawer(product)}
                                  className="w-8 h-8 flex items-center justify-center bg-transparent border border-hairline-dark rounded-md text-muted-foreground hover:text-body-text hover:bg-surface-elevated transition-colors cursor-pointer"
                                  title="Редактировать"
                                >
                                  <Edit2 className="w-4 h-4" />
                                </button>
                                <button
                                  onClick={() => handleDelete(product)}
                                  disabled={isDeleting}
                                  className="w-8 h-8 flex items-center justify-center bg-transparent border border-hairline-dark rounded-md text-muted-foreground hover:text-price-rise hover:border-price-rise/30 transition-colors cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                                  title="Удалить"
                                >
                                  {isDeleting ? (
                                    <Loader2 className="w-4 h-4 animate-spin" />
                                  ) : (
                                    <Trash2 className="w-4 h-4" />
                                  )}
                                </button>
                              </div>
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* Pagination — shared for both views */}
            {totalPages > 1 && (
              <div className="bg-surface-card rounded-xl px-4 py-4 flex items-center justify-between border border-hairline-dark">
                <div className="flex items-center gap-4">
                  <div className="flex items-center gap-2">
                    <label className="text-xs text-muted-foreground whitespace-nowrap">
                      Показывать по:
                    </label>
                    <select
                      className="px-2 py-1 bg-surface-card border border-hairline-dark rounded-md text-sm text-body-text cursor-pointer outline-none focus:border-gold focus:ring-1 focus:ring-gold transition-colors"
                      value={pageSize}
                      onChange={(e) => {
                        setPageSize(Number(e.target.value));
                        setPage(1);
                      }}
                    >
                      {PAGE_SIZE_OPTIONS.map((size) => (
                        <option key={size} value={size}>
                          {size}
                        </option>
                      ))}
                    </select>
                  </div>
                  <span className="text-sm text-muted-foreground">
                    Показано {startItem}–{endItem} из {totalItems}
                  </span>
                </div>
                <div className="flex items-center gap-1">
                  <button
                    disabled={page === 1}
                    onClick={() => setPage((p) => Math.max(1, p - 1))}
                    className="w-8 h-8 flex items-center justify-center bg-transparent border border-hairline-dark rounded-md text-muted-foreground hover:text-body-text hover:bg-surface-elevated transition-colors disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
                  >
                    <ChevronLeft className="w-4 h-4" />
                  </button>
                  {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                    let pageNum: number;
                    if (totalPages <= 5) {
                      pageNum = i + 1;
                    } else if (page <= 3) {
                      pageNum = i + 1;
                    } else if (page >= totalPages - 2) {
                      pageNum = totalPages - 4 + i;
                    } else {
                      pageNum = page - 2 + i;
                    }
                    return (
                      <button
                        key={pageNum}
                        onClick={() => setPage(pageNum)}
                        className={`w-8 h-8 flex items-center justify-center rounded-md text-sm font-mono transition-colors cursor-pointer ${
                          page === pageNum
                            ? 'bg-gold text-gold-ink'
                            : 'bg-transparent border border-hairline-dark text-muted-foreground hover:text-body-text hover:bg-surface-elevated'
                        }`}
                      >
                        {pageNum}
                      </button>
                    );
                  })}
                  <button
                    disabled={page === totalPages}
                    onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                    className="w-8 h-8 flex items-center justify-center bg-transparent border border-hairline-dark rounded-md text-muted-foreground hover:text-body-text hover:bg-surface-elevated transition-colors disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
                  >
                    <ChevronRight className="w-4 h-4" />
                  </button>
                </div>
              </div>
            )}
          </>
        )}
      </div>

      {/* Create Modal (только создание) */}
      {isModalOpen && (
        <div
          className="fixed inset-0 z-[1000] flex items-center justify-center bg-black/50"
          onClick={closeModal}
        >
          <div
            className="bg-surface-card rounded-xl border border-hairline-dark shadow-xl p-6 w-full max-w-[520px] mx-4 max-h-[90vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-lg font-semibold text-body-text">
                Добавление товара
              </h2>
              <button
                onClick={closeModal}
                className="w-8 h-8 flex items-center justify-center bg-transparent border border-hairline-dark rounded-md text-muted-foreground hover:text-body-text hover:bg-surface-elevated transition-colors cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Modal Body */}
            <div className="flex flex-col gap-4">
              {/* Name */}
              <div className="flex flex-col gap-1.5">
                <label htmlFor="name" className="text-sm font-medium text-muted-foreground">
                  Название
                </label>
                <input
                  id="name"
                  type="text"
                  className="bg-surface-card border border-hairline-dark rounded-md px-3 py-2 text-sm text-body-text placeholder:text-muted-foreground focus:border-gold focus:ring-1 focus:ring-gold outline-none transition-colors"
                  placeholder="Введите название товара"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                />
              </div>

              {/* Category */}
              <div className="flex flex-col gap-1.5">
                <label htmlFor="category" className="text-sm font-medium text-muted-foreground">
                  Категория
                </label>
                <select
                  id="category"
                  className="bg-surface-card border border-hairline-dark rounded-md px-3 py-2 text-sm text-body-text focus:border-gold focus:ring-1 focus:ring-gold outline-none transition-colors cursor-pointer"
                  value={formData.category}
                  onChange={(e) => setFormData({ ...formData, category: e.target.value as ProductCategory })}
                >
                  <option value="">Выберите категорию</option>
                  {CATEGORY_ORDER.map((cat) => (
                    <option key={cat} value={cat}>
                      {CATEGORY_LABELS[cat]}
                    </option>
                  ))}
                </select>
              </div>

              {/* Price & Stock */}
              <div className="grid grid-cols-2 gap-4">
                <div className="flex flex-col gap-1.5">
                  <label htmlFor="price" className="text-sm font-medium text-muted-foreground">
                    Цена (BYN)
                  </label>
                  <input
                    id="price"
                    type="number"
                    min="0"
                    step="0.01"
                    className="bg-surface-card border border-hairline-dark rounded-md px-3 py-2 text-sm text-body-text placeholder:text-muted-foreground focus:border-gold focus:ring-1 focus:ring-gold outline-none transition-colors"
                    placeholder="0"
                    value={formData.price}
                    onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                  />
                </div>
                <div className="flex flex-col gap-1.5">
                  <label htmlFor="stock" className="text-sm font-medium text-muted-foreground">
                    Остаток
                  </label>
                  <input
                    id="stock"
                    type="number"
                    min="0"
                    step="1"
                    className="bg-surface-card border border-hairline-dark rounded-md px-3 py-2 text-sm text-body-text placeholder:text-muted-foreground focus:border-gold focus:ring-1 focus:ring-gold outline-none transition-colors"
                    placeholder="0"
                    value={formData.stock}
                    onChange={(e) => setFormData({ ...formData, stock: e.target.value })}
                  />
                </div>
              </div>

              {/* Description */}
              <div className="flex flex-col gap-1.5">
                <label htmlFor="description" className="text-sm font-medium text-muted-foreground">
                  Описание
                </label>
                <textarea
                  id="description"
                  rows={3}
                  className="bg-surface-card border border-hairline-dark rounded-md px-3 py-2 text-sm text-body-text placeholder:text-muted-foreground focus:border-gold focus:ring-1 focus:ring-gold outline-none transition-colors resize-none"
                  placeholder="Описание товара (необязательно)"
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                />
              </div>

              {/* isActive toggle */}
              <div className="flex items-center gap-3 pt-1">
                <button
                  type="button"
                  role="switch"
                  aria-checked={formData.isActive}
                  onClick={() => setFormData({ ...formData, isActive: !formData.isActive })}
                  onKeyDown={(e) => {
                    if (e.key === ' ' || e.key === 'Enter') {
                      e.preventDefault();
                      setFormData({ ...formData, isActive: !formData.isActive });
                    }
                  }}
                  className={`relative inline-flex h-5 w-9 shrink-0 cursor-pointer items-center rounded-full border border-hairline-dark transition-colors ${
                    formData.isActive ? 'bg-price-drop' : 'bg-surface-elevated'
                  }`}
                >
                  <span
                    className={`inline-block h-3.5 w-3.5 transform rounded-full bg-white shadow-sm transition-transform ${
                      formData.isActive ? 'translate-x-[18px]' : 'translate-x-[3px]'
                    }`}
                  />
                </button>
                <label
                  onClick={() => setFormData({ ...formData, isActive: !formData.isActive })}
                  className="text-sm text-body-text cursor-pointer select-none"
                >
                  Товар активен
                </label>
              </div>
            </div>

            {/* Modal Footer */}
            <div className="flex justify-end gap-3 mt-6 pt-4 border-t border-hairline-dark">
              <button
                onClick={closeModal}
                disabled={isSaving}
                className="bg-surface-card text-body-text border border-hairline-dark rounded-md px-4 py-2 text-sm font-semibold hover:bg-surface-elevated transition-colors disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
              >
                Отмена
              </button>
              <button
                onClick={handleSave}
                disabled={isSaving || !formData.name || !formData.category}
                className="bg-gold text-gold-ink rounded-md px-4 py-2 text-sm font-semibold hover:bg-gold-active transition-colors disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer inline-flex items-center gap-2"
              >
                {isSaving && <Loader2 className="w-4 h-4 animate-spin" />}
                {isSaving ? 'Создание...' : 'Создать'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ProductEditor Drawer */}
      <ProductEditorDrawer
        productId={editingProductId}
        products={products}
        onClose={closeDrawer}
        onSaved={() => queryClient.invalidateQueries({ queryKey: ['adminProducts'] })}
        onNavigate={(id) => setEditingProductId(id)}
      />
    </div>
  );
}
