# Copilot instructions – STiA, Symulator Tramwajów i Autobusów (MPK Wrocław)

Pixel-art browser game: drive an MPK Wrocław tram or bus using real GTFS data and an IBIS-style driver panel. Full documentation (in Polish) is in `README.md` – read the relevant section before larger changes.

## Running / build / test

- No build, no server, no dependencies: open `index.html` directly in a browser (works from `file://`, offline).
- Syntax check a single file: `node --check core.js` (same for any other `.js`).
- Regression test (browser console) – headless demo run; must end in the depot hall with no negative points (~710–715 pts for tram and bus):
  ```js
  document.getElementById('start').classList.add('hide');
  startDemo('bus'); // or 'tram'
  for (let i = 0; i < 60 * 700 && !G.ended; i++) update(1 / 60);
  console.log(G.ended, G.score, G.log.filter(l => l.p < 0));
  ```
- Line data test (after regenerating `lines.js`): see README §7 – loads every direction of every line (`LINES`, skipping `OFFICE`) and runs `update` without exceptions.
- Regenerate GTFS data (Python 3, stdlib only): `python build_lines.py gtfs lines.js [YYYYMMDD]` (calls `build_segs.py` itself). Details in README §5.5.

## Architecture

Plain scripts sharing one global scope, loaded by `index.html` in this fixed order:

`lines.js → core.js → events.js → render.js → topdown.js → demo.js → ui.js`

- `lines.js` – generated GTFS data (`window.LINES`); do not hand-edit, regenerate with the Python scripts.
- `core.js` – game state `G` (`G.world`, `G.veh`, …), `VEH`/`MODELS`, `ENV`/`WX`/`LIVE`, `ACT`, physics/scoring/traffic in `update(dt)`, world generation `buildWorld` / `buildTraining`.
- `events.js` – announcements, dispatcher (CC) messages, RTT/PRTT/CA calls, event scenes.
- `render.js` – canvas drawing (`draw()`, sprites, `ptext` pixel font, `shade`/`tint`).
- `topdown.js` – bird's-eye scenes (loop, turns, depot); reuses `shade`/`tint` from `render.js` – never redeclare them.
- `demo.js` – autopilot (`demoStep`) used by the demo mode and as the regression test.
- `ui.js` – IBIS panel (`UI.setPanel/render/act`), HUD, audio, input, and the `requestAnimationFrame` loop `frame(t)`; must stay last.

## Conventions

- No external dependencies, no ES modules/`import`/`export` (blocked under `file://`), no build tooling.
- After changing any script, bump the cache-busting `?v=N` on **all** `<script>` tags in `index.html` (keep the same number for all).
- Code comments, UI strings and docs are in Polish; keep that style.
- Scale constants: `PX = 3` px/m, `TIME_SCALE = 2`, `LIMIT = 50 / 3.6` (speeds are in m/s internally); world is 1-D along X.
- Persisted settings use `localStorage` keys `mpkwro_*`, `ibisEnv`, `ibisPanel` (README §5.6) – keep backward compatibility.
- Adding a new road situation: add the object to `G.world` in both `buildWorld` and `buildTraining`, handle it in `update`, draw it in `draw`, add a hint in `hints`, and teach the autopilot in `demoStep`.
- Keep `README.md` (file table, key functions, controls, scoring, `localStorage` keys) in sync with code changes.
