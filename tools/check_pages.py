"""Sanity-check the pages after the source-restriction rewrite.

Verifies tag balance for the containers the rewrite touched, confirms the shared
chrome survived on every page, and reports how many awaiting-content blocks each
page carries.
"""

import glob
import io
import os
import re

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))

PAIRS = ["main", "section", "div", "aside", "form", "table", "ul", "ol", "dl", "figure"]
REQUIRED = [
    ('<main id="main">', "main landmark"),
    ('class="masthead"', "masthead"),
    ('class="footer"', "footer"),
    ('id="primary-nav"', "nav"),
    ("assets/js/main.js", "script"),
]

VOID_SAFE = re.compile(r"<!--.*?-->", re.S)

problems = 0
print("%-18s %-7s %s" % ("page", "pending", "notes"))
print("-" * 60)

for path in sorted(glob.glob(os.path.join(ROOT, "*.html"))):
    with io.open(path, encoding="utf-8") as fh:
        html = fh.read()
    body = VOID_SAFE.sub("", html)
    notes = []

    for tag in PAIRS:
        opens = len(re.findall(r"<%s(?=[\s>])" % tag, body))
        closes = len(re.findall(r"</%s>" % tag, body))
        if opens != closes:
            notes.append("%s %d/%d" % (tag, opens, closes))
            problems += 1

    for needle, label in REQUIRED:
        if needle not in html:
            notes.append("missing %s" % label)
            problems += 1

    pending = html.count('class="pending"') + html.count('class="pending" ')
    print("%-18s %-7d %s" % (os.path.basename(path), pending, ", ".join(notes) or "ok"))

print("\n%s" % ("all pages balanced" if not problems else "%d problem(s) found" % problems))
