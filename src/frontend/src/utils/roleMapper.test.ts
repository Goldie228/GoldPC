import { describe, it, expect } from 'vitest';
import { mapBackendRole, mapBackendRoles, BackendRole } from './roleMapper';

describe('mapBackendRole', () => {
  // ── Numeric roles ─────────────────────────────────────────────────

  describe('numeric roles', () => {
    it('maps 0 to Client', () => {
      expect(mapBackendRole(0)).toBe('Client');
    });

    it('maps 1 to Manager', () => {
      expect(mapBackendRole(1)).toBe('Manager');
    });

    it('maps 2 to Master', () => {
      expect(mapBackendRole(2)).toBe('Master');
    });

    it('maps 3 to Admin', () => {
      expect(mapBackendRole(3)).toBe('Admin');
    });

    it('maps 4 to Accountant', () => {
      expect(mapBackendRole(4)).toBe('Accountant');
    });

    it('maps unknown number to Client (fallback)', () => {
      expect(mapBackendRole(99)).toBe('Client');
    });
  });

  // ── String roles ──────────────────────────────────────────────────

  describe('string roles', () => {
    it('returns valid string role as-is', () => {
      expect(mapBackendRole('Client')).toBe('Client');
      expect(mapBackendRole('Manager')).toBe('Manager');
      expect(mapBackendRole('Master')).toBe('Master');
      expect(mapBackendRole('Admin')).toBe('Admin');
      expect(mapBackendRole('Accountant')).toBe('Accountant');
    });

    it('returns Client for invalid string role', () => {
      expect(mapBackendRole('InvalidRole')).toBe('Client');
    });
  });

  // ── Nullish and undefined ─────────────────────────────────────────

  describe('nullish and undefined', () => {
    it('returns Client for undefined', () => {
      expect(mapBackendRole(undefined)).toBe('Client');
    });

    it('returns Client for null', () => {
      expect(mapBackendRole(null)).toBe('Client');
    });
  });
});

describe('mapBackendRoles', () => {
  it('maps array of numeric roles', () => {
    expect(mapBackendRoles([0, 1, 2])).toEqual(['Client', 'Manager', 'Master']);
  });

  it('maps array of string roles', () => {
    expect(mapBackendRoles(['Admin', 'Manager'])).toEqual(['Admin', 'Manager']);
  });

  it('maps mixed array', () => {
    expect(mapBackendRoles([3, 'Master'])).toEqual(['Admin', 'Master']);
  });

  it('returns [Client] for undefined', () => {
    expect(mapBackendRoles(undefined)).toEqual(['Client']);
  });

  it('returns [Client] for null', () => {
    expect(mapBackendRoles(null)).toEqual(['Client']);
  });

  it('returns [Client] for empty array', () => {
    expect(mapBackendRoles([])).toEqual(['Client']);
  });

  it('maps unknown numbers to Client fallback', () => {
    expect(mapBackendRoles([99, 0])).toEqual(['Client', 'Client']);
  });
});

describe('BackendRole', () => {
  it('has correct numeric values', () => {
    expect(BackendRole.Client).toBe(0);
    expect(BackendRole.Manager).toBe(1);
    expect(BackendRole.Master).toBe(2);
    expect(BackendRole.Admin).toBe(3);
    expect(BackendRole.Accountant).toBe(4);
  });
});
