import { useState, useEffect } from 'react';
import { Modal } from '../../ui/Modal/Modal';
import { Button } from '../../ui/Button';
import { useToast } from '../../../hooks/useToast';
import { authService } from '../../../api/authService';
import { Clock, Loader2, Globe, Monitor, CheckCircle2, XCircle } from 'lucide-react';
import type { LoginHistoryItem } from '../../../api/types';

interface LoginHistoryModalProps {
  isOpen: boolean;
  onClose: () => void;
}

/**
 * Пытается извлечь название браузера из User-Agent
 */
function parseBrowser(userAgent: string | null): string {
  if (!userAgent) return 'Неизвестный браузер';
  if (userAgent.includes('Edg/')) return 'Microsoft Edge';
  if (userAgent.includes('Chrome/')) return 'Google Chrome';
  if (userAgent.includes('Firefox/')) return 'Mozilla Firefox';
  if (userAgent.includes('Safari/') && !userAgent.includes('Chrome/')) return 'Safari';
  if (userAgent.includes('Opera') || userAgent.includes('OPR/')) return 'Opera';
  return 'Другой браузер';
}

/**
 * Пытается извлечь ОС из User-Agent
 */
function parseOS(userAgent: string | null): string {
  if (!userAgent) return 'Неизвестная ОС';
  if (userAgent.includes('Windows NT 10')) return 'Windows 10/11';
  if (userAgent.includes('Windows')) return 'Windows';
  if (userAgent.includes('Mac OS X')) return 'macOS';
  if (userAgent.includes('Linux')) return 'Linux';
  if (userAgent.includes('Android')) return 'Android';
  if (userAgent.includes('iPhone') || userAgent.includes('iPad')) return 'iOS';
  return 'Другая ОС';
}

/**
 * Форматирует дату в читаемый вид
 */
function formatDate(dateStr: string): string {
  const date = new Date(dateStr);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);

  if (diffMins < 1) return 'Только что';
  if (diffMins < 60) return `${diffMins} мин. назад`;
  if (diffHours < 24) return `${diffHours} ч. назад`;
  if (diffDays < 7) return `${diffDays} дн. назад`;

  return date.toLocaleDateString('ru-RU', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

export function LoginHistoryModal({ isOpen, onClose }: LoginHistoryModalProps) {
  const { showToast } = useToast();
  const [items, setItems] = useState<LoginHistoryItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [hasMore, setHasMore] = useState(false);

  const pageSize = 10;

  useEffect(() => {
    if (isOpen) {
      setPage(1);
      void loadHistory(1);
    }
  }, [isOpen]);

  const loadHistory = async (pageNum: number) => {
    setLoading(true);
    try {
      const result = await authService.getLoginHistory(pageNum, pageSize);
      setItems(result.items);
      setTotal(result.total);
      setHasMore(result.items.length === pageSize);
    } catch {
      showToast('История входов временно недоступна', 'info');
    } finally {
      setLoading(false);
    }
  };

  const handlePrevPage = () => {
    if (page > 1) {
      const newPage = page - 1;
      setPage(newPage);
      void loadHistory(newPage);
    }
  };

  const handleNextPage = () => {
    if (hasMore) {
      const newPage = page + 1;
      setPage(newPage);
      void loadHistory(newPage);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="История входов" size="large">
      <div className="flex flex-col gap-4">
        {loading && items.length === 0 ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 size={24} className="text-gold animate-spin" />
            <span className="ml-3 text-sm text-muted-text">Загрузка...</span>
          </div>
        ) : items.length === 0 ? (
          <div className="text-center py-12">
            <Clock size={40} className="text-muted-text mx-auto mb-3" />
            <p className="text-sm text-muted-text">История входов пуста</p>
          </div>
        ) : (
          <>
            {/* Summary */}
            <div className="text-xs text-muted-text">
              Всего входов: {total}
            </div>

            {/* Table */}
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="text-xs text-muted-text uppercase tracking-wider border-b border-hairline-dark">
                    <th className="text-left pb-3 pr-4 font-medium">Дата</th>
                    <th className="text-left pb-3 pr-4 font-medium">Устройство</th>
                    <th className="text-left pb-3 pr-4 font-medium">IP-адрес</th>
                    <th className="text-left pb-3 font-medium">Статус</th>
                  </tr>
                </thead>
                <tbody>
                  {items.map((item) => (
                    <tr key={item.id} className="border-b border-hairline-dark/50 last:border-b-0">
                      <td className="py-3 pr-4">
                        <div className="flex items-center gap-2">
                          <Clock size={14} className="text-muted-text shrink-0" />
                          <span className="text-sm text-body-text">{formatDate(item.timestamp)}</span>
                        </div>
                      </td>
                      <td className="py-3 pr-4">
                        <div className="flex items-center gap-2">
                          <Monitor size={14} className="text-muted-text shrink-0" />
                          <div>
                            <div className="text-sm text-body-text">{parseBrowser(item.userAgent)}</div>
                            <div className="text-xs text-muted-text">{parseOS(item.userAgent)}</div>
                          </div>
                        </div>
                      </td>
                      <td className="py-3 pr-4">
                        <div className="flex items-center gap-2">
                          <Globe size={14} className="text-muted-text shrink-0" />
                          <span className="text-sm text-body-text font-mono">{item.ipAddress}</span>
                        </div>
                      </td>
                      <td className="py-3">
                        {item.success ? (
                          <span className="inline-flex items-center gap-1 text-xs text-[#0ecb81]">
                            <CheckCircle2 size={12} />
                            Успешно
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 text-xs text-red-500" title={item.failureReason || ''}>
                            <XCircle size={12} />
                            Ошибка
                          </span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Pagination */}
            <div className="flex items-center justify-between pt-2">
              <span className="text-xs text-muted-text">
                Страница {page}
              </span>
              <div className="flex gap-2">
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={handlePrevPage}
                  disabled={page <= 1}
                >
                  ← Назад
                </Button>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={handleNextPage}
                  disabled={!hasMore}
                >
                  Далее →
                </Button>
              </div>
            </div>
          </>
        )}
      </div>
    </Modal>
  );
}

export default LoginHistoryModal;
