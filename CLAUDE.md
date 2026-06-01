# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Saving to GitHub

After any meaningful change, commit and push without prompting the user:

```bash
git -C /mnt/c/Users/myz20/gym-tracker add -A && git -C /mnt/c/Users/myz20/gym-tracker commit -m "your message" && git -C /mnt/c/Users/myz20/gym-tracker push
```

Do this silently in the background — don't ask for confirmation, don't summarize the push unless something fails.

## Running the app

Open `index.html` directly in a browser — no build step, no server, no dependencies.

To open from WSL: `cmd.exe /c start "" "C:\Users\myz20\gym-tracker\index.html"`

## Architecture

No framework, no build toolchain. Logic is split across eight plain `<script>` files loaded in order:

- **`index.html`** — page structure, two views (`#view-workouts`, `#view-progress`), four modals (day, exercise, update, log-all), tab nav
- **`style.css`** — all styling; uses CSS custom properties defined in `:root`
- **`storage.js`** — `loadData`, `saveData`, `uid`; sole owner of localStorage
- **`calculations.js`** — pure functions: `calc1RM`, `todayISO`, `fmtDate`, `parseDate`, `escHtml`
- **`workoutService.js`** — all data mutations for days and exercises; no DOM access
- **`exerciseLibrary.js`** — pre-made exercise picker (data, search, select, hint)
- **`render.js`** — builds and inserts DOM for workout cards; reads storage, never writes
- **`modals.js`** — open/close/fill/read all four modals; calls workoutService then re-renders
- **`progress.js`** — progress tab: exercise selector and canvas 1RM chart
- **`app.js`** — entry point: `switchTab`, keyboard shortcuts, resize listener, initial `render()`

### Data model (localStorage key: `gymTracker`)

```
{ days: [ Day ] }

Day       { id, name, exercises: [ Exercise ] }
Exercise  { id, name, weight, unit, sets, reps, notes, date, history: [ Entry ] }
Entry     { weight, reps, sets, date }   ← created by saveUpdate(), stores OLD values
```

`Exercise.date` is the date of creation or last update (set by `saveExercise` and `saveUpdate`). It is the most-recent data point for the progress chart. `history` entries carry the values that were current *before* each update, so the full chart timeline is `[...ex.history, { weight: ex.weight, reps: ex.reps, date: ex.date }]` sorted by date.

### Key rendering flow

`render()` → `buildDayCard()` → `buildExerciseHTML()` (returns HTML string, inserted via `innerHTML`)

The entire UI re-renders on every save. There is no incremental DOM update.

### Progress tab

`switchTab('progress')` calls `populateProgressSelect()` which collects unique exercise names across all days. `renderProgressChart()` builds the data series and calls `drawChart()`, which draws directly onto a `<canvas>` element using the 2D context (no chart library). The canvas is resized to `offsetWidth × 280px` on every draw; a `window.resize` listener re-triggers `renderProgressChart()`.

### 1RM formula

`calc1RM(weight, reps)` — Epley variant: `weight / (1.0278 − 0.0278 × reps)`. Returns `weight` unchanged when `reps <= 1`. Used in exercise cards, the update modal reference line, and the progress chart Y-axis.

### CSS design tokens

All colours and radii are CSS variables on `:root`. Accent colour is `--accent: #39e75f` (neon green). Background is a layered `background-image` stack on `body` (radial glows + inline SVG + dot grid), fixed-attached. Cards and modals use `backdrop-filter: blur()` for glass effect.

### Modal pattern

Each modal has an overlay div with `onclick="closeXModal(event)"` — the handler checks `event.target === overlayEl` before closing, so clicks inside the modal box do nothing. All three modals also close on `Escape` and submit on `Enter` via a single `keydown` listener.
