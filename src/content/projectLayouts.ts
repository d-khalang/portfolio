export type ProjectLayoutBreakpoint = 'desktop' | 'tablet' | 'mobile';

export interface ProjectTileLayoutOverride {
  /** Optional one-based grid column. */
  col?: number;
  /** Optional one-based grid row. */
  row?: number;
  /** Optional width in grid cells. The content-derived width is used when omitted. */
  cols?: number;
  /** Optional height in grid cells. The content-derived height is used when omitted. */
  rows?: number;
}

type BreakpointLayout = Record<string, ProjectTileLayoutOverride>;
type ProjectLayout = Partial<Record<ProjectLayoutBreakpoint, BreakpointLayout>>;
type ProjectLayouts = Record<string, ProjectLayout>;

/**
 * Curated overrides for individual project tiles.
 *
 * Stable tile IDs:
 * - Core: role, status, domain, summary, challenge, response, result, stack, glyph
 * - Metrics: metric-<metric label>
 * - Story: highlight-0, lesson-0, next-0, and so on
 * - Media: <project id>-asset-0, <project id>-asset-1, and so on
 * - Links: link-<full URL>
 *
 * Only list tiles that need an explicit position or size. Every other tile follows
 * the semantic editorial layout and flows around these fixed rectangles.
 */
export const projectLayoutOverrides: ProjectLayouts = {
  atlas: {
    desktop: {
      role: { col: 1, row: 1, cols: 4, rows: 3 },
      status: { col: 6, row: 1, cols: 2, rows: 3 },
      'metric-Scale': { col: 9, row: 1, cols: 4, rows: 3 },
      domain: { col: 2, row: 4, cols: 3, rows: 2 },
      summary: { col: 1, row: 7, cols: 6, rows: 4 },
      glyph: { col: 10, row: 7, cols: 3, rows: 3 },
    },
  },
  kartino: {},
  recore: {},
  'replication-toolbox': {},
  'smart-plant-care': {},
};

export function getProjectLayoutOverrides(projectId: string, columns: number) {
  const breakpoint: ProjectLayoutBreakpoint = columns <= 4
    ? 'mobile'
    : columns <= 8
      ? 'tablet'
      : 'desktop';

  return projectLayoutOverrides[projectId]?.[breakpoint] ?? {};
}
