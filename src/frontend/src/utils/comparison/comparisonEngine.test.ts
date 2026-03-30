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

  it('монитор: разрешение (кириллица) — без подсветки (разные соотношения сторон вводят в заблуждение)', () => {
    const evaluation = evaluateComparison('monitor', 'разрешение', [
      '1920x1080',
      '1920x1080',
      '2560x1440',
      '1920x1080',
    ]);
    expect(evaluation.mode).toBe('none');
    expect(Array.from(evaluation.bestIndices)).toEqual([]);
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

  // ─── Исправления по аудиту v2.1 ─────────────────────────────────────────

  it('[1.1] RAM voltage: при mixed DDR4/DDR5 (contextValues) отключается подсветка', () => {
    const ctx = {
      memory_type: ['DDR5', 'DDR5', 'DDR5', 'DDR4'],
    };
    const evaluation = evaluateComparison('ram', 'voltage', ['1.1', '1.1', '1.1', '1.2'], ctx);
    expect(evaluation.mode).toBe('none');
    expect(Array.from(evaluation.bestIndices)).toEqual([]);
  });

  it('[1.1] RAM voltage: при одном поколении DDR5 — подсветка работает (min)', () => {
    const ctx = {
      memory_type: ['DDR5', 'DDR5', 'DDR5', 'DDR5'],
    };
    const evaluation = evaluateComparison('ram', 'напряжение_питания', ['1.1', '1.1', '1.35', '1.1'], ctx);
    expect(evaluation.mode).toBe('min');
    expect(Array.from(evaluation.bestIndices).sort((a, b) => a - b)).toEqual([0, 1, 3]);
  });

  it('[1.2] Наушники: чувствительность при отрицательных значениях (микрофон) — без подсветки', () => {
    const evaluation = evaluateComparison('headphones', 'чувствительность', ['93.6 дБ', '107 дБ', '-35 дБ', '-38 дБ']);
    expect(evaluation.mode).toBe('none');
    expect(Array.from(evaluation.bestIndices)).toEqual([]);
  });

  it('[1.3] Мышь: оплётка провода — без подсветки (субъективно)', () => {
    const evaluation = evaluateComparison('mice', 'оплетка_провода', ['Да', 'Нет', 'Нет', 'Да']);
    expect(evaluation.mode).toBe('none');
    expect(Array.from(evaluation.bestIndices)).toEqual([]);
  });

  it('[2.1] GPU: ширина шины памяти — 128 бит лучше 64', () => {
    const evaluation = evaluateComparison('gpu', 'ширина_шины_памяти', ['128', '128', '128', '64']);
    expect(evaluation.mode).toBe('max');
    expect(Array.from(evaluation.bestIndices).sort((a, b) => a - b)).toEqual([0, 1, 2]);
  });

  it('[2.1] GPU: максимальная частота GPU — max', () => {
    const evaluation = evaluateComparison('gpu', 'максимальная_частота_графического_процессора', ['2602', '2587', '2602', '1354']);
    expect(evaluation.mode).toBe('max');
    expect(Array.from(evaluation.bestIndices).sort((a, b) => a - b)).toEqual([0, 2]);
  });

  it('[2.2] Монитор: контрастность — OLED 1 000 000:1 лучше IPS 1 000:1', () => {
    const evaluation = evaluateComparison('monitors', 'контрастность', ['1 000 000 :1', '1 000 :1', '4 000 :1', '1 000 :1']);
    expect(evaluation.mode).toBe('max');
    expect(Array.from(evaluation.bestIndices)).toEqual([0]);
  });

  it('[2.2] Монитор: версия HDMI — 2.1 лучше 2.0 лучше 1.4', () => {
    const evaluation = evaluateComparison('monitors', 'версия_hdmi', ['HDMI 2.1', 'HDMI 2.0', 'HDMI 1.4', 'HDMI 2.0']);
    expect(evaluation.mode).toBe('max');
    expect(Array.from(evaluation.bestIndices)).toEqual([0]);
  });

  it('[2.3] Материнская плата: USB4 — «2» лучше «Нет»', () => {
    const evaluation = evaluateComparison('motherboards', 'usb4_до_40_гбитс', ['Нет', 'Нет', 'Нет', '2']);
    expect(evaluation.mode).toBe('max');
    expect(Array.from(evaluation.bestIndices)).toEqual([3]);
  });

  it('[2.3] Материнская плата: фазы питания — суммируются (16+2+2 > 8+2+1)', () => {
    const evaluation = evaluateComparison('motherboards', 'количество_фаз_питания', ['16+2+2', '12+1+1', '8+2+1', '12+1+1']);
    expect(evaluation.mode).toBe('max');
    expect(Array.from(evaluation.bestIndices)).toEqual([0]);
  });

  it('[2.4] Мышь: максимальная частота опроса — 8000 Гц лучше 1000', () => {
    const evaluation = evaluateComparison('mice', 'максимальная_частота_опроса', ['1000', '—', '1000', '8000 Гц']);
    expect(evaluation.mode).toBe('max');
    expect(Array.from(evaluation.bestIndices)).toEqual([3]);
  });

  it('[2.5] БП: Fan Stop — «Да» лучше прочерков', () => {
    const evaluation = evaluateComparison('psu', 'отключение_вентиляторов_fanstop', ['Да', '—', '—', '—']);
    expect(evaluation.mode).toBe('max');
    expect(Array.from(evaluation.bestIndices)).toEqual([0]);
  });

  it('[2.5] БП: сертификат 80+ — Platinum лучше Gold', () => {
    const evaluation = evaluateComparison('psu', 'сертификат_80_plus', ['платиновый', 'золотой', 'золотой', 'золотой']);
    expect(evaluation.mode).toBe('max');
    expect(Array.from(evaluation.bestIndices)).toEqual([0]);
  });

  it('[2.7] RAM: охлаждение (радиатор) — «Да» лучше «Нет»', () => {
    const evaluation = evaluateComparison('ram', 'охлаждение', ['Да', 'Да', 'Да', 'Нет']);
    expect(evaluation.mode).toBe('max');
    expect(Array.from(evaluation.bestIndices).sort((a, b) => a - b)).toEqual([0, 1, 2]);
  });

  it('[2.8] Накопитель: скорость шпинделя — 7200 лучше 5400', () => {
    const evaluation = evaluateComparison('storage', 'скорость_вращения_шпинделя', ['5400 об/мин', '7 200 об/мин', '7 200 об/мин', '7 200 об/мин']);
    expect(evaluation.mode).toBe('max');
    expect(Array.from(evaluation.bestIndices).sort((a, b) => a - b)).toEqual([1, 2, 3]);
  });

  it('[3.2] Монитор: refresh_rate со смесью «240 Гц» и boolean — без подсветки', () => {
    const evaluation = evaluateComparison('monitor', 'refresh_rate', ['false', '240 Гц', 'true', 'true']);
    expect(evaluation.mode).toBe('none');
  });

  it('[3.5] БП: «полностью модульное» распознаётся как true', () => {
    const evaluation = evaluateComparison('psu', 'modular', ['полностью модульное', 'полностью модульное', 'немодульный', 'модульный']);
    expect(evaluation.mode).toBe('max');
    expect(Array.from(evaluation.bestIndices).sort((a, b) => a - b)).toEqual([0, 1, 3]);
  });

  it('[3.6] Корпус: единственное числовое значение на фоне прочерков — победитель', () => {
    const evaluation = evaluateComparison('cases', 'общее_количество_мест_для_вентиляторов', ['11', '—', '—', '—']);
    expect(evaluation.mode).toBe('max');
    expect(Array.from(evaluation.bestIndices)).toEqual([0]);
  });

  it('[3.5/2.5] БП: «полностью модульное» и «true» дают ничью (все true)', () => {
    const evaluation = evaluateComparison('psu', 'modular', ['полностью модульное', 'true', 'модульный', 'полумодульный']);
    expect(evaluation.mode).toBe('max');
    expect(Array.from(evaluation.bestIndices)).toEqual([]);
  });

  // ─── Исправления по аудиту v2.2 ─────────────────────────────────────────

  it('[v2.2 brightness] монитор: raw-ключ brightness подавлен (corrupted), яркость работает', () => {
    // brightness в БД содержит «4502» вместо «450» — подавляем сравнение
    const raw = evaluateComparison('monitor', 'brightness', ['3502', '2502', '4502', '3002']);
    expect(raw.mode).toBe('none');
    expect(Array.from(raw.bestIndices)).toEqual([]);
    // яркость (алиас → brightness canonical) — работает корректно
    const correct = evaluateComparison('monitor', 'яркость', ['350 кд/м²', '250 кд/м²', '450 кд/м²', '300 кд/м²']);
    expect(correct.mode).toBe('max');
    expect(Array.from(correct.bestIndices)).toEqual([2]);
  });

  it('[v2.2 resolution] монитор: разрешение отключено (разные соотношения сторон)', () => {
    const evaluation = evaluateComparison('monitor', 'разрешение', ['3840x2160', '5120x1440', '1920x1080', '3840x2160']);
    expect(evaluation.mode).toBe('none');
    expect(Array.from(evaluation.bestIndices)).toEqual([]);
  });

  it('[v2.2 driver_size] наушники: размер излучателя без подсветки (cross-form-factor)', () => {
    const evaluation = evaluateComparison('headphones', 'driver_size', ['7', '40', '28']);
    expect(evaluation.mode).toBe('none');
    expect(Array.from(evaluation.bestIndices)).toEqual([]);
  });

  it('[v2.2 driver_size] наушники: размер_излучателя — алиас на driver_size (тоже none)', () => {
    const evaluation = evaluateComparison('headphones', 'размер_излучателя', ['7 мм', '40 мм', '28 мм']);
    expect(evaluation.mode).toBe('none');
  });

  it('[v2.2 battery_cap] наушники: емкость_аккумулятора (мА·ч) не сравнивается с часами работы', () => {
    const evaluation = evaluateComparison('headphones', 'емкость_аккумулятора', ['55', '—', '—', '—']);
    expect(evaluation.mode).toBe('none');
    expect(Array.from(evaluation.bestIndices)).toEqual([]);
  });

  it('[v2.2 multipoint] наушники: multipoint «2 устройства» побеждает «Нет»', () => {
    const evaluation = evaluateComparison('headphones', 'multipoint', ['—', 'Нет', '2 устройства', '2 устройства']);
    expect(evaluation.mode).toBe('max');
    expect(Array.from(evaluation.bestIndices).sort((a, b) => a - b)).toEqual([2, 3]);
  });

  it('[v2.2 qi] Qi-зарядка распознаётся как «есть» (true)', () => {
    const hp = evaluateComparison('headphones', 'беспроводная_зарядка', ['—', 'Qi', 'Нет', 'Qi']);
    expect(hp.mode).toBe('max');
    expect(Array.from(hp.bestIndices).sort((a, b) => a - b)).toEqual([1, 3]);
    const mouse = evaluateComparison('mice', 'беспроводная_зарядка', ['Нет', 'Qi', '—', '—']);
    expect(mouse.mode).toBe('max');
    expect(Array.from(mouse.bestIndices)).toEqual([1]);
  });

  it('[v2.2 cybenetics] БП: сертификат CYBENETICS — платиновый лучше «Нет»', () => {
    const evaluation = evaluateComparison('psu', 'сертификат_cybenetics', ['—', 'платиновый', 'Нет', 'Нет']);
    expect(evaluation.mode).toBe('max');
    expect(Array.from(evaluation.bestIndices)).toEqual([1]);
  });

  it('[v2.2 device_switching] клавиатура: 3 устройства побеждает «Нет»', () => {
    const evaluation = evaluateComparison('keyboard', 'переключение_между_устройствами', ['3', 'Нет', '3', '3']);
    expect(evaluation.mode).toBe('max');
    expect(Array.from(evaluation.bestIndices).sort((a, b) => a - b)).toEqual([0, 2, 3]);
  });

  it('[v2.2 argb] материнская плата: ARGB разъёмы — 3 > «Нет»', () => {
    const evaluation = evaluateComparison('motherboards', 'разъемы_для_подсветки_argb_5в', ['3', '2', 'Нет', 'Нет']);
    expect(evaluation.mode).toBe('max');
    expect(Array.from(evaluation.bestIndices)).toEqual([0]);
  });

  it('[v2.2 REVERTED backlight] GPU: подсветка — без подсветки (стелс-сборки популярны)', () => {
    const evaluation = evaluateComparison('gpu', 'подсветка', ['Нет', 'Нет', 'Да', '—']);
    expect(evaluation.mode).toBe('none');
    expect(Array.from(evaluation.bestIndices)).toEqual([]);
  });

  it('[v2.2 silent] мышь: тихий_клик — «Да» лучше «Нет»', () => {
    const evaluation = evaluateComparison('mice', 'тихий_клик', ['Нет', 'Нет', 'Нет', 'Да']);
    expect(evaluation.mode).toBe('max');
    expect(Array.from(evaluation.bestIndices)).toEqual([3]);
  });

  it('[v2.2 REVERTED numpad] клавиатура: цифровой_блок — без подсветки (TKL формат популярен)', () => {
    const evaluation = evaluateComparison('keyboard', 'цифровой_блок', ['Нет', '—', 'Да', 'Да']);
    expect(evaluation.mode).toBe('none');
    expect(Array.from(evaluation.bestIndices)).toEqual([]);
  });

  it('[v2.2 bundled_fans] корпус: вентиляторы_в_комплекте — «Да» лучше «Нет»', () => {
    const evaluation = evaluateComparison('cases', 'вентиляторы_в_комплекте', ['Да', '—', 'Нет', 'Да']);
    expect(evaluation.mode).toBe('max');
    expect(Array.from(evaluation.bestIndices).sort((a, b) => a - b)).toEqual([0, 3]);
  });

  it('[v2.2 waterblock] кулер: дисплей на водоблоке — «Да» лучше «Нет»', () => {
    const evaluation = evaluateComparison('cooling', 'встроенный_дисплей_на_водоблоке', ['—', 'Нет', 'Да', 'Нет']);
    expect(evaluation.mode).toBe('max');
    expect(Array.from(evaluation.bestIndices)).toEqual([2]);
  });

  it('[v2.2 adaptive_sync] монитор: динамическая частота — «Да» лучше «Нет»', () => {
    const evaluation = evaluateComparison('monitors', 'динамическая_частота_обновления_экрана', ['Нет', '—', 'Да', 'Да']);
    expect(evaluation.mode).toBe('max');
    expect(Array.from(evaluation.bestIndices).sort((a, b) => a - b)).toEqual([2, 3]);
  });

  it('[v2.2 battery_life] наушники: время_работы_с_зарядным_кейсом маппится на battery_life', () => {
    const evaluation = evaluateComparison('headphones', 'время_работы_с_зарядным_кейсом', ['28 ч', '—', '20 ч', '—']);
    expect(evaluation.mode).toBe('max');
    expect(Array.from(evaluation.bestIndices)).toEqual([0]);
  });

  // ─── Исправления по аудиту v2.3 ─────────────────────────────────────────

  it('[v2.3 mouse weight] мышь: вес — меньше лучше (54 г лучше 62 г)', () => {
    const evaluation = evaluateComparison('mice', 'вес', ['54 г', '60 г', '62 г', '57 г']);
    expect(evaluation.mode).toBe('min');
    expect(Array.from(evaluation.bestIndices)).toEqual([0]);
  });

  it('[v2.3 rt_cores] GPU: RT-ядра — 36 побеждает пустоту', () => {
    const evaluation = evaluateComparison('gpu', 'количество_rtядер', ['36', '—', '—', '—']);
    expect(evaluation.mode).toBe('max');
    expect(Array.from(evaluation.bestIndices)).toEqual([0]);
  });

  it('[v2.3 usb_c] корпус: USB-C Gen2 10G — 1 лучше «Нет»', () => {
    const evaluation = evaluateComparison('cases', 'usb_32_gen2_typec_10_гбитс', ['1', '1', '1', 'Нет']);
    expect(evaluation.mode).toBe('max');
    expect(Array.from(evaluation.bestIndices).sort((a, b) => a - b)).toEqual([0, 1, 2]);
  });

  it('[v2.3 antivib] кулер: антивибрационные прокладки — «Да» лучше пустоты', () => {
    const evaluation = evaluateComparison('cooling', 'антивибрационные_прокладки', ['—', 'Нет', 'Да', 'Да']);
    expect(evaluation.mode).toBe('max');
    expect(Array.from(evaluation.bestIndices).sort((a, b) => a - b)).toEqual([2, 3]);
  });

  it('[v2.3 max_mem_freq] материнка: частота при mixed DDR4/DDR5 отключается', () => {
    const ctx = {
      memory_type: ['DDR5', 'DDR4', 'DDR5', 'DDR5'],
    };
    const evaluation = evaluateComparison('motherboards', 'максимальная_частота_памяти', ['8200', '4933', '8200', '8200'], ctx);
    expect(evaluation.mode).toBe('none');
    expect(Array.from(evaluation.bestIndices)).toEqual([]);
  });

  it('[v2.3 max_mem_freq] материнка: частота при одном DDR5 — max работает', () => {
    const ctx = {
      memory_type: ['DDR5', 'DDR5', 'DDR5', 'DDR5'],
    };
    const evaluation = evaluateComparison('motherboards', 'max_memory_freq', ['8200', '6400', '8200', '7200'], ctx);
    expect(evaluation.mode).toBe('max');
    expect(Array.from(evaluation.bestIndices).sort((a, b) => a - b)).toEqual([0, 2]);
  });

  it('[v2.3 parser] препроцессор отрезает г, ч, мм', () => {
    expect(preprocessForNumericExtraction('54 г')).toBe('54');
    expect(preprocessForNumericExtraction('28 ч')).toBe('28');
    expect(preprocessForNumericExtraction('130 мм')).toBe('130');
  });
});

