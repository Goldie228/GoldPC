import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Cpu, Trash2, Share2, ExternalLink, Loader2, Package } from 'lucide-react';
import { useToast } from '../../hooks/useToast';
import apiClient from '../../api/client';

interface SavedBuild {
  id: string;
  name: string;
  purpose?: string;
  totalPrice: number;
  isCompatible: boolean;
  createdAt: string;
  shareToken?: string;
  components: Record<string, string>;
}

const PURPOSE_LABELS: Record<string, string> = {
  Gaming: 'Игровой',
  Office: 'Офисный',
  Workstation: 'Рабочая станция',
};

/**
 * AccountSavedBuilds — страница сохранённых сборок ПК в личном кабинете.
 *
 * Features:
 * - Загрузка сохранённых конфигураций (GET /api/v1/pcbuilder/configurations)
 * - Удаление сборки (DELETE /api/v1/pcbuilder/configurations/{id})
 * - Генерация ссылки для шаринга (POST /api/v1/pcbuilder/configurations/{id}/share)
 * - Переход к редактированию сборки
 */
export function AccountSavedBuilds() {
  const { showToast } = useToast();
  const [builds, setBuilds] = useState<SavedBuild[]>([]);
  const [loading, setLoading] = useState(true);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [sharingId, setSharingId] = useState<string | null>(null);

  useEffect(() => {
    loadBuilds();
  }, []);

  const loadBuilds = async () => {
    setLoading(true);
    try {
      const { data } = await apiClient.get<SavedBuild[]>('/pcbuilder/configurations');
      setBuilds(data || []);
    } catch {
      // Endpoint may not be implemented on backend yet — show empty state silently
      setBuilds([]);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: string, name: string) => {
    if (!confirm(`Удалить сборку «${name}»?`)) return;

    setDeletingId(id);
    try {
      await apiClient.delete(`/pcbuilder/configurations/${id}`);
      setBuilds((prev) => prev.filter((b) => b.id !== id));
      showToast(`Сборка «${name}» удалена`, 'success');
    } catch {
      showToast('Не удалось удалить сборку', 'error');
    } finally {
      setDeletingId(null);
    }
  };

  const handleShare = async (id: string) => {
    setSharingId(id);
    try {
      const { data } = await apiClient.post<{ shareUrl: string; shareToken: string }>(
        `/pcbuilder/configurations/${id}/share`
      );
      const url = data?.shareUrl || `${window.location.origin}/pc-builder/shared/${data?.shareToken}`;
      await navigator.clipboard.writeText(url);
      showToast('Ссылка скопирована в буфер обмена', 'success');
    } catch {
      showToast('Не удалось создать ссылку', 'error');
    } finally {
      setSharingId(null);
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
    return Object.keys(build.components).filter((k) => build.components[k]).length;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 size={32} className="text-gold animate-spin" />
        <span className="ml-3 text-sm text-muted-text">Загрузка сборок...</span>
      </div>
    );
  }

  return (
    <div>
      {/* Page Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-body-text">Сохранённые сборки</h1>
          <p className="text-sm text-muted-text mt-1">Ваши конфигурации ПК</p>
        </div>
        <Link
          to="/pc-builder"
          className="inline-flex items-center gap-2 bg-gold text-gold-ink px-4 py-2.5 rounded-lg font-semibold text-sm hover:bg-gold-active transition-colors"
        >
          <Cpu size={16} />
          Создать сборку
        </Link>
      </div>

      {/* Builds List */}
      {builds.length === 0 ? (
        <div className="bg-surface-card border border-hairline-dark rounded-xl p-12 text-center">
          <Package size={48} className="text-muted-text mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-body-text mb-2">Нет сохранённых сборок</h3>
          <p className="text-sm text-muted-text mb-6">
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
        <div className="grid gap-4">
          {builds.map((build) => (
            <div
              key={build.id}
              className="bg-surface-card border border-hairline-dark rounded-xl p-5 hover:border-gold/30 transition-colors"
            >
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-3 mb-2">
                    <div className="w-10 h-10 rounded-lg bg-gold/10 flex items-center justify-center shrink-0">
                      <Cpu size={20} className="text-gold" />
                    </div>
                    <div className="min-w-0">
                      <h3 className="text-base font-semibold text-body-text truncate">{build.name}</h3>
                      <div className="flex items-center gap-3 text-xs text-muted-text">
                        {build.purpose && (
                          <span className="bg-surface-elevated px-2 py-0.5 rounded">
                            {PURPOSE_LABELS[build.purpose] || build.purpose}
                          </span>
                        )}
                        <span>{componentCount(build)} компонентов</span>
                        <span>{formatDate(build.createdAt)}</span>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-4 mt-3">
                    <span className="text-lg font-bold text-gold">{formatPrice(build.totalPrice)}</span>
                    <span
                      className={`text-xs font-medium px-2 py-0.5 rounded ${
                        build.isCompatible
                          ? 'bg-[#0ecb81]/10 text-[#0ecb81]'
                          : 'bg-red-500/10 text-red-500'
                      }`}
                    >
                      {build.isCompatible ? 'Совместима' : 'Есть проблемы'}
                    </span>
                  </div>
                </div>

                {/* Actions */}
                <div className="flex items-center gap-2 shrink-0">
                  <Link
                    to={`/pc-builder?config=${build.id}`}
                    className="p-2 rounded-lg text-muted-text hover:text-body-text hover:bg-surface-elevated transition-colors"
                    title="Открыть в конструкторе"
                  >
                    <ExternalLink size={16} />
                  </Link>
                  <button
                    onClick={() => handleShare(build.id)}
                    disabled={sharingId === build.id}
                    className="p-2 rounded-lg text-muted-text hover:text-body-text hover:bg-surface-elevated transition-colors disabled:opacity-50"
                    title="Поделиться"
                  >
                    {sharingId === build.id ? (
                      <Loader2 size={16} className="animate-spin" />
                    ) : (
                      <Share2 size={16} />
                    )}
                  </button>
                  <button
                    onClick={() => handleDelete(build.id, build.name)}
                    disabled={deletingId === build.id}
                    className="p-2 rounded-lg text-muted-text hover:text-red-500 hover:bg-red-500/10 transition-colors disabled:opacity-50"
                    title="Удалить"
                  >
                    {deletingId === build.id ? (
                      <Loader2 size={16} className="animate-spin" />
                    ) : (
                      <Trash2 size={16} />
                    )}
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default AccountSavedBuilds;
