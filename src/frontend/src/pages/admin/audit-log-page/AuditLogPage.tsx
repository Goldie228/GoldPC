/**
 * Страница журнала аудита
 * Отображение всех административных действий и событий безопасности
 */

import { useState, useEffect, useCallback } from 'react';

// === Типы ===

export type AuditActionType =
  | 'USER_CREATED'
  | 'USER_UPDATED'
  | 'USER_DELETED'
  | 'USER_ROLE_CHANGED'
  | 'USER_LOGIN'
  | 'USER_LOGOUT'
  | 'USER_IMPERSONATED'
  | 'SETTINGS_UPDATED'
  | 'PRODUCT_CREATED'
  | 'PRODUCT_UPDATED'
  | 'PRODUCT_DELETED'
  | 'ORDER_STATUS_CHANGED'
  | 'MAINTENANCE_MODE_ENABLED'
  | 'MAINTENANCE_MODE_DISABLED'
  | 'SECURITY_EVENT';

export interface AuditLogEntry {
  id: string;
  actionType: AuditActionType;
  userId: string;
  userName: string;
  userEmail: string;
  ipAddress: string;
  userAgent: string;
  description: string;
  additionalData?: Record<string, unknown>;
  createdAt: string;
  severity: 'INFO' | 'WARNING' | 'CRITICAL';
}

export interface GetAuditLogParams {
  page?: number;
  pageSize?: number;
  actionType?: AuditActionType;
  userId?: string;
  startDate?: string;
  endDate?: string;
  severity?: string;
}

const ACTION_LABELS: Record<AuditActionType, string> = {
  USER_CREATED: 'Создан пользователь',
  USER_UPDATED: 'Обновлён пользователь',
  USER_DELETED: 'Удалён пользователь',
  USER_ROLE_CHANGED: 'Изменена роль пользователя',
  USER_LOGIN: 'Вход в систему',
  USER_LOGOUT: 'Выход из системы',
  USER_IMPERSONATED: 'Имpersonation пользователя',
  SETTINGS_UPDATED: 'Обновлены настройки системы',
  PRODUCT_CREATED: 'Создан товар',
  PRODUCT_UPDATED: 'Обновлён товар',
  PRODUCT_DELETED: 'Удалён товар',
  ORDER_STATUS_CHANGED: 'Изменён статус заказа',
  MAINTENANCE_MODE_ENABLED: 'Включён режим обслуживания',
  MAINTENANCE_MODE_DISABLED: 'Выключен режим обслуживания',
  SECURITY_EVENT: 'Событие безопасности',
};

const SEVERITY_COLORS = {
  INFO: 'severity-info',
  WARNING: 'severity-warning',
  CRITICAL: 'severity-critical',
};

const SEVERITY_LABELS = {
  INFO: 'Информация',
  WARNING: 'Предупреждение',
  CRITICAL: 'Критический',
};

/**
 * Страница журнала аудита
 */
export function AuditLogPage() {
  const [logs, setLogs] = useState<AuditLogEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [page, setPage] = useState(1);
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
      // Имитация данных - в реальном приложении заменить на API вызов
      await new Promise(resolve => setTimeout(resolve, 800));

      // Демо данные
      const mockLogs: AuditLogEntry[] = [
        {
          id: '1',
          actionType: 'USER_LOGIN',
          userId: 'usr-001',
          userName: 'Иван Петров',
          userEmail: 'ivan@example.com',
          ipAddress: '192.168.1.100',
          userAgent: 'Chrome 123.0 / Windows 10',
          description: 'Успешный вход в систему',
          createdAt: new Date(Date.now() - 5 * 60 * 1000).toISOString(),
          severity: 'INFO',
        },
        {
          id: '2',
          actionType: 'USER_ROLE_CHANGED',
          userId: 'usr-002',
          userName: 'Администратор',
          userEmail: 'admin@goldpc.by',
          ipAddress: '10.0.0.5',
          userAgent: 'Firefox 124.0 / macOS',
          description: 'Изменена роль пользователя usr-045 с Client на Manager',
          additionalData: { oldRole: 'Client', newRole: 'Manager', targetUserId: 'usr-045' },
          createdAt: new Date(Date.now() - 25 * 60 * 1000).toISOString(),
          severity: 'WARNING',
        },
        {
          id: '3',
          actionType: 'SETTINGS_UPDATED',
          userId: 'usr-002',
          userName: 'Администратор',
          userEmail: 'admin@goldpc.by',
          ipAddress: '10.0.0.5',
          userAgent: 'Firefox 124.0 / macOS',
          description: 'Обновлены параметры системы: deliveryCost изменён с 7.00 на 8.50 BYN',
          createdAt: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
          severity: 'INFO',
        },
        {
          id: '4',
          actionType: 'SECURITY_EVENT',
          userId: 'usr-999',
          userName: 'Неизвестный',
          userEmail: 'unknown',
          ipAddress: '185.220.101.34',
          userAgent: 'Unknown',
          description: 'Неудачная попытка входа: 5 неудачных попыток за 10 минут',
          createdAt: new Date(Date.now() - 3 * 60 * 60 * 1000).toISOString(),
          severity: 'CRITICAL',
        },
        {
          id: '5',
          actionType: 'PRODUCT_UPDATED',
          userId: 'usr-003',
          userName: 'Менеджер Каталога',
          userEmail: 'catalog@goldpc.by',
          ipAddress: '10.0.0.12',
          userAgent: 'Edge 123.0 / Windows 11',
          description: 'Обновлён товар RTX 4090: цена изменена с 12500.00 на 12900.00 BYN',
          createdAt: new Date(Date.now() - 4 * 60 * 60 * 1000).toISOString(),
          severity: 'INFO',
        },
        {
          id: '6',
          actionType: 'USER_DELETED',
          userId: 'usr-002',
          userName: 'Администратор',
          userEmail: 'admin@goldpc.by',
          ipAddress: '10.0.0.5',
          userAgent: 'Firefox 124.0 / macOS',
          description: 'Удалён пользователь usr-123 (test@example.com)',
          createdAt: new Date(Date.now() - 5 * 60 * 60 * 1000).toISOString(),
          severity: 'WARNING',
        },
        {
          id: '7',
          actionType: 'MAINTENANCE_MODE_ENABLED',
          userId: 'usr-002',
          userName: 'Администратор',
          userEmail: 'admin@goldpc.by',
          ipAddress: '10.0.0.5',
          userAgent: 'Firefox 124.0 / macOS',
          description: 'Включён режим обслуживания системы',
          createdAt: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(),
          severity: 'WARNING',
        },
      ];

      setLogs(mockLogs);
      setTotalItems(mockLogs.length);
      setTotalPages(1);
    } catch (err) {
      setError('Не удалось загрузить журнал аудита. Попробуйте позже.');
      console.error('Failed to fetch audit logs:', err);
    } finally {
      setLoading(false);
    }
  }, [page, actionFilter, severityFilter, dateFrom, dateTo]);

  useEffect(() => {
    fetchAuditLogs();
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
    fetchAuditLogs();
  };

  const handleExport = () => {
    alert('Экспорт журнала аудита будет реализован в следующей версии');
  };

  return (
    <div className="staff-page">
      <header className="flex justify-between items-center mb-6 staff-page__header">
        <div>
          <h1 className="text-2xl font-semibold text-gray-900 staff-page__title">Журнал аудита</h1>
          <p className="text-sm text-gray-600 staff-page__subtitle">
            История всех административных действий и событий безопасности
          </p>
        </div>
        <div className="flex gap-3">
          <button
            className="flex items-center gap-2 px-4 py-2 bg-gray-100 text-gray-800 rounded-lg text-sm font-medium hover:bg-gray-200 transition-colors"
            onClick={handleExport}
          >
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
              <polyline points="7 10 12 15 17 10"/>
              <line x1="12" y1="15" x2="12" y2="3"/>
            </svg>
            Экспорт CSV
          </button>
          <button
            className="flex items-center gap-2 px-4 py-2 bg-blue-500 text-white rounded-lg text-sm font-medium hover:bg-blue-600 transition-colors"
            onClick={handleRefresh}
          >
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M23 4v6h-6M1 20v-6h6"/>
              <path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15"/>
            </svg>
            Обновить
          </button>
        </div>
      </header>

       {/* Stats Bar */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <div className="bg-white rounded-xl p-4 shadow-sm">
          <span className="block text-3xl font-bold text-gray-900">{totalItems.toLocaleString('ru-RU')}</span>
          <span className="text-sm text-gray-600">Всего записей</span>
        </div>
        <div className="bg-white rounded-xl p-4 shadow-sm">
          <span className="block text-3xl font-bold text-gray-900">{logs.filter(l => l.severity === 'WARNING').length}</span>
          <span className="text-sm text-gray-600">Предупреждений</span>
        </div>
        <div className="bg-white rounded-xl p-4 shadow-sm">
          <span className="block text-3xl font-bold text-gray-900">{logs.filter(l => l.severity === 'CRITICAL').length}</span>
          <span className="text-sm text-gray-600">Критических событий</span>
        </div>
      </div>

       {/* Filters */}
      <div className="flex flex-wrap gap-4 mb-6 items-end">
        <div className="flex flex-col gap-1">
          <label className="text-xs font-medium text-gray-600">Действие</label>
          <select
            className="px-3 py-2 border border-gray-200 rounded-lg text-sm min-w-[160px]"
            value={actionFilter}
            onChange={(e) => {
              setActionFilter(e.target.value as AuditActionType | '');
              setPage(1);
            }}
          >
            <option value="">Все действия</option>
            {Object.entries(ACTION_LABELS).map(([value, label]) => (
              <option key={value} value={value}>{label}</option>
            ))}
          </select>
        </div>

        <div className="flex flex-col gap-1">
          <label className="text-xs font-medium text-gray-600">Важность</label>
          <select
            className="px-3 py-2 border border-gray-200 rounded-lg text-sm min-w-[160px]"
            value={severityFilter}
            onChange={(e) => {
              setSeverityFilter(e.target.value);
              setPage(1);
            }}
          >
            <option value="">Все уровни</option>
            {Object.entries(SEVERITY_LABELS).map(([value, label]) => (
              <option key={value} value={value}>{label}</option>
            ))}
          </select>
        </div>

        <div className="flex flex-col gap-1">
          <label className="text-xs font-medium text-gray-600">С</label>
          <input
            type="date"
            className="px-3 py-2 border border-gray-200 rounded-lg text-sm"
            value={dateFrom}
            onChange={(e) => {
              setDateFrom(e.target.value);
              setPage(1);
            }}
          />
        </div>

        <div className="flex flex-col gap-1">
          <label className="text-xs font-medium text-gray-600">По</label>
          <input
            type="date"
            className="px-3 py-2 border border-gray-200 rounded-lg text-sm"
            value={dateTo}
            onChange={(e) => {
              setDateTo(e.target.value);
              setPage(1);
            }}
          />
        </div>

        <button
          className="px-4 py-2 border border-gray-200 bg-white rounded-lg text-sm hover:bg-gray-50 transition-colors"
          onClick={() => {
            setActionFilter('');
            setSeverityFilter('');
            setDateFrom('');
            setDateTo('');
            setPage(1);
          }}
        >
          Сбросить
        </button>
      </div>

      {loading && (
        <div className="flex flex-col items-center justify-center py-12 text-gray-600">
          <div className="w-10 h-10 border-2 border-gray-200 border-t-blue-500 rounded-full animate-spin mb-4"></div>
          <p>Загрузка журнала...</p>
        </div>
      )}

      {error && (
        <div className="text-center py-12 text-red-600">
          <p>{error}</p>
          <button onClick={fetchAuditLogs} className="mt-4 px-4 py-2 bg-blue-500 text-white rounded-lg text-sm hover:bg-blue-600 transition-colors">
            Попробовать снова
          </button>
        </div>
      )}

      {!loading && !error && (
        <div className="bg-white rounded-xl shadow-sm overflow-hidden">
          <table className="w-full border-collapse">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-200">
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wide">Время</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wide">Действие</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wide">Ползователь</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wide">IP адрес</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wide">Описание</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wide">Важность</th>
              </tr>
            </thead>
            <tbody>
              {logs.map((entry) => (
                <tr key={entry.id} className={
                  entry.severity === 'INFO' ? 'bg-green-50' :
                  entry.severity === 'WARNING' ? 'bg-orange-50' : 'bg-red-50'
                }>
                  <td>
                    <span className="font-mono text-xs text-gray-600">{formatDate(entry.createdAt)}</span>
                  </td>
                  <td>
                    <span className="inline-block px-2 py-1 bg-blue-50 text-blue-700 rounded-md text-xs font-medium">
                      {ACTION_LABELS[entry.actionType]}
                    </span>
                  </td>
                  <td>
                    <div className="flex flex-col gap-0.5">
                      <span className="font-medium text-gray-900">{entry.userName}</span>
                      <span className="text-xs text-gray-600">{entry.userEmail}</span>
                    </div>
                  </td>
                  <td>
                    <span className="font-mono text-xs text-gray-700">{entry.ipAddress}</span>
                  </td>
                  <td>
                    <span className="text-gray-800 text-sm">{entry.description}</span>
                  </td>
                  <td>
                    <span className={`inline-block px-2 py-1 rounded-md text-xs font-semibold ${
                      entry.severity === 'INFO' ? 'bg-green-100 text-green-800' :
                      entry.severity === 'WARNING' ? 'bg-orange-100 text-orange-800' : 'bg-red-100 text-red-800'
                    }`}>
                      {SEVERITY_LABELS[entry.severity]}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {totalPages > 1 && (
        <div className="flex justify-between items-center mt-6 py-4">
          <span className="text-sm text-gray-600">
            Показано {((page - 1) * 20) + 1}-{Math.min(page * 20, totalItems)} из {totalItems} записей
          </span>
          <div className="flex gap-2">
            <button
              className="px-3 py-2 border border-gray-200 bg-white rounded-md text-sm hover:bg-gray-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              disabled={page === 1}
              onClick={() => setPage(page - 1)}
            >
              ←
            </button>
            {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
              let pageNum: number;
              if (totalPages <= 5) {
                pageNum = i + 1;
              } else if (page <= 3) {
                pageNum = i + 1;
              } else if (page >= totalPages - 2) {
                pageNum = totalPages - 4 + i;
              } else {
                pageNum = page - 2 + i;
              }
              return (
                <button
                  key={pageNum}
                  className={`px-3 py-2 border rounded-md text-sm transition-colors ${
                    page === pageNum
                      ? 'bg-blue-500 text-white border-blue-500'
                      : 'border-gray-200 bg-white hover:bg-gray-50'
                  }`}
                  onClick={() => setPage(pageNum)}
                >
                  {pageNum}
                </button>
              );
            })}
            <button
              className="px-3 py-2 border border-gray-200 bg-white rounded-md text-sm hover:bg-gray-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              disabled={page === totalPages}
              onClick={() => setPage(page + 1)}
            >
              →
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

export default AuditLogPage;
