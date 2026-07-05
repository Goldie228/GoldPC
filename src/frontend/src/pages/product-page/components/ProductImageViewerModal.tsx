import { useCallback, useEffect, useMemo, useRef, useState, type ReactElement } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { ChevronLeft, ChevronRight, X } from 'lucide-react';

type ViewerImage = {
  id: string | number;
  url: string;
  alt?: string | null;
};

export interface ProductImageViewerModalProps {
  images: ViewerImage[];
  startIndex: number;
  productName: string;
  onClose: () => void;
}

type Point = { x: number; y: number };

function dist(a: Point, b: Point): number {
  return Math.hypot(a.x - b.x, a.y - b.y);
}

function clamp(v: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, v));
}

export function ProductImageViewerModal({
  images,
  startIndex,
  productName,
  onClose,
}: ProductImageViewerModalProps): ReactElement {
  const safeImages = useMemo(() => images.filter((i) => i?.url), [images]);
  const [activeIndex, setActiveIndex] = useState(() =>
    Math.max(0, Math.min(startIndex, Math.max(0, safeImages.length - 1))),
  );
  const active = safeImages[activeIndex];
  const hasMultiple = safeImages.length > 1;

  // Zoom state
  const [zoom, setZoom] = useState(1);
  const [origin, setOrigin] = useState({ x: 50, y: 50 });

  // Мобильные pinch state
  const pointersRef = useRef<Map<number, Point>>(new Map());
  const pinchRef = useRef<{
    startDist: number;
    startScale: number;
    startTx: number;
    startTy: number;
    startMid: Point;
  } | null>(null);
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const lastPanRef = useRef<Point | null>(null);

  const isMobile = useRef(
    typeof window !== 'undefined' && window.matchMedia?.('(max-width: 768px)').matches,
  ).current;

  const resetZoom = useCallback(() => {
    setZoom(1);
    setOrigin({ x: 50, y: 50 });
    setPan({ x: 0, y: 0 });
    pointersRef.current.clear();
    pinchRef.current = null;
    lastPanRef.current = null;
  }, []);

  useEffect(() => resetZoom(), [activeIndex, resetZoom]);

  // Navigation
  const handlePrev = useCallback(() => {
    if (!hasMultiple) return;
    setActiveIndex((i) => (i <= 0 ? safeImages.length - 1 : i - 1));
  }, [hasMultiple, safeImages.length]);

  const handleNext = useCallback(() => {
    if (!hasMultiple) return;
    setActiveIndex((i) => (i >= safeImages.length - 1 ? 0 : i + 1));
  }, [hasMultiple, safeImages.length]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'ArrowLeft') handlePrev();
      else if (e.key === 'ArrowRight') handleNext();
      else if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [handlePrev, handleNext, onClose]);

  // Десктоп zoom toggle on click
  const handleImageClick = useCallback(() => {
    if (isMobile) return;
    setZoom((v) => (v === 1 ? 2.5 : 1));
    if (zoom !== 1) setPan({ x: 0, y: 0 });
  }, [isMobile, zoom]);

  // Десктоп mouse move for zoom origin
  const handleMouseMove = useCallback((e: React.MouseEvent) => {
    if (zoom === 1) return;
    const rect = e.currentTarget.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width) * 100;
    const y = ((e.clientY - rect.top) / rect.height) * 100;
    setOrigin({ x: clamp(x, 0, 100), y: clamp(y, 0, 100) });
  }, [zoom]);

  // Мобильные touch handlers
  const handlePointerDown = useCallback((e: React.PointerEvent) => {
    if (!isMobile || !active?.url) return;
    const el = e.currentTarget;
    el.setPointerCapture(e.pointerId);
    pointersRef.current.set(e.pointerId, { x: e.clientX, y: e.clientY });

    if (pointersRef.current.size === 2) {
      const pts = Array.from(pointersRef.current.values());
      pinchRef.current = {
        startDist: dist(pts[0], pts[1]),
        startScale: zoom,
        startTx: pan.x,
        startTy: pan.y,
        startMid: { x: (pts[0].x + pts[1].x) / 2, y: (pts[0].y + pts[1].y) / 2 },
      };
      lastPanRef.current = null;
    } else {
      pinchRef.current = null;
      lastPanRef.current = { x: e.clientX, y: e.clientY };
    }
  }, [isMobile, active?.url, zoom, pan]);

  const handlePointerMove = useCallback((e: React.PointerEvent) => {
    if (!isMobile) return;
    if (!pointersRef.current.has(e.pointerId)) return;

    pointersRef.current.set(e.pointerId, { x: e.clientX, y: e.clientY });

    if (pointersRef.current.size === 2 && pinchRef.current) {
      const pts = Array.from(pointersRef.current.values());
      const curDist = Math.max(1, dist(pts[0], pts[1]));
      const scale = clamp(
        (curDist / pinchRef.current.startDist) * pinchRef.current.startScale,
        1,
        4,
      );
      const dx = pts[0].x + pts[1].x - pinchRef.current.startMid.x * 2;
      const dy = pts[0].y + pts[1].y - pinchRef.current.startMid.y * 2;
      const nextTx = pinchRef.current.startTx + dx * 0.5;
      const nextTy = pinchRef.current.startTy + dy * 0.5;
      setZoom(scale);
      setPan({ x: nextTx, y: nextTy });
    } else if (pointersRef.current.size === 1 && zoom > 1) {
      const p = pointersRef.current.get(e.pointerId);
      const last = lastPanRef.current;
      if (p && last) {
        setPan((prev) => ({ x: prev.x + p.x - last.x, y: prev.y + p.y - last.y }));
      }
      if (p) lastPanRef.current = p;
    }
  }, [isMobile, zoom]);

  const handlePointerUp = useCallback((e: React.PointerEvent) => {
    if (!isMobile) return;
    pointersRef.current.delete(e.pointerId);
    if (pointersRef.current.size < 2) pinchRef.current = null;
    if (pointersRef.current.size === 0) lastPanRef.current = null;
  }, [isMobile]);

  if (safeImages.length === 0 || !active) {
    return (
      <div className="w-[min(1200px,calc(100vw-32px))] h-[calc(100vh-32px)] bg-card rounded-xl border border-border flex items-center justify-center">
        <p className="text-muted-foreground text-sm">Нет изображений</p>
      </div>
    );
  }

  const imgTransform = isMobile
    ? `translate(${pan.x}px, ${pan.y}px) scale(${zoom})`
    : zoom > 1
      ? `scale(${zoom})`
      : undefined;

  const imgOrigin = isMobile ? '0 0' : `${origin.x}% ${origin.y}%`;

  return (
    <div className="fixed inset-0 z-[1000] flex items-center justify-center bg-black/85 p-4" onClick={onClose}>
      <div
        className="w-[min(1200px,calc(100vw-32px))] h-[calc(100vh-32px)] bg-card rounded-xl border border-border flex flex-col overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Верхняя панель */}
        <div className="shrink-0 flex items-center justify-between px-5 py-3 border-b border-border">
          <p className="text-sm font-medium text-foreground truncate min-w-0">
            {productName}
          </p>
          <div className="flex items-center gap-4 shrink-0">
            {hasMultiple && (
              <span className="font-mono text-xs text-muted-foreground">
                {activeIndex + 1}/{safeImages.length}
              </span>
            )}
            <button
              onClick={onClose}
              className="w-8 h-8 flex items-center justify-center rounded-lg text-muted-foreground hover:text-foreground hover:bg-card transition-colors cursor-pointer"
              aria-label="Закрыть"
            >
              <X size={16} />
            </button>
          </div>
        </div>

        {/* Изображение */}
        <div className="flex-1 min-h-0 bg-[#FFFFFF] overflow-hidden relative">
          {hasMultiple && (
            <>
              <button
                onClick={handlePrev}
                className="absolute left-3 top-1/2 -translate-y-1/2 z-10 w-11 h-11 flex items-center justify-center rounded-full bg-black/40 text-white hover:bg-black/60 transition-colors cursor-pointer"
                aria-label="Предыдущее изображение"
              >
                <ChevronLeft size={22} />
              </button>
              <button
                onClick={handleNext}
                className="absolute right-3 top-1/2 -translate-y-1/2 z-10 w-11 h-11 flex items-center justify-center rounded-full bg-black/40 text-white hover:bg-black/60 transition-colors cursor-pointer"
                aria-label="Следующее изображение"
              >
                <ChevronRight size={22} />
              </button>
            </>
          )}

          <AnimatePresence mode="wait">
            <motion.div
              key={active.url}
              className={`w-full h-full flex items-center justify-center ${zoom > 1 ? 'cursor-zoom-out' : 'cursor-zoom-in'}`}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.18 }}
              onClick={handleImageClick}
              onMouseMove={handleMouseMove}
              onPointerDown={handlePointerDown}
              onPointerMove={handlePointerMove}
              onPointerUp={handlePointerUp}
              onPointerCancel={handlePointerUp}
            >
              <img
                src={active.url}
                alt={active.alt || productName}
                className="w-full h-full object-contain select-none"
                style={{
                  transform: imgTransform,
                  transformOrigin: imgOrigin,
                  transition: zoom > 1 || isMobile ? 'none' : 'transform 0.2s ease',
                }}
                draggable={false}
              />
            </motion.div>
          </AnimatePresence>
        </div>

        {/* Миниатюры */}
        {hasMultiple && (
          <div className="shrink-0 flex items-center justify-center gap-2 px-4 py-3 border-t border-border overflow-x-auto">
            {safeImages.map((img, idx) => (
              <button
                key={img.id}
                onClick={() => setActiveIndex(idx)}
                className={`shrink-0 w-12 h-12 rounded-lg border-2 overflow-hidden transition-colors cursor-pointer ${
                  idx === activeIndex
                    ? 'border-primary'
                    : 'border-border hover:border-muted-foreground'
                }`}
                aria-label={`Изображение ${idx + 1}`}
              >
                <img
                  src={img.url}
                  alt=""
                  className="w-full h-full object-cover"
                  draggable={false}
                />
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
