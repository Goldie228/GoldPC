import { onLCP, onINP, onCLS, onFCP, onTTFB } from 'web-vitals';
import type { MetricType } from 'web-vitals';

/**
 * Интерфейс метрик производительности
 */
export interface PerformanceMetrics {
  LCP: number; // Largest Contentful Paint
  INP: number; // Interaction to Next Paint (замена FID)
  CLS: number; // Cumulative Layout Shift
  FCP: number; // First Contentful Paint
  TTFB: number; // Time to First Byte
}

/**
 * Бюджеты производительности
 * Основано на рекомендациях Google Core Web Vitals
 */
const PERFORMANCE_BUDGETS: Record<keyof PerformanceMetrics, number> = {
  LCP: 2500,  // < 2.5s (good)
  INP: 200,   // < 200ms (good) - замена FID
  CLS: 0.1,   // < 0.1 (good)
  FCP: 1800,  // < 1.8s (good)
  TTFB: 600,  // < 600ms (good)
};

/**
 * Интерфейс для отправки метрик в аналитику
 */
interface AnalyticsPayload {
  metric: string;
  value: number;
  url: string;
  timestamp: number;
  userAgent: string;
}

/**
 * Класс для мониторинга производительности приложения
 * Собирает Core Web Vitals метрики и отправляет их в аналитику
 */
class PerformanceMonitor {
  private metrics: Partial<PerformanceMetrics> = {};
  private isInitialized: boolean = false;
  private analyticsEndpoint: string = '/api/v1/analytics/performance';

  /**
   * Инициализирует мониторинг производительности
   */
  constructor() {
    if (typeof window !== 'undefined') {
      this.init();
    }
  }

  /**
   * Инициализация подписок на метрики
   */
  private init(): void {
    if (this.isInitialized) return;

    try {
      onLCP(this.reportMetric('LCP'));
      onINP(this.reportMetric('INP'));
      onCLS(this.reportMetric('CLS'));
      onFCP(this.reportMetric('FCP'));
      onTTFB(this.reportMetric('TTFB'));

      this.isInitialized = true;
    } catch (error) {
      console.warn('[PerformanceMonitor] Failed to initialize:', error);
    }
  }

  /**
   * Создаёт callback для обработки метрики
   */
  private reportMetric(name: keyof PerformanceMetrics) {
    return (metric: MetricType): void => {
      this.metrics[name] = metric.value;
      this.sendToAnalytics(name, metric.value);
    };
  }

  /**
   * Отправляет метрику в аналитику
   */
  private sendToAnalytics(name: string, value: number): void {
    const payload: AnalyticsPayload = {
      metric: name,
      value,
      url: window.location.pathname,
      timestamp: Date.now(),
      userAgent: navigator.userAgent,
    };

    // Отправка через sendBeacon для надёжности
    if (navigator.sendBeacon) {
      const data = new FormData();
      data.append('metric', payload.metric);
      data.append('value', payload.value.toString());
      data.append('url', payload.url);
      data.append('timestamp', payload.timestamp.toString());
      data.append('userAgent', payload.userAgent);

      navigator.sendBeacon(this.analyticsEndpoint, data);
    }

    // Логирование в режиме разработки
    if (import.meta.env.DEV) {
      const budget = PERFORMANCE_BUDGETS[name as keyof PerformanceMetrics];
      const status = value <= budget ? '✅' : '⚠️';
      console.log(
        `[PerformanceMonitor] ${status} ${name}: ${value.toFixed(2)} (budget: ${budget})`
      );
    }
  }

  /**
   * Возвращает собранные метрики
   */
  getMetrics(): Partial<PerformanceMetrics> {
    return { ...this.metrics };
  }

  /**
   * Проверяет метрики по бюджетам производительности
   * @returns Объект с результатом проверки и списком нарушений
   */
  checkBudgets(): { passed: boolean; violations: string[] } {
    const violations: string[] = [];

    for (const [metric, budget] of Object.entries(PERFORMANCE_BUDGETS)) {
      const value = this.metrics[metric as keyof PerformanceMetrics];
      if (value !== undefined && value > budget) {
        const unit = metric === 'CLS' ? '' : 'ms';
        violations.push(
          `${metric}: ${value.toFixed(2)}${unit} (budget: ${budget}${unit})`
        );
      }
    }

    const passed = violations.length === 0;

    // Логирование в режиме разработки
    if (import.meta.env.DEV) {
      if (passed) {
        console.log('[PerformanceMonitor] ✅ All performance budgets passed');
      } else {
        console.warn(
          '[PerformanceMonitor] ⚠️ Performance budget violations:\n',
          violations.join('\n')
        );
      }
    }

    return { passed, violations };
  }

  /**
   * Возвращает бюджеты производительности
   */
  getBudgets(): Record<keyof PerformanceMetrics, number> {
    return { ...PERFORMANCE_BUDGETS };
  }

  /**
   * Устанавливает endpoint для отправки аналитики
   */
  setAnalyticsEndpoint(endpoint: string): void {
    this.analyticsEndpoint = endpoint;
  }

  /**
   * Сбрасывает собранные метрики
   */
  reset(): void {
    this.metrics = {};
  }
}

// Экспорт singleton экземпляра
export const performanceMonitor = new PerformanceMonitor();

// Экспорт типов для внешнего использования
export type { PerformanceMonitor as PerformanceMonitorClass };