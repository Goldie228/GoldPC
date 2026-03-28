import { describe, expect, it } from 'vitest';
import { evaluateComparison } from './comparisonEngine';

describe('comparisonEngine', () => {
  it('считает техпроцесс как min (меньше лучше)', () => {
    const evaluation = evaluateComparison('cpu', 'process_nm', ['7', '14']);
    expect(Array.from(evaluation.bestIndices)).toEqual([0]);
    expect(evaluation.mode).toBe('min');
  });

  it('считает latency как min (меньше лучше)', () => {
    const evaluation = evaluateComparison('ram', 'latency', ['36', '30', '32']);
    expect(Array.from(evaluation.bestIndices)).toEqual([1]);
    expect(evaluation.mode).toBe('min');
  });

  it('не пытается выбрать bestValue для сокета и возвращает совместимость', () => {
    const sameSocket = evaluateComparison('cpu', 'socket', ['LGA1700', 'LGA1700']);
    expect(sameSocket.mode).toBe('compatibility');
    expect(Array.from(sameSocket.bestIndices)).toEqual([]);
    expect(sameSocket.compatibilityState).toBe('allMatch');

    const differentSocket = evaluateComparison('cpu', 'socket', ['LGA1700', 'AM5']);
    expect(differentSocket.compatibilityState).toBe('allDifferent');
  });

  it('не парсит строковые идентификаторы как числовые', () => {
    const evaluation = evaluateComparison('cpu', 'socket', ['LGA1700', 'SP5']);
    expect(Array.from(evaluation.bestIndices)).toEqual([]);
    expect(evaluation.compatibilityState).toBe('allDifferent');
  });

  it('smoke: корректно работает на смешанных категориях', () => {
    const cpuEval = evaluateComparison('cpu', 'cores', [8, 12]);
    const hpEval = evaluateComparison('headphones', 'connection_type', ['USB-C', 'Bluetooth']);

    expect(cpuEval.mode).toBe('max');
    expect(Array.from(cpuEval.bestIndices)).toEqual([1]);

    expect(hpEval.mode).toBe('compatibility');
    expect(hpEval.compatibilityState).toBe('allDifferent');
    expect(Array.from(hpEval.bestIndices)).toEqual([]);
  });

  it('многопоточность: «Да» лучше «Нет» (max boolean)', () => {
    const evaluation = evaluateComparison('cpu', 'multithreading', ['Да', 'Нет']);
    expect(evaluation.mode).toBe('max');
    expect(Array.from(evaluation.bestIndices)).toEqual([0]);
  });

  it('ECC: true лучше false (max boolean)', () => {
    const evaluation = evaluateComparison('ram', 'ecc', [true, false]);
    expect(evaluation.mode).toBe('max');
    expect(Array.from(evaluation.bestIndices)).toEqual([0]);
  });

  it('окно корпуса: без подсветки (mode none)', () => {
    const evaluation = evaluateComparison('case', 'window', ['Да', 'Нет']);
    expect(evaluation.mode).toBe('none');
    expect(Array.from(evaluation.bestIndices)).toEqual([]);
  });
});

