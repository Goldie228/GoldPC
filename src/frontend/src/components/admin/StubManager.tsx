import React, { useState, useEffect, useCallback } from 'react';
import './StubManager.css';

/**
 * Режим работы заглушки
 */
type StubMode = 'Normal' | 'Slow' | 'Failing' | 'Unstable';

/**
 * Конфигурация Chaos Engineering
 */
interface ChaosConfig {
  failureRate: number;
  latencyRate: number;
  maxLatencyMs?: number;
}

/**
 * Определение заглушки
 */
interface Stub {
  name: string;
  serviceName: string;
  mode: StubMode;
  chaos?: ChaosConfig;
}

/**
 * API ответ для обновления заглушки
 */
interface StubUpdateRequest {
  mode: StubMode;
  chaos?: ChaosConfig;
}

/**
 * Статусы режимов для отображения
 */
const MODE_LABELS: Record<StubMode, string> = {
  Normal: '🟢 Нормальный',
  Slow: '🟡 Медленный',
  Failing: '🔴 Ошибки',
  Unstable: '🟠 Нестабильный',
};

/**
 * Описания режимов
 */
const MODE_DESCRIPTIONS: Record<StubMode, string> = {
  Normal: 'Обычная работа сервиса',
  Slow: 'Медленные ответы (имитация нагрузки)',
  Failing: 'Возвращает ошибки (тестирование отказоустойчивости)',
  Unstable: 'Случайное поведение (chaos engineering)',
};

/**
 * Компонент для управления заглушками и Chaos Engineering
 * Позволяет переключать режимы работы сервисов через UI
 */
export const StubManager: React.FC = () => {
  const [stubs, setStubs] = useState<Stub[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [updating, setUpdating] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  /**
   * Загрузка списка заглушек с API
   */
  const fetchStubs = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await fetch('/api/internal/stubs');
      
      if (!response.ok) {
        throw new Error(`Ошибка загрузки: ${response.status} ${response.statusText}`);
      }
      
      const data: Stub[] = await response.json();
      setStubs(Array.isArray(data) ? data : []);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Неизвестная ошибка';
      setError(errorMessage);
      console.error('Ошибка при загрузке заглушек:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  /**
   * Обновление режима заглушки
   */
  const updateStub = useCallback(async (name: string, mode: StubMode) => {
    try {
      setUpdating(name);
      setError(null);
      setSuccessMessage(null);
      
      const updateData: StubUpdateRequest = { mode };
      
      const response = await fetch(`/api/internal/stubs/${encodeURIComponent(name)}`, {
        method: 'PATCH',
        headers: { 
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(updateData),
      });
      
      if (!response.ok) {
        throw new Error(`Ошибка обновления: ${response.status} ${response.statusText}`);
      }
      
      // Обновляем локальное состояние
      setStubs(prevStubs => 
        prevStubs.map(stub => 
          stub.name === name ? { ...stub, mode } : stub
        )
      );
      
      setSuccessMessage(`Режим сервиса "${name}" изменен на "${MODE_LABELS[mode]}"`);
      
      // Скрываем сообщение об успехе через 3 секунды
      setTimeout(() => setSuccessMessage(null), 3000);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Неизвестная ошибка';
      setError(`Ошибка при обновлении "${name}": ${errorMessage}`);
      console.error('Ошибка при обновлении заглушки:', err);
    } finally {
      setUpdating(null);
    }
  }, []);

  /**
   * Загрузка данных при монтировании компонента
   */
  useEffect(() => {
    fetchStubs();
  }, [fetchStubs]);

  /**
   * Рендер состояния загрузки
   */
  if (loading) {
    return (
      <div className="stub-manager stub-manager--loading">
        <div className="stub-manager__spinner" />
        <p>Загрузка данных о заглушках...</p>
      </div>
    );
  }

  return (
    <div className="stub-manager">
      <div className="stub-manager__header">
        <h1 className="stub-manager__title">
          🎛️ Stub Manager
        </h1>
        <p className="stub-manager__subtitle">
          Управление заглушками и Chaos Engineering для тестирования
        </p>
      </div>

      {error && (
        <div className="stub-manager__alert stub-manager__alert--error">
          <span className="stub-manager__alert-icon">⚠️</span>
          <span>{error}</span>
          <button 
            className="stub-manager__alert-close"
            onClick={() => setError(null)}
            aria-label="Закрыть"
          >
            ×
          </button>
        </div>
      )}

      {successMessage && (
        <div className="stub-manager__alert stub-manager__alert--success">
          <span className="stub-manager__alert-icon">✅</span>
          <span>{successMessage}</span>
        </div>
      )}

      <div className="stub-manager__content">
        <div className="stub-manager__stats">
          <div className="stub-manager__stat">
            <span className="stub-manager__stat-value">{stubs.length}</span>
            <span className="stub-manager__stat-label">Сервисов</span>
          </div>
          <div className="stub-manager__stat">
            <span className="stub-manager__stat-value">
              {stubs.filter(s => s.mode === 'Normal').length}
            </span>
            <span className="stub-manager__stat-label">Нормальных</span>
          </div>
          <div className="stub-manager__stat">
            <span className="stub-manager__stat-value">
              {stubs.filter(s => s.mode !== 'Normal').length}
            </span>
            <span className="stub-manager__stat-label">В режиме тестирования</span>
          </div>
        </div>

        {stubs.length === 0 ? (
          <div className="stub-manager__empty">
            <span className="stub-manager__empty-icon">📭</span>
            <p>Нет зарегистрированных заглушек</p>
            <p className="stub-manager__empty-hint">
              Убедитесь, что бэкенд сервис запущен и доступен
            </p>
          </div>
        ) : (
          <div className="stub-manager__table-container">
            <table className="stub-manager__table">
              <thead>
                <tr>
                  <th>Сервис</th>
                  <th>Имя заглушки</th>
                  <th>Текущий режим</th>
                  <th>Действия</th>
                </tr>
              </thead>
              <tbody>
                {stubs.map((stub) => (
                  <tr 
                    key={stub.name} 
                    className={`stub-manager__row stub-manager__row--${stub.mode.toLowerCase()}`}
                  >
                    <td className="stub-manager__cell stub-manager__cell--service">
                      <span className="stub-manager__service-name">
                        {stub.serviceName}
                      </span>
                    </td>
                    <td className="stub-manager__cell stub-manager__cell--name">
                      <code>{stub.name}</code>
                    </td>
                    <td className="stub-manager__cell stub-manager__cell--mode">
                      <span className={`stub-manager__badge stub-manager__badge--${stub.mode.toLowerCase()}`}>
                        {MODE_LABELS[stub.mode]}
                      </span>
                    </td>
                    <td className="stub-manager__cell stub-manager__cell--action">
                      <select
                        className="stub-manager__select"
                        value={stub.mode}
                        onChange={(e) => updateStub(stub.name, e.target.value as StubMode)}
                        disabled={updating === stub.name}
                        title={MODE_DESCRIPTIONS[stub.mode]}
                      >
                        {Object.keys(MODE_LABELS).map((mode) => (
                          <option key={mode} value={mode}>
                            {MODE_LABELS[mode as StubMode]}
                          </option>
                        ))}
                      </select>
                      {updating === stub.name && (
                        <span className="stub-manager__updating">⏳</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <div className="stub-manager__footer">
        <h3>📖 Описание режимов</h3>
        <div className="stub-manager__mode-descriptions">
          {Object.entries(MODE_DESCRIPTIONS).map(([mode, description]) => (
            <div key={mode} className="stub-manager__mode-item">
              <span className={`stub-manager__badge stub-manager__badge--${mode.toLowerCase()}`}>
                {MODE_LABELS[mode as StubMode]}
              </span>
              <span>{description}</span>
            </div>
          ))}
        </div>
      </div>

      <div className="stub-manager__actions">
        <button 
          className="stub-manager__button stub-manager__button--refresh"
          onClick={fetchStubs}
          disabled={loading}
        >
          🔄 Обновить данные
        </button>
        <button 
          className="stub-manager__button stub-manager__button--reset"
          onClick={() => {
            stubs.forEach(stub => {
              if (stub.mode !== 'Normal') {
                updateStub(stub.name, 'Normal');
              }
            });
          }}
          disabled={loading || stubs.every(s => s.mode === 'Normal')}
        >
          🔙 Сбросить все в Normal
        </button>
      </div>
    </div>
  );
};

export default StubManager;