/*
===============================================================================
ENHANCEMENT CONTENT / SETTINGS DATA — config.js
===============================================================================

A small data layer read by enhancements.js (project dialog, command palette)
and by case-study.html.

It creates one global object:
    window.PORTFOLIO_ENHANCEMENTS

Important relationships:
- projectDetails[n] corresponds to the n-th .project-card in index.html (the
  dialog buttons are matched by position).
- Each project has a stable `id`. case-study.html?project=<id> looks projects
  up by this id, so reordering the cards no longer breaks case-study links.
- `caseStudy` is where the dialog's main button goes; `caseStudyLabel`
  overrides its text.

When editing, keep JavaScript punctuation valid: quoted strings, commas
between properties, and matching braces/brackets.
*/

window.PORTFOLIO_ENHANCEMENTS = {
  /* Shown in every page footer as "Last updated …". Change this date
     whenever you publish an update (YYYY-MM-DD). */
  lastUpdated: "2026-10-04",

  /* Hero text rotation ("Currently exploring …"). Decorative status text. */
  interests: [
    "Visual Computing",
    "Computer Vision",
    "Procedural Systems",
    "AI-Enabled Products",
    "3D Visualization",
    "Full-Stack Engineering"
  ],

  projectDetails: [
    {
      id: "image-to-world",
      title: "Computational World-Building",
      type: "Senior Integrative Project · Ammerman Center",
      role: "Senior Integrative Project, Ammerman Center for Arts and Technology",
      summary: "A wabi-sabi-inspired system for generative worlds. A still photograph is analyzed for a small set of understandable features (brightness, color, contrast, density, texture) and those features become parameters that bias an explorable environment built in Unreal Engine with C++. The photograph influences the world; it is not reconstructed. Builds on an earlier UE5 PCG forest prototype with ambient sound, fog, and first-person exploration.",
      result: "In progress. First milestone: terrain generated in C++ from image-derived parameters.",
      tags: ["Unreal Engine 5", "C++", "Procedural Generation", "Image Analysis"],
      caseStudy: "sip.html",
      caseStudyLabel: "Open the senior project page"
    },
    {
      id: "visual-intelligence",
      title: "Autonomous Driving Safety Research",
      type: "Research · Computer Vision · AI",
      role: "Solo researcher (advisor: Ozgur Izmirli, Ph.D., Connecticut College)",
      summary: "Designing parameterized rare-hazard scenarios in CARLA simulator and training reinforcement learning agents to evaluate how autonomous vehicles behave in high-risk situations. Research focuses on safety-critical edge cases underrepresented in standard benchmarks.",
      result: "Ongoing. Building a reproducible evaluation framework for rare-hazard autonomous driving scenarios.",
      tags: ["Python", "CARLA", "Reinforcement Learning"],
      caseStudy: "case-study.html?project=visual-intelligence",
      comparison: true
    },
    {
      id: "intelligent-web-app",
      title: "AI Vision Scavenger Hunt",
      type: "AI · Full-Stack · Cloud",
      role: "Solo developer",
      summary: "Designed and deployed a full-stack multiplayer scavenger hunt game on Microsoft Azure. Players compete to photograph real-world objects; Azure AI Vision analyzes submitted images to validate completions. Built with React, Node.js/Express, and Docker containers on an Azure Virtual Machine.",
      result: "Fully deployed cloud application with real-time multiplayer and AI-powered photo validation.",
      tags: ["React", "Node.js", "Azure", "Docker"],
      caseStudy: "case-study.html?project=intelligent-web-app"
    },
    {
      id: "visualization-vfx",
      title: "VR Environment — Meta Quest 3",
      type: "3D · VR · Real-Time",
      role: "Project co-lead, primary developer, sole programmer (2-person team)",
      summary: "Designed and developed interactive 3D environments in Unity with full VR integration for the Meta Quest 3 headset. Implemented physics-based object interactions, custom C# scripts, and optimized lighting and textures for immersive real-time experiences.",
      result: "Fully functional VR experience with natural physics interactions, playable on Meta Quest 3.",
      tags: ["C#", "Unity", "VR", "Meta Quest 3"],
      caseStudy: "case-study.html?project=visualization-vfx"
    }
  ]
};
