"""
Simpler prereq scraper — uses Brown Bulletin course pages
instead of CAB API (no auth required)
"""
import requests
from bs4 import BeautifulSoup
import json
import re
import time
import os

BASE = "https://bulletin.brown.edu/search/?P="

def get_prereqs_from_bulletin(course_code):
    """
    Fetch prereqs from bulletin course search page.
    e.g. https://bulletin.brown.edu/search/?P=CSCI%200200
    """
    url = BASE + requests.utils.quote(course_code)
    try:
        r = requests.get(url, timeout=10)
        if r.status_code != 200:
            return []
        
        soup = BeautifulSoup(r.text, 'html.parser')
        
        # Find prerequisite text
        text = soup.get_text()
        prereqs = []
        
        # Look for "Prerequisite:" section
        if 'Prerequisite' in text:
            start = text.index('Prerequisite')
            section = text[start:start+500]
            # Extract course codes like "CSCI 0200", "MATH 0520" etc
            codes = re.findall(r'[A-Z]{2,4}\s+\d{4}[A-Z]?', section)
            # Stop at next sentence
            prereqs = [c for c in codes if c != course_code]
        
        return prereqs
    except Exception as e:
        return []

def main():
    # Load all course codes from concentration JSONs
    codes = set()
    for f in os.listdir("src/data/concentrations"):
        if f.endswith('.json') and f != 'index.json':
            with open(f"src/data/concentrations/{f}") as fp:
                d = json.load(fp)
            for c in d.get('all_courses', []):
                if c.get('code'):
                    codes.add(c['code'])
    
    codes = sorted(codes)
    print(f"Scraping prereqs for {len(codes)} courses...")
    
    result = {}
    for i, code in enumerate(codes):
        print(f"[{i+1}/{len(codes)}] {code}...", end='', flush=True)
        prereqs = get_prereqs_from_bulletin(code)
        result[code] = prereqs
        print(f" {prereqs if prereqs else 'none'}")
        time.sleep(0.3)
        
        if (i+1) % 50 == 0:
            with open("src/data/prerequisites.json", 'w') as f:
                json.dump(result, f, indent=2)
    
    with open("src/data/prerequisites.json", 'w') as f:
        json.dump(result, f, indent=2)
    print(f"\nDone! Saved to src/data/prerequisites.json")

if __name__ == "__main__":
    main()