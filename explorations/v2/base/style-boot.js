/*
  Style boot (explorations only). Runs synchronously in <head>, after the base
  stylesheets, so the chosen style's CSS is applied before first paint.
  Priority: ?style= in the URL, then the last style viewed, then "original".
*/
(function () {
  var STYLES = ["original", "mist", "survey", "field", "graphite"];
  var style = null;
  try { style = new URLSearchParams(location.search).get("style"); } catch (error) {}
  if (STYLES.indexOf(style) < 0) {
    try { style = localStorage.getItem("v2-style"); } catch (error) {}
  }
  if (STYLES.indexOf(style) < 0) style = "original";
  try { localStorage.setItem("v2-style", style); } catch (error) {}

  document.documentElement.dataset.style = style;
  var link = document.createElement("link");
  link.rel = "stylesheet";
  link.id = "style-sheet";
  link.href = "styles/" + style + ".css";
  document.head.appendChild(link);
  window.V2_STYLES = STYLES;
})();
