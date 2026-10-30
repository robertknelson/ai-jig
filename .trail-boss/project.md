---
# ── minted by the app; do not hand-edit ──
schema: 1
id: i-want-a-project-99d4                 # immutable join key — never change this
created: 2026-10-30

# ── required ──
name: ai-jig

# ── essence: fill in as the idea forms (all optional) ──
description: "Single-file HTML jigs for work AI: copy a structured prompt, paste the JSON reply back, read a rendered report"
intent:
value_prop:
scope:

# ── state ──
phase: discovery
next_step: "Run C-REXX (jigs/c-rexx.html) at work on a real program; one several-thousand-line program with Everything ticked calibrates the size gauge"
standing:                   # underway|parked|blocked|review — where it sits across the range (docs/STANDING.md)
focus:                      # true = keep this card glowing on the board (docs/FOCUS.md)

# ── synthesis ──
themes: []
relates: []
---

## notes

### 2026-10-30 (session 1)
- Studied the inload example (assay.html, the resume assay) as the jig pattern: Prepare → copy prompt → chat → paste JSON → report.
- Jig #2, C-REXX (COBOL/REXX program reader): heuristics, module catalog, and schema specced in .docs/jigs/c-rexx/; page built at jigs/c-rexx.html.
- Features: checklist of 39 modules with lenses and a size gauge; paste mode (numbered lines) or upload mode (files opened locally for checking); reply checks (dropped modules, off-schema values, coverage, quote-based citation check); sample report on a deliberately broken COBOL program.
- Tests: node --test tests/ (schema drift, catalog, sample citations), 6/6 passing. Verified live in Chrome (desktop).
- Added a 'How this was built' footer panel: a how-to for building jigs with an AI agent, plus every build prompt verbatim — a teaching aid for a mainframer colleague.
- Added 'Download report': saves the rendered analysis report as a standalone HTML file.
- Pushed to github.com/robertknelson/ai-jig (private: inload/assay.html carries the assay prompts).
- Robert's rulings: name C-REXX; one jig for both languages; no redaction variant (work AI is org-private); JCL jig later; desktop only.

### 2026-10-30

i want a project that will be used to assist me at work. it will contain 1-n single html SPA apps that help me work with AI at work. at work, i have only the ability to paste into a chat, to upload files, and copy out text from the response. i already have an example in another project: sieve. the html page allows the user to paste in a person's resume. then click a 'copy' button that copies a long prompt along with the resume. i paste that into chat, and then recieve chat's answer. i then copy the answer (json following a strict schema) back into my html SPA and press [View Report]. and the html very nicely processes the json and presents the AI response.  this first html already exists. i want to use this project to author other similar html pages, essentially single purpose apps. this will help me get the most out of AI at work

## counsel

### 2026-10-30 — first look
- convo: conv-f23fb7d8 · movement: inception · panel: disp-4c53df8c · counsel: local (gemma4:E4B) as builder, heavy (gemma4:26B)

**@boss You are building a cockpit to control a locked-down AI sandbox.**

**The Problem:** You are stuck in a "manual" loop. You are doing the tedious work of formatting prompts and cleaning up messy text by hand.

**The Value:** You are turning a basic chat window into a structured workflow engine. It makes a restricted environment feel like you actually have access to an API (a way for software to talk to other software).

**What is missing:** A "template" or "engine." I don't see if these apps are totally solo or if they share a common foundation. If every app is a separate, disconnected file, you will be rewriting the same "copy" and "paste" logic every single time you start a new tool.

**The Hard Question:** As this library grows from one tool to twenty, how do you prevent it from becoming a disorganized pile of files that is too much work to maintain?

#### the full argument

**the boss:** *(asked for the first look)*

**the hand (builder) · gemma4:E4B:**

**This is a workflow wrapper that adds structure to AI chaos.**

This idea is excellent. You aren't building apps; you are building a highly customized "front-end workflow layer" that lives around the biggest blocker: the AI chat box.

### The Problem and Value

**The Problem:** Standard AI chat tools are generalized. They can generate information but they cannot accept complex, structured data *and* output specialized, schema-driven reports needed for your actual job. You have to manually rebuild the data you want to see after the AI talks to you.

**The Value:** You gain *data sovereignty*. You are taking the generic, raw text output from the AI and forcing it into a professional, predictable report format. This moves the AI from being a novelty answer engine to being a verifiable, actionable research assistant. This shifts the value from *getting an answer* to *structuring the answer*.

### What is Missing or Unclear

1.  **The Automation Layer:** Right now, the process still relies on manual copy/paste. This is the biggest efficiency gap. If the AI response *always* follows the schema, can you intercept the data stream? If you can't, the next phase is moving toward a backend that accepts the AI's raw JSON output via an API call, bypassing the manual copy step entirely.
2.  **Schema Discovery:** How do you define the output schemas? Is this process repeatable? You're building a template for future templates. What happens when the ideal output structure changes?
3.  **The User Onboarding:** If the goal is to help others, the current model requires deep technical knowledge (understanding JSON, web frameworks, and the specific limitations of the AI).

### Hard Question to Answer Next

You are solving a structural problem. Do you intend for this system to simply *display* the data, or do you intend for it to *act* on the data?

If you can answer this, you will know if you are building a data visualization tool (Display) or an automated process builder (Action). Focus on one function first: **Can my SPA automatically *update* a record in another system (like Notion or a database) using the AI's structured output?** If you can, you have found the "North Star" for this project.

**the hand · gemma4:26B:**

**@boss You are building a cockpit to control a locked-down AI sandbox.**

**The Problem:** You are stuck in a "manual" loop. You are doing the tedious work of formatting prompts and cleaning up messy text by hand.

**The Value:** You are turning a basic chat window into a structured workflow engine. It makes a restricted environment feel like you actually have access to an API (a way for software to talk to other software).

**What is missing:** A "template" or "engine." I don't see if these apps are totally solo or if they share a common foundation. If every app is a separate, disconnected file, you will be rewriting the same "copy" and "paste" logic every single time you start a new tool.

**The Hard Question:** As this library grows from one tool to twenty, how do you prevent it from becoming a disorganized pile of files that is too much work to maintain?
