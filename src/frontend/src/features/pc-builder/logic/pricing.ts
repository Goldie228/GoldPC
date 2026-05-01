/**
 * Pricing Calculations
 * Pure functions for calculating total price and performance
 * Extracted from usePCBuilder.ts for better organization
 */

import type { PCBuilderSelectedState } from './types';

export function calculateTotalPrice(components: PCBuilderSelectedState): number {
  let sum = 0;
  const s = components;
  
  if (s.cpu) sum += s.cpu.product.price;
  if (s.gpu) sum += s.gpu.product.price;
  if (s.motherboard) sum += s.motherboard.product.price;
  if (s.psu) sum += s.psu.product.price;
  if (s.case) sum += s.case.product.price;
  if (s.cooling) sum += s.cooling.product.price;
  
  for (const r of s.ram) sum += r.product.price;
  for (const st of s.storage) sum += st.product.price;
  for (const f of s.fan) sum += f.product.price;
  if (s.monitor) sum += s.monitor.product.price;
  if (s.keyboard) sum += s.keyboard.product.price;
  if (s.mouse) sum += s.mouse.product.price;
  if (s.headphones) sum += s.headphones.product.price;

  return sum;
}