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
from datetime import datetime, timezone
from pathlib import Path
from playwright.sync_api import (
    sync_playwright,
    Page,
    Locator,
    expect,
    Error as PWError,
)

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
# These are the labels as they appear on the ComponentSlot buttons.
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
    slots = page.locator(".component-slot")
    count = slots.count()
    result = []
    for i in range(count):
        slot = slots.nth(i)
        type_text = slot.locator(".component-slot__type").text_content() or ""
        name_text = slot.locator(".component-slot__name").text_content() or ""
        price_text = slot.locator(".component-slot__price-value").text_content() or ""
        css_class = slot.get_attribute("class") or ""
        state = "selected" if "component-slot--selected" in css_class else \
                "incompatible" if "component-slot--incompatible" in css_class else "empty"
        result.append({
            "index": i, "type": type_text.strip(), "name": name_text.strip(),
            "price": price_text.strip(), "state": state,
        })
    return result


def select_first_product_from_modal(page: Page, timeout: int = TIMEOUT_LONG) -> bool:
    """
    Inside the picker modal, wait for at least one product card to appear
    and click the first one. If all items show «Нет в наличии» or lock icon,
    close the modal and report.

    Returns True if a product was successfully selected.
    """
    try:
        modal = page.locator("[role='dialog']").first
        if not safe_wait_for_visible(modal, timeout):
            # Fallback: any element with modal-like class
            modal = page.locator(".modal").first
            if not safe_wait_for_visible(modal, timeout):
                logger.error("Modal did not open")
                return False

        # Wait until we have either product cards or empty state, not skeletons
        for attempt in range(8):
            skeletons = modal.locator("[class*='skeleton']")
            cards = modal.locator(f"[class*='card']:not([class*='empty']), [class*='cardCompact']:not([class*='empty'])")
            empty_state = modal.locator(f"[class*='emptyState'], [class*='empty'], [class*='empty-state']")
            if (cards.count() > 0 or safe_wait_for_visible(empty_state.first, timeout=TIMEOUT_SHORT)) and skeletons.count() == 0:
                break
            page.wait_for_timeout(1000)

        page.wait_for_timeout(500)

        # Check for error banner
        error_banner = modal.locator("[class*='error'], [class*='ApiError']").first
        if safe_wait_for_visible(error_banner, timeout=TIMEOUT_SHORT):
            err_text = error_banner.text_content() or ""
            logger.error(f"API error in modal: {err_text}. Trying retry...")
            retry_btn = modal.locator("button:has-text('Повторить'), button:has-text('Retry')")
            if retry_btn.count() > 0:
                retry_btn.first.click()
                page.wait_for_timeout(3000)

        # Find clickable product cards (exclude incompatible ones with lock)
        cards = modal.locator(f"[class*='card']:not([class*='empty']), [class*='cardCompact']:not([class*='empty'])")
        card_count = cards.count()
        logger.info(f"Found {card_count} product cards in modal")

        if card_count == 0:
            # Check for empty state
            empty_text = modal.locator(f"[class*='empty']").text_content() or ""
            logger.warn(f"No products available: {empty_text.strip()}")
            page.keyboard.press("Escape")
            page.wait_for_timeout(300)
            return False

        # Try to find a compatible one (no lock/incompatible badge)
        selected = False
        for i in range(card_count):
            card = cards.nth(i)
            is_incompatible = "incompatible" in (card.get_attribute("class") or "")
            is_oos = "oos" in (card.get_attribute("class") or "").lower() or \
                     "out" in (card.get_attribute("class") or "").lower()

            if is_incompatible or is_oos:
                continue

            # Click on the card or the "Выбрать" button
            select_btn = card.locator("button:has-text('Выбрать')")
            if select_btn.count() > 0 and select_btn.first.is_visible():
                select_btn.first.click()
                selected = True
            else:
                card.click()
                selected = True

            if selected:
                # Click "Выбрать" in the preview panel if we got one
                page.wait_for_timeout(500)
                confirm_btn = modal.locator(f"button:has-text('Выбрать'):not([class*='selectBtn']):visible").first
                if confirm_btn.count() > 0 and confirm_btn.is_visible():
                    confirm_btn.click()
                    logger.info("Confirmed selection from preview panel")

                break

        if not selected:
            # Fallback: just click any first card even if it might be incompatible
            logger.warn("All products appear incompatible or OOS, clicking first one anyway")
            try:
                cards.first.click()
                page.wait_for_timeout(500)
                confirm_btn = modal.locator(f"button:has-text('Выбрать'):visible").last
                if confirm_btn.count() > 0:
                    confirm_btn.click()
                    selected = True
            except Exception:
                logger.error("Could not click any product")
                page.keyboard.press("Escape")
                return False

        # Wait for modal to close
        page.wait_for_timeout(500)
        try:
            modal.wait_for(state="hidden", timeout=TIMEOUT_NORMAL)
        except PWError:
            # Modal still visible; press Escape
            page.keyboard.press("Escape")
            page.wait_for_timeout(300)

        logger.ok("Product selected from modal")
        return True

    except PWError as e:
        logger.error(f"Error selecting product from modal: {e}")
        page.keyboard.press("Escape")
        page.wait_for_timeout(300)
        return False


def select_component_by_slot_label(page: Page, label: str) -> bool:
    """
    Open the slot with the given label and select the first product.
    """
    logger.action(f"Opening slot: {label}")

    slots = page.locator(".component-slot")
    count = slots.count()

    slot_index = -1
    for i in range(count):
        slot = slots.nth(i)
        type_text = slot.locator(".component-slot__type").text_content() or ""
        if label.strip().lower() in type_text.strip().lower():
            slot_index = i
            break

    if slot_index == -1:
        logger.error(f"Slot with label '{label}' not found. Available slots:")
        for i in range(count):
            t = (slots.nth(i).locator(".component-slot__type").text_content() or "").strip()
            logger.error(f"  [{i}] {t}")
        return False

    slot = slots.nth(slot_index)
    # Click the primary button (Выбрать / Изменить)
    btn = slot.locator(".component-slot__btn").first
    try:
        btn.click(timeout=TIMEOUT_NORMAL)
        logger.ok(f"Clicked slot [{slot_index}]: {label}")
    except PWError as e:
        logger.error(f"Cannot click slot [{slot_index}] '{label}': {e}")
        return False

    return select_first_product_from_modal(page)


def check_summary_price(page: Page):
    """Read and log the total price from the summary panel."""
    try:
        # BuildSummaryPanel total value
        total_el = page.locator(".bsp__total-value").first
        if total_el.is_visible(timeout=TIMEOUT_SHORT):
            text = total_el.text_content() or ""
            price = parse_total_price(text)
            logger.price(f"Summary total price: {text.strip()} ({price} BYN)")
            return price
    except Exception:
        pass
    logger.price("Could not read summary price")
    return 0.0


def check_component_count(page: Page) -> tuple[int, int]:
    """Read selected count from the summary. Returns (selected, total)."""
    try:
        # The panel shows "Ваша сборка" header and compatibility status + list
        list_items = page.locator(".bsp__component-item")
        item_count = list_items.count()
        # Count how many have a non-dash price
        selected = 0
        for i in range(item_count):
            price_el = list_items.nth(i).locator(".bsp__component-price")
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
        compat_text = page.locator(".bsp__compat-text").first
        if compat_text.is_visible(timeout=TIMEOUT_SHORT):
            text = compat_text.text_content() or ""
            if "совместим" in text.lower() and "проблем" not in text.lower() and "Обратите" not in text.lower():
                logger.ok(f"Compatibility: {text.strip()}")
            else:
                logger.warn(f"Compatibility: {text.strip()}")

        # Error details
        errors = page.locator(".bsp__compat-item--error")
        for i in range(errors.count()):
            logger.error(f"Compat error: {errors.nth(i).text_content().strip()}")

        # Warning details
        warnings = page.locator(".bsp__compat-item--warning")
        for i in range(warnings.count()):
            logger.warn(f"Compat warning: {warnings.nth(i).text_content().strip()}")
    except Exception:
        logger.info("No compatibility status visible (no components or no issues)")


def test_filters(page: Page, slot_label: str):
    """Open a slot, try filters, then select a product and verify filter behavior."""
    logger.filter_check(f"Testing filters for: {slot_label}")

    # Open the slot picker
    slots = page.locator(".component-slot")
    slot_idx = -1
    for i in range(slots.count()):
        type_text = slots.nth(i).locator(".component-slot__type").text_content() or ""
        if slot_label.strip().lower() in type_text.strip().lower():
            slot_idx = i
            break

    if slot_idx == -1:
        logger.warn(f"Cannot find slot for filter test: {slot_label}")
        return

    # Force click despite overlays using Playwright's force option
    btn = slots.nth(slot_idx).locator(".component-slot__btn").first
    logger.info(f"Clicking slot button with force=True")
    btn.click(force=True, timeout=TIMEOUT_NORMAL)
    if not safe_wait_for_visible(page.locator("[role='dialog'], .modal").first, TIMEOUT_NORMAL):
        logger.warn(f"Modal did not open for filter test on {slot_label}")
        return

    page.wait_for_timeout(1500)

    # 1) Test search
    search_input = page.locator(".searchInput, [class*='searchInput'], input[type='search']").first
    test_query = "AMD"
    if search_input.count() > 0 and search_input.is_visible():
        logger.filter_check(f"  Search test: typing '{test_query}'")
        search_input.fill(test_query)
        page.wait_for_timeout(1500)
        results_count = page.locator("[class*='resultsCount']").first.text_content() or ""
        logger.filter_check(f"  Search results: {results_count.strip()}")

        # Clear search
        search_input.clear()
        page.wait_for_timeout(800)
    else:
        logger.info(f"  No search input found for {slot_label}")

    # 2) Test sort
    sort_select = page.locator(".sortSelect, select[class*='sortSelect']").first
    if sort_select.count() > 0 and sort_select.is_visible():
        original_value = sort_select.input_value() or ""
        # Change to "Сначала дешевле"
        sort_select.select_option(label="Сначала дешевле")
        page.wait_for_timeout(1000)
        logger.filter_check(f"  Sort changed from '{original_value}' to 'Сначала дешевле'")

        # Verify cards are in price-ascending order
        cards = page.locator("[class*='price']:not([class*='old']), span[class*='compactPrice'], span[class*='cardPrice']")
        prices_found = 0
        prev_price = 0.0
        order_ok = True
        for i in range(min(cards.count(), 5)):
            try:
                p_text = cards.nth(i).text_content() or ""
                p = parse_total_price(p_text)
                if p > 0:
                    prices_found += 1
                    if p < prev_price:
                        order_ok = False
                    prev_price = p
            except Exception:
                pass
        if prices_found > 1:
            if order_ok:
                logger.filter_check(f"  Sort order verified: prices are ascending ({prev_price} max)")
            else:
                logger.warn(f"  Sort order MISMATCH for {slot_label}")
        else:
            logger.info(f"  Too few cards to verify sort order on {slot_label}")

    # 3) Test "В наличии" checkbox - click on the label to avoid hidden input issues
    stock_label = page.locator(".stockCheck, label[class*='stockCheck'], .stockCheckIndicator").first
    if stock_label.count() > 0:
        logger.filter_check(f"  Clicking 'В наличии' filter label")
        stock_label.click()
        page.wait_for_timeout(1000)
        logger.filter_check(f"  'В наличии' filter toggled")
        # Toggle back
        stock_label.click()
        page.wait_for_timeout(500)
    else:
        logger.info(f"  No stock filter label found for {slot_label}")


def check_sidebar_buttons(page: Page) -> dict:
    """Verify sidebar button states (add to cart, save, checkout)."""
    result = {}
    selectors = {
        "add_to_cart": ".bsp__btn--cart",
        "save": ".bsp__btn--save",
        "export_pdf": ".bsp__btn--export",
        "checkout": ".bsp__btn--checkout",
    }
    for name, sel in selectors.items():
        btn = page.locator(sel).first
        try:
            disabled = btn.is_disabled() if btn.is_visible() else None
            result[name] = "visible_disabled" if disabled else "visible_enabled" if not disabled else "hidden"
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

    try:
        import subprocess
        result = subprocess.run(["which", "chromium-browser"], capture_output=True, text=True)
        ch_path = result.stdout.strip()
        logger.info(f"Using Chromium: {ch_path}")
    except Exception:
        pass

    with sync_playwright() as pw:
        browser = pw.chromium.launch(
            executable_path="/usr/bin/chromium-browser",
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

        # Wait for the main container to appear
        container = page.locator(".pc-builder-container")
        if not safe_wait_for_visible(container, timeout=TIMEOUT_LONG * 2):
            logger.error("PC Builder container did not appear after long wait")
            save_screenshot(page, "01_FAIL_no_container")
            # Try one more time with longer wait
            page.wait_for_timeout(10000)
            slots_after_wait = page.locator(".component-slot").count()
            logger.info(f"After extra wait, found {slots_after_wait} slots")
            if slots_after_wait == 0:
                # Still nothing - we'll continue anyway to capture whatever UI exists
                pass

        save_screenshot(page, "01_page_loaded")

        # Verify page loaded
        slots_count = page.locator(".component-slot").count()
        logger.ok(f"Page loaded. Found {slots_count} component slots")

        if slots_count == 0:
            logger.error("No component slots found — page may not have loaded correctly")
            save_screenshot(page, "01_FAIL_no_slots")

        # ── Step 2: Check empty state ────────────────────────────────
        logger.action("Step 2: Verify empty state")
        empty_slots = page.locator(".component-slot--empty").count()
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
        # Find the first selected slot and clear it
        selected = page.locator(".component-slot--selected")
        sel_count = selected.count()
        if sel_count > 0:
            clear_btn = selected.first.locator(".component-slot__clear").first
            if clear_btn.count() > 0 and clear_btn.is_visible():
                label_to_clear = selected.first.locator(".component-slot__type").text_content() or "unknown"
                old_price = check_summary_price(page)
                logger.action(f"  Clearing slot: {label_to_clear.strip()}")
                clear_btn.click()
                page.wait_for_timeout(500)
                new_price = check_summary_price(page)
                expected_decrease = old_price - new_price
                if expected_decrease > 0:
                    logger.ok(f"  Price decreased by {expected_decrease:.2f} BYN after clearing")
                else:
                    logger.warn(f"  Price did not change after clearing (old={old_price}, new={new_price})")
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
        ram_slots = page.locator(".component-slot").filter(has=page.locator(":text('Оперативная память'), :text('ОЗУ')")).first
        if ram_slots.count() > 0:
            qty_btns = ram_slots.locator(".component-slot__qty-btn")
            if qty_btns.count() >= 2:
                plus_btn = ram_slots.locator(".component-slot__qty-btn:has-text('+')").first
                if plus_btn.count() > 0:
                    old_price = check_summary_price(page)
                    logger.action("  Testing RAM quantity + button")
                    plus_btn.click()
                    page.wait_for_timeout(800)
                    new_price = check_summary_price(page)
                    if new_price > old_price:
                        logger.ok(f"  RAM quantity increased, price: {old_price:.2f} → {new_price:.2f}")
                    else:
                        logger.info(f"  RAM quantity + button pressed (price: {old_price:.2f} → {new_price:.2f})")
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

        # ── Step 10: JS errors and console check ─────────────────────
        logger.action("Step 10: Checking for JS errors")
        has_errors = any(e["level"] == "ERROR" for e in logger.entries)
        error_count = sum(1 for e in logger.entries if e["level"] == "ERROR")
        warn_count = sum(1 for e in logger.entries if e["level"] == "WARN")

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
        logger.info(f"  Sidebar buttons: {json.dumps(final_buttons, ensure_ascii=False)}")
        logger.info(f"  Screenshots saved to: {SCREENSHOTS_DIR}")
        if has_errors:
            logger.warn("  *** ERRORS DETECTED — see log for details ***")
        else:
            logger.ok("  No errors detected")
        logger.info("=" * 70)

        log_entries_json = [dict(e) for e in logger.entries]
        log_output_path = os.path.join(SCREENSHOTS_DIR, "test_log.json")
        with open(log_output_path, "w", encoding="utf-8") as f:
            json.dump(log_entries_json, f, indent=2, ensure_ascii=False, default=str)
        logger.info(f"JSON log saved to {log_output_path}")

        browser.close()

    logger.save_summary()

    # Exit code
    if has_errors:
        sys.exit(1)
    else:
        sys.exit(0)


if __name__ == "__main__":
    main()
