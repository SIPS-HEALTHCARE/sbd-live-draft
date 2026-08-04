# Curriculum source documents

The client's own training documents, kept here so that nobody has to ask for them again.

They were requested three separate times before they were found, and on the last occasion the
Foundations set had been sitting in an email under a subject nobody had searched. Two of the
three tasks that needed them, T81 and T88, were logged as *blocked on the source documents*
while a copy already existed. This directory exists so that stops happening.

**These are the client's material. Do not edit them.** Corrections go back to the client, and a
corrected document replaces the file here.

---

## `foundations/`, 10 files, technician training

`SIPS_Technician_Training_Module1_Foundations.docx` through
`SIPS_Technician_Training_Module10_Professional.docx`. Received 2026-08-04, forwarded from the
client's *Foundations Training* email. Module 2 arrived twice; the copies were byte-identical
and only one is kept.

These are the source of the reading content in `src/js/foundations.js`. **That content is
generated, not hand-written.** When the client sends a corrected document, replace the file and
re-run the converter rather than editing the JavaScript:

```
python3 scripts/foundations-from-docx.py --check   # report only, writes nothing
python3 scripts/foundations-from-docx.py           # rewrite src/js/foundations.js
```

Then bump the `?v=` on `foundations.js` in `index.html`, as with any `src/js` change.

`--check` compares every unique word in each document against the generated HTML and prints two
numbers. **lost outright** should stay near 125 and should only ever be cover-page and
module-title words; a real curriculum word appearing there is a converter bug. **held back on
purpose** is Knowledge Check, Skills Validation and Module Summary, which are module-level
blocks tracked as T90.

The mapping is one construct per construct, so the on-screen result carries the document's
structure rather than a summary of it:

| in the document | on screen |
|---|---|
| `Heading1` numbered `N.N` | a section |
| `Heading2`, `Heading3` | `.fnd-h`, `.fnd-h3` |
| list paragraph | `.fnd-ul` |
| multi-column table | `.fnd-table` inside a `.fnd-tw` scroller |
| single-cell table | `.fnd-note`, coloured by its leading glyph |

The glyph is the only signal of what a callout box means, so it decides the colour and is then
dropped from the text: a warning triangle is red, a lightbulb, pin or target is green, and a
heart, book or tick is blue.

## `preceptor/`, 21 files, preceptor certification

*Build spec + full curriculum: SBD Preceptor Certification*. Received 2026-07-28. Fifteen learner
workbooks across L1 to L3, five sets of certification gate materials split into candidate and
assessor copies, a facilitator programme and a developer synopsis. 334,892 characters and 322
tables.

These are the source for T81, the same formatting complaint in the preceptor module. **No
converter exists for this set yet**, because its shape is different: it is mostly tables, and
the workbooks are structured as exercises rather than as reading sections. Whoever picks T81 up
should expect to write a second converter alongside `foundations-from-docx.py` rather than to
reuse it unchanged.
