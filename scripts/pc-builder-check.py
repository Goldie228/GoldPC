#!/usr/bin/env python3
"""
PC Builder — Business Logic Check
~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
Проверяет совместимость компонентов в pc-builder по РЕАЛЬНЫМ характеристикам товаров.

Как работает:
  1. Открывает страницу pc-builder через Playwright
  2. Собирает названия выбранных компонентов из DOM
  3. Для каждого товара получает slug и характеристики через API
  4. Проверяет совместимость: сокет, память, форм-фактор, TDP, слоты, частоту
  5. Выдаёт отчёт: что совместимо, а что нет

Запуск (после запуска dev-сервера):
  python3 scripts/pc-builder-check.py

Зависимости:
  pip install playwright requests
  playwright install chromium
"""

import json
import os
import re
import sys
import time
import traceback
from datetime import datetime, timezone
from pathlib import Path

import requests
from playwright.sync_api import sync_playwright, Error as PWError

# ─── Configuration ───────────────────────────────────────────────────────
BASE_URL = os.getenv("BASE_URL", "http://localhost:5173")
API_BASE = f"{BASE_URL}/api/v1"
LOG_FILE = os.getenv("LOG_FILE", str(Path(__file__).parent / "pc-builder-check.log"))
TIMEOUT = 10_000

# Категории компонентов для pc-builder
# Ключ — как отображается в DOM слота, значение — slug категории в API
CATEGORY_MAP = {
    "Процессор": "processors",
    "Материнская плата": "motherboards",
    "Оперативная память": "ram",
    "Накопитель": "storage",
    "Охлаждение": "coolers",
    "Система охлаждения": "coolers",
    "Видеокарта": "gpu",
    "Блок питания": "psu",
    "Корпус": "cases",
    "Вентилятор": "fans",
}

# ─── Logger ──────────────────────────────────────────────────────────────
class Logger:
    def __init__(self, path: str):
        self.path = path
        self.entries: list[dict] = []
        os.makedirs(os.path.dirname(path) or ".", exist_ok=True)
        with open(self.path, "w", encoding="utf-8") as f:
            f.write("")

    def _stamp(self) -> str:
        return datetime.now(timezone.utc).strftime("%H:%M:%S.%f")[:-3]

    def _write(self, level: str, msg: str):
        line = f"[{self._stamp()}] [{level}] {msg}"
        print(line)
        with open(self.path, "a", encoding="utf-8") as f:
            f.write(line + "\n")
        self.entries.append({"time": self._stamp(), "level": level, "msg": msg})

    def ok(self, msg):     self._write("OK", msg)
    def info(self, msg):   self._write("INFO", msg)
    def warn(self, msg):   self._write("WARN", msg)
    def error(self, msg):  self._write("ERROR", msg)
    def compat(self, msg): self._write("COMPAT", msg)
    def check(self, msg):  self._write("CHECK", msg)
    def action(self, msg): self._write("ACTION", msg)

logger = Logger(LOG_FILE)

# ─── Spec helpers ────────────────────────────────────────────────────────

def get_spec(specs: dict | None, *keys: str):
    """Находит значение в specifications по одному из ключей (регистронезависимо)."""
    if not specs:
        return None
    for key in keys:
        for k, v in specs.items():
            if k.strip().lower() == key.strip().lower():
                return v
    return None


def extract_number(val) -> float | None:
    """Извлекает число из значения (int, float, или строка '64 ГБ', '3200 МГц')."""
    if val is None:
        return None
    if isinstance(val, bool):
        return None
    if isinstance(val, (int, float)):
        return float(val)
    if isinstance(val, str):
        val = val.strip()
        # Убираем пробелы внутри числа: "2 666" → "2666"
        val = re.sub(r'(?<=\d)\s+(?=\d)', '', val)
        m = re.search(r'(\d+(?:[.,]\d+)?)', val.replace(',', '.'))
        if m:
            try:
                return float(m.group(1))
            except ValueError:
                pass
    return None


def extract_memory_type(val) -> str | None:
    """Определяет тип памяти DDR3/DDR4/DDR5 из строки."""
    if val is None:
        return None
    val = str(val).upper().strip()
    if 'DDR5' in val:
        return 'DDR5'
    if 'DDR4' in val:
        return 'DDR4'
    if 'DDR3' in val:
        return 'DDR3'
    return val


def extract_form_factor(val) -> str | None:
    """Нормализует форм-фактор: 'micro-ATX', 'Mini-ITX', 'ATX'."""
    if val is None:
        return None
    val = str(val).lower().strip()
    val = val.replace('_', '-').replace(' ', '-').replace('micro-atx', 'micro-atx').replace('mini-itx', 'mini-itx')
    # "micro-ATX" → "micro-atx"
    return val


def format_report_line(passed: bool, label: str, expected: str, actual: str) -> str:
    """Форматирует строку отчёта проверки."""
    icon = "✅" if passed else "❌"
    status = "OK" if passed else "FAIL"
    return f"  {icon} [{status}] {label}: ожидается {expected}, получено {actual}"


# ─── API helpers ─────────────────────────────────────────────────────────

def api_get(path: str, params: dict | None = None, retries: int = 2) -> dict | list | None:
    """GET-запрос к API с повторными попытками."""
    url = f"{API_BASE}{path}"
    for attempt in range(retries + 1):
        try:
            resp = requests.get(url, params=params, timeout=10)
            if resp.status_code == 200:
                return resp.json()
            elif resp.status_code == 404 and attempt < retries:
                time.sleep(0.5)
                continue
            else:
                logger.warn(f"API {url} -> {resp.status_code}")
                if attempt < retries:
                    time.sleep(1.0)
                    continue
                return None
        except requests.exceptions.ConnectionError:
            logger.warn(f"API недоступен: {url} (попытка {attempt+1})")
            if attempt < retries:
                time.sleep(2.0)
            else:
                return None
        except Exception as e:
            logger.warn(f"API ошибка: {url} — {e}")
            if attempt < retries:
                time.sleep(1.0)
            else:
                return None
    return None


def find_product_by_name(category_label: str, name: str) -> dict | None:
    """Ищет товар по названию и категории, возвращает ProductSummary с id."""
    api_cat_slug = CATEGORY_MAP.get(category_label)
    
    # Пробуем поиск по названию + категория
    params: dict = {"search": name, "pageSize": 10}
    if api_cat_slug:
        params["categorySlug"] = api_cat_slug
    
    data = api_get("/catalog/products", params)
    if not data:
        return None
    
    products = data.get("data", data if isinstance(data, list) else [])
    
    if not products:
        logger.warn(f"  Поиск не дал результатов: «{name}»")
        return None
    
    # Сначала фильтруем по категории (если указана)
    if api_cat_slug:
        # В API категория возвращается как русское название, сопоставляем
        cat_names = {
            "processors": "Процессоры",
            "motherboards": "Материнские платы",
            "ram": "Оперативная память",
            "storage": "Накопители",
            "coolers": "Системы охлаждения",
            "gpu": "Видеокарты",
            "psu": "Блоки питания",
            "cases": "Корпуса",
            "fans": "Вентиляторы",
        }
        expected_cat = cat_names.get(api_cat_slug, "")
        if expected_cat:
            products = [p for p in products if p.get("category") == expected_cat]
    
    if not products:
        logger.warn(f"  Не найдено в категории {category_label}: «{name}»")
        return None
    
    name_lower = name.lower().strip()
    
    # 1. Точное совпадение названия
    for p in products:
        pname = p.get("name", "").lower().strip()
        if pname == name_lower:
            logger.info(f"  Точное совпадение: {p.get('name')} (id: {p.get('id')})")
            return p
    
    # 2. Один содержит другой
    for p in products:
        pname = p.get("name", "").lower().strip()
        if name_lower in pname or pname in name_lower:
            logger.info(f"  Частичное совпадение: {p.get('name')} (id: {p.get('id')})")
            return p
    
    # 3. Совпадение по ключевым словам
    name_words = set(re.findall(r'\w+', name_lower))
    best_match = None
    best_score = 0.0
    for p in products:
        pname = p.get("name", "").lower().strip()
        pwords = set(re.findall(r'\w+', pname))
        if not name_words or not pwords:
            continue
        common = name_words & pwords
        score = len(common) / max(len(name_words), len(pwords))
        if score > best_score:
            best_score = score
            best_match = p
    
    if best_match and best_score >= 0.4:
        logger.info(f"  Нечёткое совпадение ({best_score:.0%}): {best_match.get('name')} (id: {best_match.get('id')})")
        return best_match
    
    # 4. Просто первый результат, если других нет
    logger.warn(f"  Нет хорошего совпадения для «{name}», берём первый: {products[0].get('name')}")
    return products[0]


def get_product_detail(product_id: str) -> dict | None:
    """Получает полные характеристики товара по ID."""
    data = api_get(f"/catalog/products/{product_id}")
    return data


# ─── DOM parsing ─────────────────────────────────────────────────────────

def collect_components_from_page(page, debug: bool = False) -> list[dict]:
    """Собирает информацию о выбранных компонентах из DOM страницы pc-builder.
    
    Возвращает список компонентов:
      { type, name, price, qty, state }
    """
    components = []
    
    slots = page.locator(".component-slot")
    count = slots.count()
    logger.info(f"  Всего слотов: {count}")
    
    # Слоты в известном порядке; если .component-slot__type пуст, берём по индексу
    SLOT_TYPES_BY_INDEX = [
        "Процессор", "Материнская плата", "Оперативная память", "Накопитель",
        "Охлаждение", "Видеокарта", "Блок питания", "Корпус", "Вентилятор",
        "Монитор", "Клавиатура", "Мышь", "Наушники",
    ]
    
    for i in range(count):
        slot = slots.nth(i)
        css_class = slot.get_attribute("class") or ""
        try:
            type_text = slot.locator(".component-slot__type").text_content(timeout=2000) or ""
        except:
            type_text = ""
        if not type_text.strip():
            type_text = SLOT_TYPES_BY_INDEX[i] if i < len(SLOT_TYPES_BY_INDEX) else ""
        try:
            name_text = slot.locator(".component-slot__name").text_content(timeout=2000) or ""
        except:
            name_text = ""
        price_el = slot.locator(".component-slot__price-value")
        price_text = price_el.text_content(timeout=2000) if price_el.count() > 0 else ""
        
        if debug:
            logger.info(f"  Слот [{i}]: class={css_class[:100]}, type='{type_text.strip()}', name='{name_text.strip()}', price='{price_text.strip()}'")
        
        # Пропускаем пустые слоты
        if "component-slot--empty" in css_class:
            if debug:
                logger.info(f"    → пустой, пропускаем")
            continue
        
        state = "selected" if "component-slot--selected" in css_class else \
                "incompatible" if "component-slot--incompatible" in css_class else "empty"
        
        # Количество (для RAM, вентиляторов)
        qty = 1
        try:
            qty_el = slot.locator(".component-slot__qty-value")
            if qty_el.count() > 0:
                qty_text = qty_el.text_content(timeout=1000) or "1"
                qty = int(qty_text) if qty_text.isdigit() else 1
        except Exception:
            pass
        
        if name_text.strip():
            components.append({
                "type": type_text.strip(),
                "name": name_text.strip(),
                "price": price_text.strip(),
                "qty": qty,
                "state": state,
                "slot_index": i,
            })
            logger.info(f"  ✓ Найден компонент [{i}]: {type_text.strip()} = {name_text.strip()} (x{qty})")
        elif debug:
            logger.info(f"    → нет названия, state={state}")
    
    return components


# ─── Auto-selection ─────────────────────────────────────────────────────

def auto_select_components(page) -> list[dict]:
    """Пробует автоматически выбрать ключевые компоненты (CPU, MB, RAM) через модалку."""
    slots_to_try = ["Процессор", "Материнская плата", "Оперативная память"]
    
    # Слоты идут по порядку: Процессор=0, Материнская плата=1, Оперативная память=2
    slot_indices = {"Процессор": 0, "Материнская плата": 1, "Оперативная память": 2}
    
    for label in slots_to_try:
        logger.action(f"  Выбираем: {label}")
        
        # Ждём стабилизации DOM после предыдущего выбора
        page.wait_for_timeout(1000)
        
        slot_idx = slot_indices.get(label, -1)
        if slot_idx == -1:
            logger.warn(f"    Слот '{label}' не найден по индексу")
            continue
        
        # Проверяем что слот существует
        slots = page.locator(".component-slot")
        try:
            slots.first.wait_for(state="visible", timeout=5000)
        except Exception:
            pass
        
        if slot_idx >= slots.count():
            logger.warn(f"    Слот #{slot_idx} не существует (всего {slots.count()})")
            continue
        
        # Закрываем возможные старые модалки
        page.keyboard.press("Escape")
        page.wait_for_timeout(500)
        
        # Кликнуть кнопку выбора
        btn = slots.nth(slot_idx).locator(".component-slot__btn").first
        try:
            btn.click(timeout=5000, force=True)
        except Exception as e:
            logger.warn(f"    Не удалось кликнуть {label}: {e}")
            continue
        
        page.wait_for_timeout(2000)
        
        # Ждём появление модалки (.modal, не [role=dialog] — это корзина)
        modal = None
        try:
            modal = page.locator(".modal.modal--xlarge").first
            modal.wait_for(state="visible", timeout=5000)
        except PWError:
            try:
                modal = page.locator(".modal").first
                modal.wait_for(state="visible", timeout=3000)
            except PWError:
                logger.warn(f"    Модалка не открылась для {label}")
                continue
        
        # Ждём загрузки товаров
        try:
            page.wait_for_load_state("networkidle", timeout=5000)
        except Exception:
            pass
        page.wait_for_timeout(1000)
        
        # Находим все кнопки "Выбрать" внутри модалки (исключая кнопку на слоте)
        # Карточки товаров содержат свои кнопки "Выбрать" — кликаем первую
        select_btns = modal.locator("button:has-text('Выбрать')")
        if select_btns.count() == 0:
            logger.warn(f"    Нет доступных товаров для {label}")
            page.keyboard.press("Escape")
            page.wait_for_timeout(500)
            continue
        
        # Шаг 1: Кликаем первую кнопку "Выбрать" на первой карточке
        select_clicked = False
        for attempt in range(3):
            try:
                btn = select_btns.first
                if btn.count() > 0 and btn.is_visible():
                    btn.click(force=True, timeout=5000)
                    logger.info("    Нажали «Выбрать» на карточке")
                    select_clicked = True
                    break
            except Exception as e:
                logger.info(f"    Попытка {attempt+1}: {e}")
            page.wait_for_timeout(1000)
        
        if not select_clicked:
            logger.warn(f"    Не удалось нажать 'Выбрать' на карточке")
            page.keyboard.press("Escape")
            page.wait_for_timeout(500)
            continue
        
        page.wait_for_timeout(2000)
        
        # Шаг 2: Находим последнюю visible кнопку "Выбрать" на странице — это кнопка в preview
        # После шага 1 на карточке будет "Выбрано" (уже не "Выбрать"), а в preview появится новая
        confirm_clicked = False
        for attempt in range(5):
            preview_btn = page.locator('button:visible:has-text("Выбрать")').last
            if preview_btn.count() > 0:
                txt = (preview_btn.text_content(timeout=500) or "").strip()
                cls = (preview_btn.get_attribute("class") or "")
                if txt == "Выбрать" and "component-slot__btn" not in cls:
                    preview_btn.click(force=True)
                    logger.info("    Нажали «Выбрать» в preview")
                    confirm_clicked = True
                    break
            page.wait_for_timeout(1000)
        
        page.wait_for_timeout(2000)
        
        # Шаг 3: Ждём закрытия модалки
        for attempt in range(5):
            if not modal.is_visible():
                break
            page.wait_for_timeout(1000)
        
        if modal.is_visible():
            page.keyboard.press("Escape")
            page.wait_for_timeout(500)
        
        if confirm_clicked:
            logger.ok(f"    ✓ {label} выбран")
        else:
            logger.warn(f"    Не удалось выбрать {label}")
    
    # Собираем выбранные компоненты
    return collect_components_from_page(page)


# ─── Compatibility checks ────────────────────────────────────────────────

def check_cpu_motherboard(cpu: dict, mb: dict) -> list[dict]:
    """Проверка CPU ↔ Материнская плата."""
    results = []
    
    cpu_specs = cpu.get("specifications", {})
    mb_specs = mb.get("specifications", {})
    
    # Сокет: проверяем в specifications и в полях верхнего уровня
    cpu_socket = get_spec(cpu_specs, "socket", "soket", "Сокет", "Разъем") or cpu.get("socket")
    mb_socket = get_spec(mb_specs, "socket", "soket", "Сокет", "Разъем") or mb.get("socket")
    
    if cpu_socket and mb_socket:
        cpu_sock = str(cpu_socket).lower().strip()
        mb_sock = str(mb_socket).lower().strip()
        passed = cpu_sock == mb_sock
        results.append({
            "check": "socket",
            "label": "Сокет",
            "expected": cpu_socket,
            "actual": mb_socket,
            "passed": passed,
            "detail": f"CPU: {cpu_socket} vs MB: {mb_socket}",
        })
    else:
        results.append({
            "check": "socket",
            "label": "Сокет",
            "expected": cpu_socket or "неизвестно",
            "actual": mb_socket or "неизвестно",
            "passed": False,
            "detail": f"Не удалось определить сокет (CPU: {cpu_socket}, MB: {mb_socket})",
        })
    
    return results


def check_cpu_ram(cpu: dict, ram: dict) -> list[dict]:
    """Проверка CPU → поддерживаемый тип памяти ↔ RAM."""
    results = []
    
    cpu_specs = cpu.get("specifications", {})
    ram_specs = ram.get("specifications", {})
    
    # Тип памяти, поддерживаемый CPU
    cpu_mem = (get_spec(cpu_specs, "memory_type", "memoryType", "memory type", "Тип памяти",
                        "memory_support", "memorySupport", "Поддержка памяти", "memory")
               or cpu.get("memoryType"))
    
    # Тип памяти планки
    ram_mem = (get_spec(ram_specs, "memory_type", "memoryType", "memory type", "Тип памяти",
                        "type", "memory")
               or ram.get("memoryType"))
    
    cpu_mem_type = extract_memory_type(cpu_mem) if cpu_mem else None
    ram_mem_type = extract_memory_type(ram_mem) if ram_mem else None
    
    if cpu_mem_type and ram_mem_type:
        passed = cpu_mem_type == ram_mem_type
        results.append({
            "check": "memory_type",
            "label": "Тип памяти (CPU → RAM)",
            "expected": cpu_mem_type,
            "actual": ram_mem_type,
            "passed": passed,
            "detail": f"CPU поддерживает: {cpu_mem_type}, RAM: {ram_mem_type}",
        })
    else:
        results.append({
            "check": "memory_type",
            "label": "Тип памяти (CPU → RAM)",
            "expected": cpu_mem_type or "неизвестно",
            "actual": ram_mem_type or "неизвестно",
            "passed": False,
            "detail": f"Не удалось определить тип памяти (CPU: {cpu_mem_type}, RAM: {ram_mem_type})",
        })
    
    return results


def check_motherboard_ram(mb: dict, ram: dict, ram_qty: int) -> list[dict]:
    """Проверка Материнская плата ↔ RAM (тип, слоты, объём, частота)."""
    results = []
    
    mb_specs = mb.get("specifications", {})
    ram_specs = ram.get("specifications", {})
    
    # 1. Тип памяти
    mb_mem = (get_spec(mb_specs, "memory_type", "memoryType", "memory type", "Тип памяти", "memory")
              or mb.get("memoryType"))
    ram_mem = (get_spec(ram_specs, "memory_type", "memoryType", "memory type", "Тип памяти",
                        "type", "memory")
               or ram.get("memoryType"))
    
    mb_mem_type = extract_memory_type(mb_mem)
    ram_mem_type = extract_memory_type(ram_mem)
    
    if mb_mem_type and ram_mem_type:
        passed = mb_mem_type == ram_mem_type
        results.append({
            "check": "mb_ram_memory_type",
            "label": "Тип памяти (MB → RAM)",
            "expected": mb_mem_type,
            "actual": ram_mem_type,
            "passed": passed,
            "detail": f"MB: {mb_mem_type}, RAM: {ram_mem_type}",
        })
    else:
        results.append({
            "check": "mb_ram_memory_type",
            "label": "Тип памяти (MB → RAM)",
            "expected": mb_mem_type or "неизвестно",
            "actual": ram_mem_type or "неизвестно",
            "passed": False,
            "detail": f"Не удалось определить тип памяти (MB: {mb_mem_type}, RAM: {ram_mem_type})",
        })
    
    # 2. Количество слотов памяти
    mb_slots_raw = get_spec(mb_specs, "memory_slots", "memorySlots", "memory slots", 
                          "Слотов памяти", "Слоты памяти", "Количество слотов")
    mb_slots = extract_number(mb_slots_raw)
    
    if mb_slots is not None:
        passed = ram_qty <= mb_slots
        results.append({
            "check": "memory_slots",
            "label": "Слоты памяти",
            "expected": f"≥ {ram_qty} (нужно {ram_qty} планок)",
            "actual": f"{int(mb_slots)} слотов",
            "passed": passed,
            "detail": f"Нужно {ram_qty} планок RAM, на MB {int(mb_slots)} слотов",
        })
    else:
        results.append({
            "check": "memory_slots",
            "label": "Слоты памяти",
            "expected": "≥ {ram_qty}".format(ram_qty=ram_qty),
            "actual": "неизвестно",
            "passed": True,  # не можем проверить — пропускаем
            "detail": "Количество слотов на MB не указано, проверка пропущена",
        })
    
    # 3. Максимальный объём памяти
    mb_max_mem_raw = get_spec(mb_specs, "max_memory", "maxMemory", "max memory",
                            "Макс. память", "Максимальный объем памяти", "maximum_memory")
    mb_max_mem = extract_number(mb_max_mem_raw)
    
    # Ёмкость одной планки RAM
    ram_cap_raw = get_spec(ram_specs, "capacity", "memory_capacity", "memoryCapacity",
                         "Объем памяти", "Объём", "capacity_gb", "size")
    ram_cap = extract_number(ram_cap_raw)
    
    # Если не нашли в specs, пробуем вытащить из названия (например "2x16GB")
    if ram_cap is None:
        name = ram.get("name", "")
        m = re.search(r'(\d+)\s*[xх]\s*(\d+)\s*[gG][bB]', name)
        if m:
            # "2x16GB" → каждая планка 16GB
            ram_cap = float(m.group(2))
        else:
            m = re.search(r'(\d+)\s*[gG][bB]', name)
            if m:
                ram_cap = float(m.group(1))
    
    if mb_max_mem is not None and ram_cap is not None:
        total_ram = ram_qty * ram_cap
        passed = total_ram <= mb_max_mem
        # Конвертируем
        if mb_max_mem > 100:  # вероятно в ГБ
            total_gb = total_ram
            max_gb = mb_max_mem
        else:  # возможно в ГБ
            total_gb = total_ram
            max_gb = mb_max_mem
        
        results.append({
            "check": "max_memory",
            "label": "Макс. память",
            "expected": f"≥ {total_gb} ГБ (нужно {total_gb} ГБ)",
            "actual": f"{int(max_gb)} ГБ",
            "passed": passed,
            "detail": f"RAM: {int(ram_cap)} ГБ × {ram_qty} = {total_gb} ГБ, MB макс: {int(max_gb)} ГБ",
        })
    else:
        results.append({
            "check": "max_memory",
            "label": "Макс. память",
            "expected": f"≥ {(ram_cap or 0) * ram_qty} ГБ" if ram_cap else "неизвестно",
            "actual": f"{mb_max_mem} ГБ" if mb_max_mem else "неизвестно",
            "passed": mb_max_mem is None or ram_cap is None,  # пропускаем если данных нет
            "detail": f"Не удалось проверить макс. память (MB: {mb_max_mem}, RAM cap: {ram_cap})" if not (mb_max_mem and ram_cap) else "",
        })
    
    # 4. Частота памяти
    ram_freq_raw = get_spec(ram_specs, "frequency", "memory_frequency", "memoryFrequency",
                          "Частота", "Частота памяти", "speed") or ram.get("frequency")
    ram_freq = extract_number(ram_freq_raw)
    
    mb_freq_raw = get_spec(mb_specs, "memory_frequency", "memoryFrequency", "memory frequency",
                         "Частота памяти", "frequency", "max_frequency", "max_memory_freq")
    mb_freq = extract_number(mb_freq_raw)
    
    if ram_freq is not None and mb_freq is not None:
        passed = ram_freq <= mb_freq
        results.append({
            "check": "memory_frequency",
            "label": "Частота памяти",
            "expected": f"≤ {int(mb_freq)} МГц (MB макс: {int(mb_freq)} МГц)",
            "actual": f"{int(ram_freq)} МГц (RAM частота: {int(ram_freq)} МГц)",
            "passed": passed,
            "detail": f"RAM: {int(ram_freq)} МГц, MB поддерживает до {int(mb_freq)} МГц",
        })
    else:
        results.append({
            "check": "memory_frequency",
            "label": "Частота памяти",
            "expected": f"≤ {mb_freq}" if mb_freq else "неизвестно",
            "actual": f"{ram_freq}" if ram_freq else "неизвестно",
            "passed": True,  # пропускаем
            "detail": f"Не удалось проверить частоту (RAM: {ram_freq_raw}, MB: {mb_freq_raw})",
        })
    
    return results


def check_motherboard_case(mb: dict, case: dict) -> list[dict]:
    """Проверка Материнская плата ↔ Корпус (форм-фактор)."""
    results = []
    
    mb_specs = mb.get("specifications", {})
    case_specs = case.get("specifications", {})
    
    mb_ff_raw = get_spec(mb_specs, "form_factor", "formFactor", "form factor",
                        "Форм-фактор", "Форм фактор", "formfactor", "form")
    mb_ff = extract_form_factor(mb_ff_raw) if mb_ff_raw else None
    
    # Поддерживаемые форм-факторы MB в корпусе
    supported_ff_raw = get_spec(case_specs, "form_factors_supported", "formFactorsSupported",
                               "form_factor", "formFactor", "Форм-фактор", "Форм фактор",
                               "motherboard_form_factor", "motherboard_support")
    
    if mb_ff and supported_ff_raw:
        supported = str(supported_ff_raw).lower()
        passed = mb_ff in supported
        results.append({
            "check": "form_factor",
            "label": "Форм-фактор (MB → Case)",
            "expected": f"корпус поддерживает {mb_ff}",
            "actual": supported,
            "passed": passed,
            "detail": f"MB: {mb_ff}, корпус поддерживает: {supported}",
        })
    elif mb_ff:
        # Не можем проверить — пропускаем
        results.append({
            "check": "form_factor",
            "label": "Форм-фактор (MB → Case)",
            "expected": mb_ff,
            "actual": "не указано в корпусе",
            "passed": True,
            "detail": f"Форм-фактор MB: {mb_ff}, данные корпуса отсутствуют — проверка пропущена",
        })
    else:
        results.append({
            "check": "form_factor",
            "label": "Форм-фактор (MB → Case)",
            "expected": "неизвестно",
            "actual": str(supported_ff_raw or "неизвестно"),
            "passed": True,
            "detail": "Не удалось определить форм-фактор MB",
        })
    
    return results


def check_cpu_cooler(cpu: dict, cooler: dict) -> list[dict]:
    """Проверка CPU ↔ Кулер (TDP и сокет)."""
    results = []
    
    cpu_specs = cpu.get("specifications", {})
    cooler_specs = cooler.get("specifications", {})
    
    # TDP
    cpu_tdp_raw = get_spec(cpu_specs, "tdp", "TDP", "Тепловыделение",
                          "Расчетная тепловая мощность", "wattage") or cpu.get("tdp")
    cooler_tdp_raw = get_spec(cooler_specs, "tdp", "TDP", "max_tdp", "maxTdp",
                            "max_power", "maxPower", "power")
    
    cpu_tdp = extract_number(cpu_tdp_raw)
    cooler_tdp = extract_number(cooler_tdp_raw)
    
    if cpu_tdp is not None and cooler_tdp is not None:
        passed = cooler_tdp >= cpu_tdp
        results.append({
            "check": "cooler_tdp",
            "label": "TDP (CPU → Cooler)",
            "expected": f"cooler TDP ({int(cooler_tdp)} Вт) ≥ CPU TDP ({int(cpu_tdp)} Вт)",
            "actual": f"{int(cooler_tdp)} ≥ {int(cpu_tdp)}",
            "passed": passed,
            "detail": f"CPU TDP: {int(cpu_tdp)} Вт, Cooler TDP: {int(cooler_tdp)} Вт",
        })
    else:
        results.append({
            "check": "cooler_tdp",
            "label": "TDP (CPU → Cooler)",
            "expected": f"cooler TDP ≥ CPU TDP (CPU: {int(cpu_tdp) if cpu_tdp else '?'} Вт)",
            "actual": f"Cooler TDP: {int(cooler_tdp) if cooler_tdp else '?'} Вт",
            "passed": cpu_tdp is None or cooler_tdp is None,
            "detail": f"Не удалось проверить TDP (CPU: {cpu_tdp_raw}, Cooler: {cooler_tdp_raw})",
        })
    
    # Сокет (кулер поддерживает сокет процессора)
    cpu_socket = (get_spec(cpu_specs, "socket", "soket", "Сокет") or cpu.get("socket") or "")
    cooler_sockets_raw = get_spec(cooler_specs, "sockets", "supported_sockets", "supportedSockets",
                                 "socket", "soket", "Сокет", "Разъем")
    
    if cpu_socket and cooler_sockets_raw:
        cpu_sock_str = str(cpu_socket).lower().strip()
        cooler_sock_str = str(cooler_sockets_raw).lower().strip()
        passed = cpu_sock_str in cooler_sock_str
        results.append({
            "check": "cooler_socket",
            "label": "Сокет (Cooler → CPU)",
            "expected": f"кулер поддерживает {cpu_socket}",
            "actual": cooler_sock_str,
            "passed": passed,
            "detail": f"CPU сокет: {cpu_socket}, кулер: {cooler_sock_str}",
        })
    
    return results


def check_psu_components(psu: dict, components: list[dict]) -> list[dict]:
    """Проверка БП ↔ Компоненты (суммарное потребление)."""
    results = []
    
    psu_specs = psu.get("specifications", {})
    
    # Мощность БП
    psu_watt_raw = get_spec(psu_specs, "wattage", "Мощность", "power", "total_power",
                          "max_power") or psu.get("wattage")
    psu_watt = extract_number(psu_watt_raw)
    
    if psu_watt is None:
        results.append({
            "check": "psu_wattage",
            "label": "Мощность БП",
            "expected": "≥ суммарное потребление",
            "actual": "неизвестно",
            "passed": True,
            "detail": "Мощность БП не указана",
        })
        return results
    
    # Суммируем TDP всех компонентов, у которых есть TDP
    total_tdp = 0
    details = []
    for comp in components:
        comp_type = comp.get("_type", "")
        comp_name = comp.get("name", "")
        comp_specs = comp.get("specifications", {})
        
        tdp_val = (get_spec(comp_specs, "tdp", "TDP", "Тепловыделение", "wattage",
                          "power_consumption", "powerConsumption")
                   or comp.get("tdp"))
        tdp_num = extract_number(tdp_val)
        qty = comp.get("qty", 1)
        
        if tdp_num:
            comp_total = tdp_num * qty
            total_tdp += comp_total
            details.append(f"{comp_name}: {int(tdp_num)} Вт × {qty} = {int(comp_total)} Вт")
        else:
            details.append(f"{comp_name}: TDP не указан")
    
    # Рекомендуемый запас 20%
    recommended = total_tdp * 1.2
    passed = psu_watt >= recommended
    
    results.append({
        "check": "psu_wattage",
        "label": "Мощность БП",
        "expected": f"≥ {int(recommended)} Вт (сумма TDP с запасом 20%)",
        "actual": f"{int(psu_watt)} Вт",
        "passed": passed,
        "detail": f"БП: {int(psu_watt)} Вт, сумма TDP: {int(total_tdp)} Вт, "
                  f"рекомендуется: {int(recommended)} Вт\n    Детали: {'; '.join(details)}",
    })
    
    return results


def check_gpu_case(gpu: dict, case: dict) -> list[dict]:
    """Проверка GPU ↔ Корпус (длина видеокарты)."""
    results = []
    
    gpu_specs = gpu.get("specifications", {})
    case_specs = case.get("specifications", {})
    
    # Длина видеокарты
    gpu_len_raw = get_spec(gpu_specs, "length", "длина", "card_length", "cardLength", "size")
    gpu_len = extract_number(gpu_len_raw)
    
    # Макс. длина GPU в корпусе
    case_max_gpu_raw = get_spec(case_specs, "max_gpu_length", "maxGpuLength", "max_gpu",
                              "max_video_card_length", "gpu_length_max", "maximum_gpu_length",
                              "Максимальная длина видеокарты")
    case_max_gpu = extract_number(case_max_gpu_raw)
    
    if gpu_len is not None and case_max_gpu is not None:
        passed = gpu_len <= case_max_gpu
        results.append({
            "check": "gpu_length",
            "label": "Длина GPU (Case → GPU)",
            "expected": f"≤ {int(case_max_gpu)} мм (макс. в корпусе)",
            "actual": f"{int(gpu_len)} мм (длина GPU)",
            "passed": passed,
            "detail": f"GPU: {int(gpu_len)} мм, корпус макс: {int(case_max_gpu)} мм",
        })
    else:
        results.append({
            "check": "gpu_length",
            "label": "Длина GPU (Case → GPU)",
            "expected": f"≤ {case_max_gpu or '?'} мм",
            "actual": f"{gpu_len or '?'} мм",
            "passed": True,
            "detail": f"Проверка пропущена (GPU: {gpu_len_raw}, корпус: {case_max_gpu_raw})",
        })
    
    return results


# ─── Main ────────────────────────────────────────────────────────────────

def main():
    logger.info("=" * 70)
    logger.info("PC Builder — Business Logic Check")
    logger.info(f"URL: {BASE_URL}/pc-builder")
    logger.info(f"API: {API_BASE}")
    logger.info("=" * 70)
    
    # ── Проверка API ──────────────────────────────────────────────────
    logger.action("Проверка API...")
    api_ok = api_get("/catalog/products", {"pageSize": 1})
    if api_ok is None:
        logger.error("API НЕ ДОСТУПЕН! Запустите dev-сервер: ./scripts/dev-local.sh")
        logger.error(f"Проверьте: curl {API_BASE}/catalog/products")
        sys.exit(1)
    logger.ok("API доступен")
    
    # ── Открываем страницу ─────────────────────────────────────────────
    logger.action("Открываем страницу pc-builder...")
    
    with sync_playwright() as pw:
        browser = pw.chromium.launch(
            executable_path="/usr/bin/google-chrome",
            headless=True,
            args=["--no-sandbox", "--disable-gpu", "--disable-dev-shm-usage"],
        )
        context = browser.new_context(
            viewport={"width": 1440, "height": 900},
            locale="ru-BY",
        )
        page = context.new_page()
        
        # Ловим консольные ошибки
        page.on("pageerror", lambda err: logger.warn(f"Page JS error: {err}"))
        
        try:
            page.goto(f"{BASE_URL}/pc-builder", wait_until="domcontentloaded", timeout=20000)
            page.wait_for_selector(".pc-builder__container, .pc-builder-container, .component-slot",
                                   timeout=15000)
        except PWError as e:
            logger.error(f"Страница не загрузилась: {e}")
            browser.close()
            sys.exit(1)
        
        logger.ok("Страница загружена")
        
        # ── Собираем компоненты ────────────────────────────────────────
        logger.action("Сбор выбранных компонентов из DOM...")
        components = collect_components_from_page(page, debug=True)
        
        # Если ничего не выбрано — пробуем выбрать ключевые компоненты
        if not components:
            logger.info("Нет выбранных компонентов. Пробуем выбрать автоматически...")
            components = auto_select_components(page)
            # Ещё раз логируем что получилось
            if components:
                logger.ok(f"После авто-выбора: {len(components)} компонентов")
                for c in components:
                    logger.info(f"  {c['type']}: {c['name']}")
            else:
                # Debug: покажем все слоты
                logger.info("Debug: состояние всех слотов после авто-выбора:")
                collect_components_from_page(page, debug=True)
        
        browser.close()
    
    if not components:
        logger.error("Нет выбранных компонентов! Сначала выберите компоненты на странице pc-builder.")
        sys.exit(1)
    
    logger.ok(f"Найдено компонентов: {len(components)}")
    
    # ── Получаем характеристики через API ──────────────────────────────
    logger.action("Получение характеристик товаров через API...")
    
    for comp in components:
        name = comp["name"]
        cat_label = comp["type"]
        logger.info(f"  Ищем товар: {name} ({cat_label})")
        
        # Шаг 1: найти товар по названию через search API
        summary = find_product_by_name(cat_label, name)
        if not summary:
            logger.error(f"  ❌ Товар не найден в API: {name}")
            comp["_error"] = "товар не найден"
            continue
        
        product_id = summary.get("id")
        logger.info(f"  → id: {product_id}")
        
        # Шаг 2: получить полные характеристики по ID
        product_data = get_product_detail(product_id)
        if not product_data:
            logger.error(f"  ❌ Не удалось получить характеристики для: {name} (id={product_id})")
            comp["_error"] = "нет данных"
            continue
        
        # Сохраняем характеристики
        comp["_id"] = product_id
        comp["_product_data"] = product_data
        comp["specifications"] = product_data.get("specifications", {})
        
        # Копируем поля верхнего уровня для удобства
        for field in ["socket", "memoryType", "tdp", "wattage", "category", "id", "slug"]:
            if field in product_data:
                comp[field] = product_data[field]
        
        specs = comp["specifications"]
        logger.ok(f"  ✅ Характеристики: socket={get_spec(specs, 'socket')}, "
                  f"memory_type={get_spec(specs, 'memory_type', 'type', 'memory_support')}, "
                  f"form_factor={get_spec(specs, 'form_factor')}, "
                  f"memory_slots={get_spec(specs, 'memory_slots')}")
    
    # ── Проверки совместимости ─────────────────────────────────────────
    logger.action("Проверка совместимости компонентов...")
    
    # Организуем компоненты по типам для удобства
    # Используем slug категории как ключ
    TYPE_SLUG_MAP = {
        "processors": "cpu",
        "motherboards": "motherboard",
        "ram": "ram",
        "storage": "storage",
        "coolers": "cooling",
        "gpu": "gpu",
        "psu": "psu",
        "cases": "case",
        "fans": "fan",
    }
    by_type = {}
    for comp in components:
        api_slug = CATEGORY_MAP.get(comp["type"])
        comp["_type"] = api_slug
        comp["_type_short"] = TYPE_SLUG_MAP.get(api_slug, api_slug)
        by_type[api_slug] = comp
    
    all_checks = []
    
    # 1. CPU ↔ Motherboard
    cpu = by_type.get("processors")
    mb = by_type.get("motherboards")
    if cpu and mb and "_error" not in cpu and "_error" not in mb:
        logger.check("CPU ↔ Материнская плата:")
        checks = check_cpu_motherboard(cpu, mb)
        all_checks.extend(checks)
        for c in checks:
            logger.compat(format_report_line(c["passed"], c["label"], c["expected"], c["actual"]))
    elif cpu and mb:
        logger.warn("CPU ↔ MB: пропущено (ошибка получения данных)")
    
    # 2. CPU → RAM (поддержка типа памяти)
    cpu = by_type.get("processors")
    ram = by_type.get("ram")
    if cpu and ram and "_error" not in cpu and "_error" not in ram:
        logger.check("CPU → Оперативная память:")
        checks = check_cpu_ram(cpu, ram)
        all_checks.extend(checks)
        for c in checks:
            logger.compat(format_report_line(c["passed"], c["label"], c["expected"], c["actual"]))
    
    # 3. Motherboard ↔ RAM
    mb = by_type.get("motherboards")
    ram = by_type.get("ram")
    if mb and ram and "_error" not in mb and "_error" not in ram:
        ram_qty = ram.get("qty", 1)
        logger.check(f"Материнская плата ↔ RAM (x{ram_qty}):")
        checks = check_motherboard_ram(mb, ram, ram_qty)
        all_checks.extend(checks)
        for c in checks:
            logger.compat(format_report_line(c["passed"], c["label"], c["expected"], c["actual"]))
    
    # 4. Motherboard ↔ Case
    mb = by_type.get("motherboards")
    case = by_type.get("cases")
    if mb and case and "_error" not in mb and "_error" not in case:
        logger.check("Материнская плата ↔ Корпус:")
        checks = check_motherboard_case(mb, case)
        all_checks.extend(checks)
        for c in checks:
            logger.compat(format_report_line(c["passed"], c["label"], c["expected"], c["actual"]))
    
    # 5. CPU ↔ Cooler
    cpu = by_type.get("processors")
    cooler = by_type.get("coolers")
    if cpu and cooler and "_error" not in cpu and "_error" not in cooler:
        logger.check("CPU ↔ Охлаждение:")
        checks = check_cpu_cooler(cpu, cooler)
        all_checks.extend(checks)
        for c in checks:
            logger.compat(format_report_line(c["passed"], c["label"], c["expected"], c["actual"]))
    
    # 6. PSU ↔ Components
    psu = by_type.get("psu")
    if psu and "_error" not in psu:
        logger.check("Блок питания → Компоненты:")
        checks = check_psu_components(psu, [c for c in components if "_error" not in c])
        all_checks.extend(checks)
        for c in checks:
            logger.compat(format_report_line(c["passed"], c["label"], c["expected"], c["actual"]))
    
    # 7. GPU ↔ Case
    gpu = by_type.get("gpu")
    case = by_type.get("cases")
    if gpu and case and "_error" not in gpu and "_error" not in case:
        logger.check("GPU ↔ Корпус:")
        checks = check_gpu_case(gpu, case)
        all_checks.extend(checks)
        for c in checks:
            logger.compat(format_report_line(c["passed"], c["label"], c["expected"], c["actual"]))
    
    # ── Итоговый отчёт ─────────────────────────────────────────────────
    logger.info("=" * 70)
    logger.info("ИТОГОВЫЙ ОТЧЁТ")
    logger.info("=" * 70)
    
    # Статистика
    total = len(all_checks)
    passed = sum(1 for c in all_checks if c["passed"])
    failed = sum(1 for c in all_checks if not c["passed"])
    skipped = sum(1 for c in all_checks if c.get("skipped", False))
    
    logger.info(f"Всего проверок: {total}")
    logger.info(f"  ✅ Пройдено: {passed}")
    logger.info(f"  ❌ Не пройдено: {failed}")
    if skipped:
        logger.info(f"  ⏭ Пропущено: {skipped}")
    
    if failed > 0:
        logger.warn("--- Проблемные проверки ---")
        for c in all_checks:
            if not c["passed"]:
                logger.error(f"  ❌ {c['label']}: {c['detail']}")
    else:
        logger.ok("--- Все проверки пройдены! Сборка совместима. ---")
    
    # Состав сборки
    logger.info("--- Состав сборки ---")
    for comp in components:
        status = "✅" if "_error" not in comp else "❌"
        price = comp.get("price", "")
        qty = f" x{comp['qty']}" if comp.get("qty", 1) > 1 else ""
        logger.info(f"  {status} {comp['type']}: {comp['name']} — {price}{qty}")
        if "_error" in comp:
            logger.error(f"       Ошибка: {comp['_error']}")
    
    # Сводка
    logger.info("=" * 70)
    if failed > 0:
        logger.warn(f"Обнаружено {failed} проблем(ы) совместимости!")
        sys.exit(1)
    elif any("_error" in c for c in components):
        logger.warn("Есть ошибки получения данных, но проверки совместимости пройдены")
        sys.exit(1)
    else:
        logger.ok("ВСЕ ПРОВЕРКИ ПРОЙДЕНЫ")
        sys.exit(0)


if __name__ == "__main__":
    try:
        main()
    except KeyboardInterrupt:
        logger.info("Прервано пользователем")
        sys.exit(130)
    except Exception as e:
        logger.error(f"Критическая ошибка: {e}")
        traceback.print_exc()
        sys.exit(2)
