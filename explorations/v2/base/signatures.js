/*
===============================================================================
STYLE SIGNATURES — signatures.js (explorations/v2)
===============================================================================

Each style may add one signature effect on #signature-canvas. Only the effect
matching <html data-style> runs. All of them:
- read colors from CSS tokens, so light/dark switching works
- draw a single static frame for reduced motion or when site motion is off
- stop animating while their area is off screen or the tab is hidden

  mist    ink-wash ridgelines behind the hero, a new range on each visit
  survey  fixed topographic contour map; a second, brighter copy is revealed
          in a circle around the cursor (CSS mask), re-seeded by the Playground
  field   pointer-reactive flow field behind the hero
*/
(function () {
  const rootEl = document.documentElement;
  const canvas = document.getElementById("signature-canvas");
  if (!canvas) return;
  const style = rootEl.dataset.style;
  const reduceQuery = matchMedia("(prefers-reduced-motion: reduce)");
  const still = () => reduceQuery.matches || rootEl.dataset.motion === "off";
  const css = (name, fallback = "") => getComputedStyle(rootEl).getPropertyValue(name).trim() || fallback;

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
  function noise2D(seed) {
    const random = rng(seed);
    const lattice = Float32Array.from({ length: 65536 }, random);
    const at = (x, y) => lattice[((y & 255) << 8) | (x & 255)];
    return (x, y) => {
      const xi = Math.floor(x), yi = Math.floor(y), fx = x - xi, fy = y - yi;
      const sx = fx * fx * (3 - 2 * fx), sy = fy * fy * (3 - 2 * fy);
      const a = at(xi, yi), b = at(xi + 1, yi), c = at(xi, yi + 1), d = at(xi + 1, yi + 1);
      return a + (b - a) * sx + (c - a + (a - b + d - c) * sx) * sy;
    };
  }
  function fit(target) {
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    const w = target.clientWidth, h = target.clientHeight;
    target.width = Math.round(w * dpr);
    target.height = Math.round(h * dpr);
    const context = target.getContext("2d");
    context.setTransform(dpr, 0, 0, dpr, 0, 0);
    return { context, w, h };
  }
  const debounce = (fn, ms = 150) => { let t; return () => { clearTimeout(t); t = setTimeout(fn, ms); }; };

  /* ---------------------------------------------------------------- MIST */
  function mist() {
    const seed = (Date.now() / 1000) | 0; // transience: a new range each visit
    function ridge1D(r) {
      const pts = Array.from({ length: 512 }, r);
      return (x) => { const i = Math.floor(x), f = x - i, t = f * f * (3 - 2 * f); return pts[i & 511] * (1 - t) + pts[(i + 1) & 511] * t; };
    }
    const fbm = (n, x) => { let v = 0, a = 0.5, f = 1; for (let o = 0; o < 5; o++) { v += a * n(x * f); a *= 0.5; f *= 2.03; } return v; };

    function draw(progress = 1) {
      const { context, w, h } = fit(canvas);
      context.clearRect(0, 0, w, h);
      const far = css("--ridge-far", "120, 116, 104");
      const near = css("--ridge-near", "8, 8, 7");
      const bg = css("--ridge-bg", "26, 25, 22");
      const r = rng(seed);
      const layers = 7;
      for (let L = 0; L < layers; L++) {
        const t = L / (layers - 1);
        const n = ridge1D(rng(seed + L * 977));
        const base = h * (0.42 + t * 0.42);
        const amp = h * (0.08 + t * 0.13) * (0.7 + r() * 0.6);
        const scale = 0.0022 + t * 0.0016 + r() * 0.001;
        const visible = Math.max(0, Math.min(1, progress * layers - L));
        if (visible <= 0) continue;
        /* Atmospheric perspective on a dark page: far ridges are pale haze,
           near ridges are darker than the page itself. */
        const mix = (a, b) => a.split(",").map((v, k) => Math.round(+v + (+b.split(",")[k] - +v) * t)).join(",");
        const color = mix(far, near);
        const alpha = (0.35 + t * 0.55) * visible;
        context.beginPath();
        context.moveTo(0, h);
        for (let x = 0; x <= w; x += 3) {
          const y = base - fbm(n, x * scale) * amp - Math.max(0, fbm(n, x * scale * 3.1 + 40) - 0.45) * amp * 0.9;
          context.lineTo(x, y);
        }
        context.lineTo(w, h);
        context.closePath();
        const g = context.createLinearGradient(0, base - amp, 0, base + amp * 1.6);
        g.addColorStop(0, `rgba(${color}, ${alpha})`);
        g.addColorStop(1, `rgba(${color}, 0)`);
        context.fillStyle = g;
        context.fill();
      }
      /* Mist pooling at the bottom so the hero dissolves into the page. */
      const fade = context.createLinearGradient(0, h * 0.55, 0, h);
      fade.addColorStop(0, `rgba(${bg}, 0)`);
      fade.addColorStop(1, `rgba(${bg}, 1)`);
      context.fillStyle = fade;
      context.fillRect(0, 0, w, h);
    }

    if (still()) draw(1);
    else {
      const start = performance.now();
      (function step(now) {
        const p = Math.min(1, (now - start) / 2400);
        draw(1 - Math.pow(1 - p, 3));
        if (p < 1) requestAnimationFrame(step);
      })(start);
    }
    window.addEventListener("resize", debounce(() => draw(1)), { passive: true });
    window.addEventListener("portfolio:theme-changed", () => draw(1));
  }

  /* -------------------------------------------------------------- SURVEY */
  function survey() {
    /* A second canvas holds the brighter "lit" copy; CSS masks it to a circle
       around the pointer using --lit-x / --lit-y. */
    const lit = document.createElement("canvas");
    lit.id = "signature-lit";
    lit.setAttribute("aria-hidden", "true");
    canvas.after(lit);
    let seedText = "104729";

    function contours(target, seed, { alphaScale = 1 } = {}) {
      const { context, w, h } = fit(target);
      context.clearRect(0, 0, w, h);
      const cell = 9, levels = 14, scale = 0.0042;
      const n = noise2D(hash(seed));
      const cols = Math.ceil(w / cell) + 1, rows = Math.ceil(h / cell) + 1;
      const field = new Float32Array(cols * rows);
      for (let j = 0; j < rows; j++) for (let i = 0; i < cols; i++) {
        let v = 0, a = 1, s = scale, total = 0;
        for (let o = 0; o < 3; o++) { v += a * n(i * cell * s, j * cell * s); total += a; a *= 0.5; s *= 2; }
        field[j * cols + i] = v / total;
      }
      const line = css("--contour", "111, 227, 245");
      const index = css("--contour-index", "217, 163, 91");
      for (let L = 1; L < levels; L++) {
        const iso = 0.25 + (L / levels) * 0.5;
        context.beginPath();
        for (let j = 0; j < rows - 1; j++) for (let i = 0; i < cols - 1; i++) {
          const a = field[j * cols + i], b = field[j * cols + i + 1], c = field[(j + 1) * cols + i + 1], d = field[(j + 1) * cols + i];
          const idx = (a > iso) | ((b > iso) << 1) | ((c > iso) << 2) | ((d > iso) << 3);
          if (idx === 0 || idx === 15) continue;
          const x = i * cell, y = j * cell, lerp = (p, q) => (iso - p) / (q - p);
          const T = [x + cell * lerp(a, b), y], R = [x + cell, y + cell * lerp(b, c)];
          const B = [x + cell * lerp(d, c), y + cell], Lp = [x, y + cell * lerp(a, d)];
          const seg = { 1: [Lp, T], 2: [T, R], 3: [Lp, R], 4: [R, B], 5: [Lp, T, R, B], 6: [T, B], 7: [Lp, B], 8: [B, Lp], 9: [T, B], 10: [T, R, B, Lp], 11: [R, B], 12: [R, Lp], 13: [T, R], 14: [Lp, T] }[idx];
          for (let k = 0; k < seg.length; k += 2) { context.moveTo(seg[k][0], seg[k][1]); context.lineTo(seg[k + 1][0], seg[k + 1][1]); }
        }
        const isIndex = L % 5 === 0;
        context.strokeStyle = `rgba(${isIndex ? index : line}, ${(isIndex ? 0.5 : 0.22) * alphaScale})`;
        context.lineWidth = isIndex ? 1.2 : 0.8;
        context.stroke();
      }
    }
    function drawAll() {
      contours(canvas, seedText, { alphaScale: parseFloat(css("--contour-dim", "0.5")) });
      contours(lit, seedText, { alphaScale: parseFloat(css("--contour-lit", "1.8")) });
    }
    window.addEventListener("pointermove", (event) => {
      lit.style.setProperty("--lit-x", `${event.clientX}px`);
      lit.style.setProperty("--lit-y", `${event.clientY}px`);
      document.body.classList.add("survey-lit");
    }, { passive: true });
    document.addEventListener("pointerleave", () => document.body.classList.remove("survey-lit"));
    window.addEventListener("terrain:seed", (event) => {
      const next = event.detail?.seed;
      if (next && next !== seedText) { seedText = next; drawAll(); }
    });
    window.addEventListener("resize", debounce(drawAll), { passive: true });
    window.addEventListener("portfolio:theme-changed", drawAll);
    document.fonts?.ready.then(drawAll);
    drawAll();
  }

  /* --------------------------------------------------------------- FIELD */
  function field() {
    const hero = document.getElementById("home");
    let w = 0, h = 0, context = null, parts = [], t = 0;
    const mouse = { x: -1e4, y: -1e4 };
    const r = rng(2340);
    const n = noise2D(2340);

    function size() {
      ({ context, w, h } = fit(canvas));
      context.fillStyle = `rgb(${css("--field-bg", "16, 18, 28")})`;
      context.fillRect(0, 0, w, h);
      parts = Array.from({ length: Math.round((w * h) / 2000) }, () => ({ x: r() * w, y: r() * h, life: r() * 200 }));
    }
    function step() {
      context.fillStyle = `rgba(${css("--field-bg", "16, 18, 28")}, 0.06)`;
      context.fillRect(0, 0, w, h);
      context.strokeStyle = `rgba(${css("--field-line", "124, 140, 255")}, 0.5)`;
      context.lineWidth = 1;
      context.beginPath();
      for (const p of parts) {
        let angle = n(p.x * 0.0028, p.y * 0.0028 + t * 0.0004) * Math.PI * 4;
        const dx = p.x - mouse.x, dy = p.y - mouse.y, d2 = dx * dx + dy * dy;
        if (d2 < 36000) angle += Math.atan2(dy, dx) + (Math.PI / 2) * (1 - d2 / 36000);
        const nx = p.x + Math.cos(angle) * 1.4, ny = p.y + Math.sin(angle) * 1.4;
        context.moveTo(p.x, p.y);
        context.lineTo(nx, ny);
        p.x = nx; p.y = ny;
        if (--p.life < 0 || nx < 0 || nx > w || ny < 0 || ny > h) { p.x = r() * w; p.y = r() * h; p.life = 120 + r() * 200; }
      }
      context.stroke();
      t++;
    }
    function settle() { size(); for (let i = 0; i < 240; i++) step(); }

    let visible = true, frame = null;
    function loop() {
      frame = null;
      if (!visible || document.hidden || still()) return;
      step();
      frame = requestAnimationFrame(loop);
    }
    const kick = () => { if (!frame && visible && !still()) frame = requestAnimationFrame(loop); };

    new IntersectionObserver((entries) => { visible = entries.some((e) => e.isIntersecting); kick(); }).observe(hero);
    hero.addEventListener("pointermove", (event) => {
      const box = canvas.getBoundingClientRect();
      mouse.x = event.clientX - box.left;
      mouse.y = event.clientY - box.top;
    }, { passive: true });
    hero.addEventListener("pointerleave", () => { mouse.x = mouse.y = -1e4; });
    document.addEventListener("visibilitychange", kick);
    window.addEventListener("portfolio:preferences-changed", () => { if (still()) settle(); kick(); });
    window.addEventListener("portfolio:theme-changed", settle);
    window.addEventListener("resize", debounce(() => { settle(); kick(); }), { passive: true });
    settle();
    kick();
  }

  ({ mist, survey, field }[style] || (() => {}))();
})();
