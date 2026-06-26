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
  /** Frontend-only: populated when saving from pc-builder client-side */
  components?: Record<string, string>;
  /** Backend DTO fields */
  processorId?: string;
  motherboardId?: string;
  ramId?: string;
  gpuId?: string;
  psuId?: string;
  storageId?: string;
  caseId?: string;
  coolerId?: string;
}

export interface SaveConfigurationRequest {
  name: string;
  purpose?: string;
  components: Record<string, string>;
}

export const pcbuilderApi = {
  /** Save a new configuration */
  async saveConfiguration(config: SaveConfigurationRequest): Promise<SavedBuild> {
    const { data } = await apiClient.post<SavedBuild>('/pcbuilder/configurations', config);
    return data;
  },

  /** Get all saved configurations for the current user */
  async getConfigurations(): Promise<SavedBuild[]> {
    const { data } = await apiClient.get<SavedBuild[]>('/pcbuilder/configurations');
    return data || [];
  },

  /** Get a single configuration by ID */
  async getConfiguration(id: string): Promise<SavedBuild> {
    const { data } = await apiClient.get<SavedBuild>(`/pcbuilder/configurations/${id}`);
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
