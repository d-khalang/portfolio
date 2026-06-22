import {
  type CSSProperties,
  type KeyboardEvent,
  type PointerEvent as ReactPointerEvent,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import projectsData from '../content/projects.json';
import { createGridLayout, getMoveOptions, moveTile, type GridLayout } from './projectGrid';
import './ProjectDetail.css';

type Project = (typeof projectsData)[number];
type TileTone = 'white' | 'dark' | 'red' | 'soft' | 'line' | 'ghost';
type TileKind = 'fact' | 'story' | 'metric' | 'stack' | 'media' | 'glyph' | 'empty' | 'links';
type MediaShape = 'wide' | 'landscape' | 'portrait' | 'square';

interface ProjectDetailProps {
  project: Project;
}

interface ProjectAsset {
  id: string;
  src: string;
  type: 'image' | 'video';
  title: string;
  fileName: string;
  width: number;
  height: number;
  description: string;
  shape: MediaShape;
}

interface ProjectTile {
  id: string;
  kind: TileKind;
  eyebrow?: string;
  title?: string;
  body?: string;
  tone: TileTone;
  cols: number;
  rows: number;
  asset?: ProjectAsset;
  priority?: boolean;
  hasBackground?: boolean;
  hasBorder?: boolean;
}

interface ProjectAssetMeta {
  title: string;
  width: number;
  height: number;
  description: string;
}

const assetModules = import.meta.glob('../assets/projects/**/*.{png,jpg,jpeg,webp,mp4,webm}', {
  eager: true,
  import: 'default',
  query: '?url',
}) as Record<string, string>;

const visualLabels: Record<string, string> = {
  atlas: 'cartography signal',
  kartino: 'learning signal',
  recore: 'platform signal',
  'replication-toolbox': 'future signal',
  'smart-plant-care': 'hardware signal',
};

const projectAssetMeta: Record<string, Record<string, ProjectAssetMeta>> = {
  atlas: {
    'image01.png': {
      title: 'Map and heritage inspector',
      width: 2731,
      height: 1517,
      description: 'Map view combining heritage markers with a contextual content panel.',
    },
    'image02.png': {
      title: 'Regional map detail',
      width: 1429,
      height: 1518,
      description: 'A closer map state showing clustered points, routes, and an active content card.',
    },
    'image03.png': {
      title: 'Layered map workspace',
      width: 2726,
      height: 1512,
      description: 'Full-width map workspace with spatial overlays and project navigation.',
    },
    'image04.png': {
      title: 'Mobile map state',
      width: 666,
      height: 1438,
      description: 'Tall mobile capture proving the map interface can compress into a narrow viewport.',
    },
    'image05.png': {
      title: 'Layer management',
      width: 1311,
      height: 1343,
      description: 'Layer controls for toggling active map items without leaving the map context.',
    },
    'image06.png': {
      title: 'Content drawer',
      width: 1510,
      height: 1336,
      description: 'Drawer interaction for reading mapped cultural content while keeping location visible.',
    },
  },
};

function createRandom(seed: number) {
  let value = seed || 1;

  return () => {
    value = (value * 1664525 + 1013904223) % 4294967296;
    return value / 4294967296;
  };
}

function shuffleWithSeed<T>(items: T[], seed: number) {
  const random = createRandom(seed);
  const shuffled = [...items];

  for (let index = shuffled.length - 1; index > 0; index -= 1) {
    const swapIndex = Math.floor(random() * (index + 1));
    [shuffled[index], shuffled[swapIndex]] = [shuffled[swapIndex], shuffled[index]];
  }

  return shuffled;
}

function getProjectSeed(project: Project) {
  return project.id.split('').reduce((total, character) => total + character.charCodeAt(0), 0);
}

function getInitialSeed(project: Project) {
  return Date.now() + Math.floor(Math.random() * 1000) + getProjectSeed(project);
}

function getAssetTitle(path: string) {
  const fileName = path.split('/').pop()?.replace(/\.[^.]+$/, '') ?? 'asset';
  return fileName.replace(/[-_]/g, ' ');
}

function getMediaShape(width: number, height: number): MediaShape {
  const ratio = width / height;

  if (ratio >= 1.55) {
    return 'wide';
  }

  if (ratio >= 1.12) {
    return 'landscape';
  }

  if (ratio <= 0.72) {
    return 'portrait';
  }

  return 'square';
}

function getProjectAssets(project: Project): ProjectAsset[] {
  return Object.entries(assetModules)
    .filter(([path]) => path.includes(`/projects/${project.id}/`))
    .sort(([leftPath], [rightPath]) => leftPath.localeCompare(rightPath))
    .map(([path, src], index) => {
      const isVideo = /\.(mp4|webm)$/i.test(path);
      const fileName = path.split('/').pop() ?? `asset-${index}`;
      const meta = projectAssetMeta[project.id]?.[fileName];
      const width = meta?.width ?? 1600;
      const height = meta?.height ?? 900;

      return {
        id: `${project.id}-asset-${index}`,
        src,
        type: isVideo ? 'video' : 'image',
        title: meta?.title ?? getAssetTitle(path),
        fileName,
        width,
        height,
        description: meta?.description ?? 'Project visual artifact awaiting a more specific caption.',
        shape: getMediaShape(width, height),
      };
    });
}

function getTextRows(title = '', body = '', cols = 3, base = 1) {
  const titleWeight = title.length / (cols * 20);
  const bodyWeight = body.length / (cols * 52);
  return Math.max(base, Math.ceil(base + titleWeight + bodyWeight));
}

function createFactTile(
  id: string,
  eyebrow: string,
  title: string,
  body: string | undefined,
  tone: TileTone,
): ProjectTile {
  const length = title.length + (body?.length ?? 0);
  const cols = length > 115 ? 4 : length > 62 ? 3 : 2;

  return {
    id,
    kind: 'fact',
    eyebrow,
    title,
    body,
    tone,
    cols,
    rows: getTextRows(title, body, cols, tone === 'red' ? 2 : 1),
    hasBackground: tone !== 'ghost',
    hasBorder: true,
  };
}

function createStoryTile(id: string, eyebrow: string, title: string, body: string): ProjectTile {
  const length = title.length + body.length;
  const cols = length > 240 ? 6 : length > 150 ? 5 : length > 85 ? 4 : 3;
  const rows = length > 300 ? 4 : length > 130 ? 3 : 2;

  return {
    id,
    kind: 'story',
    eyebrow,
    title,
    body,
    tone: 'ghost',
    cols,
    rows,
    hasBackground: true,
    hasBorder: false,
  };
}

function getMediaCols(asset: ProjectAsset) {
  if (asset.shape === 'wide') {
    return 6;
  }

  if (asset.shape === 'landscape') {
    return 5;
  }

  if (asset.shape === 'portrait') {
    return 3;
  }

  return 4;
}

function getMediaRows(asset: ProjectAsset, cols: number) {
  const ratio = asset.width / asset.height;
  const imageRows = (cols * 0.72) / ratio;
  const captionRows = asset.description.length > cols * 62 ? 0.75 : 0.55;

  return Math.max(3, Math.ceil(imageRows + captionRows));
}

function getProjectTiles(project: Project, assets: ProjectAsset[], seed: number): ProjectTile[] {
  const primaryMetric = project.story.metrics[0];
  const categoryPreview = project.core.categories.slice(0, 3).join(' + ');
  const stackPreview = project.core.stack.join(' / ');
  const mediaTiles = assets.map<ProjectTile>((asset, index) => {
    const cols = getMediaCols(asset);

    return {
      id: asset.id,
      kind: 'media',
      eyebrow: asset.type,
      title: asset.title,
      tone: 'ghost',
      cols,
      rows: getMediaRows(asset, cols),
      asset,
      priority: index === 0,
      hasBackground: true,
      hasBorder: false,
    };
  });
  const supportingTiles: ProjectTile[] = [
    { ...createFactTile('role', 'role', project.core.role, project.core.teamContext, 'soft'), priority: true },
    createFactTile('status', 'status', project.core.status, project.core.dateLabel, 'red'),
    {
      ...createFactTile('domain', 'domain', categoryPreview, project.core.links[0]?.label ?? 'private artifact', 'line'),
      cols: 3,
    },
    createStoryTile('summary', 'summary', project.story.summary, project.story.highlights[0] ?? project.story.outcome),
    createStoryTile('challenge', 'challenge', 'Why it exists', project.story.problem),
    createStoryTile('response', 'response', 'How it works', project.story.solution),
    createStoryTile('result', 'result', 'What changed', project.story.outcome),
    {
      id: 'stack',
      kind: 'stack',
      eyebrow: 'stack',
      title: stackPreview,
      body: `${project.core.stack.length} tools in the build`,
      tone: 'line',
      cols: project.core.stack.length > 5 ? 4 : 3,
      rows: getTextRows(stackPreview, `${project.core.stack.length} tools in the build`, 4, 2),
      hasBackground: true,
      hasBorder: false,
    },
    {
      id: 'glyph',
      kind: 'glyph',
      tone: 'dark',
      cols: 3,
      rows: 3,
      hasBackground: true,
      hasBorder: true,
    },
    ...project.story.metrics.map<ProjectTile>((metric, index) => ({
      id: `metric-${metric.label}`,
      kind: 'metric',
      eyebrow: metric.label,
      title: metric.value,
      body: index === 0 && primaryMetric ? 'primary signal' : undefined,
      tone: index === 0 ? 'red' : 'white',
      cols: metric.value.length > 24 ? 4 : 3,
      rows: getTextRows(metric.value, metric.label, metric.value.length > 24 ? 4 : 3, 2),
      priority: index === 0,
      hasBackground: true,
      hasBorder: index === 0,
    })),
    ...project.story.highlights.slice(1).map<ProjectTile>((highlight, index) => (
      createStoryTile(`highlight-${index}`, 'signal', `0${index + 1}`, highlight)
    )),
    ...project.story.lessons.map<ProjectTile>((lesson, index) => (
      createStoryTile(`lesson-${index}`, 'lesson', 'What stayed useful', lesson)
    )),
    ...project.core.links.map<ProjectTile>((link) => ({
      id: `link-${link.url}`,
      kind: 'links',
      eyebrow: 'open',
      title: link.label,
      body: link.url.replace(/^https?:\/\//, ''),
      tone: 'dark',
      cols: 3,
      rows: 2,
      hasBackground: true,
      hasBorder: true,
    })),
    ...project.story.nextSteps.map<ProjectTile>((step, index) => (
      createStoryTile(`next-${index}`, 'next input', 'Needs detail', step)
    )),
    ...mediaTiles,
    ...Array.from({ length: Math.max(9, Math.ceil(supportingEmptyCount(project, assets))) }).map<ProjectTile>(
      (_, index) => ({
        id: `empty-${index}`,
        kind: 'empty',
        tone: 'ghost',
        cols: index % 4 === 0 ? 4 : index % 3 === 0 ? 2 : 3,
        rows: index % 3 === 0 ? 2 : 1,
        hasBackground: false,
        hasBorder: index % 4 !== 1,
      }),
    ),
  ];

  const priorityTiles = supportingTiles.filter((tile) => tile.priority);
  const freeTiles = shuffleWithSeed(
    supportingTiles.filter((tile) => !tile.priority),
    seed + 29,
  );

  return [...priorityTiles, ...freeTiles];
}

function supportingEmptyCount(project: Project, assets: ProjectAsset[]) {
  return project.story.metrics.length + assets.length + 6;
}

function NothingGlyphMark({ label }: { label: string }) {
  return (
    <div className="pd-glyph-mark" aria-label={label}>
      {Array.from({ length: 72 }).map((_, index) => (
        <span
          key={index}
          className={index % 7 === 0 || index % 11 === 0 ? 'pd-glyph-mark__dot is-lit' : 'pd-glyph-mark__dot'}
        />
      ))}
    </div>
  );
}

function MediaTile({ tile, project }: { tile: ProjectTile; project: Project }) {
  const asset = tile.asset;

  if (!asset) {
    return null;
  }

  const chromeClasses = [
    tile.hasBackground === false ? 'pd-tile--no-bg' : '',
    tile.hasBorder === false ? 'pd-tile--no-border' : '',
  ].filter(Boolean).join(' ');
  const mediaClasses = `pd-tile pd-tile--media pd-tile--${asset.shape} ${chromeClasses}`;
  const style = {
    '--media-ratio': asset.width / asset.height,
    '--tile-cols': tile.cols,
    '--tile-rows': tile.rows,
  } as CSSProperties;

  return (
    <article className={mediaClasses} style={style}>
      <figure>
        {asset.type === 'video' ? (
          <video
            src={asset.src}
            width={asset.width}
            height={asset.height}
            controls
            muted
            playsInline
            preload="metadata"
          />
        ) : (
          <img
            src={asset.src}
            alt={`${project.core.title} ${asset.title}`}
            width={asset.width}
            height={asset.height}
            loading="lazy"
          />
        )}
        <figcaption>
          <span>
            {asset.type} / {asset.width}x{asset.height}
          </span>
          <strong>{asset.title}</strong>
          <p>{asset.description}</p>
        </figcaption>
      </figure>
    </article>
  );
}

function ProjectTileView({ tile, project }: { tile: ProjectTile; project: Project }) {
  const chromeClasses = [
    tile.hasBackground === false ? 'pd-tile--no-bg' : '',
    tile.hasBorder === false ? 'pd-tile--no-border' : '',
  ].filter(Boolean).join(' ');
  const style = {
    '--tile-cols': tile.cols,
    '--tile-rows': tile.rows,
  } as CSSProperties;

  if (tile.kind === 'empty') {
    return <div className={`pd-tile pd-tile--empty ${chromeClasses}`} style={style} aria-hidden="true" />;
  }

  if (tile.kind === 'glyph') {
    return (
      <div className="pd-tile pd-tile--glyph" style={style}>
        <NothingGlyphMark label={`${project.core.title} glyph matrix`} />
      </div>
    );
  }

  if (tile.kind === 'media') {
    return <MediaTile tile={tile} project={project} />;
  }

  return (
    <article className={`pd-tile pd-tile--${tile.kind} pd-tile--${tile.tone} ${chromeClasses}`} style={style}>
      {tile.eyebrow && <span>{tile.eyebrow}</span>}
      {tile.title && <strong>{tile.title}</strong>}
      {tile.body && <p>{tile.body}</p>}
    </article>
  );
}

interface DragState {
  id: string;
  pointerId: number;
  startX: number;
  startY: number;
  appliedSteps: number;
  axis: 'horizontal' | 'vertical' | null;
}

// --- Responsive board configuration ----------------------------------------------

function useBoardColumns() {
  const getColumns = () => {
    if (window.innerWidth <= 760) {
      return 4;
    }

    if (window.innerWidth <= 1180) {
      return 8;
    }

    return 12;
  };
  const [columns, setColumns] = useState(getColumns);

  useEffect(() => {
    const updateColumns = () => setColumns(getColumns());
    window.addEventListener('resize', updateColumns);
    return () => window.removeEventListener('resize', updateColumns);
  }, []);

  return columns;
}

// --- Board controller and renderer ------------------------------------------------

function InteractiveProjectGrid({
  tiles,
  project,
  seed,
}: {
  tiles: ProjectTile[];
  project: Project;
  seed: number;
}) {
  const columns = useBoardColumns();
  const movableTiles = useMemo(() => tiles.filter((tile) => tile.kind !== 'empty'), [tiles]);
  const initialBoard = useMemo(() => createGridLayout(movableTiles, columns, seed), [columns, movableTiles, seed]);
  const [board, setBoard] = useState(initialBoard);
  const [activeId, setActiveId] = useState<string | null>(null);
  const [draggingId, setDraggingId] = useState<string | null>(null);
  const boardRef = useRef<HTMLDivElement>(null);
  const layoutRef = useRef<GridLayout>(initialBoard.layout);
  const dragRef = useRef<DragState | null>(null);

  useEffect(() => {
    layoutRef.current = initialBoard.layout;
    setBoard(initialBoard);
    setActiveId(null);
    setDraggingId(null);
  }, [initialBoard]);

  // Every drag distance is replayed as one-cell moves so tiles cannot skip blockers.
  const moveBySteps = (id: string, deltaColumn: number, deltaRow: number, requestedSteps: number) => {
    const direction = Math.sign(requestedSteps);
    let movedSteps = 0;
    let nextLayout = layoutRef.current;

    for (let step = 0; step < Math.abs(requestedSteps); step += 1) {
      const movedLayout = moveTile(
        nextLayout,
        id,
        deltaColumn * direction,
        deltaRow * direction,
        columns,
        board.rows,
      );

      if (movedLayout === nextLayout) {
        break;
      }

      nextLayout = movedLayout;
      movedSteps += direction;
    }

    if (nextLayout !== layoutRef.current) {
      layoutRef.current = nextLayout;
      setBoard((current) => ({ ...current, layout: nextLayout }));
    }

    return movedSteps;
  };

  const handlePointerDown = (event: ReactPointerEvent<HTMLDivElement>, id: string) => {
    const target = event.target as HTMLElement;

    if (target.closest('a, button, video, input, textarea, select')) {
      return;
    }

    event.currentTarget.setPointerCapture(event.pointerId);
    dragRef.current = {
      id,
      pointerId: event.pointerId,
      startX: event.clientX,
      startY: event.clientY,
      appliedSteps: 0,
      axis: null,
    };
    setActiveId(id);
    setDraggingId(id);
  };

  const handlePointerMove = (event: ReactPointerEvent<HTMLDivElement>) => {
    const drag = dragRef.current;
    const element = boardRef.current;

    if (!drag || drag.pointerId !== event.pointerId || !element) {
      return;
    }

    const deltaX = event.clientX - drag.startX;
    const deltaY = event.clientY - drag.startY;

    // Lock each gesture to its first dominant axis, matching Tetris-style movement.
    if (!drag.axis && Math.max(Math.abs(deltaX), Math.abs(deltaY)) >= 8) {
      drag.axis = Math.abs(deltaX) >= Math.abs(deltaY) ? 'horizontal' : 'vertical';
    }

    if (!drag.axis) {
      return;
    }

    const styles = window.getComputedStyle(element);
    const columnGap = Number.parseFloat(styles.columnGap) || 0;
    const rowGap = Number.parseFloat(styles.rowGap) || 0;
    const columnStep = (element.clientWidth - columnGap * (columns - 1)) / columns + columnGap;
    const rowStep = Number.parseFloat(styles.gridAutoRows) + rowGap;
    const pointerDelta = drag.axis === 'horizontal' ? deltaX : deltaY;
    const cellStep = drag.axis === 'horizontal' ? columnStep : rowStep;
    const desiredSteps = Math.trunc(pointerDelta / cellStep);
    const requestedSteps = desiredSteps - drag.appliedSteps;

    if (requestedSteps === 0) {
      return;
    }

    const movedSteps = moveBySteps(
      drag.id,
      drag.axis === 'horizontal' ? 1 : 0,
      drag.axis === 'vertical' ? 1 : 0,
      requestedSteps,
    );
    drag.appliedSteps += movedSteps;
  };

  const endDrag = (event: ReactPointerEvent<HTMLDivElement>) => {
    if (dragRef.current?.pointerId === event.pointerId) {
      dragRef.current = null;
      setDraggingId(null);
    }
  };

  const handleKeyDown = (event: KeyboardEvent<HTMLDivElement>, id: string) => {
    const movement = {
      ArrowUp: [0, -1],
      ArrowRight: [1, 0],
      ArrowDown: [0, 1],
      ArrowLeft: [-1, 0],
    }[event.key];

    if (!movement) {
      return;
    }

    event.preventDefault();
    setActiveId(id);
    moveBySteps(id, movement[0], movement[1], 1);
  };

  return (
    <section className="pd-board-section" aria-labelledby="board-instructions">
      <p id="board-instructions" className="pd-board-instructions">
        Drag a tile along one axis. Occupied cells block movement. Focus a tile and use arrow keys for precise moves.
      </p>
      <div
        ref={boardRef}
        className="pd-board"
        style={{ '--board-columns': columns, '--board-rows': board.rows } as CSSProperties}
      >
        {Array.from({ length: columns * board.rows }).map((_, index) => (
          <span key={index} className="pd-board__cell" aria-hidden="true" />
        ))}
        {movableTiles.map((tile) => {
          const position = board.layout[tile.id];

          if (!position) {
            return null;
          }

          const directions = getMoveOptions(board.layout, tile.id, columns, board.rows);
          const isActive = activeId === tile.id;

          return (
            <div
              key={tile.id}
              className={`pd-board__item${isActive ? ' is-active' : ''}${draggingId === tile.id ? ' is-dragging' : ''}`}
              style={{
                gridColumn: `${position.col} / span ${position.cols}`,
                gridRow: `${position.row} / span ${position.rows}`,
              }}
              tabIndex={0}
              aria-label={`${tile.eyebrow ?? tile.kind} tile. Use arrow keys to move.`}
              aria-roledescription="movable grid tile"
              onFocus={() => setActiveId(tile.id)}
              onKeyDown={(event) => handleKeyDown(event, tile.id)}
              onPointerDown={(event) => handlePointerDown(event, tile.id)}
              onPointerMove={handlePointerMove}
              onPointerUp={endDrag}
              onPointerCancel={endDrag}
            >
              <span className="pd-drag-grip" aria-hidden="true">⠿</span>
              <span className={`pd-move-hint pd-move-hint--up${directions.up ? ' is-valid' : ''}`} aria-hidden="true">↑</span>
              <span className={`pd-move-hint pd-move-hint--right${directions.right ? ' is-valid' : ''}`} aria-hidden="true">→</span>
              <span className={`pd-move-hint pd-move-hint--down${directions.down ? ' is-valid' : ''}`} aria-hidden="true">↓</span>
              <span className={`pd-move-hint pd-move-hint--left${directions.left ? ' is-valid' : ''}`} aria-hidden="true">←</span>
              <ProjectTileView tile={tile} project={project} />
            </div>
          );
        })}
      </div>
    </section>
  );
}

export default function ProjectDetail({ project }: ProjectDetailProps) {
  const [seed, setSeed] = useState(() => getInitialSeed(project));
  const assets = useMemo(() => getProjectAssets(project), [project]);
  const tiles = useMemo(() => getProjectTiles(project, assets, seed), [assets, project, seed]);
  const visualLabel = visualLabels[project.id] ?? 'project signal';

  return (
    <main className="pd-page">
      <nav className="pd-nav" aria-label="Project navigation">
        <a href="/">Nothing (portfolio)</a>
        <span>{project.core.dateLabel}</span>
      </nav>

      <header className="pd-hero" aria-labelledby="project-title">
        <div className="pd-title-lockup">
          <p className="pd-kicker">Project ( {visualLabel} )</p>
          <h1 id="project-title">{project.core.title}</h1>
          <p>{project.core.tagline}</p>
          <div className="pd-actions">
            <button type="button" onClick={() => setSeed(getInitialSeed(project))}>
              remix grid
            </button>
            {project.core.links.map((link) => (
              <a key={link.url} href={link.url}>
                {link.label}
              </a>
            ))}
          </div>
        </div>
      </header>

      <InteractiveProjectGrid tiles={tiles} project={project} seed={seed} />
    </main>
  );
}
