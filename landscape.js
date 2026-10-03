/*
===============================================================================
LANDSCAPE + BIOMES — landscape.js
===============================================================================

A fixed background scene, back to front:
  sky        one gradient per biome, cross-faded by weight
  stars      night sky: static stars, a few twinkling, rare gold ones, faint
             celestial arcs (behind the mountains and the sea)
  contours   topographic map of a heightfield, plus a brighter copy revealed
             around the pointer (behind Projects and Playground)
  glow       horizon glow centered under the orb; its color follows the orb's
             arc (dawn → moonlight → sunset) as you move down the page
  orb        moon (dark theme) / sun (light theme) that arcs left → right with
             scroll progress
  ridges     three canvases (far, mid, near) of mountain silhouettes
  sea        night sea: wave strokes that drift, and a reflection path under
             the orb in the glow's color

Biomes on the homepage (data-biome on sections):
  ridgeline  Home, What I work on      stars + moon + mountains
  survey     Projects, Playground      the contour map, clean and quiet
  tide       About, Résumé, Contact    stars + moon + sea
A page can fix one biome with <html data-page-biome="…"> (sip.html: "kiln",
a warm version of ridgeline).

Same land, two views: contours and ridges come from ONE seeded heightfield.
The map is the land seen from above; each ridge is a side-on slice. The
world seed (Playground or world controls) redraws both.

Transitions are time-based, not scroll-based. The biome under the middle of
the screen is the target; once it changes (with a small dead zone so it can't
flicker at a boundary), the weights tween to the new biome over a fixed
duration with easing. A single wheel tick past a boundary plays the whole
transition; reversing mid-way tweens back from wherever it is. Scroll-linked
motion (orb, parallax) is smoothed toward its target every frame, so wheel
steps glide instead of jumping.

Weights are written as CSS custom properties (--w-<biome>) on .landscape; the
look of each biome lives in ridgeline.css.

Reduced motion or motion-off: no parallax, drift, waves or twinkle; biome
changes are a short cross-fade; the orb follows scroll directly (it moves
only when you do).
*/
(function () {
  const rootEl = document.documentElement;
  if (rootEl.dataset.style !== "ridgeline") return;

  const BIOMES = ["ridgeline", "survey", "tide", "kiln"];
  const reduceQuery = matchMedia("(prefers-reduced-motion: reduce)");
  const coarse = matchMedia("(hover: none), (pointer: coarse)").matches;
  const still = () => reduceQuery.matches || rootEl.dataset.motion === "off";
  const css = (name, fallback = "") => getComputedStyle(rootEl).getPropertyValue(name).trim() || fallback;

  /* ---------- scene DOM ---------- */
  const scene = document.createElement("div");
  scene.className = "landscape";
  scene.setAttribute("aria-hidden", "true");
  scene.innerHTML =
    BIOMES.map((b) => `<div class="ls-sky ls-sky-${b}"></div>`).join("") +
    `<div class="ls-stars"><canvas class="ls-stars-canvas"></canvas><div class="ls-twinkles"></div></div>
     <canvas class="ls-contours"></canvas><canvas class="ls-contours-lit"></canvas>
     <div class="ls-glow"></div>
     <div class="ls-orb"><span></span></div>
     <canvas class="ls-ridge" data-layer="0"></canvas>
     <canvas class="ls-ridge" data-layer="1"></canvas>
     <canvas class="ls-ridge" data-layer="2"></canvas>
     <canvas class="ls-sea"></canvas>`;
  document.body.prepend(scene);
  const starsCanvas = scene.querySelector(".ls-stars-canvas");
  const twinkles = scene.querySelector(".ls-twinkles");
  const contourCanvas = scene.querySelector(".ls-contours");
  const litCanvas = scene.querySelector(".ls-contours-lit");
  const ridgeCanvases = [...scene.querySelectorAll(".ls-ridge")];
  const seaCanvas = scene.querySelector(".ls-sea");
  const orb = scene.querySelector(".ls-orb");

  /* ---------- noise ---------- */
  function hash(text) {
    let h = 2166136261;
    for (const ch of String(text)) { h ^= ch.charCodeAt(0); h = Math.imul(h, 16777619); }
    return h >>> 0;
  }
  function rng(a) {
    return () => {
      a |= 0; a = (a + 0x6d2b79f5) | 0;
      let t = Math.imul(a ^ (a >>> 15), 1 | a);
      t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
  }
  function makeField(seed) {
    const random = rng(hash(seed));
    const lattice = Float32Array.from({ length: 65536 }, random);
    const at = (x, y) => lattice[((y & 255) << 8) | (x & 255)];
    const noise = (x, y) => {
      const xi = Math.floor(x), yi = Math.floor(y), fx = x - xi, fy = y - yi;
      const sx = fx * fx * (3 - 2 * fx), sy = fy * fy * (3 - 2 * fy);
      const a = at(xi, yi), b = at(xi + 1, yi), c = at(xi, yi + 1), d = at(xi + 1, yi + 1);
      return a + (b - a) * sx + (c - a + (a - b + d - c) * sx) * sy;
    };
    return (x, y, octaves = 4) => {
      let v = 0, amp = 1, f = 1, total = 0;
      for (let o = 0; o < octaves; o++) { v += amp * noise(x * f, y * f); total += amp; amp *= 0.5; f *= 2.03; }
      return v / total;
    };
  }

  const world = () => window.PORTFOLIO_WORLD;
  let seedText = world()?.seed || document.getElementById("seed-input")?.value?.trim() || "wabi-sabi";
  let field = makeField(seedText);

  function fit(canvas) {
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    const w = canvas.clientWidth, h = canvas.clientHeight;
    canvas.width = Math.round(w * dpr);
    canvas.height = Math.round(h * dpr);
    const context = canvas.getContext("2d");
    context.setTransform(dpr, 0, 0, dpr, 0, 0);
    context.clearRect(0, 0, w, h);
    return { context, w, h };
  }

  /* ---------- contour map (marching squares) ---------- */
  function drawContours(canvas, alphaScale) {
    const { context, w, h } = fit(canvas);
    const cell = w < 700 ? 12 : 9, levels = world()?.contourLevels ?? 14, unit = 1 / 260;
    const cols = Math.ceil(w / cell) + 1, rows = Math.ceil(h / cell) + 1;
    const grid = new Float32Array(cols * rows);
    for (let j = 0; j < rows; j++) for (let i = 0; i < cols; i++) grid[j * cols + i] = field(i * cell * unit, j * cell * unit + 40, 3);
    const line = css("--contour", "111, 200, 215"), index = css("--contour-index", "217, 163, 91");
    for (let L = 1; L < levels; L++) {
      const iso = 0.25 + (L / levels) * 0.5;
      context.beginPath();
      for (let j = 0; j < rows - 1; j++) for (let i = 0; i < cols - 1; i++) {
        const a = grid[j * cols + i], b = grid[j * cols + i + 1], c = grid[(j + 1) * cols + i + 1], d = grid[(j + 1) * cols + i];
        const idx = (a > iso) | ((b > iso) << 1) | ((c > iso) << 2) | ((d > iso) << 3);
        if (idx === 0 || idx === 15) continue;
        const x = i * cell, y = j * cell, t = (p, q) => (iso - p) / (q - p);
        const T = [x + cell * t(a, b), y], R = [x + cell, y + cell * t(b, c)], B = [x + cell * t(d, c), y + cell], Lp = [x, y + cell * t(a, d)];
        const seg = { 1: [Lp, T], 2: [T, R], 3: [Lp, R], 4: [R, B], 5: [Lp, T, R, B], 6: [T, B], 7: [Lp, B], 8: [B, Lp], 9: [T, B], 10: [T, R, B, Lp], 11: [R, B], 12: [R, Lp], 13: [T, R], 14: [Lp, T] }[idx];
        for (let k = 0; k < seg.length; k += 2) { context.moveTo(seg[k][0], seg[k][1]); context.lineTo(seg[k + 1][0], seg[k + 1][1]); }
      }
      const isIndex = L % 5 === 0;
      context.strokeStyle = `rgba(${isIndex ? index : line}, ${Math.min(1, (isIndex ? 0.5 : 0.22) * alphaScale)})`;
      context.lineWidth = isIndex ? 1.2 : 0.8;
      context.stroke();
    }
  }

  /* ---------- ridges: side-on slices of the same field ---------- */
  const RIDGE_LAYERS = [
    { row: 3.0, base: 0.56, amp: 0.42, tone: 0 },    // far
    { row: 1.8, base: 0.74, amp: 0.44, tone: 0.5 },  // mid
    { row: 0.6, base: 0.92, amp: 0.4, tone: 1 }      // near
  ];
  const smooth = (t) => { t = Math.min(1, Math.max(0, t)); return t * t * (3 - 2 * t); };
  function mixRgb(a, b, t) {
    const pa = a.split(",").map(Number), pb = b.split(",").map(Number);
    return pa.map((v, k) => Math.round(v + (pb[k] - v) * t)).join(",");
  }
  function drawRidges() {
    const far = css("--ridge-far", "44, 66, 76"), near = css("--ridge-near", "5, 10, 13");
    ridgeCanvases.forEach((canvas, i) => {
      const { context, w, h } = fit(canvas);
      const layer = RIDGE_LAYERS[i];
      const color = mixRgb(far, near, layer.tone);
      const unit = 1 / 170;
      /* Broad slice + ridged peaks + fine weathering, stretched to the
         profile's own range so every layer reads as mountains. */
      const xs = [], heights = [];
      for (let x = 0; x <= w + 3; x += 3) {
        const broad = smooth((field(x * unit, layer.row, 5) - 0.3) / 0.4);
        const ridged = 1 - Math.abs(2 * field(x * unit * 0.8 + 17, layer.row + 31, 4) - 1);
        const detail = (field(x * unit * 5, layer.row + 9, 2) - 0.5) * 0.12;
        xs.push(x);
        heights.push(0.55 * broad + 0.45 * Math.pow(ridged, 1.6) + detail);
      }
      const lo = Math.min(...heights), hi = Math.max(...heights), span = hi - lo || 1;
      context.beginPath();
      context.moveTo(0, h);
      let top = h;
      xs.forEach((x, k) => {
        const y = Math.max(2, h * layer.base - (0.12 + 0.88 * (heights[k] - lo) / span) * layer.amp * (world()?.mountainScale ?? 1) * h);
        top = Math.min(top, y);
        context.lineTo(x, y);
      });
      context.lineTo(w, h);
      context.closePath();
      const g = context.createLinearGradient(0, top, 0, h);
      g.addColorStop(0, `rgba(${color}, ${0.78 + layer.tone * 0.2})`);
      g.addColorStop(0.45, `rgba(${color}, ${0.92 + layer.tone * 0.08})`);
      g.addColorStop(1, `rgba(${color}, 1)`);
      context.fillStyle = g;
      context.fill();
      context.strokeStyle = `rgba(${css("--contour", "111, 200, 215")}, ${0.1 + (1 - layer.tone) * 0.12})`;
      context.lineWidth = 1;
      context.stroke();
    });
  }

  /* ---------- night sky (behind the mountains and the sea) ---------- */
  function drawStars() {
    const { context, w, h } = fit(starsCanvas);
    const random = rng(hash("stars"));
    const line = css("--star-line", "121, 221, 235");
    const star = css("--star", "220, 236, 240");
    const amber = css("--accent-two-rgb", "217, 163, 91");
    const gold = css("--accent-key-rgb", "255, 197, 61");
    /* a few faint celestial arcs around an off-screen pole */
    const cx = w * 0.82, cy = h * 1.55;
    context.lineWidth = 1;
    for (let r = h * 0.75; r < h * 2.4; r += Math.max(120, h * 0.16)) {
      context.beginPath(); context.arc(cx, cy, r, Math.PI, Math.PI * 2);
      context.strokeStyle = `rgba(${line}, 0.035)`; context.stroke();
    }
    /* stars: many faint, few bright; rare amber; one or two gold with a glint */
    const count = Math.round(((w * h) / 7000) * (world()?.starScale ?? 1));
    for (let i = 0; i < count; i++) {
      const x = random() * w, y = random() * h, roll = random();
      const size = 0.35 + Math.pow(random(), 3) * 1.3;
      const color = roll > 0.97 ? amber : star;
      context.fillStyle = `rgba(${color}, ${0.12 + Math.pow(random(), 2) * 0.55})`;
      context.beginPath(); context.arc(x, y, size, 0, Math.PI * 2); context.fill();
    }
    for (let i = 0; i < ((world()?.starScale ?? 1) > 0 ? 2 : 0); i++) {
      const x = w * (0.18 + random() * 0.7), y = h * (0.12 + random() * 0.6);
      const glow = context.createRadialGradient(x, y, 0, x, y, 10);
      glow.addColorStop(0, `rgba(${gold}, 0.55)`); glow.addColorStop(1, `rgba(${gold}, 0)`);
      context.fillStyle = glow; context.beginPath(); context.arc(x, y, 10, 0, Math.PI * 2); context.fill();
      context.strokeStyle = `rgba(${gold}, 0.5)`;
      context.beginPath(); context.moveTo(x - 6, y); context.lineTo(x + 6, y); context.moveTo(x, y - 6); context.lineTo(x, y + 6); context.stroke();
      context.fillStyle = `rgba(${gold}, 0.95)`; context.beginPath(); context.arc(x, y, 1.3, 0, Math.PI * 2); context.fill();
    }
    /* a handful of twinkling stars as DOM nodes (CSS animation, cheap) */
    twinkles.innerHTML = Array.from({ length: Math.round(12 * Math.min(2, world()?.starScale ?? 1)) }, () => {
      const x = (random() * 100).toFixed(2), y = (random() * 85).toFixed(2);
      const delay = (random() * 6).toFixed(2), dur = (4 + random() * 4).toFixed(2);
      return `<i style="left:${x}%;top:${y}%;animation-delay:-${delay}s;animation-duration:${dur}s"></i>`;
    }).join("");
  }

  /* ---------- night sea (About, Résumé, Contact) ----------
     Rows of short wave strokes in perspective: far rows are thin, dense and
     faint; near rows longer, brighter and wider apart. Each row drifts at
     its own speed. Under the orb, a reflection path of brighter strokes
     shimmers in a mix of the moon's pale light and the horizon glow. Drawn
     every frame only while the sea is visible and motion is allowed. */
  let sea = null;
  let seaColors = null;
  const seaOffsets = Array.from({ length: 64 }, rng(hash("tide")));
  function prepareSea() {
    sea = fit(seaCanvas);
    seaColors = {
      top: css("--sea-top", "16, 32, 40"),
      deep: css("--sea-deep", "5, 10, 13"),
      line: css("--sea-line", "160, 205, 218"),
      moon: css("--sea-moon", "228, 238, 240")
    };
  }
  function drawSea(orbX, glow, time) {
    if (!sea) prepareSea();
    const { context: c, w, h } = sea;
    if (!w || !h) return;
    const col = seaColors;
    c.clearRect(0, 0, w, h);
    const body = c.createLinearGradient(0, 0, 0, h);
    body.addColorStop(0, `rgb(${col.top})`);
    body.addColorStop(1, `rgb(${col.deep})`);
    c.fillStyle = body;
    c.fillRect(0, 0, w, h);
    /* the horizon picks up the glow */
    const band = c.createLinearGradient(0, 0, 0, h * 0.3);
    band.addColorStop(0, `rgba(${glow}, 0.16)`);
    band.addColorStop(1, `rgba(${glow}, 0)`);
    c.fillStyle = band;
    c.fillRect(0, 0, w, h * 0.3);
    c.fillStyle = `rgba(${glow}, 0.4)`;
    c.fillRect(0, 0, w, 1);

    const reflect = mixRgb(glow, col.moon, 0.5);
    const rows = 44;
    for (let k = 1; k <= rows; k++) {
      const d = k / rows;                     // 0 at the horizon → 1 nearest
      const y = Math.pow(d, 1.75) * h;
      const len = 4 + d * 70, gap = 14 + d * 110, thick = 0.6 + d * 1.6, period = len + gap;
      const drift = time * 0.012 * (0.25 + d);
      const phase = (seaOffsets[k % 64] * period + drift) % period;
      c.fillStyle = `rgba(${col.line}, ${(0.05 + d * 0.17).toFixed(3)})`;
      for (let x = phase - period; x < w; x += period) c.fillRect(x, y, len, thick);

      const half = 26 + d * 230, step = 5 + d * 14;
      for (let x = orbX - half; x <= orbX + half; x += step) {
        const local = 1 - Math.abs(x - orbX) / half;
        const flicker = 0.55 + 0.45 * Math.sin(time * 0.0025 + k * 1.3 + x * 0.07);
        const a = Math.pow(local, 1.5) * (0.22 + d * 0.62) * flicker;
        if (a < 0.02) continue;
        c.fillStyle = `rgba(${reflect}, ${a.toFixed(3)})`;
        c.fillRect(x, y, step * 0.55 * (0.6 + local), thick + 0.5);
      }
    }
  }

  function drawAll() {
    drawContours(contourCanvas, parseFloat(css("--contour-dim", "0.6")));
    if (!coarse) drawContours(litCanvas, parseFloat(css("--contour-lit", "2")));
    drawRidges();
    drawStars();
    prepareSea();
    kick();
  }

  /* ---------- biome targeting with a dead zone ---------- */
  const pageBiome = rootEl.dataset.pageBiome;
  let runs = [];
  function measureZones() {
    runs = [];
    [...document.querySelectorAll("[data-biome]")]
      .map((el) => ({ biome: el.dataset.biome, start: el.getBoundingClientRect().top + window.scrollY }))
      .sort((a, b) => a.start - b.start)
      .forEach((zone) => { if (!runs.length || runs[runs.length - 1].biome !== zone.biome) runs.push(zone); });
  }
  function biomeAt(probe) {
    if (pageBiome || !runs.length) return pageBiome || "ridgeline";
    let k = 0;
    while (k + 1 < runs.length && runs[k + 1].start <= probe) k++;
    return runs[k].biome;
  }
  let target = null;
  function updateTarget() {
    const vh = window.innerHeight;
    const probe = window.scrollY + vh * 0.5;
    const raw = biomeAt(probe);
    if (target === null) { target = raw; return true; }
    if (raw === target) return false;
    /* Commit once the probe is a little past the boundary. The margin is
       smaller than one wheel notch (~100px), so a single notch across a
       boundary always starts the transition; reversals tween smoothly from
       the current mix, so tiny back-and-forth can't look jumpy. */
    const dead = 24;
    if (biomeAt(probe - dead) === raw && biomeAt(probe + dead) === raw) { target = raw; return true; }
    return false;
  }

  /* ---------- weight tween (time-based) ---------- */
  const weights = Object.fromEntries(BIOMES.map((b) => [b, 0]));
  let tween = null;
  const ease = (t) => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2);
  function startTween() {
    const duration = still() ? 450 : (world()?.transitionMs ?? 1500);
    tween = { from: { ...weights }, start: performance.now(), duration };
  }

  /* ---------- horizon glow color along the orb's arc ---------- */
  function glowStops() {
    return css("--glow-stops", "214,140,96 | 217,163,91 | 140,205,222 | 230,170,80 | 226,118,64")
      .split("|").map((s) => s.trim().split(",").map(Number));
  }
  let stops = null;
  function glowAt(p) {
    if (!stops) stops = glowStops();
    const seg = Math.min(stops.length - 2, Math.floor(p * (stops.length - 1)));
    const t = p * (stops.length - 1) - seg;
    return stops[seg].map((v, k) => Math.round(v + (stops[seg + 1][k] - v) * t)).join(",");
  }

  /* ---------- frame loop: runs only while something is settling ---------- */
  let renderP = null, frame = null, lastTime = 0;
  function progressTarget() {
    const max = Math.max(1, document.documentElement.scrollHeight - window.innerHeight);
    return Math.min(1, Math.max(0, window.scrollY / max));
  }
  function render(now) {
    frame = null;
    const dt = Math.min(64, now - (lastTime || now));
    lastTime = now;
    const vh = window.innerHeight, vw = window.innerWidth;

    /* biome weights */
    let settling = false;
    if (tween) {
      const t = Math.min(1, (now - tween.start) / tween.duration);
      const k = ease(t);
      BIOMES.forEach((b) => { weights[b] = tween.from[b] + ((b === target ? 1 : 0) - tween.from[b]) * k; });
      if (t >= 1) tween = null; else settling = true;
    }
    BIOMES.forEach((b) => scene.style.setProperty(`--w-${b}`, weights[b].toFixed(3)));

    /* smoothed scroll progress */
    /* time of day: page progress, or a fixed value from the world controls */
    const pTarget = world() && !world().followScroll ? world().timeOfDay : progressTarget();
    if (renderP === null || still()) renderP = pTarget;
    else {
      renderP += (pTarget - renderP) * (1 - Math.exp(-dt / 140));
      if (Math.abs(pTarget - renderP) > 0.0004) settling = true; else renderP = pTarget;
    }
    const p = renderP;
    scene.style.setProperty("--p", p.toFixed(4));

    /* ridges: gentle parallax; outside the mountain biomes they settle down
       and fade out */
    const away = 1 - Math.min(1, weights.ridgeline + weights.kiln);
    const moving = !still();
    ridgeCanvases.forEach((canvas, i) => {
      const depth = [0.35, 0.65, 1][i];
      const parallax = moving ? -p * 40 * depth : 0;
      const drop = moving ? away * vh * (0.06 + depth * 0.1) : 0;
      canvas.style.transform = `translate3d(0, ${(parallax + drop).toFixed(1)}px, 0)`;
    });

    /* orb arc: rises at the left, peaks mid-page, sets at the right */
    const x = vw * (0.06 + p * 0.88);
    const horizon = vh * 0.56, arc = vh * 0.4;
    const y = horizon - (0.12 + 0.88 * Math.sin(Math.PI * p)) * arc;
    orb.style.transform = `translate3d(${x.toFixed(1)}px, ${y.toFixed(1)}px, 0)`;

    /* horizon glow follows the orb: position, and color along the arc */
    const glow = glowAt(p);
    scene.style.setProperty("--glow-x", `${((x / vw) * 100).toFixed(2)}%`);
    scene.style.setProperty("--glow-rgb", glow);

    /* sea: rises in with its biome; waves keep moving while it's visible */
    if (weights.tide > 0.002) {
      drawSea(x, glow, moving ? now : 0);
      seaCanvas.style.transform = `translate3d(0, ${moving ? ((1 - weights.tide) * vh * 0.18).toFixed(1) : 0}px, 0)`;
      if (moving && !document.hidden) settling = true;
    }

    if (settling) frame = requestAnimationFrame(render);
  }
  function kick() { if (!frame) frame = requestAnimationFrame(render); }

  function onScroll() {
    if (updateTarget()) startTween();
    kick();
  }

  /* ---------- pointer-lit contours ---------- */
  if (!coarse) {
    window.addEventListener("pointermove", (event) => {
      litCanvas.style.setProperty("--lit-x", `${event.clientX}px`);
      litCanvas.style.setProperty("--lit-y", `${event.clientY}px`);
      scene.classList.add("ls-lit");
    }, { passive: true });
    document.addEventListener("pointerleave", () => scene.classList.remove("ls-lit"));
  }

  /* ---------- wiring ---------- */
  window.addEventListener("scroll", onScroll, { passive: true });
  let resizeTimer;
  window.addEventListener("resize", () => {
    clearTimeout(resizeTimer);
    resizeTimer = setTimeout(() => { measureZones(); drawAll(); onScroll(); }, 150);
  }, { passive: true });
  window.addEventListener("portfolio:theme-changed", () => { stops = null; drawAll(); });
  window.addEventListener("portfolio:preferences-changed", kick);
  /* World controls (world-settings.js): redraw only the affected layer. */
  window.addEventListener("portfolio:world-changed", (event) => {
    const key = event.detail?.key;
    if (key === "mountainHeight") drawRidges();
    else if (key === "contourDetail") {
      drawContours(contourCanvas, parseFloat(css("--contour-dim", "0.6")));
      if (!coarse) drawContours(litCanvas, parseFloat(css("--contour-lit", "2")));
    } else if (key === "stars") drawStars();
    else if (key === "all") drawAll();
    kick();
  });
  document.addEventListener("visibilitychange", kick);
  window.addEventListener("terrain:seed", (event) => {
    const next = event.detail?.seed;
    if (next && next !== seedText) { seedText = next; field = makeField(seedText); drawAll(); }
  });
  const remeasure = () => { measureZones(); onScroll(); };
  window.addEventListener("load", remeasure);
  document.fonts?.ready.then(() => { remeasure(); drawAll(); });

  /* Start already in the right biome (no transition on page load). */
  measureZones();
  updateTarget();
  weights[target] = 1;
  drawAll();
})();
