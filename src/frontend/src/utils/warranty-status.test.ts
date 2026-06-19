import { describe, it, expect } from 'vitest';
import { getWarrantyStatusConfig, WARRANTY_STATUS_OPTIONS } from './warranty-status';

describe('getWarrantyStatusConfig', () => {
  it('returns config for numeric status 0 (new)', () => {
    const config = getWarrantyStatusConfig(0);
    expect(config.label).toBe('Новая');
    expect(config.variant).toBe('info');
  });

  it('returns config for numeric status 1 (in progress)', () => {
    const config = getWarrantyStatusConfig(1);
    expect(config.label).toBe('В обработке');
    expect(config.variant).toBe('warning');
  });

  it('returns config for numeric status 2 (approved)', () => {
    const config = getWarrantyStatusConfig(2);
    expect(config.label).toBe('Одобрена');
    expect(config.variant).toBe('success');
  });

  it('returns config for numeric status 3 (rejected)', () => {
    const config = getWarrantyStatusConfig(3);
    expect(config.label).toBe('Отклонена');
    expect(config.variant).toBe('neutral');
  });

  it('returns config for numeric status 4 (completed)', () => {
    const config = getWarrantyStatusConfig(4);
    expect(config.label).toBe('Завершена');
    expect(config.variant).toBe('success');
  });

  it('returns config for string key "new"', () => {
    const config = getWarrantyStatusConfig('new');
    expect(config.label).toBe('Новая');
    expect(config.variant).toBe('info');
  });

  it('returns config for string key "in_progress"', () => {
    const config = getWarrantyStatusConfig('in_progress');
    expect(config.label).toBe('В обработке');
    expect(config.variant).toBe('warning');
  });

  it('returns config for string key "approved"', () => {
    const config = getWarrantyStatusConfig('approved');
    expect(config.label).toBe('Одобрена');
    expect(config.variant).toBe('success');
  });

  it('returns config for string key "rejected"', () => {
    const config = getWarrantyStatusConfig('rejected');
    expect(config.label).toBe('Отклонена');
    expect(config.variant).toBe('neutral');
  });

  it('returns config for string key "completed"', () => {
    const config = getWarrantyStatusConfig('completed');
    expect(config.label).toBe('Завершена');
    expect(config.variant).toBe('success');
  });

  it('returns fallback for unknown status', () => {
    const config = getWarrantyStatusConfig('unknown');
    expect(config.label).toBe('unknown');
    expect(config.variant).toBe('neutral');
  });

  it('returns fallback for undefined status', () => {
    const config = getWarrantyStatusConfig(undefined);
    expect(config.label).toBe('--');
    expect(config.variant).toBe('neutral');
  });

  it('is case-insensitive for string keys', () => {
    const config = getWarrantyStatusConfig('APPROVED');
    expect(config.label).toBe('Одобрена');
  });
});

describe('WARRANTY_STATUS_OPTIONS', () => {
  it('starts with "all statuses" option', () => {
    expect(WARRANTY_STATUS_OPTIONS[0]).toEqual({ value: '', label: 'Все статусы' });
  });

  it('contains 6 entries (all + 5 statuses)', () => {
    expect(WARRANTY_STATUS_OPTIONS).toHaveLength(6);
  });

  it('has numeric string values', () => {
    const values = WARRANTY_STATUS_OPTIONS.map((o) => o.value);
    expect(values).toContain('0');
    expect(values).toContain('4');
  });
});
