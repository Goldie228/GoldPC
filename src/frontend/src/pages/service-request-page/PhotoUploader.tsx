import { useState, useRef, useCallback, useEffect, type DragEvent } from 'react';

/**
 * Интерфейс пропсов PhotoUploader
 */
interface PhotoUploaderProps {
  files: File[];
  onFilesChange: (files: File[]) => void;
}

/**
 * Допустимые MIME-типы изображений
 */
const ACCEPTED_TYPES = ['image/png', 'image/jpeg', 'image/jpg', 'image/webp', 'image/gif', 'image/bmp'];

/**
 * Максимальный размер файла — 10MB
 */
const MAX_FILE_SIZE = 10 * 1024 * 1024;

/**
 * PhotoUploader — компонент для загрузки фотографий с drag & drop
 *
 * @param files — текущий список файлов
 * @param onFilesChange — колбэк при изменении списка файлов
 */
export function PhotoUploader({ files, onFilesChange }: PhotoUploaderProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [isDragging, setIsDragging] = useState(false);
  const dragCounter = useRef(0);
  const [previewUrls, setPreviewUrls] = useState<string[]>([]);

  /**
   * Генерация превью при изменении списка файлов
   */
  useEffect(() => {
    // Очищаем старые URL
    previewUrls.forEach((url) => URL.revokeObjectURL(url));

    // Создаём новые
    const urls = files.map((file) => URL.createObjectURL(file));
    setPreviewUrls(urls);

    return () => {
      urls.forEach((url) => URL.revokeObjectURL(url));
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [files]);

  /**
   * Валидация и добавление файлов
   */
  const addFiles = useCallback(
    (incoming: FileList | File[]) => {
      const newFiles: File[] = [];
      const invalid: string[] = [];

      Array.from(incoming).forEach((file) => {
        if (!ACCEPTED_TYPES.includes(file.type)) {
          invalid.push(`${file.name} — неподдерживаемый формат`);
          return;
        }
        if (file.size > MAX_FILE_SIZE) {
          invalid.push(`${file.name} — превышает 10MB`);
          return;
        }
        // Избегаем дубликатов по имени + размеру
        const isDuplicate = files.some(
          (existing) => existing.name === file.name && existing.size === file.size,
        );
        if (!isDuplicate) {
          newFiles.push(file);
        }
      });

      if (newFiles.length > 0) {
        onFilesChange([...files, ...newFiles]);
      }

      if (invalid.length > 0) {
        // Показываем предупреждение в консоль (не нарушает UX)
        console.warn('PhotoUploader: некоторые файлы не были добавлены:\n', invalid.join('\n'));
      }
    },
    [files, onFilesChange],
  );

  /**
   * Обработчики drag & drop
   */
  const handleDragEnter = useCallback((e: DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    dragCounter.current += 1;
    if (e.dataTransfer.items && e.dataTransfer.items.length > 0) {
      setIsDragging(true);
    }
  }, []);

  const handleDragLeave = useCallback((e: DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    dragCounter.current -= 1;
    if (dragCounter.current === 0) {
      setIsDragging(false);
    }
  }, []);

  const handleDragOver = useCallback((e: DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
  }, []);

  const handleDrop = useCallback(
    (e: DragEvent) => {
      e.preventDefault();
      e.stopPropagation();
      setIsDragging(false);
      dragCounter.current = 0;

      if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
        addFiles(e.dataTransfer.files);
        e.dataTransfer.clearData();
      }
    },
    [addFiles],
  );

  /**
   * Клик по зоне загрузки — открыть файловый диалог
   */
  const handleClick = useCallback(() => {
    inputRef.current?.click();
  }, []);

  /**
   * Изменение скрытого input[type=file]
   */
  const handleInputChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      if (e.target.files && e.target.files.length > 0) {
        addFiles(e.target.files);
        // Сбрасываем value, чтобы можно было выбрать тот же файл повторно
        e.target.value = '';
      }
    },
    [addFiles],
  );

  /**
   * Удаление файла по индексу
   */
  const handleRemove = useCallback(
    (index: number) => {
      const updated = files.filter((_, i) => i !== index);
      onFilesChange(updated);
    },
    [files, onFilesChange],
  );

  return (
    <div>
      {/* Скрытый input для выбора файлов */}
      <input
        ref={inputRef}
        type="file"
        multiple
        accept="image/*"
        onChange={handleInputChange}
        className="hidden"
        tabIndex={-1}
      />

      {/* Drop zone */}
      <div
        role="button"
        tabIndex={0}
        onDragEnter={handleDragEnter}
        onDragLeave={handleDragLeave}
        onDragOver={handleDragOver}
        onDrop={handleDrop}
        onClick={handleClick}
        onKeyDown={(e) => {
          if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            handleClick();
          }
        }}
        className={`
          relative flex flex-col items-center justify-center gap-3 p-8 border-2 border-dashed rounded-lg
          transition-all cursor-pointer min-h-[160px]
          ${
            isDragging
              ? 'border-gold bg-gold/5'
              : 'border-border bg-surface-card hover:border-muted-text'
          }
        `}
      >
        {/* Иконка загрузки */}
        <svg
          className={`w-10 h-10 transition-colors ${isDragging ? 'text-gold' : 'text-muted-text'}`}
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
        >
          <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
          <polyline points="17 8 12 3 7 8" />
          <line x1="12" y1="3" x2="12" y2="15" />
        </svg>

        {/* Основной текст */}
        <span className="text-foreground text-sm text-center">
          Перетащите файлы сюда или кликните для выбора
        </span>

        {/* Подсказка */}
        <span className="text-muted-text text-xs text-center">
          PNG, JPG до 10MB. Можно несколько файлов
        </span>
      </div>

      {/* Счётчик загруженных файлов */}
      {files.length > 0 && (
        <p className="text-muted-text text-xs mt-3">
          Выбрано: {files.length} файл{files.length === 1 ? '' : 'ов'}
        </p>
      )}

      {/* Сетка превью */}
      {previewUrls.length > 0 && (
        <div className="flex flex-wrap gap-3 mt-4">
          {previewUrls.map((url, index) => (
            <div key={url} className="relative w-20 h-20 rounded-lg overflow-hidden border border-border group">
              {/* Изображение */}
              <img
                src={url}
                alt={`Превью ${index + 1}`}
                className="w-full h-full object-cover"
              />

              {/* Кнопка удаления */}
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  handleRemove(index);
                }}
                className="absolute -top-2 -right-2 w-5 h-5 bg-price-rise rounded-full flex items-center justify-center text-white text-xs opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer hover:bg-[#e53e50]"
                aria-label={`Удалить файл ${index + 1}`}
              >
                <svg viewBox="0 0 12 12" fill="none" stroke="currentColor" strokeWidth="2" className="w-3 h-3">
                  <line x1="2" y1="2" x2="10" y2="10" />
                  <line x1="10" y1="2" x2="2" y2="10" />
                </svg>
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default PhotoUploader;
