# Jungle Journey: System Skill & Documentation

This document defines the architectural and visual standards for the Jungle Journey Portfolio.

## 1. Visual DNA (The "Modernist Linocut" Style)
- **Lines**: Thick, consistent black outlines (2pt - 4pt).
- **Colors**: Muted, earthy palette (Sage #7B8F7B, Terracotta #B35A44, Midnight #123B45).
- **Shading**: None. Use flat color blocks or linocut textures (stippling/hatching).
- **Depth**: Created purely through the 8-layer parallax "sandwich."

## 2. The 8-Layer Parallax Architecture
Every asset must be assigned to one of these layers. Moving an asset between layers changes its perceived distance and speed.

| Z-Index | Layer Name | Speed Multiplier | Role |
| :--- | :--- | :--- | :--- |
| 10 | Sky | 0.05 | Static atmosphere |
| 20 | Far Hills | 0.10 | Distant horizon |
| 30 | Mid Jungle | 0.25 | Environment depth |
| 40 | Project Deck | 1.00 | The Content (Hero) |
| 50 | Screen Trees | 0.40 | The "Sandwich" (occlusion) |
| 60 | The Path | 0.50 | The Stage for the Biker |
| 70 | Biker | Fixed | The User's Avatar |
| 80 | Foreground | 0.85 | High-speed motion blur effect |

## 3. Technical Engine (GSAP + React)
- **Global Scroll**: The vertical `window` scroll is intercepted and mapped to the horizontal `x` position of the `journey-track`.
- **Project Triggers**: Project cards use `Framer Motion`'s `whileInView` to "emerge" or "pop" when the biker passes them.
- **Occlusion Logic**: Project cards (Z:40) MUST slide behind Screen Trees (Z:50) to create a sense of discovery.

## 4. Asset Workflow
1. **Generation**: Prompt with the "Modernist Linocut" base.
2. **Transparency**: Use Photopea/Adobe Express to remove backgrounds.
3. **Stitching**: Combine 1536px tiles into a 5000px+ panorama.
4. **Optimization**: Export as `.webp` at 70% quality to ensure smooth 60fps scrolling.

## 5. Maintenance Rituals
- **Adding a Project**: Add the entry to `projects.json`. Ensure it has a `journeyPosition` (0.0 to 1.0) to tell the engine where it sits in the jungle.
- **Adding an Animal**: Animals should be separate small PNGs placed on Layer 3 (behind projects) or Layer 8 (in front) for maximum "wow" factor.
