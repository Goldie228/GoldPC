/**
 * ProductEditorDrawer — гибридный редактор товара
 * Drawer справа (55% / fullscreen) с табами, навигацией между товарами,
 * автосохранением и подтверждением закрытия при несохранённых изменениях
 */

import { useState, useEffect, useMemo, useCallback } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  X,
  ChevronLeft,
  ChevronRight,
  Maximize2,
  Minimize2,
  Loader2,
  Save,
} from 'lucide-react';
import { catalogAdminApi, type UpdateProductRequest } from '@/api/admin';
import { useToast } from '@/hooks/useToast';
import type { Product, ProductImage } from '@/api/types';
import { ProductEditorTabs, type TabKey, TABS } from './ProductEditorTabs';
import type { ProductEditForm } from './types';

export type { ProductEditForm } from './types';

interface ProductEditorDrawerProps {
  productId: string | null;
  products?: Product[];
  onClose: () => void;
  onSaved: () => void;
  onNavigate?: (productId: string) => void;
}

const EMPTY_FORM: ProductEditForm = {
  name: '',
  category: '',
  price: 0,
  oldPrice: null,
  stock: 0,
  description: '',
  isActive: true,
  images: [],
  specifications: {},
};

export function ProductEditorDrawer({
  productId,
  products,
  onClose,
  onSaved,
  onNavigate,
}: ProductEditorDrawerProps) {
  const queryClient = useQueryClient();
  const { showToast } = useToast();

  const isOpen = productId !== null;

  // --- Responsive: гибридный режим ---
  const [isWide, setIsWide] = useState(() => window.innerWidth > 1400);
  const [manuallyExpanded, setManuallyExpanded] = useState(false);

  useEffect(() => {
    const handleResize = () => setIsWide(window.innerWidth > 1400);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // --- Tab state ---
  const [activeTab, setActiveTab] = useState<TabKey>('basic');

  // --- Form state ---
  const [form, setForm] = useState<ProductEditForm>(EMPTY_FORM);

  // --- Fetch product ---
  const {
    data: product,
    isLoading,
    isError,
  } = useQuery({
    queryKey: ['adminProduct', productId],
    queryFn: () => catalogAdminApi.getProductById(productId!),
    enabled: isOpen,
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
      setActiveTab('basic');
    }
  }, [product]);

  // Reset form when drawer closes
  useEffect(() => {
    if (!isOpen) {
      setForm(EMPTY_FORM);
      setActiveTab('basic');
      setManuallyExpanded(false);
    }
  }, [isOpen]);

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
      form.isActive !== product.isActive ||
      JSON.stringify(form.specifications) !== JSON.stringify(product.specifications)
    );
  }, [form, product]);

  // --- Save mutation ---
  const saveMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: UpdateProductRequest }) =>
      catalogAdminApi.updateProduct(id, data),
    onSuccess: () => {
      showToast('Сохранено', 'success');
      queryClient.invalidateQueries({ queryKey: ['adminProduct', productId] });
      onSaved();
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
        specifications: form.specifications,
      },
    });
  }, [productId, product, form, saveMutation]);

  // --- Form change handler ---
  const handleFormChange = useCallback(
    (field: string, value: string | number | boolean | null) => {
      setForm((prev) => ({ ...prev, [field]: value }));
    },
    [],
  );

  // --- Images change handler ---
  const handleImagesChange = useCallback((images: ProductImage[]) => {
    setForm((prev) => ({ ...prev, images }));
  }, []);

  // --- Navigation ---
  const handleNavigateTo = useCallback(
    (newProductId: string) => {
      // Auto-save before navigating
      if (hasChanges && product) {
        saveMutation.mutate({
          id: product.id,
          data: {
            name: form.name,
            price: form.price,
            oldPrice: form.oldPrice ?? undefined,
            stock: form.stock,
            description: form.description || undefined,
            isActive: form.isActive,
            specifications: form.specifications,
          },
        });
      }
      onNavigate?.(newProductId);
    },
    [hasChanges, product, form, saveMutation, onNavigate],
  );

  const currentIdx = products?.findIndex((p) => p.id === productId) ?? -1;
  const hasPrev = currentIdx > 0;
  const hasNext = products ? currentIdx < products.length - 1 : false;

  // --- Close handler with confirm ---
  const handleClose = useCallback(() => {
    if (hasChanges) {
      const confirmed = window.confirm(
        'Есть несохранённые изменения. Закрыть?',
      );
      if (!confirmed) return;
    }
    onClose();
  }, [hasChanges, onClose]);

  // --- Keyboard shortcuts ---
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!isOpen || !productId) return;

      // Escape → close
      if (e.key === 'Escape') {
        handleClose();
        return;
      }

      // Ctrl+S / ⌘S → save
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 's') {
        e.preventDefault();
        handleSave();
        return;
      }

      // ← / → → navigate between products
      if (products && products.length > 0) {
        if (e.key === 'ArrowLeft' && hasPrev) {
          handleNavigateTo(products[currentIdx - 1].id);
        }
        if (e.key === 'ArrowRight' && hasNext) {
          handleNavigateTo(products[currentIdx + 1].id);
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, productId, products, currentIdx, hasPrev, hasNext, handleClose, handleSave, handleNavigateTo]);

  // --- Compute effective drawer width ---
  const isFullWidth = !isWide || manuallyExpanded;

  const drawerTitle = isLoading
    ? 'Загрузка...'
    : product?.name ?? 'Редактор товара';
  const isSaving = saveMutation.isPending;

  return (
    <>
      {/* Overlay — прозрачный при 55% для видимости списка сзади */}
      {isOpen && (
        <div
          className="fixed inset-0 z-[1000] bg-black/50"
          onClick={handleClose}
        />
      )}

      {/* Drawer panel */}
      <div
        className={`fixed top-0 right-0 z-[1001] h-full bg-[var(--bg-card)] shadow-xl overflow-y-auto transition-transform duration-300 ${
          isOpen ? 'translate-x-0' : 'translate-x-full'
        } ${
          isFullWidth ? 'w-full' : 'w-[55vw] max-w-[55vw]'
        }`}
      >
        {/* Sticky header */}
        <div className="sticky top-0 z-10 bg-[var(--bg-card)] border-b border-[var(--border-muted)]">
          <div className="flex items-center justify-between px-6 py-4">
            {/* Left: nav arrows + title */}
            <div className="flex items-center gap-3 min-w-0">
              {products && products.length > 0 && (
                <div className="flex items-center gap-1 mr-1">
                  <button
                    type="button"
                    onClick={() => handleNavigateTo(products[currentIdx - 1].id)}
                    disabled={!hasPrev}
                    className="w-8 h-8 flex items-center justify-center bg-transparent border border-hairline-dark rounded-md text-muted-foreground hover:text-body-text hover:bg-surface-elevated transition-colors disabled:opacity-30 disabled:cursor-not-allowed cursor-pointer"
                    title="Предыдущий товар (←)"
                  >
                    <ChevronLeft className="w-4 h-4" />
                  </button>
                  <button
                    type="button"
                    onClick={() => handleNavigateTo(products[currentIdx + 1].id)}
                    disabled={!hasNext}
                    className="w-8 h-8 flex items-center justify-center bg-transparent border border-hairline-dark rounded-md text-muted-foreground hover:text-body-text hover:bg-surface-elevated transition-colors disabled:opacity-30 disabled:cursor-not-allowed cursor-pointer"
                    title="Следующий товар (→)"
                  >
                    <ChevronRight className="w-4 h-4" />
                  </button>
                </div>
              )}
              <h2 className="text-lg font-semibold text-body-text truncate">
                {drawerTitle}
              </h2>
            </div>

            {/* Right: actions */}
            <div className="flex items-center gap-2">
              {/* Expand toggle */}
              {isWide && (
                <button
                  type="button"
                  onClick={() => setManuallyExpanded(!manuallyExpanded)}
                  className="w-8 h-8 flex items-center justify-center bg-transparent border border-hairline-dark rounded-md text-muted-foreground hover:text-body-text transition-colors cursor-pointer"
                  title={manuallyExpanded ? 'Свернуть (55%)' : 'На весь экран'}
                >
                  {manuallyExpanded ? (
                    <Minimize2 className="w-4 h-4" />
                  ) : (
                    <Maximize2 className="w-4 h-4" />
                  )}
                </button>
              )}

              {/* Save button */}
              <button
                type="button"
                onClick={handleSave}
                disabled={isSaving || isLoading || !hasChanges}
                className="inline-flex items-center gap-2 bg-gold text-black hover:bg-gold-active rounded-md px-3 py-2 text-sm font-semibold transition-colors disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
                title="Сохранить (⌘S)"
              >
                {isSaving ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <Save className="w-4 h-4" />
                )}
                <span className="hidden sm:inline">Сохранить</span>
              </button>

              {/* Close */}
              <button
                type="button"
                onClick={handleClose}
                className="w-8 h-8 flex items-center justify-center bg-transparent border border-hairline-dark rounded-md text-muted-foreground hover:text-body-text hover:bg-surface-elevated transition-colors cursor-pointer"
                title="Закрыть (Esc)"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>

        {/* Loading state */}
        {isLoading && (
          <div className="flex flex-col items-center justify-center py-20 text-muted-foreground">
            <Loader2 className="w-8 h-8 animate-spin text-gold mb-4" />
            <p className="text-sm">Загрузка товара...</p>
          </div>
        )}

        {/* Error state */}
        {isError && !isLoading && (
          <div className="flex flex-col items-center justify-center py-20 text-muted-foreground">
            <p className="text-sm text-price-rise mb-2">
              Не удалось загрузить товар
            </p>
            <p className="text-xs text-muted-foreground">
              Проверьте ID товара и попробуйте снова
            </p>
          </div>
        )}

        {/* Tab content */}
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
    </>
  );
}
