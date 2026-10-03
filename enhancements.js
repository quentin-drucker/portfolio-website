/*
===============================================================================
SECOND-PASS FEATURE LAYER — enhancements.js
===============================================================================

This file extends the working foundation in script.js without replacing it.

It reads:
- window.PORTFOLIO_ENHANCEMENTS from config.js
- the semantic containers added to index.html
- CSS classes defined in enhancements.css

Its responsibilities are:
- intro-loader status sequence
- rotating hero interest
- pointer-reactive vision overlay
- magnetic movement on prominent links/buttons
- project category filters
- project detail dialog and comparison slider
- command palette and keyboard commands
- effects settings saved in localStorage
- desktop section rail and back-to-top progress
- deterministic procedural seed canvas
- keyboard navigation shortcuts

This file intentionally has no module bundler and exports nothing. It runs in the
browser's global document context after the deferred base script has executed.

Section order (shortcut keys 1–7): Home, What I work on, Projects,
Playground, About, Résumé, Contact. On pages without those sections (e.g.
sip.html), section commands and keys open them on the home page instead.
*/
const RESUME_URL = "resume.html";

/*
  Read enhancement data with a safe fallback. A missing config file would leave
  features empty rather than causing an immediate undefined-variable error.
*/
const ENH = window.PORTFOLIO_ENHANCEMENTS || { interests: [], projectDetails: [] };

const enhRoot = document.documentElement;
const enhBody = document.body;
const prefersReduced = window.matchMedia("(prefers-reduced-motion: reduce)");
const coarsePointer = window.matchMedia("(pointer: coarse)");

/*
  Element registry:
  These are the enhancement-specific DOM hooks. Optional chaining is used later
  so individual features can fail gracefully if a corresponding element is absent.
*/
const enh = {
  loader: document.querySelector("#intro-loader"),
  loaderMessage: document.querySelector("#loader-message"),
  skipLoader: document.querySelector("#skip-loader"),
  rotatingInterest: document.querySelector("#rotating-interest"),
  visionStage: document.querySelector(".vision-stage"),
  visionCursor: document.querySelector("#vision-cursor"),
  visionCoordinate: document.querySelector("#vision-coordinate"),
  filters: document.querySelector("#project-filters"),
  projectDialog: document.querySelector("#project-dialog"),
  projectContent: document.querySelector("#project-dialog-content"),
  commandDialog: document.querySelector("#command-dialog"),
  commandInput: document.querySelector("#command-input"),
  commandResults: document.querySelector("#command-results"),
  settingsDialog: document.querySelector("#settings-dialog"),
  backToTop: document.querySelector("#back-to-top"),
  backProgress: document.querySelector(".back-progress"),
  seedForm: document.querySelector("#seed-form"),
  seedInput: document.querySelector("#seed-input"),
  seedCanvas: document.querySelector("#seed-canvas"),
  effectsToggle: document.querySelector("#effects-toggle"),
  effectsStatus: document.querySelector("#effects-status"),
  densityGroup: document.querySelector("#density-group"),
  density: document.querySelector("#particle-density"),
  densityValue: document.querySelector("#particle-density-value"),
  settingsReset: document.querySelector("#settings-reset")
};

/*
  The public settings intentionally contain only two values:
  - effectsEnabled: all decorative motion/interactivity on or off
  - particleDensity: number of background motes, expressed as 0–100

  Older saved settings are migrated below so visitors do not need to clear
  localStorage after upgrading from the previous Full/Reduced/Off panel.
*/
const defaultPrefs = {
  effectsEnabled: true,
  particleDensity: 70
};

function clampDensity(value) {
  const numericValue = Number(value);
  if (!Number.isFinite(numericValue)) return defaultPrefs.particleDensity;
  return Math.max(0, Math.min(100, Math.round(numericValue / 10) * 10));
}

/*
  Loads and normalizes preferences.

  Migration rules:
  - old motion:"off" becomes effectsEnabled:false
  - old motion:"full" or "reduced" becomes effectsEnabled:true
  - old sound, tilt, and contrast keys are discarded
*/
function loadEnhPrefs() {
  try {
    const saved = JSON.parse(
      localStorage.getItem("portfolio-enhancement-preferences") || "{}"
    );

    const effectsEnabled =
      typeof saved.effectsEnabled === "boolean"
        ? saved.effectsEnabled
        : saved.motion !== "off";

    return {
      effectsEnabled,
      particleDensity: clampDensity(saved.particleDensity)
    };
  } catch {
    return { ...defaultPrefs };
  }
}

let enhPrefs = loadEnhPrefs();

function saveEnhPrefs() {
  localStorage.setItem(
    "portfolio-enhancement-preferences",
    JSON.stringify(enhPrefs)
  );
}

/*
  Applies preferences to the document and settings controls.

  The operating-system reduced-motion preference is not overridden. When it is
  active, the status text explains that the browser will limit motion even if
  the site-level switch is enabled.
*/
function applyEnhPrefs() {
  const enabled = Boolean(enhPrefs.effectsEnabled);

  enhRoot.dataset.motion = enabled ? "full" : "off";
  if (enh.effectsToggle) {
    enh.effectsToggle.checked = enabled;
    enh.effectsToggle.setAttribute("aria-checked", String(enabled));
  }

  if (enh.density) {
    enh.density.value = String(enhPrefs.particleDensity);
    enh.density.disabled = !enabled;
  }

  if (enh.densityValue) {
    enh.densityValue.value = `${enhPrefs.particleDensity}%`;
    enh.densityValue.textContent = `${enhPrefs.particleDensity}%`;
  }

  enh.densityGroup?.classList.toggle("is-disabled", !enabled);

  if (enh.effectsStatus) {
    if (!enabled) {
      enh.effectsStatus.textContent =
        "Motion effects are disabled. Your density setting is retained.";
    } else if (prefersReduced.matches) {
      enh.effectsStatus.textContent =
        "Effects are enabled, but motion is limited by your system preference.";
    } else {
      enh.effectsStatus.textContent = "Motion effects are enabled.";
    }
  }
}

function notifyBaseEffects() {
  window.dispatchEvent(new Event("portfolio:preferences-changed"));
}

/*
  Re-save immediately so an older Full/Reduced/Off preference object is reduced
  to the current two supported keys.
*/
saveEnhPrefs();
applyEnhPrefs();
notifyBaseEffects();

/*
  Shared dialog helpers:
  showModal() activates the native modal state and backdrop. The body class is
  used to prevent page scrolling behind the open dialog.
*/
function openEnhDialog(dialog) {
  if (!dialog || dialog.open) return;
  dialog.showModal();
  enhBody.classList.add("dialog-open");
}

function closeEnhDialog(dialog) {
  if (!dialog || !dialog.open) return;
  dialog.close();
  enhBody.classList.remove("dialog-open");
}

document.querySelector(".command-trigger")?.addEventListener("click", openCommandPalette);
document.querySelectorAll(".settings-trigger").forEach((button) => {
  button.addEventListener("click", () => {
    applyEnhPrefs();
    openEnhDialog(enh.settingsDialog);
  });
});

document.querySelectorAll("[data-close-dialog]").forEach((button) => {
  button.addEventListener("click", () => closeEnhDialog(button.closest("dialog")));
});

[enh.projectDialog, enh.commandDialog, enh.settingsDialog].forEach((dialog) => {
  dialog?.addEventListener("click", (event) => {
    if (event.target === dialog) closeEnhDialog(dialog);
  });

  /*
    The native <dialog> Escape key closes the dialog without calling
    closeEnhDialog, leaving body.dialog-open applied. The close event fires
    for every close path (Escape, .close(), closeEnhDialog), so removing the
    class here covers all cases.
  */
  dialog?.addEventListener("close", () => {
    enhBody.classList.remove("dialog-open");
  });
});

/* Loader */
/*
  Intro loader:
  The short message sequence runs once per browser tab/session. The loader can
  be skipped and is automatically bypassed when motion is disabled.
*/
const loaderMessages = [
  "Initializing visual system…",
  "Loading project interactions…",
  "Preparing particle field…",
  "Ready."
];

function hideLoader() {
  enh.loader?.classList.add("hidden");
  sessionStorage.setItem("portfolio-loader-seen", "true");
}

if (sessionStorage.getItem("portfolio-loader-seen") === "true" || !enhPrefs.effectsEnabled) {
  hideLoader();
} else {
  let loaderIndex = 0;
  const loaderTimer = setInterval(() => {
    loaderIndex += 1;
    if (enh.loaderMessage) enh.loaderMessage.textContent = loaderMessages[Math.min(loaderIndex, loaderMessages.length - 1)];
    if (loaderIndex >= loaderMessages.length - 1) {
      clearInterval(loaderTimer);
      setTimeout(hideLoader, 250);
    }
  }, 270);
}
enh.skipLoader?.addEventListener("click", hideLoader);

/* Rotating interest */
/*
  Rotating interest label:
  A timer updates only the text node. CSS supplies the blur/vertical transition.
*/
let interestIndex = 0;
setInterval(() => {
  if (!enh.rotatingInterest || !enhPrefs.effectsEnabled || document.hidden || ENH.interests.length < 2) return;
  enh.rotatingInterest.classList.remove("swap");
  void enh.rotatingInterest.offsetWidth;
  enh.rotatingInterest.classList.add("swap");
  setTimeout(() => {
    interestIndex = (interestIndex + 1) % ENH.interests.length;
    enh.rotatingInterest.textContent = ENH.interests[interestIndex];
  }, 240);
}, 3000);

/* Hero vision overlay */
/*
  Visual-computing overlay:
  Pointer coordinates are converted from viewport space into local panel space,
  then used to reposition the decorative detection box.
*/
enh.visionStage?.addEventListener("pointermove", (event) => {
  const box = enh.visionStage.getBoundingClientRect();
  const x = Math.max(0, Math.min(box.width, event.clientX - box.left));
  const y = Math.max(0, Math.min(box.height, event.clientY - box.top));
  enh.visionCursor.style.left = `${x}px`;
  enh.visionCursor.style.top = `${y}px`;
  enh.visionCoordinate.textContent = `${Math.round(x)}, ${Math.round(y)}`;
});

/* Magnetic buttons */
/*
  Magnetic controls:
  The pointer offset from an element's center is scaled down to a few pixels.
  Coarse pointers and disabled motion skip the effect.
*/
document.querySelectorAll(".button, .brand, .text-link").forEach((element) => {
  element.classList.add("magnetic");
  element.addEventListener("pointermove", (event) => {
    if (!enhPrefs.effectsEnabled || coarsePointer.matches) return;
    const box = element.getBoundingClientRect();
    const x = event.clientX - box.left - box.width / 2;
    const y = event.clientY - box.top - box.height / 2;
    element.style.transform = `translate(${x * 0.07}px, ${y * 0.07}px)`;
  });
  element.addEventListener("pointerleave", () => {
    element.style.transform = "";
  });
});

/* Project filters */
/*
  Project filtering:
  Each button's data-filter value is compared with each card's
  data-project-category. aria-pressed communicates which filter is active.
  v2: a card may list several space-separated categories.
*/
enh.filters?.addEventListener("click", (event) => {
  const button = event.target.closest("[data-filter]");
  if (!button) return;

  const filter = button.dataset.filter;
  enh.filters.querySelectorAll("[data-filter]").forEach((item) => {
    item.setAttribute("aria-pressed", String(item === button));
  });

  document.querySelectorAll(".project-card").forEach((card) => {
    const categories = (card.dataset.projectCategory || "").split(/\s+/);
    card.classList.toggle("is-filtered", filter !== "all" && !categories.includes(filter));
  });
});

/* Project detail modal */
document.querySelectorAll(".project-detail-trigger").forEach((button, index) => {
  button.addEventListener("click", () => openProjectDetail(index));
});

/*
  Builds the project modal from config.js data.

  The optional comparison block uses a CSS custom property (--compare) to set
  the visible width of the processed layer. Moving the range input updates only
  that property.
*/
function openProjectDetail(index) {
  const project = ENH.projectDetails[index];
  if (!project || !enh.projectContent) return;

  const comparison = project.comparison
    ? `
      <div class="compare-shell">
        <div class="compare-stage" style="--compare:52%">
          <div class="compare-before"></div>
          <div class="compare-after"></div>
        </div>
        <label class="sr-only" for="compare-range">Compare input and processed view</label>
        <input id="compare-range" class="compare-range" type="range" min="0" max="100" value="52" />
      </div>`
    : "";

  enh.projectContent.innerHTML = `
    <header class="project-detail-header">
      <span class="section-kicker">${project.type}</span>
      <h2 id="project-dialog-title">${project.title}</h2>
      <p>${project.summary}</p>
      <div class="tag-list">${project.tags.map((tag) => `<span>${tag}</span>`).join("")}</div>
    </header>
    <div class="project-detail-grid">
      <article class="project-detail-card"><span>My role</span><strong>${project.role}</strong></article>
      <article class="project-detail-card"><span>Result</span><strong>${project.result}</strong></article>
    </div>
    ${comparison}
    <div class="project-detail-actions">
      <a class="button button-primary" href="${project.caseStudy}">${project.caseStudyLabel || "Open case-study template"}</a>
    </div>
  `;

  enh.projectContent.querySelector("#compare-range")?.addEventListener("input", (event) => {
    enh.projectContent.querySelector(".compare-stage")?.style.setProperty("--compare", `${event.target.value}%`);
  });

  openEnhDialog(enh.projectDialog);
}

/* Command palette */
/*
  Command definitions:
  Each command is [label, description, icon, action]. Project commands are
  appended from config.js so the palette can open their detail dialogs.
*/
const commands = [
  ["Home", "Go to landing section", "1", () => goToSection("#home")],
  ["What I work on", "Areas of focus", "2", () => goToSection("#expertise")],
  ["Projects", "Browse projects", "3", () => goToSection("#projects")],
  ["Playground", "Generate a terrain", "4", () => goToSection("#playground")],
  ["About", "Go to About", "5", () => goToSection("#about")],
  ["Résumé summary", "Go to the résumé section", "6", () => goToSection("#resume")],
  ["Open résumé", "Open the full résumé page", "R", () => { window.location.href = RESUME_URL; }],
  ["Contact", "Go to contact section", "7", () => goToSection("#contact")],
  ["World controls", "Seed, mountains, stars, time of day, motion", "S", () => {
    closeEnhDialog(enh.commandDialog);
    applyEnhPrefs();
    openEnhDialog(enh.settingsDialog);
  }]
];

ENH.projectDetails.forEach((project, index) => {
  commands.push([project.title, project.type, "P", () => {
    closeEnhDialog(enh.commandDialog);
    openProjectDetail(index);
  }]);
});

let filteredCommands = commands;
let selectedCommand = 0;

function goToSection(selector) {
  closeEnhDialog(enh.commandDialog);
  const target = document.querySelector(selector);
  if (!target) {
    /* This page doesn't have that section (e.g. sip.html): open it on home. */
    window.location.href = `index.html${selector}`;
    return;
  }
  target.scrollIntoView({ behavior: !enhPrefs.effectsEnabled ? "auto" : "smooth" });
}

/*
  Filters commands using a case-insensitive text match, then rebuilds the list.
  aria-selected tracks the keyboard-highlighted result.
*/
function renderCommands(query = "") {
  const q = query.toLowerCase().trim();
  filteredCommands = commands.filter(([name, description]) =>
    `${name} ${description}`.toLowerCase().includes(q)
  );

  selectedCommand = filteredCommands.length
    ? Math.max(0, Math.min(selectedCommand, filteredCommands.length - 1))
    : 0;

  enh.commandResults.innerHTML = filteredCommands.map(([name, description, icon], index) => `
    <button class="command-item" type="button" data-command-index="${index}" role="option" aria-selected="${index === selectedCommand}">
      <i>${icon}</i><span><strong>${name}</strong><small>${description}</small></span><kbd>↵</kbd>
    </button>
  `).join("") || "<p>No matching commands.</p>";
}

/*
  Opens the native command dialog, renders the full command list, and moves
  focus into the search field after the dialog is visible.
*/
function openCommandPalette() {
  selectedCommand = 0;

  if (enh.commandInput) {
    enh.commandInput.value = "";
  }

  renderCommands("");
  openEnhDialog(enh.commandDialog);
  setTimeout(() => enh.commandInput?.focus(), 20);
}

enh.commandInput?.addEventListener("input", (event) => {
  selectedCommand = 0;
  renderCommands(event.target.value);
});

enh.commandResults?.addEventListener("click", (event) => {
  const item = event.target.closest("[data-command-index]");
  if (!item) return;
  filteredCommands[Number(item.dataset.commandIndex)]?.[3]();
});

enh.commandDialog?.addEventListener("keydown", (event) => {
  if (event.key === "ArrowDown") {
    event.preventDefault();
    selectedCommand = Math.min(selectedCommand + 1, filteredCommands.length - 1);
    renderCommands(enh.commandInput.value);
  } else if (event.key === "ArrowUp") {
    event.preventDefault();
    selectedCommand = Math.max(selectedCommand - 1, 0);
    renderCommands(enh.commandInput.value);
  } else if (event.key === "Enter" && filteredCommands[selectedCommand]) {
    event.preventDefault();
    filteredCommands[selectedCommand][3]();
  }
});

/* Settings */

/*
  The master switch changes every decorative motion system together. Turning
  effects off also clears any temporary inline transforms left by hover effects.
*/
enh.effectsToggle?.addEventListener("change", (event) => {
  enhPrefs.effectsEnabled = event.target.checked;
  saveEnhPrefs();
  applyEnhPrefs();

  if (!enhPrefs.effectsEnabled) {
    document
      .querySelectorAll(".magnetic, .project-card, .expertise-card, .fact-card")
      .forEach((element) => {
        element.style.transform = "";
      });
  }

  notifyBaseEffects();
});

/*
  The percentage readout updates on every slider movement. The canvas rebuild is
  scheduled once per animation frame so rapid dragging remains responsive.
*/
let densityUpdateFrame = null;

enh.density?.addEventListener("input", (event) => {
  enhPrefs.particleDensity = clampDensity(event.target.value);

  if (enh.densityValue) {
    enh.densityValue.value = `${enhPrefs.particleDensity}%`;
    enh.densityValue.textContent = `${enhPrefs.particleDensity}%`;
  }

  saveEnhPrefs();

  if (densityUpdateFrame) {
    cancelAnimationFrame(densityUpdateFrame);
  }

  densityUpdateFrame = requestAnimationFrame(() => {
    densityUpdateFrame = null;
    notifyBaseEffects();
  });
});

enh.settingsReset?.addEventListener("click", () => {
  enhPrefs = { ...defaultPrefs };
  saveEnhPrefs();
  applyEnhPrefs();
  notifyBaseEffects();
});

/*
  If the operating-system preference changes while the page is open, refresh the
  explanatory status without changing the visitor's saved site-level choice.
*/
prefersReduced.addEventListener?.("change", () => {
  applyEnhPrefs();
  notifyBaseEffects();
});

/* Back-to-top and side rail */
/*
  Secondary section navigation:
  A separate IntersectionObserver keeps the desktop side rail synchronized with
  the current content section.
*/
const sectionRailLinks = [...document.querySelectorAll(".section-rail a")];
const railObserver = new IntersectionObserver((entries) => {
  const active = entries.filter((entry) => entry.isIntersecting).sort((a, b) => b.intersectionRatio - a.intersectionRatio)[0];
  if (!active) return;
  sectionRailLinks.forEach((link) => link.classList.toggle("active", link.getAttribute("href") === `#${active.target.id}`));
}, { rootMargin: "-30% 0px -58% 0px", threshold: [0.05, 0.3] });

document.querySelectorAll("main section[id]").forEach((section) => railObserver.observe(section));

/*
  Back-to-top progress:
  The SVG circle circumference is 125.66. Adjusting stroke-dashoffset maps page
  progress onto the circular outline.
*/
function updateBackToTop() {
  const scrollable = Math.max(document.documentElement.scrollHeight - window.innerHeight, 1);
  const progress = Math.min(1, window.scrollY / scrollable);
  enh.backToTop?.classList.toggle("visible", window.scrollY > window.innerHeight * 0.7);
  if (enh.backProgress) enh.backProgress.style.strokeDashoffset = String(125.66 * (1 - progress));
}
window.addEventListener("scroll", updateBackToTop, { passive: true });
updateBackToTop();

enh.backToTop?.addEventListener("click", () => {
  window.scrollTo({ top: 0, behavior: !enhPrefs.effectsEnabled ? "auto" : "smooth" });
});

/* Procedural seed canvas */
/*
===============================================================================
DETERMINISTIC PROCEDURAL CANVAS
===============================================================================

hashSeed converts arbitrary text into a 32-bit number. seededRandom then creates
a repeatable pseudo-random sequence from that number. drawSeed uses the sequence
for line frequencies, amplitudes, phases, opacity, and stroke width.

This is deterministic visual generation: identical input text produces the same
output during later renders.
*/
function hashSeed(text) {
  let h = 2166136261;
  for (const char of text) {
    h ^= char.charCodeAt(0);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

function seededRandom(seed) {
  return () => {
    seed |= 0;
    seed = (seed + 0x6D2B79F5) | 0;
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/*
  Resizes for display density, clears the canvas, reads current theme accents,
  and draws multiple layered sine contours.
*/
function drawSeed(seedText) {
  const canvas = enh.seedCanvas;
  const context = canvas?.getContext("2d");
  if (!canvas || !context) return;

  const dpr = Math.min(window.devicePixelRatio || 1, 2);
  const width = canvas.clientWidth || 540;
  const height = 280;
  canvas.width = width * dpr;
  canvas.height = height * dpr;
  context.setTransform(dpr, 0, 0, dpr, 0, 0);
  context.clearRect(0, 0, width, height);

  const random = seededRandom(hashSeed(seedText));
  const style = getComputedStyle(enhRoot);
  const accent = style.getPropertyValue("--accent").trim() || "#6be8ff";
  const accentTwo = style.getPropertyValue("--accent-two").trim() || "#438cff";

  for (let line = 0; line < 18; line += 1) {
    context.beginPath();
    const baseY = 22 + (line / 18) * (height - 44);
    const amplitude = 8 + random() * 22;
    const frequency = 0.012 + random() * 0.023;
    const phase = random() * Math.PI * 2;

    for (let x = -10; x <= width + 10; x += 5) {
      const y = baseY + Math.sin(x * frequency + phase) * amplitude + Math.sin(x * frequency * 0.43 + phase * 1.7) * amplitude * 0.42;
      if (x === -10) context.moveTo(x, y); else context.lineTo(x, y);
    }

    context.strokeStyle = line % 3 === 0 ? accentTwo : accent;
    context.globalAlpha = 0.10 + random() * 0.22;
    context.lineWidth = 0.8 + random();
    context.stroke();
  }
  context.globalAlpha = 1;
}

enh.seedForm?.addEventListener("submit", (event) => {
  event.preventDefault();
  drawSeed(enh.seedInput.value.trim() || "104729");
});
drawSeed(enh.seedInput?.value || "104729");
window.addEventListener("resize", () => drawSeed(enh.seedInput?.value || "104729"), { passive: true });

/*
  Redraw when the theme switches so the canvas accent colors stay in sync.
  script.js dispatches portfolio:theme-changed after every theme toggle.
*/
window.addEventListener("portfolio:theme-changed", () => {
  drawSeed(enh.seedInput?.value || "104729");
});

/* Keyboard shortcuts */

/*
  Keyboard shortcuts provide direct section navigation and access to the
  command palette without introducing hidden or decorative-only commands.
*/
document.addEventListener("keydown", (event) => {
  const typing = ["INPUT", "TEXTAREA", "SELECT"].includes(
    document.activeElement?.tagName
  );

  if (
    (event.metaKey || event.ctrlKey) &&
    event.key.toLowerCase() === "k"
  ) {
    event.preventDefault();
    openCommandPalette();
    return;
  }

  if (event.key === "/" && !typing) {
    event.preventDefault();
    openCommandPalette();
    return;
  }

  if (typing) return;

  if (event.key === "Escape") {
    closeEnhDialog(enh.projectDialog);
    closeEnhDialog(enh.commandDialog);
    closeEnhDialog(enh.settingsDialog);
    return;
  }

  /* Single-key shortcuts only fire on a plain key press, so browser
     shortcuts like Ctrl/Cmd+R (reload) and Ctrl/Cmd+1–7 (switch tab) keep
     working. */
  if (event.ctrlKey || event.metaKey || event.altKey) return;

  const targets = {
    "1": "#home",
    "2": "#expertise",
    "3": "#projects",
    "4": "#playground",
    "5": "#about",
    "6": "#resume",
    "7": "#contact"
  };

  if (targets[event.key]) {
    goToSection(targets[event.key]);
  }

  if (event.key.toLowerCase() === "r") {
    window.location.href = RESUME_URL;
  }
});
