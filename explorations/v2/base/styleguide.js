/*
  Style guide content (explorations/v2/styleguide.html).
  Descriptions per style, live color swatches with contrast against the page
  background, and the effects list.
*/
(function () {
  const rootEl = document.documentElement;
  const style = rootEl.dataset.style;

  const GUIDE = {
    original: {
      name: "Original",
      idea: "Your live site as it is today: charcoal and cyan, glass panels, glowing motes, a gradient phrase in each headline. Kept as the control so the other styles have something to be compared against.",
      facts: [["Mood", "Futuristic, luminous, technical"], ["Type", "Inter, JetBrains Mono"], ["Surfaces", "Frosted glass, soft cyan glow"], ["Signature", "Clustered glowing mote field"]],
      signature: "No extra signature beyond the shared effects. This is the baseline."
    },
    mist: {
      name: "Mist",
      idea: "Weathered, after dark. The wabi-sabi thinking behind the senior project carried into the whole site: warm stone instead of black, washi-paper text, gold used only for actions, moss for secondary marks. Nothing has a hard edge; panels fade out and the page fades at the top and bottom of the screen.",
      facts: [["Mood", "Atmospheric, quiet, handmade"], ["Type", "Shippori Mincho, Zen Kaku Gothic New"], ["Surfaces", "Borderless, fills fade from the top-left"], ["Signature", "Ink-wash ridges, new every visit"]],
      signature: "Ink-wash mountain ridges behind the hero, drawn in from far to near and different on every visit (transience). Sections clear in like fog lifting instead of sliding up. Particles become slow, glowless dust."
    },
    survey: {
      name: "Survey",
      idea: "A night topographic map. Your cyan identity stays, but disciplined: no gradient phrases, no bloom. A warm amber marks every fifth contour and selected states, the way index contours do on a real survey map.",
      facts: [["Mood", "Exploratory, precise, calm"], ["Type", "Instrument Sans, IBM Plex Mono"], ["Surfaces", "Translucent panels over the map"], ["Signature", "Contour map lit by your cursor"]],
      signature: "A fixed contour map under the whole page. Around the cursor a brighter copy of the same map is revealed, like a flashlight on paper. Typing a new seed in the Playground redraws the map from that seed."
    },
    field: {
      name: "Field",
      idea: "Signal's flow field, at night. The rules make the image: noise steers thousands of short strokes behind the hero and your pointer bends them. Everything else is flat and direct, so the field is the one loud thing on the page.",
      facts: [["Mood", "Bold, kinetic, graphic"], ["Type", "Schibsted Grotesk (one family)"], ["Surfaces", "Flat, sharp corners, 1px rules"], ["Signature", "Pointer-reactive flow field"]],
      signature: "A pointer-reactive flow field fills the hero and fades into the page. Under reduced motion it settles into a single still frame. Cards gain an ultramarine edge as your pointer enters them."
    },
    graphite: {
      name: "Graphite",
      idea: "The Viewport palette without the editor chrome. Neutral 3D-editor grey where the only color is the selection: orange means selected or actionable and nothing else. The Playground terrain feels native here.",
      facts: [["Mood", "Tool-like, focused, engineered"], ["Type", "Archivo (condensed display), JetBrains Mono"], ["Surfaces", "Opaque panels, no blur or glow"], ["Signature", "Editor grid and selection outlines"]],
      signature: "An editor-style floor grid that fades down the page. The hovered card takes an orange selection outline, and the particle field becomes small orange sparks."
    },
    ridgeline: {
      name: "Ridgeline",
      idea: "Survey's cool slate palette with cyan for actions and amber kept for highlights, set with Mist's typography, spacing, fading panels and fog. Mountain ridges stand in front of a contour-map sky, and both are cut from the same generated land: the map is that land seen from above.",
      facts: [["Mood", "Nocturnal atlas: technical and handmade"], ["Type", "Shippori Mincho, Zen Kaku Gothic New"], ["Surfaces", "Borderless, fills fade from the top-left"], ["Signature", "Mountains under a map sky, biomes by scroll"]],
      signature: "A landscape that changes as you move through the page. Intro and focus: mountains under the contour sky. Projects and Playground: a quiet star chart, so the work is easy to read. About to Contact: the mountains return at dusk. A moon (a sun in light mode) arcs over the ridges as you scroll, and the glow on the horizon beneath it shifts from dawn to moonlight to sunset. Biome changes play as one smooth timed transition however you scroll. Color comes in three tiers: cyan for actions, amber for notable details, and a saturated gold for the four things that matter most. Pages can also set their own biome; the senior-project draft uses a warm \"kiln\" biome."
    }
  };
  const data = GUIDE[style] || GUIDE.original;

  document.title = `Quentin | ${data.name} style guide`;
  document.getElementById("sg-name").textContent = data.name;
  document.getElementById("sg-idea").textContent = data.idea;
  document.getElementById("sg-facts").innerHTML = data.facts.map(([k, v]) => `<div><dt>${k}</dt><dd>${v}</dd></div>`).join("");
  document.getElementById("sg-open-page").href = `index.html?style=${style}`;

  /* Fonts actually in use */
  const fonts = () => {
    const css = getComputedStyle(rootEl);
    const first = (stack) => stack.split(",")[0].replace(/["']/g, "").trim();
    const display = css.getPropertyValue("--font-display").trim();
    const bodyFont = getComputedStyle(document.body).fontFamily;
    const ui = css.getPropertyValue("--font-ui").trim();
    const d = display && display !== "inherit" ? first(display) : first(bodyFont);
    document.getElementById("sg-fonts").textContent = `Display: ${d}. Body: ${first(bodyFont)}. Small technical values: ${first(ui)}.`;
  };

  /* Swatches */
  const ROLES = [
    ["--bg", "Page", "Background of every page"],
    ["--surface-strong", "Panel", "Header when scrolled, dialogs"],
    ["--text", "Text", "Headings and body"],
    ["--text-soft", "Secondary text", "Descriptions, captions"],
    ["--text-faint", "Faint text", "Small labels only"],
    ["--accent", "Accent", "Links, active filter, focus"],
    ["--accent-two", "Second accent", "Labels, secondary marks"],
    ["--line-bright", "Rule", "Hover borders, key caps"]
  ];
  const probe = document.createElement("span");
  probe.style.display = "none";
  document.body.appendChild(probe);
  function rgbOf(value) {
    probe.style.color = "";
    probe.style.color = value;
    const m = getComputedStyle(probe).color.match(/[\d.]+/g);
    return m ? m.map(Number) : null;
  }
  const lum = ([r, g, b]) => [r, g, b].map((v) => { v /= 255; return v <= 0.03928 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4; })
    .reduce((acc, v, i) => acc + v * [0.2126, 0.7152, 0.0722][i], 0);
  const contrast = (a, b) => { const x = lum(a), y = lum(b); return (Math.max(x, y) + 0.05) / (Math.min(x, y) + 0.05); };
  const hex = (rgb) => "#" + rgb.slice(0, 3).map((v) => Math.round(v).toString(16).padStart(2, "0")).join("").toUpperCase();

  function renderSwatches() {
    const css = getComputedStyle(rootEl);
    const bg = rgbOf(css.getPropertyValue("--bg").trim());
    const html = ROLES.map(([token, name, use]) => {
      const raw = css.getPropertyValue(token).trim();
      const rgb = rgbOf(raw);
      if (!rgb) return "";
      const alpha = rgb[3] !== undefined && rgb[3] < 1 ? ` at ${Math.round(rgb[3] * 100)}%` : "";
      const ratio = token === "--bg" ? "" : `<span class="sg-ratio">${contrast(rgb, bg).toFixed(1)}:1 on page</span>`;
      return `<figure class="sg-swatch"><span class="sg-chip" style="background:${raw}"></span>
        <figcaption><strong>${name}</strong><code>${hex(rgb)}${alpha}</code><span>${use}</span>${ratio}</figcaption></figure>`;
    }).join("");
    const btn = css.getPropertyValue("--btn-bg").trim();
    const btnText = rgbOf(css.getPropertyValue("--btn-text").trim());
    document.getElementById("sg-swatches").innerHTML = html +
      `<figure class="sg-swatch"><span class="sg-chip" style="background:${btn}"></span>
        <figcaption><strong>Primary button</strong><code>${btn.startsWith("#") ? btn.toUpperCase() : "gradient"}</code><span>Text ${btnText ? hex(btnText) : ""}</span></figcaption></figure>`;
  }

  /* Effects list: shared mechanics from the live site + this style's signature */
  const EFFECTS = [
    ["Signature", data.signature],
    ["Ambient particles", "The live site's clustered mote field: motes orbit drifting attractors, scatter from the pointer and stir when you scroll. Colors come from this style's --mote tokens; density is in the effects settings."],
    ["Cursor glow", "A soft light follows the pointer with easing, tinted with this style's glow color."],
    ["Card light, tilt and shimmer", "Cards tilt slightly toward the pointer, a highlight sits where the pointer is, and a sheen passes over on entry. Try the cards above."],
    ["Magnetic buttons and click bursts", "Buttons lean toward the pointer. Every click emits a small ring and particle burst in this style's burst color."],
    ["Scroll progress", "The thin bar at the top of the window fills as you scroll; on the portfolio page the back-to-top button shows the same progress as a ring."],
    ["Keyboard", "1–7 jump to sections, R opens the résumé, / or Ctrl+K opens the command palette. The section rail at the left shows the same numbers."]
  ];
  document.getElementById("sg-effects").innerHTML = EFFECTS.map(([title, text], i) =>
    `<article class="sg-effect glass${i === 0 ? " sg-effect-signature" : ""}"><h3>${title}</h3><p>${text}</p></article>`).join("");

  const refresh = () => { renderSwatches(); fonts(); };
  refresh();
  document.fonts?.ready.then(fonts);
  document.getElementById("style-sheet")?.addEventListener("load", refresh);
  window.addEventListener("portfolio:theme-changed", refresh);
})();
