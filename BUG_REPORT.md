# GoldPC PC Builder Bug Report

Generated: 2026-04-08

| Status | Issue | Steps | Expected | Actual | Severity |
|--------|-------|-------|----------|--------|----------|
| 🟢 FIXED | Modal main thread blocking | Open component picker | Modal opens instantly | 5 second freeze | CRITICAL |
| ⏳ TESTING | Triple network requests | Open modal | 1 API request | 3 identical requests | HIGH |
| ⏳ TESTING | RAM quantity minus button | Click minus when quantity = 1 | Decrement to 0 or disable | Removes entire RAM stick | MEDIUM |
| ⏳ TESTING | Motherboard chipset filter | Open MB picker with CPU selected | Only matching chipsets appear | All chipsets shown | MEDIUM |
| ⏳ TESTING | RAM type auto filter | Open RAM picker with DDR4 MB selected | Only DDR4 RAM shown | All RAM types shown | MEDIUM |
| ⏳ TESTING | Cooling type filter categories | Open cooling picker | Air / Liquid / Fan categories | Shows pin types instead | MEDIUM |
| ⏳ TESTING | Case form factor multi-select | Open case picker | Checkboxes for form factors | Radio buttons only | MEDIUM |
| ⏳ TESTING | Quantity button styles | All quantity inputs | Gold design system styling | Broken / missing styles | LOW |
| ⏳ TESTING | Saved build persistence | Save build + reload | Build restored completely | All slots cleared | MEDIUM |
| ⏳ TESTING | PDF export Cyrillic | Generate PDF | Correct Cyrillic text | Garbled characters | MEDIUM |
| ⏳ TESTING | Modal select button | Select product in modal | Modal closes + slot updates | Modal stays open | MEDIUM |

---

## Test Log

I will now manually test every scenario via Chrome DevTools MCP and update this report with findings before implementing fixes.
