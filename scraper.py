import requests
from bs4 import BeautifulSoup
import json
import re
import time
import os

CONCENTRATIONS = {
    "Africana Studies": "afri",
    "American Studies": "amst",
    "Anthropology": "anth",
    "Applied Mathematics": "apma",
    "Applied Mathematics-Biology": "apmb",
    "Applied Mathematics-Computer Science": "apmc",
    "Applied Mathematics-Economics": "apme",
    "Archaeology and the Ancient World": "aran",
    "Architecture": "arct",
    "Astronomy": "astr",
    "Behavioral Decision Sciences": "bds",
    "Biochemistry and Molecular Biology": "bchm",
    "Biology": "biol",
    "Biomedical Engineering": "enbi",
    "Biophysics": "biop",
    "Chemical Engineering": "cheg",
    "Chemical Physics": "chph",
    "Chemistry": "chem",
    "Classics": "clas",
    "Cognitive Neuroscience": "cogn",
    "Cognitive Science": "cogs",
    "Comparative Literature": "colt",
    "Computational Biology": "csbi",
    "Computational Chemistry and Chemical Physics": "cccp",
    "Computational Neuroscience": "cneu",
    "Computer Engineering": "coeg",
    "Computer Science": "comp",
    "Computer Science-Economics": "csec",
    "Contemplative Studies": "ctmp",
    "Critical Native American and Indigenous Studies": "nais",
    "Design Engineering": "dese",
    "Early Modern World": "emow",
    "Earth and Planetary Science": "eps",
    "Earth, Climate, and Biology": "ecb",
    "East Asian Studies": "east",
    "Economics": "econ",
    "Education Studies": "educ",
    "Egyptology and Assyriology": "egya",
    "Electrical Engineering": "eleg",
    "Engineering": "engn",
    "Engineering and Physics": "enph",
    "English": "engl",
    "Environmental Engineering": "eveg",
    "Environmental Sciences and Studies": "envs",
    "Ethnic Studies": "eths",
    "French and Francophone Studies": "ffs",
    "Gender and Sexuality Studies": "gnss",
    "Geochemistry and Environmental Chemistry": "gcec",
    "Geophysics and Climate Physics": "gpcp",
    "German Studies": "gmst",
    "Health and Human Biology": "hhbi",
    "Hispanic Literatures and Cultures": "hslc",
    "History": "hist",
    "History of Art and Architecture": "hiaa",
    "Independent Concentration": "indp",
    "International and Public Affairs": "iapa",
    "Italian Studies": "ital",
    "Judaic Studies": "juds",
    "Latin American and Caribbean Studies": "lacs",
    "Linguistics": "ling",
    "Literary Arts": "lita",
    "Materials Engineering": "maeg",
    "Mathematics": "math",
    "Mathematics-Computer Science": "macs",
    "Mathematics-Economics": "mtec",
    "Mechanical Engineering": "mceg",
    "Medieval Cultures": "mdvc",
    "Middle East Studies": "mide",
    "Modern Culture and Media": "mcmd",
    "Music": "musc",
    "Neuroscience": "neur",
    "Philosophy": "phil",
    "Physics": "phys",
    "Physics and Philosophy": "phph",
    "Political Science": "pols",
    "Portuguese and Brazilian Studies": "pobr",
    "Psychology": "psyc",
    "Public Health": "pubh",
    "Religious Studies": "rels",
    "Science, Technology, and Society": "sts",
    "Slavic Studies": "slav",
    "Social Analysis and Research": "sar",
    "Sociology": "soc",
    "South Asian Studies": "sast",
    "Statistics": "stat",
    "Theatre Arts and Performance Studies": "taps",
    "Urban Studies": "urbn",
    "Visual Art": "visa",
}

BASE_URL = "https://bulletin.brown.edu/the-college/concentrations"

def get_course_from_link(link):
    href = link.get('href', '')
    if 'search/?P=' not in href:
        return None
    code = requests.utils.unquote(href.split('P=')[-1]).strip()
    name = link.get_text(strip=True).replace('\u00a0', ' ')  # fix non-breaking space
    if code and len(code) > 3:
        return {"code": code, "name": name}
    return None

def extract_all_courses(soup):
    courses = []
    seen = set()
    for link in soup.find_all('a', href=re.compile(r'search/\?P=')):
        c = get_course_from_link(link)
        if c and c['code'] not in seen:
            seen.add(c['code'])
            courses.append(c)
    return courses

def parse_table_into_groups(table):
    """
    Parse a bulletin requirement table into sub-groups.
    
    The bulletin table structure is:
    - Section label rows (no course links, spans multiple cols) = sub-header
    - Single course link row = required course
    - "or COURSE" row = alternative to previous course (choose_one)
    - Multiple course links in one row = choose_one group
    - Last column number = how many courses required from this group
    """
    groups = []
    current_group = None

    for row in table.find_all('tr'):
        cells = row.find_all(['td', 'th'])
        if not cells:
            continue

        full_text = row.get_text(' ', strip=True)

        # Skip total rows
        if re.search(r'total credits?', full_text, re.IGNORECASE):
            continue

        # Extract course links
        row_courses = []
        for cell in cells:
            for link in cell.find_all('a', href=re.compile(r'search/\?P=')):
                c = get_course_from_link(link)
                if c:
                    row_courses.append(c)

        # Get count from last numeric cell
        count = None
        for cell in reversed(cells):
            txt = cell.get_text(strip=True)
            try:
                count = int(txt)
                break
            except:
                continue

        first_cell_text = cells[0].get_text(strip=True) if cells else ''
        is_or_row = re.match(r'^or\b', first_cell_text, re.IGNORECASE) is not None

        if row_courses:
            if is_or_row and current_group is not None:
                # Alternative — make current group a choose_one
                current_group['type'] = 'choose_one'
                current_group['courses'].extend(row_courses)
            elif len(row_courses) > 1:
                # Multiple courses = choose one of them
                new_group = {
                    'name': '',
                    'type': 'choose_one',
                    'courses': row_courses,
                    'count': count,
                    'notes': []
                }
                groups.append(new_group)
                current_group = new_group
            else:
                # Single required course
                new_group = {
                    'name': '',
                    'type': 'required',
                    'courses': row_courses,
                    'count': count,
                    'notes': []
                }
                groups.append(new_group)
                current_group = new_group

        else:
            # No course links — section label or note
            if not full_text or len(full_text) < 3:
                continue

            # If it has a count and meaningful text, it's a section label
            # that describes what comes next (e.g. "Two of these four:")
            if full_text and full_text not in ['', ' ']:
                new_group = {
                    'name': full_text,
                    'type': 'label',
                    'courses': [],
                    'count': count,
                    'notes': []
                }
                groups.append(new_group)
                current_group = new_group

    # Post-process: merge label groups with their following course groups
    merged = []
    i = 0
    while i < len(groups):
        g = groups[i]
        if g['type'] == 'label' and not g['courses']:
            # Collect following non-label groups until next label
            sub_groups = []
            j = i + 1
            while j < len(groups) and groups[j]['type'] != 'label':
                sub_groups.append(groups[j])
                j += 1

            if sub_groups:
                merged.append({
                    'name': g['name'],
                    'type': 'section',
                    'count': g['count'],
                    'sub_groups': sub_groups,
                    'notes': g['notes']
                })
                i = j
            else:
                merged.append(g)
                i += 1
        else:
            merged.append(g)
            i += 1

    return merged

def scrape_concentration(name, slug):
    url = f"{BASE_URL}/{slug}/"
    print(f"Scraping {name} ({slug})...")

    try:
        response = requests.get(url, timeout=10)
        response.raise_for_status()
        soup = BeautifulSoup(response.text, 'html.parser')
    except Exception as e:
        print(f"  ✗ Error: {e}")
        return None

    result = {
        "concentration": name,
        "slug": slug,
        "url": url,
        "tracks": [],
        "all_courses": extract_all_courses(soup)
    }

    headers = soup.find_all(['h3', 'h4'])

    for header in headers:
        header_text = header.get_text(strip=True)

        skip_keywords = ['honor', 'professional track', 'brown university',
                         'print', 'resources', 'contact', 'back to top']
        if any(k in header_text.lower() for k in skip_keywords):
            continue
        if not header_text or len(header_text) < 3:
            continue

        next_table = header.find_next('table')
        if not next_table:
            continue

        groups = parse_table_into_groups(next_table)

        # Build flat courses list for backward compat
        flat_courses = []
        flat_notes = []

        def flatten(gs):
            for g in gs:
                if g['type'] == 'section':
                    flatten(g.get('sub_groups', []))
                elif g['type'] == 'required' and g['courses']:
                    flat_courses.append({'type': 'required', 'course': g['courses'][0]})
                elif g['type'] == 'choose_one' and g['courses']:
                    flat_courses.append({'type': 'choose_one', 'options': g['courses']})
                for note in g.get('notes', []):
                    if note not in flat_notes:
                        flat_notes.append(note)

        flatten(groups)

        track = {
            "id": re.sub(r'[^a-z0-9]', '_', header_text.lower())[:50],
            "name": header_text,
            "groups": groups,       # Rich structured data
            "courses": flat_courses, # Flat list for backward compat
            "notes": flat_notes
        }

        if groups:
            result['tracks'].append(track)

    print(f"  ✓ {len(result['all_courses'])} courses, {len(result['tracks'])} tracks")
    return result


def main():
    os.makedirs("src/data/concentrations", exist_ok=True)
    index = {}
    failed = []

    for name, slug in CONCENTRATIONS.items():
        data = scrape_concentration(name, slug)

        if data:
            filepath = f"src/data/concentrations/{slug}.json"
            with open(filepath, 'w') as f:
                json.dump(data, f, indent=2)

            index[slug] = {
                "name": name,
                "slug": slug,
                "total_courses": len(data["all_courses"]),
                "tracks": len(data["tracks"])
            }
        else:
            failed.append((name, slug))

        time.sleep(0.4)

    with open("src/data/concentrations/index.json", 'w') as f:
        json.dump(index, f, indent=2)

    print(f"\n{'='*50}")
    print(f"Done! Scraped {len(index)} concentrations")
    if failed:
        print(f"Failed ({len(failed)}):")
        for n, s in failed:
            print(f"  - {n} ({s})")

if __name__ == "__main__":
    main()