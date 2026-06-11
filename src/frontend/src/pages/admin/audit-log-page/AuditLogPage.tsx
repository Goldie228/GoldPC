/**
 * Страница журнала аудита (Admin)
 * Таблица действий с фильтрами, пагинацией и экспортом.
 * Все стили через DESIGN.md токены (gold, surface-card, hairline-dark и т.д.)
 */

import { useState, useEffect, useCallback } from 'react';
import { useToast } from '@/hooks/useToast';
import { auditLogApi, type AuditActionType, type AuditLogEntry } from '@/api/admin';
import {
  RefreshCw,
  Loader2,
  ChevronLeft,
  ChevronRight,
  Download,
  ScrollText,
  AlertTriangle,
  ShieldAlert,
  Info,
} from 'lucide-react';

/* ======== Константы ======== */

const ACTION_LABELS: Record<AuditActionType, string> = {
  USER_CREATED: 'Создан пользователь',
  USER_UPDATED: 'Обновлён пользователь',
  USER_DELETED: 'Удалён пользователь',
  USER_ROLE_CHANGED: 'Изменена роль',
  USER_LOGIN: 'Вход в систему',
  USER_ACTIVATED: 'Активирован',
  USER_LOGOUT: 'Выход из системы',
  SETTINGS_UPDATED: 'Настройки',
  PRODUCT_CREATED: 'Создан товар',
  PRODUCT_UPDATED: 'Обновлён товар',
  PRODUCT_DELETED: 'Удалён товар',
  ORDER_STATUS_CHANGED: 'Статус заказа',
  MAINTENANCE_MODE_ENABLED: 'Обслуживание ВКЛ',
  MAINTENANCE_MODE_DISABLED: 'Обслуживание ВЫКЛ',
  SECURITY_EVENT: 'Безопасность',
};

const SEVERITY_CONFIG = {
  INFO: { label: 'Инфо', icon: Info, bg: 'bg-info-blue/10', text: 'text-info-blue' },
  WARNING: { label: 'Внимание', icon: AlertTriangle, bg: 'bg-gold/10', text: 'text-gold' },
  CRITICAL: { label: 'Критично', icon: ShieldAlert, bg: 'bg-price-rise/10', text: 'text-price-rise' },
} as const;

const PAGE_SIZE_OPTIONS = [10, 25, 50, 100] as const;

/* ======== Компонент ======== */

export function AuditLogPage() {
  const { showToast } = useToast();
  const [logs, setLogs] = useState<AuditLogEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState<number>(25);
  const [totalPages, setTotalPages] = useState(1);
  const [totalItems, setTotalItems] = useState(0);
  const [actionFilter, setActionFilter] = useState<AuditActionType | ''>('');
  const [severityFilter, setSeverityFilter] = useState<string>('');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');

  const fetchAuditLogs = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const params: Record<string, unknown> = { page, pageSize };
      if (actionFilter) params.actionType = actionFilter;
      if (severityFilter) params.severity = severityFilter;
      if (dateFrom) params.startDate = dateFrom;
      if (dateTo) params.endDate = dateTo;

      const result = await auditLogApi.getLogs(params);
      setLogs(result.data);
      setTotalItems(result.meta.totalItems);
      setTotalPages(result.meta.totalPages);
    } catch {
      setError('Не удалось загрузить журнал аудита. Попробуйте позже.');
    } finally {
      setLoading(false);
    }
  }, [page, pageSize, actionFilter, severityFilter, dateFrom, dateTo]);

  useEffect(() => {
    void fetchAuditLogs();
  }, [fetchAuditLogs]);

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString('ru-RU', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
    });
  };

  const handleRefresh = () => {
    void fetchAuditLogs();
  };

  const handleExport = async () => {
    try {
      // Fetch ALL logs for export (no pagination)
      const params: Record<string, unknown> = { page: 1, pageSize: 10000 };
      if (actionFilter) params.actionType = actionFilter;
      if (severityFilter) params.severity = severityFilter;
      if (dateFrom) params.startDate = dateFrom;
      if (dateTo) params.endDate = dateTo;

      const result = await auditLogApi.getLogs(params);
      const rows = result.data;

      if (rows.length === 0) {
        showToast('Нет данных для экспорта', 'info');
        return;
      }

      // BOM for Excel Cyrillic support
      const BOM = '\uFEFF';
      const header = 'Время;Действие;Пользователь;Email;IP адрес;Описание;Важность';
      const csvRows = rows.map((r) => {
        const date = new Date(r.createdAt).toLocaleString('ru-RU');
        const action = ACTION_LABELS[r.actionType] ?? r.actionType;
        const severity = SEVERITY_CONFIG[r.severity]?.label ?? r.severity;
        const escape = (s: string) => `"${s.replace(/"/g, '""')}"`;
        return [
          date,
          escape(action),
          escape(r.userName),
          escape(r.userEmail),
          escape(r.ipAddress || '—'),
          escape(r.description),
          escape(severity),
        ].join(';');
      });

      const csv = BOM + header + '\n' + csvRows.join('\n');
      const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `audit-log_${new Date().toISOString().slice(0, 10)}.csv`;
      link.click();
      URL.revokeObjectURL(url);

      showToast(`Экспортировано ${rows.length} записей`, 'success');
    } catch {
      showToast('Ошибка экспорта. Попробуйте позже.', 'error');
    }
  };

  const resetFilters = () => {
    setActionFilter('');
    setSeverityFilter('');
    setDateFrom('');
    setDateTo('');
    setPage(1);
  };

  const hasFilters = actionFilter || severityFilter || dateFrom || dateTo;

  const getPageNumbers = (): number[] => {
    if (totalPages <= 5) {
      return Array.from({ length: totalPages }, (_, i) => i + 1);
    }
    if (page <= 3) {
      return [1, 2, 3, 4, 5];
    }
    if (page >= totalPages - 2) {
      return Array.from({ length: 5 }, (_, i) => totalPages - 4 + i);
    }
    return [page - 2, page - 1, page, page + 1, page + 2];
  };

  /* ————— Рендер ————— */

  return (
    <div className="min-h-screen bg-canvas-dark p-6">
      <div className="mx-auto max-w-7xl space-y-6">
        {/* ===== Заголовок страницы ===== */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <ScrollText className="h-6 w-6 text-gold" />
            <div>
              <h1 className="text-lg font-semibold text-body-text">
                Журнал аудита
              </h1>
              <p className="text-xs text-muted-foreground">
                История всех административных действий и событий безопасности
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={handleExport}
              className="flex items-center gap-2 bg-surface-card text-body-text hover:bg-surface-elevated rounded-md px-4 py-2 text-sm font-semibold transition-colors"
            >
              <Download className="h-4 w-4" />
              Экспорт CSV
            </button>
            <button
              onClick={handleRefresh}
              className="flex items-center gap-2 bg-gold text-gold-ink hover:bg-gold-active rounded-md px-4 py-2 text-sm font-semibold transition-colors"
            >
              <RefreshCw className="h-4 w-4" />
              Обновить
            </button>
          </div>
        </div>

        {/* ===== Статистика ===== */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="bg-surface-card rounded-xl p-5 border border-hairline-dark">
            <span className="block text-2xl font-bold text-gold font-[family-name:var(--font-mono)]">
              {totalItems.toLocaleString('ru-RU')}
            </span>
            <span className="text-xs text-muted-foreground mt-1 block">Всего записей</span>
          </div>
          <div className="bg-surface-card rounded-xl p-5 border border-hairline-dark">
            <span className="block text-2xl font-bold text-gold font-[family-name:var(--font-mono)]">
              {logs.filter((l) => l.severity === 'WARNING').length}
            </span>
            <span className="text-xs text-muted-foreground mt-1 block">Предупреждений</span>
          </div>
          <div className="bg-surface-card rounded-xl p-5 border border-hairline-dark">
            <span className="block text-2xl font-bold text-price-rise font-[family-name:var(--font-mono)]">
              {logs.filter((l) => l.severity === 'CRITICAL').length}
            </span>
            <span className="text-xs text-muted-foreground mt-1 block">Критических событий</span>
          </div>
        </div>

        {/* ===== Основная карточка ===== */}
        <div className="bg-surface-card rounded-xl border border-hairline-dark overflow-hidden">
          {/* ===== Фильтры ===== */}
          <div className="flex flex-wrap items-end gap-4 p-5 border-b border-hairline-dark">
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
                Действие
              </label>
              <select
                value={actionFilter}
                onChange={(e) => {
                  setActionFilter(e.target.value as AuditActionType | '');
                  setPage(1);
                }}
                className="bg-surface-card border border-hairline-dark rounded-md px-3 py-2 text-sm text-body-text focus:border-gold focus:ring-1 focus:ring-gold outline-none cursor-pointer min-w-[170px]"
              >
                <option value="">Все действия</option>
                {Object.entries(ACTION_LABELS).map(([value, label]) => (
                  <option key={value} value={value}>
                    {label}
                  </option>
                ))}
              </select>
            </div>

            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
                Важность
              </label>
              <select
                value={severityFilter}
                onChange={(e) => {
                  setSeverityFilter(e.target.value);
                  setPage(1);
                }}
                className="bg-surface-card border border-hairline-dark rounded-md px-3 py-2 text-sm text-body-text focus:border-gold focus:ring-1 focus:ring-gold outline-none cursor-pointer min-w-[140px]"
              >
                <option value="">Все уровни</option>
                <option value="INFO">Информация</option>
                <option value="WARNING">Предупреждение</option>
                <option value="CRITICAL">Критический</option>
              </select>
            </div>

            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
                С
              </label>
              <input
                type="date"
                value={dateFrom}
                onChange={(e) => {
                  setDateFrom(e.target.value);
                  setPage(1);
                }}
                className="bg-surface-card border border-hairline-dark rounded-md px-3 py-2 text-sm text-body-text focus:border-gold focus:ring-1 focus:ring-gold outline-none [color-scheme:dark]"
              />
            </div>

            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
                По
              </label>
              <input
                type="date"
                value={dateTo}
                onChange={(e) => {
                  setDateTo(e.target.value);
                  setPage(1);
                }}
                className="bg-surface-card border border-hairline-dark rounded-md px-3 py-2 text-sm text-body-text focus:border-gold focus:ring-1 focus:ring-gold outline-none [color-scheme:dark]"
              />
            </div>

            {hasFilters && (
              <button
                onClick={resetFilters}
                className="bg-surface-card text-body-text hover:bg-surface-elevated border border-hairline-dark rounded-md px-4 py-2 text-sm font-semibold transition-colors"
              >
                Сбросить
              </button>
            )}

            <div className="ml-auto flex items-center gap-2">
              <label className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
                На странице
              </label>
              <select
                value={pageSize}
                onChange={(e) => {
                  setPageSize(Number(e.target.value));
                  setPage(1);
                }}
                className="bg-surface-card border border-hairline-dark rounded-md px-2 py-2 text-sm text-body-text focus:border-gold focus:ring-1 focus:ring-gold outline-none cursor-pointer"
              >
                {PAGE_SIZE_OPTIONS.map((size) => (
                  <option key={size} value={size}>
                    {size}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* ===== Состояние: загрузка ===== */}
          {loading && (
            <div className="flex flex-col items-center justify-center py-16 text-center">
              <div className="h-8 w-8 border-2 border-hairline-dark border-t-gold rounded-full animate-spin" />
              <p className="mt-4 text-sm text-muted-foreground">Загрузка журнала...</p>
            </div>
          )}

          {/* ===== Состояние: ошибка ===== */}
          {!loading && error && (
            <div className="flex flex-col items-center justify-center py-16 text-center">
              <p className="text-sm text-price-rise">{error}</p>
              <button
                onClick={() => void fetchAuditLogs()}
                className="mt-4 bg-surface-card text-body-text hover:bg-surface-elevated rounded-md px-4 py-2 text-sm font-semibold"
              >
                Попробовать снова
              </button>
            </div>
          )}

          {/* ===== Состояние: пусто ===== */}
          {!loading && !error && logs.length === 0 && (
            <div className="flex flex-col items-center justify-center py-16 text-center">
              <ScrollText className="h-12 w-12 text-muted-foreground mb-4" />
              <p className="text-body-text">Журнал аудита пуст</p>
              {hasFilters && (
                <button
                  onClick={resetFilters}
                  className="mt-4 bg-surface-card text-body-text hover:bg-surface-elevated rounded-md px-4 py-2 text-sm font-semibold"
                >
                  Сбросить фильтры
                </button>
              )}
            </div>
          )}

          {/* ===== Таблица ===== */}
          {!loading && !error && logs.length > 0 && (
            <div className="overflow-x-auto">
              <table className="w-full border-collapse">
                <thead>
                  <tr>
                    <th className="bg-surface-card text-xs font-medium text-muted-foreground uppercase tracking-wider py-3 px-4 text-left border-b border-hairline-dark">
                      Время
                    </th>
                    <th className="bg-surface-card text-xs font-medium text-muted-foreground uppercase tracking-wider py-3 px-4 text-left border-b border-hairline-dark">
                      Действие
                    </th>
                    <th className="bg-surface-card text-xs font-medium text-muted-foreground uppercase tracking-wider py-3 px-4 text-left border-b border-hairline-dark">
                      Пользователь
                    </th>
                    <th className="bg-surface-card text-xs font-medium text-muted-foreground uppercase tracking-wider py-3 px-4 text-left border-b border-hairline-dark">
                      IP адрес
                    </th>
                    <th className="bg-surface-card text-xs font-medium text-muted-foreground uppercase tracking-wider py-3 px-4 text-left border-b border-hairline-dark">
                      Описание
                    </th>
                    <th className="bg-surface-card text-xs font-medium text-muted-foreground uppercase tracking-wider py-3 px-4 text-left border-b border-hairline-dark">
                      Важность
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {logs.map((entry, idx) => {
                    const severity = SEVERITY_CONFIG[entry.severity];
                    const SeverityIcon = severity.icon;
                    return (
                      <tr
                        key={entry.id}
                        className={`${idx % 2 === 0 ? '' : 'bg-surface-card/50'}`}
                      >
                        {/* Время */}
                        <td className="py-3 px-4 text-sm text-body-text border-b border-hairline-dark">
                          <span className="font-[family-name:var(--font-mono)] text-xs text-muted-foreground">
                            {formatDate(entry.createdAt)}
                          </span>
                        </td>

                        {/* Действие */}
                        <td className="py-3 px-4 text-sm text-body-text border-b border-hairline-dark">
                          <span className="inline-flex items-center px-2 py-0.5 text-xs font-medium rounded bg-surface-elevated text-body-text">
                            {ACTION_LABELS[entry.actionType]}
                          </span>
                        </td>

                        {/* Пользователь */}
                        <td className="py-3 px-4 text-sm text-body-text border-b border-hairline-dark">
                          <div className="min-w-0">
                            <div className="font-medium truncate">{entry.userName}</div>
                            <div className="text-xs text-muted-foreground truncate">
                              {entry.userEmail}
                            </div>
                          </div>
                        </td>

                        {/* IP */}
                        <td className="py-3 px-4 text-sm text-body-text border-b border-hairline-dark">
                          <span className="font-[family-name:var(--font-mono)] text-xs text-muted-foreground">
                            {entry.ipAddress || '—'}
                          </span>
                        </td>

                        {/* Описание */}
                        <td className="py-3 px-4 text-sm text-body-text border-b border-hairline-dark max-w-[300px] truncate">
                          {entry.description}
                        </td>

                        {/* Важность */}
                        <td className="py-3 px-4 text-sm text-body-text border-b border-hairline-dark">
                          <span
                            className={`inline-flex items-center gap-1 px-2 py-0.5 text-xs font-medium rounded ${severity.bg} ${severity.text}`}
                          >
                            <SeverityIcon className="h-3 w-3" />
                            {severity.label}
                          </span>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* ===== Пагинация ===== */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between">
            <span className="text-xs text-muted-foreground">
              Показано {((page - 1) * pageSize) + 1}–{Math.min(page * pageSize, totalItems)} из{' '}
              {totalItems} записей
            </span>
            <div className="flex items-center gap-1">
              <button
                onClick={() => setPage(page - 1)}
                disabled={page === 1}
                className="p-2 rounded-md text-muted-foreground hover:text-body-text hover:bg-surface-elevated disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
              >
                <ChevronLeft className="h-4 w-4" />
              </button>
              {getPageNumbers().map((num) => (
                <button
                  key={num}
                  onClick={() => setPage(num)}
                  className={`min-w-[32px] h-8 rounded-md text-sm font-medium transition-colors ${
                    page === num
                      ? 'bg-gold text-gold-ink'
                      : 'text-muted-foreground hover:text-body-text hover:bg-surface-elevated'
                  }`}
                >
                  {num}
                </button>
              ))}
              <button
                onClick={() => setPage(page + 1)}
                disabled={page === totalPages}
                className="p-2 rounded-md text-muted-foreground hover:text-body-text hover:bg-surface-elevated disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
              >
                <ChevronRight className="h-4 w-4" />
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default AuditLogPage;
