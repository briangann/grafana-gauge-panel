# AGENTS.md

Drop-in operating instructions for coding agents. Read this file before every task.

**Working code only. Finish the job. Plausibility is not correctness.**

This file follows the [AGENTS.md](https://agents.md) open standard (Linux Foundation /
Agentic AI Foundation). Claude Code, Codex, Cursor, Windsurf, Copilot, Aider, Devin,
Amp read it natively. For tools that look elsewhere, symlink:

```bash
ln -s AGENTS.md CLAUDE.md
ln -s AGENTS.md GEMINI.md
```

---

## 0. Non-negotiables

These rules override everything else in this file when in conflict:

1. **No flattery, no filler.** Skip openers like "Great question", "You're absolutely right",
   "Excellent idea", "I'd be happy to". Start with the answer or the action.
2. **Disagree when you disagree.** If the user's premise is wrong, say so before doing the
   work. Agreeing with false premises to be polite is the single worst failure mode in
   coding agents.
3. **Never fabricate.** Not file paths, not commit hashes, not API names, not test results,
   not library functions. If you don't know, read the file, run the command, or say
   "I don't know, let me check."
4. **Stop when confused.** If the task has two plausible interpretations, ask. Do not pick
   silently and proceed.
5. **Touch only what you must.** Every changed line must trace directly to the user's
   request. No drive-by refactors, reformatting, or "while I was in there" cleanups.

---

## 1. Before writing code

**Goal: understand the problem and the codebase before producing a diff.**

- State your plan in one or two sentences before editing. For anything non-trivial, produce
  a numbered list of steps with a verification check for each.
- Read the files you will touch. Read the files that call the files you will touch. Claude
  Code: use subagents for exploration so the main context stays clean.
- Match existing patterns in the codebase. If the project uses pattern X, use pattern X,
  even if you'd do it differently in a greenfield repo.
- Surface assumptions out loud: "I'm assuming you want X, Y, Z. If that's wrong, say so."
  Do not bury assumptions inside the implementation.
- If two approaches exist, present both with tradeoffs. Do not pick one silently. Exception:
  trivial tasks (typo, rename, log line) where the diff fits in one sentence.

---

## 2. Writing code: simplicity first

**Goal: the minimum code that solves the stated problem. Nothing speculative.**

- No features beyond what was asked.
- No abstractions for single-use code. No configurability, flexibility, or hooks that were
  not requested.
- No error handling for impossible scenarios. Handle the failures that can actually happen.
- If the solution runs 200 lines and could be 50, rewrite it before showing it.
- If you find yourself adding "for future extensibility", stop. Future extensibility is a
  future decision.
- Bias toward deleting code over adding code. Shipping less is almost always better.

The test: would a senior engineer reading the diff call this overcomplicated? If yes,
simplify.

---

## 3. Surgical changes

**Goal: clean, reviewable diffs. Change only what the request requires.**

- Do not "improve" adjacent code, comments, formatting, or imports that are not part of the
  task.
- Do not refactor code that works just because you are in the file.
- Do not delete pre-existing dead code unless asked. If you notice it, mention it in the
  summary.
- Do clean up orphans created by your own changes (unused imports, variables, functions
  your edit made obsolete).
- Match the project's existing style exactly: indentation, quotes, naming, file layout.

The test: every changed line traces directly to the user's request. If a line fails that
test, revert it.

---

## 4. Goal-driven execution

**Goal: define success as something you can verify, then loop until verified.**

Rewrite vague asks into verifiable goals before starting:

- "Add validation" becomes "Write tests for invalid inputs (empty, malformed, oversized),
  then make them pass."
- "Fix the bug" becomes "Write a failing test that reproduces the reported symptom, then
  make it pass."
- "Refactor X" becomes "Ensure the existing test suite passes before and after, and no
  public API changes."
- "Make it faster" becomes "Benchmark the current hot path, identify the bottleneck with
  profiling, change it, show the benchmark is faster."

For every task:

1. State the success criteria before writing code.
2. Write the verification (test, script, benchmark, screenshot diff) where practical.
3. Run the verification. Read the output. Do not claim success without checking.
4. If the verification fails, fix the cause, not the test.

---

## 5. Tool use and verification

- Prefer running the code to guessing about the code. If a test suite exists, run it. If a
  linter exists, run it. If a type checker exists, run it.
- Never report "done" based on a plausible-looking diff alone. Plausibility is not
  correctness.
- When debugging, address root causes, not symptoms. Suppressing the error is not fixing
  the error.
- For UI changes, verify visually: screenshot before, screenshot after, describe the diff.
- Use CLI tools (gh, aws, gcloud, kubectl) when they exist. They are more context-efficient
  than reading docs or hitting APIs unauthenticated.
- When reading logs, errors, or stack traces, read the whole thing. Half-read traces
  produce wrong fixes.

---

## 6. Session hygiene

- Context is the constraint. Long sessions with accumulated failed attempts perform worse
  than fresh sessions with a better prompt.
- After two failed corrections on the same issue, stop. Summarize what you learned and ask
  the user to reset the session with a sharper prompt.
- Use subagents (Claude Code: "use subagents to investigate X") for exploration tasks that
  would otherwise pollute the main context with dozens of file reads.
- When committing, write descriptive commit messages (subject under 72 chars, body explains
  the why). No "update file" or "fix bug" commits. No "Co-Authored-By: Claude" attribution
  unless the project explicitly wants it.

---

## 7. Communication style

- Direct, not diplomatic. "This won't scale because X" beats "That's an interesting
  approach, but have you considered...".
- Concise by default. Two or three short paragraphs unless the user asks for depth. No
  padding, no restating the question, no ceremonial closings.
- When a question has a clear answer, give it. When it does not, say so and give your best
  read on the tradeoffs.
- Celebrate only what matters: shipping, solving genuinely hard problems, metrics that
  moved. Not feature ideas, not scope creep, not "wouldn't it be cool if".
- No excessive bullet points, no unprompted headers, no emoji. Prose is usually clearer
  than structure for short answers.

---

## 8. When to ask, when to proceed

**Ask before proceeding when:**

- The request has two plausible interpretations and the choice materially affects the
  output.
- The change touches something you've been told is load-bearing, versioned, or has a
  migration path.
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

1. Ask: was the mistake because this file lacks a rule, or because the agent ignored a
   rule?
2. If lacking: add the rule under "Project Learnings" below, written as concretely as
   possible ("Always use X for Y" not "be careful with Y").
3. If ignored: the rule may be too long, too vague, or buried. Tighten it or move it up.
4. Every few weeks, prune. For each line, ask: "Would removing this cause the agent to make
   a mistake?" If no, delete. Bloated AGENTS.md files get ignored wholesale.

Boris Cherny (creator of Claude Code) keeps his team's file around 100 lines. Under 300 is
a good ceiling. Over 500 and you are fighting your own config.

---

## 10. Project context

A Grafana panel plugin providing a highly customizable D3-based gauge visualization.
Outputs an AMD module compatible with Grafana's plugin system.

### Stack

- Language: TypeScript + React 18 (functional components only).
- Visualization: D3.js v7 (+ `d3-scale`, `d3-ease`).
- Styling: `@emotion/css` with Grafana's `useStyles2(getStyles)` pattern.
- Package manager: `pnpm` v8.9.2+ (pinned via `packageManager` in `package.json`).
- Runtime: Node >= 24 (`engines.node`). Do not drift `@types/node` past the major we
  support.
- Build: Webpack (from `.config/webpack/`), SWC → ES2015, AMD output. Grafana runtime libs
  (`@grafana/data`, `@grafana/ui`, `@grafana/runtime`, `react`, `@emotion/css`, `d3`) are
  externals.
- Deployment target: Grafana panel plugin (`grafanaDependency: ">=10.0.0"`).

### Commands

```bash
pnpm install           # Install deps (lockfile is authoritative)
pnpm dev               # Webpack watch mode (development)
pnpm build             # Production build → dist/
pnpm test              # Jest watch mode (changed files only)
pnpm test:ci           # Jest CI mode (max 4 workers)
pnpm lint              # ESLint
pnpm lint:fix          # ESLint + Prettier fix
pnpm typecheck         # tsc --noEmit
pnpm e2e               # Playwright e2e tests
pnpm server            # Start Grafana via Docker Compose
pnpm spellcheck        # cspell across all source files
```

**Iterate with the narrowest runner possible.** Full suites are for the final verification
pass.

```bash
pnpm exec jest --testPathPattern=needle_utils        # single test file
pnpm exec jest --testNamePattern="Min Needle"        # tests matching a name
pnpm exec playwright test --ui                       # interactive Playwright
```

#### Release and scaffolding

**Release pipeline (end-to-end):**

1. Conventional-commit merges land on `main`. When merging feature/fix work, add a
   `## vX.Y.Z (unreleased)` section at the top of `CHANGELOG.md` describing the change
   (`X.Y.Z` = the next expected version — patch for `fix:`, minor for `feat:`, major
   for `feat!:`). Content under that header is hand-authored.
2. `release-please.yml` runs on every push to `main` and opens/updates a
   **release PR** that bumps `package.json` and `.release-please-manifest.json`. It does
   **not** rewrite `CHANGELOG.md` content (`skip-changelog: true`).
3. After release-please creates or updates the release PR, a follow-up job in the same
   workflow `sed`s `## vX.Y.Z (unreleased)` → `## vX.Y.Z (YYYY-MM-DD)` on the release
   PR branch when the proposed version matches the unreleased header. The match is
   anchored to the exact proposed version, so it is safe to keep multiple
   `(unreleased)` sections in `CHANGELOG.md` at once (e.g. a forward-staged `v2.2.0`
   section above an about-to-ship `v2.1.1` section) — only the matching header is
   stamped, the others are left untouched. If no header matches (e.g. you predicted
   minor but release-please proposes patch), the job emits a `::notice::` and skips;
   edit the header manually then.
4. Merging the release PR creates the `vX.Y.Z` git tag and a GitHub release via
   release-please. The tag name format is enforced by
   `release-please-config.json` (`include-v-in-tag: true`,
   `include-component-in-tag: false`). Do **not** flip either of those — the
   `grafana/plugin-actions/build-plugin` action in the next step hard-checks
   `"v${PLUGIN_VERSION}" == "${GITHUB_TAG}"` and will fail fast if the tag is
   anything other than `v<version>`.
5. The `release.yml` workflow (trigger: `push: tags: ['v*']`) builds/signs the plugin
   with `GRAFANA_ACCESS_POLICY_TOKEN`, attaches a build-provenance attestation, and
   publishes a **signed `.zip`** plus `.zip.sha1` to a GitHub **draft** release.
6. **Manual:** publish the draft GitHub release; then sign in to grafana.com → **My
   Plugins** → **Submit Plugin** and paste the `.zip` and `.zip.sha1` URLs. Grafana
   reviews and updates the catalog. grafana.com is not updated automatically.

**Auth for release-please:** release-please-action is given a GitHub App
installation token minted by `actions/create-github-app-token` using
`secrets.RELEASE_BOT_APP_CLIENT_ID` + `secrets.RELEASE_BOT_APP_PRIVATE_KEY`.
Two reasons this matters:

1. **Branch protection on `main` requires verified signatures.** Commits
   created via the App-authenticated GitHub REST API are auto-verified;
   commits pushed via `git push` from a PAT-authenticated runner are not.
   Both the release-please bump commit and the CHANGELOG stamper commit
   therefore go through the Contents/PR API, never `git push`.
2. **`GITHUB_TOKEN`-originated events do not trigger downstream workflows.**
   App-token-originated tag pushes do, so the `v*` tag release-please creates
   actually fires `release.yml`.

If the App key expires or is revoked the symptom is `create-github-app-token`
failing loudly in the first step — no silent no-op. Rotate the key in the
GitHub App settings, update `RELEASE_BOT_APP_PRIVATE_KEY`. The App needs
`contents: read & write`, `pull-requests: read & write` permissions and must
be installed on this repository.

- **Compatibility check:** build first, then `levitate` against the target Grafana version.

  ```bash
  pnpm build
  npx @grafana/levitate@latest is-compatible \
    --target @grafana/data@<version>,@grafana/ui@<version>,@grafana/runtime@<version> \
    --path dist/module.js
  # Latest available: `npm view @grafana/data version`
  ```

- **Update plugin scaffolding:** `npx @grafana/create-plugin@latest update` (rewrites
  `.config/`).
- **Docker dev:** `pnpm server` brings up Grafana on `http://localhost:3000` with `dist/`
  and `provisioning/` mounted; health check hits `/api/health`.
- **E2E details:** uses `@grafana/plugin-e2e` with Playwright; auth project stores admin
  session, chromium project reuses it. Base URL defaults to `http://localhost:3000`
  (override with `GRAFANA_URL`).

### Layout

#### Plugin entry chain

1. **`src/module.ts`** — Plugin bootstrap. Exports the `PanelPlugin<GaugeOptions>`
   instance, registers `GaugePanel`, configures all panel options (categories: Standard,
   Font, Needle, Limits, Coloring, Radial, Degrees, Readings, Tick Maps, Thresholds).
2. **`src/components/GaugePanel.tsx`** — React wrapper (`FC<PanelProps<GaugeOptions>>`).
   Extracts data series, computes display values, auto-scales radius, spreads options with
   computed overrides, renders `<Gauge>`.
3. **`src/components/Gauge/Gauge.tsx`** — Component orchestration. Wires up custom hooks
   and memoized render calls, produces the final SVG layout.
4. **`src/migrations.ts`** — `PanelMigrationHandler()` migrates persisted panel configs
   across plugin versions. Defines typed Angular migration interfaces (`AngularPanel`,
   `AngularPanelProperties`, `AngularFieldConfig`, `AngularOptions`).

#### Gauge internals (`src/components/Gauge/`)

| File                     | Purpose                                                                            |
| ------------------------ | ---------------------------------------------------------------------------------- |
| `gauge_render.tsx`       | Pure SVG render (circles, needle, ticks, labels, thresholds); `scaleLabelFontSize` |
| `useNeedleAnimation.ts`  | D3 needle animation; ref-based tracking, cross-limit clamping, buried-needle skip  |
| `useTickComputations.ts` | Tick spacing/angle/label; `ticksClamped` (`MAX_TICKS = 100` with iteration guard)  |
| `tick_spacing.ts`        | `computeTickSpacing` — nice-number tick intervals (1-2-5 series) for any range     |
| `useGaugeDimensions.ts`  | SVG geometry, edge radii, tick/needle lengths                                      |
| `needle_utils.tsx`       | Needle math for "crossing limits"; uses `maxNeedleAngle` (not `maxTickAngle`)      |
| `utils.tsx`              | D3 helpers: `drawBand`, `needleCalc`, `labelXCalc`, etc.                           |
| `gauge_styles.ts`        | Emotion CSS styles for the Gauge SVG wrapper                                       |
| `index.ts`               | Barrel export for the `Gauge` component                                            |

#### Other key files

| File                        | Purpose                                                                       |
| --------------------------- | ----------------------------------------------------------------------------- |
| `src/components/types.ts`   | `GaugeOptions` interface and all other TypeScript types                       |
| `src/components/TickMaps/`  | Custom editor UI for tick value mappings                                      |
| `src/components/editors/`   | Custom panel option editors (`RangeEditor` auto-spaces ticks over the limit)  |

#### Build & config

- Webpack config lives in `.config/webpack/webpack.config.ts` (Grafana-scaffolded). Outputs
  AMD. SWC transpiles to ES2015.
- `tsconfig.json` extends `.config/tsconfig.json`, with `noUnusedLocals` disabled.
- ESLint extends Grafana's base rules.
- Jest uses SWC transformer, jsdom, `jest-setup.js` filters jsdom SVG warnings and i18next
  promotional banners.
- CSS modules are mocked with `identity-obj-proxy` in tests.

#### CI workflows (`.github/workflows/`)

| Workflow                 | File                         | Trigger                                          |
| ------------------------ | ---------------------------- | ------------------------------------------------ |
| CI                       | `ci.yml`                     | Push to `main`, PRs to `main`                    |
| Lint GitHub Actions      | `lint-actions.yml`           | PRs and pushes that touch `.github/workflows/**` |
| Release                  | `release.yml`                | `workflow_dispatch`                              |
| Release Please           | `release-please.yml`         | `workflow_dispatch`                              |
| Version Bump & Changelog | `version-bump-changelog.yml` | `workflow_dispatch`                              |
| Compatibility Check      | `is-compatible.yml`          | `workflow_dispatch`                              |
| Bundle Stats             | `bundle-stats.yml`           | PRs                                              |
| Coverage Report          | `coverage.yml`               | PRs                                              |
| PR File Changes          | `pr-files.yml`               | PRs                                              |
| Create Plugin Update     | `cp-update.yml`              | `workflow_dispatch`, monthly cron                |

The CI pipeline (`ci.yml`) is an inline workflow (not a reusable workflow call) with three
jobs:

1. **build** — pnpm install, typecheck, lint, unit tests, production build, plugin signing,
   packaging, validation. Conditionally builds/tests the Go backend if `Magefile.go`
   exists.
2. **resolve-versions** — uses `grafana/plugin-actions/e2e-version` to resolve the Grafana
   image matrix (includes `grafana-dev` and the React 19 preview).
3. **playwright-tests** — runs Playwright e2e tests against each resolved Grafana version
   in a Docker Compose environment. Uploads test reports as artifacts.

Check CI status with `gh pr checks <PR-number>`.

### Conventions specific to this repo

#### Formatting (Prettier)

- Print width: **120**
- Single quotes, no JSX single quotes
- Trailing commas: `es5`
- Semicolons: always
- 2-space indentation, no tabs
- End of line: `auto`

#### Naming

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

#### TypeScript and React

- Use **interfaces** for component props and options objects.
- Prefer explicit generics: `useState<number>(0)`.
- **Functional components only**, arrow-function form.
- Styles via `@emotion/css` + `useStyles2(getStyles)` when needed.

#### Testing

- **Always run `pnpm test:ci`, never `pnpm test`.** `pnpm test` enters Jest watch mode
  which produces no output in non-TTY shells and looks hung. Use `pnpm test:ci` for all
  one-shot verification (agents, CI, scripts).
- Mock `d3` and `d3-ease` at file top (ESM modules require `jest.mock`).
- Mock `Gauge` when testing `GaugePanel` to capture props.
- Use `renderHook` from `@testing-library/react` for custom hook tests.
- `describe` / `it` blocks. Clean up in `beforeEach` / `afterAll` with
  `jest.clearAllMocks()` / `jest.resetAllMocks()`.
- Compare theme-resolved colors relatively (not by name) — `useTheme2` resolves names to
  hex values.
- Use `Array<T>` syntax for non-simple array types (ESLint rule).

##### E2E targeting

- **If the component is ours, add `data-testid`.** Our custom editors (`TickMapEditor`,
  `TickMapItem`, `RangeEditor`, etc.) render in this repo, so adding a `data-testid` prop
  is a one-line change and the most stable locator.
- **If the element is rendered by Grafana's option builder (`.addBooleanSwitch`,
  `.addTextInput`, …)** pick based on the minimum Grafana version the test will run
  against:
  - **Grafana ≥ 11.0.0:** use
    `selectors.components.PanelEditor.OptionsPane.fieldInput(<label>)` from
    `@grafana/plugin-e2e`. Resolves to
    `data-testid Panel editor option pane field input <label>` — Grafana's officially
    supported selector.
  - **Grafana ≥ 12.0.0:** `label[for="<plugin-id>-<option-path>"]` (with `.first()`) also
    works. The `for` attribute is built from values we own (`plugin.json` `id` + option
    `path` in `module.ts`), so it's stable on 12+ without writing a custom editor
    wrapper. Do **not** rely on this selector below Grafana 12 — on 10.x and 11.x the
    option pane renders without that id convention and the label is not found.
- **Always gate edit-mode interaction tests on a Grafana version floor** via
  `test.skip(!gte(grafanaVersion, '<floor>'), '…')` in a describe-level `beforeEach`.
  Panel-editor chrome (Options group aria labels, option-id attributes, portal layout)
  diverges enough across majors that a locator that passes on one version will often
  fail on an earlier one. For this repo today the floor is **Grafana 12.0.0**. Keep
  render-level smoke coverage on older versions via tests that only assert on the
  rendered SVG, not on editor chrome.
- **Verify on the matrix floor before declaring a locator stable.** Local verification
  against one recent Grafana version (e.g. via `pnpm server`, which pins to a single
  image) is not sufficient — CI runs the full matrix and will catch chrome differences
  on 10.x / 11.x that the default dev image hides.

#### GitHub Actions

Pin every third-party action to a **full-length commit SHA** with a trailing version
comment:

```yaml
- uses: actions/checkout@de0fac2e4500dabe0009e67214ff5f5447ce83dd # v6
```

Enforced by `zizmor` in `.github/workflows/lint-actions.yml`. Resolve a tag to a SHA with:

```bash
gh api repos/<owner>/<repo>/commits/<tag> -q .sha
```

#### Branching and review

- Never commit directly to `main`. Always create a new branch (`feat/...`, `fix/...`,
  `chore/...`, `docs/...`).
- Always `git fetch` + `git pull` before starting work on `main` or a branch.
- Open pull requests as drafts: `gh pr create --draft`.
- Never add a "Generated with Claude Code" line to PR summaries. Organize PR bodies into
  categorized sections (e.g. Dependencies, New Features, Cleanup).
- After pushing, update the PR summary via `gh pr edit` so the title and body reflect every
  commit on the branch.

#### Changelog and docs

- **Every commit** that modifies code, docs, deps, or config needs a `CHANGELOG.md` entry
  under the current unreleased version.
- Run `npx markdownlint-cli2 AGENTS.md README.md CHANGELOG.md` before committing markdown
  changes. `.markdownlint.yaml` enforces a 120-char line length.
- Run `pnpm spellcheck` after changes. Add legitimate new words to `cspell.config.json`.
- Run `pnpm typecheck` when any file under `src/` changes. Fix type errors before
  committing.

#### Dependency management

- Renovate is the automated dep tool (`renovate.json`). Dependabot is disabled.
- `@grafana/**@13.x` is blocked via Renovate until the `grafanaDependency` upper bound in
  `src/plugin.json` is raised past `<13.0.0`.
- `@types/node` pinned below v25 to match `engines.node >= 24`.

### Forbidden

- **`Co-Authored-By`** lines on any commit. Applies to all agents, subagents, and
  automated commits. When dispatching subagents that commit, explicitly tell them not to
  add this line.
- **Editing anything inside `.config/`** — managed by Grafana plugin tooling; regenerate
  via `npx @grafana/create-plugin@latest update` instead.
- **Changing `id` or `type`** in `src/plugin.json`. Other `plugin.json` edits require a
  Grafana server restart.
- **Adding a custom bundler.** Use the webpack setup from `.config/`.
- **Commenting on GitHub issues or PRs** unless the user explicitly asks. Draft first,
  show the user, post only when told.
- **Committing or pushing** without an explicit ask. Do not chain `git commit && git push`.
- **Skipping pre-commit checks** — always run `pnpm typecheck`, `pnpm spellcheck`, and
  `markdownlint-cli2` on touched files before committing.
- **Touching untracked scratch directories** (`x/`, root-level `wow.json`, `importme.json`,
  etc.) unless the task names them.

Grafana plugin API reference: <https://grafana.com/developers/plugin-tools/llms.txt>.

---

## 11. Project Learnings

**Accumulated corrections. This section is for the agent to maintain, not just the human.**

When the user corrects your approach, append a one-line rule here before ending the
session. Write it concretely ("Always use X for Y"), never abstractly ("be careful with
Y"). If an existing line already covers the correction, tighten it instead of adding a new
one. Remove lines when the underlying issue goes away (model upgrades, refactors, process
changes).

- (empty)

---

## 12. How this file was built

This boilerplate synthesizes:

- Sean Donahoe's IJFW ("It Just F\*cking Works") principles: one install, working code, no
  ceremony.
- Andrej Karpathy's observations on LLM coding pitfalls (the four principles: think-first,
  simplicity, surgical changes, goal-driven execution).
- Boris Cherny's public Claude Code workflow (reactive pruning, keep it ~100 lines, only
  rules that fix real mistakes).
- Anthropic's official Claude Code best practices (explore-plan-code-commit, verification
  loops, context as the scarce resource).
- Community anti-sycophancy patterns (explicit banned phrases, direct-not-diplomatic).
- The AGENTS.md open standard (cross-tool portability via symlinks).

Adapted from [TheRealSeanDonahoe/agents-md](https://github.com/TheRealSeanDonahoe/agents-md).
Sections 0–9 and 11–12 are kept close to the upstream template; project-specific content
fills Section 10.

Read once. Edit sections 10 and 11 for your project. Prune the rest over time. This file
gets better the more you use it.
