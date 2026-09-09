"""Dump all text from the DOCX proposal and the PPTX orientation deck.

These two files are the only permitted sources for website copy, so this script
exists to make their full contents auditable.
"""

import glob
import os
import re
import sys
import zipfile
from xml.etree import ElementTree as ET

W = "{http://schemas.openxmlformats.org/wordprocessingml/2006/main}"
A = "{http://schemas.openxmlformats.org/drawingml/2006/main}"

DOWNLOADS = os.path.join(os.path.expanduser("~"), "Downloads")
DOCX = os.path.join(DOWNLOADS, "PROPOSED WEBSITE FOR KLM ONLINE SCHOOL OF MINISTRY.docx")
PPTX = os.path.join(DOWNLOADS, "2026 COHORT Orientation For School of Ministry -  Repaired.pptx")

OUT = os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), "tools", "source-dump")
os.makedirs(OUT, exist_ok=True)


def docx_text(path):
    lines = []
    with zipfile.ZipFile(path) as z:
        root = ET.fromstring(z.read("word/document.xml"))
    for para in root.iter(W + "p"):
        buf = []
        for node in para.iter():
            if node.tag == W + "t":
                buf.append(node.text or "")
            elif node.tag == W + "tab":
                buf.append("\t")
            elif node.tag in (W + "br", W + "cr"):
                buf.append("\n")
        text = "".join(buf).strip()
        # Keep list markers visible so bullet structure survives the dump.
        numpr = para.find(W + "pPr/" + W + "numPr")
        if text and numpr is not None:
            text = "- " + text
        lines.append(text)
    return "\n".join(lines)


def pptx_text(path):
    out = []
    with zipfile.ZipFile(path) as z:
        slides = sorted(
            (n for n in z.namelist() if re.match(r"ppt/slides/slide\d+\.xml$", n)),
            key=lambda n: int(re.search(r"(\d+)", os.path.basename(n)).group(1)),
        )
        for name in slides:
            root = ET.fromstring(z.read(name))
            texts = [t.text.strip() for t in root.iter(A + "t") if t.text and t.text.strip()]
            imgs = len([e for e in root.iter() if e.tag.endswith("}blip")])
            out.append("===== %s (embedded images: %d) =====" % (os.path.basename(name), imgs))
            out.extend(texts if texts else ["(no text layer)"])
            out.append("")

        media = sorted(n for n in z.namelist() if n.startswith("ppt/media/"))
        out.append("===== media inventory =====")
        for n in media:
            out.append("%s  %d bytes" % (n, z.getinfo(n).file_size))

        media_dir = os.path.join(OUT, "media")
        os.makedirs(media_dir, exist_ok=True)
        for n in media:
            with open(os.path.join(media_dir, os.path.basename(n)), "wb") as fh:
                fh.write(z.read(n))
    return "\n".join(out)


for label, path, fn in (("docx", DOCX, docx_text), ("pptx", PPTX, pptx_text)):
    if not os.path.isfile(path):
        print("MISSING: %s" % path)
        continue
    text = fn(path)
    dest = os.path.join(OUT, label + ".txt")
    with open(dest, "w", encoding="utf-8") as fh:
        fh.write(text)
    print("%s -> %s (%d chars)" % (os.path.basename(path), dest, len(text)))
