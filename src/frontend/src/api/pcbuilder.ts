/**
 * PC Builder API — сохранённые конфигурации
 */

import apiClient from './client';

export interface SavedBuild {
  id: string;
  name: string;
  purpose?: string;
  totalPrice: number;
  isCompatible: boolean;
  createdAt: string;
  shareToken?: string;
  components: Record<string, string>;
}

export interface SaveConfigurationRequest {
  name: string;
  purpose?: string;
  components: Record<string, string>;
}

export const pcbuilderApi = {
  /** Get all saved configurations for the current user */
  async getConfigurations(): Promise<SavedBuild[]> {
    const { data } = await apiClient.get<SavedBuild[]>('/pcbuilder/configurations');
    return data || [];
  },

  /** Save a new configuration (POST) */
  async saveConfiguration(payload: SaveConfigurationRequest): Promise<SavedBuild> {
    const { data } = await apiClient.post<SavedBuild>('/pcbuilder/configurations', payload);
    return data;
  },

  /** Update an existing configuration (PUT) */
  async updateConfiguration(id: string, payload: SaveConfigurationRequest): Promise<SavedBuild> {
    const { data } = await apiClient.put<SavedBuild>(`/pcbuilder/configurations/${id}`, payload);
    return data;
  },

  /** Delete a saved configuration */
  async deleteConfiguration(id: string): Promise<void> {
    await apiClient.delete(`/pcbuilder/configurations/${id}`);
  },

  /** Generate a share link for a configuration */
  async shareConfiguration(id: string): Promise<{ shareUrl: string; shareToken: string }> {
    const { data } = await apiClient.post<{ shareUrl: string; shareToken: string }>(
      `/pcbuilder/configurations/${id}/share`
    );
    return data;
  },
};
