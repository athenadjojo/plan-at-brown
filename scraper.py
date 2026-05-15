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


def get_course_from_link(link, row=None):
    href = link.get('href', '')
    if 'search/?P=' not in href:
        return None
    code = requests.utils.unquote(href.split('P=')[-1]).strip()
    code = code.replace('\u00a0', ' ')
    
    # Try to get the course name from the next cell in the row
    name = code  # fallback to code
    if row:
        cells = row.find_all(['td', 'th'])
        for i, cell in enumerate(cells):
            if link in cell.find_all('a'):
                # Name is usually in the next cell
                if i + 1 < len(cells):
                    cell_text = cells[i + 1].get_text(strip=True).replace('\u00a0', ' ')
                    # Make sure it's not a number (count column)
                    if cell_text and not cell_text.isdigit() and len(cell_text) > 3:
                        name = cell_text
                break
    
    if not name or name == code:
        name = link.get_text(strip=True).replace('\u00a0', ' ')
    
    if code and len(code) > 3:
        return {"code": code, "name": name}
    return None

def clean_label(text):
    """Remove footnote reference numbers like 1, 5,6 from end of label text."""
    # Remove trailing footnote patterns like "5,6" or "1" or "1 2"
    text = re.sub(r'[\s,]+[\d,\s]+$', '', text.strip())
    # Remove trailing numbers in parentheses
    text = re.sub(r'\s*\(\d+\)\s*$', '', text)
    return text.strip()

def extract_all_courses(soup):
    courses = []
    seen = set()
    for link in soup.find_all('a', href=re.compile(r'search/\?P=')):
        row = link.find_parent('tr')
        c = get_course_from_link(link, row)
        if c and c['code'] not in seen:
            seen.add(c['code'])
            courses.append(c)
    return courses


def extract_description(soup):
    paragraphs = []
    content_div = soup.find('div', {'id': 'content'}) or soup.find('body')
    if not content_div:
        return ""
    for p in content_div.find_all('p'):
        text = p.get_text(strip=True)
        if text and len(text) > 40:
            paragraphs.append(text)
        if len(paragraphs) >= 2:
            break
    return ' '.join(paragraphs)


def parse_table_into_groups(table):
    groups = []
    current_group = None

    for row in table.find_all('tr'):
        cells = row.find_all(['td', 'th'])
        if not cells:
            continue

        full_text = row.get_text(' ', strip=True).replace('\u00a0', ' ')

        if re.search(r'total credits?', full_text, re.IGNORECASE):
            continue

        row_courses = []
        for cell in cells:
            for link in cell.find_all('a', href=re.compile(r'search/\?P=')):
                c = get_course_from_link(link, row)
                if c:
                    row_courses.append(c)

        # Get count from last numeric cell
        count = None
        for cell in reversed(cells):
            txt = cell.get_text(strip=True)
            try:
                count = int(txt)
                break
            except Exception:
                continue

        first_cell_text = cells[0].get_text(strip=True).replace('\u00a0', ' ') if cells else ''
        is_or_row = re.match(r'^or\b', first_cell_text, re.IGNORECASE) is not None

        # Row with no courses but has meaningful text = label or note
        if not row_courses:
            if not full_text or len(full_text) < 3:
                continue
            # If it mentions "select N" or "choose N" it's a section header
            is_select = re.search(r'\b(select|choose|pick|complete|take)\b', full_text, re.IGNORECASE)
            new_group = {
                'name': clean_label(full_text),
                'type': 'label',
                'courses': [],
                'count': count,
                'notes': []
            }
            groups.append(new_group)
            current_group = new_group
            continue

        if is_or_row and current_group is not None:
            # Alternative to previous course — make it choose_one
            current_group['type'] = 'choose_one'
            current_group['courses'].extend(row_courses)
        elif len(row_courses) > 1:
            # Multiple courses on same row = choose one of them
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
            # Single course
            # If count == 1 in last col, it's a NEW requirement slot
            # even if previous was also a single course
            new_group = {
                'name': '',
                'type': 'required',
                'courses': row_courses,
                'count': count,
                'notes': []
            }
            groups.append(new_group)
            current_group = new_group

    # Merge label + following course groups into sections
    merged = []
    i = 0
    while i < len(groups):
        g = groups[i]
        if g['type'] == 'label' and not g['courses']:
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
                # Label with no courses after it = standalone note
                merged.append({
                    'name': g['name'],
                    'type': 'label',
                    'courses': [],
                    'count': g['count'],
                    'notes': []
                })
                i += 1
        else:
            merged.append(g)
            i += 1

    return merged


def flatten_groups(groups):
    flat_courses = []
    flat_notes = []

    def _flatten(gs):
        for g in gs:
            if g['type'] == 'section':
                _flatten(g.get('sub_groups', []))
            elif g['type'] == 'required' and g['courses']:
                flat_courses.append({'type': 'required', 'course': g['courses'][0]})
            elif g['type'] == 'choose_one' and g['courses']:
                flat_courses.append({'type': 'choose_one', 'options': g['courses']})
            for note in g.get('notes', []):
                if note not in flat_notes:
                    flat_notes.append(note)

    _flatten(groups)
    return flat_courses, flat_notes


def build_track_from_table(table, name, track_id):
    groups = parse_table_into_groups(table)
    flat_courses, flat_notes = flatten_groups(groups)
    return {
        "id": track_id,
        "name": name,
        "groups": groups,
        "courses": flat_courses,
        "notes": flat_notes
    }


def scrape_concentration(name, slug):
    url = f"{BASE_URL}/{slug}/"
    print(f"Scraping {name} ({slug})...")

    try:
        response = requests.get(url, timeout=10)
        response.raise_for_status()
        soup = BeautifulSoup(response.text, 'html.parser')
    except Exception as e:
        print(f"  x Error: {e}")
        return None

    result = {
        "concentration": name,
        "slug": slug,
        "url": url,
        "description": extract_description(soup),
        "tracks": [],
        "all_courses": extract_all_courses(soup)
    }

    skip_keywords = ['honor', 'professional track', 'brown university',
                     'print', 'resources', 'contact', 'back to top']

    # Primary: h3/h4 headers with a table after each
    headers = soup.find_all(['h3', 'h4'])
    for header in headers:
        header_text = header.get_text(strip=True)
        if any(k in header_text.lower() for k in skip_keywords):
            continue
        if not header_text or len(header_text) < 3:
            continue

        next_table = header.find_next('table')
        if not next_table:
            continue

        track_id = re.sub(r'[^a-z0-9]', '_', header_text.lower())[:50]
        track = build_track_from_table(next_table, header_text, track_id)
        if track['groups'] or track['courses']:
            result['tracks'].append(track)

    # Fallback: no headers found — parse all tables directly
    # Handles concentrations like Engineering & Physics
    if not result['tracks']:
        tables = soup.find_all('table')
        for i, table in enumerate(tables):
            groups = parse_table_into_groups(table)
            if not groups:
                continue
            flat_courses, flat_notes = flatten_groups(groups)
            if flat_courses or groups:
                result['tracks'].append({
                    "id": f"requirements_{i}",
                    "name": "Concentration Requirements",
                    "groups": groups,
                    "courses": flat_courses,
                    "notes": flat_notes
                })

    print(f"  + {len(result['all_courses'])} courses, {len(result['tracks'])} tracks")
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

    print(f"\n{'=' * 50}")
    print(f"Done! Scraped {len(index)} concentrations")
    if failed:
        print(f"Failed ({len(failed)}):")
        for n, s in failed:
            print(f"  - {n} ({s})")


if __name__ == "__main__":
    main()