import { describe, it, expect, vi, beforeEach } from 'vitest';

const { mockGet, mockPost, mockPut, mockPatch, mockDelete } = vi.hoisted(() => ({
  mockGet: vi.fn(),
  mockPost: vi.fn(),
  mockPut: vi.fn(),
  mockPatch: vi.fn(),
  mockDelete: vi.fn(),
}));

vi.mock('./client', () => ({
  default: {
    get: mockGet,
    post: mockPost,
    put: mockPut,
    patch: mockPatch,
    delete: mockDelete,
  },
}));

import { managerApi } from './manager';

describe('api/manager', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('getDashboardStats', () => {
    it('sends GET /admin/stats and unwraps nested data', async () => {
      mockGet.mockResolvedValueOnce({
        data: { data: { stats: { totalUsers: 100 }, lastUpdated: '2025-01-01' } },
      });
      const result = await managerApi.getDashboardStats();
      expect(mockGet).toHaveBeenCalledWith('/admin/stats');
      expect(result.stats.totalUsers).toBe(100);
    });

    it('returns fallback when data is empty', async () => {
      mockGet.mockResolvedValueOnce({ data: {} });
      const result = await managerApi.getDashboardStats();
      // getDashboardStats returns response.data?.data ?? (response.data as StatsResponse) ?? { stats: {}, lastUpdated: '' }
      // When data is {}, response.data is {} which is truthy, so it returns {}
      expect(result).toEqual({});
    });
  });

  describe('getCharts', () => {
    it('sends GET /admin/stats/charts with period param', async () => {
      mockGet.mockResolvedValueOnce({
        data: { data: { orders: [], revenue: [] } },
      });
      await managerApi.getCharts('week');
      expect(mockGet).toHaveBeenCalledWith('/admin/stats/charts', { params: { period: 'week' } });
    });
  });

  describe('getSparklines', () => {
    it('sends GET /admin/stats/sparklines with period', async () => {
      mockGet.mockResolvedValueOnce({
        data: { data: { users: [1, 2], orders: [3, 4], revenue: [5, 6] } },
      });
      const result = await managerApi.getSparklines('month');
      expect(mockGet).toHaveBeenCalledWith('/admin/stats/sparklines', { params: { period: 'month' } });
      expect(result.users).toEqual([1, 2]);
    });
  });

  describe('getActivity', () => {
    it('sends GET /admin/stats/activity', async () => {
      mockGet.mockResolvedValueOnce({ data: { data: { items: [{ id: '1', type: 'order' }] } } });
      const result = await managerApi.getActivity();
      expect(mockGet).toHaveBeenCalledWith('/admin/stats/activity');
      expect(result.items).toHaveLength(1);
    });
  });

  describe('getLowStockProducts', () => {
    it('filters products with stock <= limit', async () => {
      mockGet.mockResolvedValueOnce({
        data: { data: { items: [
          { id: 'p1', stock: 2 },
          { id: 'p2', stock: 15 },
          { id: 'p3', stock: 0 },
          { id: 'p4', stock: 5 },
        ] } },
      });
      const result = await managerApi.getLowStockProducts(10);
      expect(result).toHaveLength(2);
      expect(result.map(p => p.id)).toEqual(['p1', 'p4']);
    });
  });

  describe('getPendingOrders', () => {
    it('filters orders with status new/processing', async () => {
      mockGet.mockResolvedValueOnce({
        data: { data: { items: [
          { id: 'o1', status: 'new' },
          { id: 'o2', status: 'completed' },
          { id: 'o3', status: '1' },
          { id: 'o4', status: 'processing' },
        ] } },
      });
      const result = await managerApi.getPendingOrders();
      expect(result).toHaveLength(3);
      expect(result.map(o => o.id)).toEqual(['o1', 'o3', 'o4']);
    });
  });

  describe('getOrders', () => {
    it('sends GET /orders with params', async () => {
      mockGet.mockResolvedValueOnce({ data: { data: { items: [], totalCount: 0 } } });
      await managerApi.getOrders(2, 10, 'pending', 'test');
      expect(mockGet).toHaveBeenCalledWith('/orders', {
        params: { page: 2, pageSize: 10, status: 'pending', search: 'test' },
      });
    });

    it('omits empty status and search', async () => {
      mockGet.mockResolvedValueOnce({ data: { data: { items: [], totalCount: 0 } } });
      await managerApi.getOrders(1, 20, '', '');
      expect(mockGet).toHaveBeenCalledWith('/orders', { params: { page: 1, pageSize: 20 } });
    });
  });

  describe('getOrderById', () => {
    it('sends GET /orders/:id', async () => {
      mockGet.mockResolvedValueOnce({ data: { data: { id: 'o1', status: 'new' } } });
      const result = await managerApi.getOrderById('o1');
      expect(mockGet).toHaveBeenCalledWith('/orders/o1');
      expect(result?.id).toBe('o1');
    });
  });

  describe('updateOrderStatus', () => {
    it('sends PUT /orders/:id/status', async () => {
      mockPut.mockResolvedValueOnce({ data: { data: { id: 'o1', status: 'completed' } } });
      await managerApi.updateOrderStatus('o1', 'completed');
      expect(mockPut).toHaveBeenCalledWith('/orders/o1/status', { status: 'completed' });
    });
  });

  describe('cancelOrder', () => {
    it('sends POST /orders/:id/cancel', async () => {
      mockPost.mockResolvedValueOnce({ data: { data: { id: 'o1', status: 'cancelled' } } });
      await managerApi.cancelOrder('o1');
      expect(mockPost).toHaveBeenCalledWith('/orders/o1/cancel');
    });
  });

  describe('getServiceRequests', () => {
    it('sends GET /services with params', async () => {
      mockGet.mockResolvedValueOnce({ data: { data: { items: [], totalCount: 0 } } });
      await managerApi.getServiceRequests(1, 20, 'open');
      expect(mockGet).toHaveBeenCalledWith('/services', {
        params: { page: 1, pageSize: 20, status: 'open' },
      });
    });
  });

  describe('assignMaster', () => {
    it('sends POST /services/:serviceId/assign/:masterId', async () => {
      mockPost.mockResolvedValueOnce({});
      await managerApi.assignMaster('s1', 'm1');
      expect(mockPost).toHaveBeenCalledWith('/services/s1/assign/m1');
    });
  });

  describe('updateServiceStatus', () => {
    it('sends PATCH /services/:id/status', async () => {
      mockPatch.mockResolvedValueOnce({});
      await managerApi.updateServiceStatus('s1', 'in_progress');
      expect(mockPatch).toHaveBeenCalledWith('/services/s1/status', { status: 'in_progress' });
    });
  });

  describe('closeServiceRequest', () => {
    it('sends POST /services/:id/close', async () => {
      mockPost.mockResolvedValueOnce({});
      await managerApi.closeServiceRequest('s1');
      expect(mockPost).toHaveBeenCalledWith('/services/s1/close');
    });
  });

  describe('getServiceMessages', () => {
    it('sends GET /services/:id/messages', async () => {
      const msgs = [{ id: 'm1', message: 'Hello' }];
      mockGet.mockResolvedValueOnce({ data: { data: msgs } });
      const result = await managerApi.getServiceMessages('s1');
      expect(mockGet).toHaveBeenCalledWith('/services/s1/messages');
      expect(result).toEqual(msgs);
    });
  });

  describe('getWarrantyClaims', () => {
    it('sends GET /warranty/claim with params', async () => {
      mockGet.mockResolvedValueOnce({ data: { data: { items: [], totalCount: 0 } } });
      await managerApi.getWarrantyClaims(1, 20, 'open');
      expect(mockGet).toHaveBeenCalledWith('/warranty/claim', {
        params: { page: 1, pageSize: 20, status: 'open' },
      });
    });
  });

  describe('getWarrantyCards', () => {
    it('sends GET /warranty/card', async () => {
      mockGet.mockResolvedValueOnce({ data: { data: [] } });
      await managerApi.getWarrantyCards(2, 10);
      expect(mockGet).toHaveBeenCalledWith('/warranty/card', { params: { page: 2, pageSize: 10 } });
    });
  });

  describe('createWarrantyCard', () => {
    it('sends POST /warranty/card with data', async () => {
      mockPost.mockResolvedValueOnce({});
      await managerApi.createWarrantyCard({ productId: 'p1', orderId: 'o1', expiresAt: '2026-01-01' });
      expect(mockPost).toHaveBeenCalledWith('/warranty/card', {
        productId: 'p1', orderId: 'o1', expiresAt: '2026-01-01',
      });
    });
  });

  describe('annulWarrantyCard', () => {
    it('sends POST /warranty/card/:id/annul', async () => {
      mockPost.mockResolvedValueOnce({});
      await managerApi.annulWarrantyCard('card1');
      expect(mockPost).toHaveBeenCalledWith('/warranty/card/card1/annul');
    });
  });

  describe('getFeedback', () => {
    it('sends GET /feedback with params', async () => {
      mockGet.mockResolvedValueOnce({ data: { data: [] } });
      await managerApi.getFeedback(1, 50);
      expect(mockGet).toHaveBeenCalledWith('/feedback', { params: { page: 1, pageSize: 50 } });
    });
  });

  describe('deleteFeedback', () => {
    it('sends DELETE /feedback/:id', async () => {
      mockDelete.mockResolvedValueOnce({});
      await managerApi.deleteFeedback('f1');
      expect(mockDelete).toHaveBeenCalledWith('/feedback/f1');
    });
  });
});
