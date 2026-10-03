/*
===============================================================================
PLAYGROUND TERRAIN — terrain.js (explorations/v2)
===============================================================================

A seeded heightfield drawn as a perspective wireframe on a 2D canvas.

1. The seed text is hashed to an integer and feeds a small PRNG (mulberry32).
2. Value noise (smoothstep-interpolated random lattice) is summed over five
   octaves (fBm). "Roughness" sets how much each finer octave contributes.
3. "Irregularity" domain-warps the sample position with a second noise field,
   which bends ridges so they stop looking like a regular grid.
4. A radial falloff lowers the edges so the land reads as an island of terrain.
5. Each grid point is rotated by an orbit camera (yaw/pitch), projected with a
   simple perspective divide, and joined into row and column polylines.

Colors come from CSS tokens on <html>: --terrain-line ("r, g, b"),
--terrain-accent and --terrain-axis-x/y/z. Auto-rotation stops for reduced
motion, when site motion is off, and while the canvas is off screen.
*/
(function () {
  const canvas = document.getElementById("terrain-canvas");
  if (!canvas) return;
  const context = canvas.getContext("2d");
  const rootEl = document.documentElement;
  const form = document.getElementById("seed-form");
  const ui = {
    seed: document.getElementById("seed-input"),
    rough: document.getElementById("terrain-rough"),
    height: document.getElementById("terrain-height"),
    irr: document.getElementById("terrain-irr")
  };
  const hud = document.getElementById("terrain-hud");
  const gizmo = document.getElementById("terrain-gizmo");
  const reduceQuery = matchMedia("(prefers-reduced-motion: reduce)");

  const motionAllowed = () => !reduceQuery.matches && rootEl.dataset.motion !== "off";

  function hash(text) {
    let h = 2166136261;
    for (const ch of text) { h ^= ch.charCodeAt(0); h = Math.imul(h, 16777619); }
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
  function makeNoise(seed) {
    const random = rng(seed);
    const lattice = Float32Array.from({ length: 256 * 256 }, random);
    const at = (x, y) => lattice[((y & 255) << 8) | (x & 255)];
    return (x, y) => {
      const xi = Math.floor(x), yi = Math.floor(y), fx = x - xi, fy = y - yi;
      const sx = fx * fx * (3 - 2 * fx), sy = fy * fy * (3 - 2 * fy);
      const top = at(xi, yi) + (at(xi + 1, yi) - at(xi, yi)) * sx;
      const bottom = at(xi, yi + 1) + (at(xi + 1, yi + 1) - at(xi, yi + 1)) * sx;
      return top + (bottom - top) * sy;
    };
  }

  const G = 64;
  const heights = new Float32Array(G * G);
  let palette = null;

  function readPalette() {
    const style = getComputedStyle(rootEl);
    const token = (name, fallback) => style.getPropertyValue(name).trim() || fallback;
    palette = {
      line: token("--terrain-line", "216, 236, 242"),
      accent: token("--terrain-accent", "#64e5ff"),
      x: token("--terrain-axis-x", "#e5484d"),
      y: token("--terrain-axis-y", "#46a758"),
      z: token("--terrain-axis-z", "#3e8fe0"),
      font: token("--terrain-font", "JetBrains Mono, monospace")
    };
  }

  function seedText() { return (ui.seed.value || "").trim() || "wabi-sabi"; }

  function rebuild() {
    const text = seedText();
    const n = makeNoise(hash(text));
    const warp = makeNoise(hash(text + "#warp"));
    const rough = +ui.rough.value / 10;
    const irr = +ui.irr.value / 10;
    for (let j = 0; j < G; j++) {
      for (let i = 0; i < G; i++) {
        const wx = i + (warp(i * 0.05, j * 0.05) - 0.5) * 18 * irr;
        const wy = j + (warp(i * 0.05 + 9, j * 0.05 + 9) - 0.5) * 18 * irr;
        let value = 0, amp = 1, freq = 0.035, total = 0;
        for (let octave = 0; octave < 5; octave++) {
          value += amp * n(wx * freq, wy * freq);
          total += amp;
          amp *= 0.3 + rough * 0.45;
          freq *= 2;
        }
        value /= total;
        const dx = i / (G - 1) - 0.5, dy = j / (G - 1) - 0.5;
        const falloff = 1 - Math.min(1, Math.hypot(dx, dy) * 1.5);
        heights[j * G + i] = Math.pow(value, 1.6) * (0.4 + falloff * 0.9);
      }
    }
    if (hud) hud.textContent = `${G}×${G} grid · seed “${text}”`;
    window.dispatchEvent(new CustomEvent("terrain:seed", { detail: { seed: text } }));
    draw();
  }

  let yaw = -0.7, pitch = 0.62, dragging = false, lastX = 0, lastY = 0, userMoved = false;

  canvas.addEventListener("pointerdown", (event) => {
    dragging = true; userMoved = true;
    lastX = event.clientX; lastY = event.clientY;
    canvas.setPointerCapture(event.pointerId);
  });
  canvas.addEventListener("pointermove", (event) => {
    if (!dragging) return;
    yaw += (event.clientX - lastX) * 0.006;
    pitch = Math.max(0.25, Math.min(1.25, pitch + (event.clientY - lastY) * 0.004));
    lastX = event.clientX; lastY = event.clientY;
    draw();
  });
  const endDrag = () => { dragging = false; };
  canvas.addEventListener("pointerup", endDrag);
  canvas.addEventListener("pointercancel", endDrag);

  /* Keyboard orbit for people who can't drag: arrows when the canvas has focus. */
  canvas.tabIndex = 0;
  canvas.addEventListener("keydown", (event) => {
    const step = { ArrowLeft: [-0.12, 0], ArrowRight: [0.12, 0], ArrowUp: [0, -0.06], ArrowDown: [0, 0.06] }[event.key];
    if (!step) return;
    event.preventDefault();
    userMoved = true;
    yaw += step[0];
    pitch = Math.max(0.25, Math.min(1.25, pitch + step[1]));
    draw();
  });

  function draw() {
    if (!palette) readPalette();
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    const w = canvas.clientWidth, h = canvas.clientHeight;
    if (!w || !h) return;
    if (canvas.width !== Math.round(w * dpr) || canvas.height !== Math.round(h * dpr)) {
      canvas.width = Math.round(w * dpr);
      canvas.height = Math.round(h * dpr);
    }
    context.setTransform(dpr, 0, 0, dpr, 0, 0);
    context.clearRect(0, 0, w, h);

    const hs = +ui.height.value / 10;
    const scale = Math.min(w, h * 1.5) * 0.92;
    const cy = Math.cos(yaw), sy = Math.sin(yaw), cp = Math.cos(pitch), sp = Math.sin(pitch);
    const ox = w * 0.5, oy = h * 0.66;
    const project = (i, j) => {
      const x = i / (G - 1) - 0.5, z = j / (G - 1) - 0.5, y = heights[j * G + i] * 0.95 * hs;
      const rx = x * cy - z * sy, rz = x * sy + z * cy;
      const py = y * cp - rz * sp, pz = y * sp + rz * cp;
      const persp = 1.6 / (1.9 - pz);
      return [ox + rx * scale * persp, oy - py * scale * persp, pz];
    };

    context.lineWidth = 1;
    for (let pass = 0; pass < 2; pass++) {
      for (let a = 0; a < G; a++) {
        context.beginPath();
        for (let b = 0; b < G; b++) {
          const [px, py] = pass ? project(a, b) : project(b, a);
          if (b) context.lineTo(px, py); else context.moveTo(px, py);
        }
        const depth = (pass ? project(a, G >> 1) : project(G >> 1, a))[2];
        context.strokeStyle = `rgba(${palette.line}, ${0.1 + Math.max(0, depth + 0.5) * 0.34})`;
        context.stroke();
      }
    }

    let peak = 0;
    for (let k = 1; k < heights.length; k++) if (heights[k] > heights[peak]) peak = k;
    const [mx, my] = project(peak % G, (peak / G) | 0);
    context.strokeStyle = palette.accent;
    context.lineWidth = 1.5;
    context.strokeRect(mx - 7, my - 7, 14, 14);
    context.fillStyle = palette.accent;
    context.font = `11px ${palette.font}`;
    context.fillText("peak", mx + 11, my + 4);

    if (gizmo) {
      const axis = (x, y, z, color, label) => {
        const rx = x * cy - z * sy, rz = x * sy + z * cy, py = y * cp - rz * sp;
        return `<line x1="30" y1="30" x2="${30 + rx * 20}" y2="${30 - py * 20}" stroke="${color}" stroke-width="2"/>` +
          `<text x="${30 + rx * 25 - 3}" y="${30 - py * 25 + 4}" fill="${color}" font-size="9" font-family="monospace">${label}</text>`;
      };
      gizmo.innerHTML = axis(1, 0, 0, palette.x, "X") + axis(0, 0, 1, palette.y, "Y") + axis(0, 1, 0, palette.z, "Z");
    }
  }

  /* Animation: slow auto-orbit until the visitor drags, only while visible. */
  let visible = false, frame = null;
  function loop() {
    frame = null;
    if (!visible || document.hidden || !motionAllowed()) return;
    if (!userMoved) yaw += 0.0016;
    draw();
    frame = requestAnimationFrame(loop);
  }
  function kick() { if (!frame && visible && motionAllowed()) frame = requestAnimationFrame(loop); }

  new IntersectionObserver((entries) => {
    visible = entries.some((entry) => entry.isIntersecting);
    if (visible) { draw(); kick(); }
  }).observe(canvas);

  document.addEventListener("visibilitychange", kick);
  window.addEventListener("portfolio:preferences-changed", () => { draw(); kick(); });
  window.addEventListener("portfolio:theme-changed", () => { readPalette(); draw(); });
  window.addEventListener("resize", draw, { passive: true });

  [ui.rough, ui.height, ui.irr].forEach((input) => input.addEventListener("input", rebuild));
  /* enhancements.js also listens for this submit and calls its (now inert) drawSeed. */
  form?.addEventListener("submit", (event) => { event.preventDefault(); rebuild(); });

  const WORDS = ["moss", "ridge", "basalt", "fog", "kiln", "tide", "lichen", "cedar", "ember", "drift", "scree", "delta"];
  document.getElementById("terrain-random")?.addEventListener("click", () => {
    const pick = WORDS[Math.floor(Math.random() * WORDS.length)];
    ui.seed.value = `${pick}-${Math.floor(Math.random() * 900 + 100)}`;
    rebuild();
  });

  document.fonts?.ready.then(() => { readPalette(); draw(); });
  rebuild();
})();
