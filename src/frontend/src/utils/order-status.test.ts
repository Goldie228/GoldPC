import { describe, it, expect } from 'vitest';
import { getStatusConfig, ORDER_STATUS_OPTIONS } from './order-status';

describe('getStatusConfig', () => {
  it('returns config for numeric status 0 (new)', () => {
    const config = getStatusConfig(0);
    expect(config.label).toBe('Новый');
    expect(config.variant).toBe('info');
  });

  it('returns config for numeric status 1 (processing)', () => {
    const config = getStatusConfig(1);
    expect(config.label).toBe('В обработке');
    expect(config.variant).toBe('warning');
  });

  it('returns config for numeric status 4 (ready)', () => {
    const config = getStatusConfig(4);
    expect(config.label).toBe('Готов');
    expect(config.variant).toBe('success');
  });

  it('returns config for numeric status 5 (issued)', () => {
    const config = getStatusConfig(5);
    expect(config.label).toBe('Выдан');
    expect(config.variant).toBe('success');
  });

  it('returns config for numeric status 6 (cancelled)', () => {
    const config = getStatusConfig(6);
    expect(config.label).toBe('Отменён');
    expect(config.variant).toBe('neutral');
  });

  it('returns config for string key "new"', () => {
    const config = getStatusConfig('new');
    expect(config.label).toBe('Новый');
    expect(config.variant).toBe('info');
  });

  it('returns config for string key "pending"', () => {
    const config = getStatusConfig('pending');
    expect(config.label).toBe('Ожидает');
    expect(config.variant).toBe('info');
  });

  it('returns config for string key "in_progress"', () => {
    const config = getStatusConfig('in_progress');
    expect(config.label).toBe('В сборке');
    expect(config.variant).toBe('warning');
  });

  it('returns config for string key "cancelled"', () => {
    const config = getStatusConfig('cancelled');
    expect(config.label).toBe('Отменён');
    expect(config.variant).toBe('neutral');
  });

  it('returns config for string key "completed"', () => {
    const config = getStatusConfig('completed');
    expect(config.label).toBe('Выдан');
    expect(config.variant).toBe('success');
  });

  it('returns fallback for unknown status', () => {
    const config = getStatusConfig('unknown');
    expect(config.label).toBe('unknown');
    expect(config.variant).toBe('neutral');
  });

  it('returns fallback for undefined status', () => {
    const config = getStatusConfig(undefined);
    expect(config.label).toBe('--');
    expect(config.variant).toBe('neutral');
  });

  it('is case-insensitive for string keys', () => {
    const config = getStatusConfig('NEW');
    expect(config.label).toBe('Новый');
  });
});

describe('ORDER_STATUS_OPTIONS', () => {
  it('starts with "all statuses" option', () => {
    expect(ORDER_STATUS_OPTIONS[0]).toEqual({ value: '', label: 'Все статусы' });
  });

  it('contains 8 entries (all + 7 statuses)', () => {
    expect(ORDER_STATUS_OPTIONS).toHaveLength(8);
  });

  it('has numeric string values for backend statuses', () => {
    const values = ORDER_STATUS_OPTIONS.map((o) => o.value);
    expect(values).toContain('0');
    expect(values).toContain('6');
  });
});
