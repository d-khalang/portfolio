# Systems Atelier Build Spec

## Goal

Build a portfolio that positions Danial Khalili as:

**a deep technical engineer who builds complex products with product taste, system clarity, and creative restraint**

This should not feel like:

- a generic engineer portfolio
- a flashy creative-dev clone
- a minimal text-only blog
- a product agency website

It should feel like:

- authored
- technical
- spatial
- calm
- memorable
- evidence-driven

## Core concept realization

The "Systems Atelier" idea should be realized as a hybrid of:

- editorial portfolio
- technical studio
- systems archive
- spatial dashboard

The homepage should feel like entering a calm workshop for complex products.
Not a literal workshop illustration, and not a literal admin dashboard.
More like a designed environment where projects, diagrams, metrics, and notes coexist.

## Key inspiration translated into product decisions

From the stronger portfolio references, we should borrow:

### From Antoine Wodniack

- strong personal authorship
- a memorable first-screen visual system
- confidence in typography and pacing

### From Rauno Freiberg

- restraint
- clarity of thought
- high signal with low noise

### From Pedro Duarte

- credibility through directness
- product-minded framing
- confidence without overexplaining

### From Mike Matas

- clean career-story logic
- elegance in presenting evidence
- concise but high-trust storytelling

### What we should avoid

- Bruno-Simon-style novelty as the main experience
- heavy WebGL or spectacle-first interaction
- too much black-box abstraction
- overdecorated "creative developer" tropes

## Experience principles

### 1. The first screen must make one clear claim

Possible framing:

- Building complex products with engineering depth and product taste.
- I turn ambitious technical ideas into production-ready systems.

### 2. The design should feel spatial

Use:

- layered panels
- map-like composition
- grids
- annotations
- structured content blocks

Avoid:

- plain centered hero + generic cards

### 3. Projects should feel like systems, not thumbnails

Each featured project should immediately communicate:

- what it is
- why it mattered
- what systems were involved
- what changed because of your work

### 4. Proof should be part of the design

Metrics, architecture, constraints, scale, and outcomes should appear inside the visual hierarchy.

### 5. Motion should communicate, not decorate

Use motion for:

- reveals
- continuity
- emphasis
- spatial orientation

Avoid motion that slows down reading or hides content.

## Initial site structure

- Home
- Work
- Project detail pages
- About
- Contact

Optional later:

- Notes / writing
- Resume page

## Homepage structure

### Hero

- strong thesis statement
- short positioning sentence
- one spatial visual composition
- subtle indicators of systems, maps, metrics, or architecture

### Selected systems

- featured projects displayed as designed system objects
- each with type, stack, short summary, and one primary proof point

### How I build

- a short section describing your approach:
  complex systems, product thinking, efficiency, and shipping discipline

### Evidence strip

- concise metrics such as:
  latency improvements, test coverage, consortium scale, honors, publication

### About / contact close

- human but concise
- leave room for your broader identity without losing seriousness

## Project content model

Each project should support:

- id
- slug
- title
- short title
- category
- year or time range
- status
- short description
- long description
- role
- team/context
- tools
- tags
- key outcomes
- proof metrics
- images
- video
- links
- featured flag
- accent color or visual identity

## Initial project set

- Kartino
- ATLAS
- RECORE
- Replication Toolbox
- Smart Plant Care

Because Replication Toolbox comes later, the model should already support hidden or draft projects.

## Visual system

### Tone

- warm technical
- precise
- elegant
- grounded

### Likely ingredients

- serif display paired with a clean sans
- warm neutrals with muted green/teal/ink accents
- subtle grid lines
- layered cards
- small annotation labels
- restrained gradients

### Avoid

- default Tailwind-app look
- heavy purple-on-black portfolio style
- too much glassmorphism
- too much monochrome minimalism

## Implementation strategy

### Phase 1

- scaffold the app
- establish typography, colors, layout tokens, and project data
- build a strong homepage skeleton

### Phase 2

- build project cards and project detail pages
- add image handling and media blocks
- refine motion and transitions

### Phase 3

- final polish
- SEO, metadata, responsiveness, accessibility
- content refinement and storytelling edits

## Recommendation

We should not pause for a long spec process.

The right move is:

1. keep this lean spec
2. scaffold immediately
3. build the homepage and project model
4. refine from a real artifact
