#!/usr/bin/env python3
"""
Download selected GOV.UK Highway Code pages through the official Content API.

This script stores the original structured JSON in data/raw/.
It does not translate anything yet; translations are kept separately so the
official English source can always be refreshed without overwriting them.
"""
from pathlib import Path
import json
import urllib.request

BASE = "https://www.gov.uk/api/content"

PAGES = [
    "/guidance/the-highway-code/introduction",
    "/guidance/the-highway-code/rules-for-pedestrians-1-to-35",
    "/guidance/the-highway-code/rules-about-animals-47-to-58",
    "/guidance/the-highway-code/rules-for-cyclists-59-to-82",
    "/guidance/the-highway-code/rules-for-drivers-and-motorcyclists-89-to-102",
    "/guidance/the-highway-code/general-rules-techniques-and-advice-for-all-drivers-and-riders-103-to-158",
    "/guidance/the-highway-code/using-the-road-159-to-203",
    "/guidance/the-highway-code/road-users-requiring-extra-care-204-to-225",
    "/guidance/the-highway-code/driving-in-adverse-weather-conditions-226-to-237",
    "/guidance/the-highway-code/waiting-and-parking-238-to-252",
    "/guidance/the-highway-code/motorways-253-to-273",
    "/guidance/the-highway-code/breakdowns-and-incidents-274-to-287",
    "/guidance/the-highway-code/road-works-level-crossings-and-tramways-288-to-307",
    "/guidance/the-highway-code/light-signals-controlling-traffic",
    "/guidance/the-highway-code/signals-to-other-road-users",
    "/guidance/the-highway-code/signals-by-authorised-persons",
    "/guidance/the-highway-code/traffic-signs",
    "/guidance/the-highway-code/road-markings",
    "/guidance/the-highway-code/vehicle-markings"
]

OUT = Path("data/raw")
OUT.mkdir(parents=True, exist_ok=True)

for path in PAGES:
    slug = path.rstrip("/").split("/")[-1]
    url = BASE + path
    print(f"Downloading {url}")
    req = urllib.request.Request(url, headers={"User-Agent": "personal-highway-code-study/1.0"})
    with urllib.request.urlopen(req, timeout=30) as response:
        data = json.load(response)
    (OUT / f"{slug}.json").write_text(
        json.dumps(data, ensure_ascii=False, indent=2),
        encoding="utf-8"
    )

print(f"Saved {len(PAGES)} pages to {OUT}")
