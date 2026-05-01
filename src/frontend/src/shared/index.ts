/**
 * Shared Layer - Cross-cutting utilities and types
 * 
 * This folder contains:
 * - types/ - Shared type definitions
 * - utils/ - Pure utility functions
 * 
 * Layer Rules:
 * - No React dependencies
 * - No API calls
 * - No side effects
 * - Can be used by any layer (ui, features, widgets, pages)
 */

export * from './types';
export * from './utils';