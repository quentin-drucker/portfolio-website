/*
===============================================================================
BASE INTERACTION AND PARTICLE ENGINE — script.js
===============================================================================

This is the original behavior layer for index.html.

Its responsibilities are:
- dark/light theme selection and persistence
- mobile-navigation disclosure behavior
- sticky-header and page-scroll effects
- viewport reveal animations
- active top-navigation tracking
- contact-form mailto construction
- shimmer and cursor-position lighting
- restrained card tilt
- cursor-following ambient glow
- organic clustered mote simulation
- click particle bursts
- hidden-tab and reduced-motion safeguards

The file runs after config.js because index.html loads all scripts with "defer".
Most code queries existing DOM elements once, then registers event listeners.

The particle environment uses one full-screen <canvas>. Individual motes are
plain JavaScript objects, not DOM nodes. Each animation frame updates their
positions and redraws the canvas. This is substantially lighter than creating a
large number of animated HTML elements.

enhancements.js loads after this file and adds independent features. The two
files share the page but should remain conceptually separate:
- script.js is the original foundation.
- enhancements.js is the optional feature layer.

Mote and burst colors are read from CSS custom properties (--mote-a, --mote-b,
--burst, --mote-glow, --mote-alpha) via readMotePalette(), so the theme
stylesheet controls the particle field. Particle speed comes from the world
controls (world-settings.js → window.PORTFOLIO_WORLD.moteSpeed).
*/

/* Cached document references.
   Querying these once keeps later event-handler code concise. */
const root = document.documentElement;
const body = document.body;
const themeToggle = document.querySelector(".theme-toggle");
const mobileMenuButton = document.querySelector(".mobile-menu-button");
const navLinks = document.querySelector(".nav-links");
const header = document.querySelector(".site-header");
const contactForm = document.querySelector("#contact-form");
const yearTarget = document.querySelector("#current-year");
const cursorAura = document.querySelector("#cursor-aura");
const progressBar = document.querySelector("#scroll-progress span");
const visualShell = document.querySelector(".visual-shell");

/*
  Static contact target:
  The contact form does not submit to a web server. It builds a mailto URL using
  this address. This placeholder must be replaced before deployment.
*/
const CONTACT_EMAIL = "qdruck@gmail.com";
const reducedMotionQuery = window.matchMedia("(prefers-reduced-motion: reduce)");
const coarsePointerQuery = window.matchMedia("(pointer: coarse)");

/*
  The enhancement settings store a manual motion level. The operating-system
  reduced-motion preference always takes priority over a requested "full" mode.
*/
function readManualMotionMode() {
  try {
    const saved = JSON.parse(
      localStorage.getItem("portfolio-enhancement-preferences") || "{}"
    );

    /*
      Current preference format uses one boolean. The saved.motion fallback
      preserves compatibility with older Full/Reduced/Off versions.
    */
    if (typeof saved.effectsEnabled === "boolean") {
      return saved.effectsEnabled ? "full" : "off";
    }

    return saved.motion || root.dataset.motion || "full";
  } catch {
    return root.dataset.motion || "full";
  }
}

function currentMotionMode() {
  const manualMode = root.dataset.motion || readManualMotionMode();

  // A visitor may always choose the stricter "off" mode.
  if (manualMode === "off") return "off";

  // The operating-system preference prevents an accidental return to full motion.
  if (reducedMotionQuery.matches) return "reduced";

  return manualMode;
}

function motionIsOff() {
  return currentMotionMode() === "off";
}

function motionIsReduced() {
  return currentMotionMode() === "reduced";
}

let reduceMotion = motionIsReduced() || motionIsOff();
let pointerIsCoarse = coarsePointerQuery.matches;

/*
  Applies a theme by changing the data-theme attribute on <html>.
  CSS selectors such as html[data-theme="light"] respond to that attribute.
  The selection is also saved in localStorage for later visits.
*/
function setTheme(theme) {
  root.dataset.theme = theme;
  localStorage.setItem("quentin-portfolio-theme", theme);
  const isDark = theme === "dark";
  themeToggle?.setAttribute("aria-label", isDark ? "Switch to light mode" : "Switch to dark mode");
}

const storedTheme = localStorage.getItem("quentin-portfolio-theme");

/*
  The portfolio always opens in dark mode for a first-time visitor.
  A deliberate light-mode choice is still remembered in localStorage.
*/
setTheme(storedTheme || "dark");

themeToggle?.addEventListener("click", () => {
  setTheme(root.dataset.theme === "dark" ? "light" : "dark");

  /*
    Continuous canvas animation naturally picks up the new palette on its next
    frame. This event also refreshes the static reduced-motion canvas.
  */
  window.dispatchEvent(new CustomEvent("portfolio:theme-changed"));
});

/*
  Restores the mobile menu to its closed state. This function is reused after
  link activation and when the viewport grows beyond the mobile breakpoint.
*/
function closeMobileMenu() {
  navLinks?.classList.remove("open");
  mobileMenuButton?.setAttribute("aria-expanded", "false");
  mobileMenuButton?.setAttribute("aria-label", "Open navigation");
  body.classList.remove("menu-open");
}

mobileMenuButton?.addEventListener("click", () => {
  const isOpen = navLinks.classList.toggle("open");
  mobileMenuButton.setAttribute("aria-expanded", String(isOpen));
  mobileMenuButton.setAttribute("aria-label", isOpen ? "Close navigation" : "Open navigation");
  body.classList.toggle("menu-open", isOpen);
});

document.querySelectorAll(".nav-links a").forEach((link) => {
  link.addEventListener("click", closeMobileMenu);
});

window.addEventListener("resize", () => {
  if (window.innerWidth > 760) closeMobileMenu();
});

/*
  Scroll-linked UI:
  - makes the fixed header more opaque after leaving the page top
  - updates the thin reading-progress line
  - shifts large background glow layers at a reduced speed for depth
*/
let previousScrollY = window.scrollY;
let scrollWake = 0;

function updateScrollEffects() {
  const scrollTop = window.scrollY;
  const scrollable = Math.max(document.documentElement.scrollHeight - window.innerHeight, 1);
  const progress = Math.min(100, Math.max(0, (scrollTop / scrollable) * 100));

  scrollWake = scrollTop - previousScrollY;
  previousScrollY = scrollTop;

  header?.classList.toggle("scrolled", scrollTop > 20);
  if (progressBar) progressBar.style.width = `${progress}%`;

  if (!motionIsReduced() && !motionIsOff()) {
    const drift = Math.min(scrollTop * 0.035, 48);
    document.querySelector(".glow-one")?.style.setProperty("margin-top", `${-drift * 0.4}px`);
    document.querySelector(".glow-two")?.style.setProperty("margin-top", `${drift * 0.55}px`);
  }
}

updateScrollEffects();
window.addEventListener("scroll", updateScrollEffects, { passive: true });

/*
  Section/card reveal observer:
  IntersectionObserver runs only when an observed element approaches the
  viewport, avoiding continuous scroll calculations for every reveal item.
*/
const revealObserver = new IntersectionObserver(
  (entries) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting) {
        entry.target.classList.add("visible");
        revealObserver.unobserve(entry.target);
      }
    });
  },
  { threshold: 0.13 }
);

document.querySelectorAll(".reveal").forEach((element, index) => {
  element.style.transitionDelay = `${Math.min(index % 4, 3) * 70}ms`;
  revealObserver.observe(element);
});

const sectionLinks = [...document.querySelectorAll(".nav-links a")];
const sections = sectionLinks
  .map((link) => document.querySelector(link.getAttribute("href")))
  .filter(Boolean);

/*
  Active navigation observer:
  Determines which main section occupies the reading region and applies the
  .active class to its matching top-navigation link.
*/
const sectionObserver = new IntersectionObserver(
  (entries) => {
    const visible = entries
      .filter((entry) => entry.isIntersecting)
      .sort((a, b) => b.intersectionRatio - a.intersectionRatio)[0];

    if (!visible) return;

    sectionLinks.forEach((link) => {
      link.classList.toggle("active", link.getAttribute("href") === `#${visible.target.id}`);
    });
  },
  { rootMargin: "-30% 0px -60% 0px", threshold: [0.05, 0.25, 0.6] }
);

sections.forEach((section) => sectionObserver.observe(section));

/*
  Static contact-form behavior:
  FormData reads the three fields. encodeURIComponent safely places their text
  into a mailto subject/body. The visitor's configured email application then
  handles actual delivery.
*/
contactForm?.addEventListener("submit", (event) => {
  event.preventDefault();

  const formData = new FormData(contactForm);
  const name = String(formData.get("name") || "").trim();
  const email = String(formData.get("email") || "").trim();
  const message = String(formData.get("message") || "").trim();

  const subject = encodeURIComponent(`Portfolio inquiry from ${name}`);
  const bodyText = encodeURIComponent(`Name: ${name}\nEmail: ${email}\n\n${message}`);
  window.location.href = `mailto:${CONTACT_EMAIL}?subject=${subject}&body=${bodyText}`;
});

if (yearTarget) yearTarget.textContent = new Date().getFullYear();

/* --------------------------------------------------------------------------
   Shimmer, local hover lighting, and restrained 3D tilt
   -------------------------------------------------------------------------- */

/*
  Entry flash:
  When the pointer enters a card or button, a band of light starts at the
  entry point and sweeps across to the opposite side, so the flash follows
  the direction the pointer came from. The band is the .shimmer-surface span:
  it is centered on the entry point, rotated to face the card's center, and
  moved along that direction with the Web Animations API (transform and
  opacity only, so it stays on the compositor). Re-entering cancels the
  previous flash. Strength comes from the world controls ("Card flash",
  window.PORTFOLIO_WORLD.flash, applied in CSS as --flash); 0 disables it.
*/
function playEntryFlash(element, band, event) {
  const strength = window.PORTFOLIO_WORLD?.flash ?? 1;
  if (strength <= 0 || motionIsReduced() || motionIsOff()) {
    band.flashAnimation?.cancel();
    return;
  }

  const bounds = element.getBoundingClientRect();
  const width = element.offsetWidth, height = element.offsetHeight;
  if (!width || !height) return;
  /* getBoundingClientRect is in screen px; the band is positioned in the
     element's own px, which differ when the content is scaled (CSS zoom). */
  const scale = bounds.width / width || 1;
  const entryX = (event.clientX - bounds.left) / scale;
  const entryY = (event.clientY - bounds.top) / scale;
  const angle = Math.atan2(height / 2 - entryY, width / 2 - entryX) * (180 / Math.PI);
  const diagonal = Math.hypot(width, height);
  const thickness = Math.max(80, diagonal * 0.45);
  const length = diagonal * 2.2;

  band.style.width = `${thickness}px`;
  band.style.height = `${length}px`;
  band.style.left = `${entryX - thickness / 2}px`;
  band.style.top = `${entryY - length / 2}px`;

  band.flashAnimation?.cancel();
  band.flashAnimation = band.animate(
    [
      { transform: `rotate(${angle}deg) translateX(${-thickness * 0.5}px)`, opacity: 0 },
      { opacity: 1, offset: 0.15 },
      { transform: `rotate(${angle}deg) translateX(${diagonal}px)`, opacity: 0 }
    ],
    { duration: 900, easing: "cubic-bezier(.23, .71, .31, 1)" }
  );
}

/*
  Shimmer/spotlight enhancement targets:
  Each matching element receives two decorative span layers:
  - .shimmer-surface: the entry flash band (see playEntryFlash above).
  - .hover-light is positioned from pointer coordinates stored in CSS variables.
*/
const shimmerSelectors = [
  ".button",
  ".expertise-card",
  ".project-card",
  ".fact-card",
  ".contact-link",
  ".about-story",
  ".resume-shell",
  ".contact-form"
];

const shimmerTargets = document.querySelectorAll(shimmerSelectors.join(","));

shimmerTargets.forEach((element) => {
  element.classList.add("shimmer-target");

  const shimmer = document.createElement("span");
  shimmer.className = "shimmer-surface";
  shimmer.setAttribute("aria-hidden", "true");

  const hoverLight = document.createElement("span");
  hoverLight.className = "hover-light";
  hoverLight.setAttribute("aria-hidden", "true");

  element.append(shimmer, hoverLight);

  element.addEventListener("pointerenter", (event) => playEntryFlash(element, shimmer, event));

  element.addEventListener("pointermove", (event) => {
    const bounds = element.getBoundingClientRect();
    const x = ((event.clientX - bounds.left) / bounds.width) * 100;
    const y = ((event.clientY - bounds.top) / bounds.height) * 100;
    element.style.setProperty("--pointer-x", `${x}%`);
    element.style.setProperty("--pointer-y", `${y}%`);
  });
});

/*
  Card tilt:
  Pointer position is normalized around each card's center. The result is mapped
  to only a few degrees of rotation so text remains easy to read.
*/
const tiltCards = document.querySelectorAll(".expertise-card, .project-card, .fact-card");

function resetTilt(card) {
  card.style.transform = "";
}

tiltCards.forEach((card) => {
  card.classList.add("immersive-card");

  card.addEventListener("pointermove", (event) => {
    if (reduceMotion || pointerIsCoarse) return;

    const bounds = card.getBoundingClientRect();
    const normalizedX = (event.clientX - bounds.left) / bounds.width - 0.5;
    const normalizedY = (event.clientY - bounds.top) / bounds.height - 0.5;
    const rotateY = normalizedX * 3.2;
    const rotateX = normalizedY * -2.7;

    card.style.transform =
      `translateY(-5px) perspective(1000px) rotateX(${rotateX}deg) rotateY(${rotateY}deg)`;
  });

  card.addEventListener("pointerleave", () => resetTilt(card));
  card.addEventListener("blur", () => resetTilt(card), true);
});

/* --------------------------------------------------------------------------
   Cursor aura and hero parallax
   -------------------------------------------------------------------------- */

/*
  Smoothed pointer state:
  x/y are the newest event coordinates. renderX/renderY trail behind them so the
  cursor aura moves fluidly instead of snapping to every pointer event.
*/
const pointer = {
  x: window.innerWidth * 0.5,
  y: window.innerHeight * 0.45,
  renderX: window.innerWidth * 0.5,
  renderY: window.innerHeight * 0.45,
  active: false,
  down: false,
  lastMoveAt: performance.now()
};

window.addEventListener("pointermove", (event) => {
  if (pointerIsCoarse) return;
  pointer.x = event.clientX;
  pointer.y = event.clientY;
  pointer.active = true;
  pointer.lastMoveAt = performance.now();
  body.classList.add("pointer-active");

  if (visualShell) {
    const bounds = visualShell.getBoundingClientRect();
    const x = ((event.clientX - bounds.left) / bounds.width) * 100;
    const y = ((event.clientY - bounds.top) / bounds.height) * 100;
    visualShell.style.setProperty("--visual-x", `${x}%`);
    visualShell.style.setProperty("--visual-y", `${y}%`);
  }
}, { passive: true });

document.addEventListener("pointerdown", (event) => {
  if (
    event.button === 0 &&
    !event.target.closest("button, a, input, textarea, select, label, dialog")
  ) {
    pointer.down = true;
  }
});

document.addEventListener("pointerup", () => {
  pointer.down = false;
});

document.addEventListener("pointercancel", () => {
  pointer.down = false;
});

document.addEventListener("mouseleave", () => {
  pointer.active = false;
  pointer.down = false;
  body.classList.remove("pointer-active");
});

/*
  The cursor-aura loop uses interpolation rather than CSS transition updates.
  requestAnimationFrame aligns visual changes with the browser's paint cycle.
*/
function animateCursorAura() {
  if (
    cursorAura &&
    !motionIsReduced() &&
    !motionIsOff() &&
    !pointerIsCoarse
  ) {
    pointer.renderX += (pointer.x - pointer.renderX) * 0.075;
    pointer.renderY += (pointer.y - pointer.renderY) * 0.075;
    cursorAura.style.transform = `translate3d(${pointer.renderX}px, ${pointer.renderY}px, 0)`;
  }
  requestAnimationFrame(animateCursorAura);
}

animateCursorAura();

/* --------------------------------------------------------------------------
   Organic clustered mote field
   -------------------------------------------------------------------------- */

/*
===============================================================================
ORGANIC MOTE FIELD
===============================================================================

The following block owns the full-screen canvas simulation.

Core collections:
- clusters: slowly moving attractor centers
- motes: persistent ambient particles assigned to clusters
- bursts: temporary particles created by click interaction

The simulation combines:
- weak spring attraction toward a cluster
- tangential force for orbit/swirl
- layered sine forces for irregular, wafty movement
- pointer repulsion and curl
- velocity damping and speed limits
*/
const canvas = document.querySelector("#ambient-canvas");
const context = canvas?.getContext("2d", { alpha: true });

let width = 0;
let height = 0;
let deviceScale = 1;
let motes = [];
let bursts = [];
let clusters = [];
let animationFrame = null;
let lastTime = performance.now();
let canvasVisible = true;

/*
  Creates a small number of invisible attractor centers distributed across the
  viewport. Motes loosely gather around these centers rather than moving as one
  uniform wind field.
*/
function makeClusters() {
  const count = Math.max(4, Math.min(7, Math.round(width / 300)));
  clusters = Array.from({ length: count }, (_, index) => ({
    baseX: ((index + 0.55) / count) * width + (Math.random() - 0.5) * width * 0.08,
    baseY: height * (0.16 + Math.random() * 0.72),
    phase: Math.random() * Math.PI * 2,
    phaseTwo: Math.random() * Math.PI * 2,
    radiusX: 45 + Math.random() * 130,
    radiusY: 35 + Math.random() * 105,
    speed: 0.000045 + Math.random() * 0.000055
  }));
}

/*
  Returns a cluster's animated location at a given timestamp. Multiple sine
  frequencies prevent a visibly repetitive circular path.
*/
function currentClusterPosition(cluster, time) {
  const scrollOffset = window.scrollY * 0.022;
  return {
    x:
      cluster.baseX +
      Math.sin(time * cluster.speed + cluster.phase) * cluster.radiusX +
      Math.sin(time * cluster.speed * 0.37 + cluster.phaseTwo) * cluster.radiusX * 0.32,
    y:
      cluster.baseY +
      Math.cos(time * cluster.speed * 0.82 + cluster.phaseTwo) * cluster.radiusY -
      scrollOffset
  };
}

/*
  Creates one mote with randomized appearance and physical parameters.
  Assigning by index spreads motes across available clusters.
*/
function createMote(index = 0) {
  const clusterIndex = clusters.length ? index % clusters.length : 0;
  const cluster = clusters[clusterIndex] || { baseX: width / 2, baseY: height / 2 };
  const angle = Math.random() * Math.PI * 2;
  const distance = 18 + Math.pow(Math.random(), 0.58) * 165;

  /*
    Layer distribution:
    - far motes are tiny, slow, and faint
    - middle motes form the main visible clustered field
    - near motes are larger and receive a stronger glow/scroll response
  */
  const layerRoll = Math.random();
  const layer = layerRoll < 0.42 ? "far" : layerRoll < 0.86 ? "middle" : "near";
  const layerSettings = {
    far: { radiusMin: 0.35, radiusMax: 1.15, alphaMin: 0.045, alphaMax: 0.15, speed: 0.58 },
    middle: { radiusMin: 0.65, radiusMax: 2.35, alphaMin: 0.075, alphaMax: 0.29, speed: 0.90 },
    near: { radiusMin: 1.55, radiusMax: 4.25, alphaMin: 0.07, alphaMax: 0.23, speed: 1.28 }
  }[layer];

  return {
    clusterIndex,
    layer,
    layerSpeed: layerSettings.speed,
    x: cluster.baseX + Math.cos(angle) * distance,
    y: cluster.baseY + Math.sin(angle) * distance * 0.72,
    vx: (Math.random() - 0.5) * 0.06,
    vy: (Math.random() - 0.5) * 0.06,
    radius:
      layerSettings.radiusMin +
      Math.pow(Math.random(), 1.6) *
        (layerSettings.radiusMax - layerSettings.radiusMin),
    alpha:
      layerSettings.alphaMin +
      Math.random() * (layerSettings.alphaMax - layerSettings.alphaMin),
    phase: Math.random() * Math.PI * 2,
    phaseTwo: Math.random() * Math.PI * 2,
    turn: (Math.random() - 0.5) * 0.0022,
    orbit: 24 + Math.random() * 145,
    depth: 0.45 + Math.random() * 0.9,
    twinkle: 0.0006 + Math.random() * 0.0016,
    hueShift: Math.random()
  };
}

/*
  Matches the canvas backing resolution to the viewport and device pixel ratio.
  The DPR cap avoids excessive pixel work on very high-density displays.

  Particle density is read from the enhancement-preferences localStorage entry,
  allowing the settings panel to influence the original particle engine.
*/
function resizeCanvas() {
  if (!canvas || !context) return;

  width = window.innerWidth;
  height = window.innerHeight;
  deviceScale = Math.min(window.devicePixelRatio || 1, 1.6);

  canvas.width = Math.floor(width * deviceScale);
  canvas.height = Math.floor(height * deviceScale);
  canvas.style.width = `${width}px`;
  canvas.style.height = `${height}px`;
  context.setTransform(deviceScale, 0, 0, deviceScale, 0, 0);

  makeClusters();
  let density = 70;
  try {
    const savedEnhancements = JSON.parse(localStorage.getItem("portfolio-enhancement-preferences") || "{}");
    density = Number(savedEnhancements.particleDensity ?? 70);
  } catch {
    density = 70;
  }

  const baseCount = Math.max(42, Math.min(96, Math.floor(width / 16)));
  const count = Math.round(baseCount * Math.max(0, Math.min(100, density)) / 100);
  motes = Array.from({ length: count }, (_, index) => createMote(index));
}

/*
  Draws a particle core and, for larger motes, a radial-gradient glow.
  The light/dark theme check reduces intensity in the light theme.
*/
/*
  Particle palette from CSS tokens. Values are "r, g, b" triplets so they can be
  combined with per-mote alpha. Read once per theme/style change, not per frame.
*/
let motePalette = null;

function readMotePalette() {
  const style = getComputedStyle(root);
  const dark = root.dataset.theme === "dark";
  const token = (name, fallback) => style.getPropertyValue(name).trim() || fallback;
  motePalette = {
    a: token("--mote-a", dark ? "114, 231, 255" : "5, 132, 162"),
    b: token("--mote-b", dark ? "91, 157, 255" : "40, 86, 176"),
    burst: token("--burst", "119, 235, 255"),
    glow: token("--mote-glow", "1") !== "0",
    alphaScale: parseFloat(token("--mote-alpha", "1")) || 1
  };
}

function drawSoftMote(mote, alpha) {
  if (!motePalette) readMotePalette();
  const dark = root.dataset.theme === "dark";
  const rgb = mote.hueShift > 0.32 ? motePalette.a : motePalette.b;

  const baseAlpha = alpha * motePalette.alphaScale;
  const adjustedAlpha = dark ? baseAlpha : Math.min(baseAlpha * 1.22, 0.42);

  if (motePalette.glow && mote.radius > 1.45) {
    const glowScale = mote.layer === "near" ? 7.2 : 5.5;
    const glow = context.createRadialGradient(
      mote.x, mote.y, 0,
      mote.x, mote.y, mote.radius * glowScale
    );
    glow.addColorStop(0, `rgba(${rgb}, ${adjustedAlpha * 0.85})`);
    glow.addColorStop(0.22, `rgba(${rgb}, ${adjustedAlpha * 0.34})`);
    glow.addColorStop(1, `rgba(${rgb}, 0)`);
    context.fillStyle = glow;
    context.beginPath();
    context.arc(mote.x, mote.y, mote.radius * glowScale, 0, Math.PI * 2);
    context.fill();
  }

  context.fillStyle = `rgba(${rgb}, ${adjustedAlpha})`;
  context.beginPath();
  context.arc(mote.x, mote.y, mote.radius, 0, Math.PI * 2);
  context.fill();
}

/*
  Advances one mote by dt milliseconds.

  Forces are deliberately subtle:
  1. spring attraction keeps the particle near its assigned cluster
  2. perpendicular force creates swirl
  3. sine forces add non-linear wandering
  4. pointer forces gently displace nearby motes
  5. damping settles the velocity and prevents runaway acceleration
*/
function updateMote(mote, time, dt) {
  const cluster = clusters[mote.clusterIndex % clusters.length];
  if (!cluster) return;

  const center = currentClusterPosition(cluster, time);
  const dx = center.x - mote.x;
  const dy = center.y - mote.y;
  const distance = Math.max(Math.hypot(dx, dy), 0.001);

  /*
    After several idle seconds the field calms down and gathers slightly more
    tightly. Pointer activity restores the more expressive movement.
  */
  const idle = time - pointer.lastMoveAt > 3600;
  const activityFactor = idle ? 0.52 : 1;
  const clusterTightness = idle ? 1.35 : 1;

  // Spring toward the mote's loose cluster.
  const spring =
    0.0000022 *
    mote.depth *
    mote.layerSpeed *
    clusterTightness *
    dt;

  mote.vx += dx * spring;
  mote.vy += dy * spring;

  // Tangential force creates the wafty clustered swirl.
  const swirl =
    (0.0000042 + mote.turn) *
    dt *
    mote.depth *
    mote.layerSpeed *
    activityFactor;

  mote.vx += (-dy / distance) * swirl * mote.orbit;
  mote.vy += (dx / distance) * swirl * mote.orbit;

  // Layered sine motion prevents a single obvious wind direction.
  mote.vx +=
    Math.sin(time * 0.00031 + mote.phase + mote.y * 0.006) *
    0.00072 *
    dt *
    activityFactor *
    mote.layerSpeed;

  mote.vy +=
    Math.cos(time * 0.00027 + mote.phaseTwo + mote.x * 0.005) *
    0.00063 *
    dt *
    activityFactor *
    mote.layerSpeed;

  /*
    Fast scrolling creates a brief wake opposite the scroll direction.
    Near motes react most strongly, which adds perceptible depth.
  */
  const limitedWake = Math.max(-34, Math.min(34, scrollWake));
  mote.vy -= limitedWake * 0.00013 * dt * mote.layerSpeed;

  /*
    Normal pointer movement repels/curls nearby motes.
    Holding the primary pointer button over open background changes this into
    a stronger vortex without interfering with links, buttons, or form controls.
  */
  if (pointer.active && !pointerIsCoarse) {
    const mx = mote.x - pointer.x;
    const my = mote.y - pointer.y;
    const mouseDistance = Math.max(Math.hypot(mx, my), 1);
    const influenceRadius = pointer.down ? 285 : 220;

    if (mouseDistance < influenceRadius) {
      const influence = Math.pow(1 - mouseDistance / influenceRadius, 2);

      if (!pointer.down) {
        mote.vx +=
          (mx / mouseDistance) *
          influence *
          0.00175 *
          dt *
          mote.layerSpeed;

        mote.vy +=
          (my / mouseDistance) *
          influence *
          0.00175 *
          dt *
          mote.layerSpeed;
      }

      const curlStrength = pointer.down ? 0.0031 : 0.00115;

      mote.vx +=
        (-my / mouseDistance) *
        influence *
        curlStrength *
        dt *
        mote.layerSpeed;

      mote.vy +=
        (mx / mouseDistance) *
        influence *
        curlStrength *
        dt *
        mote.layerSpeed;
    }
  }

  const damping = Math.pow(0.992, dt / 16.67);
  mote.vx *= damping;
  mote.vy *= damping;

  const maxSpeed = 0.23 * mote.depth * mote.layerSpeed;
  const speed = Math.hypot(mote.vx, mote.vy);

  if (speed > maxSpeed) {
    mote.vx = (mote.vx / speed) * maxSpeed;
    mote.vy = (mote.vy / speed) * maxSpeed;
  }

  mote.x += mote.vx * dt;
  mote.y += mote.vy * dt;

  const margin = 100;
  if (mote.x < -margin) mote.x = width + margin;
  if (mote.x > width + margin) mote.x = -margin;
  if (mote.y < -margin) mote.y = height + margin;
  if (mote.y > height + margin) mote.y = -margin;
}

/*
  Temporary click-burst particles have finite life. Each frame updates movement,
  fades remaining life, and removes expired particles from the array.
*/
function updateBursts(dt) {
  bursts.forEach((particle) => {
    particle.life -= dt;
    particle.vx *= Math.pow(0.982, dt / 16.67);
    particle.vy *= Math.pow(0.982, dt / 16.67);
    particle.vy -= 0.00004 * dt;
    particle.x += particle.vx * dt;
    particle.y += particle.vy * dt;
  });

  bursts = bursts.filter((particle) => particle.life > 0);
}

function drawBursts() {
  bursts.forEach((particle) => {
    const lifeRatio = particle.life / particle.maxLife;
    if (!motePalette) readMotePalette();
    context.fillStyle = `rgba(${motePalette.burst}, ${lifeRatio * 0.52})`;
    context.beginPath();
    context.arc(particle.x, particle.y, particle.radius * lifeRatio, 0, Math.PI * 2);
    context.fill();
  });
}

/*
  Main animation frame:
  clears the previous image, updates/draws persistent motes, then updates/draws
  temporary bursts before requesting the next frame.
*/
function drawMotes(time) {
  if (!canvas || !context || !canvasVisible || motionIsOff() || motionIsReduced()) {
    animationFrame = null;
    return;
  }

  const elapsed = Math.min(time - lastTime, 34);
  lastTime = time;
  context.clearRect(0, 0, width, height);

  motes.forEach((mote) => {
    updateMote(mote, time, elapsed * (window.PORTFOLIO_WORLD?.moteSpeed ?? 1));
    const twinkle = 0.66 + Math.sin(time * mote.twinkle + mote.phase) * 0.34;
    drawSoftMote(mote, mote.alpha * twinkle);
  });

  /*
    Scroll wake is an impulse, not a permanent wind. Decaying it every frame
    lets the particle field settle naturally after scrolling stops.
  */
  scrollWake *= Math.pow(0.82, elapsed / 16.67);

  updateBursts(elapsed);
  drawBursts();

  animationFrame = requestAnimationFrame(drawMotes);
}

/*
  Creates a radial spray at viewport coordinates and adds a DOM-based ring
  ripple. It is skipped when reduced motion is active.
*/
function createBurst(x, y, amount = 14) {
  if (motionIsReduced() || motionIsOff()) return;

  for (let index = 0; index < amount; index += 1) {
    const angle = Math.random() * Math.PI * 2;
    const speed = 0.025 + Math.random() * 0.09;
    const life = 420 + Math.random() * 520;

    bursts.push({
      x,
      y,
      vx: Math.cos(angle) * speed,
      vy: Math.sin(angle) * speed,
      radius: 0.8 + Math.random() * 2.2,
      life,
      maxLife: life
    });
  }

  const ripple = document.createElement("span");
  ripple.className = "mote-ripple";
  ripple.style.left = `${x}px`;
  ripple.style.top = `${y}px`;
  document.body.appendChild(ripple);
  ripple.addEventListener("animationend", () => ripple.remove(), { once: true });
}

document.addEventListener("pointerdown", (event) => {
  if (
    event.button !== 0 ||
    motionIsReduced() ||
    motionIsOff() ||
    event.target.closest("button, a, input, textarea, select, label")
  ) {
    return;
  }
  createBurst(event.clientX, event.clientY);
});

/*
  Hidden-tab safeguard:
  Browsers may throttle hidden tabs, but explicitly cancelling the animation
  avoids unnecessary work. The loop resumes when the page becomes visible.
*/
document.addEventListener("visibilitychange", () => {
  canvasVisible = !document.hidden;

  if (
    canvasVisible &&
    !motionIsReduced() &&
    !motionIsOff() &&
    !animationFrame
  ) {
    lastTime = performance.now();
    animationFrame = requestAnimationFrame(drawMotes);
  } else if (!canvasVisible && animationFrame) {
    cancelAnimationFrame(animationFrame);
    animationFrame = null;
  }
});

/*
  Reconciles the live animation with current reduced-motion and pointer-device
  conditions. In reduced mode, it draws a single static frame instead of a loop.
*/
function restartMotionState() {
  const mode = currentMotionMode();

  reduceMotion = reducedMotionQuery.matches || mode !== "full";
  pointerIsCoarse = coarsePointerQuery.matches;

  if (animationFrame) {
    cancelAnimationFrame(animationFrame);
    animationFrame = null;
  }

  if (mode === "full" && !reducedMotionQuery.matches) {
    lastTime = performance.now();
    animationFrame = requestAnimationFrame(drawMotes);
    return;
  }

  if (!context) return;

  context.clearRect(0, 0, width, height);

  if (mode === "reduced" || reducedMotionQuery.matches) {
    motes.slice(0, Math.min(motes.length, 34)).forEach((mote) => {
      drawSoftMote(mote, mote.alpha * 0.72);
    });
  }
}

reducedMotionQuery.addEventListener?.("change", restartMotionState);
coarsePointerQuery.addEventListener?.("change", restartMotionState);

/*
  enhancements.js dispatches this event after a motion or particle preference
  changes. The canvas then updates immediately instead of waiting for a reload.
*/
window.addEventListener("portfolio:preferences-changed", () => {
  resizeCanvas();
  restartMotionState();
  updateScrollEffects();
});

window.addEventListener("portfolio:theme-changed", () => {
  readMotePalette();
  restartMotionState();
});

resizeCanvas();
window.addEventListener("resize", resizeCanvas, { passive: true });
restartMotionState();
