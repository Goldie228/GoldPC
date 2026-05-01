/**
 * Shared Types - API and Domain Types
 * 
 * This folder contains:
 * - api.ts - API response types (re-exported from api/)
 * - pc-builder.ts - PC Builder domain types
 * - index.ts - Barrel export
 * 
 * Layer Rules:
 * - Only type definitions (no runtime code)
 * - Re-export from api/ when possible to avoid duplication
 * - Domain types that cross multiple features go here
 */

export type {} from '../../api/types';