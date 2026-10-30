# C-REXX — JSON schema

Status: **draft v1** (2026-10-30). This is the contract between the prompt and the report.

The prompt shows the schema as an **annotated skeleton**, as assay does: `"A | B"` means pick one value,
and the string values describe what goes in that field. The page builds the skeleton from the envelope
plus one fragment per selected module, in catalog order (`modules.md`).

## Conventions (stated in the prompt)

1. **Return only the JSON object.** No code fences and no prose before or after it. The page tolerates
   both anyway.
2. **Every requested module key must be present.** If nothing was found, return the empty form (`"items":
   []` and the rating that means "nothing found"). Never leave a key out. The page reads a missing key as
   "the model skipped it".
3. **Use `null` for unknown.** Never use `""`, `"N/A"`, or a guess.
4. **Enums are closed.** Use only the listed values. If none fits, use `OTHER` where it is offered and
   explain in the free text.
5. **Lines are physical lines in the file as supplied, counting from 1.** They are not COBOL sequence
   numbers (columns 1–6) or ISPF line numbers. If you can't be sure of a physical line, give the label and
   the quote, and set `lines` to `null`.
6. **Quotes are verbatim.** A `quote` is copied exactly from the source: one line or less, at most 80
   characters, with leading spaces trimmed. The page finds citations by searching for the quote, so a
   paraphrased quote fails the citation check.

## Shared types

These are defined once in the prompt and referenced by name in the fragments.

```
Citation:
{
  "file": "File name as uploaded, or PROGRAM / COPYBOOK / JCL in paste mode",
  "label": "Paragraph, section, or REXX label containing the code, or null",
  "lines": "Physical line or range, e.g. \"412\" or \"412-418\", or null",
  "quote": "Verbatim source fragment, ≤ 80 chars, one line"
}

Finding:
{
  "finding": "What is true here, in one or two plain sentences",
  "citation": Citation,
  "grade": "OBSERVED | INFERRED | SPECULATIVE"
}

Severity: "HIGH | MEDIUM | LOW"
```

Below, `Finding + { … }` means a Finding object with the extra fields added.

## Envelope (always present)

```
{
  "jig": "c-rexx",
  "schema_version": 1,
  "heuristics_run": ["Every module key you were asked to run, in the order given"],
  "language": "COBOL | REXX",
  "program_name": "PROGRAM-ID or exec name, or null",
  "coverage": {
    "complete": true,
    "files": [
      {
        "name": "File name",
        "role": "PROGRAM | COPYBOOK | JCL | OTHER",
        "lines_seen": 0,
        "first_label": "First paragraph/label you saw, or null",
        "last_label": "Last paragraph/label you saw, or null",
        "gaps": "Parts of the file not available to you, or null"
      }
    ]
  },
  "blind_spots": [
    {
      "item": "Name of the unseen thing, e.g. CUSTREC",
      "kind": "COPYBOOK | CALLED_PROGRAM | DD | JCL_PARAM | EXTERNAL_EXEC | TABLE_DDL | OTHER",
      "affects": ["Module keys whose conclusions depend on it"],
      "impact": "What you could not conclude because it was missing"
    }
  ],
  "modules": {
    "<module key>": { ... one fragment per requested module, below ... }
  },
  "executive_narration": "5–8 plain-English sentences for someone who will never read the code: what it does, how healthy it is, what to worry about, what is unknown."
}
```

`complete` is `true` only if every line of every file was available to you.

## Module fragments

### A1 `purpose` (locked)
```
{
  "one_line": "The business purpose in one sentence",
  "detail": "A short paragraph",
  "confidence": "HIGH | MEDIUM | LOW",
  "basis": [Finding]
}
```

### A2 `execution_context` (locked)
```
{
  "context": "BATCH_MAIN | CALLED_SUBPROGRAM | CICS_ONLINE | IMS | TSO_FOREGROUND | ISPF_DIALOG | ISPF_EDIT_MACRO | BATCH_TSO | USS | AUTOMATION | UNKNOWN",
  "evidence": [Finding],
  "inputs_at_invocation": "Parameters received (USING / ARG / PARM) and their meaning, or null"
}
```

### A3 `io_contract`
```
{
  "items": [
    {
      "name": "File/table/queue/dataset name as the code knows it",
      "kind": "SEQUENTIAL | VSAM | DB2_TABLE | CICS_FILE | TSQ | TDQ | MQ | ISPF_TABLE | DATASET | SYSOUT | OTHER",
      "dd_or_resource": "DD name, table, or resource id, or null",
      "direction": "READ | WRITE | UPDATE | APPEND | DELETE | SUBMIT",
      "layout": "FD / copybook / host-variable structure name, or null",
      "citation": Citation,
      "grade": "OBSERVED | INFERRED | SPECULATIVE"
    }
  ]
}
```

### A4 `dependencies`
```
{
  "items": [
    {
      "name": "Program, copybook, utility, or exec name",
      "kind": "STATIC_CALL | DYNAMIC_CALL | COPYBOOK | UTILITY | EXTERNAL_EXEC | CICS_LINK | CICS_XCTL | OTHER",
      "possible_targets": ["For DYNAMIC_CALL: every value the variable can hold, if visible"],
      "citation": Citation,
      "grade": "OBSERVED | INFERRED | SPECULATIVE"
    }
  ]
}
```

### B1 `skeleton`
```
{
  "mainline": [
    {
      "step": "What this step does, in plain words",
      "label": "Paragraph/label",
      "repeats": "once | a plain description of the loop condition",
      "citation": Citation
    }
  ],
  "edges": [
    {
      "from": "Label",
      "to": "Label",
      "kind": "PERFORM | PERFORM_THRU | CALL | GO_TO | SIGNAL | FUNCTION_CALL"
    }
  ]
}
```

`edges` is a flat list. The page draws the tree from it.

### B2 `unstructured_control`
```
{
  "rating": "STRUCTURED | DISCIPLINED_GOTO | TANGLED | ALTERED",
  "items": [
    Finding + {
      "kind": "GO_TO | GO_TO_DEPENDING | ALTER | FALL_THROUGH | SIGNAL_GOTO | SIGNAL_ON"
    }
  ]
}
```

### B3 `thru_hazards`
```
{
  "ranges": [
    {
      "from": "Label",
      "to": "Label",
      "paragraphs_inside": ["Every label physically inside the range"]
    }
  ],
  "hazards": [
    Finding + {
      "kind": "INSERTED_PARAGRAPH | GOTO_EXITS_RANGE | OVERLAPPING_RANGES | DUAL_USE_PARAGRAPH",
      "severity": Severity
    }
  ]
}
```

### B4 `scope_traps`
```
{
  "rating": "CLEAN | MIXED_STYLE | SUSPECT_SCOPE",
  "items": [
    Finding + {
      "kind": "STRAY_PERIOD | NEXT_SENTENCE_IN_END_IF | MIXED_TERMINATORS",
      "severity": Severity,
      "what_actually_runs": "The behaviour the compiler will produce, in contrast to how it reads"
    }
  ]
}
```

### B5 `termination`
```
{
  "rc_rating": "RC_DELIBERATE | RC_ACCIDENTAL | RC_ALWAYS_ZERO | RC_UNKNOWN",
  "paths": [
    {
      "how": "STOP_RUN | GOBACK | EXIT_PROGRAM | FORCED_ABEND | REXX_EXIT | REXX_RETURN | OTHER",
      "condition": "When this path is taken",
      "return_code": "Value or expression set, or null if none set",
      "citation": Citation,
      "grade": "OBSERVED | INFERRED | SPECULATIVE"
    }
  ],
  "leakage": [Finding]
}
```

`leakage` lists places where a CALL's RETURN-CODE, or a bare EXIT, sets the final RC by accident.

### B6 `dead_code`
```
{
  "items": [
    Finding + {
      "kind": "PARAGRAPH | DATA_ITEM | CONDITION_88 | SWITCH | COMMENTED_OUT",
      "status": "DEAD | POSSIBLY_DEAD"
    }
  ]
}
```

### C1 `field_lineage`
```
{
  "fields": [
    {
      "field": "Field name",
      "why_key": "Why this field matters (key, amount, date, status…)",
      "steps": [
        {
          "action": "READ | MOVE | COMPUTE | REDEFINES | CONDITION | WRITE | CALL_PARAM | SQL",
          "detail": "What happens to the value at this step",
          "citation": Citation
        }
      ],
      "ends_in": "Where the value finally lands, or null if it is consumed"
    }
  ]
}
```

Three to five fields.

### C2 `truncation`
```
{
  "items": [
    Finding + {
      "kind": "ALPHA_TRUNCATION | NUMERIC_HIGH_ORDER | SIGN_LOSS | USAGE_MISMATCH | GROUP_MOVE_MISMATCH | REDEFINES_TYPE_PUN",
      "severity": Severity,
      "from_field": "Source field, or null",
      "to_field": "Target field, or null"
    }
  ]
}
```

### C3 `arithmetic`
```
{
  "rexx_numeric_digits": "Value set, DEFAULT_9, or null for COBOL",
  "items": [
    Finding + {
      "kind": "NO_SIZE_ERROR | DIVIDE_BY_ZERO | PRECISION | NO_ROUNDED | REXX_NUMERIC_DIGITS | REXX_NONSTRICT_COMPARE",
      "severity": Severity
    }
  ]
}
```

### C4 `bad_data`
```
{
  "rating": "GUARDED | UNGUARDED | N/A",
  "items": [
    Finding + {
      "field": "Numeric field used",
      "source": "Where its value comes from"
    }
  ]
}
```

### C5 `uninitialised`
```
{
  "novalue_trapped": "true | false | null (COBOL)",
  "items": [
    Finding + {
      "kind": "WS_NO_VALUE | INITIALIZE_GAP | COUNTER_NOT_RESET | REXX_NOVALUE | STEM_NO_DEFAULT",
      "severity": Severity
    }
  ]
}
```

### C6 `bounds`
```
{
  "rating": "CHECKED | UNCHECKED | N/A",
  "items": [
    Finding + {
      "table": "Table name",
      "kind": "UNCHECKED_SUBSCRIPT | ODO_UNCHECKED | SEARCH_ALL_UNSORTED | SEARCH_LINEAR_LARGE"
    }
  ]
}
```

### C7 `ebcdic`
```
{
  "rating": "PORTABLE | EBCDIC_DEPENDENT",
  "items": [
    Finding + {
      "kind": "LETTER_RANGE | COLLATING_ORDER | HEX_LITERAL | HIGH_LOW_VALUES | OTHER",
      "breaks_when": "What change would expose it (ASCII platform, downstream sort…)"
    }
  ]
}
```

### D1 `status_checks`
```
{
  "rating": "THOROUGH | PARTIAL | ABSENT",
  "checked_count": 0,
  "unchecked": [
    Finding + {
      "operation": "OPEN | READ | WRITE | REWRITE | DELETE | CLOSE | SQL | CICS | HOST_COMMAND | EXECIO | OTHER"
    }
  ]
}
```

### D2 `swallowed`
```
{
  "items": [
    Finding + {
      "kind": "LOG_AND_CONTINUE | EMPTY_HANDLER | WHEN_OTHER_CONTINUE | TRAPPED_UNREAD | RC_RESET",
      "severity": Severity,
      "consequence": "What goes wrong downstream when this failure is ignored"
    }
  ]
}
```

### D3 `edge_inputs`
```
{
  "cases": [
    {
      "case": "EMPTY_INPUT | MISSING_DATASET | SINGLE_RECORD | DUPLICATE_KEYS",
      "input": "Which file/DD/table",
      "outcome": "HANDLED | ABENDS | WRONG_OUTPUT | UNKNOWN",
      "explanation": "What happens, step by step, briefly",
      "citation": Citation,
      "grade": "OBSERVED | INFERRED | SPECULATIVE"
    }
  ]
}
```

One case per kind for each main input.

### D4 `rerun`
```
{
  "rating": "RERUNNABLE | RERUN_WITH_CLEANUP | NOT_RERUNNABLE | UNKNOWN",
  "cleanup_steps": ["What must be undone before a rerun"],
  "factors": [
    Finding + {
      "kind": "COMMIT_POSITION | CHECKPOINT_RESTART | MOD_OUTPUT | GDG_PLUS_ONE | NON_IDEMPOTENT_UPDATE | EXTERNAL_SIDE_EFFECT"
    }
  ]
}
```

### E1 `business_rules`
```
{
  "rules": [
    {
      "rule": "The rule in plain business English",
      "condition": "When it applies, in terms of the data",
      "action": "What the code does",
      "citation": Citation,
      "grade": "OBSERVED | INFERRED | SPECULATIVE"
    }
  ]
}
```

### E2 `fossils`
```
{
  "items": [
    Finding + {
      "status": "ACTIVE_SPECIAL_CASE | EXPIRED | UNCLEAR",
      "hardcoded_value": "The literal, e.g. '0012345' or 20190101",
      "history": "Date, initials, or ticket from nearby comments, or null"
    }
  ]
}
```

### E3 `time_bombs`
```
{
  "items": [
    Finding + {
      "kind": "DATE_WINDOW | TWO_DIGIT_YEAR | COUNTER_WRAP | TABLE_CAPACITY | HARDCODED_DATE | FIELD_WIDTH",
      "urgency": "IMMINENT | DISTANT | CAPACITY_RISK",
      "trigger": "The condition that sets it off",
      "when": "Year, date, or volume at which it goes off, or null"
    }
  ]
}
```

`IMMINENT` means within two years of today.

### E4 `ordering`
```
{
  "rating": "VERIFIED_ORDER | ASSUMED_ORDER | N/A",
  "items": [
    Finding + {
      "kind": "CONTROL_BREAK | MATCH_MERGE | SORT_PROCEDURE"
    }
  ]
}
```

### E5 `reconciliation`
```
{
  "rating": "RECONCILED | COUNTED_NOT_BALANCED | SILENT",
  "counters": [
    {
      "name": "Counter field",
      "counts": "What it counts",
      "reported": true,
      "citation": Citation
    }
  ],
  "rejects_go_to": "Where rejected records end up, or null if they vanish"
}
```

### E6 `side_effects`
```
{
  "items": [
    Finding + {
      "kind": "JOB_SUBMIT | MESSAGE | MQ | TDQ | CONSOLE_COMMAND | RACF | DATASET_DELETE | DATASET_RENAME | HIDDEN_DB_UPDATE | OTHER"
    }
  ]
}
```

### E7 `name_drift`
```
{
  "items": [
    Finding + {
      "name": "The paragraph/field/routine name",
      "implies": "What the name suggests",
      "actually": "What it does"
    }
  ]
}
```

### E8 `stale_comments`
```
{
  "items": [
    Finding + {
      "comment_says": "Short paraphrase of the comment",
      "code_does": "What the code actually does",
      "comment_citation": Citation
    }
  ]
}
```

Here the Finding's `citation` points at the code, and `comment_citation` points at the comment.

### F `rexx_traps`
```
{
  "items": [
    Finding + {
      "check": "INTERPRET | PULL | DATA_STACK | PROCEDURE_EXPOSE | ADDRESS | OUTTRAP_EXECIO | TRACE_SAY | PARSE_TEMPLATE",
      "severity": Severity
    }
  ]
}
```

### G1 `era`
```
{
  "dialect": "OS_VS_COBOL | VS_COBOL_II | ENTERPRISE_COBOL | TSO_E_REXX | NETVIEW_REXX | USS_REXX | UNKNOWN",
  "earliest_date_seen": "Earliest date in comments/change log, or null",
  "latest_date_seen": "Latest date in comments/change log, or null",
  "evidence": [Finding],
  "upgrade_risks": [Finding]
}
```

### G2 `structure`
```
{
  "rating": "CLEAN | SERVICEABLE | STRAINED | HAZARDOUS",
  "reasons": [Finding],
  "metrics": {
    "paragraph_count": 0,
    "largest_label": "Label",
    "largest_lines": 0,
    "max_nesting": 0
  }
}
```

At most three reasons. Any metric may be `null`.

### G3 `hotspots`
```
{
  "items": [
    Finding + {
      "why_risky": "What makes a change here dangerous",
      "safe_change_advice": "How to change it safely"
    }
  ]
}
```

Three to five items.

### G4 `hardcoding`
```
{
  "rating": "PARAMETERISED | PARTLY | HARDCODED",
  "items": [
    Finding + {
      "kind": "DATASET | HLQ | LPAR_REGION | USERID | PRINTER | DB2_SUBSYSTEM | OTHER",
      "value": "The literal"
    }
  ]
}
```

### G5 `security`
```
{
  "items": [
    Finding + {
      "kind": "CREDENTIAL | INTERPRET_INPUT | DYNAMIC_SQL | RACF_COMMAND | PII_EXPOSURE | OTHER",
      "severity": Severity
    }
  ]
}
```

### G6 `performance`
```
{
  "rating": "NONE_SEEN | MINOR | SIGNIFICANT",
  "items": [
    Finding + {
      "kind": "SQL_IN_LOOP | SINGLETON_IN_LOOP | LINEAR_SEARCH | OPEN_CLOSE_IN_LOOP | OUTPUT_IN_LOOP | REXX_EXECIO_SINGLE | REXX_STRING_BUILD | OTHER",
      "impact": "Expected cost at production volume"
    }
  ]
}
```

### G7 `test_recipe`
```
{
  "cases": [
    {
      "case": "Short name",
      "input_condition": "The record(s)/data needed",
      "expected_path": "What should happen",
      "reaches": ["Labels exercised"],
      "from": "Module key that motivated it (edge_inputs, time_bombs…), or null"
    }
  ]
}
```

### G8 `seams`
```
{
  "rating": "CLEAN_SEAMS | ENTANGLED | MONOLITHIC",
  "seams": [
    Finding + {
      "kind": "PURE_COMPUTATION | IO_BOUNDARY | RULES_BLOCK | SERVICE_CANDIDATE"
    }
  ],
  "blockers": [
    Finding + {
      "kind": "EBCDIC | PACKED_DECIMAL | DYNAMIC_CALL | SIDE_EFFECT | GLOBAL_STATE | OTHER"
    }
  ]
}
```

### H1 `owner_questions`
```
{
  "items": [
    {
      "question": "Question only a person can answer",
      "raised_by": "Module key",
      "why_it_matters": "What the answer would change"
    }
  ]
}
```

## How the page checks a reply

Applied in this order. Each failure shows as a warning on the report; none of them stops it rendering.

1. **Parse.** Strip fences and stray prose, then `JSON.parse` (assay's `extractJson`).
2. **Shape.** Check that `jig` is `c-rexx` and that `schema_version` is one the page knows.
3. **Asked versus run.** Compare `heuristics_run` with what the page actually asked for. Report modules
   that were dropped or added.
4. **Present versus run.** Every asked-for key must exist under `modules`. A missing key shows as
   "requested, missing from the reply".
5. **Enums.** A value outside its list is shown as written, marked "off-schema", and coloured neutral.
6. **Coverage.** When the page holds the source, compare `coverage.files[].lines_seen` and `last_label`
   with the real file.
7. **Citations.** When the page holds the source, look for each `quote` in the file, first near
   `lines` and then anywhere. Each citation is tagged **quote found**, **quote found elsewhere** (at a
   different line from the one cited), or **quote not found**.

   This check proves only that the quoted code exists, which catches findings about code that isn't
   there. It cannot prove that the conclusion drawn from real code is right. The report says so in a
   fixed note, and the tags deliberately avoid the word "verified" (2026-10-30, raised by a side agent).

## Versioning

`schema_version` goes up on any breaking change: a key renamed or removed, or an enum value removed.
Adding a module or an enum value does not change it. The page stores nothing, so an old reply only needs
rendering if someone pastes one in. When that happens, the shape check (step 2) names the version
mismatch.
