# Style explorations, round 2

Five styles applied to the **live portfolio page**, not new mockups. Open
`index.html` here (or the gallery one folder up) and switch styles with the bar
at the bottom. `styleguide.html` shows each style's palette, type, controls,
cards and effects.

| Style | In one line | Signature |
|---|---|---|
| Original | the live look, unchanged (control) | clustered glowing motes |
| Mist | Weathered after dark: stone, washi, kintsugi gold, serif | ink-wash ridges each visit; fog-clearing reveals; faded screen edges |
| Survey | night topographic map, cyan + amber index contours | contour map lit around the cursor, re-seeded by the Playground |
| Field | Signal's flow field on indigo, ultramarine, one grotesk | pointer-reactive flow field behind the hero |
| Graphite | Viewport palette, orange = selected | editor grid, selection outlines, spark particles |

## Round 3: Ridgeline and biomes

`?style=ridgeline`: Survey's palette (cyan actions, amber highlights) with
Mist's type, spacing, fading panels, fog reveals and faded screen edges.

- **Landscape** (`base/landscape.js`): mountains in front of a contour-map
  sky, both cut from one seeded heightfield (the map is the land from above;
  each ridge is a side-on slice). The Playground seed redraws both.
- **Scroll biomes**: sections carry `data-biome`. Home and Focus are
  `ridgeline`; Projects and Playground are `chart` (a quiet star chart: near-
  solid slate, faint arcs, still stars, a few twinkling, rare gold ones;
  mountains and map fade out so the work reads cleanly); About to Contact
  are `dusk`.
- **Transitions are time-based**: once the middle of the screen is 24px past a
  biome boundary, the change plays as one eased 1.5s tween, whether you
  scrolled one wheel notch or ten. Scrolling back tweens back from the current
  mix. The orb and parallax are smoothed so wheel steps glide.
- **Horizon glow**: always present behind the mountains, centered under the
  orb, its color following the orb's arc (`--glow-stops`: dawn → morning →
  moonlight → evening → sunset).
- **Three color tiers**: cyan for actions; amber for notable details (labels,
  key caps, active filter, index contours, controls); saturated gold
  `--accent-key` for four things only (status dot, featured project label and
  edge, terrain peak, current section in the rail).
- **Page biomes**: `<html data-page-biome="kiln">` fixes a page's biome and
  palette. `sip.html` is a draft senior-project page that uses it.
- **Moon/sun**: arcs left → right with scroll progress, with a pale halo, and
  sets behind the ridges. A sun in light mode.
- Reduced motion or motion-off: no parallax, drift or twinkle; biome changes
  are a short cross-fade.

## How it's built

- Loads the live `../../styles.css` and `../../enhancements.css` **unchanged**.
- `base/` holds copies of `config.js`, `script.js`, `enhancements.js` with small
  patches (each file's header lists them), plus:
  - `v2.css`: effect tokens, shared v2 structure, light-mode layer, switcher
  - `terrain.js`: the Playground heightfield generator
  - `signatures.js`: one signature effect per style
  - `v2.js`: style switcher, overview-card filter jumps, SIP stand-in image
  - `style-boot.js`: picks the style before first paint
  - `styleguide.css` / `styleguide.js`: the style guide page
- `styles/<name>.css`: one file per style. Nearly all of it is token values.

## Structure changes from the live page (same in every style)

- Order: Home, What I work on, Projects, Playground, About, Résumé, Contact.
  Keys 1–7 follow it; the side rail shows the same numbers.
- "What I work on" cards list the real projects for each area and jump to that
  filter. Projects can belong to several areas; an AI filter was added.
- Computational World-Building (the SIP) is the featured project card, with a
  clearly labeled placeholder for the future dedicated SIP section.
- The 2D seed demo became the 3D terrain Playground.
- Removed: invented hero metrics (98.4%, 24 ms, 128D, 60 fps), "subject 0.97"
  labels, `href="#"` source/live links, template instructions, and the
  "Infinite unique worlds" claim.
- Fixed: side-rail pill covering the headline at laptop widths; orphan project
  card; missing disabled-button state.

## What the real design system would take from this

1. Every glow, shimmer, ripple, progress and particle color is a token
   (`--fx`, `--fx-2`, `--fx-glow`, `--mote-*`, `--btn-*`). The live CSS has 200+
   raw `rgba()` literals and a light theme that hard-codes cyan; `v2.css`
   shows the replacement pattern.
2. Canvas code reads colors from CSS custom properties (see `readMotePalette`
   in `base/script.js`), so one stylesheet controls the whole look.
3. Display, body and UI font tokens instead of hard-coded families.
