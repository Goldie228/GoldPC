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

type Pointer = { x: number; y: number };

function dist(a: Pointer, b: Pointer): number {
  const dx = a.x - b.x;
  const dy = a.y - b.y;
  return Math.hypot(dx, dy);
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
  const [activeIndex, setActiveIndex] = useState(() => clamp(startIndex, 0, Math.max(0, safeImages.length - 1)));
  const active = safeImages[activeIndex];

  // Desktop in-place zoom (mouse)
  const stageRef = useRef<HTMLDivElement | null>(null);
  const imgRef = useRef<HTMLImageElement | null>(null);
  const [isDesktopZoomEnabled, setIsDesktopZoomEnabled] = useState(false);
  const [origin, setOrigin] = useState<{ xPct: number; yPct: number }>({ xPct: 50, yPct: 50 });

  // Mobile pinch zoom
  const pointersRef = useRef<Map<number, Pointer>>(new Map());
  const lastPanRef = useRef<Pointer | null>(null);
  const pinchRef = useRef<{
    startDist: number;
    startScale: number;
    startMid: Pointer;
    startTx: number;
    startTy: number;
  } | null>(null);
  const [panZoom, setPanZoom] = useState<{ scale: number; tx: number; ty: number }>({ scale: 1, tx: 0, ty: 0 });

  const DESKTOP_SCALE = 2.2;
  const MAX_MOBILE_SCALE = 4;

  const resetTransforms = useCallback(() => {
    setIsDesktopZoomEnabled(false);
    setOrigin({ xPct: 50, yPct: 50 });
    setPanZoom({ scale: 1, tx: 0, ty: 0 });
    pointersRef.current.clear();
    pinchRef.current = null;
    lastPanRef.current = null;
  }, []);

  useEffect(() => resetTransforms(), [activeIndex, resetTransforms]);

  const canPrev = safeImages.length > 1;
  const handlePrev = useCallback(() => {
    if (!canPrev) return;
    setActiveIndex((i) => (i === 0 ? safeImages.length - 1 : i - 1));
  }, [canPrev, safeImages.length]);

  const handleNext = useCallback(() => {
    if (!canPrev) return;
    setActiveIndex((i) => (i === safeImages.length - 1 ? 0 : i + 1));
  }, [canPrev, safeImages.length]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'ArrowLeft') handlePrev();
      if (e.key === 'ArrowRight') handleNext();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [handlePrev, handleNext]);

  const isMobileLayout = typeof window !== 'undefined' && window.matchMedia?.('(max-width: 768px)').matches;

  const onStagePointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
    if (e.pointerType !== 'mouse') return;
    if (!active?.url) return;
    if (!isDesktopZoomEnabled) return;
    const stage = stageRef.current;
    if (!stage) return;
    const rect = stage.getBoundingClientRect();
    if (rect.width <= 0 || rect.height <= 0) return;

    const xPct = clamp(((e.clientX - rect.left) / rect.width) * 100, 0, 100);
    const yPct = clamp(((e.clientY - rect.top) / rect.height) * 100, 0, 100);
    setOrigin({ xPct, yPct });
  };

  const onStagePointerLeave = (e: React.PointerEvent<HTMLDivElement>) => {
    if (e.pointerType !== 'mouse') return;
    // Do not auto-disable on leave; zoom is controlled by click.
  };

  const clampMobileTranslate = (stageW: number, stageH: number, scale: number, tx: number, ty: number) => {
    const maxShiftX = (scale - 1) * stageW;
    const maxShiftY = (scale - 1) * stageH;
    return {
      tx: clamp(tx, -maxShiftX, 0),
      ty: clamp(ty, -maxShiftY, 0),
    };
  };

  const applyMobileTransform = (next: { scale: number; tx: number; ty: number }, stageRect: DOMRect) => {
    const scale = clamp(next.scale, 1, MAX_MOBILE_SCALE);
    const { tx, ty } = clampMobileTranslate(stageRect.width, stageRect.height, scale, next.tx, next.ty);
    setPanZoom({ scale, tx, ty });
  };

  const onStagePointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
    if (!isMobileLayout) return;
    if (e.pointerType !== 'touch') return;
    if (!active?.url) return;
    e.currentTarget.setPointerCapture(e.pointerId);
    pointersRef.current.set(e.pointerId, { x: e.clientX, y: e.clientY });

    if (pointersRef.current.size === 2) {
      const [a, b] = Array.from(pointersRef.current.values());
      pinchRef.current = {
        startDist: dist(a, b),
        startScale: panZoom.scale,
        startMid: { x: (a.x + b.x) / 2, y: (a.y + b.y) / 2 },
        startTx: panZoom.tx,
        startTy: panZoom.ty,
      };
      lastPanRef.current = null;
    } else {
      pinchRef.current = null;
      lastPanRef.current = { x: e.clientX, y: e.clientY };
    }
  };

  const onStagePointerMoveTouch = (e: React.PointerEvent<HTMLDivElement>) => {
    if (!isMobileLayout) return;
    if (e.pointerType !== 'touch') return;
    const stage = stageRef.current;
    if (!stage) return;
    if (!pointersRef.current.has(e.pointerId)) return;

    pointersRef.current.set(e.pointerId, { x: e.clientX, y: e.clientY });

    const stageRect = stage.getBoundingClientRect();

    if (pointersRef.current.size === 2 && pinchRef.current) {
      const [a, b] = Array.from(pointersRef.current.values());
      const curDist = Math.max(1, dist(a, b));
      const nextScale = clamp((curDist / pinchRef.current.startDist) * pinchRef.current.startScale, 1, MAX_MOBILE_SCALE);

      // Scale around midpoint (in stage-local coords)
      const mid = { x: (a.x + b.x) / 2, y: (a.y + b.y) / 2 };
      const midLocal = { x: mid.x - stageRect.left, y: mid.y - stageRect.top };
      const startMidLocal = { x: pinchRef.current.startMid.x - stageRect.left, y: pinchRef.current.startMid.y - stageRect.top };

      const ratio = nextScale / pinchRef.current.startScale;
      const baseTx = pinchRef.current.startTx + (midLocal.x - startMidLocal.x);
      const baseTy = pinchRef.current.startTy + (midLocal.y - startMidLocal.y);

      const nextTx = midLocal.x - (midLocal.x - baseTx) * ratio;
      const nextTy = midLocal.y - (midLocal.y - baseTy) * ratio;

      applyMobileTransform({ scale: nextScale, tx: nextTx, ty: nextTy }, stageRect);
      e.preventDefault();
      return;
    }

    // Pan with one finger when zoomed
    if (pointersRef.current.size === 1 && panZoom.scale > 1) {
      const p = pointersRef.current.get(e.pointerId);
      const last = lastPanRef.current;
      if (p && last) {
        const dx = p.x - last.x;
        const dy = p.y - last.y;
        applyMobileTransform({ scale: panZoom.scale, tx: panZoom.tx + dx, ty: panZoom.ty + dy }, stageRect);
      }
      if (p) lastPanRef.current = p;
      e.preventDefault();
    }
  };

  const onStagePointerUp = (e: React.PointerEvent<HTMLDivElement>) => {
    if (e.pointerType !== 'touch') return;
    pointersRef.current.delete(e.pointerId);
    if (pointersRef.current.size < 2) pinchRef.current = null;
    if (pointersRef.current.size === 0) lastPanRef.current = null;
  };

  if (safeImages.length === 0 || !active) {
    return (
      <div className="h-full w-full grid grid-rows-[auto_1fr] gap-3 p-3.5">
        <div className="flex items-center justify-between gap-3">
          <div>
            <div className="text-sm font-semibold text-[color-mix(in_srgb,var(--border-muted)_85%,transparent)]">{productName}</div>
            {safeImages.length > 1 && <div className="font-[var(--font-mono)] text-xs text-[color-mix(in_srgb,var(--border-muted)_65%,transparent)]">0 / 0</div>}
          </div>
          <button className="w-10 h-10 inline-flex items-center justify-center rounded-xl border border-[color-mix(in_srgb,var(--border-muted)_12%,transparent)] bg-[color-mix(in_srgb,var(--border-muted)_4%,transparent)] text-[color-mix(in_srgb,var(--border-muted)_80%,transparent)] cursor-pointer transition-transform duration-120 hover:-translate-y-0.5 hover:bg-[color-mix(in_srgb,var(--border-muted)_6%,transparent)] hover:border-[color-mix(in_srgb,var(--color-gold-500)_35%,transparent)]" onClick={onClose} aria-label="Закрыть">
            <X size={18} />
          </button>
        </div>
        </div>
    );
  }

  return (
    <div className="h-full w-full grid grid-rows-[auto_1fr] gap-3 p-3.5">
      <div className="flex items-center justify-between gap-3">
        <div>
          <div className="text-sm font-semibold text-[color-mix(in_srgb,var(--border-muted)_85%,transparent)]">{productName}</div>
          {safeImages.length > 1 && (
            <div className="font-[var(--font-mono)] text-xs text-[color-mix(in_srgb,var(--border-muted)_65%,transparent)]">{activeIndex + 1} / {safeImages.length}</div>
          )}
        </div>
        <button className="w-10 h-10 inline-flex items-center justify-center rounded-xl border border-[color-mix(in_srgb,var(--border-muted)_12%,transparent)] bg-[color-mix(in_srgb,var(--border-muted)_4%,transparent)] text-[color-mix(in_srgb,var(--border-muted)_80%,transparent)] cursor-pointer transition-transform duration-120 hover:-translate-y-0.5 hover:bg-[color-mix(in_srgb,var(--border-muted)_6%,transparent)] hover:border-[color-mix(in_srgb,var(--color-gold-500)_35%,transparent)]" onClick={onClose} aria-label="Закрыть">
          <X size={18} />
        </button>
      </div>

      <div className="relative rounded-2xl overflow-hidden bg-[#FFFFFF] border border-[color-mix(in_srgb,var(--border-muted)_14%,transparent)]">
      {safeImages.length > 1 && (
        <>
          <button className="absolute top-1/2 -translate-y-1/2 w-11.5 h-11.5 inline-flex items-center justify-center rounded-full bg-[color-mix(in_srgb,var(--shadow-lg)_45%,transparent)] border border-[color-mix(in_srgb,var(--border-muted)_16%,transparent)] text-[color-mix(in_srgb,var(--border-muted)_9%,transparent)] cursor-pointer transition-[transform,background] duration-120 z-3 hover:scale-106 hover:bg-[color-mix(in_srgb,var(--shadow-lg)_55%,transparent)] left-3.5" onClick={handlePrev} aria-label="Предыдущее фото">
            <ChevronLeft size={22} />
          </button>
          <button className="absolute top-1/2 -translate-y-1/2 w-11.5 h-11.5 inline-flex items-center justify-center rounded-full bg-[color-mix(in_srgb,var(--shadow-lg)_45%,transparent)] border border-[color-mix(in_srgb,var(--border-muted)_16%,transparent)] text-[color-mix(in_srgb,var(--border-muted)_9%,transparent)] cursor-pointer transition-[transform,background] duration-120 z-3 hover:scale-106 hover:bg-[color-mix(in_srgb,var(--shadow-lg)_55%,transparent)] right-3.5" onClick={handleNext} aria-label="Следующее фото">
            <ChevronRight size={22} />
          </button>
        </>
      )}

      <div
        ref={stageRef}
        className={`absolute inset-0 flex items-center justify-center touch-action-none ${!isMobileLayout && isDesktopZoomEnabled ? 'cursor-zoom-out' : 'cursor-zoom-in'}`}
        onPointerMove={onStagePointerMove}
        onPointerLeave={onStagePointerLeave}
        onPointerDown={(e) => {
          if (isMobileLayout) {
            onStagePointerDown(e);
            return;
          }

          if (e.pointerType !== 'mouse') return;
          if (e.button !== 0) return;
          setIsDesktopZoomEnabled((v) => !v);
        }}
        onPointerMoveCapture={onStagePointerMoveTouch}
        onPointerUp={onStagePointerUp}
        onPointerCancel={onStagePointerUp}
      >
        <AnimatePresence mode="wait">
          <motion.img
            key={active.url}
            ref={imgRef}
            src={active.url}
            alt={active.alt || productName}
            className="w-full h-full object-contain select-none [&::-webkit-drag]:none will-change-transform transition-transform duration-160"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.18 }}
            style={{
              transform: isMobileLayout
                ? `translate(${panZoom.tx}px, ${panZoom.ty}px) scale(${panZoom.scale})`
                : isDesktopZoomEnabled
                  ? `scale(${DESKTOP_SCALE})`
                  : undefined,
              transformOrigin: isMobileLayout ? '0 0' : `${origin.xPct}% ${origin.yPct}%`,
            }}
          />
        </AnimatePresence>
      </div>
    </div>
  );
}

