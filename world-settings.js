/*
===============================================================================
WORLD CONTROLS — world-settings.js
===============================================================================

Extra parameters in the settings dialog for playing with the page:
world seed, mountain height, contour detail, stars, nebula, time of day,
cursor glow, card flash, particle speed, background transition speed, fog
reveal, faded screen edges, shooting stars, content backdrop and interface
size.

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
  /* The single place the site's visual defaults are defined. */
  const DEFAULTS = {
    seed: "hello-world",
    mountainHeight: 100,  // % of the designed ridge height
    contourDetail: 14,    // number of contour levels in the map
    stars: 150,           // % of the base star count in the night sky
    nebula: 120,          // % nebula strength above the mountains (0 = off)
    followScroll: true,   // moon and glow follow page progress
    timeOfDay: 50,        // 0 dawn … 100 sunset, used when not following scroll
    cursorGlow: 100,      // % size and brightness of the cursor glow (0 = off)
    flash: 100,           // % card entry-flash strength (0 = off); 100 = 0.75 of the original
    moteSpeed: 140,       // % particle speed (0 = still)
    transitionMs: 1000,   // background transition length between sections
    fogReveal: true,
    edgeFade: true,
    meteors: true,        // shooting stars over the sea
    backdrop: 50,         // % opacity of the panel behind the content (0 = off)
    uiScale: 90           // % content size on larger screens (75–105)
  };
  /* Defaults that changed after visitors may have saved them. A saved value
     equal to an old default is treated as "never chosen" and dropped. */
  const OLD_DEFAULTS = { transitionMs: [1500, 2500], uiScale: [75, 82, 85], stars: [100] };
  const SEED_WORDS = ["moss", "ridge", "basalt", "fog", "kiln", "tide", "lichen", "cedar", "ember", "drift", "scree", "delta"];

  function load() {
    try {
      const saved = JSON.parse(localStorage.getItem(STORAGE_KEY) || "{}");
      Object.entries(OLD_DEFAULTS).forEach(([key, old]) => { if (old.includes(saved[key])) delete saved[key]; });
      /* ignore keys that are no longer settings (e.g. the old cursorLight) */
      Object.keys(saved).forEach((key) => { if (!(key in DEFAULTS)) delete saved[key]; });
      return { ...DEFAULTS, ...saved };
    } catch (error) { return { ...DEFAULTS }; }
  }
  const values = load();
  /* Only values that differ from the defaults are stored, so a later change
     to a default reaches visitors who never touched that control. */
  function save() {
    const changed = Object.fromEntries(Object.entries(values).filter(([key, value]) => value !== DEFAULTS[key]));
    try { localStorage.setItem(STORAGE_KEY, JSON.stringify(changed)); } catch (error) {}
  }

  /* The public object other scripts read. Percentages are exposed as factors. */
  const world = {
    get seed() { return values.seed; },
    get mountainScale() { return values.mountainHeight / 100; },
    get contourLevels() { return values.contourDetail; },
    get starScale() { return values.stars / 100; },
    get nebulaScale() { return values.nebula / 100; },
    get meteors() { return values.meteors; },
    get uiScale() { return values.uiScale / 100; },
    get backdrop() { return values.backdrop / 100; },
    get followScroll() { return values.followScroll; },
    get timeOfDay() { return values.timeOfDay / 100; },
    get cursorGlow() { return values.cursorGlow / 100; },
    get flash() { return values.flash / 100; },
    get moteSpeed() { return values.moteSpeed / 100; },
    get transitionMs() { return values.transitionMs; }
  };
  window.PORTFOLIO_WORLD = world;

  const rootEl = document.documentElement;
  function applyDocument() {
    rootEl.classList.toggle("no-fog", !values.fogReveal);
    rootEl.classList.toggle("no-edge-fade", !values.edgeFade);
    rootEl.style.setProperty("--cursor-glow", String(values.cursorGlow / 100));
    rootEl.classList.toggle("no-cursor-glow", values.cursorGlow === 0);
    rootEl.style.setProperty("--flash", String(0.75 * values.flash / 100));
    rootEl.style.setProperty("--ui-scale", String(values.uiScale / 100));
    rootEl.style.setProperty("--backdrop", String(values.backdrop / 100));
    rootEl.classList.toggle("no-backdrop", values.backdrop === 0);
  }

  const TIME_NAMES = [[0.1, "dawn"], [0.35, "morning"], [0.65, "night"], [0.9, "evening"], [1.01, "sunset"]];
  const percentOrOff = (v) => (v === 0 ? "off" : `${v}%`);
  const format = {
    mountainHeight: (v) => `${v}%`,
    contourDetail: (v) => `${v}`,
    stars: percentOrOff,
    nebula: percentOrOff,
    timeOfDay: (v) => TIME_NAMES.find(([limit]) => v / 100 < limit)[1],
    cursorGlow: percentOrOff,
    flash: percentOrOff,
    moteSpeed: (v) => (v === 0 ? "still" : `${v}%`),
    transitionMs: (v) => `${(v / 1000).toFixed(1)}s`,
    backdrop: percentOrOff,
    uiScale: (v) => `${v}%`
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

  /* A new interface size moves every section, so after the slider settles,
     fire a resize: the landscape re-measures its biome zones and canvases,
     the terrain and particles resize. */
  let relayoutTimer;
  function relayout() {
    clearTimeout(relayoutTimer);
    relayoutTimer = setTimeout(() => window.dispatchEvent(new Event("resize")), 150);
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
      if (key === "uiScale") relayout();
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
    relayout();
    if (seedChanged) applySeed(DEFAULTS.seed);
  });

  applyDocument();
  syncControls();
})();
