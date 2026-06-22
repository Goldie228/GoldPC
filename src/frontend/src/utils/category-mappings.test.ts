import { describe, it, expect } from 'vitest';
import {
  CATEGORY_LABELS,
  CATEGORY_NAME_TO_SLUG,
  FRONTEND_TO_BACKEND,
  BACKEND_TO_FRONTEND,
} from './category-mappings';

describe('CATEGORY_LABELS', () => {
  it('maps slug to Russian name', () => {
    expect(CATEGORY_LABELS.cpu).toBe('Процессоры');
    expect(CATEGORY_LABELS.gpu).toBe('Видеокарты');
    expect(CATEGORY_LABELS.motherboard).toBe('Материнские платы');
    expect(CATEGORY_LABELS.monitor).toBe('Мониторы');
    expect(CATEGORY_LABELS.headphones).toBe('Наушники');
  });

  it('has exactly 13 categories', () => {
    expect(Object.keys(CATEGORY_LABELS)).toHaveLength(13);
  });
});

describe('CATEGORY_NAME_TO_SLUG', () => {
  it('maps Russian name back to slug', () => {
    expect(CATEGORY_NAME_TO_SLUG['Процессоры']).toBe('cpu');
    expect(CATEGORY_NAME_TO_SLUG['Видеокарты']).toBe('gpu');
    expect(CATEGORY_NAME_TO_SLUG['Материнские платы']).toBe('motherboard');
    expect(CATEGORY_NAME_TO_SLUG['Оперативная память']).toBe('ram');
    expect(CATEGORY_NAME_TO_SLUG['Накопители']).toBe('storage');
  });

  it('is inverse of CATEGORY_LABELS', () => {
    for (const [slug, label] of Object.entries(CATEGORY_LABELS)) {
      expect(CATEGORY_NAME_TO_SLUG[label]).toBe(slug);
    }
  });
});

describe('FRONTEND_TO_BACKEND', () => {
  it('maps frontend slugs to backend slugs', () => {
    expect(FRONTEND_TO_BACKEND.cpu).toBe('processors');
    expect(FRONTEND_TO_BACKEND.gpu).toBe('gpu');
    expect(FRONTEND_TO_BACKEND.motherboard).toBe('motherboards');
    expect(FRONTEND_TO_BACKEND.ram).toBe('ram');
    expect(FRONTEND_TO_BACKEND.psu).toBe('psu');
    expect(FRONTEND_TO_BACKEND.case).toBe('cases');
    expect(FRONTEND_TO_BACKEND.cooling).toBe('coolers');
    expect(FRONTEND_TO_BACKEND.fan).toBe('fans');
    expect(FRONTEND_TO_BACKEND.monitor).toBe('monitors');
    expect(FRONTEND_TO_BACKEND.keyboard).toBe('keyboards');
    expect(FRONTEND_TO_BACKEND.mouse).toBe('mice');
    expect(FRONTEND_TO_BACKEND.headphones).toBe('headphones');
  });
});

describe('BACKEND_TO_FRONTEND', () => {
  it('maps backend slugs to frontend slugs', () => {
    expect(BACKEND_TO_FRONTEND.processors).toBe('cpu');
    expect(BACKEND_TO_FRONTEND.gpu).toBe('gpu');
    expect(BACKEND_TO_FRONTEND.motherboards).toBe('motherboard');
    expect(BACKEND_TO_FRONTEND.ram).toBe('ram');
    expect(BACKEND_TO_FRONTEND.mice).toBe('mouse');
  });

  it('maps all frontend→backend→frontend roundtrips correctly', () => {
    for (const [feSlug, beSlug] of Object.entries(FRONTEND_TO_BACKEND)) {
      expect(BACKEND_TO_FRONTEND[beSlug]).toBe(feSlug);
    }
  });
});
