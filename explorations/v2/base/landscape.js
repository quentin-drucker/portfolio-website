/*
===============================================================================
LANDSCAPE + BIOMES — landscape.js (explorations/v2, Ridgeline style)
===============================================================================

A fixed background scene, back to front:
  sky        one gradient per biome, cross-faded by weight
  contours   topographic map of a heightfield (the "survey sky"), plus a
             brighter copy revealed around the pointer
  orb        moon (dark theme) / sun (light theme) that arcs left → right
             with scroll progress and sets behind the ridges
  ridges     three canvases (far, mid, near) of mountain silhouettes
  haze       per-biome horizon glow

Same land, two views: contours and ridges come from ONE seeded heightfield.
The map is the land seen from above; each ridge is a slice through the same
field seen from the side. The Playground seed redraws both.

Biomes:
- Page biome: <html data-page-biome="kiln"> fixes the biome for a whole page.
- Scroll biomes: sections carry data-biome="…". The biome under the middle of
  the screen wins. "blend" mode mixes neighbors over one screen of scrolling;
  "cut" mode switches at the boundary with a short cross-fade.
  Weights are written as CSS custom properties (--w-<biome>) on .landscape,
  and per-biome looks live in styles/ridgeline.css.

Drawing happens only on resize, theme change and seed change. Scrolling only
updates transforms and opacities. Reduced motion or motion-off: no parallax
or sinking; biomes still change by cross-fade, and the orb still follows the
scroll (it moves only when you do).
*/
(function () {
  const rootEl = document.documentElement;
  if (rootEl.dataset.style !== "ridgeline") return;

  const BIOMES = ["ridgeline", "survey", "dusk", "kiln"];
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
    `<canvas class="ls-contours"></canvas><canvas class="ls-contours-lit"></canvas>
     <div class="ls-orb"><span></span></div>
     <canvas class="ls-ridge" data-layer="0"></canvas>
     <canvas class="ls-ridge" data-layer="1"></canvas>
     <canvas class="ls-ridge" data-layer="2"></canvas>
     <div class="ls-haze"></div>`;
  document.body.prepend(scene);
  const contourCanvas = scene.querySelector(".ls-contours");
  const litCanvas = scene.querySelector(".ls-contours-lit");
  const ridgeCanvases = [...scene.querySelectorAll(".ls-ridge")];
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
    /* fBm in "land units": one unit ≈ one large landform */
    return (x, y, octaves = 4) => {
      let v = 0, amp = 1, f = 1, total = 0;
      for (let o = 0; o < octaves; o++) { v += amp * noise(x * f, y * f); total += amp; amp *= 0.5; f *= 2.03; }
      return v / total;
    };
  }

  let seedText = document.getElementById("seed-input")?.value?.trim() || "wabi-sabi";
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
    const cell = w < 700 ? 12 : 9, levels = 14, unit = 1 / 260; // px → land units
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
      /* Slice of the shared field for the broad shape, a ridged version of it
         for sharp peaks, and fine noise so crests look weathered. Averaged
         noise has a narrow range, so each profile is stretched to its own
         min..max before scaling to the layer's amplitude. */
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
        const norm = (heights[k] - lo) / span;
        const y = h * layer.base - (0.12 + 0.88 * norm) * layer.amp * h;
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
      /* a faint rim light on the crest, in the contour color */
      context.strokeStyle = `rgba(${css("--contour", "111, 200, 215")}, ${0.10 + (1 - layer.tone) * 0.12})`;
      context.lineWidth = 1;
      context.stroke();
    });
  }

  function drawAll() {
    drawContours(contourCanvas, parseFloat(css("--contour-dim", "0.6")));
    if (!coarse) drawContours(litCanvas, parseFloat(css("--contour-lit", "2")));
    drawRidges();
    update();
  }

  /* ---------- biomes ---------- */
  let mode = "blend";
  try { mode = localStorage.getItem("v2-biome-transition") || "blend"; } catch (error) {}
  const pageBiome = rootEl.dataset.pageBiome;
  /* Runs: consecutive sections with the same biome merged, in page order. */
  let runs = [];

  function measureZones() {
    runs = [];
    [...document.querySelectorAll("[data-biome]")]
      .map((el) => ({ biome: el.dataset.biome, start: el.getBoundingClientRect().top + window.scrollY }))
      .sort((a, b) => a.start - b.start)
      .forEach((zone) => { if (!runs.length || runs[runs.length - 1].biome !== zone.biome) runs.push(zone); });
  }

  function biomeWeights(probe, vh) {
    const weights = Object.fromEntries(BIOMES.map((b) => [b, 0]));
    if (pageBiome || !runs.length) { weights[pageBiome || "ridgeline"] = 1; return weights; }
    let k = 0;
    while (k + 1 < runs.length && runs[k + 1].start <= probe) k++;
    if (mode === "blend") {
      /* within half a screen of a run boundary, mix the two biomes */
      const half = vh * 0.5;
      for (let r = 1; r < runs.length; r++) {
        const offset = probe - runs[r].start;
        if (Math.abs(offset) < half) {
          const t = (offset + half) / (2 * half);
          weights[runs[r - 1].biome] += 1 - t;
          weights[runs[r].biome] += t;
          return weights;
        }
      }
    }
    weights[runs[k].biome] = 1;
    return weights;
  }

  /* ---------- per-scroll update (transforms and opacity only) ---------- */
  let queued = false;
  function update() {
    queued = false;
    const vh = window.innerHeight, vw = window.innerWidth;
    const max = Math.max(1, document.documentElement.scrollHeight - vh);
    const p = Math.min(1, Math.max(0, window.scrollY / max));
    const weights = biomeWeights(window.scrollY + vh * 0.5, vh);
    BIOMES.forEach((b) => scene.style.setProperty(`--w-${b}`, weights[b].toFixed(3)));
    scene.style.setProperty("--p", p.toFixed(4));

    const sink = weights.survey; // map biome: the mountains sink away
    const moving = !still();
    ridgeCanvases.forEach((canvas, i) => {
      const depth = [0.35, 0.65, 1][i];
      const parallax = moving ? -p * 40 * depth : 0;
      const drop = moving ? sink * vh * (0.18 + depth * 0.22) : 0;
      canvas.style.transform = `translate3d(0, ${(parallax + drop).toFixed(1)}px, 0)`;
    });

    /* orb arc: rises at the left, peaks mid-page, sets at the right */
    const x = vw * (0.08 + p * 0.84);
    const horizon = vh * 0.56, arc = vh * 0.4;
    const y = horizon - (0.12 + 0.88 * Math.sin(Math.PI * p)) * arc;
    orb.style.transform = `translate3d(${x.toFixed(1)}px, ${y.toFixed(1)}px, 0)`;
  }
  const queue = () => { if (!queued) { queued = true; requestAnimationFrame(update); } };

  scene.classList.toggle("ls-cut", mode === "cut");
  window.addEventListener("landscape:mode", (event) => {
    mode = event.detail?.mode === "cut" ? "cut" : "blend";
    scene.classList.toggle("ls-cut", mode === "cut");
    update();
  });

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
  window.addEventListener("scroll", queue, { passive: true });
  let resizeTimer;
  window.addEventListener("resize", () => {
    clearTimeout(resizeTimer);
    resizeTimer = setTimeout(() => { measureZones(); drawAll(); }, 150);
  }, { passive: true });
  window.addEventListener("portfolio:theme-changed", drawAll);
  window.addEventListener("portfolio:preferences-changed", update);
  window.addEventListener("terrain:seed", (event) => {
    const next = event.detail?.seed;
    if (next && next !== seedText) { seedText = next; field = makeField(seedText); drawAll(); }
  });
  window.addEventListener("load", () => { measureZones(); update(); });
  document.fonts?.ready.then(() => { measureZones(); drawAll(); });

  measureZones();
  drawAll();
})();
