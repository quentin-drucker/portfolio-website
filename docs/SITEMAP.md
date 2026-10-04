# Site map

> **Written October 4, 2026.** This is a snapshot of the site on that date. Pages and sections added or changed since then may not be reflected here, so check the live site if something doesn't match.

My portfolio is one long main page, plus a dedicated page for my Senior Integrative Project (SIP) and a few supporting pages. A generated landscape sits behind the content and changes as you scroll: mountains under a night sky, then a contour map, then a night sea.

```
index.html  (main portfolio, one scrolling page)
│
├── 1  Home ........... who I am, what I build
├── 2  Focus .......... core areas (visual computing, AI, …)
├── 3  Projects ....... filterable project cards
│        ├── Computational World-Building ──► sip.html
│        └── other projects ──► case-study.html?project=…
├── 4  Playground ..... interactive terrain generator
├── 5  About
├── 6  Résumé ......... summary ──► resume.html (full PDF)
└── 7  Contact ........ email, LinkedIn, GitHub, message form

sip.html     Senior Integrative Project page
resume.html  résumé: view or download the PDF
404.html     page not found, with links back
```

## Getting around the main page

The header links jump to each section, and the numbered rail on the left shows where you are. Keys **1–7** jump to the same sections, **R** opens the résumé, **⌘K / Ctrl+K** opens a command palette, and **?** lists every shortcut. The gear icon (or **S**) opens **World controls**, where you can change the landscape, the motion and the readability settings. The sun/moon button switches between light and dark mode.

## The SIP page: Computational World-Building

This page is for my senior project. It explains a C++ system in Unreal Engine 5 that reads a single photograph for a few understandable features and uses them to shape an explorable, wabi-sabi-inspired world. The photograph steers the world; it is not reconstructed.

You reach it from the featured project card in **Projects**. The page reads top to bottom, and its header links jump to each section:

| Section | What it covers |
|---|---|
| Overview | Project title, one-line summary, current status (in progress; first milestone: terrain) |
| Idea | How a photograph steers generation without being rebuilt |
| Pipeline | The 12 steps from photograph → image analysis → features → parameters → terrain → … → explorable environment |
| Variation | The wabi-sabi rules the generator leans toward (asymmetry, weathering, controlled disorder, …) |
| Build | Tools (Unreal Engine 5, C++, Visual Studio 2022, Cursor) and the PCG forest prototype that came before it |
| Planned | What will be added as the project develops |

**Coming to this page as the project develops:**
- Photograph-to-world comparisons
- A process journal
- A gallery
- Iterations
- A closing reflection

**All projects** in the header and the link at the bottom of the page lead back to the main portfolio.
