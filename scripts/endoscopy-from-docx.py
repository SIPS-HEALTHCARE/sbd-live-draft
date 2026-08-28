#!/usr/bin/env python3
"""Build the Endoscopy reading content in src/js/endoscopy.js from the source manual.

docs/curriculum/endoscopy/SIPS_Endoscopy_Module1_Reprocessing.docx (the client's Self-Study
Manual, byte-identical to the file Dr. Jake sent) is the curriculum. This script is the only
thing that should ever write the `sections`/`sectionContent` arrays for module 'en-01' in
src/js/endoscopy.js, mirroring foundations-from-docx.py's role for Foundations — if the client
sends a corrected document, re-run this rather than hand-editing the generated HTML.

    python3 scripts/endoscopy-from-docx.py --check    # report only, write nothing
    python3 scripts/endoscopy-from-docx.py            # rewrite endoscopy.js

After writing, bump the ?v= on endoscopy.js in index.html, as with any src/js change.

WHY THIS IS A SEPARATE SCRIPT, NOT A FORK OF foundations-from-docx.py
The manual has zero Word heading styles (every paragraph is Normal) — foundations-from-docx.py
keys entirely on Heading1 "N.N" paragraphs and cannot walk this document. Chapters are plain
"CHAPTER N" text lines; sub-headings are padded with literal leading/trailing double-spaces
("  TITLE  ") rather than a heading style; procedure steps are "STEP N: TITLE" lines; a fourth
callout kind (KNOWLEDGE CHECK, a ☐ tick-list) doesn't exist in the Foundations documents. Only
the parts that ARE identical — the single-cell-table-is-a-callout convention, the multi-column
table renderer, and the array-splice writer — are imported and reused (Standards B6: reuse, never
copy). Everything else here is new because the shape of this document is different.

WHAT IS AND IS NOT CARRIED OVER
All 13 chapters plus the Quick Reference workflow (become sections 1-14) are carried in full:
headings, paragraphs, bullet lists, tables, and all four callout kinds. The Final Assessment,
Answer Key, and Training Completion sign-off are held back — hand-authored into `questions` in
endoscopy.js instead (Q&A content, not reading content, same T90 rationale as Foundations' held-
back blocks). Per-chapter Knowledge Check tick-lists ARE carried (rendered as a non-scored
checklist inside the reader) since, unlike Foundations, this document ships nothing else that
covers that material.

NOTHING IS SUMMARISED AND NOTHING IS INVENTED. --check compares every unique word in the document
against the generated section HTML and reports what is missing. A healthy run reports only
cover-page words and the held-back Final Assessment / Answer Key / sign-off block.
"""
import argparse, html, importlib.util, os, re, sys, zipfile
from xml.etree import ElementTree as ET

W = '{http://schemas.openxmlformats.org/wordprocessingml/2006/main}'
REPO = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
SRC_DOC = os.path.join(REPO, 'docs/curriculum/endoscopy/SIPS_Endoscopy_Module1_Reprocessing.docx')
TARGET = os.path.join(REPO, 'src/js/endoscopy.js')
MODULE_ANCHOR = "{id:'en-01'"

# ── Reuse, don't copy (Standards B6): pull the shared renderers straight out of the sibling
# Foundations converter. Filename has a hyphen, so plain `import` can't reach it.
_spec = importlib.util.spec_from_file_location(
    'foundations_from_docx', os.path.join(REPO, 'scripts', 'foundations-from-docx.py'))
_fnd = importlib.util.module_from_spec(_spec)
_spec.loader.exec_module(_fnd)
esc, render_table, flush_list, slice_arr, js = (
    _fnd.esc, _fnd.render_table, _fnd.flush_list, _fnd.slice_arr, _fnd.js)

CALLOUT = {'\U0001f6d1': 'warn', '⚠': 'warn', '\U0001f4a1': 'tip', '✓': 'key'}

HELD_BACK_START = {'FINAL ASSESSMENT'}          # padded heading that begins the held-back block
QUICK_REF_START = 'QUICK REFERENCE: COMPLETE WORKFLOW'   # padded heading -> becomes section 14
HELD_BACK_END = {'TRAINING COMPLETION'}         # padded heading that ends section 14 / the doc


def para_text(p):
    return ''.join(t.text or '' for t in p.iter(W + 't'))


def cell_paras(tc):
    out = []
    for p in tc.findall(W + 'p'):
        t = para_text(p).strip()
        if t:
            out.append(t)
    return out


def walk(path):
    """Yield ('p', text) and ('tbl', rows) in document order. Text keeps its literal '\\n'
    (CHAPTER N titles use an embedded line break, not two paragraphs)."""
    with zipfile.ZipFile(path) as z:
        root = ET.fromstring(z.read('word/document.xml'))
    for el in root.find(W + 'body'):
        tag = el.tag.split('}')[1]
        if tag == 'p':
            yield ('p', para_text(el))
        elif tag == 'tbl':
            yield ('tbl', [[cell_paras(tc) for tc in tr.findall(W + 'tc')]
                           for tr in el.findall(W + 'tr')])


def padded_heading(text):
    """'  TITLE  ' (literal leading/trailing double-space, this doc's only heading marker) ->
    'TITLE', or None if this paragraph isn't one."""
    m = re.match(r'^  (.+?)  $', text)
    return m.group(1) if m else None


def knowledge_check_html(paras):
    """The KNOWLEDGE CHECK table: first line is the intro, the rest are '☐ I understand...'
    tick statements. Not questions, not scored -- rendered as a plain confirm list."""
    items = [re.sub(r'^☐\s*', '', p) for p in paras[1:]]
    out = '<div class="fnd-note fnd-note-key"><div class="fnd-note-t">KNOWLEDGE CHECK</div>'
    out += '<p>Before proceeding, confirm you understand:</p>'
    for it in items:
        out += '<div class="fnd-note-li">%s</div>' % esc(it)
    return out + '</div>'


def convert(path):
    """-> [(title, html), ...] for the 13 chapters + Quick Reference (section 14)."""
    sections = []
    cur_title, buf, parts = None, [], []
    mode = 'skip'   # skip -> chapter -> holdback -> quickref -> skip

    def close():
        nonlocal buf, parts, cur_title
        if cur_title is None:
            return
        parts.append(flush_list(buf))
        buf.clear()
        sections.append((cur_title, ''.join(x for x in parts if x)))
        parts.clear()
        cur_title = None

    for kind, item in walk(path):
        if kind == 'p':
            text = item
            if not text.strip():
                continue
            m = re.match(r'^CHAPTER (\d+)\n(.*)$', text)
            if m:
                close()
                cur_title = '%s. %s' % (m.group(1), m.group(2).strip().title())
                mode = 'chapter'
                continue
            head = padded_heading(text)
            if head is not None:
                if head in HELD_BACK_START:
                    close(); mode = 'holdback'; continue
                if head == QUICK_REF_START:
                    close()
                    cur_title = '14. Quick Reference: Complete Workflow'
                    mode = 'quickref'
                    continue
                if head in HELD_BACK_END:
                    close(); mode = 'skip'; continue
            if mode not in ('chapter', 'quickref'):
                continue
            if head is not None:
                parts.append(flush_list(buf)); buf.clear()
                parts.append('<div class="fnd-h">%s</div>' % esc(head))
                continue
            m = re.match(r'^(STEP \d+:\s*.+)$', text)
            if m:
                parts.append(flush_list(buf)); buf.clear()
                parts.append('<div class="fnd-h3">%s</div>' % esc(m.group(1)))
                continue
            if text.startswith('\U0001f4cb'):   # 📋 FACILITY-SPECIFIC — bare paragraph, not a table
                parts.append(flush_list(buf)); buf.clear()
                body = re.sub(r'^\U0001f4cb\s*\[FACILITY-SPECIFIC\]\s*', '', text).strip()
                parts.append('<div class="fnd-note fnd-note-key"><div class="fnd-note-t">'
                              'FACILITY-SPECIFIC</div><p>%s</p></div>' % esc(body))
                continue
            if text.startswith('•'):       # '• ' bullet
                buf.append(re.sub(r'^•\s*', '', text))
                continue
            # Sub-heading heuristic: short, no bullet, doesn't end a sentence (no trailing
            # . ! ? :) -- e.g. "Control Handle (Control Body)", "Insertion Tube", "Manual HLD".
            if len(text.split()) <= 6 and not re.search(r'[.!?:]$', text):
                parts.append(flush_list(buf)); buf.clear()
                parts.append('<div class="fnd-h3">%s</div>' % esc(text))
                continue
            parts.append(flush_list(buf)); buf.clear()
            parts.append('<p>%s</p>' % esc(text))
        else:
            if mode not in ('chapter', 'quickref'):
                continue
            rows = item
            flat = [p for r in rows for c in r for p in c]
            if flat and flat[0].startswith('KNOWLEDGE CHECK'):
                parts.append(flush_list(buf)); buf.clear()
                parts.append(knowledge_check_html(flat))
                continue
            head = flat[0] if flat else ''
            if len(rows[0]) == 1 and any(head.replace('️', '').startswith(g) for g in CALLOUT):
                parts.append(flush_list(buf)); buf.clear()
                norm_rows = [[[p.replace('️', '') for p in c] for c in r] for r in rows]
                parts.append(_render_glyph_callout(norm_rows))
                continue
            parts.append(flush_list(buf)); buf.clear()
            parts.append(render_table(rows))
    close()
    return sections


def _render_glyph_callout(rows):
    """Same shape as foundations' render_table single-cell branch, but keyed off this
    document's glyph set (\U0001f6d1 STOP / ⚠ WARNING / \U0001f4a1 KEY CONCEPT /
    ✓ CHECKPOINT) instead of Foundations'."""
    paras = [p for r in rows for c in r for p in c]
    head, body = paras[0], paras[1:]
    kind = 'key'
    for glyph, k in CALLOUT.items():
        if head.startswith(glyph):
            kind = k
            break
    head = re.sub(r'^[^\w]+\s*', '', head).strip()
    out = '<div class="fnd-note fnd-note-%s">' % kind
    if head:
        out += '<div class="fnd-note-t">%s</div>' % esc(head)
    for b in body:
        out += '<p>%s</p>' % esc(b)
    return out + '</div>'


def check(sections, path):
    words = lambda t: set(re.findall(r"[A-Za-z][A-Za-z'’\-]{2,}", t))
    with zipfile.ZipFile(path) as z:
        doc = words(re.sub(r'<[^>]+>', ' ', z.read('word/document.xml').decode('utf-8', 'replace')))
    generated = words(' '.join(html.unescape(re.sub(r'<[^>]+>', ' ', h)) for _, h in sections))
    lost = sorted(doc - generated)
    print(f'{len(sections)} sections, {sum(len(h) for _, h in sections):,} chars written')
    print(f'lost: {len(lost)} words. Healthy = cover-page words plus the held-back Final')
    print('Assessment / Answer Key / sign-off block. A curriculum word here is a converter bug.')
    print(lost[:60])


def write(sections):
    src = open(TARGET, encoding='utf-8').read()
    anchor = src.index(MODULE_ANCHOR)
    titles = [t for t, _ in sections]
    bodies = [h for _, h in sections]

    i = src.index('sectionContent:[', anchor)
    _, end = slice_arr(src, i + len('sectionContent:'))
    src = (src[:i + len('sectionContent:')]
           + '[\n    ' + ',\n    '.join(js(b) for b in bodies) + '\n  ]'
           + src[end + 1:])

    i = src.index('sections:[', anchor)
    _, end = slice_arr(src, i + len('sections:'))
    src = src[:i + len('sections:')] + '[' + ','.join(js(t) for t in titles) + ']' + src[end + 1:]

    open(TARGET, 'w', encoding='utf-8').write(src)
    print(f'wrote {TARGET}, {len(sections)} sections, {sum(len(h) for h in bodies):,} chars')
    print('now bump the ?v= on endoscopy.js in index.html')


if __name__ == '__main__':
    ap = argparse.ArgumentParser()
    ap.add_argument('--check', action='store_true', help='report only, write nothing')
    args = ap.parse_args()
    if not os.path.exists(SRC_DOC):
        sys.exit('missing source doc: %s' % SRC_DOC)
    secs = convert(SRC_DOC)
    if len(secs) != 14:
        sys.exit('expected 14 sections (13 chapters + Quick Reference), got %d' % len(secs))
    check(secs, SRC_DOC) if args.check else write(secs)
