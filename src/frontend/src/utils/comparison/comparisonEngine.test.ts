import { describe, expect, it } from 'vitest';
import { evaluateComparison, preprocessForNumericExtraction } from './comparisonEngine';

describe('comparisonEngine', () => {
  it('считает техпроцесс как min (меньше лучше)', () => {
    const evaluation = evaluateComparison('cpu', 'process_nm', ['7', '14']);
    expect(Array.from(evaluation.bestIndices)).toEqual([0]);
    expect(evaluation.mode).toBe('min');
  });

  it('RAM: latency/CAS без подсветки (сравнение в отрыве от DDR/частоты вводит в заблуждение)', () => {
    const evaluation = evaluateComparison('ram', 'latency', ['36', '30', '32']);
    expect(evaluation.mode).toBe('none');
    expect(Array.from(evaluation.bestIndices)).toEqual([]);
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

  it('многопоточность: все «Да» — ничья, без подсветки', () => {
    const evaluation = evaluateComparison('cpu', 'multithreading', ['Да', 'Да']);
    expect(evaluation.mode).toBe('max');
    expect(Array.from(evaluation.bestIndices)).toEqual([]);
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

  it('наушники: частота дискретизации из описания — max (48 > 44.1)', () => {
    const evaluation = evaluateComparison('headphones', 'частота_дискретизации', ['44.1 кГц', '48 кГц']);
    expect(evaluation.mode).toBe('max');
    expect(Array.from(evaluation.bestIndices)).toEqual([1]);
  });

  it('наушники: Bluetooth по алиасу — max версии', () => {
    const evaluation = evaluateComparison('headphones', 'bluetooth', ['5.2', '5.3']);
    expect(evaluation.mode).toBe('max');
    expect(Array.from(evaluation.bestIndices)).toEqual([1]);
  });

  it('наушники: активное шумоподавление (кириллица) — «Да» лучше', () => {
    const evaluation = evaluateComparison('headphones', 'активное_шумоподавление', ['Нет', 'Да']);
    expect(evaluation.mode).toBe('max');
    expect(Array.from(evaluation.bestIndices)).toEqual([1]);
  });

  it('наушники: регулировка громкости из описания — «Да» лучше «Нет»', () => {
    const evaluation = evaluateComparison('headphones', 'регулировка_громкости', ['Да', 'Нет']);
    expect(evaluation.mode).toBe('max');
    expect(Array.from(evaluation.bestIndices)).toEqual([0]);
  });

  it('наушники: неизвестный ключ с только Да/Нет — fallback boolean max', () => {
    const evaluation = evaluateComparison('headphones', 'любая_новая_функция_из_описания', ['Нет', 'Да']);
    expect(evaluation.mode).toBe('max');
    expect(Array.from(evaluation.bestIndices)).toEqual([1]);
  });

  it('наушники: все «Да» в fallback — ничья, без подсветки', () => {
    const evaluation = evaluateComparison('headphones', 'новая_фича_все_да', ['Да', 'Да']);
    expect(evaluation.mode).toBe('max');
    expect(Array.from(evaluation.bestIndices)).toEqual([]);
  });

  it('наушники: неизвестный ключ с текстом — без fallback', () => {
    const evaluation = evaluateComparison('headphones', 'цвет_корпуса', ['черный', 'белый']);
    expect(evaluation.mode).toBe('none');
    expect(Array.from(evaluation.bestIndices)).toEqual([]);
  });

  it('клавиатура: неизвестный ключ Да/Нет — fallback boolean max', () => {
    const evaluation = evaluateComparison('keyboard', 'подставка_под_запястье', ['Нет', 'Да']);
    expect(evaluation.mode).toBe('max');
    expect(Array.from(evaluation.bestIndices)).toEqual([1]);
  });

  it('наушники: чувствительность — число из строки «100 дБ»', () => {
    const evaluation = evaluateComparison('headphones', 'чувствительность', ['95 дБ', '100 дБ']);
    expect(evaluation.mode).toBe('max');
    expect(Array.from(evaluation.bestIndices)).toEqual([1]);
  });

  it('RAM: ключ «частота» из описания мапится на frequency (max МГц)', () => {
    const evaluation = evaluateComparison('ram', 'частота', ['3200 МГц', '4800 МГц', '6000 МГц', '3200 МГц']);
    expect(evaluation.mode).toBe('max');
    expect(Array.from(evaluation.bestIndices)).toEqual([2]);
  });

  it('БП: modular — строка «модульный» считается true (max boolean)', () => {
    const evaluation = evaluateComparison('psu', 'modular', ['false', 'false', 'false', 'модульный']);
    expect(evaluation.mode).toBe('max');
    expect(Array.from(evaluation.bestIndices)).toEqual([3]);
  });

  it('GPU: длина карты без подсветки лучше (габарит)', () => {
    const evaluation = evaluateComparison('gpu', 'dlina_videokarty', [170, 250, 172]);
    expect(evaluation.mode).toBe('none');
    expect(Array.from(evaluation.bestIndices)).toEqual([]);
  });

  it('GPU: потоковые процессоры — пробел в тысячах («4 608») больше 384', () => {
    const evaluation = evaluateComparison('gpu', 'количество_потоковых_процессоров', ['384', '384', '4 608', '384']);
    expect(evaluation.mode).toBe('max');
    expect(Array.from(evaluation.bestIndices)).toEqual([2]);
  });

  it('GPU: пропускная способность памяти — «448 ГБ/с» парсится как число', () => {
    const evaluation = evaluateComparison('gpu', 'пропускная_способность_памяти', [
      '200 ГБ/с',
      '—',
      '448 ГБ/с',
      '300 ГБ/с',
    ]);
    expect(evaluation.mode).toBe('max');
    expect(Array.from(evaluation.bestIndices)).toEqual([2]);
  });

  it('GPU: пропускная способность — одно число на фоне прочерков (маркетинговый режим)', () => {
    const evaluation = evaluateComparison('gpu', 'пропускная_способность_памяти', ['—', '—', '448 ГБ/с', '—']);
    expect(evaluation.mode).toBe('max');
    expect(Array.from(evaluation.bestIndices)).toEqual([2]);
  });

  it('охлаждение: category как имя с витрины API (Системы охлаждения) — max воздушного потока', () => {
    const evaluation = evaluateComparison('Системы охлаждения', 'максимальный_воздушный_поток', [
      '43 CFM',
      '72.37 CFM',
      '72.5 CFM',
      '88.89 CFM',
    ]);
    expect(evaluation.mode).toBe('max');
    expect(Array.from(evaluation.bestIndices)).toEqual([3]);
  });

  it('охлаждение: category с витрины — min шума', () => {
    const evaluation = evaluateComparison('системы_охлаждения', 'максимальный_уровень_шума', [
      '27.3 дБ',
      '27.7 дБ',
      '30 дБ',
      '29.5 дБ',
    ]);
    expect(evaluation.mode).toBe('min');
    expect(Array.from(evaluation.bestIndices)).toEqual([0]);
  });

  it('GPU: трассировка лучей — «Да» лучше прочерков', () => {
    const evaluation = evaluateComparison('gpu', 'трассировка_лучей', ['—', '—', 'Да', '—']);
    expect(evaluation.mode).toBe('max');
    expect(Array.from(evaluation.bestIndices)).toEqual([2]);
  });

  it('наушники: шумоподавление микрофона (алиас) — два «Да»', () => {
    const evaluation = evaluateComparison('headphones', 'шумоподавление_микрофона', [
      'Нет',
      'Да',
      'Да',
      '—',
    ]);
    expect(evaluation.mode).toBe('max');
    expect(Array.from(evaluation.bestIndices).sort()).toEqual([1, 2]);
  });

  it('накопители: энергопотребление чтение/запись — min (Вт)', () => {
    const evaluation = evaluateComparison('storage', 'энергопотребление_чтениезапись', [
      '7.76 Вт',
      '9 Вт',
      '9.5 Вт',
      '16.35 Вт',
    ]);
    expect(evaluation.mode).toBe('min');
    expect(Array.from(evaluation.bestIndices)).toEqual([0]);
  });

  it('накопители: МТБФ в млн часов — max', () => {
    const evaluation = evaluateComparison('storage', 'время_наработки_на_отказ_мтbf', [
      '2 млн',
      '2 млн',
      '2.5 млн',
      '1.6 млн',
    ]);
    expect(evaluation.mode).toBe('max');
    expect(Array.from(evaluation.bestIndices)).toEqual([2]);
  });

  it('корпус: макс. высота кулера CPU (кириллица) — max', () => {
    const evaluation = evaluateComparison('case', 'макс_высота_процессорного_кулера', [
      '160 мм',
      '185 мм',
      '160 мм',
      '185 мм',
    ]);
    expect(evaluation.mode).toBe('max');
    expect(Array.from(evaluation.bestIndices).sort((a, b) => a - b)).toEqual([1, 3]);
  });

  it('препроцессинг числа: тысячи и единицы', () => {
    expect(preprocessForNumericExtraction('4 608')).toBe('4608');
    expect(preprocessForNumericExtraction('448 ГБ/с')).toBe('448');
  });

  it('монитор: refresh_rate с true/false вместо Гц — без режима сравнения', () => {
    const evaluation = evaluateComparison('monitor', 'refresh_rate', ['true', 'true', 'false', 'false']);
    expect(evaluation.mode).toBe('none');
    expect(Array.from(evaluation.bestIndices)).toEqual([]);
  });

  it('монитор: refresh_rate с числами — как обычно max', () => {
    const evaluation = evaluateComparison('monitor', 'refresh_rate', ['60', '144', '60', '75']);
    expect(evaluation.mode).toBe('max');
    expect(Array.from(evaluation.bestIndices)).toEqual([1]);
  });

  it('монитор: одинаковая частота — ничья', () => {
    const evaluation = evaluateComparison('monitor', 'refresh_rate', ['75', '75', '75', '75']);
    expect(evaluation.mode).toBe('max');
    expect(Array.from(evaluation.bestIndices)).toEqual([]);
  });

  it('монитор: разрешение (кириллица) — max по числу пикселей', () => {
    const evaluation = evaluateComparison('monitor', 'разрешение', [
      '1920x1080',
      '1920x1080',
      '2560x1440',
      '1920x1080',
    ]);
    expect(evaluation.mode).toBe('max');
    expect(Array.from(evaluation.bestIndices)).toEqual([2]);
  });

  it('год релиза: без подсветки', () => {
    const evaluation = evaluateComparison('gpu', 'release_year', ['2017', '2020', '2025', '2019']);
    expect(evaluation.mode).toBe('none');
    expect(Array.from(evaluation.bestIndices)).toEqual([]);
  });

  it('БП: кпд (алиас) — max по процентам', () => {
    const evaluation = evaluateComparison('psu', 'кпд', ['92 %', '75 %', '80 %', '75 %']);
    expect(evaluation.mode).toBe('max');
    expect(Array.from(evaluation.bestIndices)).toEqual([0]);
  });

  it('мышь: колёса прокрутки — без подсветки (явное none)', () => {
    const evaluation = evaluateComparison('mouse', 'количество_колёс_прокрутки', ['1', '1', '1', '1']);
    expect(evaluation.mode).toBe('none');
    expect(Array.from(evaluation.bestIndices)).toEqual([]);
  });

  it('клавиатура: беспроводное подключение — без подсветки (субъективно)', () => {
    const evaluation = evaluateComparison('keyboard', 'беспроводное_подключение', ['Да', 'Нет', 'Да', 'Нет']);
    expect(evaluation.mode).toBe('none');
    expect(Array.from(evaluation.bestIndices)).toEqual([]);
  });

  it('наушники: вес без подсветки (разный форм-фактор)', () => {
    const evaluation = evaluateComparison('headphones', 'вес', ['280 г', '4.3 г']);
    expect(evaluation.mode).toBe('none');
    expect(Array.from(evaluation.bestIndices)).toEqual([]);
  });

  it('накопители: ёмкость сравнивается в ГБ (ТБ и голые числа как ГБ)', () => {
    const evaluation = evaluateComparison('storage', 'capacity', ['4 ТБ', '300', '12 ТБ', '600']);
    expect(evaluation.mode).toBe('max');
    expect(Array.from(evaluation.bestIndices)).toEqual([2]);
  });

  it('накопители: только одно распознанное значение — без подсветки', () => {
    const evaluation = evaluateComparison('storage', 'capacity', ['—', 'n/a', '12 ТБ', '']);
    expect(evaluation.mode).toBe('max');
    expect(Array.from(evaluation.bestIndices)).toEqual([]);
  });

  it('наушники: регулятор_громкости — тот же алиас, что регулировка_громкости', () => {
    const a = evaluateComparison('headphones', 'регулятор_громкости', ['Да', 'Нет']);
    const b = evaluateComparison('headphones', 'регулировка_громкости', ['Да', 'Нет']);
    expect(a.mode).toBe('max');
    expect(b.mode).toBe('max');
    expect(Array.from(a.bestIndices)).toEqual(Array.from(b.bestIndices));
  });

  it('клавиатура: usbпорт (опечатка в ключе) — без сравнения лучше/хуже', () => {
    const evaluation = evaluateComparison('keyboards', 'usbпорт', ['Нет', 'Нет', 'Да', 'Нет']);
    expect(evaluation.mode).toBe('none');
    expect(Array.from(evaluation.bestIndices)).toEqual([]);
  });
});

