/**
 * ImageUpload — компонент для загрузки и управления изображениями товаров в админ-панели
 *
 * Возможности:
 * - Drag-and-drop зона загрузки
 * - Превью изображений в grid с сортировкой
 * - Drag-and-drop перетаскивание для изменения порядка
 * - Переключение главного изображения (звёздочка)
 * - Удаление с optimistic update и toast
 * - Прогресс-бар загрузки
 * - Плейсхолдер при пустом состоянии
 * - Валидация типов, размеров и количества файлов
 */

import { useState, useRef, useCallback, type ChangeEvent, type DragEvent } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Upload, Star, X, ImageIcon } from 'lucide-react';
import { useToast } from '@/hooks/useToast';
import { imagesAdminApi } from '@/api/admin';
import { getProductImageUrl } from '@/utils/image';
import type { ProductImage } from '@/api/types';

interface ImageUploadProps {
  productId: string;
  images: ProductImage[];
  onImagesChange: (images: ProductImage[]) => void;
  maxFiles?: number;
  maxFileSize?: number;
  accept?: string;
}

interface UploadingFile {
  id: string;
  name: string;
  progress: number;
}

const DEFAULT_MAX_FILES = 10;
const DEFAULT_MAX_FILE_SIZE = 5 * 1024 * 1024; // 5 МБ
const DEFAULT_ACCEPT = 'image/jpeg,image/png,image/webp';
const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/webp'];

export function ImageUpload({
  productId,
  images,
  onImagesChange,
  maxFiles = DEFAULT_MAX_FILES,
  maxFileSize = DEFAULT_MAX_FILE_SIZE,
  accept = DEFAULT_ACCEPT,
}: ImageUploadProps) {
  const [uploadingFiles, setUploadingFiles] = useState<UploadingFile[]>([]);
  const [isDragOver, setIsDragOver] = useState(false);
  const [draggedIdx, setDraggedIdx] = useState<number | null>(null);
  const [dragOverIdx, setDragOverIdx] = useState<number | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { showToast } = useToast();

  // Сортируем изображения по order
  const sortedImages = [...images].sort((a, b) => (a.order ?? 0) - (b.order ?? 0));

  // --- Валидация ---
  const validateFile = useCallback(
    (file: File): string | null => {
      if (!ALLOWED_TYPES.includes(file.type)) {
        return 'Недопустимый формат файла. Разрешены: JPEG, PNG, WebP';
      }
      if (file.size > maxFileSize) {
        const sizeMB = Math.round(maxFileSize / 1024 / 1024);
        return `Файл "${file.name}" слишком большой. Максимальный размер: ${sizeMB} МБ`;
      }
      if (images.length + uploadingFiles.length >= maxFiles) {
        return `Достигнут лимит изображений (максимум ${maxFiles})`;
      }
      return null;
    },
    [maxFileSize, maxFiles, images.length, uploadingFiles.length]
  );

  // --- Обработка файлов ---
  const handleFiles = useCallback(
    async (files: File[]) => {
      const validFiles: File[] = [];

      for (const file of files) {
        const error = validateFile(file);
        if (error) {
          showToast(error, 'error');
        } else {
          validFiles.push(file);
        }
      }

      if (validFiles.length === 0) return;

      const uploadIds = validFiles.map(() => crypto.randomUUID());

      // Показываем прогресс-бары для каждого файла
      setUploadingFiles((prev) => [
        ...prev,
        ...validFiles.map((file, i) => ({
          id: uploadIds[i],
          name: file.name,
          progress: 0,
        })),
      ]);

      const uploadedImages: ProductImage[] = [];

      for (let i = 0; i < validFiles.length; i++) {
        const file = validFiles[i];
        const uploadId = uploadIds[i];

        try {
          const newImage = await imagesAdminApi.upload(productId, file, (progress: number) => {
            setUploadingFiles((prev) =>
              prev.map((f) => (f.id === uploadId ? { ...f, progress } : f))
            );
          });
          uploadedImages.push(newImage);
        } catch {
          showToast(`Ошибка при загрузке "${file.name}"`, 'error');
        }

        // Убираем прогресс-бар для этого файла
        setUploadingFiles((prev) => prev.filter((f) => f.id !== uploadId));
      }

      if (uploadedImages.length > 0) {
        onImagesChange([...images, ...uploadedImages]);
      }
    },
    [productId, images, validateFile, onImagesChange, showToast]
  );

  // --- Drag & Drop зона ---
  const handleDragOver = useCallback((e: DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(true);
  }, []);

  const handleDragEnter = useCallback((e: DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(true);
  }, []);

  const handleDragLeave = useCallback((e: DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(false);
  }, []);

  const handleDrop = useCallback(
    (e: DragEvent) => {
      e.preventDefault();
      e.stopPropagation();
      setIsDragOver(false);

      const droppedFiles = Array.from(e.dataTransfer.files);
      if (droppedFiles.length > 0) {
        handleFiles(droppedFiles);
      }
    },
    [handleFiles]
  );

  // --- Выбор файлов через input ---
  const handleFileInputChange = useCallback(
    (e: ChangeEvent<HTMLInputElement>) => {
      if (e.target.files && e.target.files.length > 0) {
        handleFiles(Array.from(e.target.files));
        // Сбрасываем value, чтобы можно было выбрать тот же файл повторно
        e.target.value = '';
      }
    },
    [handleFiles]
  );

  // --- Удаление изображения ---
  const handleDelete = useCallback(
    async (imageId: string, e: React.MouseEvent) => {
      e.stopPropagation();
      const image = images.find((img) => img.id === imageId);
      if (!image) return;

      // Сохраняем состояние для отката
      const previousImages = [...images];

      // Optimistic update: убираем из списка
      onImagesChange(previousImages.filter((img) => img.id !== imageId));

      try {
        await imagesAdminApi.delete(productId, imageId);
      } catch {
        // Откат при ошибке
        onImagesChange(previousImages);
        showToast('Не удалось удалить изображение', 'error');
      }
    },
    [productId, images, onImagesChange, showToast]
  );

  // --- Установка главного изображения ---
  const handleSetPrimary = useCallback(
    async (imageId: string) => {
      // Если уже главное — ничего не делаем
      if (images.find((img) => img.id === imageId)?.isMain) return;

      const previousImages = [...images];

      // Optimistic update: ставим isMain только на выбранном
      onImagesChange(
        images.map((img) => ({ ...img, isMain: img.id === imageId }))
      );

      try {
        await imagesAdminApi.setPrimary(productId, imageId);
      } catch {
        // Откат
        onImagesChange(previousImages);
        showToast('Не удалось изменить главное изображение', 'error');
      }
    },
    [productId, images, onImagesChange, showToast]
  );

  // --- Drag & Drop перетаскивание (reorder) ---
  const handleDragStart = useCallback((idx: number) => {
    setDraggedIdx(idx);
  }, []);

  const handleDragOverItem = useCallback((e: DragEvent, idx: number) => {
    e.preventDefault();
    setDragOverIdx(idx);
  }, []);

  const handleDropItem = useCallback(() => {
    if (draggedIdx === null || dragOverIdx === null || draggedIdx === dragOverIdx) {
      setDraggedIdx(null);
      setDragOverIdx(null);
      return;
    }

    // Переставляем элементы
    const newImages = [...sortedImages];
    const [moved] = newImages.splice(draggedIdx, 1);
    newImages.splice(dragOverIdx, 0, moved);

    // Обновляем order
    const reordered = newImages.map((img, i) => ({
      ...img,
      order: i,
    }));

    onImagesChange(reordered);
    setDraggedIdx(null);
    setDragOverIdx(null);

    // Асинхронно сохраняем порядок на сервере
    imagesAdminApi
      .reorder(
        productId,
        reordered.map((img) => img.id)
      )
      .catch(() => showToast('Не удалось изменить порядок изображений', 'error'));
  }, [draggedIdx, dragOverIdx, sortedImages, onImagesChange, productId, showToast]);

  const hasImages = images.length > 0;
  const hasUploads = uploadingFiles.length > 0;

  return (
    <div className="space-y-4">
      {/* ======== Зона перетаскивания ======== */}
      <div
        onDragOver={handleDragOver}
        onDragEnter={handleDragEnter}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        onClick={() => fileInputRef.current?.click()}
        onKeyDown={(e) => {
          if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            fileInputRef.current?.click();
          }
        }}
        role="button"
        tabIndex={0}
        aria-label="Перетащите или нажмите для загрузки изображений"
        className={`
          relative flex flex-col items-center justify-center py-10 px-6
          border-2 border-dashed rounded-lg
          cursor-pointer transition-all duration-200
          ${
            isDragOver
              ? 'border-gold bg-gold/5'
              : 'border-hairline-dark hover:border-hairline-dark hover:bg-surface-card/50'
          }
        `.trim()}
      >
        <input
          ref={fileInputRef}
          type="file"
          accept={accept}
          multiple
          className="hidden"
          onChange={handleFileInputChange}
          aria-hidden="true"
        />

        <div className="w-14 h-14 rounded-full bg-surface-card flex items-center justify-center mb-3">
          <Upload size={26} className="text-muted-foreground" />
        </div>
        <p className="text-sm text-body-text font-medium">
          Перетащите или нажмите для загрузки
        </p>
        <p className="text-xs text-muted-foreground mt-1.5">
          JPEG, PNG, WebP &bull; до {maxFiles} шт &bull; макс. {Math.round(maxFileSize / 1024 / 1024)} МБ
        </p>
      </div>

      {/* ======== Прогресс-бары загрузки ======== */}
      <AnimatePresence>
        {uploadingFiles.map((file) => (
          <motion.div
            key={file.id}
            initial={{ opacity: 0, y: -8, height: 0 }}
            animate={{ opacity: 1, y: 0, height: 'auto' }}
            exit={{ opacity: 0, y: -8, height: 0 }}
            transition={{ duration: 0.2 }}
            className="flex items-center gap-3 p-3 rounded-md bg-surface-card overflow-hidden"
          >
            <div className="flex-1 min-w-0">
              <p className="text-sm text-body-text truncate">{file.name}</p>
              <div className="mt-1.5 h-1 rounded-full bg-hairline-dark overflow-hidden">
                <motion.div
                  className="h-full rounded-full bg-gold"
                  initial={{ width: 0 }}
                  animate={{ width: `${file.progress}%` }}
                  transition={{ duration: 0.3 }}
                />
              </div>
            </div>
            <span className="text-xs text-muted-foreground tabular-nums flex-shrink-0">
              {file.progress}%
            </span>
          </motion.div>
        ))}
      </AnimatePresence>

      {/* ======== Grid изображений или плейсхолдер ======== */}
      {hasImages || hasUploads ? (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          <AnimatePresence mode="popLayout">
            {sortedImages.map((image, idx) => (
              <motion.div
                key={image.id}
                layout
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{
                  opacity: draggedIdx === idx ? 0.4 : 1,
                  scale: draggedIdx === idx ? 0.95 : 1,
                }}
                exit={{ opacity: 0, scale: 0.9 }}
                transition={{ duration: 0.2, ease: 'easeOut' }}
                draggable
                onDragStart={() => handleDragStart(idx)}
                onDragOver={(e) => handleDragOverItem(e, idx)}
                onDragEnd={handleDropItem}
                className={`
                  relative group aspect-[4/3] rounded-md overflow-hidden
                  bg-surface-card cursor-grab active:cursor-grabbing
                  ring-1 ring-hairline-dark hover:ring-gold
                  transition-all duration-200
                  ${
                    image.isMain
                      ? 'ring-2 ring-gold shadow-[0_0_12px_rgba(252,213,53,0.25)]'
                      : ''
                  }
                  ${
                    dragOverIdx === idx && draggedIdx !== idx
                      ? 'ring-2 ring-gold'
                      : ''
                  }
                `.trim()}
              >
                <img
                  src={getProductImageUrl(image.url) ?? image.url}
                  alt={image.alt ?? ''}
                  className="w-full h-full object-cover pointer-events-none select-none"
                  draggable={false}
                />

                {/* Бадж "Главное" */}
                {image.isMain && (
                  <div className="absolute top-2 left-2 flex items-center gap-1 bg-gold text-gold-ink text-xs font-medium px-2 py-0.5 rounded-sm z-10">
                    <Star size={12} fill="currentColor" />
                    <span>Главное</span>
                  </div>
                )}

                {/* Кнопка удаления (всегда видна при наведении) */}
                <button
                  type="button"
                  onClick={(e) => handleDelete(image.id, e)}
                  className="
                    absolute top-2 right-2 z-10
                    w-7 h-7 flex items-center justify-center
                    bg-price-rise text-white
                    rounded-full opacity-0 group-hover:opacity-100
                    transition-opacity duration-150
                    hover:brightness-110
                  "
                  title="Удалить изображение"
                  aria-label="Удалить изображение"
                >
                  <X size={14} />
                </button>

                {/* Оверлей при наведении — кнопка "Сделать главным" */}
                {!image.isMain && (
                  <div className="absolute inset-0 bg-black/30 opacity-0 group-hover:opacity-100 transition-opacity duration-150 flex items-center justify-center">
                    <button
                      type="button"
                      onClick={() => handleSetPrimary(image.id)}
                      className="
                        flex items-center gap-1.5 px-3 py-1.5
                        bg-surface-card text-body-text
                        text-xs font-medium rounded-sm
                        hover:bg-gold hover:text-gold-ink
                        transition-colors duration-150
                      "
                      title="Сделать главным"
                      aria-label="Сделать главным изображением"
                    >
                      <Star size={14} />
                      <span>Сделать главным</span>
                    </button>
                  </div>
                )}
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
      ) : (
        /* Плейсхолдер пустого состояния */
        <div className="aspect-[4/3] border-2 border-dashed border-hairline-dark rounded-md flex flex-col items-center justify-center bg-surface-card/30">
          <ImageIcon size={48} className="text-muted-foreground opacity-30" />
          <p className="text-sm text-muted-foreground mt-3 font-medium">
            Изображения не добавлены
          </p>
          <p className="text-xs text-muted-foreground mt-1 opacity-60">
            Используйте зону загрузки выше
          </p>
        </div>
      )}
    </div>
  );
}
