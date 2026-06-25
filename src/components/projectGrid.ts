export interface GridTileShape {
  id: string;
  cols: number;
  rows: number;
}

export interface GridPosition extends GridTileShape {
  col: number;
  row: number;
}

export type GridLayout = Record<string, GridPosition>;

export type ResizeDirection = 'n' | 'ne' | 'e' | 'se' | 's' | 'sw' | 'w' | 'nw';

export interface GridMinimumSize {
  minCols: number;
  minRows: number;
}

export interface GridLayoutOverride {
  col?: number;
  row?: number;
  cols?: number;
  rows?: number;
}

const MAX_LAYOUT_ROWS = 500;
const TRAILING_BOARD_ROWS = 2;

// --- Deterministic layout helpers -------------------------------------------------

function createRandom(seed: number) {
  let value = seed || 1;

  return () => {
    value = (value * 1664525 + 1013904223) % 4294967296;
    return value / 4294967296;
  };
}

function overlaps(left: GridPosition, right: GridPosition) {
  return !(
    left.col + left.cols <= right.col
    || right.col + right.cols <= left.col
    || left.row + left.rows <= right.row
    || right.row + right.rows <= left.row
  );
}

function normalizeTileShape(tile: GridTileShape, columns: number): GridTileShape {
  return {
    ...tile,
    cols: Math.min(tile.cols, columns),
  };
}

function getPositionBottom(position: GridPosition) {
  return position.row + position.rows - 1;
}

function getLayoutBottomRow(layout: GridLayout, fallbackRow = 1) {
  return Object.values(layout).reduce(
    (lastRow, position) => Math.max(lastRow, getPositionBottom(position)),
    fallbackRow,
  );
}

function getNextOpenRow(layout: GridLayout, fallbackRow = 1) {
  return getLayoutBottomRow(layout, fallbackRow - 1) + 1;
}

function createBoard(layout: GridLayout) {
  return {
    layout,
    rows: getLayoutBottomRow(layout) + TRAILING_BOARD_ROWS,
  };
}

// --- Collision rules --------------------------------------------------------------

function isInsideBoard(candidate: GridPosition, columns: number, rows: number) {
  return (
    candidate.col >= 1
    && candidate.row >= 1
    && candidate.col + candidate.cols - 1 <= columns
    && getPositionBottom(candidate) <= rows
  );
}

function getOverlappingPositions(candidate: GridPosition, layout: GridLayout, ignoredId?: string) {
  return Object.values(layout).filter((position) => (
    position.id !== ignoredId && overlaps(candidate, position)
  ));
}

export function canPlace(
  candidate: GridPosition,
  layout: GridLayout,
  columns: number,
  rows: number,
  ignoredId?: string,
) {
  return (
    isInsideBoard(candidate, columns, rows)
    && getOverlappingPositions(candidate, layout, ignoredId).length === 0
  );
}

// --- Curated default board --------------------------------------------------------

function getEditorialAnchor(columns: number, tileColumns: number, index: number) {
  const right = columns - tileColumns + 1;
  const center = Math.floor((columns - tileColumns) / 2) + 1;
  const nearLeft = Math.min(2, right);
  const nearRight = Math.max(1, right - 1);
  const anchors = columns <= 4
    ? [1, right, center]
    : [1, right, center, nearLeft, nearRight];

  return anchors[index % anchors.length];
}

export function createDefaultGridLayout(
  tileGroups: GridTileShape[][],
  columns: number,
  overrides: Record<string, GridLayoutOverride> = {},
) {
  const layout: GridLayout = {};
  const tilesById = new Map(tileGroups.flat().map((tile) => [tile.id, tile]));
  const configuredOverrides = Object.entries(overrides).filter(([, override]) => (
    override.col !== undefined
    || override.row !== undefined
    || override.cols !== undefined
    || override.rows !== undefined
  ));
  const inheritedLayout = configuredOverrides.length > 0
    ? createDefaultGridLayout(tileGroups, columns).layout
    : {};
  let groupStartRow = 1;

  configuredOverrides.forEach(([id, override]) => {
    const tile = tilesById.get(id);
    const inherited = inheritedLayout[id];

    if (!tile || !inherited) {
      return;
    }

    const candidate: GridPosition = {
      ...tile,
      col: override.col ?? inherited.col,
      row: override.row ?? inherited.row,
      cols: Math.min(override.cols ?? tile.cols, columns),
      rows: override.rows ?? tile.rows,
    };

    if (!canPlace(candidate, layout, columns, MAX_LAYOUT_ROWS)) {
      throw new Error(`Invalid default grid override for "${id}": outside the board or overlapping another override.`);
    }

    layout[id] = candidate;
  });

  tileGroups.filter((group) => group.length > 0).forEach((group) => {
    const groupIds = new Set(group.map((tile) => tile.id));

    group.forEach((tile, index) => {
      if (layout[tile.id]) {
        return;
      }

      const shape = normalizeTileShape(tile, columns);
      const preferredColumn = getEditorialAnchor(columns, shape.cols, index);
      let selected: GridPosition | undefined;
      let selectedScore = Number.POSITIVE_INFINITY;

      for (let row = groupStartRow; row <= MAX_LAYOUT_ROWS; row += 1) {
        for (let col = 1; col <= columns - shape.cols + 1; col += 1) {
          const candidate = { ...shape, col, row };

          if (!canPlace(candidate, layout, columns, MAX_LAYOUT_ROWS)) {
            continue;
          }

          const score = (row - groupStartRow) * 100 + Math.abs(col - preferredColumn) * 4 + col * 0.01;

          if (score < selectedScore) {
            selected = candidate;
            selectedScore = score;
          }
        }

        if (selected && row > selected.row) {
          break;
        }
      }

      layout[tile.id] = selected ?? {
        ...shape,
        col: 1,
        row: getNextOpenRow(layout, groupStartRow),
      };
    });

    const groupBottom = Object.values(layout)
      .filter((position) => groupIds.has(position.id))
      .reduce(
        (lastRow, position) => Math.max(lastRow, getPositionBottom(position)),
        groupStartRow,
      );

    // One completely empty grid row separates editorial sections.
    groupStartRow = groupBottom + 2;
  });

  return createBoard(layout);
}

// --- Random remix board -----------------------------------------------------------

export function createGridLayout(tiles: GridTileShape[], columns: number, seed: number) {
  const random = createRandom(seed + columns * 101);
  const layout: GridLayout = {};

  tiles.forEach((tile) => {
    const shape = normalizeTileShape(tile, columns);
    const candidates: GridPosition[] = [];

    for (let row = 1; row <= MAX_LAYOUT_ROWS && candidates.length < 12; row += 1) {
      for (let col = 1; col <= columns - shape.cols + 1 && candidates.length < 12; col += 1) {
        const candidate = { ...shape, col, row };

        if (canPlace(candidate, layout, columns, MAX_LAYOUT_ROWS)) {
          candidates.push(candidate);
        }
      }
    }

    const choiceWindow = Math.min(candidates.length, random() > 0.3 ? 8 : 12);
    const selected = candidates[Math.floor(random() * choiceWindow)] ?? {
      ...shape,
      col: 1,
      row: getNextOpenRow(layout),
    };

    layout[tile.id] = selected;
  });

  return createBoard(layout);
}

// --- Runtime movement -------------------------------------------------------------

export function moveTile(
  layout: GridLayout,
  id: string,
  deltaColumn: number,
  deltaRow: number,
  columns: number,
  rows: number,
) {
  const current = layout[id];

  if (!current) {
    return layout;
  }

  const candidate = {
    ...current,
    col: current.col + deltaColumn,
    row: current.row + deltaRow,
  };

  if (!canPlace(candidate, layout, columns, rows, id)) {
    return layout;
  }

  return {
    ...layout,
    [id]: candidate,
  };
}

export function resizeTile(
  layout: GridLayout,
  id: string,
  direction: ResizeDirection,
  deltaColumn: number,
  deltaRow: number,
  minimum: GridMinimumSize,
  columns: number,
  rows: number,
) {
  const current = layout[id];

  if (!current) {
    return layout;
  }

  const candidate = { ...current };

  if (direction.includes('e')) {
    candidate.cols += deltaColumn;
  }

  if (direction.includes('w')) {
    candidate.col += deltaColumn;
    candidate.cols -= deltaColumn;
  }

  if (direction.includes('s')) {
    candidate.rows += deltaRow;
  }

  if (direction.includes('n')) {
    candidate.row += deltaRow;
    candidate.rows -= deltaRow;
  }

  if (candidate.cols < minimum.minCols || candidate.rows < minimum.minRows) {
    return layout;
  }

  if (!canPlace(candidate, layout, columns, rows, id)) {
    return layout;
  }

  return {
    ...layout,
    [id]: candidate,
  };
}

export function getMoveOptions(
  layout: GridLayout,
  id: string,
  columns: number,
  rows: number,
) {
  const current = layout[id];

  if (!current) {
    return { up: false, right: false, down: false, left: false };
  }

  const isAvailable = (deltaColumn: number, deltaRow: number) => canPlace(
    {
      ...current,
      col: current.col + deltaColumn,
      row: current.row + deltaRow,
    },
    layout,
    columns,
    rows,
    id,
  );

  return {
    up: isAvailable(0, -1),
    right: isAvailable(1, 0),
    down: isAvailable(0, 1),
    left: isAvailable(-1, 0),
  };
}
