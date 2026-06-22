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

// --- Collision rules --------------------------------------------------------------

export function canPlace(
  candidate: GridPosition,
  layout: GridLayout,
  columns: number,
  rows: number,
  ignoredId?: string,
) {
  if (
    candidate.col < 1
    || candidate.row < 1
    || candidate.col + candidate.cols - 1 > columns
    || candidate.row + candidate.rows - 1 > rows
  ) {
    return false;
  }

  return Object.values(layout).every((position) => (
    position.id === ignoredId || !overlaps(candidate, position)
  ));
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

    if (!canPlace(candidate, layout, columns, 500)) {
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

      const shape = {
        ...tile,
        cols: Math.min(tile.cols, columns),
      };
      const preferredColumn = getEditorialAnchor(columns, shape.cols, index);
      let selected: GridPosition | undefined;
      let selectedScore = Number.POSITIVE_INFINITY;

      for (let row = groupStartRow; row <= 500; row += 1) {
        for (let col = 1; col <= columns - shape.cols + 1; col += 1) {
          const candidate = { ...shape, col, row };

          if (!canPlace(candidate, layout, columns, 500)) {
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
        row: Object.values(layout).reduce(
          (lastRow, position) => Math.max(lastRow, position.row + position.rows),
          groupStartRow,
        ),
      };
    });

    const groupBottom = Object.values(layout)
      .filter((position) => groupIds.has(position.id))
      .reduce(
        (lastRow, position) => Math.max(lastRow, position.row + position.rows - 1),
        groupStartRow,
      );

    // One completely empty grid row separates editorial sections.
    groupStartRow = groupBottom + 2;
  });

  const occupiedRows = Object.values(layout).reduce(
    (lastRow, position) => Math.max(lastRow, position.row + position.rows - 1),
    1,
  );

  return {
    layout,
    rows: occupiedRows + 2,
  };
}

// --- Random remix board -----------------------------------------------------------

export function createGridLayout(tiles: GridTileShape[], columns: number, seed: number) {
  const random = createRandom(seed + columns * 101);
  const layout: GridLayout = {};

  tiles.forEach((tile) => {
    const shape = {
      ...tile,
      cols: Math.min(tile.cols, columns),
    };
    const candidates: GridPosition[] = [];

    for (let row = 1; row <= 500 && candidates.length < 12; row += 1) {
      for (let col = 1; col <= columns - shape.cols + 1 && candidates.length < 12; col += 1) {
        const candidate = { ...shape, col, row };

        if (canPlace(candidate, layout, columns, 500)) {
          candidates.push(candidate);
        }
      }
    }

    const choiceWindow = Math.min(candidates.length, random() > 0.3 ? 8 : 12);
    const selected = candidates[Math.floor(random() * choiceWindow)] ?? {
      ...shape,
      col: 1,
      row: Object.values(layout).reduce(
        (lastRow, position) => Math.max(lastRow, position.row + position.rows),
        1,
      ),
    };

    layout[tile.id] = selected;
  });

  const occupiedRows = Object.values(layout).reduce(
    (lastRow, position) => Math.max(lastRow, position.row + position.rows - 1),
    1,
  );

  return {
    layout,
    rows: occupiedRows + 2,
  };
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
