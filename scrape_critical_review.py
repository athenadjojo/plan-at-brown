"""
Critical Review scraper using Selenium.
Handles client-side pagination by clicking Next button.

Usage:
    python scrape_cr_selenium.py
"""

from selenium import webdriver
from selenium.webdriver.common.by import By
from selenium.webdriver.support.ui import WebDriverWait
from selenium.webdriver.support import expected_conditions as EC
from selenium.webdriver.chrome.service import Service
from webdriver_manager.chrome import ChromeDriverManager
import json
import time
import os
import re

# ── CONFIG ────────────────────────────────────────────────────────
SESSION_TOKEN = "eyJhbGciOiJkaXIiLCJlbmMiOiJBMjU2R0NNIn0..P3Fq6qSVP-QZLWGo.vcTXagjoo0uosij1Q85EdTnHELl357Z6yIQkpYrgNwHy9loGyAc_pfVjogeSA3Ign9pTlsCApYijVHWrpVHfrYXF7xnzwPlPz-QUFE14lM7DjY3OZ8-4fQklvOOIHXzOE-vKHxffujNJKQbuD368YhM8_mGKvLm5ad6ce479fglMkkCLBejQO1N1LCXnuJpc0TfbeQGSQ6UxPtpo3A6Lol1t6851jJb17snOz1St_-BO4ggK_1GkWFs0hYavC8iPNR5gu6IgnVS3qomWx7HVpl3Tk99XBL6VLzEIEAT7R4CpCXVZa3K6IlkfEKKqduvWLEvx1NpX7okaVtOVsClG2RlUvX-cxqiG8gVqC2_zOjeOctR2gnhH6hZYcsuT_Q.WjO8Z5xTzb0OXENHXSlQ1Q"

def setup_driver():
    options = webdriver.ChromeOptions()
    # Remove headless so you can see it working
    # Add headless=True once confirmed working
    # options.add_argument("--headless")
    options.add_argument("--no-sandbox")
    options.add_argument("--disable-dev-shm-usage")
    options.add_argument("--window-size=1400,900")
    driver = webdriver.Chrome(
        service=Service(ChromeDriverManager().install()),
        options=options
    )
    return driver


def inject_session(driver):
    """Inject session cookie so we're logged in."""
    driver.get("https://www.thecriticalreview.org")
    time.sleep(1)
    driver.add_cookie({
        "name": "__Secure-next-auth.session-token",
        "value": SESSION_TOKEN,
        "domain": "www.thecriticalreview.org",
        "path": "/",
        "secure": True,
    })


def parse_table(driver):
    """Extract all rows from the current table state."""
    rows = driver.find_elements(By.CSS_SELECTOR, "tbody tr")
    courses = []
    for row in rows:
        cells = row.find_elements(By.TAG_NAME, "td")
        if len(cells) < 7:
            continue
        try:
            def text(i):
                return cells[i].text.strip() if i < len(cells) else ''

            def safe_float(i):
                try:
                    return float(text(i))
                except Exception:
                    return None

            def safe_int(i):
                try:
                    return int(text(i).replace(',', ''))
                except Exception:
                    return None

            raw_code = text(0)
            code = re.sub(r'([A-Za-z]+)(\d)', r'\1 \2', raw_code).strip()
            if not code or len(code) < 4:
                continue

            dept_match = re.match(r'([A-Z]+)', code)
            dept = dept_match.group(1) if dept_match else ''

            courses.append({
                "code":          code,
                "name":          text(1),
                "department":    dept,
                "professor":     text(2),
                "enrollment":    safe_int(3),
                "course_rating": safe_float(4),
                "prof_rating":   safe_float(5),
                "avg_hours":     safe_float(6),
                "semester":      text(7),
            })
        except Exception:
            continue
    return courses


def get_total_entries(driver):
    """Find the total entry count from pagination text."""
    try:
        # Look for text like "1-25 of 3,738 entries"
        page_text = driver.find_element(By.TAG_NAME, "body").text
        match = re.search(r'of\s+([\d,]+)\s+entr', page_text)
        if match:
            return int(match.group(1).replace(',', ''))
    except Exception:
        pass
    return 0


def click_all_tab(driver):
    """Click the 'All' tab to show all semesters."""
    try:
        # Try finding tabs by text
        tabs = driver.find_elements(By.XPATH, "//button[contains(text(), 'All')]")
        for tab in tabs:
            if tab.text.strip() == 'All':
                tab.click()
                time.sleep(2)
                print("  Clicked 'All' tab")
                return True
    except Exception:
        pass
    return False


def change_rows_per_page(driver, count=100):
    """Try to increase rows per page if there's a dropdown."""
    try:
        # Look for rows per page selector
        selects = driver.find_elements(By.TAG_NAME, "select")
        for sel in selects:
            options = sel.find_elements(By.TAG_NAME, "option")
            option_values = [o.text for o in options]
            if any(str(count) in v for v in option_values):
                from selenium.webdriver.support.ui import Select
                Select(sel).select_by_visible_text(str(count))
                time.sleep(2)
                print(f"  Set rows per page to {count}")
                return True
    except Exception:
        pass
    return False


def scrape_with_pagination(driver):
    """Paginate through all pages clicking Next."""
    all_courses = []
    page = 1

    while True:
        print(f"  Page {page}...", end='', flush=True)

        # Wait for table to be present
        try:
            WebDriverWait(driver, 10).until(
                EC.presence_of_element_located((By.CSS_SELECTOR, "tbody tr"))
            )
        except Exception:
            print(" timeout waiting for table")
            break

        # Parse current page
        courses = parse_table(driver)
        if not courses:
            print(" no rows found")
            break

        all_courses.extend(courses)

        if page == 1:
            total = get_total_entries(driver)
            print(f" {len(courses)} courses (total expected: {total})")
        else:
            print(f" {len(courses)} (running: {len(all_courses)})")

        # Save progress every 10 pages
        if page % 10 == 0:
            with open("src/data/critical_review/all_raw.json", 'w') as f:
                json.dump(all_courses, f, indent=2)
            print(f"    [Saved {len(all_courses)} records]")

        # Find and click Next button
        try:
            next_btn = driver.find_element(
                By.XPATH,
                "//button[contains(text(), 'Next') or contains(@aria-label, 'Next') or contains(@class, 'next')]"
            )
            if next_btn.is_enabled() and next_btn.get_attribute("disabled") is None:
                driver.execute_script("arguments[0].click();", next_btn)
                time.sleep(1.2)  # wait for table to update
                page += 1
            else:
                print("  Next button disabled — reached last page")
                break
        except Exception:
            print("  No Next button found — reached last page")
            break

    return all_courses


def main():
    os.makedirs("src/data/critical_review", exist_ok=True)

    print("Starting Selenium scraper...")
    driver = setup_driver()

    try:
        # Inject session and navigate
        print("Injecting session cookie...")
        inject_session(driver)

        print("Loading browse page...")
        driver.get("https://www.thecriticalreview.org/browse")
        time.sleep(3)

        # Check if logged in
        page_text = driver.find_element(By.TAG_NAME, "body").text
        if "sign in" in page_text.lower() and len(page_text) < 1000:
            print("Not logged in — token may be expired")
            driver.quit()
            return

        print("Logged in successfully")

        # Try clicking All tab to get all semesters
        click_all_tab(driver)
        time.sleep(1)

        # Try increasing rows per page
        change_rows_per_page(driver, 100)
        time.sleep(1)

        # Scrape all pages
        print("Scraping all pages...")
        all_courses = scrape_with_pagination(driver)

    finally:
        driver.quit()

    if not all_courses:
        print("No courses scraped")
        return

    # Deduplicate
    seen = set()
    clean = []
    for c in all_courses:
        key = c['code'] + '|' + (c['semester'] or '') + '|' + (c['professor'] or '')
        if key not in seen:
            seen.add(key)
            clean.append(c)

    print(f"Deduped: {len(all_courses)} → {len(clean)} unique records")

    # Save all
    with open("src/data/critical_review/all.json", 'w') as f:
        json.dump(clean, f, indent=2)

    # Save by semester
    by_semester = {}
    for c in clean:
        sem = c.get('semester', 'Unknown')
        by_semester.setdefault(sem, []).append(c)

    for semester, courses in sorted(by_semester.items()):
        fname = "src/data/critical_review/" + semester.replace(' ', '_') + ".json"
        with open(fname, 'w') as f:
            json.dump(courses, f, indent=2)
        print(f"  {semester}: {len(courses)} courses")

    print(f"\nDone! {len(clean)} total unique records")
    print(f"Semesters: {sorted(by_semester.keys())}")


if __name__ == "__main__":
    main()