import { describe, it, expect, vi, beforeEach } from 'vitest';

const { mockPost } = vi.hoisted(() => ({
  mockPost: vi.fn(),
}));

vi.mock('./client', () => ({
  default: {
    get: vi.fn(),
    post: mockPost,
    put: vi.fn(),
    patch: vi.fn(),
    delete: vi.fn(),
  },
}));

import { promoApi } from './promo';

describe('api/promo', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('validatePromoCode', () => {
    it('sends POST /promo/validate with code and orderAmount', async () => {
      const mockResponse = {
        valid: true,
        discount: 10,
        message: 'SAVE10 applied',
        discountAmount: 150,
      };
      mockPost.mockResolvedValueOnce({ data: mockResponse });

      const result = await promoApi.validatePromoCode({ code: 'SAVE10', orderAmount: 1500 });

      expect(mockPost).toHaveBeenCalledWith('/promo/validate', { code: 'SAVE10', orderAmount: 1500 });
      expect(result).toEqual(mockResponse);
    });

    it('unwraps { data: { ... } } envelope', async () => {
      mockPost.mockResolvedValueOnce({
        data: { data: { valid: false, discount: 0, message: 'Invalid', discountAmount: 0 } },
      });
      const result = await promoApi.validatePromoCode({ code: 'BAD', orderAmount: 100 });
      expect(result).toEqual({ valid: false, discount: 0, message: 'Invalid', discountAmount: 0 });
    });

    it('returns raw response when no data wrapper', async () => {
      mockPost.mockResolvedValueOnce({ data: { valid: true, discount: 5, message: 'OK', discountAmount: 50 } });
      const result = await promoApi.validatePromoCode({ code: 'OK', orderAmount: 1000 });
      expect(result.valid).toBe(true);
    });
  });
});
