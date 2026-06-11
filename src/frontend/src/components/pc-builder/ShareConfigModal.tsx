import { useState, useCallback, useRef } from 'react';
import { useMutation } from '@tanstack/react-query';
import { Modal } from '../ui/Modal/Modal';
import { Button } from '../ui/Button';
import apiClient from '@/api/client';

/** Ответ API на запрос генерации ссылки */
interface _ShareResponse {
  shareToken: string;
  shareUrl: string;
}

export interface ShareConfigModalProps {
  /** Whether modal is open */
  isOpen: boolean;
  /** Close handler */
  onClose: () => void;
  /** Configuration ID to share */
  configurationId: string;
  /** Configuration name (for display) */
  configurationName?: string;
}

/**
 * Адаптирует share URL для production.
 * В production использует VITE_SHARE_URL (или origin), в dev — относительный путь.
 */
function _adaptShareUrl(apiShareUrl: string): string {
  const shareBase = typeof import.meta.env?.VITE_SHARE_URL === 'string'
    ? import.meta.env.VITE_SHARE_URL
    : window.location.origin;
  try {
    const url = new URL(apiShareUrl, window.location.origin);
    return `${shareBase.replace(/\/$/, '')}${url.pathname}${url.search}`;
  } catch {
    return `${shareBase.replace(/\/$/, '')}${apiShareUrl.startsWith('/') ? apiShareUrl : `/${apiShareUrl}`}`;
  }
}