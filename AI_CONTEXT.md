# BobbyFlow AI Context File

Purpose: Give future AI assistants or automation a concise, high-signal snapshot of the project so they can answer questions or implement features without re-deriving architecture from scratch.

## High-Level Summary
BobbyFlow is a local-first productivity web app: Pomodoro sessions + tasks + hierarchical notes + reflections + analytics. Built with React 19, TypeScript, Vite, Tailwind (utility via plugin) plus custom CSS variables. State is managed via React Context providers (tasks, pomodoro, notes, theme). Persistence uses `localStorage` with lazy initialization to avoid overwriting existing user data.

## Core Domains
- Pomodoro: session timing, modes (focus / shortBreak / longBreak), session records, reflection prompting, goal progress + streak.
- Tasks: CRUD with priority, due date, tags, completion status; aggregated analytics.
- Notes: Folder tree + notes; drag & drop for moving notes; notes can be task-linked; reflections appended here.
- Insights: Aggregates sessions (daily/weekly/monthly) and tasks for charts + export.
- Dashboard: Today’s focus distribution + goal progress + quick widgets.

## Persistence Keys (indicative)
- `ff/pomodoro` – sessions + settings
- `ff/tasks` – tasks list
- `ff/notes` – notes + folders
(Exact keys may be in individual context/provider files.) Lazy init pattern: read existing first; only write defaults if absent.

## Data Shapes (Simplified)
```
Task { id, title, priority, completed, createdAt, updatedAt, dueDate?, tags? }
Note { id, title, body, folderId, taskId?, createdAt, updatedAt }
NoteFolder { id, name, parentId|null }
PomodoroSession { id, mode, startedAt, endedAt?, durationSec, taskId? }
```
Reflections: stored as lines appended to note body (emoji + label + date/time). Parser looks for emojis + delimiter.

## Key Components / Files
- `src/layouts/Layout.tsx` – Navbar, theme toggle, dynamic document title.
- `src/routes/TimerPage.tsx` – Main timer UI, custom session creator, recent sessions list, reflection dialog, notes side panel.
- `src/routes/InsightsPage.tsx` – Time‑range selector, charts (Recharts), per-task daily focus table, sessions table.
- `src/features/tasks/components/TaskCharts.tsx` – Task analytics (completion donut, priority, focus minutes by priority, tags, due status, daily trend).
- `src/features/pomodoro/components/FocusGoalBar.tsx` – Daily goal progress + streak chip.
- `src/index.css` – Theme tokens, focus ring, scrollbar styling, placeholder styles.

## Styling & Theming
CSS variables define palette and radii. Tailwind used for layout utilities. Focus ring implemented via pseudo-element + gradient mask. Dark mode toggled through theme context (system / explicit).

## Charts (Recharts)
Used components: `BarChart`, `LineChart`, `AreaChart`, `PieChart`, `ResponsiveContainer`, `LabelList`, `CartesianGrid`, `Tooltip`. Gradients defined in `<defs>` where needed. Data transformations are memoized.

## Accessibility Notes
- Focus outline replaced with visible gradient ring.
- Reflection dialog: `role="dialog"`, `aria-modal`.
- Goal bar uses ARIA progress semantics.
Pending improvements: folder tree ARIA, keyboard nav across notes panels, descriptive labels for charts.

## Recent Enhancements
- Task charts spacing polish (carded charts grid).
- Sessions tables simplified (removed IDs, color-coded mode/ minutes).
- Recent sessions list styled (pills + zebra rows).
- Custom focus input: centered, glowing placeholder, removed spinner controls, extended presets.
- Branding rename to BobbyFlow + favicon update.

## Roadmap (Short List)
1. Folder operations UI (create / rename / delete w/ non-empty guard).
2. Accessibility: treeview roles, chart descriptions, keyboard shortcuts.
3. Persist notes panel state (open/size) across sessions.
4. README expansion & license selection.
5. Potential PWA manifest + offline export/import.

## Conventions
- Avoid heavy external state managers until complexity warrants it.
- Use `useMemo` / defensive try-catch around aggregation loops.
- Guard localStorage writes (read first, only initialize if null).
- Use semantic small headings with uppercase tracking for section labels.

## Risks / TODOs
- No data migration layer yet (future schema changes could break older data).
- Large localStorage data sets not handled (no pruning / archiving strategy).
- Accessibility coverage incomplete for nested folders & chart narration.

## Quick Integration Points
To add a new chart: compute aggregated array in relevant context or component `useMemo`, feed to Recharts component, keep height ~160–240px, ensure responsive container. Provide `aria-label` on wrapper.

To add folder operations: implement UI in notes sidebar; ensure non-empty folder deletion prompts or moves children to parent/null.

## Document Title Logic
In `Layout.tsx` – updates `document.title` to `BobbyFlow • <Page>` based on active route.

## Favicon & Branding
`public/favicon.ico` primary. Additional sizes can be added later (manifest not yet committed).

---
This file is meant to be updated when major architectural or conceptual changes happen. Keep it succinct, high-signal, and tool-friendly.
