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
      role: { col: 4, row: 1, cols: 4, rows: 3 },
      domain: { col: 1, row: 2, cols: 3, rows: 2 },
      status: { col: 3, row: 4, cols: 2, rows: 2 },
      'metric-Scale': { col: 5, row: 5, cols: 2, rows: 3 },
      'atlas-asset-0': { col: 8, row: 2, cols: 5, rows: 3 },
      'metric-Delivery': { col: 1, row: 7, cols: 3, rows: 2 },
      'atlas-asset-4': { col: 8, row: 7, cols: 4, rows: 4 },
      summary: { col: 2, row: 10, cols: 6, rows: 3 },
      'link-https://atlas.resiliage-ecosystem.eu': { col: 9, row: 12, cols: 3, rows: 2 },
      stack: { col: 5, row: 14, cols: 4, rows: 4 },
      'metric-Data pipeline': { col: 9, row: 15, cols: 2, rows: 1 },
      'metric-Performance': { col: 3, row: 17, cols: 2, rows: 1 },
      glyph: { col: 10, row: 17, cols: 3, rows: 3 },
      result: { col: 1, row: 19, cols: 4, rows: 2 },
      challenge: { col: 5, row: 20, cols: 4, rows: 2 },
      response: { col: 9, row: 21, cols: 4, rows: 2 },
      'atlas-asset-1': { col: 1, row: 22, cols: 4, rows: 4 },
      'highlight-0': { col: 8, row: 24, cols: 2, rows: 2 },
      'highlight-1': { col: 6, row: 25, cols: 2, rows: 2 },
      'highlight-2': { col: 2, row: 28, cols: 2, rows: 2 },
      'atlas-asset-2': { col: 4, row: 27, cols: 9, rows: 5 },
      'highlight-3': { col: 1, row: 30, cols: 2, rows: 2 },
      'atlas-asset-3': { col: 2, row: 34, cols: 3, rows: 6 },
      'lesson-0': { col: 5, row: 34, cols: 4, rows: 2 },
      'atlas-asset-5': { col: 9, row: 33, cols: 4, rows: 4 },
      'atlas-asset-6': { col: 6, row: 37, cols: 4, rows: 5 },
      'lesson-1': { col: 4, row: 41, cols: 2, rows: 2 },
      'next-0': { col: 10, row: 38, cols: 2, rows: 2 },
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
