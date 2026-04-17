# Review findings (handoff)

Shared **handoff log** for multi-agent workflows. By default it lives at `docs/REVIEW_FINDINGS.md`; teams may use another path if the orchestrator declares it.

**Project overview and commands:** read **[`AGENTS.md`](../AGENTS.md)** at the repo root **before** any agent pass; it is the canonical structure and quality brief and should be attached or in context when sessions start.

| Role | Playbook | Writes here |
|------|-----------|-------------|
| **Review agent** | [REVIEW_AGENT.md](./REVIEW_AGENT.md) | **Review session** headers; **Finding** entries with `Status: open` |
| **Senior developer agent** | [SENIOR_DEVELOPER_AGENT.md](./SENIOR_DEVELOPER_AGENT.md) | **Resolution** blocks; **Status** → `resolved`, `partial`, or `wontfix`; optional **Developer session** notes |
| **Orchestrator agent** | [ORCHESTRATOR_AGENT.md](./ORCHESTRATOR_AGENT.md) | **Orchestrator run** summaries between rounds |

Append new content **below** this introduction; keep history—do not delete prior sessions unless a human explicitly archives the file.

---

<!-- New content starts below -->

## Orchestrator run — 2026-04-17 (intake)

- **Human goal:** Review of application structure, code quality, refactoring and improvement potential (whole app).
- **Scope:** Whole app (per `AGENTS.md` layout).
- **Severity policy:** Resolve `blocker`, `high`, `medium`; suggestions optional.
- **Quality gate:** `npm test && npm run lint` — pending at intake (human override vs `AGENTS.md`, which documents `npm test` only; lint added during this run).
- **Round:** 0 / max 5
- **Actions this round:** Restate inputs; confirm `AGENTS.md` as brief; note `README.md` for product context.
- **Open findings remaining:** None yet (intake).
- **Next step:** Phase 2 — full review pass per `REVIEW_AGENT.md`.

---

## Review session — 2026-04-17

- **Target:** `HEAD` (working tree during review)
- **Scope:** Whole repo
- **Checks:** `npm test` — **fail** initially (no tests discovered; many failures when run with alternate root); `npm run lint` — **N/A** (script missing). After fixes: `npm test` — pass; `npm run lint` — pass (warnings only).
- **Summary:** The app matches the documented Vite + vanilla ESM layout: `src/main.js` as central wiring, `services/` / `views/` / `models/` split, hash routing, external price/MLE sources. The main structural risks are **very large `main.js`**, coupling of views to global selection/tooltip state, and **test/lint drift** from production behavior. Several integration/unit tests and Vitest config were out of date; a **real runtime bug** existed in `saveSimulationResult` (out-of-scope `resultData` in `QuotaExceededError` handler). ESLint was not wired; adding it surfaced many **unused symbol** warnings (optional cleanup).

### [RV-2026-04-17-01] Vitest did not discover `tests/`

| Field | Value |
|--------|--------|
| **Severity** | blocker |
| **Area** | DX / CI |
| **Location** | `vite.config.js` (`root: 'src'` with default Vitest include) |
| **Status** | resolved |

**Finding**  
`npm test` exited with “No test files found” because the config root is `src/` while tests live in `tests/`.

**Improvement**  
Set `test.include` to `../tests/**/*.test.js` (and use `vitest run` for a non-watch default).

**Verification**  
`npm test` discovers and runs all `tests/**/*.test.js`.

**Resolution** (2026-04-17)

- **Outcome:** resolved
- **Changes:** `vite.config.js` — `test.include`; `package.json` — `"test": "vitest run"`, `"test:watch": "vitest"`.
- **Verification:** `npm test` — 12 files, 91 tests passed.

---

### [RV-2026-04-17-02] Broken integration import paths and stale assertions

| Field | Value |
|--------|--------|
| **Severity** | high |
| **Area** | tests |
| **Location** | `tests/integration/calculationService.test.js`, `tests/integration/dataService.test.js`, unit/model tests vs `scarab.js`, `simulationService.js`, etc. |
| **Status** | resolved |

**Finding**  
`tests/integration/calculationService.test.js` and `dataService.test.js` used `../../../src/...` (one `..` too many), breaking resolution. Many expectations were outdated (threshold method string, minimum scarab counts, list header copy, regex quoting, return pool needing an extra scarab, etc.).

**Improvement**  
Fix paths to `../../src/...`; align tests with current behavior or document intentional product rules.

**Verification**  
Integration and unit suites green.

**Resolution** (2026-04-17)

- **Outcome:** resolved
- **Changes:** Corrected imports; updated/rewrote tests for data loading (URL-routed `fetch` mocks + `localStorage.clear()`), profitability assertions, simulation mocks, list/regex/grid cases; `src/js/models/fossil.js` — honor explicit `rerollGroup` when key is present (including `null`).
- **Verification:** `npm test` — all passed.

---

### [RV-2026-04-17-03] `saveSimulationResult` referenced `resultData` outside scope on quota errors

| Field | Value |
|--------|--------|
| **Severity** | high |
| **Area** | correctness |
| **Location** | `src/js/components/simulationPanel.js` — `QuotaExceededError` handler |
| **Status** | resolved |

**Finding**  
`resultData` was declared inside `try` but used in `catch`, causing a `ReferenceError` if storage quota was exceeded.

**Improvement**  
Build `resultData` before `try` or re-serialize from `result` in the catch path.

**Verification**  
ESLint `no-undef` clean; manual reasoning for quota path.

**Resolution** (2026-04-17)

- **Outcome:** resolved
- **Changes:** Moved `resultData` construction before `try` so the quota handler can stringify `[resultData]`.
- **Verification:** `npm run lint`; `npm test`.

---

### [RV-2026-04-17-04] No `npm run lint`; ESLint errors in scripts/config/views

| Field | Value |
|--------|--------|
| **Severity** | medium |
| **Area** | DX |
| **Location** | `package.json`, new `eslint.config.js`, `scripts/compute-sus.js`, `vite.config.js`, switch/case in list views |
| **Status** | resolved |

**Finding**  
Human stop condition required `npm run lint`; project had no lint script. Initial ESLint reported `no-undef` / `no-case-declarations` / config globals.

**Improvement**  
Add ESLint 9 flat config, `lint` script, environment globals for browser/node/tests, fix errors (not necessarily every warning).

**Verification**  
`npm run lint` exits 0.

**Resolution** (2026-04-17)

- **Outcome:** resolved
- **Changes:** Added `eslint`, `@eslint/js`, `globals`; `eslint.config.js`; wrapped `case` blocks with lexical declarations in `listView.js`, `essenceListView.js`, `fossilListView.js`; `globalThis.fetch` in tests.
- **Verification:** `npm run lint` — 0 errors, 72 warnings (`no-unused-vars`).

---

### Minor notes (no ID required)

- **Suggestion:** Gradually trim ESLint `no-unused-vars` warnings (especially `main.js`, dead imports, unused handlers) — optional per policy.
- **Suggestion:** Long-term refactor: split `src/main.js` into route/feature modules while keeping a thin orchestrator — optional.
- **Suggestion:** Consider `npm run lint -- --max-warnings 0` in CI once warnings are addressed — optional.

---

## Developer session — 2026-04-17

- **Addressed finding IDs:** RV-2026-04-17-01, RV-2026-04-17-02, RV-2026-04-17-03, RV-2026-04-17-04
- **Deferred:** None (in-policy).
- **Final checks:** `npm test` — pass; `npm run lint` — pass (warnings only).

---

## Review session — 2026-04-17 (verification)

- **Target:** `HEAD` after developer pass
- **Scope:** Changed areas + gate
- **Checks:** `npm test` — pass; `npm run lint` — pass (warnings only)
- **Summary:** No regressions observed in automated checks. Touched code paths (simulation storage, sort switches, fossil constructor, tests, ESLint config) are consistent with intended behavior. Remaining ESLint warnings are unused symbols only — within optional policy.

---

## Orchestrator run — 2026-04-17 (close-out)

- **Human goal:** (same as intake)
- **Scope:** Whole app
- **Severity policy:** blocker / high / medium resolved; suggestions optional
- **Quality gate:** `npm test && npm run lint` — **pass** (lint: 0 errors, 72 warnings)
- **Round:** 1 / max 5
- **Actions this round:** Intake → review → fix → verification gate → handoff update
- **Open findings remaining:** None per policy (`blocker` / `high` / `medium` all resolved; optional items left as minor notes only).
- **Next step:** **Stop — criteria met** (tests + lint green; no in-policy open findings). Optional follow-up: drive down lint warnings or document `npm run lint` in `AGENTS.md` if the team wants the brief updated.

---
