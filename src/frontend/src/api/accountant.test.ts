import { describe, it, expect, vi, beforeEach } from 'vitest';

const { mockGet } = vi.hoisted(() => ({
  mockGet: vi.fn(),
}));

vi.mock('./client', () => ({
  default: {
    get: mockGet,
    post: vi.fn(),
    put: vi.fn(),
    patch: vi.fn(),
    delete: vi.fn(),
  },
}));

import { accountantApi } from './accountant';

describe('api/accountant', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('getFinancialSummary', () => {
    it('sends GET /reports/financial-summary with from/to params', async () => {
      mockGet.mockResolvedValueOnce({
        data: { success: true, data: { revenue: 10000, ordersCount: 50, averageCheck: 200, servicesCount: 10, profit: 3000, marginPercent: 30 } },
      });
      const result = await accountantApi.getFinancialSummary('2025-01-01', '2025-01-31');
      expect(mockGet).toHaveBeenCalledWith('/reports/financial-summary', {
        params: { from: '2025-01-01', to: '2025-01-31' },
      });
      expect(result.revenue).toBe(10000);
      expect(result.ordersCount).toBe(50);
    });

    it('throws on unsuccessful response', async () => {
      mockGet.mockResolvedValueOnce({
        data: { success: false, message: 'Server error' },
      });
      await expect(accountantApi.getFinancialSummary('2025-01-01', '2025-01-31'))
        .rejects.toThrow('Server error');
    });

    it('throws default message when no message provided', async () => {
      mockGet.mockResolvedValueOnce({ data: { success: false } });
      await expect(accountantApi.getFinancialSummary('2025-01-01', '2025-01-31'))
        .rejects.toThrow('Ошибка загрузки финансового отчёта');
    });
  });

  describe('getOrdersByPeriod', () => {
    it('sends GET /reports/orders-by-period with groupBy param', async () => {
      mockGet.mockResolvedValueOnce({
        data: { success: true, data: [{ periodStart: '2025-01-01', ordersCount: 10, totalAmount: 5000 }] },
      });
      const result = await accountantApi.getOrdersByPeriod('2025-01-01', '2025-01-31', 'week');
      expect(mockGet).toHaveBeenCalledWith('/reports/orders-by-period', {
        params: { from: '2025-01-01', to: '2025-01-31', groupBy: 'week' },
      });
      expect(result).toHaveLength(1);
    });

    it('defaults groupBy to day', async () => {
      mockGet.mockResolvedValueOnce({ data: { success: true, data: [] } });
      await accountantApi.getOrdersByPeriod('2025-01-01', '2025-01-31');
      expect(mockGet).toHaveBeenCalledWith('/reports/orders-by-period', {
        params: { from: '2025-01-01', to: '2025-01-31', groupBy: 'day' },
      });
    });

    it('throws on unsuccessful response', async () => {
      mockGet.mockResolvedValueOnce({ data: { success: false } });
      await expect(accountantApi.getOrdersByPeriod('2025-01-01', '2025-01-31'))
        .rejects.toThrow('Ошибка загрузки статистики заказов');
    });
  });

  describe('getServicesByPeriod', () => {
    it('sends GET /reports/services-by-period', async () => {
      const mockData = { totalRequests: 20, completedRequests: 15, cancelledRequests: 2, totalRevenue: 5000, averageServiceCost: 250, byServiceType: [] };
      mockGet.mockResolvedValueOnce({ data: { success: true, data: mockData } });
      const result = await accountantApi.getServicesByPeriod('2025-01-01', '2025-01-31');
      expect(mockGet).toHaveBeenCalledWith('/reports/services-by-period', {
        params: { from: '2025-01-01', to: '2025-01-31' },
      });
      expect(result.totalRequests).toBe(20);
    });

    it('throws on unsuccessful response', async () => {
      mockGet.mockResolvedValueOnce({ data: { success: false, message: 'No data' } });
      await expect(accountantApi.getServicesByPeriod('2025-01-01', '2025-01-31'))
        .rejects.toThrow('No data');
    });
  });

  describe('exportCsv', () => {
    it('sends GET /reports/export with blob responseType', async () => {
      const mockBlob = new Blob(['csv-data'], { type: 'text/csv' });
      mockGet.mockResolvedValueOnce({
        data: mockBlob,
        headers: { 'content-disposition': 'attachment; filename="orders.csv"' },
      });
      const result = await accountantApi.exportCsv('orders', '2025-01-01', '2025-01-31');
      expect(mockGet).toHaveBeenCalledWith('/reports/export', {
        params: { format: 'csv', entity: 'orders', from: '2025-01-01', to: '2025-01-31' },
        responseType: 'blob',
      });
      expect(result.fileName).toBe('orders.csv');
      expect(result.blob).toBe(mockBlob);
    });

    it('uses default filename when no Content-Disposition', async () => {
      const mockBlob = new Blob(['data']);
      mockGet.mockResolvedValueOnce({ data: mockBlob, headers: {} });
      const result = await accountantApi.exportCsv('products', '2025-06-01', '2025-06-19');
      expect(result.fileName).toMatch(/^export_products_\d{4}-\d{2}-\d{2}\.csv$/);
    });

    it('decodes UTF-8 filename from Content-Disposition', async () => {
      const mockBlob = new Blob(['data']);
      mockGet.mockResolvedValueOnce({
        data: mockBlob,
        headers: { 'content-disposition': "attachment; filename*=UTF-8''%D0%BE%D1%82%D1%87%D0%B5%D1%82.csv" },
      });
      const result = await accountantApi.exportCsv('orders', '2025-01-01', '2025-01-31');
      expect(result.fileName).toBe('отчет.csv');
    });
  });
});
