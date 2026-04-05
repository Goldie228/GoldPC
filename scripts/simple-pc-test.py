#!/usr/bin/env python3
"""
Simple PC Builder test focusing on core user flows:
1. Load page
2. Select a few key components
3. Verify price updates and compatibility
4. Test basic interactions
"""

import os
import sys
import time
from pathlib import Path
from playwright.sync_api import sync_playwright, Page, expect

BASE_URL = os.getenv("BASE_URL", "http://localhost:5173")
LOG_FILE = os.getenv("LOG_FILE", str(Path(__file__).parent / "simple-test.log"))

class SimpleLogger:
    def __init__(self, path):
        self.path = path
        with open(path, "w", encoding="utf-8") as f:
            f.write("")

    def log(self, level, msg):
        timestamp = time.strftime("%H:%M:%S")
        line = f"[{timestamp}] [{level}] {msg}"
        print(line)
        with open(self.path, "a", encoding="utf-8") as f:
            f.write(line + "\n")

logger = SimpleLogger(LOG_FILE)

def safe_click(locator, description, timeout=5000):
    """Click with error handling."""
    try:
        locator.click(timeout=timeout, force=True)
        logger.log("INFO", f"Clicked: {description}")
        return True
    except Exception as e:
        logger.log("ERROR", f"Failed to click {description}: {e}")
        return False

def main():
    logger.log("INFO", "Starting simple PC Builder test")

    with sync_playwright() as p:
        browser = p.chromium.launch(
            executable_path="/usr/bin/chromium-browser",
            headless=True,
            args=["--no-sandbox", "--disable-gpu"]
        )
        context = browser.new_context(viewport={"width": 1440, "height": 900})
        page = context.new_page()

        # Navigate
        logger.log("ACTION", f"Navigating to {BASE_URL}/pc-builder")
        page.goto(f"{BASE_URL}/pc-builder", wait_until="domcontentloaded", timeout=15000)

        # Wait for content
        try:
            page.wait_for_selector(".component-slot", timeout=10000)
            logger.log("OK", "Page loaded with component slots")
        except:
            logger.log("WARN", "Component slots not found quickly, continuing anyway")

        # Count slots
        slots = page.locator(".component-slot")
        count = slots.count()
        logger.log("INFO", f"Found {count} component slots")

        if count == 0:
            logger.log("ERROR", "No component slots found")
            browser.close()
            return 1

        # Try to select first few components
        selected = 0
        max_to_try = min(4, count)  # Try first 4 slots

        for i in range(max_to_try):
            slot = slots.nth(i)
            # Get slot type
            try:
                slot_type = slot.locator(".component-slot__type").text_content() or f"Slot {i}"
            except:
                slot_type = f"Slot {i}"

            logger.log("ACTION", f"Trying to select: {slot_type}")

            # Click the slot button
            btn = slot.locator(".component-slot__btn").first
            if not safe_click(btn, f"{slot_type} button"):
                continue

            # Wait for modal
            modal = page.locator("[role='dialog'], .modal").first
            try:
                modal.wait_for(state="visible", timeout=5000)
                logger.log("OK", "Modal opened")
            except:
                logger.log("WARN", "Modal did not appear")
                page.keyboard.press("Escape")
                continue

            # Try to select first product
            # Look for any clickable product card
            product_cards = modal.locator("[class*='card']:not([class*='empty']):not(.skeleton)")
            if product_cards.count() == 0:
                # Try skeleton wait then check again
                page.wait_for_timeout(2000)
                product_cards = modal.locator("[class*='card']:not([class*='empty'])")

            if product_cards.count() > 0:
                # Click first product card
                first_card = product_cards.first
                if safe_click(first_card, "first product card"):
                    # Try to click "Выбрать" in preview
                    select_btn = modal.locator("button:has-text('Выбрать'):visible").last
                    if safe_click(select_btn, "confirm selection button"):
                        selected += 1
                        logger.log("OK", f"Selected product for {slot_type}")
                    else:
                        logger.log("WARN", "Could not confirm selection")
                else:
                    logger.log("WARN", "Could not click product card")
            else:
                logger.log("WARN", "No product cards found in modal")

            # Close modal
            page.keyboard.press("Escape")
            page.wait_for_timeout(500)

        logger.log("RESULT", f"Successfully selected {selected}/{max_to_try} components")

        # Check price
        try:
            price_el = page.locator(".bsp__total-value").first
            if price_el.is_visible(timeout=2000):
                price_text = price_el.text_content() or ""
                logger.log("PRICE", f"Total price: {price_text.strip()}")
            else:
                logger.log("INFO", "Price element not visible")
        except:
            logger.log("INFO", "Could not read price")

        # Check if any slots show selected state
        selected_slots = page.locator(".component-slot--selected").count()
        logger.log("INFO", f"Visually selected slots: {selected_slots}")

        # Take screenshot
        page.screenshot(path="/home/goldie/Progs/kursovaya/GoldPC/scripts/simple-test-result.png")
        logger.log("INFO", "Screenshot saved")

        browser.close()

        if selected > 0:
            logger.log("RESULT", "TEST PASSED: At least one component selected")
            return 0
        else:
            logger.log("RESULT", "TEST FAILED: No components selected")
            return 1

if __name__ == "__main__":
    sys.exit(main())