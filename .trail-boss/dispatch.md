---
# ── the app reads exactly these; everything else is yours ──
summary: "C-REXX jig built and tested — awaiting first real run at work"
resume: "python -m http.server 4790, then open http://localhost:4790/jigs/c-rexx.html (or just open the file)"
health: green
links:
  - { label: "GitHub (private)", url: "https://github.com/robertknelson/ai-jig" }
  - { label: "C-REXX (local)", url: "http://localhost:4790/jigs/c-rexx.html" }
phase_suggestion: execution   # recommendation only (human ratifies the real phase):
                      #   discovery | planning | execution | monitoring | closure
# ignite:             # OPT-IN: a command you sanction Trail Boss to run to START
                      #   this project (e.g. npm run dev, .trail-boss/boot.bat).
                      #   Presence = consent; it is executed blind from this folder.
---

<!-- tier 2 — the SAME update in full: blockers, milestones, decisions, detail.
     The card shows `summary` verbatim; this body is the drill-in. Keep the
     headline terse (run `tb check`) and put the depth down here.
     Whatever this project exposes is visible on the Trail Boss board at the
     next scan; Trail Boss renders it and never interprets it.

     what the owner wants kept visible (ask them, then record it here):
     -  -->

## 2026-10-30 — C-REXX built

**C-REXX** (`jigs/c-rexx.html`) is the second jig after assay. It reads one COBOL program or REXX exec
and reports on it using 39 selectable heuristic modules, from orientation and flow through data, failure
behaviour, and business rules to risk and owner questions.

- **Delivery:** paste mode (the source goes in the prompt, with line numbers) or upload mode (you attach
  the files to the chat and open them locally in the page so it can check the reply).
- **Checks on every reply:** dropped or missing modules, off-schema values, coverage against the real
  file, and a quote search for every citation. Finding the quote proves the code exists, not that the
  conclusion is right; the report says so.
- **Tests:** `node --test tests/` — 6/6 pass. Verified in Chrome on desktop, including a reply with
  deliberate faults, all of which were caught.
- **Also in the page:** a **Download report** button that saves the rendered analysis as a standalone HTML
  file, and a discreet **How this was built** footer panel: a how-to for building jigs with an AI agent,
  plus every build prompt word for word, as a teaching aid for a mainframer colleague.
- **Spec:** `.docs/jigs/c-rexx/` (heuristics, modules, schema). Calls made without asking:
  `.docs/calls-made-for-you.md`.

**Next:** a real run at work. Sizing the gauge needs one several-thousand-line program run with
Everything ticked.
