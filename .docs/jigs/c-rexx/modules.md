# C-REXX — module catalog

Status: **draft** (2026-10-30). This is the source for the page's checklist, lenses, and size gauge.
`heuristics.md` explains *why* each heuristic exists. `schema.md` defines what each one returns.

Each module is `{ code, key, title, blurb, star, langs, size, requires, locked }`:
- **code** is for display and for cross-references in the docs.
- **key** is the JSON property name. Keys are stable, so the codes can be renumbered without breaking
  saved reports.
- **langs** is one of `BOTH | COBOL | REXX`. The page hides modules whose language doesn't match the
  detected or overridden one. If the language is unknown, every module is shown.
- **size** is the expected reply weight: `S` (one or two lines), `M` (a short list), `L` (a long list or
  trace). The gauge adds S=1, M=3, L=6.
- **requires** lists modules that ticking this one *offers* to tick as well. It never forces them.
- **locked** modules are always on and shown greyed out.

## Always on (locked)

These are not in the checklist. They live in the envelope (see `schema.md`) and every report has them.

| Part | Key | What it is |
|------|-----|------------|
| Coverage | `coverage` | What the model actually read: files, line counts, first and last label, gaps. Ground rule 6. |
| Blind spots | `blind_spots` | Referenced but not supplied: copybooks, called programs, DDs, JCL. Ground rule 2. |
| Executive narration | `executive_narration` | A plain-English summary in five to eight sentences (H2). |

## Modules

| Code | Key | Title | Blurb (checklist line) | ★ | Langs | Size | Requires | Locked |
|------|-----|-------|------------------------|---|-------|------|----------|--------|
| A1 | `purpose` | Purpose | What the program is for, in one sentence, with a confidence grade | | BOTH | S | | yes |
| A2 | `execution_context` | Execution context | Batch, subprogram, CICS, TSO, ISPF, edit macro… | | BOTH | S | | yes |
| A3 | `io_contract` | I/O contract | Every file, table, queue, and dataset it touches, and which way | | BOTH | M | | |
| A4 | `dependencies` | Dependencies | Static and dynamic calls, copybooks, utilities, other execs | | BOTH | M | | |
| B1 | `skeleton` | Flow skeleton | The mainline sequence and the perform/call tree | | BOTH | M | | |
| B2 | `unstructured_control` | Unstructured control | GO TO, ALTER, fall-through, SIGNAL used as goto | | BOTH | M | | |
| B3 | `thru_hazards` | PERFORM THRU hazards | Paragraphs that silently join a THRU range; jumps out of ranges | ★ | COBOL | M | | |
| B4 | `scope_traps` | Period and scope traps | A stray period or NEXT SENTENCE that changes what actually runs | ★ | COBOL | M | | |
| B5 | `termination` | Endings and return codes | Every way it ends, the RC each sets, RC leakage from CALLs | ★ | BOTH | M | | |
| B6 | `dead_code` | Dead code and data | Unreached paragraphs, unused fields, untested 88s | | BOTH | M | | |
| C1 | `field_lineage` | Key-field lineage | Trace three to five key fields from input to output | ★ | BOTH | L | `io_contract` | |
| C2 | `truncation` | Silent truncation | Moves and arithmetic that lose characters, digits, or sign | | BOTH | M | | |
| C3 | `arithmetic` | Arithmetic safety | SIZE ERROR, zero divide, rounding; REXX NUMERIC DIGITS and `=` vs `==` | ★ | BOTH | M | | |
| C4 | `bad_data` | Bad-data abends (S0C7) | Input numerics used without an IS NUMERIC test | | COBOL | S | | |
| C5 | `uninitialised` | Uninitialised state | Fields read before written; REXX variables that evaluate to their own name | ★ | BOTH | M | | |
| C6 | `bounds` | Table bounds | Unchecked subscripts, ODO counts, SEARCH ALL on unsorted keys | | COBOL | M | | |
| C7 | `ebcdic` | EBCDIC assumptions | Letter-range gaps, collating order, hex sentinels | ★ | BOTH | M | | |
| D1 | `status_checks` | Status-check discipline | FILE STATUS, SQLCODE, RESP, and RC checked after every operation | | BOTH | M | | |
| D2 | `swallowed` | Swallowed failures | Errors noticed, then ignored, so the code only looks defensive | ★ | BOTH | M | | |
| D3 | `edge_inputs` | Empty / missing / duplicate input | The four inputs that cause a 3 a.m. page, walked through | ★ | BOTH | M | `io_contract` | |
| D4 | `rerun` | Rerun safety | Can it just be resubmitted after an abend? | ★ | BOTH | M | | |
| E1 | `business_rules` | Business rules | Every rule the code enforces, in plain English with its line | ★ | BOTH | L | | |
| E2 | `fossils` | Hotfix fossils | Hardcoded special cases, including expired ones | ★ | BOTH | M | | |
| E3 | `time_bombs` | Time bombs and ceilings | Date windows, counters that wrap, tables that are nearly full | ★ | BOTH | M | | |
| E4 | `ordering` | Ordering and matching | Control breaks and match/merge that assume sorted input | | BOTH | M | | |
| E5 | `reconciliation` | Reconciliation | Counts and control totals, and where rejects go | | BOTH | S | | |
| E6 | `side_effects` | Hidden side effects | Job submits, messages, deletes, console and RACF commands | ★ | BOTH | M | | |
| E7 | `name_drift` | Name–behaviour drift | Names that no longer describe what the code does | ★ | BOTH | M | | |
| E8 | `stale_comments` | Stale comments | Comments that contradict the code | ★ | BOTH | M | | |
| F | `rexx_traps` | REXX traps | INTERPRET, PULL, data stack, PROCEDURE/EXPOSE, ADDRESS, OUTTRAP, TRACE, PARSE | ★ | REXX | M | `arithmetic` | |
| G1 | `era` | Era and dialect | Language level and dates; compiler-upgrade risks | ★ | BOTH | S | | |
| G2 | `structure` | Structure and health | Overall health grade with the top three reasons | | BOTH | S | | |
| G3 | `hotspots` | Change-risk hotspots | Where a change is most likely to break something | ★ | BOTH | M | | |
| G4 | `hardcoding` | Hardcoding | Dataset names, HLQs, regions, userids, DB2 subsystem IDs | | BOTH | M | | |
| G5 | `security` | Security and PII | Credentials, injection, dynamic SQL, PII in SYSOUT | | BOTH | M | | |
| G6 | `performance` | Performance smells | SQL in loops, linear search, output inside loops | | BOTH | M | | |
| G7 | `test_recipe` | Test recipe | The smallest set of test records that covers every branch | ★ | BOTH | L | `edge_inputs`, `time_bombs` | |
| G8 | `seams` | Modernization seams | Where it splits apart, and what blocks a move | ★ | BOTH | M | `business_rules` | |
| H1 | `owner_questions` | Questions for the owner | What only a person can answer, each tied to a finding | ★ | BOTH | S | | |

Notes:
- **F replaces F8.** The NUMERIC DIGITS check lives in C3, and `rexx_traps` offers to tick `arithmetic`
  rather than repeating it.
- **H3 tiles are not a module.** Each header tile reads one module's rating. If that module wasn't run,
  the tile shows "not run":

| Tile | Reads |
|------|-------|
| Purpose | `purpose.confidence` |
| Health | `structure.rating` |
| Rerun | `rerun.rating` |
| Error discipline | `status_checks.rating` |
| Time bombs | `time_bombs.items` count |
| Blind spots | `blind_spots` count |

## Lenses

Clicking a lens replaces the current ticks with the lens's set. The locked parts are always included.
`owner_questions` is in every lens because it is cheap and it is the hand-off to a person.

| Lens | Modules | Gauge |
|------|---------|-------|
| **3 a.m. abend** | termination, bad_data, status_checks, swallowed, edge_inputs, rerun, time_bombs, side_effects, owner_questions | 28 |
| **Inheriting this program** | io_contract, dependencies, skeleton, field_lineage, business_rules, name_drift, stale_comments, era, owner_questions | 34 |
| **Before I change it** | thru_hazards, scope_traps, dead_code, truncation, ordering, hotspots, test_recipe, owner_questions | 30 |
| **Audit / risk** | swallowed, rerun, fossils, time_bombs, reconciliation, hardcoding, security, owner_questions | 25 |
| **Modernization** | io_contract, ebcdic, business_rules, side_effects, hardcoding, seams, owner_questions | 27 |
| **Everything** | every module that matches the language | 112 (COBOL) · 105 (REXX) |

(Gauge totals include the locked parts, which add 5. Totals for COBOL-only modules assume a COBOL
program.)

## Gauge bands (initial guess — calibrate per open item 1)

| Total | Shown as | Meaning |
|-------|----------|---------|
| ≤ 30 | small | Fits in one reply even for large programs |
| 31–60 | medium | Fits for most programs |
| 61–90 | large | May be cut off on programs over about 3,000 lines |
| > 90 | very large | Likely to be cut off on large programs. The page suggests a lens or splitting across runs |
