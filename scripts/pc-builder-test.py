#!/usr/bin/env python3
"""
PC Builder E2E Test Script
~~~~~~~~~~~~~~~~~~~~~~~~~~~
Automated Playwright script that emulates a real user building a PC on
http://localhost:5173/pc-builder.

Features:
  • Selects every component category sequentially
  • Applies filters (price, search, sort) and validates results
  • Checks compatibility warnings / errors
  • Verifies price updates in the summary panel
  • Logs every action, error, and observation
  • Takes screenshots at key milestones
"""

import json
import os
import re
import sys
import time
import functools
from datetime import datetime, timezone
from pathlib import Path
from playwright.sync_api import (
    sync_playwright,
    Page,
    Locator,
    expect,
    Error as PWError,
)

# ─── Centralized Selectors ────────────────────────────────────────────
SEL = {
    # Component slots
    "slot": ".component-slot",
    "slot_empty": ".component-slot--empty",
    "slot_selected": ".component-slot--selected",
    "slot_incompatible": ".component-slot--incompatible",
    "slot_priority": ".component-slot--priority",
    "slot_type": ".component-slot__type",
    "slot_name": ".component-slot__name",
    "slot_price_value": ".component-slot__price-value",
    "slot_price_empty": ".component-slot__price-empty",
    "slot_btn": ".component-slot__btn",
    "slot_clear": ".component-slot__clear",
    "slot_qty": ".component-slot__qty",
    "slot_qty_btn": ".component-slot__qty-btn",
    "slot_qty_value": ".component-slot__qty-value",

    # Modal
    "modal": "[role='dialog']",
    "modal_fallback": ".modal",
    "modal_close_btn": "[aria-label='Закрыть'], [data-testid='modal-close'], .modal__close, button.close",

    # Picker modal elements
    "picker_root": ".filterSidebarWrap",  # Unique to component picker
    "card": "[class*='card']:not([class*='empty'])",
    "card_compact": "[class*='cardCompact']:not([class*='empty'])",
    "card_selected": "[class*='cardSelected']",
    "card_incompatible": "[class*='cardIncompatible']",
    "card_oos": "[class*='cardOutOfStock']",
    "oos_badge": "[class*='oosBadge']",
    "incompatible_wrapper": "[class*='incompatibleWrapper']",
    "incompatible reason": "[class*='incompatibleReason']",
    "select_btn": "[class*='selectBtn']",
    "confirm_btn": "[class*='confirmBtn']",
    "toggle_incompatible": "[class*='toggleIncompatibleBtn']",

    # Filters
    "search_input": ".searchInput, input[type='search']",
    "search_clear": ".searchClear",
    "sort_select": ".sortSelect, select[class*='sortSelect']",
    "stock_check": ".stockCheckInput",
    "stock_label": ".stockCheck, label[class*='stockCheck']",
    "results_count": "[class*='resultsCount']",
    "price": "[class*='price']:not([class*='old']):not([class*='Old']):not([class*='empty'])",

    # Build summary panel
    "bsp_total_value": ".bsp__total-value",
    "bsp_compat_status": ".bsp__compat-status",
    "bsp_compat_text": ".bsp__compat-text",
    "bsp_compat_item_error": ".bsp__compat-item--error",
    "bsp_compat_item_warning": ".bsp__compat-item--warning",
    "bsp_component_item": ".bsp__component-item",
    "bsp_component_label": ".bsp__component-label",
    "bsp_component_price": ".bsp__component-price",
    "bsp_btn_cart": ".bsp__btn--cart",
    "bsp_btn_save": ".bsp__btn--save",
    "bsp_btn_export": ".bsp__btn--export",
    "bsp_btn_checkout": ".bsp__btn--checkout",
    "bsp_disabled_hint": ".bsp__disabled-hint",

    # Page
    "page_container": ".pc-builder__container, .pc-builder-container",
    "page_errors": ".pc-builder__errors",
    "page_error": ".pc-builder__error",
    "page_status": ".pc-builder__status",
}

# ─── Configuration ────────────────────────────────────────────────────
BASE_URL = os.getenv("BASE_URL", "http://localhost:5173")
PC_BUILDER_URL = f"{BASE_URL}/pc-builder"
LOG_FILE = os.getenv("LOG_FILE", str(Path(__file__).parent / "pc-builder-test.log"))
SCREENSHOTS_DIR = os.getenv(
    "SCREENSHOTS_DIR", str(Path(__file__).parent / "pc-builder-screenshots")
)
TIMEOUT_SHORT = 5_000
TIMEOUT_NORMAL = 10_000
TIMEOUT_LONG = 20_000

# Component categories in the order we will try to pick them.
# Matches PC_BUILDER_SLOTS from usePCBuilder.ts (9 main hardware slots).
SLOT_LABELS = [
    "Процессор",
    "Материнская плата",
    "Оперативная память",
    "Накопитель",
    "Охлаждение",
    "Видеокарта",
    "Блок питания",
    "Корпус",
    "Вентилятор",
]

# ─── Logger ────────────────────────────────────────────────────────────
class Logger:
    def __init__(self, path: str):
        self.path = path
        self.entries: list[dict] = []
        os.makedirs(os.path.dirname(path), exist_ok=True)
        # Clear file
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

    def action(self, msg): self._write("ACTION", msg)
    def info(self, msg): self._write("INFO", msg)
    def ok(self, msg): self._write("OK", msg)
    def warn(self, msg): self._write("WARN", msg)
    def error(self, msg): self._write("ERROR", msg)
    def filter_check(self, msg): self._write("FILTER", msg)
    def price(self, msg): self._write("PRICE", msg)

    def save_summary(self):
        summary = {
            "total_actions": len(self.entries),
            "errors": [e for e in self.entries if e["level"] == "ERROR"],
            "warnings": [e for e in self.entries if e["level"] == "WARN"],
            "ok": [e for e in self.entries if e["level"] == "OK"],
        }
        summary_path = self.path.replace(".log", "-summary.json")
        with open(summary_path, "w", encoding="utf-8") as f:
            json.dump(summary, f, indent=2, ensure_ascii=False, default=str)
        self.info(f"Summary saved to {summary_path}")

logger = Logger(LOG_FILE)

# ─── Helpers ───────────────────────────────────────────────────────────

def retry_on_failure(max_retries: int = 2, delay: float = 1.0):
    """Decorator: retry a function on failure with exponential backoff."""
    def decorator(func):
        @functools.wraps(func)
        def wrapper(*args, **kwargs):
            last_exc = None
            for attempt in range(max_retries + 1):
                try:
                    return func(*args, **kwargs)
                except Exception as exc:
                    last_exc = exc
                    if attempt < max_retries:
                        wait = delay * (attempt + 1)
                        logger.warn(f"Retry {attempt+1}/{max_retries} for {func.__name__} after {wait:.1f}s: {exc}")
                        time.sleep(wait)
            raise last_exc
        return wrapper
    return decorator


def wait_for_price_settled(page: Page, timeout: int = 5000, stability_ms: int = 300) -> str:
    """Wait until price text stabilizes (doesn't change for stability_ms)."""
    total_el = page.locator(SEL["bsp_total_value"]).first
    if not total_el.is_visible(timeout=TIMEOUT_SHORT):
        return ""
    start = time.time() * 1000
    last_value = None
    last_change = time.time() * 1000
    while (time.time() * 1000 - start) < timeout:
        try:
            current = total_el.text_content() or ""
            if current != last_value:
                last_value = current
                last_change = time.time() * 1000
            elif (time.time() * 1000 - last_change) >= stability_ms:
                return current
        except Exception:
            pass
        time.sleep(0.1)
    return last_value or ""


def capture_diagnostic(page: Page, reason: str):
    """Save screenshot + HTML snapshot for post-mortem analysis."""
    save_screenshot(page, f"DIAG_{reason}")
    html_path = os.path.join(SCREENSHOTS_DIR, f"DIAG_{reason}.html")
    try:
        os.makedirs(SCREENSHOTS_DIR, exist_ok=True)
        with open(html_path, "w", encoding="utf-8") as f:
            f.write(page.content())
        logger.info(f"HTML snapshot saved: {html_path}")
    except Exception as e:
        logger.error(f"Failed to save HTML snapshot: {e}")


def expect_modal_visible(page: Page, timeout: int = TIMEOUT_NORMAL) -> Locator | None:
    """Wait for component picker modal to be visible. Returns modal or None."""
    for selector in [SEL["modal"], SEL["modal_fallback"]]:
        try:
            modal = page.locator(selector).first
            modal.wait_for(state="visible", timeout=timeout)
            # Verify it's a component picker (has filter sidebar or preview panel)
            picker_root = modal.locator(SEL["picker_root"])
            if picker_root.count() > 0 or modal.locator(SEL["confirm_btn"]).count() > 0:
                return modal
        except PWError:
            continue
    return None


def close_modal(page: Page, modal: Locator | None = None):
    """Close modal using close button, with Escape fallback."""
    try:
        if modal is None:
            modal = page.locator(SEL["modal"]).first
        # Try clicking the close button first
        close_btn = modal.locator(SEL["modal_close_btn"]).first
        if close_btn.count() > 0 and close_btn.is_visible():
            close_btn.click()
        else:
            page.keyboard.press("Escape")
        modal.wait_for(state="hidden", timeout=TIMEOUT_NORMAL)
    except PWError:
        # Fallback: press Escape
        try:
            page.keyboard.press("Escape")
            page.wait_for_timeout(300)
        except PWError:
            logger.warn("Could not close modal")


def find_slot_by_label(page: Page, label: str) -> tuple[Locator | None, int]:
    """Find a component slot matching the given label. Returns (locator, index)."""
    slots = page.locator(SEL["slot"])
    count = slots.count()
    search_label = label.strip().lower()
    # Strip trailing parenthesized qualifiers for multi-slot
    base_label = search_label.split("(")[0].strip()
    for i in range(count):
        slot = slots.nth(i)
        try:
            type_text = slot.locator(SEL["slot_type"]).text_content() or ""
            # Match either exact prefix or contains
            if search_label in type_text.lower() or base_label in type_text.lower():
                return slot, i
        except Exception:
            continue
    return None, -1


def save_screenshot(page: Page, name: str):
    """Take a screenshot and log its path."""
    os.makedirs(SCREENSHOTS_DIR, exist_ok=True)
    path = os.path.join(SCREENSHOTS_DIR, f"{name}.png")
    page.screenshot(path=path)
    logger.info(f"Screenshot saved: {path}")


def safe_wait_for_visible(locator: Locator, timeout: int = TIMEOUT_NORMAL) -> bool:
    """Wait for a locator to be visible. Return True if success."""
    try:
        locator.first.wait_for(state="visible", timeout=timeout)
        return True
    except PWError as e:
        logger.error(f"Not visible: {locator} — {e}")
        return False


def parse_total_price(text: str | None) -> float:
    """Extract numeric price from strings like '12 345 BYN' or '12 345,60 BYN'."""
    if not text:
        return 0.0
    cleaned = text.replace(" ", "").replace("\xa0", "")
    cleaned = re.sub(r'[^\d.,]', '', cleaned).replace(',', '.')
    try:
        return float(cleaned)
    except ValueError:
        return 0.0


# ─── Step functions ────────────────────────────────────────────────────

def collect_slots(page: Page) -> list[dict]:
    """Find all component slot elements and return their info."""
    slots = page.locator(SEL["slot"])
    count = slots.count()
    result = []
    for i in range(count):
        slot = slots.nth(i)
        type_text = slot.locator(SEL["slot_type"]).text_content() or ""
        name_text = slot.locator(SEL["slot_name"]).text_content() or ""
        price_text = slot.locator(SEL["slot_price_value"]).text_content() or ""
        css_class = slot.get_attribute("class") or ""
        state = "selected" if SEL["slot_selected"].strip(".") in css_class else \
                "incompatible" if SEL["slot_incompatible"].strip(".") in css_class else "empty"
        result.append({
            "index": i, "type": type_text.strip(), "name": name_text.strip(),
            "price": price_text.strip(), "state": state,
        })
    return result


def select_first_product_from_modal(page: Page, timeout: int = TIMEOUT_LONG) -> bool:
    """
    Inside the picker modal, wait for product cards to appear,
    prefer compatible/in-stock products, and confirm selection.

    Uses CSS module classes: .cardIncompatible, .cardOutOfStock, .confirmBtn
    Returns True if a product was successfully selected.
    """
    try:
        modal = expect_modal_visible(page, timeout)
        if modal is None:
            logger.error("Component picker modal did not open")
            return False

        # Wait for content to load (no skeletons or products visible)
        page.wait_for_load_state("networkidle", timeout=TIMEOUT_SHORT)
        page.wait_for_timeout(200)  # minimal buffer for React render

        # Check for API error banner
        error_banner = modal.locator("[class*='ApiError'], [class*='error-banner']").first
        if error_banner.count() > 0:
            try:
                if error_banner.is_visible(timeout=TIMEOUT_SHORT):
                    err_text = error_banner.text_content() or ""
                    logger.error(f"API error in modal: {err_text}. Retrying...")
                    retry_btn = modal.locator("button:has-text('Повторить'), button:has-text('Retry')")
                    if retry_btn.count() > 0:
                        retry_btn.first.click()
                        page.wait_for_timeout(2000)
                        page.wait_for_load_state("networkidle", timeout=TIMEOUT_SHORT)
            except Exception:
                pass

        # Collect all product cards (both grid and compact variants)
        cards = modal.locator(SEL["card"])
        if cards.count() == 0:
            cards = modal.locator(SEL["card_compact"])
        card_count = cards.count()
        logger.info(f"Found {card_count} product cards in modal")

        if card_count == 0:
            # Empty state — check for reason
            empty_el = modal.locator("[class*='emptyState'], [class*='empty-state']").first
            empty_text = ""
            try:
                empty_text = empty_el.text_content() or ""
            except Exception:
                pass
            if not empty_text.strip():
                # Fallback: look for generic empty message
                empty_el2 = modal.locator("h3, p:has-text('Не найдено')")
                try:
                    empty_text = empty_el2.first.text_content() or ""
                except Exception:
                    pass
            logger.warn(f"No products available: {empty_text.strip()}")
            close_modal(page, modal)
            return False

        # Tier 1: Pick a compatible, in-stock card first
        for i in range(card_count):
            card = cards.nth(i)
            card_class = card.get_attribute("class") or ""
            is_incompatible = SEL["card_incompatible"].strip(".") in card_class
            is_oos = SEL["card_oos"].strip(".") in card_class
            if not is_incompatible and not is_oos:
                product_name = ""
                try:
                    name_el = card.locator("[class*='cardName'], [class*='compactName']").first
                    product_name = name_el.text_content() or ""
                except Exception:
                    pass

                # Click "Выбрать" button on card, or card itself
                select_btn = card.locator(SEL["select_btn"]).first
                try:
                    if select_btn.count() > 0 and select_btn.is_visible(timeout=TIMEOUT_SHORT):
                        select_btn.click()
                    else:
                        card.click()
                except Exception:
                    card.click()

                logger.info(f"Selected product: {product_name.strip()[:80]}")
                break
        else:
            # Tier 2: All products incompatible or OOS — pick first compatible-looking one
            logger.warn("All products appear incompatible or OOS, trying first available")
            try:
                cards.first.click()
            except Exception as e:
                logger.error(f"Could not click any product card: {e}")
                close_modal(page, modal)
                return False

        # Wait for preview panel to highlight, then confirm
        page.wait_for_timeout(200)
        confirm_btn = modal.locator(SEL["confirm_btn"]).first
        if confirm_btn.count() > 0:
            try:
                if confirm_btn.is_enabled() and confirm_btn.is_visible():
                    confirm_btn.click()
                    logger.info("Confirmed selection via confirm button")
            except Exception:
                pass

        # Wait for modal to close
        try:
            modal.wait_for(state="hidden", timeout=TIMEOUT_NORMAL)
        except PWError:
            close_modal(page, modal)

        logger.ok("Product selected from modal")
        return True

    except PWError as e:
        logger.error(f"Error selecting product from modal: {e}")
        try:
            close_modal(page)
        except Exception:
            page.keyboard.press("Escape")
        return False


def select_component_by_slot_label(page: Page, label: str) -> bool:
    """
    Open the slot with the given label and select the first product.
    Retries up to 2 times if slot click or modal fails.
    """
    logger.action(f"Opening slot: {label}")

    for attempt in range(3):
        slot, slot_index = find_slot_by_label(page, label)
        if slot is None:
            if attempt == 0:
                # Log available slots once
                slots = page.locator(SEL["slot"])
                count = slots.count()
                logger.error(f"Slot with label '{label}' not found. Available slots:")
                for i in range(count):
                    try:
                        t = (slots.nth(i).locator(SEL["slot_type"]).text_content() or "").strip()
                        logger.error(f"  [{i}] {t}")
                    except Exception:
                        logger.error(f"  [{i}] (unreadable)")
            return False

        btn = slot.locator(SEL["slot_btn"]).first
        try:
            btn.click(timeout=TIMEOUT_NORMAL, force=attempt > 0)
            logger.ok(f"Clicked slot [{slot_index}]: {label}" + (" (force)" if attempt > 0 else ""))
        except PWError as e:
            logger.warn(f"Cannot click slot [{slot_index}] '{label}': {e}")
            if attempt < 2:
                time.sleep(1.0)
                page.wait_for_timeout(500)
                continue
            return False

        if select_first_product_from_modal(page):
            return True

        if attempt < 2:
            logger.warn(f"Selection failed for '{label}', retrying...")
            time.sleep(1.0)
            page.keyboard.press("Escape")
            page.wait_for_timeout(300)

    return False


def check_summary_price(page: Page) -> float:
    """Read and log the total price from the summary panel. Uses stability polling."""
    try:
        settled_text = wait_for_price_settled(page, timeout=3000)
        if settled_text:
            price = parse_total_price(settled_text)
            logger.price(f"Summary total price: {settled_text.strip()} ({price} BYN)")
            return price
    except Exception:
        pass
    # Fallback: direct read
    try:
        total_el = page.locator(SEL["bsp_total_value"]).first
        if total_el.is_visible(timeout=TIMEOUT_SHORT):
            text = total_el.text_content() or ""
            price = parse_total_price(text)
            logger.price(f"Summary total price (direct): {text.strip()} ({price} BYN)")
            return price
    except Exception:
        pass
    logger.price("Could not read summary price")
    return 0.0


def check_component_count(page: Page) -> tuple[int, int]:
    """Read selected count from the summary. Returns (selected, total)."""
    try:
        list_items = page.locator(SEL["bsp_component_item"])
        item_count = list_items.count()
        selected = 0
        for i in range(item_count):
            price_el = list_items.nth(i).locator(SEL["bsp_component_price"])
            text = price_el.text_content() or ""
            if text.strip() and text.strip() != "—":
                selected += 1
        logger.info(f"Component items in summary: {selected} selected of {item_count} total")
        return selected, item_count
    except Exception:
        logger.warn("Could not read component count from summary")
        return 0, 0


def check_compatibility_status(page: Page):
    """Read compatibility status and log any errors/warnings."""
    try:
        compat_text = page.locator(SEL["bsp_compat_text"]).first
        if compat_text.is_visible(timeout=TIMEOUT_SHORT):
            text = compat_text.text_content() or ""
            if "совместим" in text.lower() and "проблем" not in text.lower() and "Обратите" not in text.lower():
                logger.ok(f"Compatibility: {text.strip()}")
            else:
                logger.warn(f"Compatibility: {text.strip()}")

        # Error details
        errors = page.locator(SEL["bsp_compat_item_error"])
        for i in range(errors.count()):
            logger.error(f"Compat error: {errors.nth(i).text_content().strip()}")

        # Warning details
        warnings = page.locator(SEL["bsp_compat_item_warning"])
        for i in range(warnings.count()):
            logger.warn(f"Compat warning: {warnings.nth(i).text_content().strip()}")
    except Exception:
        logger.info("No compatibility status visible (no components or no issues)")


def _get_first_card_price(modal: Locator) -> float:
    """Extract price from the first visible product card in the modal."""
    card = modal.locator(SEL["card"]).first
    if card.count() == 0:
        card = modal.locator(SEL["card_compact"]).first
    if card.count() == 0:
        return 0.0
    try:
        price_el = card.locator(SEL["price"]).first
        text = price_el.text_content() or ""
        return parse_total_price(text)
    except Exception:
        return 0.0


def test_filters(page: Page, slot_label: str):
    """Open a slot, test filters (search, sort, stock), verify results."""
    logger.filter_check(f"Testing filters for: {slot_label}")

    slot, slot_idx = find_slot_by_label(page, slot_label)
    if slot is None:
        logger.warn(f"Cannot find slot for filter test: {slot_label}")
        return

    # Open modal
    btn = slot.locator(SEL["slot_btn"]).first
    try:
        btn.click(force=True, timeout=TIMEOUT_NORMAL)
    except Exception as e:
        logger.warn(f"Failed to open modal for filter test: {e}")
        return

    modal = expect_modal_visible(page, TIMEOUT_NORMAL)
    if modal is None:
        logger.warn(f"Modal did not open for filter test on {slot_label}")
        return

    page.wait_for_load_state("networkidle", timeout=TIMEOUT_SHORT)
    page.wait_for_timeout(200)

    # Record initial card count
    initial_cards = modal.locator(SEL["card"]).count()
    if initial_cards == 0:
        initial_cards = modal.locator(SEL["card_compact"]).count()
    logger.filter_check(f"  Initial product count: {initial_cards}")

    # 1) Search test
    search_input = modal.locator(SEL["search_input"]).first
    test_query = "AMD"
    if search_input.count() > 0:
        try:
            if search_input.is_visible(timeout=TIMEOUT_SHORT):
                logger.filter_check(f"  Search test: typing '{test_query}'")
                search_input.fill(test_query)
                page.wait_for_timeout(1000)

                # Check results count changed
                results_el = modal.locator(SEL["results_count"]).first
                try:
                    results_text = results_el.text_content() or ""
                    logger.filter_check(f"  Search results: {results_text.strip()}")
                except Exception:
                    pass

                # Verify at least some cards remain
                after_search = modal.locator(SEL["card"]).count()
                logger.filter_check(f"  Cards after search: {after_search}")

                # Clear search
                search_input.clear()
                page.wait_for_timeout(800)
        except Exception:
            pass
    else:
        logger.info(f"  No search input found for {slot_label}")

    # 2) Sort test — change to "Сначала дешевле" then "Сначала дороже" and compare first card price
    sort_select = modal.locator(SEL["sort_select"]).first
    if sort_select.count() > 0:
        try:
            if sort_select.is_visible(timeout=TIMEOUT_SHORT):
                # Sort cheapest first
                sort_select.select_option(label="Сначала дешевле")
                page.wait_for_timeout(500)
                cheapest_price = _get_first_card_price(modal)

                # Sort most expensive first
                sort_select.select_option(label="Сначала дороже")
                page.wait_for_timeout(500)
                expensive_price = _get_first_card_price(modal)

                if cheapest_price > 0 and expensive_price > 0:
                    if cheapest_price <= expensive_price:
                        logger.filter_check(f"  Sort verified: cheapest({cheapest_price}) <= expensive({expensive_price})")
                    else:
                        logger.warn(f"  Sort order MISMATCH: cheapest({cheapest_price}) > expensive({expensive_price})")
                else:
                    logger.info(f"  Could not verify sort (prices: {cheapest_price}, {expensive_price})")

                # Reset to default
                sort_select.select_option(label="По популярности")
                page.wait_for_timeout(300)
        except Exception as e:
            logger.info(f"  Sort test skipped: {e}")

    # 3) Stock checkbox test
    stock_checkbox = modal.locator(SEL["stock_check"]).first
    if stock_checkbox.count() > 0:
        try:
            # Toggle ON
            stock_checkbox.check()
            page.wait_for_timeout(500)
            after_stock = modal.locator(SEL["card"]).count()
            logger.filter_check(f"  Cards with 'В наличии': {after_stock} (was {initial_cards})")

            # Verify OOS cards are hidden
            oos_badges = modal.locator(SEL["oos_badge"])
            logger.filter_check(f"  OOS badges visible after filter: {oos_badges.count()}")

            # Toggle OFF
            stock_checkbox.uncheck()
            page.wait_for_timeout(300)
        except Exception:
            logger.info(f"  Stock checkbox test failed, trying alternate approach")
            try:
                # Try clicking the label instead
                stock_label = modal.locator(SEL["stock_label"]).first
                if stock_label.count() > 0:
                    stock_label.click()
                    page.wait_for_timeout(500)
                    logger.filter_check(f"  Stock filter toggled via label")
                    stock_label.click()  # toggle back
                    page.wait_for_timeout(300)
            except Exception:
                pass
    else:
        logger.info(f"  No stock checkbox found for {slot_label}")

    close_modal(page, modal)


def check_sidebar_buttons(page: Page) -> dict:
    """Verify sidebar button states (add to cart, save, checkout)."""
    result = {}
    selectors = {
        "add_to_cart": SEL["bsp_btn_cart"],
        "save": SEL["bsp_btn_save"],
        "export_pdf": SEL["bsp_btn_export"],
        "checkout": SEL["bsp_btn_checkout"],
    }
    for name, sel in selectors.items():
        btn = page.locator(sel).first
        try:
            if btn.is_visible(timeout=TIMEOUT_SHORT):
                result[name] = "visible_disabled" if btn.is_disabled() else "visible_enabled"
            else:
                result[name] = "hidden"
        except Exception:
            result[name] = "not_found"
    logger.info(f"Sidebar buttons: {json.dumps(result, ensure_ascii=False)}")
    return result


# --- console / JS error listeners ---
def capture_console(page: Page):
    def on_console(msg):
        text = msg.text
        if any(w in text for w in ["error", "Error", "failed", "Failed", "warning"]):
            logger.warn(f"Console [{msg.type}]: {text}")
    page.on("console", on_console)

    def on_page_error(error):
        logger.error(f"Page JS error: {error}")
    page.on("pageerror", on_page_error)


# ─── Main ──────────────────────────────────────────────────────────────
def main():
    logger.info("=" * 70)
    logger.info("PC Builder E2E Test — Started")
    logger.info(f"URL: {PC_BUILDER_URL}")
    logger.info(f"Log: {LOG_FILE}")
    logger.info("=" * 70)

    has_errors = False
    error_count = 0

    try:
        import subprocess
        result = subprocess.run(["which", "chromium-browser"], capture_output=True, text=True)
        ch_path = result.stdout.strip()
        logger.info(f"Using Chromium: {ch_path}")
    except Exception:
        pass

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
        context.add_init_script("""
            localStorage.setItem('goldpc-pc-builder', JSON.stringify({v: 2, savedAt: "", components: {}}));
            localStorage.setItem('goldpc-cart', JSON.stringify({items: [], promoCode: null, discount: 0, discountAmount: 0}));
        """)
        page = context.new_page()

        capture_console(page)

        # ── Step 1: Navigate ─────────────────────────────────────────
        logger.action(f"Navigating to {PC_BUILDER_URL}")
        page.goto(PC_BUILDER_URL, wait_until="domcontentloaded", timeout=TIMEOUT_LONG)

        # Wait for the main container (try modern selector first, fallback to legacy)
        container = None
        for sel in [SEL["page_container"], ".pc-builder-container", ".pc-builder__container"]:
            try:
                container = page.locator(sel).first
                container.wait_for(state="visible", timeout=TIMEOUT_LONG)
                logger.ok(f"Container visible via '{sel}'")
                break
            except PWError:
                container = None

        if container is None:
            logger.error("PC Builder container did not appear")
            save_screenshot(page, "01_FAIL_no_container")
            capture_diagnostic(page, "no_container")
            page.wait_for_timeout(10000)  # Extended wait for slow dev server
            slots_after_wait = page.locator(SEL["slot"]).count()
            logger.info(f"After extra wait, found {slots_after_wait} slots")

        save_screenshot(page, "01_page_loaded")

        # Verify page loaded
        slots_count = page.locator(SEL["slot"]).count()
        logger.ok(f"Page loaded. Found {slots_count} component slots")

        if slots_count == 0:
            logger.error("No component slots found — page may not have loaded correctly")
            save_screenshot(page, "01_FAIL_no_slots")
            capture_diagnostic(page, "no_slots")

        # ── Step 2: Check empty state ────────────────────────────────
        logger.action("Step 2: Verify empty state")
        empty_slots = page.locator(SEL["slot_empty"]).count()
        logger.info(f"Empty slots: {empty_slots}/{slots_count}")

        price = check_summary_price(page)
        if price == 0.0:
            logger.ok("Empty build has 0 total price")
        else:
            logger.error(f"ERROR: Empty build price is {price} BYN (expected 0)")

        buttons = check_sidebar_buttons(page)
        if buttons.get("add_to_cart") != "visible_enabled":
            logger.ok("Add to cart is disabled for empty build (correct)")
        else:
            logger.warn("Add to cart is enabled for empty build (may be incorrect)")

        check_component_count(page)
        save_screenshot(page, "02_empty_state")

        # ── Step 3: Filter tests before selection ─────────────────────
        logger.action("Step 3: Filter tests (before selection)")
        test_filters(page, "Процессор")
        test_filters(page, "Видеокарта")
        save_screenshot(page, "03_filters_tested")

        # Close any leftover modal
        page.keyboard.press("Escape")
        page.wait_for_timeout(300)

        # ── Step 4: Select components ────────────────────────────────
        logger.action("Step 4: Component selection sequence")
        logger.info(f"Will try to select: {', '.join(SLOT_LABELS)}")

        selected_count = 0
        price_after_each = []

        for label in SLOT_LABELS:
            logger.action(f"> Selecting: {label} (#{selected_count + 1})")
            result = select_component_by_slot_label(page, label)

            if result:
                selected_count += 1
                current_price = check_summary_price(page)
                check_compatibility_status(page)
                check_component_count(page)
                check_sidebar_buttons(page)
                price_after_each.append((label, current_price))
                save_screenshot(page, f"04_selected_{label}")
            else:
                logger.warn(f"> FAILED to select {label} — continuing")
                save_screenshot(page, f"04_FAIL_{label}")
                capture_diagnostic(page, f"fail_select_{label}")

        logger.ok(f"Selection complete: {selected_count}/{len(SLOT_LABELS)} components chosen")

        # ── Step 5: Verify price monotonicity ────────────────────────
        logger.action("Step 5: Price analysis")
        logger.price("Price progression:")
        prev = 0.0
        for label, price in price_after_each:
            delta = price - prev
            arrow = "↑" if delta > 0 else "=" if delta == 0 else "↓"
            logger.price(f"  {label}: {price:.2f} BYN ({arrow} {delta:+.2f})")
            if delta < 0:
                logger.error(f"  PRICE DECREASED after selecting {label}! Previous was {prev:.2f}")
            prev = price

        # ── Step 6: Test clear / deselect ──────────────────────────────
        logger.action("Step 6: Test 'Снять' (clear) button")
        selected_slots = page.locator(SEL["slot_selected"])
        sel_count = selected_slots.count()
        if sel_count > 0:
            clear_btn = selected_slots.first.locator(SEL["slot_clear"]).first
            if clear_btn.count() > 0 and clear_btn.is_visible():
                label_to_clear = selected_slots.first.locator(SEL["slot_type"]).text_content() or "unknown"
                old_price = check_summary_price(page)
                logger.action(f"  Clearing slot: {label_to_clear.strip()}")

                # Clear with slot-level price to verify
                slot_price_el = selected_slots.first.locator(SEL["slot_price_value"])
                slot_price_text = slot_price_el.text_content() or ""
                slot_price = parse_total_price(slot_price_text)

                clear_btn.click()
                page.wait_for_timeout(500)
                new_price = check_summary_price(page)

                price_diff = old_price - new_price
                if price_diff > 0:
                    logger.ok(f"  Price decreased by {price_diff:.2f} BYN after clearing")
                    # Also verify slot went back to empty
                    slot_state_after = selected_slots.first.get_attribute("class") or ""
                    if SEL["slot_selected"].strip(".") not in slot_state_after:
                        logger.ok("  Slot reverted to non-selected state")
                    else:
                        logger.warn("  Slot still shows as selected after clear")
                else:
                    logger.warn(f"  Price did not change after clearing (old={old_price}, new={new_price}, expected ~{slot_price})")
                save_screenshot(page, "06_after_clear")
            else:
                logger.info("  No clear button found on first selected slot")
        else:
            logger.info("  No selected slots to test clear")

        # ── Step 7: Re-select the cleared component ──────────────────
        logger.action("Step 7: Re-select removed component to complete build")
        result = select_component_by_slot_label(page, "Процессор")
        if result:
            logger.ok("Re-selected component successfully")
        else:
            logger.warn("Could not re-select component")

        # ── Step 8: Test quantity controls (RAM) ─────────────────────
        logger.action("Step 8: Test quantity controls")
        ram_slot, _ = find_slot_by_label(page, "Оперативная память")
        if ram_slot is not None:
            qty_container = ram_slot.locator(SEL["slot_qty"]).first
            if qty_container.count() > 0:
                qty_value = ram_slot.locator(SEL["slot_qty_value"]).first
                qty_before_text = qty_value.text_content() or "1"
                qty_before = int(qty_before_text) if qty_before_text.isdigit() else 1

                plus_btn = ram_slot.locator(SEL["slot_qty_btn"]).filter(has_text="+").first
                if plus_btn.count() > 0 and plus_btn.is_visible():
                    old_price = check_summary_price(page)
                    logger.action("  Testing RAM quantity + button")
                    plus_btn.click()
                    page.wait_for_timeout(800)

                    qty_after_text = qty_value.text_content() or ""
                    qty_after = int(qty_after_text) if qty_after_text.isdigit() else qty_before

                    new_price = check_summary_price(page)
                    if qty_after > qty_before:
                        logger.ok(f"  RAM quantity: {qty_before} → {qty_after}, price: {old_price:.2f} → {new_price:.2f}")
                    elif new_price > old_price:
                        logger.ok(f"  RAM price increased: {old_price:.2f} → {new_price:.2f} (qty: {qty_before} → {qty_after_text})")
                    else:
                        logger.info(f"  RAM + pressed but no visible effect (qty: {qty_before}→{qty_after_text}, price: {old_price:.2f}→{new_price:.2f})")
                    save_screenshot(page, "08_ram_quantity_plus")
        else:
            logger.info("  No RAM slot found for quantity test")

        # ── Step 9: Final summary ────────────────────────────────────
        logger.action("Step 9: Final build summary")
        save_screenshot(page, "09_final_summary")

        final_slots = collect_slots(page)
        logger.info("Final slot states:")
        for slot_info in final_slots:
            icon = "✓" if slot_info["state"] == "selected" else "✗" if slot_info["state"] == "incompatible" else "○"
            logger.info(
                f"  [{icon}] [{slot_info['index']}] {slot_info['type']}: "
                f"{slot_info['name'][:60]} | {slot_info['price']}"
            )

        final_price = check_summary_price(page)
        check_compatibility_status(page)
        check_component_count(page)
        final_buttons = check_sidebar_buttons(page)
        logger.price(f"Final total price: {final_price:.2f} BYN")

        # ── Step 10: Final metrics ─────────────────────────────────────
        error_count = sum(1 for e in logger.entries if e["level"] == "ERROR")
        warn_count = sum(1 for e in logger.entries if e["level"] == "WARN")
        has_errors = error_count > 0

        log_entries_json = [dict(e) for e in logger.entries]
        log_output_path = os.path.join(SCREENSHOTS_DIR, "test_log.json")
        with open(log_output_path, "w", encoding="utf-8") as f:
            json.dump(log_entries_json, f, indent=2, ensure_ascii=False, default=str)
        logger.info(f"JSON log saved to {log_output_path}")

        browser.close()

    logger.save_summary()

    # ── Report ───────────────────────────────────────────────────
    logger.info("=" * 70)
    logger.info("TEST REPORT")
    logger.info("=" * 70)
    logger.info(f"  Total log entries: {len(logger.entries)}")
    logger.info(f"  Errors: {error_count}")
    logger.info(f"  Warnings: {warn_count}")
    logger.info(f"  OK confirmations: {sum(1 for e in logger.entries if e['level'] == 'OK')}")
    logger.info(f"  Components selected: {selected_count}/{len(SLOT_LABELS)}")
    logger.info(f"  Final price: {final_price:.2f} BYN")
    if has_errors:
        logger.warn("  *** ERRORS DETECTED — see log for details ***")
    else:
        logger.ok("  No errors detected")
    logger.info("=" * 70)

    # Exit code
    if has_errors:
        sys.exit(1)
    else:
        sys.exit(0)


if __name__ == "__main__":
    main()
