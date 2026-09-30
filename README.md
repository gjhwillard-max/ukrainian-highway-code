# Ukrainian Highway Code Study Guide

A personal English/Ukrainian study aid for learning the UK Highway Code.

## Structure

- `index.html` – mobile web app shell
- `data/rules.json` – bilingual study content used by the website
- `tools/import_highway_code.py` – downloads original GOV.UK Highway Code pages through the GOV.UK Content API
- `service-worker.js` – offline caching

The plan is to keep the original English content separate from Ukrainian translations so official GOV.UK updates can be imported without losing translation work.

Highway Code source content is reused under the Open Government Licence v3.0. The Ukrainian translation is a personal study aid and is not an official translation.
