/**
 * MSW Browser Setup
 * Настройка Service Worker для перехвата API запросов в браузере
 */

import { setupWorker } from 'msw/browser';
import { catalogHandlers } from './handlers/catalog';

// Экспорт worker с подключенными handlers
export const worker = setupWorker(...catalogHandlers);