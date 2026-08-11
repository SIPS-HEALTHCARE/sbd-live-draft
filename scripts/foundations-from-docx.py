#!/usr/bin/env python3
"""Rebuild the Foundations reading content in src/js/foundations.js from the source documents.

The ten SIPS Technician Training documents in docs/curriculum/foundations/ are the curriculum.
This script is the only thing that should ever write the `sections` and `sectionContent` arrays
in src/js/foundations.js, so that when the client sends a corrected document the app can be
brought back into line by re-running it rather than by hand-editing 219,000 characters.

    python3 scripts/foundations-from-docx.py --check    # report only, write nothing
    python3 scripts/foundations-from-docx.py            # rewrite foundations.js

After writing, bump the ?v= on foundations.js in index.html, as with any src/js change.

WHAT IS AND IS NOT CARRIED OVER
Every numbered section (1.1 … 10.7) is carried in full: headings, paragraphs, lists, tables and
callouts. Three module-level blocks at the end of each document are deliberately held back and
tracked as T90: Knowledge Check (prints its answers next to its questions, and the app already
runs a 25-question gate per module), Skills Validation (a sign-off sheet with initials and date
columns, which is a records feature) and Module Summary (reading material, and the easy yes).
They are parsed and available under the EXTRA: keys; they are simply not written out.

NOTHING IS SUMMARISED AND NOTHING IS INVENTED. --check compares every unique word in each
document against the generated HTML and reports what is missing. A healthy run reports only
cover-page and module-title words plus the held-back blocks above.
"""
import argparse, glob, html, json, os, re, sys, zipfile
from xml.etree import ElementTree as ET

W = '{http://schemas.openxmlformats.org/wordprocessingml/2006/main}'
REPO = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
DOCS = os.path.join(REPO, 'docs/curriculum/foundations')
TARGET = os.path.join(REPO, 'src/js/foundations.js')

# The curriculum author marks each callout box with a leading glyph. That glyph is the only
# signal of what kind of box it is, so it decides the colour and is then stripped from the text.
CALLOUT = {
    '⚠': 'warn',                                                   # caution
    '\U0001f4a1': 'tip', '\U0001f4cc': 'tip', '\U0001f3af': 'tip',  # bulb, pin, target
    '❤': 'key', '\U0001f4da': 'key', '✓': 'key',                    # heart, books, tick
    '\U0001f389': 'key', '\U0001f6e1': 'key',                       # party, shield
}


def esc(t):
    return html.escape(str(t), quote=False)


def cell_paras(tc):
    """Paragraph texts inside one table cell, kept separate so they do not run together."""
    out = []
    for p in tc.findall(W + 'p'):
        t = ''.join(x.text or '' for x in p.iter(W + 't')).strip()
        if t:
            out.append(t)
    return out


def para_text(p):
    return ''.join(t.text or '' for t in p.iter(W + 't')).strip()


def para_style(p):
    pr = p.find(W + 'pPr')
    if pr is None:
        return ''
    s = pr.find(W + 'pStyle')
    return s.get(W + 'val') if s is not None else ''


def walk(path):
    """Yield ('p', style, text) and ('tbl', rows, '') in document order."""
    with zipfile.ZipFile(path) as z:
        root = ET.fromstring(z.read('word/document.xml'))
    for el in root.find(W + 'body'):
        tag = el.tag.split('}')[1]
        if tag == 'p':
            yield ('p', para_style(el), para_text(el))
        elif tag == 'tbl':
            yield ('tbl', [[cell_paras(tc) for tc in tr.findall(W + 'tc')]
                           for tr in el.findall(W + 'tr')], '')


def render_table(rows):
    """A multi-column table, or a single-cell block that is really a callout."""
    ncol = max((len(r) for r in rows), default=0)

    if ncol == 1:
        paras = [p for r in rows for c in r for p in c]
        if not paras:
            return ''
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
            if re.match(r'^[•✓→\-]\s*', b):
                out += '<div class="fnd-note-li">%s</div>' % esc(re.sub(r'^[•✓→\-]\s*', '', b))
            else:
                out += '<p>%s</p>' % esc(b)
        return out + '</div>'

    # Some tables open with a single merged cell holding the table's title rather than a header
    # row. Rendering that as one <th> leaves the remaining columns visibly blank, so it is
    # spanned across the full width and the real header row, if any, is taken from the next row.
    out = '<div class="fnd-tw"><table class="fnd-table">'
    start, head = 0, ''
    if len(rows[0]) == 1 and ncol > 1:
        head += '<tr><th colspan="%d">%s</th></tr>' % (ncol, esc(' '.join(rows[0][0])))
        start = 1
    if start < len(rows):
        first = [' '.join(c) for c in rows[start]]
        if (len(rows[start]) == ncol and all(len(c) < 40 for c in first)
                and any(c.isupper() for c in first if c)):
            head += '<tr>' + ''.join('<th>%s</th>' % esc(c) for c in first) + '</tr>'
            start += 1
    if head:
        out += '<thead>' + head + '</thead>'
    out += '<tbody>'
    for r in rows[start:]:
        out += '<tr>' + ''.join('<td>%s</td>' % '<br>'.join(esc(p) for p in c) for c in r) + '</tr>'
    return out + '</tbody></table></div>'


def flush_list(buf):
    if not buf:
        return ''
    return '<ul class="fnd-ul">' + ''.join('<li>%s</li>' % esc(x) for x in buf) + '</ul>'


def convert(path):
    """-> {'1.1': {'title': str, 'html': str}, 'EXTRA:…': {...}}"""
    sections, cur = {}, None
    buf, parts = [], []

    def close():
        nonlocal buf, parts
        if cur is None:
            return
        parts.append(flush_list(buf))
        buf.clear()
        sections[cur]['html'] = ''.join(x for x in parts if x)
        parts.clear()

    for kind, a, t in walk(path):
        if kind == 'p':
            style, text = a, t
            if not text:
                continue
            if style == 'Heading1':
                m = re.match(r'^(\d+\.\d+)\s+(.*)$', text)
                close()
                cur = m.group(1) if m else 'EXTRA:' + text
                sections[cur] = {'title': (m.group(2) if m else text).strip(), 'html': ''}
                continue
            if cur is None:
                continue
            if style in ('Heading2', 'Heading3'):
                parts.append(flush_list(buf)); buf.clear()
                cls = 'fnd-h' if style == 'Heading2' else 'fnd-h3'
                parts.append('<div class="%s">%s</div>' % (cls, esc(text)))
            elif style == 'ListParagraph':
                buf.append(re.sub(r'^[•–\-]\s*', '', text))
            else:
                parts.append(flush_list(buf)); buf.clear()
                parts.append('<p>%s</p>' % esc(text))
        else:
            if cur is None:
                cur = 'EXTRA:cover'
                sections[cur] = {'title': 'cover', 'html': ''}
            parts.append(flush_list(buf)); buf.clear()
            parts.append(render_table(a))
    close()
    return sections


def slice_arr(s, i):
    """i indexes the '['; return (text, index_of_matching_close)."""
    d, q, e = 0, None, False
    for j in range(i, len(s)):
        c = s[j]
        if q:
            if e: e = False
            elif c == '\\': e = True
            elif c == q: q = None
            continue
        if c in "\"'`":
            q = c; continue
        if c == '[': d += 1
        elif c == ']':
            d -= 1
            if d == 0:
                return s[i:j + 1], j
    raise ValueError('unbalanced array literal')


def js(s):
    return "'" + s.replace('\\', '\\\\').replace("'", "\\'").replace('\n', ' ') + "'"


def load_all():
    out = {}
    for f in sorted(glob.glob(os.path.join(DOCS, '*.docx'))):
        m = re.search(r'Module(\d+)_', os.path.basename(f))
        if not m:
            continue
        out[int(m.group(1))] = (f, convert(f))
    return out


def numbered(secs):
    return sorted([k for k in secs if re.match(r'^\d+\.\d+$', k)],
                  key=lambda k: [int(x) for x in k.split('.')])


def check(data):
    """Two different numbers, and the difference between them is the whole point.

    `lost`  compares the document against everything the converter produced, including the
            held-back blocks. This is the real fidelity measure: it should be near zero, and
            what remains should be cover-page and module-title words only.
    `held`  compares the document against only what gets written into the app. The gap between
            the two is Knowledge Check, Skills Validation and Module Summary, which is T90.
    """
    words = lambda t: set(re.findall(r"[A-Za-z][A-Za-z'\u2019\-]{2,}", t))
    t_lost = t_held = 0
    for n in sorted(data):
        path, secs = data[n]
        with zipfile.ZipFile(path) as z:
            doc = words(re.sub(r'<[^>]+>', ' ',
                               z.read('word/document.xml').decode('utf-8', 'replace')))
        strip = lambda ks: words(' '.join(
            html.unescape(re.sub(r'<[^>]+>', ' ', secs[k]['html'])) for k in ks))
        lost = sorted(doc - strip(secs.keys()))
        held = sorted(doc - strip(numbered(secs)))
        t_lost += len(lost); t_held += len(held)
        print(f'module {n:>2}: {len(numbered(secs))} sections, '
              f'{sum(len(secs[k]["html"]) for k in numbered(secs)):>6} chars written, '
              f'lost {len(lost):>3} {str(lost[:4]):<44} held back {len(held) - len(lost):>3}')
    print(f'\nlost outright: {t_lost} words across ten modules. These should be cover-page and')
    print('module-title words only. A word here that reads like curriculum is a converter bug.')
    print(f'held back on purpose: {t_held - t_lost} more words, which are Knowledge Check,')
    print('Skills Validation and Module Summary. That is T90, not a defect.')


def write(data):
    src = open(TARGET, encoding='utf-8').read()
    for n in sorted(data):
        _, secs = data[n]
        anchor = src.index("{id:'fm-%02d'" % n)
        keys = numbered(secs)
        titles = ['%s %s' % (k, secs[k]['title']) for k in keys]
        bodies = [secs[k]['html'] for k in keys]

        # sectionContent first: replacing `sections` first would shift this index
        i = src.index('sectionContent:[', anchor)
        _, end = slice_arr(src, i + len('sectionContent:'))
        src = (src[:i + len('sectionContent:')]
               + '[\n    ' + ',\n    '.join(js(b) for b in bodies) + '\n  ]'
               + src[end + 1:])

        i = src.index('sections:[', anchor)
        _, end = slice_arr(src, i + len('sections:'))
        src = (src[:i + len('sections:')]
               + '[' + ','.join(js(t) for t in titles) + ']'
               + src[end + 1:])
        print(f'fm-{n:02d}: {len(keys)} sections, {sum(len(b) for b in bodies)} chars')

    open(TARGET, 'w', encoding='utf-8').write(src)
    print('\nwrote', TARGET, os.path.getsize(TARGET), 'bytes')
    print('now bump the ?v= on foundations.js in index.html')


if __name__ == '__main__':
    ap = argparse.ArgumentParser()
    ap.add_argument('--check', action='store_true', help='report only, write nothing')
    args = ap.parse_args()
    data = load_all()
    if len(data) != 10:
        sys.exit('expected 10 module documents in %s, found %d' % (DOCS, len(data)))
    check(data) if args.check else write(data)
