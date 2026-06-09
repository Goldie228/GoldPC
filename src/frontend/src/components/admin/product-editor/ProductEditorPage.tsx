/**
 * ProductEditorPage — полноэкранная страница редактора товара
 * Используется как отдельный route: /admin/products/:id/edit
 * Использует те же tab-компоненты, но без drawer overlay
 */

import { useState, useEffect, useMemo, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { ArrowLeft, Loader2, Save } from 'lucide-react';
import { catalogAdminApi, type UpdateProductRequest } from '@/api/admin';
import { useToast } from '@/hooks/useToast';
import type { ProductImage } from '@/api/types';
import { ProductEditorTabs, type TabKey } from './ProductEditorTabs';
import type { ProductEditForm } from './types';

export function ProductEditorPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { showToast } = useToast();

  const productId = id ?? null;

  // --- Tab state ---
  const [activeTab, setActiveTab] = useState<TabKey>('basic');

  // --- Form state ---
  const [form, setForm] = useState<ProductEditForm>({
    name: '',
    category: '',
    price: 0,
    oldPrice: null,
    stock: 0,
    description: '',
    isActive: true,
    images: [],
    specifications: {},
  });

  // --- Fetch product ---
  const {
    data: product,
    isLoading,
    isError,
  } = useQuery({
    queryKey: ['adminProduct', productId],
    queryFn: () => catalogAdminApi.getProductById(productId!),
    enabled: !!productId,
  });

  // Populate form when product loads
  useEffect(() => {
    if (product) {
      setForm({
        name: product.name,
        category: product.category,
        price: product.price,
        oldPrice: product.oldPrice ?? null,
        stock: product.stock,
        description: product.description ?? '',
        isActive: product.isActive,
        images: product.images ?? [],
        specifications: product.specifications
          ? Object.fromEntries(
              Object.entries(product.specifications).map(([k, v]) => [k, String(v ?? '')])
            )
          : {},
      });
    }
  }, [product]);

  // --- hasChanges detection ---
  const hasChanges = useMemo(() => {
    if (!product) return false;
    return (
      form.name !== product.name ||
      form.category !== product.category ||
      form.price !== product.price ||
      form.oldPrice !== (product.oldPrice ?? null) ||
      form.stock !== product.stock ||
      form.description !== (product.description ?? '') ||
      form.isActive !== product.isActive
    );
  }, [form, product]);

  // --- Save mutation ---
  const saveMutation = useMutation({
    mutationFn: ({ id: pid, data }: { id: string; data: UpdateProductRequest }) =>
      catalogAdminApi.updateProduct(pid, data),
    onSuccess: () => {
      showToast('Сохранено', 'success');
      queryClient.invalidateQueries({ queryKey: ['adminProduct', productId] });
    },
    onError: () => {
      showToast('Ошибка при сохранении', 'error');
    },
  });

  const handleSave = useCallback(() => {
    if (!productId || !product) return;
    saveMutation.mutate({
      id: productId,
      data: {
        name: form.name,
        price: form.price,
        oldPrice: form.oldPrice ?? undefined,
        stock: form.stock,
        description: form.description || undefined,
        isActive: form.isActive,
      },
    });
  }, [productId, product, form, saveMutation]);

  // --- Handlers ---
  const handleFormChange = useCallback(
    (field: string, value: string | number | boolean | null) => {
      setForm((prev) => ({ ...prev, [field]: value }));
    },
    [],
  );

  const handleImagesChange = useCallback((images: ProductImage[]) => {
    setForm((prev) => ({ ...prev, images }));
  }, []);

  const handleBack = useCallback(() => {
    if (hasChanges) {
      const confirmed = window.confirm(
        'Есть несохранённые изменения. Вернуться к списку?',
      );
      if (!confirmed) return;
    }
    navigate('/admin/catalog');
  }, [hasChanges, navigate]);

  const isSaving = saveMutation.isPending;

  return (
    <div className="min-h-screen bg-[var(--bg-card)]">
      {/* Header */}
      <div className="sticky top-0 z-10 bg-[var(--bg-card)] border-b border-[var(--border-muted)]">
        <div className="flex items-center justify-between px-6 py-4 max-w-[1400px] mx-auto">
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={handleBack}
              className="inline-flex items-center gap-2 text-muted-foreground hover:text-body-text transition-colors cursor-pointer bg-transparent border-none text-sm"
            >
              <ArrowLeft className="w-4 h-4" />
              Назад к списку
            </button>
            <h1 className="text-lg font-semibold text-body-text truncate max-w-[500px]">
              {isLoading ? 'Загрузка...' : product?.name ?? 'Редактор товара'}
            </h1>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleSave}
              disabled={isSaving || isLoading || !hasChanges}
              className="inline-flex items-center gap-2 bg-gold text-black hover:bg-gold-active rounded-md px-4 py-2 text-sm font-semibold transition-colors disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
            >
              {isSaving ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Save className="w-4 h-4" />
              )}
              {isSaving ? 'Сохранение...' : 'Сохранить'}
            </button>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-[1400px] mx-auto">
        {isLoading && (
          <div className="flex flex-col items-center justify-center py-20 text-muted-foreground">
            <Loader2 className="w-8 h-8 animate-spin text-gold mb-4" />
            <p className="text-sm">Загрузка товара...</p>
          </div>
        )}

        {isError && !isLoading && (
          <div className="flex flex-col items-center justify-center py-20 text-muted-foreground">
            <p className="text-sm text-price-rise mb-2">
              Не удалось загрузить товар
            </p>
            <button
              type="button"
              onClick={() => navigate('/admin/catalog')}
              className="mt-4 bg-gold text-black rounded-md px-4 py-2 text-sm font-semibold hover:bg-gold-active transition-colors cursor-pointer"
            >
              Вернуться к списку
            </button>
          </div>
        )}

        {!isLoading && !isError && product && (
          <ProductEditorTabs
            activeTab={activeTab}
            onTabChange={setActiveTab}
            form={form}
            onChange={handleFormChange}
            productId={productId!}
            onImagesChange={handleImagesChange}
          />
        )}
      </div>
    </div>
  );
}
