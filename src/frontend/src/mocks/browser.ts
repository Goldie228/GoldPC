/**
 * MSW Browser Setup
 * Настройка Service Worker для перехвата API запросов в браузере
 */

import { setupWorker } from 'msw/browser';
import { catalogHandlers } from './handlers/catalog';
import { adminHandlers } from './handlers/admin';
import { coordinatorHandlers } from './handlers/coordinator';
import { servicesHandlers } from './handlers/services';
import { userFeaturesHandlers } from './handlers/userFeatures';

// Экспорт worker с подключенными handlers
export const worker = setupWorker(
  ...catalogHandlers,
  ...adminHandlers,
  ...coordinatorHandlers,
  ...servicesHandlers,
  ...userFeaturesHandlers
);
