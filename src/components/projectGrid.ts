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

// --- Initial board packing --------------------------------------------------------

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
