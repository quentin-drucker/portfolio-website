/*
===============================================================================
WORLD CONTROLS — world-settings.js
===============================================================================

Extra parameters in the settings dialog for playing with the page:
world seed, mountain height, contour detail, stars, time of day, cursor light,
particle speed, biome transition speed, fog reveal and faded screen edges.

- Values live in window.PORTFOLIO_WORLD (read by landscape.js, terrain via
  the shared seed, and script.js for particle speed).
- They are saved per visitor in localStorage ("quentin-world-settings"); the
  page works the same if storage is unavailable.
- Each change fires "portfolio:world-changed" with { key } so only the
  affected layer redraws.
- Controls are bound by data attributes in the dialog markup:
    data-world="<key>"        input (range, checkbox or text)
    data-world-out="<key>"    <output> showing the formatted value
    data-world-shuffle        button that picks a new seed

Runs before terrain.js and landscape.js (script order in the HTML), so the
saved seed is in place before either draws.
*/
(function () {
  const STORAGE_KEY = "quentin-world-settings";
  const DEFAULTS = {
    seed: "wabi-sabi",
    mountainHeight: 100,  // % of the designed ridge height
    contourDetail: 14,    // number of contour levels in the sky map
    stars: 100,           // % of the designed star count
    followScroll: true,   // moon and glow follow page progress
    timeOfDay: 50,        // 0 dawn … 100 sunset, used when not following scroll
    cursorLight: 240,     // radius in px of the lit contour circle; 0 = off
    moteSpeed: 100,       // % particle speed
    transitionMs: 1500,   // biome transition length
    fogReveal: true,
    edgeFade: true
  };
  const SEED_WORDS = ["moss", "ridge", "basalt", "fog", "kiln", "tide", "lichen", "cedar", "ember", "drift", "scree", "delta"];

  function load() {
    try { return { ...DEFAULTS, ...JSON.parse(localStorage.getItem(STORAGE_KEY) || "{}") }; }
    catch (error) { return { ...DEFAULTS }; }
  }
  const values = load();
  function save() {
    try { localStorage.setItem(STORAGE_KEY, JSON.stringify(values)); } catch (error) {}
  }

  /* The public object other scripts read. moteSpeed is exposed as a factor. */
  const world = {
    get seed() { return values.seed; },
    get mountainScale() { return values.mountainHeight / 100; },
    get contourLevels() { return values.contourDetail; },
    get starScale() { return values.stars / 100; },
    get followScroll() { return values.followScroll; },
    get timeOfDay() { return values.timeOfDay / 100; },
    get cursorLight() { return values.cursorLight; },
    get moteSpeed() { return values.moteSpeed / 100; },
    get transitionMs() { return values.transitionMs; }
  };
  window.PORTFOLIO_WORLD = world;

  const rootEl = document.documentElement;
  function applyDocument() {
    rootEl.classList.toggle("no-fog", !values.fogReveal);
    rootEl.classList.toggle("no-edge-fade", !values.edgeFade);
    rootEl.style.setProperty("--lit-r", `${values.cursorLight}px`);
    rootEl.classList.toggle("no-cursor-light", values.cursorLight === 0);
  }

  const TIME_NAMES = [[0.1, "dawn"], [0.35, "morning"], [0.65, "night"], [0.9, "evening"], [1.01, "sunset"]];
  const format = {
    mountainHeight: (v) => `${v}%`,
    contourDetail: (v) => `${v}`,
    stars: (v) => `${v}%`,
    timeOfDay: (v) => TIME_NAMES.find(([limit]) => v / 100 < limit)[1],
    cursorLight: (v) => (v === 0 ? "off" : `${v}px`),
    moteSpeed: (v) => `${v}%`,
    transitionMs: (v) => `${(v / 1000).toFixed(1)}s`
  };

  const controls = [...document.querySelectorAll("[data-world]")];
  function syncControls() {
    controls.forEach((input) => {
      const key = input.dataset.world;
      if (input.type === "checkbox") input.checked = Boolean(values[key]);
      else input.value = values[key];
    });
    document.querySelectorAll("[data-world-out]").forEach((out) => {
      const key = out.dataset.worldOut;
      out.textContent = format[key] ? format[key](values[key]) : values[key];
    });
    const time = document.querySelector('[data-world="timeOfDay"]');
    if (time) {
      time.disabled = values.followScroll;
      time.closest(".range-setting")?.classList.toggle("is-disabled", values.followScroll);
    }
  }

  function announce(key) {
    window.dispatchEvent(new CustomEvent("portfolio:world-changed", { detail: { key } }));
  }

  /* Seed: shared with the Playground. If the Playground is on this page, set
     its input and let terrain.js rebuild (it fires "terrain:seed", which the
     landscape listens to); otherwise fire the seed event directly. */
  const playgroundSeed = document.getElementById("seed-input");
  if (playgroundSeed) playgroundSeed.value = values.seed;
  function applySeed(seed) {
    const clean = String(seed || "").trim().slice(0, 24) || DEFAULTS.seed;
    values.seed = clean;
    save();
    syncControls();
    if (playgroundSeed) {
      playgroundSeed.value = clean;
      document.getElementById("seed-form")?.requestSubmit();
    } else {
      window.dispatchEvent(new CustomEvent("terrain:seed", { detail: { seed: clean } }));
    }
  }
  /* Keep the dialog in sync when the seed is changed from the Playground. */
  window.addEventListener("terrain:seed", (event) => {
    const seed = event.detail?.seed;
    if (seed && seed !== values.seed) { values.seed = seed; save(); syncControls(); }
  });

  controls.forEach((input) => {
    const key = input.dataset.world;
    if (key === "seed") {
      input.addEventListener("change", () => applySeed(input.value));
      input.addEventListener("keydown", (event) => { if (event.key === "Enter") { event.preventDefault(); applySeed(input.value); } });
      return;
    }
    input.addEventListener("input", () => {
      values[key] = input.type === "checkbox" ? input.checked : Number(input.value);
      save();
      syncControls();
      applyDocument();
      announce(key);
    });
  });

  document.querySelector("[data-world-shuffle]")?.addEventListener("click", () => {
    const word = SEED_WORDS[Math.floor(Math.random() * SEED_WORDS.length)];
    applySeed(`${word}-${Math.floor(Math.random() * 900 + 100)}`);
  });

  /* "Restore defaults" in the dialog resets these too. */
  document.getElementById("settings-reset")?.addEventListener("click", () => {
    const seedChanged = values.seed !== DEFAULTS.seed;
    Object.assign(values, DEFAULTS);
    save();
    syncControls();
    applyDocument();
    announce("all");
    if (seedChanged) applySeed(DEFAULTS.seed);
  });

  applyDocument();
  syncControls();
})();
