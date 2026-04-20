# AGENTS.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

A Grafana panel plugin providing a highly customizable D3-based gauge visualization.
Built with React 18, TypeScript, and D3.js v7.
Outputs an AMD module compatible with Grafana's plugin system.

## Commands

**Package manager:** `pnpm` (v8.9.2+, Node >= 24)

```bash
pnpm dev              # Webpack watch mode (development)
pnpm build            # Production build → dist/
pnpm test             # Jest watch mode (changed files only)
pnpm test:ci          # Jest CI mode (max 4 workers)
pnpm lint             # ESLint
pnpm lint:fix         # ESLint + Prettier fix
pnpm typecheck        # tsc --noEmit
pnpm e2e              # Playwright e2e tests
pnpm server           # Start Grafana via Docker Compose
pnpm spellcheck       # cspell across all source files
```

**Run a single test file:**

```bash
pnpm exec jest --testPathPattern=needle_utils
```

**Run tests matching a name pattern:**

```bash
pnpm exec jest --testNamePattern="Min Needle"
```

## Architecture

### Plugin Entry Chain

1. **`src/module.ts`** — Plugin bootstrap. Exports the `PanelPlugin<GaugeOptions>` instance,
   registers `GaugePanel`, configures all panel options (organized into categories: Standard,
   Font, Needle, Limits, Coloring, Radial, Degrees, Readings, Tick Maps, Thresholds).

2. **`src/components/GaugePanel.tsx`** — React wrapper (`FC<PanelProps<GaugeOptions>>`).
   Extracts data series, computes display values, auto-scales radius, spreads options
   with computed overrides, then renders `<Gauge>`.

3. **`src/components/Gauge/Gauge.tsx`** — Component orchestration. Wires up custom hooks
   and memoized render calls, produces the final SVG layout.

4. **`src/migrations.ts`** — `PanelMigrationHandler()` migrates persisted panel configs
   across plugin versions. Defines typed Angular migration interfaces
   (`AngularPanel`, `AngularPanelProperties`, `AngularFieldConfig`, `AngularOptions`).

### Gauge Internals (`src/components/Gauge/`)

| File                     | Purpose                                                    |
| ------------------------ | ---------------------------------------------------------- |
| `gauge_render.tsx`       | Pure SVG render functions (circles, needle, ticks, labels, |
|                          | thresholds) and `scaleLabelFontSize`                       |
| `useNeedleAnimation.ts`  | Custom hook: D3 needle animation with ref-based tracking,  |
|                          | cross-limit clamping, and buried-needle skip logic         |
| `useTickComputations.ts` | Custom hook: tick spacing, angle, label computation, and   |
|                          | `ticksClamped` flag (MAX_TICKS = 100 with iteration guard) |
| `tick_spacing.ts`        | `computeTickSpacing` utility: nice-number tick intervals   |
|                          | using 1-2-5 series for any value range                     |
| `useGaugeDimensions.ts`  | Custom hook: SVG geometry, edge radii, tick/needle lengths |
| `needle_utils.tsx`       | Needle angle math for the "crossing limits" feature;       |
|                          | uses `maxNeedleAngle` (not `maxTickAngle`) for clamping    |
| `utils.tsx`              | D3 helpers: `drawBand`, `needleCalc`, `labelXCalc`, etc.   |
| `gauge_styles.ts`        | Emotion CSS styles for the Gauge SVG wrapper               |
| `index.ts`               | Barrel export for the `Gauge` component                    |

### Other Key Files

| File                           | Purpose                                                     |
| ------------------------------ | ----------------------------------------------------------- |
| `src/components/types.ts`      | `GaugeOptions` interface and all other TypeScript types     |
| `src/components/TickMaps/`     | Custom editor UI for tick value mappings                    |
| `src/components/editors/`      | Custom panel option editors (`RangeEditor` for min/max with |
|                                | auto tick spacing when ticks would exceed limit)            |

### Build & Config

- **Webpack** config lives in `.config/webpack/webpack.config.ts` (Grafana-scaffolded).
  Outputs AMD format. SWC transpiles to ES2015. Grafana runtime libs are externals.
- **tsconfig.json** extends `.config/tsconfig.json`, with `noUnusedLocals` disabled.
- **ESLint** extends Grafana's base rules (see Code Style for details).
- **Jest** uses SWC transformer, jsdom environment, and `jest-setup.js` which
  filters jsdom SVG tag warnings and i18next promotional banners from test output.
- CSS modules are mocked with `identity-obj-proxy` in tests.

## CI/CD

### Checking CI Status

```bash
gh pr checks <PR-number>
```

### Workflows

| Workflow                 | File                         | Trigger                       |
| ------------------------ | ---------------------------- | ----------------------------- |
| CI                       | `ci.yml`                     | Push to `main`, PRs to `main` |
| Release                  | `release.yml`                | `workflow_dispatch`           |
| Release Please           | `release-please.yml`         | `workflow_dispatch`           |
| Version Bump & Changelog | `version-bump-changelog.yml` | `workflow_dispatch`           |
| Compatibility Check      | `is-compatible.yml`          | `workflow_dispatch`           |
| Bundle Stats             | `bundle-stats.yml`           | PRs                           |
| Coverage Report          | `coverage.yml`               | PRs                           |
| PR File Changes          | `pr-files.yml`               | PRs                           |
| Create Plugin Update     | `cp-update.yml`              | `workflow_dispatch`           |

### CI Pipeline

The CI workflow (`ci.yml`) is an inline workflow (not a reusable workflow call) with three jobs:

1. **build** — pnpm install, typecheck, lint, unit tests, production build, plugin signing,
   packaging, and validation. Conditionally builds/tests Go backend if `Magefile.go` exists.
2. **resolve-versions** — uses `grafana/plugin-actions/e2e-version` to resolve the Grafana
   image matrix (skips `grafana-dev`, includes React 19 preview).
3. **playwright-tests** — runs Playwright e2e tests against each resolved Grafana version
   in a Docker Compose environment. Uploads test reports as artifacts.

### Action Pinning

Pin every third-party GitHub Action to a **full-length commit SHA**
with a trailing version comment:

```yaml
- uses: actions/checkout@de0fac2e4500dabe0009e67214ff5f5447ce83dd # v6
```

Enforced by `zizmor` in `.github/workflows/lint-actions.yml`. Tags can
be moved silently and are not safe as a pin.

To resolve a tag to a SHA:

```bash
gh api repos/<owner>/<repo>/commits/<tag> -q .sha
```

## Version Bumping & Changelog

Use the **Version bump, changelog** GitHub Actions workflow
(`.github/workflows/version-bump-changelog.yml`) to bump the version and optionally
generate a changelog. Trigger it manually via `workflow_dispatch` with:

- **version**: `patch`, `minor`, or `major`
- **generate-changelog**: `true` (default) or `false`

## Release Please

Use the **release please** GitHub Actions workflow (`.github/workflows/release-please.yml`)
to automate version bumping and changelog generation.
Trigger it manually via `workflow_dispatch` — no inputs required.

## Grafana Compatibility Check

Before releasing, verify the built plugin is compatible with a target Grafana version
using `levitate`. Requires a production build first.

```bash
pnpm build
npx @grafana/levitate@latest is-compatible \
  --target @grafana/data@<version>,@grafana/ui@<version>,@grafana/runtime@<version> \
  --path dist/module.js
```

To check against the latest Grafana version, first look up the current `@grafana/data` version on npm:

```bash
npm view @grafana/data version
```

Then substitute that version into the `--target` flag above.

## Updating Plugin Scaffolding

To update the `.config` directory (Webpack, tsconfig, Jest config, etc.)
to the latest Grafana plugin scaffolding:

```bash
npx @grafana/create-plugin@latest update
```

## Docker Development

`docker-compose.yaml` extends `.config/docker-compose-base.yaml` and adds:

- Port mapping (3000:3000)
- Healthcheck (wget against `/api/health`)
- Volume mounts for `dist/` (plugin) and `provisioning/` (dashboards, datasources)
- `GF_DEFAULT_APP_MODE=development`

The `provisioning/` folder contains pre-configured dashboards and a TestData datasource.
Run `pnpm server` to start it.

## E2E Testing (Playwright)

Uses `@grafana/plugin-e2e` with Playwright. Config is in `playwright.config.ts`.

- Auth project logs in as admin and stores session state
- Chromium project runs tests from `tests/` directory with stored auth
- Base URL defaults to `http://localhost:3000` (override with `GRAFANA_URL` env var)

```bash
pnpm e2e                          # Run all e2e tests
pnpm exec playwright test --ui    # Interactive UI mode
```

## Code Style Guidelines

### Formatting (Prettier)

- Print width: **120**
- Single quotes, no JSX single quotes
- Trailing commas: `es5`
- Semicolons: always
- 2-space indentation, no tabs
- End of line: `auto`

### Naming Conventions

| Element             | Convention                        | Example                                 |
| ------------------- | --------------------------------- | --------------------------------------- |
| Component files     | `PascalCase.tsx`                  | `GaugePanel.tsx`                        |
| Test files          | `<source>.test.tsx` or `.test.ts` | `needle_utils.test.tsx`                 |
| Utility files       | `snake_case.ts` or `camelCase.ts` | `needle_utils.tsx`                      |
| Custom hooks        | `use<Name>.ts`                    | `useNeedleAnimation.ts`                 |
| Style files         | `<scope>_styles.ts`               | `gauge_styles.ts`                       |
| Constants           | `SCREAMING_SNAKE_CASE`            | `DEFAULT_GAUGE_OPTIONS`                 |
| Interfaces          | PascalCase                        | `GaugeOptions`, `TickMapItemType`       |
| Functions/variables | camelCase                         | `computeNeedleAngle`, `getDisplayValue` |

### TypeScript

- Use **interfaces** for component props and options objects.
- Prefer explicit generics: `useState<number>(0)`.

### React Components

- **Functional components only** with arrow functions.
- Styles via `@emotion/css` + Grafana's `useStyles2(getStyles)` pattern when needed.

### Testing Patterns (Jest + Testing Library)

- Mock `d3` and `d3-ease` at file top (ESM modules require `jest.mock`).
- Mock Gauge component when testing GaugePanel to capture props.
- Use `renderHook` from `@testing-library/react` for custom hook tests.
- Use `describe`/`it` blocks.
- Clean up in `beforeEach`/`afterAll` with `jest.clearAllMocks()` / `jest.resetAllMocks()`.
- Compare theme-resolved colors relatively (not by name) since
  `useTheme2` resolves names to hex values.
- Use `Array<T>` syntax for non-simple array types (ESLint rule).

## Critical Rules

- **NEVER add a `Co-Authored-By` line to commit messages.**
  This applies to all agents, subagents, and automated commits.
  When dispatching subagents that will commit, explicitly
  instruct them: "Do NOT add a Co-Authored-By line."
- **Never modify anything inside `.config/`** —
  managed by Grafana plugin tooling.
- **Never change `id` or `type`** in `src/plugin.json`.
- Changes to `plugin.json` require a
  **Grafana server restart**.
- Use webpack from `.config/` for builds;
  do not add a custom bundler.
- Grafana API docs:
  <https://grafana.com/developers/plugin-tools/llms.txt>
- **Always run cspell** after making changes:
  `pnpm spellcheck`
  and fix any issues before committing. Add new words
  to `cspell.config.json` if they are legitimate.
- **Always run `pnpm typecheck`** when `src/` files
  are changed and fix any type errors before committing.
- **NEVER comment on GitHub issues or PRs** unless the
  user explicitly asks. Draft the response and show it
  to the user first. Only post when told to do so.
- **NEVER commit unless the user explicitly asks.**
  Do not commit as part of completing a task.
- **NEVER push unless the user explicitly asks.**
  Do not push as part of completing a task.
  Never chain `git commit && git push` in one command.
  Always wait for the user to explicitly ask to push.
- **After pushing, always update the PR summary** if a
  PR exists for the current branch. Use `gh pr edit`
  to update the title and body with well-formatted text
  that reflects all changes across the entire branch.
- **Prefer subagents** for research, code exploration,
  and multi-step work. Launch multiple agents in parallel
  when tasks are independent.

## Changelog Policy

**Always update `CHANGELOG.md` when making changes.** Every commit that
modifies code, documentation, dependencies, or configuration must have a
corresponding entry in the changelog under the current unreleased version
section. Add entries as part of the same commit or as a follow-up commit
before pushing.

## Markdown Policy

**Always run markdownlint-cli2** on markdown files before committing:

```bash
npx markdownlint-cli2 AGENTS.md README.md CHANGELOG.md
```

Fix any issues before committing. Configuration is in `.markdownlint.yaml`
(120-character line length).

## Branching Policy

- **Never commit directly to `main`**. Always create a new branch for changes.
- Use descriptive branch names (e.g., `feat/add-feature`, `fix/bug-description`).
- When checking out a branch or `main`, always `git fetch` and `git pull`
  to ensure you have the latest changes.
- **Always create pull requests as drafts**
  (`gh pr create --draft`).
- **Never add a "Generated with Claude Code" line** to PR
  summaries. Always organize the PR summary with categorized
  change information (e.g., Dependencies, New Features, Cleanup).

---

<!-- markdownlint-disable MD013 MD024 -->

## Coding Agents

(Sourced from <https://github.com/TheRealSeanDonahoe/agents-md>)

Drop-in operating instructions for coding agents. Read this file before every task.

**Working code only. Finish the job. Plausibility is not correctness.**

This file follows the [AGENTS.md](https://agents.md) open standard (Linux Foundation / Agentic AI Foundation). Claude Code, Codex, Cursor, Windsurf, Copilot, Aider, Devin, Amp read it natively. For tools that look elsewhere, symlink:

```bash
ln -s AGENTS.md CLAUDE.md
ln -s AGENTS.md GEMINI.md
```

---

## 0. Non-negotiables

These rules override everything else in this file when in conflict:

1. **No flattery, no filler.** Skip openers like "Great question", "You're absolutely right", "Excellent idea", "I'd be happy to". Start with the answer or the action.
2. **Disagree when you disagree.** If the user's premise is wrong, say so before doing the work. Agreeing with false premises to be polite is the single worst failure mode in coding agents.
3. **Never fabricate.** Not file paths, not commit hashes, not API names, not test results, not library functions. If you don't know, read the file, run the command, or say "I don't know, let me check."
4. **Stop when confused.** If the task has two plausible interpretations, ask. Do not pick silently and proceed.
5. **Touch only what you must.** Every changed line must trace directly to the user's request. No drive-by refactors, reformatting, or "while I was in there" cleanups.

---

## 1. Before writing code

**Goal: understand the problem and the codebase before producing a diff.**

- State your plan in one or two sentences before editing. For anything non-trivial, produce a numbered list of steps with a verification check for each.
- Read the files you will touch. Read the files that call the files you will touch. Claude Code: use subagents for exploration so the main context stays clean.
- Match existing patterns in the codebase. If the project uses pattern X, use pattern X, even if you'd do it differently in a greenfield repo.
- Surface assumptions out loud: "I'm assuming you want X, Y, Z. If that's wrong, say so." Do not bury assumptions inside the implementation.
- If two approaches exist, present both with tradeoffs. Do not pick one silently. Exception: trivial tasks (typo, rename, log line) where the diff fits in one sentence.

---

## 2. Writing code: simplicity first

**Goal: the minimum code that solves the stated problem. Nothing speculative.**

- No features beyond what was asked.
- No abstractions for single-use code. No configurability, flexibility, or hooks that were not requested.
- No error handling for impossible scenarios. Handle the failures that can actually happen.
- If the solution runs 200 lines and could be 50, rewrite it before showing it.
- If you find yourself adding "for future extensibility", stop. Future extensibility is a future decision.
- Bias toward deleting code over adding code. Shipping less is almost always better.

The test: would a senior engineer reading the diff call this overcomplicated? If yes, simplify.

---

## 3. Surgical changes

**Goal: clean, reviewable diffs. Change only what the request requires.**

- Do not "improve" adjacent code, comments, formatting, or imports that are not part of the task.
- Do not refactor code that works just because you are in the file.
- Do not delete pre-existing dead code unless asked. If you notice it, mention it in the summary.
- Do clean up orphans created by your own changes (unused imports, variables, functions your edit made obsolete).
- Match the project's existing style exactly: indentation, quotes, naming, file layout.

The test: every changed line traces directly to the user's request. If a line fails that test, revert it.

---

## 4. Goal-driven execution

**Goal: define success as something you can verify, then loop until verified.**

Rewrite vague asks into verifiable goals before starting:

- "Add validation" becomes "Write tests for invalid inputs (empty, malformed, oversized), then make them pass."
- "Fix the bug" becomes "Write a failing test that reproduces the reported symptom, then make it pass."
- "Refactor X" becomes "Ensure the existing test suite passes before and after, and no public API changes."
- "Make it faster" becomes "Benchmark the current hot path, identify the bottleneck with profiling, change it, show the benchmark is faster."

For every task:

1. State the success criteria before writing code.
2. Write the verification (test, script, benchmark, screenshot diff) where practical.
3. Run the verification. Read the output. Do not claim success without checking.
4. If the verification fails, fix the cause, not the test.

---

## 5. Tool use and verification

- Prefer running the code to guessing about the code. If a test suite exists, run it. If a linter exists, run it. If a type checker exists, run it.
- Never report "done" based on a plausible-looking diff alone. Plausibility is not correctness.
- When debugging, address root causes, not symptoms. Suppressing the error is not fixing the error.
- For UI changes, verify visually: screenshot before, screenshot after, describe the diff.
- Use CLI tools (gh, aws, gcloud, kubectl) when they exist. They are more context-efficient than reading docs or hitting APIs unauthenticated.
- When reading logs, errors, or stack traces, read the whole thing. Half-read traces produce wrong fixes.

---

## 6. Session hygiene

- Context is the constraint. Long sessions with accumulated failed attempts perform worse than fresh sessions with a better prompt.
- After two failed corrections on the same issue, stop. Summarize what you learned and ask the user to reset the session with a sharper prompt.
- Use subagents (Claude Code: "use subagents to investigate X") for exploration tasks that would otherwise pollute the main context with dozens of file reads.
- When committing, write descriptive commit messages (subject under 72 chars, body explains the why). No "update file" or "fix bug" commits. No "Co-Authored-By: Claude" attribution unless the project explicitly wants it.

---

## 7. Communication style

- Direct, not diplomatic. "This won't scale because X" beats "That's an interesting approach, but have you considered...".
- Concise by default. Two or three short paragraphs unless the user asks for depth. No padding, no restating the question, no ceremonial closings.
- When a question has a clear answer, give it. When it does not, say so and give your best read on the tradeoffs.
- Celebrate only what matters: shipping, solving genuinely hard problems, metrics that moved. Not feature ideas, not scope creep, not "wouldn't it be cool if".
- No excessive bullet points, no unprompted headers, no emoji. Prose is usually clearer than structure for short answers.

---

## 8. When to ask, when to proceed

**Ask before proceeding when:**

- The request has two plausible interpretations and the choice materially affects the output.
- The change touches something you've been told is load-bearing, versioned, or has a migration path.
- You need a credential, a secret, or a production resource you don't have access to.
- The user's stated goal and the literal request appear to conflict.

**Proceed without asking when:**

- The task is trivial and reversible (typo, rename a local variable, add a log line).
- The ambiguity can be resolved by reading the code or running a command.
- The user has already answered the question once in this session.

---

## 9. Self-improvement loop

**This file is living. Keep it short by keeping it honest.**

After every session where the agent did something wrong:

1. Ask: was the mistake because this file lacks a rule, or because the agent ignored a rule?
2. If lacking: add the rule under "Project Learnings" below, written as concretely as possible ("Always use X for Y" not "be careful with Y").
3. If ignored: the rule may be too long, too vague, or buried. Tighten it or move it up.
4. Every few weeks, prune. For each line, ask: "Would removing this cause the agent to make a mistake?" If no, delete. Bloated AGENTS.md files get ignored wholesale.

Boris Cherny (creator of Claude Code) keeps his team's file around 100 lines. Under 300 is a good ceiling. Over 500 and you are fighting your own config.

---

## 10. Project context

**Fill this in per project. Keep it specific. Delete sections that don't apply.**

### Stack

- Language and version:
- Framework(s):
- Package manager:
- Runtime / deployment target:

### Commands

- Install: `TODO`
- Build: `TODO`
- Test (all): `TODO`
- Test (single file): `TODO`
- Lint: `TODO`
- Typecheck: `TODO`
- Run locally: `TODO`

Prefer single-file or single-test runs during iteration. Full suites are for the final verification pass.

### Layout

- Source lives in: `TODO`
- Tests live in: `TODO`
- Do not modify: `TODO` (generated code, vendored deps, legacy areas)

### Conventions specific to this repo

- Naming: `TODO`
- Import style: `TODO`
- Error handling pattern: `TODO`
- Testing pattern and framework: `TODO`

### Forbidden

- `TODO`: things that look reasonable but will break this project.

---

## 11. Project Learnings

**Accumulated corrections. This section is for the agent to maintain, not just the human.**

When the user corrects your approach, append a one-line rule here before ending the session. Write it concretely ("Always use X for Y"), never abstractly ("be careful with Y"). If an existing line already covers the correction, tighten it instead of adding a new one. Remove lines when the underlying issue goes away (model upgrades, refactors, process changes).

- (empty)

---

## 12. How this file was built

This boilerplate synthesizes:

- Sean Donahoe's IJFW ("It Just F\*cking Works") principles: one install, working code, no ceremony.
- Andrej Karpathy's observations on LLM coding pitfalls (the four principles: think-first, simplicity, surgical changes, goal-driven execution).
- Boris Cherny's public Claude Code workflow (reactive pruning, keep it ~100 lines, only rules that fix real mistakes).
- Anthropic's official Claude Code best practices (explore-plan-code-commit, verification loops, context as the scarce resource).
- Community anti-sycophancy patterns (explicit banned phrases, direct-not-diplomatic).
- The AGENTS.md open standard (cross-tool portability via symlinks).

Read once. Edit sections 10 and 11 for your project. Prune the rest over time. This file gets better the more you use it.

<!-- markdownlint-enable MD013 MD024 -->
