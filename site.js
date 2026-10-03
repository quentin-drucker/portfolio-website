/*
===============================================================================
SITE GLUE — site.js
===============================================================================

Small behaviors for index.html (promoted from explorations/v2/base/v2.js):
- "What I work on" cards apply the matching project filter, then scroll
- the featured senior-project card draws a labeled, generated stand-in image
  until real media replaces it
*/
(function () {
  const rootEl = document.documentElement;

  /* ---- overview cards apply a project filter ---- */
  document.querySelectorAll("[data-jump-filter]").forEach((link) => {
    link.addEventListener("click", () => {
      const filter = link.dataset.jumpFilter;
      document.querySelector(`#project-filters [data-filter="${filter}"]`)?.click();
    });
  });

  /* ---- senior-project stand-in image ---- */
  const sip = document.querySelector(".sip-canvas");
  function drawSip() {
    if (!sip) return;
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    const w = sip.clientWidth, h = sip.clientHeight;
    if (!w || !h) return;
    sip.width = Math.round(w * dpr);
    sip.height = Math.round(h * dpr);
    const context = sip.getContext("2d");
    context.setTransform(dpr, 0, 0, dpr, 0, 0);
    const style = getComputedStyle(rootEl);
    const sky = style.getPropertyValue("--sip-sky").trim() || "18, 30, 38";
    const ink = style.getPropertyValue("--sip-ink").trim() || "100, 229, 255";
    const sky2 = style.getPropertyValue("--sip-sky-2").trim() || "8, 14, 18";
    const bg = context.createLinearGradient(0, 0, 0, h);
    bg.addColorStop(0, `rgb(${sky})`);
    bg.addColorStop(1, `rgb(${sky2})`);
    context.fillStyle = bg;
    context.fillRect(0, 0, w, h);
    let seed = 7;
    const random = () => ((seed = (seed * 16807) % 2147483647) / 2147483647);
    const layers = 6;
    for (let L = 0; L < layers; L++) {
      const t = L / (layers - 1);
      const base = h * (0.38 + t * 0.48);
      const amp = h * (0.06 + t * 0.1);
      const f1 = 0.004 + random() * 0.006, f2 = 0.013 + random() * 0.01, p1 = random() * 9, p2 = random() * 9;
      context.beginPath();
      context.moveTo(0, h);
      for (let x = 0; x <= w; x += 4) {
        const y = base - (Math.sin(x * f1 + p1) * 0.6 + Math.sin(x * f2 + p2) * 0.3 + Math.sin(x * f2 * 2.7 + p1) * 0.12) * amp;
        context.lineTo(x, y);
      }
      context.lineTo(w, h);
      context.closePath();
      context.fillStyle = `rgba(${ink}, ${0.08 + t * 0.14})`;
      context.fill();
    }
  }
  drawSip();
  window.addEventListener("resize", drawSip, { passive: true });
  window.addEventListener("portfolio:theme-changed", drawSip);
  document.fonts?.ready.then(drawSip);
})();
