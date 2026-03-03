# E2E Test 007: Weekly Intelligence Report
**Date:** 1 March 2026, 18:00
**Type:** Automated Weekly Report (Windows Task Scheduler)

## Execution
- Triggered by: Weekly-Report scheduled task (Sunday 6 PM)
- Script: Automation/weekly-report.js
- Exit code: 1 (FAILED)

## What Worked
- Dotenv loaded (19 env vars)
- News articles fetched: 10
- Jobs tracked: 538 (all this week, first full week)
- PDF generation started

## What Failed
**FPDFUnicodeEncodingException** at gen-report.py line 62:
```
Character at index 58 in text is outside the range of characters supported
by the font used: "helveticaB". Please consider using a Unicode font.
```

The AI news digest contained non-ASCII characters (Chinese/emoji/accented text) in article titles. FPDF's default Helvetica font only supports latin-1 encoding.

## Root Cause
gen-report.py uses `pdf.cell()` with built-in Helvetica font which cannot render Unicode. Needs to be switched to a TrueType Unicode font (e.g., DejaVu Sans).

## Additional Warnings
27 deprecation warnings for `ln=True/False` parameter in FPDF v2.5.2+. Should migrate to `new_x=XPos.LMARGIN, new_y=YPos.NEXT` syntax.

## Impact
Weekly PDF report not generated or emailed. HTML email fallback did not trigger.

## Result: FAIL
PDF generation crashes on non-ASCII content. Needs Unicode font fix.
