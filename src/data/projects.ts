export type ProjectMetric = {
  label: string;
  value: string;
};

export type ProjectMedia = {
  kind: "image" | "video";
  title: string;
  description: string;
  src?: string;
};

export type ProjectLink = {
  label: string;
  href: string;
};

export type WorldObject =
  | "atlas-core"
  | "signal-engine"
  | "resilience-stack"
  | "toolbox-crate"
  | "greenhouse";

export type ProjectWorld = {
  x: number;
  y: number;
  depth: number;
  scale: number;
  object: WorldObject;
  region: string;
  cameraScale: number;
  hue: string;
  aura: string;
  note: string;
};

export type Project = {
  id: string;
  slug: string;
  title: string;
  shortTitle: string;
  category: string;
  timeframe: string;
  status: "Live" | "In progress" | "Archive" | "Planned";
  role: string;
  teamContext: string;
  shortDescription: string;
  longDescription: string;
  tools: string[];
  tags: string[];
  outcomes: string[];
  metrics: ProjectMetric[];
  media: ProjectMedia[];
  links: ProjectLink[];
  featured: boolean;
  world: ProjectWorld;
};

export const projects: Project[] = [
  {
    id: "atlas",
    slug: "atlas",
    title: "RESILIAGE Atlas",
    shortTitle: "ATLAS",
    category: "Geospatial platform",
    timeframe: "2025 - present",
    status: "Live",
    role: "Full-stack engineer",
    teamContext: "EU Horizon project with an international 18-partner consortium",
    shortDescription:
      "An interactive geospatial platform for resilience mapping, layered exploration, and practical decision support.",
    longDescription:
      "ATLAS is the most literal translation of the Systems Atelier concept: maps, layers, legibility, and coordinated systems. It lets the portfolio feel spatial instead of sectioned, and proves that interface clarity can coexist with serious technical depth.",
    tools: ["React", "Vite", "TypeScript", "FastAPI", "MongoDB", "MapLibre", "AWS"],
    tags: ["maps", "geospatial", "frontend", "backend", "public tech"],
    outcomes: [
      "Shipped an interactive mapping product inside a larger resilience ecosystem",
      "Built map layer controls, responsive UI, and internationalization",
      "Supported the platform through backend and cloud deployment work",
    ],
    metrics: [
      { label: "consortium", value: "18 partners" },
      { label: "stack", value: "full-stack + cloud" },
      { label: "mode", value: "interactive geospatial" },
    ],
    media: [
      {
        kind: "image",
        title: "Map interface",
        description: "Hero map, layer manager, and spatial exploration views.",
      },
      {
        kind: "image",
        title: "System layers",
        description: "Architecture or service/data flow representation.",
      },
    ],
    links: [{ label: "Live platform", href: "https://atlas.resiliage-ecosystem.eu" }],
    featured: true,
    world: {
      x: 31,
      y: 42,
      depth: 140,
      scale: 1.12,
      object: "atlas-core",
      region: "Cartography deck",
      cameraScale: 1.68,
      hue: "#87e7b8",
      aura: "rgba(135,231,184,0.30)",
      note: "Spatial logic, layered controls, consortium-scale delivery",
    },
  },
  {
    id: "kartino",
    slug: "kartino",
    title: "Kartino",
    shortTitle: "KARTINO",
    category: "AI learning product",
    timeframe: "2025 - present",
    status: "Live",
    role: "Founder / product engineer",
    teamContext: "Solo-led product with end-to-end ownership",
    shortDescription:
      "An AI-powered Telegram flashcard product rebuilt from a prototype into a modular and production-ready learning system.",
    longDescription:
      "Kartino shows what happens when product taste meets system discipline. It is less about shipping a flashy AI feature and more about turning a rough idea into a maintainable, fast, observable, and genuinely usable product loop.",
    tools: ["Python", "FastAPI", "aiogram", "MongoDB", "Telegram", "Tracing"],
    tags: ["product", "performance", "backend", "ai", "learning"],
    outcomes: [
      "Migrated from workflow prototype to modular production backend",
      "Improved flashcard creation, lookup, and rating performance dramatically",
      "Added strong reliability, observability, and test coverage",
    ],
    metrics: [
      { label: "creation speed", value: "77-84%" },
      { label: "rating flow", value: "89-92%" },
      { label: "test suite", value: "286 tests" },
    ],
    media: [
      {
        kind: "image",
        title: "Product loop",
        description: "Flashcard generation and review flow visuals.",
      },
      {
        kind: "video",
        title: "System walkthrough",
        description: "A short clip explaining architecture and performance decisions.",
      },
    ],
    links: [{ label: "Live product", href: "https://kartino.it" }],
    featured: true,
    world: {
      x: 61,
      y: 31,
      depth: 195,
      scale: 1.18,
      object: "signal-engine",
      region: "Memory engine",
      cameraScale: 1.82,
      hue: "#c59dff",
      aura: "rgba(197,157,255,0.30)",
      note: "Optimization, observability, and the product loop made physical",
    },
  },
  {
    id: "recore",
    slug: "recore",
    title: "RECORE",
    shortTitle: "RECORE",
    category: "Resilience product system",
    timeframe: "2025 - present",
    status: "In progress",
    role: "Full-stack engineer",
    teamContext: "Connected platform work within the wider resilience ecosystem",
    shortDescription:
      "A companion platform inside the resilience space, treated here as a growing system object rather than a temporary placeholder card.",
    longDescription:
      "RECORE is intentionally designed into the world before its case study is fully written. That matters: the atelier should feel like an evolving machine with chambers that can be activated as the work matures, not a frozen brochure.",
    tools: ["React", "TypeScript", "FastAPI", "MongoDB"],
    tags: ["platform", "ecosystem", "resilience", "draft"],
    outcomes: [
      "Prepared as a first-class object in the portfolio world",
      "Keeps the structure future-proof while the project story evolves",
    ],
    metrics: [
      { label: "state", value: "growing dossier" },
      { label: "mode", value: "ready to expand" },
    ],
    media: [
      {
        kind: "image",
        title: "Interface preview",
        description: "Reserved for future screenshots and system diagrams.",
      },
    ],
    links: [],
    featured: true,
    world: {
      x: 74,
      y: 55,
      depth: 160,
      scale: 1.05,
      object: "resilience-stack",
      region: "Response stack",
      cameraScale: 1.66,
      hue: "#ffb47d",
      aura: "rgba(255,180,125,0.26)",
      note: "An unfinished but present chamber in the system world",
    },
  },
  {
    id: "replication-toolbox",
    slug: "replication-toolbox",
    title: "Replication Toolbox",
    shortTitle: "REPLICATION TOOLBOX",
    category: "Research toolkit",
    timeframe: "Upcoming",
    status: "Planned",
    role: "Engineer / system builder",
    teamContext: "Planned future portfolio case study",
    shortDescription:
      "A reserved slot for an upcoming project so the portfolio grows as an active workshop rather than a static archive.",
    longDescription:
      "This object is intentionally included as a latent machine in the environment. It tells visitors that the atelier is alive, with chambers still under construction.",
    tools: ["TBD"],
    tags: ["upcoming", "toolbox", "research"],
    outcomes: ["Reserved capacity for the next serious case study"],
    metrics: [{ label: "status", value: "planned chamber" }],
    media: [
      {
        kind: "image",
        title: "Future artifact slot",
        description: "Reserved for screenshots, diagrams, or a short demo.",
      },
    ],
    links: [],
    featured: false,
    world: {
      x: 43,
      y: 70,
      depth: 120,
      scale: 0.96,
      object: "toolbox-crate",
      region: "Research bay",
      cameraScale: 1.48,
      hue: "#8fd4ff",
      aura: "rgba(143,212,255,0.25)",
      note: "A sealed chamber waiting for the next build",
    },
  },
  {
    id: "smart-plant-care",
    slug: "smart-plant-care",
    title: "Smart Plant Care",
    shortTitle: "SMART PLANT CARE",
    category: "IoT product",
    timeframe: "2024 - 2025",
    status: "Archive",
    role: "Product / software engineer",
    teamContext: "Project connecting hardware, interfaces, automation, and messaging",
    shortDescription:
      "An IoT monitoring system combining sensors, actuators, Telegram interaction, and LLM-powered reporting.",
    longDescription:
      "This is an important range signal. It proves the work is not confined to web interfaces alone. The project adds a more human, living system to the portfolio world and supports the broader story of exploration across fields.",
    tools: ["Flask", "MQTT", "REST", "Docker", "Telegram", "LLM reporting"],
    tags: ["iot", "automation", "bot", "hardware", "range"],
    outcomes: [
      "Built a monitoring interface for five sensor and actuator types",
      "Enabled real-time remote interaction via Telegram",
      "Improved efficiency with Docker-managed control logic",
    ],
    metrics: [
      { label: "device types", value: "5" },
      { label: "efficiency", value: "~25%" },
    ],
    media: [
      {
        kind: "image",
        title: "Monitoring dashboard",
        description: "System controls, device state, and sensor dashboard views.",
      },
      {
        kind: "video",
        title: "Project demo",
        description: "Short walkthrough of the remote interaction and reporting flow.",
      },
    ],
    links: [],
    featured: false,
    world: {
      x: 21,
      y: 67,
      depth: 178,
      scale: 1.01,
      object: "greenhouse",
      region: "Living systems alcove",
      cameraScale: 1.6,
      hue: "#b8f289",
      aura: "rgba(184,242,137,0.25)",
      note: "Hardware, automation, and living feedback loops",
    },
  },
];

export const atelierSignals = [
  "Explorable portfolio, not passive page",
  "System objects instead of case-study thumbnails",
  "Depth, zoom, and discovery without losing clarity",
  "Performance, range, and product judgment embedded into the world",
];

export const evidence = [
  { label: "consortium", value: "18 partners" },
  { label: "performance", value: "77-84% gains" },
  { label: "tests", value: "286 unit tests" },
  { label: "standing", value: "Top 3% MSc" },
];

export const atelierModes = [
  {
    label: "Survey mode",
    description: "Scan the entire atelier and choose a chamber to enter.",
  },
  {
    label: "Immersion mode",
    description: "Zoom into a selected system object and open its dossier.",
  },
  {
    label: "Archive mode",
    description: "Reveal unfinished or dormant systems waiting to be activated.",
  },
];

export const routes = [
  ["atlas", "kartino"],
  ["atlas", "smart-plant-care"],
  ["atlas", "recore"],
  ["recore", "replication-toolbox"],
  ["smart-plant-care", "kartino"],
] as const;
