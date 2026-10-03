/*
===============================================================================
ENHANCEMENT CONTENT / SETTINGS DATA — config.js
===============================================================================

I use this file as a small data layer for the second-pass features.

It creates one global object:
    window.PORTFOLIO_ENHANCEMENTS

enhancements.js reads that object after the page DOM is available. Keeping this
data separate means I can update rotating interests, project modal information,
case-study links, and tags without searching through the larger interaction
file.

This is not a database and it is not fetched from a server. The browser executes
the file directly as JavaScript when index.html or case-study.html loads it.

Important relationships:
- projectDetails[0] corresponds to the first .project-card in index.html.
- projectDetails[1] corresponds to the second card, and so on.
- caseStudy URLs use query-string ids understood by case-study.html.

When replacing project content, I need to keep JavaScript punctuation valid:
quoted strings, commas between properties, and matching braces/brackets.
*/

window.PORTFOLIO_ENHANCEMENTS = {
  /*
    Hero text rotation:
    enhancements.js cycles through this array at a fixed interval. These labels
    are decorative status text, not navigation or project categories.
  */
  interests: [
    "Visual Computing",
    "Computer Vision",
    "Procedural Systems",
    "AI-Enabled Products",
    "3D Visualization",
    "Full-Stack Engineering"
  ],

  /*
    Project modal/case-study data:
    The current implementation connects these objects to project cards by array
    index. Reordering the visible cards requires reordering this array as well.
  */
  projectDetails: [
    {
      title: "Autonomous Driving Safety Research",
      type: "Research · Computer Vision · AI",
      role: "Solo researcher (advisor: Ozgur Izmirli, Ph.D., Connecticut College)",
      summary: "Designing parameterized rare-hazard scenarios in CARLA simulator and training reinforcement learning agents to evaluate how autonomous vehicles behave in high-risk situations. Research focuses on safety-critical edge cases underrepresented in standard benchmarks.",
      result: "Ongoing. Building a reproducible evaluation framework for rare-hazard autonomous driving scenarios.",
      tags: ["Python", "CARLA", "Reinforcement Learning"],
      caseStudy: "../../case-study.html?project=visual-intelligence",
      comparison: true
    },
    {
      title: "Procedural World Generation Framework",
      type: "Procedural Generation",
      role: "Solo developer — Phase 1 of senior independent project, Ammerman Center for Arts and Technology",
      summary: "Built a parameterized procedural world generation system in Unreal Engine 5 that dynamically creates explorable environments in real time. Implemented a playable character controller to navigate and interact with generated terrain, foliage, and structures.",
      result: "Infinite unique worlds generated from parameterized seeds, with full real-time player traversal.",
      tags: ["Unreal Engine", "PCG", "Blueprints"],
      caseStudy: "../../case-study.html?project=image-to-world"
    },
    {
      title: "AI Vision Scavenger Hunt",
      type: "AI · Full-Stack · Cloud",
      role: "Solo developer",
      summary: "Designed and deployed a full-stack multiplayer scavenger hunt game on Microsoft Azure. Players compete to photograph real-world objects; Azure AI Vision analyzes submitted images to validate completions. Built with React, Node.js/Express, and Docker containers on an Azure Virtual Machine.",
      result: "Fully deployed cloud application with real-time multiplayer and AI-powered photo validation.",
      tags: ["React", "Node.js", "Azure", "Docker"],
      caseStudy: "../../case-study.html?project=intelligent-web-app"
    },
    {
      title: "VR Environment — Meta Quest 3",
      type: "3D · VR · Real-Time",
      role: "Project co-lead, primary developer, sole programmer (2-person team)",
      summary: "Designed and developed interactive 3D environments in Unity with full VR integration for the Meta Quest 3 headset. Implemented physics-based object interactions, custom C# scripts, and optimized lighting and textures for immersive real-time experiences.",
      result: "Fully functional VR experience with natural physics interactions, playable on Meta Quest 3.",
      tags: ["C#", "Unity", "VR", "Meta Quest 3"],
      caseStudy: "../../case-study.html?project=visualization-vfx"
    }
  ]
};
