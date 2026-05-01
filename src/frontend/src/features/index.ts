/**
 * Features - Business Logic Layer
 * 
 * This folder contains feature-based modules with business logic.
 * Each feature folder should contain:
 * - hooks/ - Custom hooks for feature logic
 * - types.ts - Feature-specific types
 * - index.ts - Barrel export
 * 
 * Layer Rules:
 * - features/ can import from api/, store/, shared/
 * - features/ should NOT directly render UI (use widgets instead)
 * - features/ can contain business logic, state management, API calls
 */

export * from './catalog';
export * from './pc-builder';