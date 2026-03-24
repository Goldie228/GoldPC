import apiClient from './client';

interface ApiResponse<T> {
  data?: T;
}

function extractData<T>(payload: T | ApiResponse<T>): T {
  if (payload && typeof payload === 'object' && 'data' in (payload as object)) {
    const wrapped = payload as ApiResponse<T>;
    if (wrapped.data !== undefined) return wrapped.data;
  }
  return payload as T;
}

export const wishlistApi = {
  async getItems(): Promise<string[]> {
    const response = await apiClient.get<string[] | ApiResponse<string[]>>('/wishlist');
    return extractData<string[]>(response.data) ?? [];
  },

  async addItem(productId: string): Promise<void> {
    await apiClient.post(`/wishlist/${productId}`);
  },

  async removeItem(productId: string): Promise<void> {
    await apiClient.delete(`/wishlist/${productId}`);
  },

  async sync(items: string[]): Promise<string[]> {
    const response = await apiClient.put<string[] | ApiResponse<string[]>>('/wishlist/sync', items);
    return extractData<string[]>(response.data) ?? [];
  },
};
