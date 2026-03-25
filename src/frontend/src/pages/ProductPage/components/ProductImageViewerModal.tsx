import { useCallback, useEffect, useMemo, useRef, useState, type ReactElement } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { ChevronLeft, ChevronRight, X } from 'lucide-react';
import styles from './ProductImageViewerModal.module.css';

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
      <div className={styles.viewer}>
        <div className={styles.topBar}>
          <div>
            <div className={styles.title}>{productName}</div>
            <div className={styles.counter}>0 / 0</div>
          </div>
          <button className={styles.closeBtn} onClick={onClose} aria-label="Закрыть">
            <X size={18} />
          </button>
        </div>
        <div className={styles.stageWrap} />
      </div>
    );
  }

  return (
    <div className={styles.viewer}>
      <div className={styles.topBar}>
        <div>
          <div className={styles.title}>{productName}</div>
          <div className={styles.counter}>{activeIndex + 1} / {safeImages.length}</div>
        </div>
        <button className={styles.closeBtn} onClick={onClose} aria-label="Закрыть">
          <X size={18} />
        </button>
      </div>

      <div className={styles.stageWrap}>
        {safeImages.length > 1 && (
          <>
            <button className={`${styles.navBtn} ${styles.navPrev}`} onClick={handlePrev} aria-label="Предыдущее фото">
              <ChevronLeft size={22} />
            </button>
            <button className={`${styles.navBtn} ${styles.navNext}`} onClick={handleNext} aria-label="Следующее фото">
              <ChevronRight size={22} />
            </button>
          </>
        )}

        <div
          ref={stageRef}
          className={`${styles.stage} ${!isMobileLayout && isDesktopZoomEnabled ? styles.stageZoomActive : ''}`}
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
              className={styles.image}
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
    </div>
  );
}

