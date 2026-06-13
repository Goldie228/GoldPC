/**
 * AvatarCropModal — Модальное окно для загрузки и кропа аватара
 *
 * Фичи:
 * - Загрузка файла с валидацией типа и размера
 * - Drag-and-drop перемещение изображения внутри круга
 * - Масштабирование слайдером и кнопками
 * - Поворот на 90° кнопками + свободный поворот слайдером
 * - Круглая кроп-область
 * - Сохранение как Blob для отправки на сервер
 */
import { useState, useRef, useEffect, useCallback } from 'react';
import { X, Upload, ZoomIn, ZoomOut, Check, RotateCcw, RotateCw } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface AvatarCropModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCrop: (file: File) => void;
  isSaving?: boolean;
}

const CANVAS_SIZE = 256;
const MAX_FILE_SIZE = 5 * 1024 * 1024;
const ACCEPTED_TYPES = ['image/jpeg', 'image/png', 'image/webp'];

export function AvatarCropModal({ isOpen, onClose, onCrop, isSaving = false }: AvatarCropModalProps) {
  const [imageSrc, setImageSrc] = useState<string | null>(null);
  const [scale, setScale] = useState(1);
  const [rotation, setRotation] = useState(0); // градусы
  const [offset, setOffset] = useState({ x: 0, y: 0 });
  const [error, setError] = useState<string | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const [offsetAtDragStart, setOffsetAtDragStart] = useState({ x: 0, y: 0 });

  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const imgRef = useRef<HTMLImageElement | null>(null);

  // Сброс при закрытии
  useEffect(() => {
    if (!isOpen) {
      setImageSrc(null);
      setScale(1);
      setRotation(0);
      setOffset({ x: 0, y: 0 });
      setError(null);
      imgRef.current = null;
    }
  }, [isOpen]);

  // ── Отрисовка canvas ──────────────────────────────────────────────
  const drawCanvas = useCallback(() => {
    const canvas = canvasRef.current;
    const img = imgRef.current;
    if (!canvas || !img) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    canvas.width = CANVAS_SIZE;
    canvas.height = CANVAS_SIZE;
    ctx.clearRect(0, 0, CANVAS_SIZE, CANVAS_SIZE);

    // Круглая маска
    ctx.save();
    ctx.beginPath();
    ctx.arc(CANVAS_SIZE / 2, CANVAS_SIZE / 2, CANVAS_SIZE / 2, 0, Math.PI * 2);
    ctx.clip();

    // Поворачиваем canvas на нужный угол
    const cx = CANVAS_SIZE / 2;
    const cy = CANVAS_SIZE / 2;
    ctx.translate(cx, cy);
    ctx.rotate((rotation * Math.PI) / 180);
    ctx.translate(-cx, -cy);

    // Размер отрисовки: берём минимальную сторону * scale
    const minDim = Math.min(img.naturalWidth, img.naturalHeight);
    const drawSize = minDim * scale;

    // Центрируем + drag offset
    const dx = (CANVAS_SIZE - drawSize) / 2 + offset.x;
    const dy = (CANVAS_SIZE - drawSize) / 2 + offset.y;

    // Исходная область из центра изображения
    const srcX = (img.naturalWidth - minDim) / 2;
    const srcY = (img.naturalHeight - minDim) / 2;

    ctx.drawImage(img, srcX, srcY, minDim, minDim, dx, dy, drawSize, drawSize);
    ctx.restore();
  }, [scale, rotation, offset]);

  // Перерисовка
  useEffect(() => {
    drawCanvas();
  }, [drawCanvas]);

  // ── Загрузка изображения ──────────────────────────────────────────
  const loadImage = useCallback((src: string) => {
    const img = new Image();
    img.onload = () => {
      imgRef.current = img;
      setImageSrc(src);
      setScale(1);
      setRotation(0);
      setOffset({ x: 0, y: 0 });
      setError(null);
    };
    img.src = src;
  }, []);

  // ── Выбор файла ───────────────────────────────────────────────────
  const handleFileSelect = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!ACCEPTED_TYPES.includes(file.type)) {
      setError('Допустимы только JPG, PNG, WebP');
      return;
    }
    if (file.size > MAX_FILE_SIZE) {
      setError('Размер файла не должен превышать 5 МБ');
      return;
    }

    const reader = new FileReader();
    reader.onload = () => loadImage(reader.result as string);
    reader.readAsDataURL(file);
    e.target.value = '';
  }, [loadImage]);

  // ── Drag-and-drop ────────────────────────────────────────────────
  const handlePointerDown = useCallback((e: React.PointerEvent) => {
    if (!imgRef.current) return;
    setIsDragging(true);
    setDragStart({ x: e.clientX, y: e.clientY });
    setOffsetAtDragStart({ ...offset });
    (e.target as HTMLElement).setPointerCapture(e.pointerId);
  }, [offset]);

  const handlePointerMove = useCallback((e: React.PointerEvent) => {
    if (!isDragging) return;
    setOffset({
      x: offsetAtDragStart.x + (e.clientX - dragStart.x),
      y: offsetAtDragStart.y + (e.clientY - dragStart.y),
    });
  }, [isDragging, dragStart, offsetAtDragStart]);

  const handlePointerUp = useCallback(() => {
    setIsDragging(false);
  }, []);

  // ── Поворот ───────────────────────────────────────────────────────
  const rotateLeft = useCallback(() => setRotation((r) => r - 90), []);
  const rotateRight = useCallback(() => setRotation((r) => r + 90), []);

  // ── Сохранение ───────────────────────────────────────────────────
  const handleSave = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    canvas.toBlob((blob) => {
      if (!blob) return;
      const file = new File([blob], 'avatar.jpg', { type: 'image/jpeg', lastModified: Date.now() });
      onCrop(file);
    }, 'image/jpeg', 0.92);
  }, [onCrop]);

  // ── Drop zone ─────────────────────────────────────────────────────
  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    const file = e.dataTransfer.files[0];
    if (file && ACCEPTED_TYPES.includes(file.type)) {
      const reader = new FileReader();
      reader.onload = () => loadImage(reader.result as string);
      reader.readAsDataURL(file);
    }
  }, [loadImage]);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
  }, []);

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4"
          onClick={onClose}
        >
          <motion.div
            initial={{ scale: 0.95, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.95, opacity: 0 }}
            className="bg-surface-card rounded-2xl w-full max-w-md overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-hairline-dark">
              <h3 className="text-lg font-semibold text-body-text">Загрузить аватар</h3>
              <button
                onClick={onClose}
                className="p-1 rounded-lg text-muted-text hover:text-body-text hover:bg-surface-elevated transition-colors"
                aria-label="Закрыть"
              >
                <X size={20} />
              </button>
            </div>

            {/* Content */}
            <div className="p-6">
              {!imageSrc ? (
                /* Drop zone */
                <div
                  onDrop={handleDrop}
                  onDragOver={handleDragOver}
                  onClick={() => fileInputRef.current?.click()}
                  className="flex flex-col items-center justify-center gap-4 p-8 border-2 border-dashed border-hairline-dark rounded-xl cursor-pointer hover:border-gold/50 hover:bg-surface-elevated/50 transition-all"
                >
                  <div className="w-16 h-16 rounded-full bg-gold/10 flex items-center justify-center">
                    <Upload size={24} className="text-gold" />
                  </div>
                  <div className="text-center">
                    <p className="text-sm font-medium text-body-text">
                      Перетащите изображение или нажмите для выбора
                    </p>
                    <p className="text-xs text-muted-foreground mt-1">
                      JPG, PNG, WebP до 5 МБ
                    </p>
                  </div>
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/jpeg,image/png,image/webp"
                    className="hidden"
                    onChange={handleFileSelect}
                  />
                </div>
              ) : (
                /* Crop area */
                <div className="flex flex-col items-center gap-4">
                  {/* Canvas с drag */}
                  <div
                    ref={containerRef}
                    className="relative select-none"
                    onPointerDown={handlePointerDown}
                    onPointerMove={handlePointerMove}
                    onPointerUp={handlePointerUp}
                    onPointerLeave={handlePointerUp}
                    style={{ cursor: isDragging ? 'grabbing' : 'grab', touchAction: 'none' }}
                  >
                    <div className="w-48 h-48 rounded-full border-2 border-hairline-dark pointer-events-none" />
                    <canvas
                      ref={canvasRef}
                      className="absolute inset-0 w-48 h-48 rounded-full"
                    />
                    {isSaving && (
                      <div className="absolute inset-0 flex items-center justify-center bg-black/40 rounded-full pointer-events-none">
                        <div className="w-8 h-8 border-2 border-gold border-t-transparent rounded-full animate-spin" />
                      </div>
                    )}
                  </div>

                  <p className="text-xs text-muted-foreground text-center">
                    Перетаскивайте для позиционирования
                  </p>

                  {/* Поворот: кнопки 90° + слайдер */}
                  <div className="flex items-center gap-2 w-full max-w-xs">
                    <button
                      onClick={rotateLeft}
                      className="p-2 rounded-lg bg-surface-elevated text-muted-foreground hover:text-body-text transition-colors shrink-0"
                      aria-label="Повернуть влево на 90°"
                      title="Повернуть влево на 90°"
                    >
                      <RotateCcw size={18} />
                    </button>
                    <input
                      type="range"
                      min="-180"
                      max="180"
                      step="1"
                      value={rotation}
                      onChange={(e) => setRotation(parseInt(e.target.value, 10))}
                      className="flex-1 accent-gold h-2"
                      title={`Поворот: ${rotation}°`}
                    />
                    <button
                      onClick={rotateRight}
                      className="p-2 rounded-lg bg-surface-elevated text-muted-foreground hover:text-body-text transition-colors shrink-0"
                      aria-label="Повернуть вправо на 90°"
                      title="Повернуть вправо на 90°"
                    >
                      <RotateCw size={18} />
                    </button>
                  </div>

                  {/* Масштаб */}
                  <div className="flex items-center gap-2 w-full max-w-xs">
                    <button
                      onClick={() => setScale((s) => Math.max(0.3, s - 0.1))}
                      className="p-2 rounded-lg bg-surface-elevated text-muted-foreground hover:text-body-text transition-colors shrink-0"
                      aria-label="Уменьшить"
                    >
                      <ZoomOut size={18} />
                    </button>
                    <input
                      type="range"
                      min="0.3"
                      max="4"
                      step="0.01"
                      value={scale}
                      onChange={(e) => setScale(parseFloat(e.target.value))}
                      className="flex-1 accent-gold h-2"
                    />
                    <button
                      onClick={() => setScale((s) => Math.min(4, s + 0.1))}
                      className="p-2 rounded-lg bg-surface-elevated text-muted-foreground hover:text-body-text transition-colors shrink-0"
                      aria-label="Увеличить"
                    >
                      <ZoomIn size={18} />
                    </button>
                  </div>

                  {/* Выбрать другое фото */}
                  <button
                    onClick={() => fileInputRef.current?.click()}
                    className="text-sm text-gold hover:underline"
                  >
                    Выбрать другое фото
                  </button>
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/jpeg,image/png,image/webp"
                    className="hidden"
                    onChange={handleFileSelect}
                  />
                </div>
              )}

              {error && (
                <div className="mt-4 p-3 rounded-lg bg-price-rise/10 text-price-rise text-sm text-center">
                  {error}
                </div>
              )}
            </div>

            {/* Footer */}
            <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-hairline-dark">
              <button
                onClick={onClose}
                className="px-4 py-2 rounded-lg text-sm font-medium text-muted-foreground hover:text-body-text hover:bg-surface-elevated transition-colors"
              >
                Отмена
              </button>
              <button
                onClick={handleSave}
                disabled={!imageSrc || isSaving}
                className="flex items-center gap-2 px-5 py-2 rounded-lg text-sm font-semibold bg-gold text-gold-ink hover:bg-gold-active transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isSaving ? (
                  <>
                    <div className="w-4 h-4 border-2 border-gold-ink border-t-transparent rounded-full animate-spin" />
                    Сохранение...
                  </>
                ) : (
                  <>
                    <Check size={16} />
                    Применить
                  </>
                )}
              </button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
