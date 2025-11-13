<div align="center">
  <h1>BobbyFlow</h1>
  <p><strong>Deep-work companion:</strong> Pomodoro timer, tasks, hierarchical notes, calendar integration, focus analytics & reflections – all with Appwrite backend and mobile-optimized interface.</p>
  <p>
    <em>Built with React + TypeScript + Vite + Appwrite. Syncs across devices with full mobile support.</em>
  </p>
</div>

---

## Table of Contents
1. Vision & Philosophy  
2. Feature Overview  
3. Quick Start  
4. Project Structure  
5. Tech Stack & Libraries  
6. Data Model & Persistence  
7. Timer / Session Lifecycle  
8. Notes & Reflections  
9. Analytics & Charts  
10. Calendar Integration
11. Mobile Experience
12. Accessibility & UX Considerations  
13. Theming & Design Tokens  
14. Development Scripts  
15. Roadmap Ideas  
16. Contributing / Internal Guidelines  
17. License (TBD)  

---

## 1. Vision & Philosophy
I wanted a focused workspace that doesn't overwhelm: start a session, capture a quick reflection, see trends, refine habits. BobbyFlow should remain fast, cloud-synced, visually clean, and low-friction. Everything syncs via Appwrite for cross-device access while maintaining excellent mobile responsiveness.

Core principles:
- Low mental overhead – controls are obvious, defaults sensible.
- Rich insight, minimal noise – show only what adds decision value.
- Progressive enhancement – fancy visuals never block basic use.
- Accessibility matters – keyboard + screen reader friendly.
- Mobile-first design – fully optimized for phones and tablets.

---

## 2. Feature Overview
| Area | Highlights |
|------|------------|
| Pomodoro Timer | Focus / short break / long break modes, custom durations, keyboard hints, test alert, reflection prompt after focus, auto-logs to calendar |
| Tasks | Priorities, due dates, tags, completion tracking, aggregated analytics, Appwrite sync |
| Notes | Hierarchical folders, task-linked notes, drag & drop move, reflections auto-appended, cloud storage |
| Reflections | Emoji-coded lines appended to a note (task-linked) with timestamp; history badges in lists |
| Calendar | Google Calendar integration, internal Appwrite calendar, 4 views (Month/Week/Day/Agenda), automatic focus session logging |
| Analytics (Insights) | Daily / Weekly / Monthly focus charts, productivity stats, exports (CSV / JSON), per-task daily table |
| Dashboard | Today focus distribution, goal progress bar, quick context widgets |
| Focus Goal | Daily minute goal w/ gradient progress bar + streak tracking |
| Sessions Table | Simplified & color-coded view of historical sessions |
| Recent Sessions | Enhanced zebra list with mode pills and minute emphasis |
| Mobile Navigation | Bottom navigation bar with 5 main sections, optimized login page |
| Authentication | Email/password + Google OAuth, Appwrite-powered |
| Theming | Light / dark toggle, gradient accents, accessible focus ring |

---

## 3. Quick Start

Prereqs: Node 18+ (or newer LTS).

```bash
git clone <repo-url>
cd focus-flow
npm install
npm run dev
```
Open http://localhost:5173

Build production:
```bash
npm run build
npm run preview
```

Lint:
```bash
npm run lint
```

**Appwrite Setup Required:**
- Create an Appwrite project
- Configure OAuth providers (Google)
- Set up database collections (tasks, notes, calendar events, settings)
- Update `.env` with Appwrite credentials

See `docs/APPWRITE_SETUP.md` for detailed setup instructions.

---

## 4. Project Structure
```
src/
  components/           # Reusable UI components
    calendar/           # Calendar views (Month/Week/Day/Agenda)
    BottomNav.tsx       # Mobile bottom navigation
    EventTooltip.tsx    # Calendar event tooltips
  contexts/             # Theme, auth, tasks, notes, calendar, pomodoro providers
  features/
    pomodoro/           # Timer logic, widgets, goal bar
    tasks/              # Task CRUD, charts, reducers
    notes/              # Folder + notes data + drag/drop logic
    settings/           # User settings management
  layouts/              # App layout + navbar (responsive)
  routes/               # Page components (Dashboard, Timer, Tasks, Calendar, Notes, Insights, Settings)
  lib/                  # Appwrite client, Google Calendar API, sync services
  styles/ / index.css   # Design tokens + focus ring + global resets + mobile responsive
  utils/                # Helpers / date formatting
public/                 # favicon and static assets
docs/                   # Setup guides and documentation
```

---

## Table of Contents
1. Vision & Philosophy  
2. Feature Overview  
3. Quick Start  
4. Project Structure  
5. Tech Stack & Libraries  
6. Data Model & Persistence  
7. Timer / Session Lifecycle  
8. Notes & Reflections  
9. Analytics & Charts  
10. Accessibility & UX Considerations  
11. Theming & Design Tokens  
12. Development Scripts  
13. Roadmap Ideas  
14. Contributing / Internal Guidelines  
15. License (TBD)  

---

## 1. Vision & Philosophy
I wanted a focused workspace that doesn’t overwhelm: start a session, capture a quick reflection, see trends, refine habits. BobbyFlow should remain fast, offline-capable, visually clean, and low-friction. Everything is intentionally local first. Future evolutions may add sync, but not at the cost of responsiveness.

Core principles:
- Low mental overhead – controls are obvious, defaults sensible.
- Rich insight, minimal noise – show only what adds decision value.
- Progressive enhancement – fancy visuals never block basic use.
- Accessibility matters – keyboard + screen reader friendly.

---

## 2. Feature Overview
| Area | Highlights |
|------|------------|
| Pomodoro Timer | Focus / short break / long break modes, custom durations, keyboard hints, test alert, reflection prompt after focus |
| Tasks | Priorities, due dates, tags, completion tracking, aggregated analytics |
| Notes | Hierarchical folders, task-linked notes, drag & drop move, reflections auto-appended |
| Reflections | Emoji-coded lines appended to a note (task-linked) with timestamp; history badges in lists |
| Analytics (Insights) | Daily / Weekly / Monthly focus charts, productivity stats, exports (CSV / JSON), per-task daily table |
| Dashboard | Today focus distribution, goal progress bar, quick context widgets |
| Focus Goal | Daily minute goal w/ gradient progress bar + streak tracking |
| Sessions Table | Simplified & color-coded view of historical sessions |
| Recent Sessions | Enhanced zebra list with mode pills and minute emphasis |
| Theming | Light / dark toggle, gradient accents, accessible focus ring |

---

## 3. Quick Start

Prereqs: Node 18+ (or newer LTS).

```bash
git clone <repo-url>
cd focusflow   # (directory name may still be original)
npm install
npm run dev
```
Open http://localhost:5173

Build production:
```bash
npm run build
npm run preview
```

Lint:
```bash
npm run lint
```

No backend needed. Everything persists to `localStorage` under namespaced keys.

---

## 4. Project Structure
```
src/
  context/            # Theme, tasks, notes, pomodoro providers
  features/
    pomodoro/         # Timer logic, widgets, goal bar
    tasks/            # Task CRUD, charts, reducers
    notes/            # Folder + notes data + drag/drop logic
    insights/         # Analytics aggregation + charts
  layouts/            # App layout + navbar
  routes/             # Page components (Dashboard, Timer, Tasks, Notes, Insights, Settings)
  styles/ / index.css # Design tokens + focus ring + global resets
  utils/              # Helpers / date formatting (if any)
public/               # favicon and static assets
```

---

## 5. Tech Stack & Libraries
- React 19 + TypeScript
- Vite (fast dev, optimized build)
- Tailwind (utility layer via `@tailwindcss/vite`), plus custom CSS variables
- Recharts (visualizations: bar, line, area, pie)
- React Router DOM (routing)
- LocalStorage (persistence)
- No server; no database

Why Recharts? Solid defaults, responsive containers, small cognitive footprint vs rolling custom SVG.

---

## 6. Data Model & Persistence (Simplified)
All persisted via `localStorage` JSON buckets with lazy init (prevents wiping existing data on provider mount):

```ts
Task {
  id: string;
  title: string;
  priority: 'low' | 'medium' | 'high';
  completed: boolean;
  createdAt: ISOString;
  updatedAt: ISOString;
  dueDate?: ISOString;
  tags?: string[];
}

NoteFolder { id: string; name: string; parentId: string | null; }
Note { id: string; title: string; body: string; folderId: string | null; taskId?: string; createdAt: ISOString; updatedAt: ISOString; }

PomodoroSession {
  id: string;
  mode: 'focus' | 'shortBreak' | 'longBreak';
  startedAt: ISOString;
  endedAt?: ISOString;
  durationSec: number; // actual credited length
  taskId?: string;      // link to task for focus sessions
}
```

Reflections are appended as plain text lines inside a note body:
```
🟢 Great focus — 2025 Sep 22 14:31
🟡 Some distractions — 2025 Sep 22 16:05
```
They’re parsed when showing badges / history.

---

## 7. Timer / Session Lifecycle
1. User selects mode (focus / break) or sets custom minutes.  
2. When a focus session ends, a reflection prompt appears (unless aborted).  
3. Reflection choice adds a line to the linked task note (or creates a note if none).  
4. Sessions stored; analytics recalc on next render.  
5. Daily focus goal progress updates + streak logic (consecutive days hitting goal).

Keyboard hints: space to pause/resume (if hooked), Esc to abort, F/S/L to jump modes (future improvement area if not fully bound yet).

---

## 8. Notes & Reflections
Notes live in a three-panel layout (folders | notes list | editor). You can drag a note onto a folder to re-parent it. Reflections show as colored pills in list & inside the note editor. Task-linked notes give you continuity of qualitative context.

Planned improvements (see roadmap): rename/delete folders UI, keyboard nav, collapsed state persistence.

---

## 9. Analytics & Charts
The Insights page aggregates sessions into daily/weekly/monthly windows. Weekly & monthly use local date bucketing (stable across zones). Daily view: 24‑hour bar chart of today’s focus minutes per active hour. Additional charts on the Tasks page break down:
- Completion %
- Priority distribution
- Focus minutes by priority
- Tag usage (top 10)
- Due status donut
- Daily task added vs completed trend

Exports: CSV & JSON reflect the filtered time range.

---

## 10. Accessibility & UX
- Custom gradient focus ring using CSS masking – consistent across interactive elements.
- ARIA `progressbar` semantics for goal bar.
- Reflection dialog marked `role="dialog"` + `aria-modal`.
- Color choices maintain sufficient contrast (verify via tooling for WCAG AA).  
- Still pending: full keyboard navigation in folder tree, notes panel state persistence, labeling enhancements.

---

## 11. Theming & Design Tokens
Defined in `src/index.css` as CSS custom properties:
```
--bg, --surface, --text, --text-muted, --border,
--accent, --accent-accent2, --accent-accent3, --accent-accent4,
--danger, --warning, --success, --info,
--radius-sm/md/lg, --shadow-sm/md, --glow
```
Dark mode flips the palette; toggle stored in theme context (system / light / dark). Gradients used for brand + progress visuals.

---

## 12. Development Scripts
| Script | What it does |
|--------|--------------|
| `npm run dev` | Start Vite dev server |
| `npm run build` | Type-check then build production bundle |
| `npm run preview` | Preview production build locally |
| `npm run lint` | Run ESLint over source |

Type-checking occurs in the build (tsc project references: `tsconfig.app.json`, `tsconfig.node.json`).

---

## 13. Roadmap Ideas
- ✅ ~~Appwrite backend integration~~
- ✅ ~~Google Calendar sync~~
- ✅ ~~Mobile bottom navigation~~
- ✅ ~~Mobile-optimized login~~
- ✅ ~~Calendar event tooltips~~
- ✅ ~~Automatic focus session logging~~
- Folder operations UI (create / rename / delete with guards)
- Persist notes panel sizing & open state
- Keyboard shortcuts overlay
- Offline mode with sync queue
- Rich filtering & tag management
- Pomodoro auto-start next session toggle (configurable)
- PWA manifest + install prompt polish
- Desktop notifications for session completion
- Export/import full workspace data
- Multi-device real-time collaboration
- Task templates and recurring tasks
- Calendar event creation from app
- Habits tracking integration

---

## 14. Contributing / Internal Guidelines
For now this is a single-maintainer sandbox. Still, a few informal rules:
- Keep components small & purposeful.
- Memoize expensive aggregations (`useMemo`) around tasks or sessions arrays.
- Avoid premature libraries; lean on native + lightweight utilities first.
- Prefer data-driven styling (CSS variables) over hard-coded colors inline.
- When adding persistence, always feature-detect existing stored state before initializing defaults.

Coding style: semicolons on TS, small caps for utility classes, accessible labels. Use `console.warn` (guarded by `import.meta.env.DEV`) for defensive error skips.

---

## 15. License
License not yet selected. Treat as "All rights reserved" until a license file appears.

---

## Appendix: Quick FAQ
**Why Appwrite instead of Firebase?** Self-hosting option, better privacy control, excellent developer experience.  
**Why not Redux/Zustand?** Native context + reducers are enough at current scale.  
**Does data survive refresh?** Yes, everything synced to Appwrite cloud.  
**Can I use it offline?** Currently requires internet connection. Offline mode planned for future.  
**Any telemetry?** None. Your data stays between you and your Appwrite instance.  
**Mobile support?** Fully optimized with bottom navigation and responsive design.  
**Google Calendar required?** No, internal calendar works independently. Google sync is optional.

---

**Recent Updates:**
- 🎉 Added mobile bottom navigation with 5 main sections
- 📱 Optimized login page for mobile devices
- 📅 Enhanced calendar with interactive tooltips and multi-event view
- 🔄 Implemented dual-calendar system (Appwrite + Google Calendar)
- ✨ Focus sessions now auto-log to both calendars with task details
- 🎨 Modern gradient-based UI with Untitled UI inspiration
- ⚙️ Added logout option in Settings page

---

Enjoy building with it. PRs / ideas welcome once licensing + contribution guidelines are formalized.

— BobbyFlow
