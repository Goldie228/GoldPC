import { describe, it, expect } from 'vitest';
import { checkCPUSocket, checkRAM } from '../checks';

// Helper: minimal Product-like object for tests
function makeProduct(
  overrides: Record<string, unknown> = {},
  specs: Record<string, string | number | boolean | undefined> = {},
) {
  return {
    id: 'test-id',
    name: 'Test Product',
    sku: 'TST-001',
    slug: 'test-product',
    category: 'cpu' as const,
    brand: 'TestBrand',
    price: 100,
    oldPrice: undefined,
    stock: 10,
    mainImage: undefined,
    rating: undefined,
    reviewCount: undefined,
    isActive: true,
    descriptionShort: undefined,
    socket: undefined,
    memoryType: undefined,
    memoryFormFactor: undefined,
    tdp: undefined,
    wattage: undefined,
    images: undefined,
    shortName: undefined,
    manufacturerId: undefined,
    warrantyMonths: undefined,
    description: undefined,
    specifications: specs,
    ...overrides,
  };
}

// ─── checkCPUSocket ───

describe('checkCPUSocket', () => {
  it('возвращает null когда сокеты CPU и MB совпадают (AM5 + AM5)', () => {
    const cpu = makeProduct({ name: 'AMD Ryzen 7' }, { socket: 'AM5' });
    const mb = makeProduct({ name: 'ASUS X670E' }, { socket: 'AM5' });
    expect(checkCPUSocket(cpu, mb)).toBeNull();
  });

  it('возвращает null когда сокеты совпадают (LGA1700 + LGA1700)', () => {
    const cpu = makeProduct({ name: 'Intel i7-13700K' }, { socket: 'LGA1700' });
    const mb = makeProduct({ name: 'MSI Z790' }, { socket: 'LGA1700' });
    expect(checkCPUSocket(cpu, mb)).toBeNull();
  });

  it('возвращает Error при несовпадении сокетов (AM5 vs LGA1700)', () => {
    const cpu = makeProduct({ name: 'AMD Ryzen 7' }, { socket: 'AM5' });
    const mb = makeProduct({ name: 'MSI Z790' }, { socket: 'LGA1700' });
    const result = checkCPUSocket(cpu, mb);
    expect(result).not.toBeNull();
    expect(result!.severity).toBe('Error');
    expect(result!.message).toContain('AM5');
    expect(result!.message).toContain('LGA1700');
  });

  it('возвращает Error когда сокет CPU неизвестен (fail-closed)', () => {
    const cpu = makeProduct({ name: 'Unknown CPU' }, { socket: 'UNKNOWN' });
    const mb = makeProduct({ name: 'ASUS X670E' }, { socket: 'AM5' });
    const result = checkCPUSocket(cpu, mb);
    expect(result).not.toBeNull();
    expect(result!.severity).toBe('Error');
    expect(result!.message).toContain('Не удалось определить сокет');
    expect(result!.message).toContain('Unknown CPU');
  });

  it('возвращает Error когда сокет MB неизвестен (fail-closed)', () => {
    const cpu = makeProduct({ name: 'AMD Ryzen 7' }, { socket: 'AM5' });
    const mb = makeProduct({ name: 'Unknown MB' }, { socket: 'UNKNOWN' });
    const result = checkCPUSocket(cpu, mb);
    expect(result).not.toBeNull();
    expect(result!.severity).toBe('Error');
    expect(result!.message).toContain('Не удалось определить сокет');
    expect(result!.message).toContain('Unknown MB');
  });

  it('возвращает Error когда оба сокета неизвестны (fail-closed)', () => {
    const cpu = makeProduct({ name: 'Unknown CPU' }, {});
    const mb = makeProduct({ name: 'Unknown MB' }, {});
    const result = checkCPUSocket(cpu, mb);
    expect(result).not.toBeNull();
    expect(result!.severity).toBe('Error');
    expect(result!.message).toContain('Не удалось определить сокет');
  });
});

// ─── checkRAM ───

describe('checkRAM', () => {
  it('возвращает null когда тип памяти и форм-фактор совпадают', () => {
    const ram = makeProduct(
      { name: 'Kingston DDR5', category: 'ram' as const },
      { memoryType: 'DDR5-4800', memoryFormFactor: 'DIMM', capacity: 16 },
    );
    const mb = makeProduct(
      { name: 'ASUS Z790', category: 'motherboard' as const },
      { memoryType: 'DDR5', memoryFormFactor: 'DIMM', memorySlots: 4, maxMemory: 128 },
    );
    expect(checkRAM(ram, mb)).toBeNull();
  });

  it('возвращает null для DDR4 с совпадающими параметрами', () => {
    const ram = makeProduct(
      { name: 'Corsair Vengeance DDR4', category: 'ram' as const },
      { memoryType: 'DDR4-3200', memoryFormFactor: 'DIMM', capacity: 8 },
    );
    const mb = makeProduct(
      { name: 'MSI B550', category: 'motherboard' as const },
      { memoryType: 'DDR4', memoryFormFactor: 'DIMM', memorySlots: 4 },
    );
    expect(checkRAM(ram, mb)).toBeNull();
  });

  it('возвращает Error при несовпадении типа памяти (DDR5 vs DDR4)', () => {
    const ram = makeProduct(
      { name: 'Kingston DDR5', category: 'ram' as const },
      { memoryType: 'DDR5', memoryFormFactor: 'DIMM' },
    );
    const mb = makeProduct(
      { name: 'ASUS B550', category: 'motherboard' as const },
      { memoryType: 'DDR4', memoryFormFactor: 'DIMM' },
    );
    const result = checkRAM(ram, mb);
    expect(result).not.toBeNull();
    expect(result!.severity).toBe('Error');
    expect(result!.message).toContain('DDR5');
    expect(result!.message).toContain('DDR4');
  });

  it('возвращает Error когда тип памяти RAM неизвестен (fail-closed)', () => {
    const ram = makeProduct(
      { name: 'Unknown RAM', category: 'ram' as const },
      { memoryFormFactor: 'DIMM', capacity: 8 },
    );
    const mb = makeProduct(
      { name: 'ASUS Z790', category: 'motherboard' as const },
      { memoryType: 'DDR5', memoryFormFactor: 'DIMM' },
    );
    const result = checkRAM(ram, mb);
    expect(result).not.toBeNull();
    expect(result!.severity).toBe('Error');
    expect(result!.message).toContain('Не удалось определить тип памяти');
    expect(result!.message).toContain('Unknown RAM');
  });

  it('возвращает Error когда тип памяти MB неизвестен (fail-closed)', () => {
    const ram = makeProduct(
      { name: 'Kingston DDR5', category: 'ram' as const },
      { memoryType: 'DDR5', memoryFormFactor: 'DIMM' },
    );
    const mb = makeProduct(
      { name: 'Unknown MB', category: 'motherboard' as const },
      { memoryFormFactor: 'DIMM' },
    );
    const result = checkRAM(ram, mb);
    expect(result).not.toBeNull();
    expect(result!.severity).toBe('Error');
    expect(result!.message).toContain('Не удалось определить тип памяти');
    expect(result!.message).toContain('Unknown MB');
  });

  it('возвращает Error при несовпадении форм-фактора (SO-DIMM vs DIMM)', () => {
    const ram = makeProduct(
      { name: 'Laptop RAM', category: 'ram' as const },
      { memoryType: 'DDR5', memoryFormFactor: 'SO-DIMM' },
    );
    const mb = makeProduct(
      { name: 'ASUS Z790', category: 'motherboard' as const },
      { memoryType: 'DDR5', memoryFormFactor: 'DIMM' },
    );
    const result = checkRAM(ram, mb);
    expect(result).not.toBeNull();
    expect(result!.severity).toBe('Error');
    expect(result!.message).toContain('SO-DIMM');
    expect(result!.message).toContain('DIMM');
  });

  it('возвращает Error когда форм-фактор RAM не определён (fail-closed)', () => {
    const ram = makeProduct(
      { name: 'Generic RAM Module', category: 'ram' as const },
      { memoryType: 'DDR5' },
    );
    const mb = makeProduct(
      { name: 'ASUS Z790', category: 'motherboard' as const },
      { memoryType: 'DDR5', memoryFormFactor: 'DIMM' },
    );
    const result = checkRAM(ram, mb);
    expect(result).not.toBeNull();
    expect(result!.severity).toBe('Error');
    expect(result!.message).toContain('Не удалось определить форм-фактор памяти');
  });

  it('возвращает Error когда кол-во планок превышает число слотов', () => {
    const ram = makeProduct(
      { name: 'Kingston DDR5', category: 'ram' as const },
      { memoryType: 'DDR5', memoryFormFactor: 'DIMM', capacity: 16 },
    );
    const mb = makeProduct(
      { name: 'Mini-ITX MB', category: 'motherboard' as const },
      { memoryType: 'DDR5', memoryFormFactor: 'DIMM', memorySlots: 2, maxMemory: 64 },
    );
    const result = checkRAM(ram, mb, 4);
    expect(result).not.toBeNull();
    expect(result!.severity).toBe('Error');
    expect(result!.message).toContain('4');
    expect(result!.message).toContain('2');
  });

  it('возвращает Warning когда общий объём превышает макс. поддерживаемый', () => {
    const ram = makeProduct(
      { name: '64GB DDR5', category: 'ram' as const },
      { memoryType: 'DDR5', memoryFormFactor: 'DIMM', capacity: 64 },
    );
    const mb = makeProduct(
      { name: 'ASUS Z790', category: 'motherboard' as const },
      { memoryType: 'DDR5', memoryFormFactor: 'DIMM', memorySlots: 2, maxMemory: 64 },
    );
    const result = checkRAM(ram, mb, 2);
    expect(result).not.toBeNull();
    expect(result!.severity).toBe('Warning');
    expect(result!.message).toContain('128');
    expect(result!.message).toContain('64');
  });
});
