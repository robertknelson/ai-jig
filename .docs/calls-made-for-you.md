# Calls made for you

Newest first. Each entry: the question, the options, the call made, and why. Change any of them freely.

### 2026-10-30 — Download report
- **The saved file is the rendered report, not a re-render from the JSON.** It is built from the report
  view, with this page's styles inlined and no scripts. What you saw is exactly what you keep, and it
  opens anywhere offline.
- **The "show source" folds go into the file**, so the cited lines travel with it. This puts the source
  in the saved file; acceptable because the work AI is org-private and the user chooses where to save.
- **App controls are stripped** (Download, Copy questions, New reading), since they need the app. The
  sidebar links still work.
- **The theme is fixed at save time** (light or dark, as on screen). The name is
  `c-rexx-<PROGRAM>-<date>.html`.

### 2026-10-30 — "How this was built" panel
- **Where it lives:** a quiet footer link opens an in-page panel, with no extra file and nothing near the
  working controls.
- **What it shows:** seven how-to steps for building a jig with an AI agent, then every prompt verbatim
  (typos kept, because they show that terse is fine), each with a one-line note on what came back. The
  notes are there because a prompt alone doesn't teach much; the prompt and its result together do.
- **Kept in C-REXX for now**, not in a shared shell. When the next jig gets a build log, the panel code
  moves to wherever the shared shell ends up.
- **Updating it:** add an entry to `BUILD_PROMPTS` in `jigs/c-rexx.html` whenever the page is changed
  through a new prompt.

### 2026-10-30 — C-REXX page build (`jigs/c-rexx.html`)
- **One self-contained file with inline script, not `.mjs` modules.** At work the page is opened
  straight from disk, and the global "no build, `.mjs`" rule can't cover that. This is the same form as
  assay. No shared shell has been pulled out yet; that waits for a second jig (no premature abstraction).
- **Potemkin `dom-helpers-safe-render` is inlined**, not imported: `html`, `raw`, `mount`, and
  `delegate` are copied verbatim, minus `refs`/`toString`, which are unused. This deviates from assay,
  which uses a hand-called `esc()`.
- **Default lens is "Inheriting this program"** when nothing is saved: reading unfamiliar code is the
  common case.
- **Paste mode numbers the lines** (`   12| …`) and tells the model the prefix isn't source, so line
  citations are exact. Upload mode can't do this, which is why citations also carry quotes.
- **Enum lists are read from the schema skeletons at run time**, so the off-schema check can't drift
  from `schema.md`.
- **The sample is a deliberately broken 66-line COBOL program** (a THRU range combined with a stray period
  writes every fee twice). Its source ships in the page, so the sample demonstrates the citation checks.
  A test holds every sample quote to its cited line.
- **Port 4790** is declared in the dispatch, for serving the page during browser tests only. The page
  itself needs no server.

### 2026-10-30 — C-REXX module list and schema
- **Stable JSON keys, separate from display codes:** each module has a code (B3) for display and a key
  (`thru_hazards`) for the JSON. Codes can be renumbered without breaking the schema.
- **Citations carry a verbatim `quote`:** the AI's line counts in uploaded files are unreliable, and
  COBOL sequence numbers (columns 1–6) get mistaken for line numbers. The page finds each citation by
  searching for the quote, and tags it quote found, quote found elsewhere, or quote not found. "Verified" was dropped because finding the quote does not prove the conclusion.
- **The perform tree is a flat edge list, not nested JSON:** shorter for the model to write, and the page
  draws the tree from it.
- **REXX F8 (NUMERIC DIGITS) folded into C3 `arithmetic`:** no duplicate check. Ticking `rexx_traps`
  offers to tick `arithmetic` too.
- **H3 header tiles are computed from other modules, not a module of their own:** a tile whose module
  wasn't run shows "not run".
- **Gauge weights S=1, M=3, L=6, and the band thresholds, are guesses:** to be calibrated on a
  several-thousand-line program (heuristics.md open item 1).
- **Folder renamed** `.docs/jigs/mainframe-code/` → `.docs/jigs/c-rexx/` to match the name.

### 2026-10-30 — mainframe-code heuristics
- **Where jig docs live:** `.docs/jigs/<jig>/` (first: `.docs/jigs/c-rexx/`), one folder per jig, so the heuristics, schema, and
  prompt files for each jig stay together. Alternative: one flat `.docs/` folder.
- **One jig for COBOL and REXX, not two:** the report shell and about 80% of the heuristics are shared.
  REXX traps get their own lens (section F). Recorded as open item 4 in case you want them split.
- **Fixed enums for every heuristic:** assay's tone maps and chips depend on them, and they stop the
  model from inventing categories.
