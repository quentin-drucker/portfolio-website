/*
===============================================================================
KEYBOARD SHORTCUTS — shortcuts.js
===============================================================================

Makes the site's keyboard shortcuts discoverable. The navigation shortcuts
themselves (1–7, R, /, Ctrl/⌘+K, Esc) live in enhancements.js; this file adds:

- "?" opens a small panel that lists every shortcut. The footer's "Keyboard
  shortcuts" button and the command palette entry open the same panel.
- "S" opens World controls (the command palette already showed S as its key).
- A one-time hint: on a visitor's first visit with a mouse and keyboard, a
  small note in the lower-left corner says "Press ? for keyboard shortcuts".
  It leaves on its own after a few seconds, or when dismissed, and is never
  shown again on that device. Phones and tablets never see it.

The panel is built here, so every page that loads this script gets it
without repeating the markup. Runs after enhancements.js.
*/
(function () {
  const HINT_KEY = "quentin-shortcut-hint-seen";
  const isMac = /Mac|iPhone|iPad/.test(navigator.platform || navigator.userAgent);
  const mod = isMac ? "⌘" : "Ctrl";
  const hasKeyboardAndMouse = () => window.matchMedia("(hover: hover) and (pointer: fine)").matches;

  const SHORTCUTS = [
    [["1", "–", "7"], "Jump to a section of the main page: Home, Focus, Projects, Playground, About, Résumé, Contact"],
    [["R"], "Open the full résumé"],
    [["S"], "Open World controls (background, motion and readability settings)"],
    [["/"], "Open the command palette to search sections, projects and actions"],
    [[mod, "+", "K"], "Also opens the command palette, even while typing"],
    [["?"], "Show this list"],
    [["Esc"], "Close any open panel"]
  ];
  const keys = (parts) => parts.map((part) => (part === "–" || part === "+" ? `<span>${part}</span>` : `<kbd>${part}</kbd>`)).join("");

  const dialog = document.createElement("dialog");
  dialog.className = "shortcuts-dialog";
  dialog.id = "shortcuts-dialog";
  dialog.setAttribute("aria-labelledby", "shortcuts-title");
  dialog.innerHTML = `
    <div class="dialog-shell shortcuts-shell">
      <header>
        <h2 id="shortcuts-title">Keyboard shortcuts</h2>
        <button class="dialog-close" type="button" aria-label="Close keyboard shortcuts">×</button>
      </header>
      <dl class="shortcut-list">
        ${SHORTCUTS.map(([combo, text]) => `<div><dt>${keys(combo)}</dt><dd>${text}</dd></div>`).join("")}
      </dl>
      <p class="settings-note">Single-key shortcuts work anywhere on the site except while you’re typing in a field.</p>
    </div>`;
  document.body.append(dialog);

  function open() {
    if (dialog.open) return;
    document.querySelectorAll("dialog[open]").forEach((other) => other.close());
    dialog.showModal();
    document.body.classList.add("dialog-open");
    dismissHint();
  }
  function close() { if (dialog.open) dialog.close(); }
  dialog.addEventListener("close", () => {
    if (!document.querySelector("dialog[open]")) document.body.classList.remove("dialog-open");
  });
  dialog.querySelector(".dialog-close").addEventListener("click", close);
  /* a click on the dimmed area outside the panel closes it */
  dialog.addEventListener("click", (event) => { if (event.target === dialog) close(); });

  document.querySelectorAll("[data-open-shortcuts]").forEach((button) => button.addEventListener("click", open));
  window.PORTFOLIO_SHORTCUTS = { open };

  document.addEventListener("keydown", (event) => {
    const el = document.activeElement;
    const typing = el && (["INPUT", "TEXTAREA", "SELECT"].includes(el.tagName) || el.isContentEditable);
    if (typing || event.ctrlKey || event.metaKey || event.altKey) return;
    if (event.key === "?") {
      event.preventDefault();
      if (dialog.open) close(); else open();
      return;
    }
    const otherDialogOpen = [...document.querySelectorAll("dialog[open]")].length > 0;
    if (!otherDialogOpen && event.key.toLowerCase() === "s") {
      const trigger = document.querySelector(".settings-trigger");
      if (trigger) { event.preventDefault(); trigger.click(); }
    }
  });

  /* One-time hint */
  let hint = null;
  let hintTimer = null;
  function readSeen() { try { return localStorage.getItem(HINT_KEY) === "1"; } catch (error) { return true; } }
  function markSeen() { try { localStorage.setItem(HINT_KEY, "1"); } catch (error) {} }
  function dismissHint() {
    markSeen();
    clearTimeout(hintTimer);
    if (!hint) return;
    const node = hint;
    hint = null;
    node.classList.remove("is-shown");
    setTimeout(() => node.remove(), 400);
  }
  function showHint() {
    if (readSeen() || !hasKeyboardAndMouse() || window.innerWidth < 900 || document.querySelector("dialog[open]")) return;
    markSeen();
    hint = document.createElement("div");
    hint.className = "shortcut-hint";
    hint.setAttribute("role", "status");
    hint.innerHTML = `
      <button class="shortcut-hint-open" type="button">Press <kbd>?</kbd> for keyboard shortcuts</button>
      <button class="shortcut-hint-close" type="button" aria-label="Dismiss this tip">×</button>`;
    hint.querySelector(".shortcut-hint-open").addEventListener("click", open);
    hint.querySelector(".shortcut-hint-close").addEventListener("click", dismissHint);
    document.body.append(hint);
    requestAnimationFrame(() => requestAnimationFrame(() => hint?.classList.add("is-shown")));
    hintTimer = setTimeout(dismissHint, 9000);
  }
  /* Wait for the intro loader (main page) to finish, then a short pause. */
  const loader = document.getElementById("intro-loader");
  function whenLoaderGone(callback) {
    if (!loader || loader.classList.contains("hidden")) { callback(); return; }
    const watch = new MutationObserver(() => {
      if (loader.classList.contains("hidden")) { watch.disconnect(); callback(); }
    });
    watch.observe(loader, { attributes: true, attributeFilter: ["class"] });
  }
  if (!readSeen()) whenLoaderGone(() => setTimeout(showHint, 2500));
})();
