#!/usr/bin/env python3
from __future__ import annotations

import html
import json
import re
import sys
import time
from copy import copy
from datetime import datetime, timezone
from pathlib import Path
from urllib.parse import urljoin

import requests
from bs4 import BeautifulSoup, NavigableString, Tag

API_BASE = "https://www.gov.uk/api/content"
SITE_BASE = "https://www.gov.uk"
OUT = Path("data/sections.json")

SECTIONS = [
    ("introduction", "Introduction"),
    ("rules-for-pedestrians-1-to-35", "Rules for pedestrians (1 to 35)"),
    ("rules-for-users-of-powered-wheelchairs-and-mobility-scooters-36-to-46", "Rules for users of powered wheelchairs and mobility scooters (36 to 46)"),
    ("rules-about-animals-47-to-58", "Rules about animals (47 to 58)"),
    ("rules-for-cyclists-59-to-82", "Rules for cyclists (59 to 82)"),
    ("rules-for-motorcyclists-83-to-88", "Rules for motorcyclists (83 to 88)"),
    ("rules-for-drivers-and-motorcyclists-89-to-102", "Rules for drivers and motorcyclists (89 to 102)"),
    ("general-rules-techniques-and-advice-for-all-drivers-and-riders-103-to-158", "General rules, techniques and advice for all drivers and riders (103 to 158)"),
    ("using-the-road-159-to-203", "Using the road (159 to 203)"),
    ("road-users-requiring-extra-care-204-to-225", "Road users requiring extra care (204 to 225)"),
    ("driving-in-adverse-weather-conditions-226-to-237", "Driving in adverse weather conditions (226 to 237)"),
    ("waiting-and-parking-238-to-252", "Waiting and parking (238 to 252)"),
    ("motorways-253-to-273", "Motorways"),
    ("breakdowns-and-incidents-274-to-287", "Breakdowns and incidents"),
    ("road-works-level-crossings-and-tramways-288-to-307", "Road works, level crossings and tramways"),
    ("light-signals-controlling-traffic", "Light signals controlling traffic"),
    ("signals-to-other-road-users", "Signals to other road users"),
    ("signals-by-authorised-persons", "Signals by authorised persons"),
    ("traffic-signs", "Traffic signs"),
    ("road-markings", "Road markings"),
    ("vehicle-markings", "Vehicle markings"),
    ("annex-1-you-and-your-bicycle", "Annex 1. You and your bicycle"),
    ("annex-2-motorcycle-licence-requirements", "Annex 2. Motorcycle licence requirements"),
    ("annex-3-motor-vehicle-documentation-and-learner-driver-requirements", "Annex 3. Motor vehicle documentation and learner driver requirements"),
    ("annex-4-the-road-user-and-the-law", "Annex 4. The road user and the law"),
    ("annex-5-penalties", "Annex 5. Penalties"),
    ("annex-6-vehicle-maintenance-safety-and-security", "Annex 6. Vehicle maintenance, safety and security"),
    ("annex-7-first-aid-on-the-road", "Annex 7. First aid on the road"),
    ("annex-8-safety-code-for-new-drivers", "Annex 8. Safety code for new drivers"),
    ("other-information", "Other information")
]

session = requests.Session()
session.headers.update({"User-Agent": "personal-bilingual-highway-code-study/1.0"})

def setup_translator():
    import argostranslate.package
    import argostranslate.translate

    installed = argostranslate.translate.get_installed_languages()
    en = next((x for x in installed if x.code == "en"), None)
    uk = next((x for x in installed if x.code == "uk"), None)
    if not (en and uk and en.get_translation(uk)):
        print("Installing Argos English -> Ukrainian model")
        argostranslate.package.update_package_index()
        packages = argostranslate.package.get_available_packages()
        pkg = next((p for p in packages if p.from_code == "en" and p.to_code == "uk"), None)
        if pkg is None:
            raise RuntimeError("No Argos English-to-Ukrainian model is available")
        path = pkg.download()
        argostranslate.package.install_from_path(path)
    return argostranslate.translate

translator = None
translation_cache = {}

def translate_text(text: str) -> str:
    global translator
    stripped = text.strip()
    if not stripped or not re.search(r"[A-Za-z]", stripped):
        return text
    if stripped in translation_cache:
        translated = translation_cache[stripped]
    else:
        if translator is None:
            translator = setup_translator()
        translated = translator.translate(stripped, "en", "uk")
        translation_cache[stripped] = translated
    prefix = text[: len(text) - len(text.lstrip())]
    suffix = text[len(text.rstrip()):]
    return prefix + translated + suffix

def absolutise(fragment: Tag):
    for tag in fragment.find_all(True):
        for attr in ("href", "src"):
            if tag.has_attr(attr):
                value = tag.get(attr)
                if value and not value.startswith(("data:", "mailto:", "tel:", "#")):
                    tag[attr] = urljoin(SITE_BASE, value)
        if tag.name == "a":
            tag["target"] = "_blank"
            tag["rel"] = "noopener"

def translated_clone(block: Tag) -> str:
    clone_soup = BeautifulSoup(str(block), "html.parser")
    root = next((x for x in clone_soup.contents if isinstance(x, Tag)), None)
    if root is None:
        return str(block)
    for node in list(root.descendants):
        if not isinstance(node, NavigableString):
            continue
        parent = node.parent
        if parent and parent.name in {"script", "style", "code", "pre"}:
            continue
        original = str(node)
        if original.strip():
            node.replace_with(translate_text(original))
    # Show images only once, in the English block.
    for img in root.find_all("img"):
        img.decompose()
    return str(root)

def extract_body(payload: dict) -> str:
    details = payload.get("details") or {}
    body = details.get("body")
    if isinstance(body, str) and body.strip():
        return body
    # Fallback for any future schema change.
    def walk(obj):
        if isinstance(obj, dict):
            if isinstance(obj.get("body"), str) and "<" in obj["body"]:
                return obj["body"]
            for v in obj.values():
                got = walk(v)
                if got:
                    return got
        elif isinstance(obj, list):
            for v in obj:
                got = walk(v)
                if got:
                    return got
        return None
    found = walk(payload)
    if not found:
        raise RuntimeError("Could not find HTML body in GOV.UK Content API response")
    return found

def useful_blocks(body_html: str):
    soup = BeautifulSoup(body_html, "html.parser")
    candidates = [x for x in soup.contents if isinstance(x, Tag)]
    # Some GOV.UK bodies may wrap everything in a single container.
    if len(candidates) == 1 and candidates[0].name in {"div", "section"}:
        children = [x for x in candidates[0].contents if isinstance(x, Tag)]
        if children:
            candidates = children
    return candidates

def clean_search_text(block: Tag, uk_html: str) -> str:
    en = block.get_text(" ", strip=True)
    uk = BeautifulSoup(uk_html, "html.parser").get_text(" ", strip=True)
    return re.sub(r"\s+", " ", f"{en} {uk}").lower()

def fetch_section(slug: str, fallback_title: str):
    path = f"/guidance/the-highway-code/{slug}"
    api_url = API_BASE + path
    source_url = SITE_BASE + path
    print(f"Fetching {source_url}")
    r = session.get(api_url, timeout=45)
    r.raise_for_status()
    payload = r.json()
    body = extract_body(payload)
    details = payload.get("details") or {}
    title = payload.get("title") or fallback_title
    description = payload.get("description") or details.get("description") or ""

    blocks = []
    for block in useful_blocks(body):
        # Skip empty structural elements.
        if not block.get_text(" ", strip=True) and not block.find(("img", "table", "figure")):
            continue
        absolutise(block)
        english_html = str(block)
        ukrainian_html = translated_clone(block)
        blocks.append({
            "english_html": english_html,
            "ukrainian_html": ukrainian_html,
            "search_text": clean_search_text(block, ukrainian_html)
        })
    return {
        "slug": slug,
        "title": title,
        "description": description,
        "source_url": source_url,
        "blocks": blocks
    }

def main():
    sections = []
    for i, (slug, title) in enumerate(SECTIONS, 1):
        print(f"[{i}/{len(SECTIONS)}] {title}")
        sections.append(fetch_section(slug, title))
    OUT.parent.mkdir(parents=True, exist_ok=True)
    OUT.write_text(json.dumps({
        "generated_at": datetime.now(timezone.utc).isoformat(),
        "translator": "Argos Translate en→uk (machine translation)",
        "source": "GOV.UK Highway Code",
        "source_url": "https://www.gov.uk/guidance/the-highway-code",
        "sections": sections
    }, ensure_ascii=False, indent=2), encoding="utf-8")
    print(f"Wrote {OUT} with {len(sections)} sections and {sum(len(s['blocks']) for s in sections)} blocks")

if __name__ == "__main__":
    main()
