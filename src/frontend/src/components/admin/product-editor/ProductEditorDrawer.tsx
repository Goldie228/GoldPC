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

  // --- Адаптивный: гибридный режим ---
  const [isWide, setIsWide] = useState(() => window.innerWidth > 1400);
  const [manuallyExpanded, setManuallyExpanded] = useState(false);

  useEffect(() => {
    const handleResize = () => setIsWide(window.innerWidth > 1400);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // --- Состояние вкладки ---
  const [activeTab, setActiveTab] = useState<TabKey>('basic');

  // --- Состояние формы ---
  const [form, setForm] = useState<ProductEditForm>(EMPTY_FORM);

  // --- Загрузка товара ---
  const {
    data: product,
    isLoading,
    isError,
  } = useQuery({
    queryKey: ['adminProduct', productId],
    queryFn: () => catalogAdminApi.getProductById(productId!),
    enabled: isOpen,
  });

  // Заполнение формы при загрузке товара
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

  // Сброс формы при закрытии дровера
  useEffect(() => {
    if (!isOpen) {
      setForm(EMPTY_FORM);
      setActiveTab('basic');
      setManuallyExpanded(false);
    }
  }, [isOpen]);

  // --- Валидация (цена и количество) ---
  const priceError = useMemo(() => {
    if (form.price < 0) return 'Цена не может быть отрицательной';
    if (form.price > 999_999_999.99) return 'Цена слишком большая';
    if (!Number.isFinite(form.price)) return 'Цена должна быть числом';
    return null;
  }, [form.price]);
  const oldPriceError = useMemo(() => {
    if (form.oldPrice == null) return null;
    if (form.oldPrice < 0) return 'Старая цена не может быть отрицательной';
    if (!Number.isFinite(form.oldPrice)) return 'Старая цена должна быть числом';
    return null;
  }, [form.oldPrice]);
  const stockError = useMemo(() => {
    if (form.stock < 0) return 'Количество не может быть отрицательным';
    if (!Number.isInteger(form.stock)) return 'Количество должно быть целым';
    if (form.stock > 1_000_000) return 'Количество слишком большое';
    return null;
  }, [form.stock]);
  const hasValidationErrors = priceError !== null || oldPriceError !== null || stockError !== null;

  // --- Определение наличия изменений ---
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

  // --- Мутация сохранения ---
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
    if (hasValidationErrors) {
      showToast(priceError ?? oldPriceError ?? stockError ?? 'Проверьте корректность полей', 'error');
      return;
    }
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
  }, [productId, product, form, saveMutation, hasValidationErrors, priceError, oldPriceError, stockError, showToast]);

  // --- Обработчик изменения формы ---
  const handleFormChange = useCallback(
    (field: string, value: string | number | boolean | null) => {
      setForm((prev) => ({ ...prev, [field]: value }));
    },
    [],
  );

  // --- Обработчик изменения изображений ---
  const handleImagesChange = useCallback((images: ProductImage[]) => {
    setForm((prev) => ({ ...prev, images }));
  }, []);

  // --- Навигация ---
  const handleNavigateTo = useCallback(
    (newProductId: string) => {
      // Автосохранение перед навигацией
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

  // --- Обработчик закрытия с подтверждением ---
  const handleClose = useCallback(() => {
    if (hasChanges) {
      const confirmed = window.confirm(
        'Есть несохранённые изменения. Закрыть?',
      );
      if (!confirmed) return;
    }
    onClose();
  }, [hasChanges, onClose]);

  // --- Горячие клавиши ---
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!isOpen || !productId) return;

      // Escape → закрыть
      if (e.key === 'Escape') {
        handleClose();
        return;
      }

      // Ctrl+S / ⌘S → сохранить
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 's') {
        e.preventDefault();
        handleSave();
        return;
      }

      // ← / → → навигация между товарами
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

  // --- Вычисление эффективной ширины дровера ---
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

      {/* Панель дровера */}
      <div
        className={`fixed top-0 right-0 z-[1001] h-full bg-surface-card shadow-xl overflow-y-auto transition-transform duration-300 ${
          isOpen ? 'translate-x-0' : 'translate-x-full'
        } ${
          isFullWidth ? 'w-full' : 'w-[55vw] max-w-[55vw]'
        }`}
      >
        {/* Закреплённый заголовок */}
        <div className="sticky top-0 z-10 bg-surface-card border-b border-hairline-dark">
          <div className="flex items-center justify-between px-6 py-4">
            {/* Слева: стрелки навигации + заголовок */}
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

            {/* Справа: действия */}
            <div className="flex items-center gap-2">
              {/* Переключатель развёртывания */}
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

              {/* Кнопка сохранения */}
              <button
                type="button"
                onClick={handleSave}
                disabled={isSaving || isLoading || !hasChanges || hasValidationErrors}
                className="inline-flex items-center gap-2 bg-gold text-black hover:bg-gold-active rounded-md px-3 py-2 text-sm font-semibold transition-colors disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
                title={hasValidationErrors ? (priceError ?? oldPriceError ?? stockError ?? 'Проверьте корректность полей') : 'Сохранить (⌘S)'}
              >
                {isSaving ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <Save className="w-4 h-4" />
                )}
                <span className="hidden sm:inline">Сохранить</span>
              </button>

              {/* Закрыть */}
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

        {/* Состояние загрузки */}
        {isLoading && (
          <div className="flex flex-col items-center justify-center py-20 text-muted-foreground">
            <Loader2 className="w-8 h-8 animate-spin text-gold mb-4" />
            <p className="text-sm">Загрузка товара...</p>
          </div>
        )}

        {/* Состояние ошибки */}
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

        {/* Баннер ошибок валидации */}
        {hasValidationErrors && !isLoading && !isError && product && (
          <div className="mx-6 mt-4 p-3 bg-price-rise/10 border border-price-rise/30 rounded-md">
            <p className="text-sm font-medium text-price-rise mb-1">Исправьте ошибки:</p>
            <ul className="text-xs text-price-rise space-y-0.5 list-disc list-inside">
              {priceError && <li>Цена: {priceError}</li>}
              {oldPriceError && <li>Старая цена: {oldPriceError}</li>}
              {stockError && <li>Количество: {stockError}</li>}
            </ul>
          </div>
        )}

        {/* Содержимое вкладки */}
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
