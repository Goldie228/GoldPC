import { describe, it, expect } from 'vitest';
import { getServiceStatusConfig, SERVICE_STATUS_OPTIONS } from './service-status';

describe('getServiceStatusConfig', () => {
  it('returns config for numeric status 0 (new)', () => {
    const config = getServiceStatusConfig(0);
    expect(config.label).toBe('Новая');
    expect(config.variant).toBe('info');
  });

  it('returns config for numeric status 1 (in progress)', () => {
    const config = getServiceStatusConfig(1);
    expect(config.label).toBe('В работе');
    expect(config.variant).toBe('warning');
  });

  it('returns config for numeric status 2 (awaiting parts)', () => {
    const config = getServiceStatusConfig(2);
    expect(config.label).toBe('Ожидает запчасти');
    expect(config.variant).toBe('info');
  });

  it('returns config for numeric status 3 (completed)', () => {
    const config = getServiceStatusConfig(3);
    expect(config.label).toBe('Завершена');
    expect(config.variant).toBe('success');
  });

  it('returns config for numeric status 4 (closed)', () => {
    const config = getServiceStatusConfig(4);
    expect(config.label).toBe('Закрыта');
    expect(config.variant).toBe('neutral');
  });

  it('returns config for string key "new"', () => {
    const config = getServiceStatusConfig('new');
    expect(config.label).toBe('Новая');
    expect(config.variant).toBe('info');
  });

  it('returns config for string key "submitted"', () => {
    const config = getServiceStatusConfig('submitted');
    expect(config.label).toBe('Новая');
    expect(config.variant).toBe('info');
  });

  it('returns config for string key "in_progress"', () => {
    const config = getServiceStatusConfig('in_progress');
    expect(config.label).toBe('В работе');
    expect(config.variant).toBe('warning');
  });

  it('returns config for string key "awaiting_parts"', () => {
    const config = getServiceStatusConfig('awaiting_parts');
    expect(config.label).toBe('Ожидает запчасти');
    expect(config.variant).toBe('info');
  });

  it('returns config for string key "completed"', () => {
    const config = getServiceStatusConfig('completed');
    expect(config.label).toBe('Завершена');
    expect(config.variant).toBe('success');
  });

  it('returns config for string key "closed"', () => {
    const config = getServiceStatusConfig('closed');
    expect(config.label).toBe('Закрыта');
    expect(config.variant).toBe('neutral');
  });

  it('returns fallback for unknown status', () => {
    const config = getServiceStatusConfig('unknown');
    expect(config.label).toBe('unknown');
    expect(config.variant).toBe('neutral');
  });

  it('returns fallback for undefined status', () => {
    const config = getServiceStatusConfig(undefined);
    expect(config.label).toBe('--');
    expect(config.variant).toBe('neutral');
  });

  it('is case-insensitive for string keys', () => {
    const config = getServiceStatusConfig('NEW');
    expect(config.label).toBe('Новая');
  });
});

describe('SERVICE_STATUS_OPTIONS', () => {
  it('starts with "all statuses" option', () => {
    expect(SERVICE_STATUS_OPTIONS[0]).toEqual({ value: '', label: 'Все статусы' });
  });

  it('contains 6 entries (all + 5 statuses)', () => {
    expect(SERVICE_STATUS_OPTIONS).toHaveLength(6);
  });

  it('has numeric string values', () => {
    const values = SERVICE_STATUS_OPTIONS.map((o) => o.value);
    expect(values).toContain('0');
    expect(values).toContain('4');
  });
});
