# Mainframe code jig — proposed heuristics

Status: **proposal** (2026-10-30). Jig name: **C-REXX**.

The jig follows the assay pattern: paste a COBOL program or REXX exec (plus any copybooks and JCL you
have) → copy the prompt → run it in chat → paste the JSON back → the page renders a report. This doc is
the analyst's playbook. Each heuristic below becomes one prompt section and one schema block.

Each heuristic gives:
- **Look for:** the signals in the source.
- **Labels:** the enum the model must choose from. Fixed enums let the report colour and sort findings
  and stop the model from inventing categories.
- **Why:** what it gives the reader.

Heuristics marked ★ are the high-value ones that don't usually come to mind first.

---

## 0. Ground rules for the analyst (prompt preamble)

These apply to every heuristic. They matter more here than for resumes, because a confident wrong
reading of production code is worse than no reading.

1. **Cite lines.** Every finding cites the paragraph, label, or line range it came from. A finding
   with no citation is dropped.
2. **Declare the blind spots.** List every copybook, called program, DD name, and JCL parameter that is
   referenced but not supplied, and say which conclusions depend on it. ("Record layout of `CUSTREC`
   unseen — field-type findings for customer data are inferred from names only.")
3. **Evidence grades.** Every finding is `OBSERVED` (directly in the code), `INFERRED` (follows from the
   code plus normal mainframe practice), or `SPECULATIVE` (plausible, needs confirmation). The report
   shows these grades and never mixes them.
4. **Chesterton's fence.** Odd code is assumed to be load-bearing until shown otherwise. The analyst
   flags it and asks about it. It never recommends deleting it outright.
5. **Dialect first.** Identify the language and its era before judging style. A 1987 OS/VS COBOL
   program is not marked down for lacking `END-IF`.
6. **Report coverage.** Before any finding, state what you actually read: each file's name and role,
   its total line count, and the first and last paragraph or label you saw. If any part of a file was
   not available to you, say which part. Never extend conclusions past what you read.

---

## A. Orientation — what is this thing?

### A1. Purpose reconstruction
Give the program's business purpose in one plain sentence, then a paragraph, built only from what the
code shows: names, I/O, computations, messages, comments.
- **Look for:** PROGRAM-ID, header comments, DD and table names, report headings, DISPLAY and SAY text,
  what gets written versus only read.
- **Labels:** confidence `HIGH | MEDIUM | LOW`.
- **Why:** this is the first thing anyone asks. Grading the confidence keeps a guess from being read as
  fact.

### A2. Execution context
How is this run?
- **Look for:**
  - COBOL batch: `STOP RUN`, SELECT/ASSIGN DD names.
  - Called subprogram: `PROCEDURE DIVISION USING`, LINKAGE SECTION, `GOBACK`.
  - CICS: `EXEC CICS`, DFHCOMMAREA, `RETURN TRANSID`.
  - IMS: DL/I calls, PCBs.
  - DB2: `EXEC SQL`.
  - REXX: `ADDRESS TSO | ISPEXEC | ISREDIT | MVS | LINK | SYSCALL | DSNREXX | CONSOLE`, `ARG` or
    `PARSE ARG`, `SYSVAR`/`MVSVAR`, ISPF panel and table services.
- **Labels:** `BATCH_MAIN | CALLED_SUBPROGRAM | CICS_ONLINE | IMS | TSO_FOREGROUND | ISPF_DIALOG |
  ISPF_EDIT_MACRO | BATCH_TSO (IKJEFT01) | USS | AUTOMATION (NetView/SA) | UNKNOWN`
- **Why:** the context changes what counts as a bug. A `SAY` in batch goes to SYSTSPRT. A `PULL` in
  batch reads SYSTSIN.

### A3. The I/O contract
List every external thing the program touches, with its direction.
- **Look for:**
  - COBOL: SELECT/ASSIGN, FD and record lengths, OPEN modes (INPUT, OUTPUT, I-O, EXTEND).
  - SQL: tables and the verbs used on them.
  - CICS: FILE, TSQ/TDQ, LINK/XCTL targets.
  - REXX: `EXECIO`, `ALLOCATE`/`FREE`, `LISTDSI`, `OUTTRAP`, ISPF tables, `SUBMIT`.
- **Labels per item:** `READ | WRITE | UPDATE | APPEND | DELETE | SUBMIT | CALL`
- **Why:** this is the program's contract with the rest of the system. It also tells you which JCL and
  copybooks to supply on a second run.

### A4. Dependency map
- **Look for:**
  - Static calls (`CALL 'LITERAL'`) versus dynamic calls (`CALL WS-PGM-NAME`), where you have to find
    every value the variable can hold.
  - COPY members, with and without REPLACING.
  - REXX external function calls, other execs, and utilities invoked (IDCAMS, SORT, IEBGENER, IKJEFT01,
    DSNTEP2).
- **Labels:** `STATIC | DYNAMIC | COPYBOOK | UTILITY | EXTERNAL_EXEC`
- **Why:** dynamic calls are invisible to cross-reference tools. Naming them is a real finding on its
  own.

---

## B. Flow — how does control move?

### B1. Mainline skeleton
Give the top-level sequence as a short list, such as
`1000-INIT → 2000-PROCESS until EOF → 9000-TERM`, and the PERFORM tree two or three levels deep. For
REXX, give the main line, then its internal routines and their `CALL`/function-call sites.
- **Why:** the report renders this as an outline. It is the single most useful thing for a newcomer.

### B2. Unstructured control
- **Look for:**
  - `GO TO`, `GO TO … DEPENDING ON`.
  - `ALTER`. This is a severe flag: it changes a GO TO's target at runtime.
  - Paragraphs that fall through into the next one.
  - REXX `SIGNAL` used as goto. SIGNAL **ends every active DO and SELECT**, so a SIGNAL out of a loop
    never comes back.
  - `SIGNAL ON ERROR | FAILURE | SYNTAX | NOVALUE | HALT` handlers.
- **Labels:** `STRUCTURED | DISCIPLINED_GOTO (to EXIT paragraphs only) | TANGLED | ALTERED`

### B3. ★ PERFORM THRU range hazards
`PERFORM A THRU B` runs every paragraph that physically sits between A and B.
- **Look for:**
  - Paragraphs inserted inside a THRU range, which silently join it.
  - A `GO TO` that leaves a range.
  - Overlapping ranges.
  - A paragraph that is both inside a range and PERFORMed on its own.
- **Why:** these bugs come from where code sits in the file, not from what it says. A maintainer adds a
  paragraph "at the end" and changes behaviour three call sites away. Code review almost never catches
  it.

### B4. ★ Period and scope traps (COBOL)
- **Look for:**
  - A stray period inside an `IF` that ends the IF early, so the lines after it run unconditionally.
  - `NEXT SENTENCE` inside an `IF … END-IF`. It jumps past the next *period*, not the next END-IF, which
    is almost never what was meant.
  - Mixed period-delimited and END-delimited styles in one paragraph.
- **Labels:** `CLEAN | MIXED_STYLE | SUSPECT_SCOPE (cite line)`
- **Why:** the code looks right when you read it and runs wrong. These are among the most common real
  COBOL defects.

### B5. Termination and return-code paths
Every way the program can end:
- `STOP RUN`, `GOBACK`, `EXIT PROGRAM`.
- Forced abends (`CALL 'CEE3ABD'`, `ILBOABN0`, a divide-by-zero used on purpose).
- REXX `EXIT n` and `RETURN`.

For each path, what return code is set?
- **★ Return-code leakage.** In COBOL, every `CALL` overwrites the `RETURN-CODE` special register, so the
  last subprogram's RC can become the job step's RC by accident. In REXX, a bare `EXIT` returns 0 even
  after failures.
- **Labels:** `RC_DELIBERATE | RC_ACCIDENTAL | RC_ALWAYS_ZERO | RC_UNKNOWN`
- **Why:** the JCL's COND and IF logic, and the scheduler, act on this one number.

### B6. Dead code and dead data
- **Look for:**
  - Paragraphs never PERFORMed or reached.
  - Working-storage fields never referenced.
  - 88-levels never tested.
  - Switches that are set but never read.
  - Commented-out blocks.
- **Labels:** `DEAD (OBSERVED) | POSSIBLY_DEAD (referenced only via dynamic/THRU paths)`
- **Why:** this is cheap to find and shrinks what a reader has to hold in their head. The `POSSIBLY_`
  grade respects B3.

---

## C. Data — what does it do to values?

### C1. Field lineage of key fields ★
Pick the three to five fields that matter most (keys, amounts, dates, status codes). Trace each one
from input to output: every MOVE, COMPUTE, REDEFINES, and condition on the way.
- **Why:** "where does this number on the report come from?" is the question production support asks
  most, and the hardest to answer by reading.

### C2. Silent truncation and conversion
- **Look for:**
  - MOVEs to shorter alphanumeric fields (right truncation).
  - Numeric MOVEs or arithmetic into smaller PICs (high-order digits silently lost).
  - Signed to unsigned moves (the sign is lost).
  - DISPLAY, COMP, and COMP-3 mixed in comparisons.
  - Group-level MOVEs across layouts that don't match.
  - `REDEFINES` reading data as the wrong type.
- **Labels:** severity `HIGH | MEDIUM | LOW`
- **Why:** COBOL doesn't complain about any of these. They are where wrong answers come from without an
  abend.

### C3. Arithmetic safety
- **Look for:** missing `ON SIZE ERROR`, division without a zero guard, intermediate precision in
  COMPUTE, missing `ROUNDED` on money.
- **★ REXX `NUMERIC DIGITS` (default 9).**
  - An arithmetic result over 9 significant digits turns into exponential notation (`1.23456789E+10`).
  - **Non-strict comparison (`=`, `<`, `>`) of two numeric strings is numeric**, at that precision. Two
    different 12-digit account numbers can compare *equal* with `=`, and `'007' = '7'` is true.
  - Look for whether the exec uses strict `==` for keys, and whether it sets `NUMERIC DIGITS`.
- **Why:** the REXX trap is especially dangerous because the code looks right and works in testing with
  small numbers.

### C4. Bad-data abend exposure (S0C7 and friends)
- **Look for:** packed or zoned fields from input files used in arithmetic without an `IS NUMERIC` class
  test.
- **Labels:** `GUARDED | UNGUARDED | N/A`
- **Why:** S0C7 is the classic 3 a.m. abend. This heuristic predicts it from the source.

### C5. Uninitialised state
- **Look for:**
  - COBOL: working-storage without VALUE clauses that is read before it is written; an `INITIALIZE`
    that misses FILLER or REDEFINES; counters not reset between control groups.
  - ★ REXX: an uninitialised variable evaluates to **its own name in uppercase**, so a typo becomes a
    literal string with no error. Is `SIGNAL ON NOVALUE` set? Stems also need a default value (`x. = ''`)
    before they are used as lookups.
- **Why:** these bugs hide until a rare path runs.

### C6. Table and subscript bounds
- **Look for:**
  - OCCURS tables indexed without a bounds check (storage overlays and S0C4).
  - `OCCURS DEPENDING ON` with an unchecked count.
  - `SEARCH` versus `SEARCH ALL`. SEARCH ALL needs sorted keys and an `ASCENDING KEY` clause.
- **Labels:** `CHECKED | UNCHECKED | N/A`

### C7. ★ EBCDIC assumptions
- **Look for:**
  - Letter ranges such as `'A' THRU 'Z'`. EBCDIC letters are **not contiguous**: there are gaps after
    I and after R, so the range admits characters that aren't letters.
  - Code that relies on sort order. In EBCDIC, lowercase < uppercase < digits, which is the reverse of
    ASCII.
  - Hex literals, `HIGH-VALUES`/`LOW-VALUES` sentinels, and `X'40'` used as a space.
- **Labels:** `PORTABLE | EBCDIC_DEPENDENT (cite)`
- **Why:** this is invisible on the mainframe and becomes a defect the day the code, its data, or a
  downstream sort moves off it. It is high-value for any modernization discussion.

---

## D. Failure behaviour — what happens when the world misbehaves?

### D1. Status-check discipline
- **Look for:**
  - COBOL files: a `FILE STATUS` clause declared, and checked after **every** OPEN, READ, WRITE,
    REWRITE, and CLOSE.
  - SQL: `SQLCODE`/`SQLSTATE` checked after every `EXEC SQL`, with +100 handled separately from
    negative codes.
  - CICS: `RESP` checked, or `HANDLE CONDITION` used.
  - REXX: `RC` checked after host commands and `EXECIO`.
- **Labels:** `THOROUGH | PARTIAL | ABSENT`, plus a list of the unchecked operations.

### D2. ★ Swallowed failures
Errors that are noticed but not acted on:
- Logged with DISPLAY, then processing continues with RC 0.
- `WHEN OTHER CONTINUE`.
- A REXX `SIGNAL ON ERROR` handler that just `RETURN`s.
- An `OUTTRAP` that captures an error message nobody reads.
- **Why:** these are worse than unchecked errors, because the code *looks* defensive.

### D3. ★ Empty, missing, and duplicate input
Walk the program through four cases:
- Empty input file.
- Missing DD or dataset.
- A single record.
- Duplicate keys.

Common findings: the first READ hits AT END and the program prints a zero-filled report; an average
divides by a zero count; a header is written with no detail lines; a control break fires on the
sentinel.
- **Labels per case:** `HANDLED | ABENDS | WRONG_OUTPUT | UNKNOWN`
- **Why:** these are the cases that page someone. Thinking through them is cheap, and it's almost never
  written down.

### D4. ★ Rerun and restart safety
If the program abends halfway through, can it simply be rerun?
- **Look for:**
  - DB2 `COMMIT` frequency and its position inside the loop.
  - Checkpoint/restart logic.
  - Output to `DISP=MOD` or to a new GDG generation (+1), which duplicates or orphans data on rerun.
  - Updates that are not idempotent (`ADD 1 TO` a stored counter).
  - Externally visible side effects already done (a job submitted, a message sent, a file deleted).
- **Labels:** `RERUNNABLE | RERUN_WITH_CLEANUP (list steps) | NOT_RERUNNABLE | UNKNOWN`
- **Why:** this is the operational question that matters most after an abend, and the one the code
  answers least clearly.

---

## E. Behaviour and meaning

### E1. ★ Business rules extracted
List every decision point that encodes a business rule (EVALUATE branches, IF thresholds, special
cases) as a plain-English rule with its citation. For example: "Accounts in region 07 skip the late
fee (2300-CALC-FEE, line 412)."
- **Why:** this is often the most valuable output of the whole jig. It is documentation that doesn't
  exist anywhere else, and it is the input to any rewrite.

### E2. ★ Hotfix fossils and special cases
- **Look for:**
  - Hardcoded keys: `IF ACCT-NO = '0012345'`, a specific customer, region, or date.
  - Date-bounded logic: `IF RUN-DATE < 20190101`.
  - Code dated in comments with initials or ticket numbers.
- **Labels:** `ACTIVE_SPECIAL_CASE | EXPIRED (condition can no longer be true) | UNCLEAR`
- **Why:** these show where production went wrong before. Expired ones are dead code that looks alive.

### E3. ★ Time bombs and capacity ceilings
- **Look for:**
  - Date windowing (`IF YY < 50` adds 2000). Give the year the pivot breaks.
  - Two-digit years still in use.
  - `PIC 9(4)` sequence numbers and counters that wrap at 9999 (no SIZE ERROR means silent wrap).
  - `OCCURS 500` tables with a load loop that doesn't guard against overflow.
  - Hardcoded year-end dates.
  - Fields that are just wide enough today.
- **Labels:** `IMMINENT (≤ 2 yrs) | DISTANT | CAPACITY_RISK`, each with the condition that sets it off.
- **Why:** nobody looks for these until they go off.

### E4. Ordering and matching assumptions
- **Look for:**
  - Control-break logic that assumes sorted input but never checks the sequence.
  - Two-file match/merge (balance-line) logic: sentinel handling, unmatched records on each side, and
    the end-of-file race when both files run out together.
  - `SORT` with INPUT/OUTPUT PROCEDUREs.
- **Labels:** `VERIFIED_ORDER | ASSUMED_ORDER | N/A`

### E5. Reconciliation and auditability
- **Look for:**
  - Whether it counts records read, written, and rejected, and reports or balances those counts.
  - Control totals on money.
  - Whether rejected records go anywhere a person will see them.
- **Labels:** `RECONCILED | COUNTED_NOT_BALANCED | SILENT`
- **Why:** auditors and production support both ask "did every record make it?"

### E6. ★ Side effects beyond the obvious output
Anything that changes the world besides the main output files:
- Submitting JCL (REXX `SUBMIT`, or writing to a DD that the JCL may point at the internal reader).
- Sending messages or email, writing to MQ or TDQ, issuing console commands.
- RACF or TSO commands, deleting or renaming datasets.
- Updating DB2 tables that only look like lookups.
- **Why:** these are the effects that surprise people during testing and reruns.

### E7. ★ Name–behaviour drift
Paragraphs, routines, or fields whose names no longer match what they do: `2000-VALIDATE` also writes
the master, `WS-TOTAL` holds a count, `CHECK_DSN` deletes the dataset.
- **Why:** names are how people navigate the code. Drift is where a maintainer's model of the code
  breaks down.

### E8. ★ Comment–code contradictions
Comments that describe behaviour the code doesn't have: stale thresholds, a removed step, the old
dataset name.
- **Labels:** `CONSISTENT | STALE (cite both)`

---

## F. REXX-specific lens

Runs only when the input is REXX. It carries the traps COBOL readers don't expect.

| ID | Check | Why it bites |
|----|-------|--------------|
| F1 | `INTERPRET`, and `VALUE()` used to build variable names | Dynamic code: the logic can't be read off the page, and input can reach it (injection). |
| F2 | `PULL` / `PARSE PULL` | PULL uppercases. With an empty data stack it reads the **terminal**, or SYSTSIN in batch. A stray PULL can hang or eat the next input line. |
| F3 | Data stack hygiene (`PUSH`, `QUEUE`, `NEWSTACK`/`DELSTACK`, `QUEUED()`) | Leftover stack lines leak into the caller or into TSO as commands once the exec ends. |
| F4 | `PROCEDURE` / `EXPOSE` | Without PROCEDURE every variable is global, so routines silently clobber each other. |
| F5 | `ADDRESS` switches | Which environment each command really goes to. A command sent to the wrong one fails quietly, or hits RC -3 (command not found). |
| F6 | `OUTTRAP` on/off, `EXECIO … (FINIS` | A trap that is never turned off, or a file never closed, holds state or allocations open. |
| F7 | `TRACE` left on, `SAY` debugging | Noise in the output, and possibly sensitive values in SYSTSPRT. |
| F8 | `NUMERIC DIGITS` / strict comparison | See C3. |
| F9 | Parsing templates (`PARSE VAR x a b c .`) | A missing trailing `.` gives the last variable leading blanks and the rest of the line. A positional template breaks when the input format shifts. |

---

## G. Quality, risk, and change

### G1. Era and dialect fingerprint ★
Estimate the language level:
- OS/VS COBOL, COBOL II, or Enterprise COBOL, from the features used (scope terminators, inline
  PERFORM, EVALUATE, intrinsic FUNCTIONs, `EXIT PERFORM`, XML/JSON GENERATE).
- TSO/E REXX, NetView, or USS REXX.

Also look at comment-header dates.
- **Why:** it sets expectations for style findings (ground rule 5), and points to compiler-upgrade risks
  such as `NEXT SENTENCE` semantics, `TRUNC`, and `ARITH`.

### G2. Structure and cohesion
- **Look for:** paragraph or routine size, nesting depth, how consistently the paragraph naming and
  numbering scheme is used, one responsibility per paragraph, hidden global switch state
  (`WS-FLAG-1`…`WS-FLAG-9`).
- **Labels:** overall `CLEAN | SERVICEABLE | STRAINED | HAZARDOUS`, with the top three reasons.

### G3. ★ Change-risk hotspots
The three to five places where a change is most likely to break something, and why: a shared REDEFINES,
a THRU range, a copybook used by many programs, a dynamic CALL, a period-delimited block.
- **Why:** this answers "where do I need to be careful?", which a list of quality findings doesn't.

### G4. Hardcoding and environment coupling
- **Look for:** hardcoded dataset names and HLQs, LPAR or region names, userids, printer destinations,
  DB2 subsystem IDs, `SYSVAR('SYSUID')` used to change behaviour.
- **Labels:** `PARAMETERISED | PARTLY | HARDCODED`
- **Why:** these block promotion between environments and are a common cause of "works in test".

### G5. Security and sensitive data
- **Look for:**
  - Embedded passwords or userids.
  - `INTERPRET` on external input.
  - Dynamic SQL built by string concatenation (`PREPARE` / `EXECUTE IMMEDIATE`).
  - RACF commands.
  - PII-named fields (SSN, DOB, TAX-ID, ACCT, CARD) flowing into DISPLAY, SAY, SYSOUT, or work datasets.
- **Labels:** severity `HIGH | MEDIUM | LOW`

### G6. Performance smells
- **Look for:**
  - SQL inside loops where a cursor or join would do.
  - Singleton SELECTs in loops.
  - Sequential `SEARCH` on large tables.
  - Opening and closing files inside a loop.
  - DISPLAY or SAY inside the main loop, which floods SYSOUT.
  - REXX `EXECIO 1` record at a time where `EXECIO *` into a stem would do, and string building in big
    loops.
- **Labels:** `NONE_SEEN | MINOR | SIGNIFICANT`

### G7. ★ Testability recipe
The smallest set of test records that would exercise every major branch, as a table:
- **Case**, **input condition**, **expected path**, **paragraph reached**.

Include the edge cases from D3 and E3.
- **Why:** it turns the analysis into something you can act on and check. Running the recipe tests the
  report's claims too.

### G8. ★ Modernization seams
Where the program could be split apart:
- Pure computation versus I/O.
- Business rules (E1) versus plumbing.
- Candidates for a callable service.
- What would block a move: EBCDIC (C7), packed decimal, dynamic calls, side effects.
- **Labels:** `CLEAN_SEAMS | ENTANGLED | MONOLITHIC`

---

## H. The close

### H1. Questions for the owner ★
Questions only a person can answer, each tied to the finding that raised it. For example: "Is region 07
still exempt from the late fee? (E2)" or "Which JCL drives DD `OUTFILE` — MOD or NEW? (D4)"
- **Why:** this is the bridge from the report to a conversation with the person who knows. It does the
  same job as assay's "copy questions" button.

### H2. Executive narration
Five to eight sentences in plain English for someone who will never read the code: what it does, how
healthy it is, what to worry about, and what is unknown.

### H3. Verdict tiles (header strip)
- Purpose confidence (A1)
- Overall health (G2)
- Rerun safety (D4)
- Error discipline (D1)
- Time bombs (E3 count)
- Blind spots (count from ground rule 2)

---

## Report shape (sketch, for the schema step)

One JSON object, with top-level keys that mirror the sections:

```
coverage { files[ { name, role, lines_seen, first_label, last_label, gaps } ] },
language, dialect, execution_context, purpose, io_contract[], dependencies[],
flow { skeleton[], unstructured, thru_hazards[], scope_traps[], termination[] },
data { lineage[], truncation[], arithmetic[], bad_data, uninitialised[], bounds[], ebcdic[] },
failure { status_checks, swallowed[], edge_inputs[], rerun },
behaviour { rules[], fossils[], time_bombs[], ordering, reconciliation, side_effects[], drift[], stale_comments[] },
rexx { … only when REXX },
quality { era, structure, hotspots[], hardcoding, security[], performance, test_recipe[], seams },
blind_spots[], owner_questions[], executive_narration
```

Every array item carries `{ finding, citation, evidence_grade, severity? }`.

## Inputs — two delivery modes

The chat at work accepts both pasted text and uploaded files, so the jig offers two modes.

**Paste mode** (small programs). The source is folded into the copied prompt, as in assay.
- **Program source** (required). The language is detected automatically, with a manual override.
- **Copybooks** (optional, one textarea, several members pasted together).
- **JCL** (optional). If supplied, it unlocks the DD, `DISP`, `COND`, and internal-reader findings.
- **Context note** (optional, free text): "runs nightly after the billing extract".

**Upload mode** (anything large). The copied prompt carries **no source**. You upload the files to the
chat yourself, then paste the prompt.
- **File roles.** In the page, list each file you will upload and its role (`PROGRAM | COPYBOOK |
  JCL | OTHER`). The prompt names the files, so the model knows which one is the program and which are
  supporting material.
- **Local copy of the source.** Optionally, open the same files in the page with a file picker. They are
  read locally and never sent anywhere. The page uses them for three things:
  1. **Coverage check ★.** Enterprise chat tools often index uploaded files in chunks rather than reading
     them whole, so the model may analyze part of a program and sound sure about all of it. The prompt
     makes the model report what it saw (`coverage` in the schema). The page compares that with the real
     file and warns when they don't match ("model reports 1,840 lines; file has 6,212 — last paragraph it
     saw was 4100-WRITE-DETAIL").
  2. **Citation check.** Every cited line or paragraph is checked against the real source. Citations that
     don't exist are flagged. This catches invented findings.
  3. **Inline source.** The report shows the cited lines next to each finding, so you don't have to open
     the file to check a claim.
- **Context note**, as in paste mode.

Paste mode gets the same citation check and inline source for free, because the page already holds the
pasted text.

## Heuristic selection (proposed 2026-10-30)

The page shows the heuristics as a grouped checklist. You choose what goes into the prompt, and the
prompt and schema are built from only the checked items. Reasons:

- **Depth goes where you point it.** A model asked for 45 things gives each one a shallow answer. One
  asked for 8 goes deep.
- **Reply length.** This mostly settles the size question (open item 2): a programme several thousand
  lines long with a focused selection fits in one reply.
- **The list can grow.** New heuristics are added without making every run longer.

### Shape of the checklist

The canonical module list, lens sets, and gauge are in `modules.md`. The JSON contract is in
`schema.md`. Where they differ from the sketch below, those two files win.

1. **Always on (locked, shown greyed).** Ground rules, coverage (rule 6), blind spots, A1 purpose, A2
   execution context, H2 executive narration. Without these, no report can be trusted or read.
2. **Lenses (presets), one click each.** A lens ticks a set of heuristics. You can adjust the boxes
   afterwards.
   - **3 a.m. abend:** B5, C4, D1–D4, E3, E6, H1.
   - **Inheriting this program:** A3, A4, B1, C1, E1, E7, E8, G1, H1.
   - **Before I change it:** B3, B4, B6, C2, G3, G7, E4, H1.
   - **Audit / risk:** D2, D4, E2, E3, E5, G4, G5.
   - **Modernization:** C7, E1, E6, G4, G8.
   - **Everything.**
3. **Groups (A–H) as collapsible sections.** Each group has a "select all" box. Each heuristic has a
   one-line description and a ★ where it is a non-obvious one.
4. **Language filter.** Heuristics that apply to only one language (section F for REXX; B3, B4, C4, C6,
   C7 mostly for COBOL) are hidden when the detected or overridden language doesn't match them.
5. **Running count and size gauge.** "12 heuristics · reply ≈ medium." This warns you before a selection
   gets cut off.
6. **Selection is remembered** in `localStorage`. It holds no data, only your preference, the same as
   assay's theme.

### Dependencies

Some heuristics build on others:
- G7's test recipe uses the cases from D3 and E3.
- H1's questions are drawn from every finding.
- The H3 header tiles each read one heuristic.

Ticking G7 offers to tick D3 and E3 too, with a note. A tile whose heuristic was not run shows "not
run". It never shows a guessed value.

### "Not run" versus "not found"

The JSON echoes `heuristics_run: [ids]`. The report shows three different states for every block:
- **Not requested:** the block is hidden, or listed in a compact "not run" strip with a button to re-run
  it.
- **Requested, no findings:** a positive statement such as "No unchecked file operations".
- **Requested, missing from the reply:** a warning, because the model skipped it.

### Structure that follows

Each heuristic becomes one module: `{ id, group, title, blurb, star, langs, requires, promptFragment,
schemaFragment, render }`. The prompt, schema, and report are all put together from the selected
modules. This is also the beginning of the shared jig "engine" the counsel asked about. Later jigs can
reuse the same checklist-to-prompt machinery with their own modules.

## Decided

- **Desktop only.** No phone layout work for jigs (Robert, 2026-10-30).
- **Name: C-REXX** (Robert, 2026-10-30).
- **No governed or redaction variant.** The work AI is private to the organization, so proprietary
  source goes in as it is (Robert, 2026-10-30). Fixed presets give way to lenses (above).
- **One jig for COBOL and REXX**, with the language filter (Robert, 2026-10-30).
- **Sizes:** most programs are short, and a few run to several thousand lines. Upload mode and focused
  selections cover the long ones (Robert, 2026-10-30).

## Open items

1. **Reply length on the largest programs.** Run one of the several-thousand-line programs through
   Everything once, to find out where the work chat cuts off. Use that to calibrate the size gauge.
2. **JCL jig.** Later (Robert, 2026-10-30). Proc overrides, COND logic, GDG usage.
3. **Assembler, PL/I, Easytrieve.** Out of scope.
