import { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Cpu, Trash2, Share2, ExternalLink, Loader2, Package, Plus } from 'lucide-react';
import { useToast } from '@/hooks/useToast';
import { pcbuilderApi, type SavedBuild } from '@/api/pcbuilder';
import { StatusBadge } from '@/components/ui/StatusBadge';

const PURPOSE_LABELS: Record<string, string> = {
  Gaming: 'Игровой',
  Office: 'Офисный',
  Workstation: 'Рабочая станция',
};

/** Stagger entrance animation — each card fades in with a tiny delay */
const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.05 },
  },
};

const itemVariants = {
  hidden: { opacity: 0, y: 10 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.3, ease: [0.33, 1, 0.68, 1] as const },
  },
  exit: {
    opacity: 0,
    scale: 0.95,
    transition: { duration: 0.2 },
  },
};

/**
 * AccountSavedBuilds — страница сохранённых сборок ПК в личном кабинете.
 *
 * Features:
 * - Загрузка сохранённых конфигураций (GET /api/v1/pcbuilder/configurations)
 * - Удаление сборки (DELETE /api/v1/pcbuilder/configurations/{id})
 * - Генерация ссылки для шаринга (POST /api/v1/pcbuilder/configurations/{id}/share)
 * - Переход к редактированию сборки
 * - Адаптивная сетка карточек (1→2→3→4 колонки)
 * - Swipe-to-delete на мобильных устройствах
 * - FAB «Новая сборка» на мобильных
 * - Stagger entrance-анимация через framer-motion
 * - StatusBadge для совместимости
 */
export function AccountSavedBuilds() {
  const { showToast } = useToast();
  const [builds, setBuilds] = useState<SavedBuild[]>([]);
  const [loading, setLoading] = useState(true);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [sharingId, setSharingId] = useState<string | null>(null);

  const [isMobile, setIsMobile] = useState(false);
  const [swipedBuildId, setSwipedBuildId] = useState<string | null>(null);
  const touchStartX = useRef<number>(0);

  useEffect(() => {
    void loadBuilds();
  }, []);

  /** Detect mobile viewport for FAB and swipe behavior */
  useEffect(() => {
    const check = () => setIsMobile(window.innerWidth < 768);
    check();
    window.addEventListener('resize', check);
    return () => window.removeEventListener('resize', check);
  }, []);

  const loadBuilds = async () => {
    setLoading(true);
    try {
      const allBuilds = await pcbuilderApi.getConfigurations();
      // Hide auto-saves from the list — they are managed automatically
      setBuilds(allBuilds.filter((b) => b.name !== 'Автосохранение'));
    } catch {
      setBuilds([]);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: string, name: string) => {
    if (!confirm(`Удалить сборку «${name}»?`)) return;

    setDeletingId(id);
    try {
      await pcbuilderApi.deleteConfiguration(id);
      setBuilds((prev) => prev.filter((b) => b.id !== id));
      showToast(`Сборка «${name}» удалена`, 'success');
    } catch {
      showToast('Не удалось удалить сборку', 'error');
    } finally {
      setDeletingId(null);
    }
  };

  /** Swipe-to-delete: snap back card first, then show confirm */
  const handleSwipeDelete = async (id: string, name: string) => {
    setSwipedBuildId(null);
    await handleDelete(id, name);
  };

  const handleShare = async (id: string) => {
    setSharingId(id);
    try {
      const { shareUrl, shareToken } = await pcbuilderApi.shareConfiguration(id);
      const url = shareUrl || `${window.location.origin}/pc-builder/shared/${shareToken}`;
      await navigator.clipboard.writeText(url);
      showToast('Ссылка скопирована в буфер обмена', 'success');
    } catch {
      showToast('Не удалось создать ссылку', 'error');
    } finally {
      setSharingId(null);
    }
  };

  const handleTouchStart = (_e: React.TouchEvent, buildId: string) => {
    touchStartX.current = _e.touches[0].clientX;
  };

  const handleTouchEnd = (e: React.TouchEvent, buildId: string) => {
    const deltaX = e.changedTouches[0].clientX - touchStartX.current;
    if (deltaX < -60) {
      setSwipedBuildId(buildId);
    } else {
      setSwipedBuildId(null);
    }
  };

  const formatPrice = (price: number): string => `${price.toLocaleString('ru-BY')} BYN`;

  const formatDate = (dateStr: string): string => {
    return new Date(dateStr).toLocaleDateString('ru-RU', {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    });
  };

  const componentCount = (build: SavedBuild): number => {
    if (build.components) {
      return Object.keys(build.components).filter((k) => build.components[k]).length;
    }
    // Fallback: count individual ID fields from backend DTO
    let count = 0;
    if (build.processorId) count++;
    if (build.motherboardId) count++;
    if (build.ramId) count++;
    if (build.gpuId) count++;
    if (build.psuId) count++;
    if (build.storageId) count++;
    if (build.caseId) count++;
    if (build.coolerId) count++;
    return count;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 size={32} className="text-muted-foreground animate-spin" />
        <span className="ml-3 text-sm text-muted-foreground">Загрузка сборок...</span>
      </div>
    );
  }

  return (
    <div>
      {/* Page Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Сохранённые сборки</h1>
          <p className="text-sm text-muted-foreground mt-1">Ваши конфигурации ПК</p>
        </div>
        {!isMobile && (
          <Link
            to="/pc-builder"
            className="inline-flex items-center gap-2 bg-gold text-gold-ink px-4 py-2.5 rounded-lg font-semibold text-sm hover:bg-gold-active transition-colors"
          >
            <Cpu size={16} />
            Создать сборку
          </Link>
        )}
      </div>

      {/* Builds Grid */}
      {builds.length === 0 ? (
        <div className="bg-card border border-border rounded-xl p-12 text-center">
          <Package size={48} className="text-muted-foreground mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-foreground mb-2">Нет сохранённых сборок</h3>
          <p className="text-sm text-muted-foreground mb-6">
            Создайте свою первую конфигурацию ПК в конструкторе
          </p>
          <Link
            to="/pc-builder"
            className="inline-flex items-center gap-2 bg-gold text-gold-ink px-6 py-3 rounded-lg font-semibold hover:bg-gold-active transition-colors"
          >
            <Cpu size={18} />
            Открыть конструктор
          </Link>
        </div>
      ) : (
        <motion.div
          className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4"
          variants={containerVariants}
          initial="hidden"
          animate="visible"
        >
          <AnimatePresence mode="popLayout">
            {builds.map((build) => (
              <motion.div
                key={build.id}
                variants={itemVariants}
                layout
                exit="exit"
                className="relative overflow-hidden rounded-xl"
                onTouchStart={(e) => handleTouchStart(e, build.id)}
                onTouchEnd={(e) => handleTouchEnd(e, build.id)}
              >
                {/* Card content — swipes left on mobile to reveal delete */}
                <div
                  className="bg-card border border-border rounded-xl p-5 transition-transform duration-200"
                  style={{
                    transform:
                      isMobile && swipedBuildId === build.id
                        ? 'translateX(-88px)'
                        : 'translateX(0)',
                  }}
                >
                  <div className="flex flex-col gap-3">
                    {/* Icon + Name */}
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-lg bg-elevated flex items-center justify-center shrink-0">
                        <Cpu size={20} className="text-muted-foreground" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <h3 className="text-base font-semibold text-foreground truncate">
                          {build.name}
                        </h3>
                      </div>
                    </div>

                    {/* Meta: purpose / components / date */}
                    <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
                      {build.purpose && (
                        <span className="bg-elevated px-2 py-0.5 rounded">
                          {PURPOSE_LABELS[build.purpose] || build.purpose}
                        </span>
                      )}
                      <span>{componentCount(build)} комп.</span>
                      <span>{formatDate(build.createdAt)}</span>
                    </div>

                    {/* Price + StatusBadge */}
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-lg font-bold text-foreground font-tabular">
                        {formatPrice(build.totalPrice)}
                      </span>
                      <StatusBadge
                        variant={build.isCompatible ? 'success' : 'warning'}
                        label={build.isCompatible ? 'Совместима' : 'Есть проблемы'}
                      />
                    </div>

                    {/* Desktop action buttons (hover-based, 44px touch targets) */}
                    {!isMobile && (
                      <div className="flex items-center gap-2 pt-3 border-t border-border/50">
                        <Link
                          to={`/pc-builder?config=${build.id}`}
                          className="w-11 h-11 flex items-center justify-center rounded-lg text-muted-foreground hover:text-foreground hover:bg-elevated transition-colors"
                          title="Открыть в конструкторе"
                        >
                          <ExternalLink size={16} />
                        </Link>
                        <button
                          onClick={() => void handleShare(build.id)}
                          disabled={sharingId === build.id}
                          className="w-11 h-11 flex items-center justify-center rounded-lg text-muted-foreground hover:text-foreground hover:bg-elevated transition-colors disabled:opacity-50"
                          title="Поделиться"
                        >
                          {sharingId === build.id ? (
                            <Loader2 size={16} className="animate-spin" />
                          ) : (
                            <Share2 size={16} />
                          )}
                        </button>
                        <button
                          onClick={() => void handleDelete(build.id, build.name)}
                          disabled={deletingId === build.id}
                          className="w-11 h-11 flex items-center justify-center rounded-lg text-muted-foreground hover:text-red-500 hover:bg-red-500/10 transition-colors disabled:opacity-50"
                          title="Удалить"
                        >
                          {deletingId === build.id ? (
                            <Loader2 size={16} className="animate-spin" />
                          ) : (
                            <Trash2 size={16} />
                          )}
                        </button>
                      </div>
                    )}
                  </div>
                </div>

                {/* Swipe-revealed delete button (mobile only) */}
                {isMobile && (
                  <button
                    onClick={() => void handleSwipeDelete(build.id, build.name)}
                    disabled={deletingId === build.id}
                    className="absolute right-0 top-0 bottom-0 w-[88px] flex items-center justify-center bg-red-500/15 text-red-500 rounded-xl transition-opacity duration-200 disabled:opacity-50"
                    style={{
                      opacity: swipedBuildId === build.id ? 1 : 0,
                      pointerEvents: swipedBuildId === build.id ? 'auto' : 'none',
                    }}
                    aria-label="Удалить сборку"
                  >
                    {deletingId === build.id ? (
                      <Loader2 size={20} className="animate-spin" />
                    ) : (
                      <Trash2 size={20} />
                    )}
                  </button>
                )}
              </motion.div>
            ))}
          </AnimatePresence>
        </motion.div>
      )}

      {/* Mobile FAB: "Новая сборка" */}
      {isMobile && (
        <Link
          to="/pc-builder"
          className="fixed bottom-6 right-6 z-50 w-14 h-14 bg-gold text-gold-ink rounded-full shadow-lg flex items-center justify-center hover:bg-gold-active transition-colors"
          aria-label="Новая сборка"
        >
          <Plus size={24} />
        </Link>
      )}
    </div>
  );
}

export default AccountSavedBuilds;
