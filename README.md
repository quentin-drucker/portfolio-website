# Quentin Drucker — Portfolio

A static, interactive portfolio centered on procedural systems, computer
graphics, computer vision, and full-stack work.

The project uses plain HTML, CSS, and JavaScript. There is no framework, build
step, package manager, database, or required backend.

This README is written as technical notes to myself. It explains what each file
does, how the browser assembles the site, and where content lives.

---

## Redesign (Ridgeline, October 2026)

The homepage was redesigned on the `design-system` branch and promoted to the
root. Everything below this section still describes the original foundation,
which the redesign builds on rather than replaces.

- **Previous version:** `archive/v1-2026-10-03/` (browsable copy) and git tag
  `baseline-2026-10-03` (exact files). Screenshots: `docs/baseline-2026-10-03/`.
- **Explorations:** `explorations/` holds every style direction tried,
  including the Ridgeline prototype (`explorations/v2/`). They're snapshots
  with their own copies of the scripts; changing the live site doesn't affect them.

What the redesign added:

| File | Purpose |
|---|---|
| `site.css` | Effect tokens (glows, shimmer, progress, particles become themeable) and new page structure: overview cards, featured project, Playground, world controls |
| `ridgeline.css` | The theme: slate/cyan palette with amber and gold tiers, Shippori Mincho + Zen Kaku Gothic type, fading panels, fog reveals, and the landscape layers |
| `landscape.js` | Background scene: night sky with mountains (top), a contour map of the same land (Projects, Playground), a night sea with the moon's reflection (About to Contact), the moon/sun and its horizon glow, and timed biome transitions |
| `terrain.js` | Playground: a seeded wireframe heightfield you can orbit |
| `world-settings.js` | World controls in the settings dialog (interface size, seed, mountains, contours, stars, nebula, time of day, cursor glow, card flash, particle speed, transition speed, fog reveal, screen edges, shooting stars). Defaults live in one `DEFAULTS` object there |
| `site.js` | Overview-card filter jumps and the senior-project stand-in image |
| `sip.html`, `sip.css` | Senior project page (draft) with its own page biome |
| `shortcuts.js` | Keyboard-shortcut list (`?`), `S` for World controls, and a one-time "Press ? for keyboard shortcuts" hint for mouse-and-keyboard visitors |
| `pages.css` | Layout for the résumé page and the project page template |
| `assets/og-image.png`, `assets/og-image-sip.png` | Link-preview images (1200×630), rendered from the landscape |

Load order on every page: `styles.css → enhancements.css → site.css →
ridgeline.css` (→ page CSS), then scripts `config.js → script.js →
enhancements.js → world-settings.js → terrain.js → landscape.js → site.js →
shortcuts.js` (pages without the Playground skip `terrain.js` and `site.js`).

Every page except `404.html` shares the same header, settings, command
palette, shortcuts and footer. The footer's "Last updated" date comes from
`lastUpdated` in `config.js`: change it there when you publish an update.
Link previews (Open Graph tags in each page's `<head>`) use absolute URLs
for GitHub Pages at `https://quentin-drucker.github.io/portfolio-website/`;
update them if the site moves to another address.

Performance rules the scripts follow (keep them when editing):
- Read the page (scroll position, sizes) before writing styles in the same
  frame; scroll handlers only read, and write in `requestAnimationFrame`.
- Page height and scroll position come from `window.PORTFOLIO_PAGE`
  (script.js), refreshed by a `ResizeObserver` and the scroll event, so
  animation loops never measure the page themselves.
- landscape.js writes a style only when its value changes, and puts a
  variable on the element that uses it (the glow's variables live on
  `.ls-glow`): a variable on `.landscape` restyles every layer and twinkle.
- Layers of a biome at weight 0 get `ls-no-*` classes (hidden, animations
  paused); the cursor glow loop sleeps once it has caught up.
- Canvas drawing keeps `rgba()` color strings: switching to `globalAlpha`
  changes pixels on GPU-backed canvases.

Homepage section order and shortcut keys: `1 #home`, `2 #expertise`
("What I work on"), `3 #projects`, `4 #playground`, `5 #about`, `6 #resume`,
`7 #contact`. `R` opens the résumé; `/` or Ctrl/Cmd+K opens the command
palette; `S` opens World controls; `?` lists every shortcut. Single-key
shortcuts fire only without Ctrl/Cmd/Alt, so browser
shortcuts (Ctrl+R reload, Ctrl+1–7 tabs) still work. On the other pages
the number keys open the homepage sections.

Biomes: sections declare `data-biome`: `ridgeline` (Home, What I work on:
stars, moon, mountains), `survey` (Projects, Playground: the contour map) and
`tide` (About, Résumé, Contact: stars, moon, night sea). A page can fix its own
with `<html data-page-biome="…">` (`sip.html` uses `kiln`, a warm ridgeline).
Background changes are timed transitions, not scroll-scrubbed.

Projects are matched to `config.js` by a stable `id`
(`case-study.html?project=<id>`), so reordering cards no longer breaks
case-study links. The project dialog buttons are still matched by card order.

Browser storage keys: `quentin-portfolio-theme`,
`portfolio-enhancement-preferences`, `quentin-world-settings`, and
`portfolio-loader-seen` (session).

---

## Original build status

The original foundation included:

- Dark mode as the first-visit default
- Remembered dark/light theme selection
- A refined light palette
- Responsive desktop, tablet, and mobile layouts
- Organic canvas motes with pointer and scroll interaction
- A master motion-effects switch
- A live particle-density slider
- Hover shimmer and local card lighting
- Restrained card tilt and magnetic controls
- Scroll-linked section reveals
- Project filtering
- Expandable project details
- A before/after comparison control
- A reusable case-study page
- A procedural seed canvas
- A command palette
- Keyboard navigation
- A print-ready résumé page
- A static-hosting 404 page

The final audit removed disconnected or unused items and verified the current
file relationships. The project does not contain optional sound, hidden
diagnostics, secret keyboard effects, or unused settings controls.

---

# File tree

```text
quentin-portfolio-final-template/
│
├── index.html
├── styles.css
├── enhancements.css
│
├── config.js
├── script.js
├── enhancements.js
│
├── resume.html
├── case-study.html
├── 404.html
│
├── site.webmanifest
├── robots.txt
├── README.md
│
└── assets/
    └── favicon.svg
```

Every file has a current purpose:

| File | Purpose |
|---|---|
| `index.html` | Main portfolio document and normal site entry point |
| `styles.css` | Base visual system, layout, themes, and original interaction styles |
| `enhancements.css` | Styles for dialogs, settings, filters, seed demo, side rail, and refined light mode |
| `config.js` | Rotating-interest and project-detail data used by JavaScript |
| `script.js` | Base navigation, theme, reveal, shimmer, tilt, contact, cursor, and particle behavior |
| `enhancements.js` | Filters, dialogs, command palette, settings, seed canvas, and keyboard shortcuts |
| `resume.html` | Standalone print-oriented résumé template |
| `case-study.html` | Shared project case-study template |
| `404.html` | Static-hosting fallback for missing routes |
| `site.webmanifest` | Browser/site metadata and install-style presentation information |
| `robots.txt` | Public crawler policy |
| `assets/favicon.svg` | Browser tab/site icon |
| `README.md` | Architecture, editing, deployment, and maintenance notes |

---

# How the site is assembled

The project is static.

A web server does not render templates or run the JavaScript. It only returns
files. The visitor's browser performs the actual assembly.

Typical homepage loading sequence:

```text
Browser requests /
        ↓
Static host returns index.html
        ↓
Browser parses the HTML
        ↓
Browser requests linked CSS, JavaScript, fonts, favicon, and manifest
        ↓
CSS is applied to the parsed document
        ↓
Deferred JavaScript executes in document order
        1. config.js
        2. script.js
        3. enhancements.js
        ↓
Event listeners, canvas rendering, dialogs, filtering, and settings activate
```

The complete interactive page is therefore:

```text
index.html
    structural content
+
styles.css
    base presentation
+
enhancements.css
    feature-specific presentation
+
config.js
    enhancement data
+
script.js
    foundational behavior
+
enhancements.js
    additional behavior
=
the rendered portfolio homepage
```

---

# Resource and execution order

The important homepage references are conceptually:

```html
<link rel="stylesheet" href="styles.css">
<link rel="stylesheet" href="enhancements.css">

<script src="config.js" defer></script>
<script src="script.js" defer></script>
<script src="enhancements.js" defer></script>
```

## Why CSS order matters

`styles.css` loads first and defines the durable base design.

`enhancements.css` loads second and extends the base design. It reuses the same
custom properties and can override specific base rules through the normal CSS
cascade.

## Why JavaScript order matters

`config.js` must execute before `enhancements.js`, because it creates:

```js
window.PORTFOLIO_ENHANCEMENTS
```

`script.js` then starts the base systems.

`enhancements.js` runs last and connects the feature-specific controls.

All three scripts use `defer`, which means:

- They can download while the HTML is being parsed.
- They wait until the DOM has been built.
- They preserve their listed execution order.

---

# `index.html`

`index.html` is the main document.

It contains:

- Search/social metadata
- Stylesheet and script references
- Intro-loader markup
- Background canvas and decorative layers
- Primary navigation
- Desktop side navigation
- Hero content
- About content
- Procedural seed demo
- Expertise cards
- Project filters and project cards
- Résumé summary
- Contact form
- Back-to-top control
- Project dialog
- Command-palette dialog
- Effects-settings dialog
- Footer

## Stable section IDs

These IDs are shared by navigation, keyboard shortcuts, observers, and scrolling:

```text
#home
#about
#expertise
#projects
#resume
#contact
```

Changing one of these IDs requires updating every matching link or JavaScript
target.

## JavaScript hook IDs

Important behavioral hooks include:

```text
#ambient-canvas
#scroll-progress
#cursor-aura
#project-filters
#project-dialog
#project-dialog-content
#command-dialog
#command-input
#command-results
#settings-dialog
#effects-toggle
#particle-density
#particle-density-value
#settings-reset
#seed-form
#seed-input
#seed-canvas
#back-to-top
```

These are effectively contracts between the HTML and JavaScript. Renaming one
without updating its selector disconnects that feature.

---

# `styles.css`

This is the main visual system.

It contains:

- Dark and light theme variables
- Reset/default element behavior
- Typography
- Fixed background grid and glows
- Glass surfaces
- Header and navigation
- Buttons
- General section layout
- Hero presentation
- Visual-computing console
- About layout
- Expertise layout
- Project layout and CSS illustrations
- Résumé summary
- Contact form
- Footer
- Reveal animation
- Responsive breakpoints
- Reduced-motion behavior
- Shimmer, hover-light, tilt, cursor-aura, and click-ripple styles

## Design tokens

The `:root` variables are the main design controls.

Examples:

```css
--bg
--surface
--surface-strong
--surface-soft

--text
--text-soft
--text-faint

--line
--line-bright

--blue
--blue-strong
--violet
--cyan
--green

--shadow
--shadow-soft

--radius-md
--radius-lg
--max
--header-height
```

The final audit removed variables that were defined but never used.

## Theme state

The active theme is represented on the root element:

```html
<html data-theme="dark">
```

or:

```html
<html data-theme="light">
```

CSS attribute selectors apply the corresponding palette.

Dark mode is the first-visit default.

A visitor's deliberate theme selection is remembered.

---

# `enhancements.css`

This stylesheet contains the visual rules for the later feature layer.

It styles:

- Command and settings buttons
- Intro loader
- Rotating-interest label
- Cursor-following vision box
- Procedural seed section
- Project filters
- Project-detail trigger
- Desktop side rail
- Back-to-top progress orb
- Project dialog
- Before/after comparison
- Command palette
- Settings switch and density slider
- Motion-disabled state
- Refined light-theme overrides

## Enhancement color aliases

The enhancement layer uses semantic accent names:

```css
--accent
--accent-strong
--accent-two
```

They map to the base palette:

```css
--accent: var(--cyan);
--accent-strong: var(--blue-strong);
--accent-two: var(--violet);
```

This lets the enhancement components use the same palette as the base site.

## Motion-off state

The master effects switch sets:

```html
<html data-motion="off">
```

CSS then removes decorative animation and hides motion-only layers.

The JavaScript particle engine also stops and clears its canvas. The setting is
therefore functional rather than only visual.

---

# `config.js`

This file provides the data used by the enhancement layer.

It creates:

```js
window.PORTFOLIO_ENHANCEMENTS
```

The current object contains:

```text
interests
projectDetails
```

## `interests`

The rotating hero label cycles through this array.

Example:

```js
interests: [
  "Visual Computing",
  "Computer Vision",
  "Procedural Systems"
]
```

## `projectDetails`

These objects supply content for:

- Expandable project dialogs
- Project commands in the command palette
- Case-study links
- Case-study page data

Current relationship:

```text
first visible project card  ↔ projectDetails[0]
second visible project card ↔ projectDetails[1]
third visible project card  ↔ projectDetails[2]
fourth visible project card ↔ projectDetails[3]
```

Reordering project cards in `index.html` currently requires reordering the
corresponding objects in `config.js`.

This is a known architectural limitation, not a broken feature.

A future refactor could use stable project IDs instead of array position.

---

# `script.js`

This is the foundational behavior layer.

It handles:

- Dark/light theme
- Mobile navigation
- Sticky-header state
- Top scroll-progress line
- Background glow movement
- Reveal animations
- Active top-navigation state
- Contact-form mailto construction
- Current year
- Shimmer layers
- Pointer-position card lighting
- Card tilt
- Cursor aura
- Particle field
- Click bursts
- Hidden-tab animation pause
- Theme and settings event bridges

---

## Theme handling

Theme selection is stored under:

```text
quentin-portfolio-theme
```

First visit:

```text
dark
```

After a visitor deliberately chooses light mode:

```text
light is saved and restored on later visits
```

The theme button updates:

- `data-theme`
- Its accessible label
- Local storage
- The static reduced-motion canvas when necessary

The light theme uses:

- Cool off-white surfaces
- Stronger blue-gray borders
- Cyan/blue buttons
- Visible darker motes
- Light-specific background glows
- Dark hero/project visual panels

This preserves the same technical visual identity rather than performing a
simple color inversion.

---

## Mobile navigation

The mobile button toggles:

```text
.nav-links.open
body.menu-open
aria-expanded
aria-label
```

Selecting a navigation link closes the menu.

Resizing above the mobile breakpoint also closes it.

---

## Section reveal system

Elements with:

```html
class="reveal"
```

start slightly translated and transparent.

`IntersectionObserver` watches them.

When an element reaches the viewport, JavaScript adds:

```text
.visible
```

CSS then performs the reveal transition.

The observer stops watching an element after its first reveal.

---

## Active navigation state

A separate `IntersectionObserver` watches the main sections.

It applies:

```text
.active
```

to the corresponding top-navigation link.

`enhancements.js` uses another observer for the desktop side rail.

---

## Contact form

The contact form is static.

It does not submit data to a web server.

On submit, JavaScript creates a URL like:

```text
mailto:quentin@example.com?subject=...&body=...
```

The visitor's configured email application handles the message.

Advantages:

- No backend
- No database
- No API key
- Works on static hosting

Limitations:

- Requires a configured email application
- Cannot confirm delivery
- Cannot provide server-side spam filtering
- Cannot store submissions

The address (`qdruck@gmail.com`) is set in `script.js` (`CONTACT_EMAIL`) and
appears in the contact links in `index.html`.

---

## Shimmer and hover lighting

For each selected component, `script.js` inserts:

```html
<span class="shimmer-surface"></span>
<span class="hover-light"></span>
```

Pointer movement stores local position in:

```css
--pointer-x
--pointer-y
```

The CSS radial gradient follows those values.

The shimmer uses a separate moving gradient layer.

Both are decorative and disabled by the effects switch or reduced-motion rules.

---

## Card tilt

Expertise, project, and fact cards receive a small perspective transform based on
pointer position.

The rotation is deliberately restrained so text remains readable.

Tilt is included in the master Motion effects switch rather than exposed as an
independent visitor setting.

---

## Cursor aura

The true pointer position and rendered aura position are stored separately.

Each animation frame interpolates the aura toward the pointer.

This produces trailing motion instead of snapping.

Touch/coarse-pointer devices do not use this effect.

---

# Particle engine

The full-screen particle field uses:

```html
<canvas id="ambient-canvas">
```

It does not create an individual DOM element for each particle.

Main collections:

```text
clusters
motes
bursts
```

## Clusters

Clusters are invisible, slowly moving attractor centers.

Motes are loosely assigned to them, which creates grouped, wafty movement rather
than one uniform wind direction.

## Mote depth layers

Each mote belongs to one of three layers:

```text
Far
  Tiny, faint, and slow

Middle
  Main visible clustered field

Near
  Larger, brighter, and more responsive
```

## Forces

Each animation frame combines:

1. Weak spring attraction toward a cluster
2. Tangential swirl force
3. Multiple sine-based wandering forces
4. Cursor repulsion/curl
5. Hold-to-vortex behavior
6. Scroll wake
7. Velocity damping
8. Maximum-speed limiting

## Idle behavior

After several seconds without pointer movement:

- Activity force is reduced
- Clusters tighten slightly
- The field becomes calmer

Pointer interaction restores the more expressive movement.

## Scroll wake

Fast scrolling creates a temporary force opposite the scroll direction.

The wake decays every animation frame so it does not become permanent wind.

## Hold-to-vortex

Holding the primary pointer over noninteractive background creates a stronger
curl around the pointer.

The interaction does not activate over:

```text
buttons
links
inputs
textareas
select controls
labels
dialogs
```

## Click bursts

Clicking noninteractive background creates:

- Temporary canvas particles
- A short DOM ring ripple

Reduced/off motion skips this effect.

## Performance safeguards

- Device-pixel ratio is capped
- Mote count is limited
- Density is user-adjustable
- Hidden tabs stop the animation loop
- Reduced motion draws a smaller static frame
- Effects-off clears the canvas
- Touch devices skip pointer-specific effects

---

# `enhancements.js`

This file handles the feature-specific interaction layer.

It contains:

- Preference loading and migration
- Settings dialog
- Intro loader
- Rotating interest text
- Vision overlay
- Magnetic controls
- Project filtering
- Project details
- Comparison slider
- Command palette
- Side navigation
- Back-to-top progress
- Procedural seed canvas
- Keyboard shortcuts

---

## Dialog scroll lock

When any portfolio dialog opens, `body.dialog-open` is applied:

```text
overflow: hidden
```

This prevents the page from scrolling behind the modal backdrop. The class is
removed whenever a dialog closes, including when the visitor presses Escape
(which the browser handles natively before dispatching the `close` event).

---

## Preference storage

Settings are stored under:

```text
portfolio-enhancement-preferences
```

Current format:

```json
{
  "effectsEnabled": true,
  "particleDensity": 70
}
```

The code can normalize an older settings object containing a `motion` value.
After loading, it writes the current two-key format.

## Effects switch

The switch controls the complete decorative effects layer:

- Moving motes
- Shimmer
- Local hover lighting
- Card tilt
- Magnetic movement
- Cursor aura
- Rotating-interest animation
- Decorative CSS animation

Turning effects off:

- Sets `data-motion="off"`
- Stops and clears the particle canvas
- Clears temporary transforms
- Disables the density slider
- Retains the chosen density value

## Particle-density slider

Range:

```text
0% to 100%
```

Step:

```text
10%
```

The percentage output updates during dragging.

Canvas rebuilds are scheduled with `requestAnimationFrame` so rapid slider input
does not trigger multiple rebuilds in one display frame.

## Restore defaults

The button writes:

```json
{
  "effectsEnabled": true,
  "particleDensity": 70
}
```

and immediately updates the page.

## Operating-system reduced motion

The master switch does not override a system reduced-motion request.

When the OS requests reduced motion:

- CSS animations are minimized
- The particle engine uses a static reduced frame
- The settings status explains why motion is limited

---

# Intro loader

The loader cycles through a short status sequence and then hides.

It is remembered for the current tab/session under:

```text
portfolio-loader-seen
```

The loader is skipped when:

- It has already run in the current session
- Motion effects are disabled
- The visitor activates Skip

The loader is decorative. It does not delay actual resource loading.

---

# Rotating interest label

The hero label cycles through `config.js` interests every few seconds.

JavaScript changes the text.

CSS provides the blur/slide transition.

When motion effects are disabled, the timer remains idle and the current text
stays visible.

---

# Vision overlay

The hero's visual-computing panel contains a decorative detection box.

Pointer movement is converted from viewport coordinates to coordinates within
the vision panel.

JavaScript updates:

```text
left
top
coordinate label
```

The effect has no effect on navigation or content.

---

# Magnetic controls

Prominent buttons, brand links, and text links move a few pixels toward the
pointer.

The effect is skipped when:

- Motion effects are disabled
- A coarse/touch pointer is detected

The transform clears on pointer leave.

---

# Project filters

Each filter button has:

```html
data-filter="..."
```

Each project card has:

```html
data-project-category="..."
```

When a filter is selected, nonmatching cards receive:

```text
.is-filtered
```

The active filter updates:

```text
aria-pressed
```

for assistive technology.

---

# Project detail dialog

Each project-detail button opens the native:

```html
<dialog id="project-dialog">
```

The dialog body is generated from `config.js`.

The first project currently includes a before/after slider.

The range control updates:

```css
--compare
```

which changes the processed layer's visible width.

The project dialog links to the shared case-study template.

---

# Command palette

Open with:

```text
Ctrl/Cmd + K
/
header command button
```

The palette contains:

- Section navigation
- Résumé opening
- Effects settings
- Project-detail commands

The search field filters by command title and description.

Arrow keys change the selected command.

Enter activates it.

The search field and selection reset every time the palette opens.

---

# Desktop side rail

The left-side section rail mirrors the main page sections.

A separate observer applies its active state.

CSS hides it on narrower viewports where it would take too much space.

---

# Back-to-top control

The floating circular button appears after the page has been scrolled.

Its SVG circle uses `stroke-dashoffset` to show page progress.

Clicking it scrolls to document position zero.

The footer's brand link uses:

```text
#home
```

as the canonical anchor destination.

---

# Procedural seed canvas (original; replaced)

The redesign replaced this 2D demo with the Playground terrain (`terrain.js`).
`#seed-form` and `#seed-input` are kept and now drive the terrain and the
world seed; `drawSeed()` in `enhancements.js` finds no `#seed-canvas` and does
nothing. The original description follows.

The seed demo uses:

```html
<canvas id="seed-canvas">
```

Pipeline:

```text
text input
    ↓
hashSeed()
    ↓
32-bit number
    ↓
seededRandom()
    ↓
repeatable pseudo-random sequence
    ↓
drawSeed()
    ↓
repeatable contour field
```

The same input text produces the same pattern.

Theme colors are read from current CSS variables.

The canvas redraws when:

- The form is submitted
- The viewport changes size

---

# Keyboard shortcuts

```text
Ctrl/Cmd + K   Open command palette
/              Open command palette
1              Home
2              What I work on
3              Projects
4              Playground
5              About
6              Résumé section
7              Contact
R              Open résumé page
Esc            Close an open portfolio dialog
```

Shortcuts are ignored while typing in:

```text
input
textarea
select
```

---

# `resume.html`

The résumé page. It shows the PDF (`2026_0603_Resume_QD.pdf`, the
authoritative résumé) inside the site's frame, with **Download PDF** (saved
as `Quentin_Drucker_Resume.pdf`) and **Open in a new tab**. It uses the same
shell as the other pages (header, settings, theme, shortcuts, footer) with
the sea biome fixed as its background.

On phones, and in browsers without a built-in PDF viewer, the PDF isn't
embedded; the page points to the download and open buttons instead.

To update the résumé, replace the PDF and change its file name in
`resume.html` (it appears in several links there) and in `enhancements.js`
if the page itself is renamed.

---

# `case-study.html`

This is a shared case-study template.

A project is selected through a query string:

```text
case-study.html?project=visual-intelligence
```

The `project` value is matched against each project's `id` in `config.js`
(`visual-intelligence`, `image-to-world`, `intelligent-web-app`,
`visualization-vfx`). The senior project's dialog links to `sip.html` instead.

The page reads from `config.js` and fills the type, title, role,
technologies ("Built with"), outcome (`result`) and overview (`summary`). A
16:9 frame marks where images and video will go, a "Still to come" list
names the planned write-up sections (the problem, constraints, process,
reflection), and a link at the bottom leads to the next project. Notes on
what each planned section should cover are in a comment at the top of the
page's `<main>`. The background is fixed to the contour map (`survey`).

---

# `404.html`

Shown by GitHub Pages for any address that doesn't exist. It is
self-contained (inline styles and drawing) because it can be served at any
folder depth, where the site's relative stylesheet paths would break. It
copies the Ridgeline palette and fonts, follows the visitor's saved
light/dark choice, and on GitHub Pages points its links at the site's root
folder.

---

# `site.webmanifest`

The web manifest describes:

- Site name
- Short name
- Start URL
- Display mode
- Background color
- Theme color
- Favicon/icon

It does not provide offline behavior.

There is no service worker or cache layer.

JSON does not support comments, so the manifest remains intentionally
uncommented.

---

# `robots.txt`

Current crawler policy:

```text
User-agent: *
Allow: /
```

This permits public crawling.

It does not guarantee that a search engine will index the site.

---

# `assets/favicon.svg`

The SVG favicon is used by:

- `index.html`
- `resume.html`
- `case-study.html`
- `site.webmanifest`

SVG keeps the icon sharp across different browser and device sizes.

---

# Running locally

## Basic method

Open:

```text
index.html
```

directly in a browser.

## Recommended method

Run a local static server from inside the folder:

```bash
python3 -m http.server 8000
```

On Windows:

```bash
py -m http.server 8000
```

Then open:

```text
http://localhost:8000
```

A local HTTP server better matches production behavior:

- Relative paths resolve normally
- MIME types are served correctly
- Query strings work as deployed
- Browser storage has a stable origin
- Static page navigation is easier to test

---

# Deployment

No build command is required.

## GitHub Pages

1. Create a repository.
2. Place these files at the repository root.
3. Push the repository.
4. Open repository Settings.
5. Open Pages.
6. Deploy from the main branch/root directory.

## Netlify

Upload the entire folder or connect its repository.

## Vercel

Import the repository as a static project.

## Other hosts

Any host that serves ordinary static files can run the project.

Expected MIME types include:

```text
.html          text/html
.css           text/css
.js            text/javascript or application/javascript
.svg           image/svg+xml
.webmanifest   application/manifest+json
```

---

# Content-editing workflow

Recommended order:

1. Replace name, email, and social links
2. Finalize the hero statement
3. Replace expertise text
4. Replace project cards
5. Update matching `config.js` project details
6. Add real screenshots/media
7. Write case studies
8. Replace résumé content
9. Export and link a résumé PDF
10. Update metadata and social-preview information
11. Test every link and control
12. Deploy

---

# Placeholder search

Before deployment, search the whole project for:

```text
quentin@example.com
yourusername
Quentin [Last Name]
Your University
placeholder
href="#"
```

Not every instance of the word `placeholder` is necessarily visible content;
some appear in documentation or HTML input attributes. Review each result.

---

# Current duplicated content

Project information currently exists in two locations.

## Visible project cards

Stored directly in:

```text
index.html
```

## Detail-modal and case-study data

Stored in:

```text
config.js
```

Updating a project may require editing both files.

This is functional but not a single-source-of-truth architecture.

A future refactor could place complete project objects in `config.js` and
generate the cards, filters, dialogs, and case-study links from the same data.

---

# Current project-order dependency

Partly fixed in the redesign: case-study links now use each project's stable
`id`. The project-dialog buttons on the homepage are still matched by order.

Project details are connected by array order.

If project cards are reordered, the corresponding `projectDetails` objects must
also be reordered.

A future refactor could use:

```html
data-project-id="visual-intelligence"
```

and perform project lookup by stable ID.

---

# Adding real project images

The current project visuals are CSS placeholders.

When replacing them:

- Prefer WebP or AVIF
- Set explicit width and height
- Use a consistent aspect ratio
- Add meaningful `alt` text
- Use `loading="lazy"` below the fold
- Compress large screenshots
- Avoid autoplay video
- Add poster images for video
- Load interactive 3D content only when requested

---

# Accessibility notes to preserve

Do not remove without replacing:

- Skip-to-content link
- Semantic landmarks
- Visible focus states
- Logical heading order
- Real buttons for actions
- Real links for navigation
- Form labels
- Dialog headings
- `aria-expanded` on mobile navigation
- `aria-pressed` on filters
- `aria-live` status text
- `aria-hidden` on decorative canvas/SVG layers
- Operating-system reduced-motion support
- Touch-friendly target sizes

No important information should exist only as animation or decoration.

---

# Final testing checklist

## Content

- Replace every personal placeholder
- Confirm project cards match `config.js`
- Confirm case-study query links
- Confirm résumé information
- Confirm email and social links
- Confirm page title and descriptions

## Navigation

- Header links
- Mobile menu
- Side rail
- Command palette
- Number-key shortcuts
- Back-to-top orb
- Footer Home link

## Project interactions

- Every filter
- Every detail button
- Dialog close button
- Dialog backdrop close
- Comparison slider
- Case-study links

## Settings

- Motion effects on
- Motion effects off
- Particle slider while enabled
- Disabled slider while effects are off
- Restore defaults
- Reload persistence
- Operating-system reduced-motion behavior

## Themes

- First visit opens dark
- Light selection persists
- Dark selection persists
- Motes visible in both themes
- Buttons and cards readable in both themes
- Dialog contrast in both themes

## Keyboard

- Tab through navigation
- Tab through filters
- Open and operate dialogs
- Operate the comparison slider
- Use command palette
- Close dialogs with Escape
- Submit/contact fields

## Responsive layout

- Large desktop
- Laptop
- Tablet
- Phone
- 200% browser zoom

## Performance

- No console errors
- Hidden tab stops canvas animation
- Mobile scrolling remains smooth
- No oversized project media
- Effects-off stops decorative motion

---

# Browser storage reset

During testing, stored preferences can be cleared in developer tools or with:

```js
localStorage.removeItem("quentin-portfolio-theme");
localStorage.removeItem("portfolio-enhancement-preferences");
sessionStorage.removeItem("portfolio-loader-seen");
location.reload();
```

---

# No-build architecture

There is deliberately no:

```text
package.json
node_modules
npm install
bundler
transpiler
framework runtime
build output folder
```

Benefits:

- Source files are directly inspectable
- Deployment is simple
- No dependency update burden
- No build failures
- The deployed files are the source files

Tradeoff:

As functionality grows, manual relationships between HTML, CSS, JavaScript, and
configuration data require careful maintenance.

The detailed comments and this README are intended to make those relationships
clear.

---

# Final mental model

```text
The server delivers static files.

index.html defines the homepage structure.

styles.css defines the base visual language.

enhancements.css styles the added controls, dialogs, and refined light theme.

config.js supplies rotating-interest and project-detail data.

script.js runs foundational navigation, theme, visual, and particle systems.

enhancements.js runs settings, filters, dialogs, commands, and the seed demo.

resume.html and case-study.html are separate specialized documents.

The browser combines everything into the final interactive experience.
```
