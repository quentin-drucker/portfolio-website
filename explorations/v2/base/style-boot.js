/*
  Style boot (explorations only). Runs synchronously in <head>, after the base
  stylesheets, so the chosen style's CSS is applied before first paint.
  Priority: a page lock (<html data-lock-style>), then ?style= in the URL,
  then the last style viewed, then "original".
*/
(function () {
  var STYLES = ["original", "mist", "survey", "field", "graphite", "ridgeline"];
  var rootEl = document.documentElement;
  var style = rootEl.getAttribute("data-lock-style");
  if (STYLES.indexOf(style) < 0) {
    try { style = new URLSearchParams(location.search).get("style"); } catch (error) {}
    if (STYLES.indexOf(style) < 0) {
      try { style = localStorage.getItem("v2-style"); } catch (error) {}
    }
    if (STYLES.indexOf(style) < 0) style = "original";
    try { localStorage.setItem("v2-style", style); } catch (error) {}
  }

  rootEl.dataset.style = style;
  var link = document.createElement("link");
  link.rel = "stylesheet";
  link.id = "style-sheet";
  link.href = "styles/" + style + ".css";
  /* A script-inserted stylesheet doesn't hold back deferred scripts, so canvas
     code could read colors before it loads. V2_STYLE_READY lets them wait. */
  window.V2_STYLE_READY = new Promise(function (resolve) {
    link.onload = link.onerror = function () { resolve(); };
  });
  document.head.appendChild(link);
  window.V2_STYLES = STYLES;
})();
