import { useState, useCallback, useRef } from 'react';
import { useMutation } from '@tanstack/react-query';
import { Modal } from '../ui/Modal/Modal';
import { Button } from '../ui/Button';
import apiClient from '../../api/client';
import styles from './ShareConfigModal.module.css';

/** Ответ API на запрос генерации ссылки */
interface ShareResponse {
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
function adaptShareUrl(apiShareUrl: string): string {
  try {
    const url = new URL(apiShareUrl, window.location.origin);
    const shareBase =
      import.meta.env.VITE_SHARE_URL || window.location.origin;
    return `${shareBase.replace(/\/$/, '')}${url.pathname}${url.search}`;
  } catch {
    const shareBase =
      import.meta.env.VITE_SHARE_URL || window.location.origin;
    return `${shareBase.replace(/\/$/, '')}${apiShareUrl.startsWith('/') ? apiShareUrl : `/${apiShareUrl}`}`;
  }
}