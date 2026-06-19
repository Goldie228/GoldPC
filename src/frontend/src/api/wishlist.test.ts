import { describe, it, expect, vi, beforeEach } from 'vitest';

const { mockGet, mockPost, mockPut, mockDelete } = vi.hoisted(() => ({
  mockGet: vi.fn(),
  mockPost: vi.fn(),
  mockPut: vi.fn(),
  mockDelete: vi.fn(),
}));

vi.mock('./client', () => ({
  default: {
    get: mockGet,
    post: mockPost,
    put: mockPut,
    delete: mockDelete,
  },
}));

import { wishlistApi } from './wishlist';

describe('api/wishlist', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('getItems', () => {
    it('sends GET /wishlist and returns unwrapped array', async () => {
      mockGet.mockResolvedValueOnce({ data: { data: ['id-1', 'id-2'] } });
      const result = await wishlistApi.getItems();
      expect(mockGet).toHaveBeenCalledWith('/wishlist');
      expect(result).toEqual(['id-1', 'id-2']);
    });

    it('unwraps { data: [...] } envelope', async () => {
      mockGet.mockResolvedValueOnce({ data: { data: ['a', 'b'] } });
      const result = await wishlistApi.getItems();
      expect(result).toEqual(['a', 'b']);
    });

    it('returns empty array when response is empty envelope', async () => {
      mockGet.mockResolvedValueOnce({ data: { data: [] } });
      const result = await wishlistApi.getItems();
      expect(result).toEqual([]);
    });
  });

  describe('addItem', () => {
    it('sends POST /wishlist/:productId', async () => {
      mockPost.mockResolvedValueOnce({});
      await wishlistApi.addItem('prod-123');
      expect(mockPost).toHaveBeenCalledWith('/wishlist/prod-123');
    });
  });

  describe('removeItem', () => {
    it('sends DELETE /wishlist/:productId', async () => {
      mockDelete.mockResolvedValueOnce({});
      await wishlistApi.removeItem('prod-456');
      expect(mockDelete).toHaveBeenCalledWith('/wishlist/prod-456');
    });
  });

  describe('sync', () => {
    it('sends PUT /wishlist/sync with items array', async () => {
      mockPut.mockResolvedValueOnce({ data: { data: ['a', 'b', 'c'] } });
      const result = await wishlistApi.sync(['a', 'b', 'c']);
      expect(mockPut).toHaveBeenCalledWith('/wishlist/sync', ['a', 'b', 'c']);
      expect(result).toEqual(['a', 'b', 'c']);
    });

    it('unwraps { data: [...] } envelope', async () => {
      mockPut.mockResolvedValueOnce({ data: { data: ['x'] } });
      const result = await wishlistApi.sync(['x']);
      expect(result).toEqual(['x']);
    });
  });
});
