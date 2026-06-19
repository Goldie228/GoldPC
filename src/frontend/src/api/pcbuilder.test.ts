import { describe, it, expect, vi, beforeEach } from 'vitest';

const { mockGet, mockPost, mockDelete } = vi.hoisted(() => ({
  mockGet: vi.fn(),
  mockPost: vi.fn(),
  mockDelete: vi.fn(),
}));

vi.mock('./client', () => ({
  default: {
    get: mockGet,
    post: mockPost,
    put: vi.fn(),
    patch: vi.fn(),
    delete: mockDelete,
  },
}));

import { pcbuilderApi } from './pcbuilder';

describe('api/pcbuilder', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('getConfigurations', () => {
    it('sends GET /pcbuilder/configurations', async () => {
      const mockBuilds = [
        { id: 'b1', name: 'Gaming PC', totalPrice: 2000, isCompatible: true },
      ];
      mockGet.mockResolvedValueOnce({ data: mockBuilds });
      const result = await pcbuilderApi.getConfigurations();
      expect(mockGet).toHaveBeenCalledWith('/pcbuilder/configurations');
      expect(result).toEqual(mockBuilds);
    });

    it('returns empty array when data is null', async () => {
      mockGet.mockResolvedValueOnce({ data: null });
      const result = await pcbuilderApi.getConfigurations();
      expect(result).toEqual([]);
    });
  });

  describe('deleteConfiguration', () => {
    it('sends DELETE /pcbuilder/configurations/:id', async () => {
      mockDelete.mockResolvedValueOnce({});
      await pcbuilderApi.deleteConfiguration('b1');
      expect(mockDelete).toHaveBeenCalledWith('/pcbuilder/configurations/b1');
    });
  });

  describe('shareConfiguration', () => {
    it('sends POST /pcbuilder/configurations/:id/share', async () => {
      const mockShare = { shareUrl: 'https://goldpc.by/share/abc', shareToken: 'abc' };
      mockPost.mockResolvedValueOnce({ data: mockShare });
      const result = await pcbuilderApi.shareConfiguration('b1');
      expect(mockPost).toHaveBeenCalledWith('/pcbuilder/configurations/b1/share');
      expect(result).toEqual(mockShare);
    });
  });
});
