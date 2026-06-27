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
import { getProjectLayoutOverrides } from '../content/projectLayouts';
import {
  createDefaultGridLayout,
  createGridLayout,
  getMoveOptions,
  moveTile,
  resizeTile,
  type GridLayout,
  type GridPosition,
  type ResizeDirection,
} from './projectGrid';
import './ProjectDetail.css';

type Project = (typeof projectsData)[number];
type TileTone = 'white' | 'dark' | 'red' | 'soft' | 'line' | 'ghost';
type TileKind = 'fact' | 'story' | 'metric' | 'stack' | 'media' | 'glyph' | 'links';
type MediaShape = 'wide' | 'landscape' | 'portrait' | 'square';
type LayoutBreakpoint = 'desktop' | 'tablet' | 'mobile';

const showLayoutExportTools = true;

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
  'replication-toolbox': 'replication signal',
  'smart-plant-care': 'hardware signal',
};

const projectAssetMeta: Record<string, Record<string, ProjectAssetMeta>> = {
  atlas: {
    'image01.png': {
      title: 'Map and heritage inspector',
      width: 2731,
      height: 1517,
      description: 'Basic full map view of heritage markers and features.',
    },
    'image02.png': {
      title: 'Feature selection and active details',
      width: 1429,
      height: 1518,
      description: 'A closer map state showing clustered points, routes, and an active content card.',
    },
    'image03.png': {
      title: 'Layered map workspace',
      width: 2726,
      height: 1512,
      description: 'Collaboration area map workspace showing spatial overlays and active layer detail card with simbolisation and opacity bar.',
    },
    'image04.png': {
      title: 'Layer management',
      width: 666,
      height: 1438,
      description: 'Layer controls showing how the UI stacks active cards dynamically on the interface.',
    },
    'image05.png': {
      title: 'Vector layer rendering',
      width: 1311,
      height: 1343,
      description: 'Visualizing vector layer details on the map, showcasing high-performance PMTiles streaming.',
    },
    'image06.png': {
      title: 'Historical map georeferencing',
      width: 1510,
      height: 1336,
      description: 'Traditional map overlay with adjustable visibility, bridging historical context with modern layouts.',
    },
    'image07.png': {
      title: 'Geospatial taxonomy panel',
      width: 1028,
      height: 1451,
      description: 'Hierarchical directory displaying categorized layers, from cultural heritage to disaster risk reduction features.',
    },
  },
  kartino: {
    'image01.webp': {
      title: 'Marketing Landing Page',
      width: 1280,
      height: 719,
      description: 'The responsive web presence of Kartino presenting its feature set and character-driven design.',
    },
    'image02.webp': {
      title: 'Settings interface',
      width: 857,
      height: 688,
      description: 'Flexible settings menu mapping level parameters, translation targets, and daily reminders.',
    },
    'image03.webp': {
      title: 'Flashcard deck rendering',
      width: 1232,
      height: 2560,
      description: 'High-signal vocabulary flashcards generated dynamically in the Telegram interface.',
    },
    'image04.webp': {
      title: 'Interactive verb tables',
      width: 530,
      height: 1280,
      description: 'Grammar review tools showing comprehensive verb conjugation patterns.',
    },
    'generate.mp4': {
      title: 'Spaced repetition loop',
      width: 928,
      height: 1200,
      description: 'Live walkthrough showing a flashcard being generated from a word input and saving it to the active learning session.',
    },
    'kartino_setting_final.mp4': {
      title: 'Custom preferences selection',
      width: 1080,
      height: 1350,
      description: 'A quick run-through of configuring custom language level (CEFR) and review schedules inside Telegram.',
    },
    'kartino_verb.mp4': {
      title: 'Dynamic verb lookup',
      width: 928,
      height: 1200,
      description: 'Showing how the Telegram bot parses verb infinitives and prints instant conjugation tables.',
    },
  },
  recore: {
    'image01.webp': {
      title: 'Soft Solutions catalog',
      width: 2616,
      height: 1504,
      description: 'A modular tile/card-based catalog view displaying available soft solutions with interactive hover effects and pagination.',
    },
    'image02.webp': {
      title: 'Contact & Support portal',
      width: 1852,
      height: 1498,
      description: 'A dynamic contact page showing custom contact visual components and the platform inquiry form.',
    },
    'RECORE-card-transition.mp4': {
      title: 'Interactive hover transitions',
      width: 808,
      height: 1148,
      description: 'Autoplaying demonstration showing smooth fluid hover transitions and detailed content reveals on hover cards.',
    },
    'RECORE-monitoring.mp4': {
      title: 'Sticky monitoring board',
      width: 1930,
      height: 1072,
      description: 'Live preview of the sticky monitoring tools of the ecosystem.',
    },
  },
  'replication-toolbox': {
    'image01.webp': {
      title: 'Platform Onboarding',
      width: 2736,
      height: 1590,
      description: 'The dark-themed landing page welcoming stakeholders with structured entry paths into the replication ecosystem.',
    },
    'image02.webp': {
      title: 'Target Groups & Solutions',
      width: 2121,
      height: 1510,
      description: 'The role-selection view mapping resilience strategies and solutions to specific community stakeholder roles.',
    },
    'image03.webp': {
      title: 'Solution Info Card',
      width: 1089,
      height: 1381,
      description: 'An interactive knowledge card with structured Q&A accordions detailing replication steps and hosting direct S3 downloads.',
    },
    'image04.webp': {
      title: 'Step-by-Step User Guide',
      width: 1210,
      height: 1314,
      description: 'A structured deployment guide featuring nested steps and actions to help communities activate disaster risk management systems.',
    },
    'image05.webp': {
      title: 'Database Schema',
      width: 1024,
      height: 1024,
      description: 'The clean relational database model (ERD) mapping categories, solutions, user guides, files, and admins within PostgreSQL using Prisma.',
    },
    'image06.webp': {
      title: 'CMS Ingestion Dashboard',
      width: 1234,
      height: 1396,
      description: 'The admin content management system (CMS) dashboard supporting direct-to-S3 file uploads, metadata tracking, and structured taxonomy creation.',
    },
  },
  'smart-plant-care': {
    'architecture.png': {
      title: 'System Architecture',
      width: 1024,
      height: 1024,
      description: 'The modular microservice topology mapping the Flask interface, Telegram bot, dynamic Docker-based control units, and MQTT message broker.',
    },
    'image01.webp': {
      title: 'Catalog Schema',
      width: 1000,
      height: 450,
      description: 'The relational document schema mapping endpoints, handlers, and the MongoDB catalog database agent.',
    },
    'image02.webp': {
      title: 'Dynamic Controller Modularity',
      width: 1000,
      height: 800,
      description: 'Architectural overview of how room-specific controllers are dynamically configured and scaled.',
    },
    'image03.webp': {
      title: 'Flask Web Dashboard',
      width: 1000,
      height: 625,
      description: 'The visual web portal with embedded live ThingSpeak charts and manual hardware toggle overrides.',
    },
    'smart-plant-care-demo-placeholder.mp4': {
      title: 'Technical System Walkthrough',
      width: 1600,
      height: 900,
      description: 'Demonstration of MQTT message flow, Docker manager dynamics, and LLM-assisted Telegram diagnostics.',
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
  const rows = getTextRows(title, body, cols, 1);

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

function getProjectTiles(project: Project, assets: ProjectAsset[], seed: number | null): ProjectTile[] {
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
  ];

  const priorityTiles = supportingTiles.filter((tile) => tile.priority);
  const unprioritizedTiles = supportingTiles.filter((tile) => !tile.priority);
  const freeTiles = seed === null
    ? unprioritizedTiles
    : shuffleWithSeed(unprioritizedTiles, seed + 29);

  return [...priorityTiles, ...freeTiles];
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
            autoPlay
            loop
            preload="metadata"
          />
        ) : (
          <img
            src={asset.src}
            alt={`${project.core.title} ${asset.title}`}
            width={asset.width}
            height={asset.height}
            draggable={false}
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

  if (tile.kind === 'glyph') {
    const isKartino = project.id === 'kartino';
    const stickerSrc = isKartino ? assetModules['../assets/projects/common/stickers/kartino_reading.png'] : null;

    return (
      <div className="pd-tile pd-tile--glyph" style={style}>
        {stickerSrc ? (
          <img
            src={stickerSrc}
            alt="Kartino mascot"
            draggable={false}
            style={{
              width: '80%',
              height: '80%',
              objectFit: 'contain',
              position: 'relative',
              zIndex: 1,
            }}
          />
        ) : (
          <NothingGlyphMark label={`${project.core.title} glyph matrix`} />
        )}
      </div>
    );
  }

  if (tile.kind === 'media') {
    return <MediaTile tile={tile} project={project} />;
  }

  if (tile.kind === 'links') {
    const url = tile.id.startsWith('link-') ? tile.id.substring(5) : '';
    return (
      <a
        href={url}
        target="_blank"
        rel="noopener noreferrer"
        className={`pd-tile pd-tile--${tile.kind} pd-tile--${tile.tone} ${chromeClasses}`}
        style={{
          ...style,
          cursor: 'pointer',
          textDecoration: 'none',
          color: 'inherit',
        }}
      >
        {tile.eyebrow && <span>{tile.eyebrow}</span>}
        {tile.title && <strong>{tile.title}</strong>}
        {tile.body && <p>{tile.body}</p>}
      </a>
    );
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

interface ResizeDragState {
  id: string;
  pointerId: number;
  startX: number;
  startY: number;
  appliedColumns: number;
  appliedRows: number;
  direction: ResizeDirection;
}

const resizeDirections: ResizeDirection[] = ['n', 'ne', 'e', 'se', 's', 'sw', 'w', 'nw'];
type CardinalDirection = 'n' | 'e' | 's' | 'w';

function getTileMinimumSize(tile: ProjectTile, columns: number) {
  if (tile.kind === 'media') {
    const isPortrait = tile.asset?.shape === 'portrait';
    return {
      minCols: Math.min(columns, isPortrait ? 2 : 3),
      minRows: isPortrait ? 3 : 2,
    };
  }

  if (tile.kind === 'story' || tile.kind === 'glyph') {
    return { minCols: Math.min(columns, 2), minRows: 2 };
  }

  return { minCols: Math.min(columns, 2), minRows: 1 };
}

function interleaveTiles(left: ProjectTile[], right: ProjectTile[]) {
  const interleaved: ProjectTile[] = [];
  const length = Math.max(left.length, right.length);

  for (let index = 0; index < length; index += 1) {
    if (left[index]) {
      interleaved.push(left[index]);
    }

    if (right[index]) {
      interleaved.push(right[index]);
    }
  }

  return interleaved;
}

function createEditorialTileGroups(tiles: ProjectTile[]) {
  const primaryMetrics = tiles.filter((tile) => tile.kind === 'metric' && tile.priority);
  const supportingMetrics = tiles.filter((tile) => tile.kind === 'metric' && !tile.priority);
  const media = tiles.filter((tile) => tile.kind === 'media');
  const highlights = tiles.filter((tile) => tile.id.startsWith('highlight-'));
  const groups = [
    [
      tiles.find((tile) => tile.id === 'role'),
      ...primaryMetrics,
      tiles.find((tile) => tile.id === 'status'),
      tiles.find((tile) => tile.id === 'domain'),
    ].filter((tile): tile is ProjectTile => Boolean(tile)),
    [
      tiles.find((tile) => tile.id === 'summary'),
      tiles.find((tile) => tile.id === 'glyph'),
    ].filter((tile): tile is ProjectTile => Boolean(tile)),
    ['challenge', 'response', 'result']
      .map((id) => tiles.find((tile) => tile.id === id))
      .filter((tile): tile is ProjectTile => Boolean(tile)),
    [
      ...supportingMetrics,
      ...tiles.filter((tile) => tile.id === 'stack'),
      ...interleaveTiles(media, highlights),
    ],
    [
      ...tiles.filter((tile) => tile.id.startsWith('lesson-')),
      ...tiles.filter((tile) => tile.id.startsWith('next-')),
      ...tiles.filter((tile) => tile.kind === 'links'),
    ],
  ];
  const groupedIds = new Set(groups.flat().map((tile) => tile.id));
  const remainingTiles = tiles.filter((tile) => !groupedIds.has(tile.id));

  return remainingTiles.length > 0 ? [...groups, remainingTiles] : groups;
}

function snapDistanceToGridStep(distance: number, cellSize: number) {
  return Math.sign(distance) * Math.floor(Math.abs(distance) / cellSize + 0.5);
}

function getBoardCellSize(element: HTMLElement, columns: number) {
  const styles = window.getComputedStyle(element);
  const columnGap = Number.parseFloat(styles.columnGap) || 0;
  const rowGap = Number.parseFloat(styles.rowGap) || 0;

  return {
    column: (element.clientWidth - columnGap * (columns - 1)) / columns + columnGap,
    row: Number.parseFloat(styles.gridAutoRows) + rowGap,
  };
}

function getLayoutBreakpoint(columns: number): LayoutBreakpoint {
  if (columns <= 4) {
    return 'mobile';
  }

  if (columns <= 8) {
    return 'tablet';
  }

  return 'desktop';
}

function createLayoutOverrideSnapshot(
  projectId: string,
  breakpoint: LayoutBreakpoint,
  layout: GridLayout,
  tiles: ProjectTile[],
) {
  const tileLayout = tiles.reduce<Record<string, Pick<GridPosition, 'col' | 'row' | 'cols' | 'rows'>>>(
    (snapshot, tile) => {
      const position = layout[tile.id];

      if (position) {
        snapshot[tile.id] = {
          col: position.col,
          row: position.row,
          cols: position.cols,
          rows: position.rows,
        };
      }

      return snapshot;
    },
    {},
  );

  return {
    [projectId]: {
      [breakpoint]: tileLayout,
    },
  };
}

function downloadJsonFile(fileName: string, data: unknown) {
  const blob = new Blob([`${JSON.stringify(data, null, 2)}\n`], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');

  link.href = url;
  link.download = fileName;
  link.click();
  URL.revokeObjectURL(url);
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
  setSeed,
}: {
  tiles: ProjectTile[];
  project: Project;
  seed: number | null;
  setSeed: (seed: number | null) => void;
}) {
  const columns = useBoardColumns();
  const editorialGroups = useMemo(() => createEditorialTileGroups(tiles), [tiles]);
  const defaultOverrides = useMemo(
    () => getProjectLayoutOverrides(project.id, columns),
    [columns, project.id],
  );
  const initialBoard = useMemo(
    () => seed === null
      ? createDefaultGridLayout(editorialGroups, columns, defaultOverrides)
      : createGridLayout(tiles, columns, seed),
    [columns, defaultOverrides, editorialGroups, tiles, seed],
  );
  const [board, setBoard] = useState(initialBoard);
  const [activeId, setActiveId] = useState<string | null>(null);
  const [draggingId, setDraggingId] = useState<string | null>(null);
  const [moveOrigin, setMoveOrigin] = useState<GridPosition | null>(null);
  const [moveBlocked, setMoveBlocked] = useState<{ id: string; direction: CardinalDirection } | null>(null);
  const [resizingId, setResizingId] = useState<string | null>(null);
  const [resizingDirection, setResizingDirection] = useState<ResizeDirection | null>(null);
  const [resizeBlocked, setResizeBlocked] = useState<{ id: string; direction: ResizeDirection } | null>(null);
  const [layoutToolsEnabled, setLayoutToolsEnabled] = useState(false);
  const [layoutExportStatus, setLayoutExportStatus] = useState<string | null>(null);
  const boardRef = useRef<HTMLDivElement>(null);
  const layoutRef = useRef<GridLayout>(initialBoard.layout);
  const dragRef = useRef<DragState | null>(null);
  const resizeRef = useRef<ResizeDragState | null>(null);
  const [isPanelVisible, setIsPanelVisible] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false);

  useEffect(() => {
    const target = boardRef.current;
    if (!target) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        setIsPanelVisible(entry.isIntersecting);
      },
      {
        root: null,
        threshold: 0.02, // triggers when 2% of the board is visible
      }
    );

    observer.observe(target);
    return () => {
      observer.unobserve(target);
    };
  }, []);

  useEffect(() => {
    layoutRef.current = initialBoard.layout;
    setBoard(initialBoard);
    setActiveId(null);
    setDraggingId(null);
    setMoveOrigin(null);
    setMoveBlocked(null);
    setResizingId(null);
    setResizingDirection(null);
    setResizeBlocked(null);
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

  const resizeBySteps = (
    id: string,
    direction: ResizeDirection,
    requestedColumns: number,
    requestedRows: number,
  ) => {
    const tile = tiles.find((item) => item.id === id);

    if (!tile) {
      return { columns: 0, rows: 0 };
    }

    const minimum = getTileMinimumSize(tile, columns);
    let resizedColumns = 0;
    let resizedRows = 0;
    let nextLayout = layoutRef.current;
    const columnDirection = Math.sign(requestedColumns);
    const rowDirection = Math.sign(requestedRows);

    for (let step = 0; step < Math.abs(requestedColumns); step += 1) {
      const resizedLayout = resizeTile(
        nextLayout,
        id,
        direction,
        columnDirection,
        0,
        minimum,
        columns,
        board.rows,
      );

      if (resizedLayout === nextLayout) {
        break;
      }

      nextLayout = resizedLayout;
      resizedColumns += columnDirection;
    }

    for (let step = 0; step < Math.abs(requestedRows); step += 1) {
      const resizedLayout = resizeTile(
        nextLayout,
        id,
        direction,
        0,
        rowDirection,
        minimum,
        columns,
        board.rows,
      );

      if (resizedLayout === nextLayout) {
        break;
      }

      nextLayout = resizedLayout;
      resizedRows += rowDirection;
    }

    if (nextLayout !== layoutRef.current) {
      layoutRef.current = nextLayout;
      setBoard((current) => ({ ...current, layout: nextLayout }));
    }

    return { columns: resizedColumns, rows: resizedRows };
  };

  const handlePointerDown = (event: ReactPointerEvent<HTMLDivElement>, id: string) => {
    const target = event.target as HTMLElement;

    if (target.closest('a, button, video, input, textarea, select, [data-resize-handle]')) {
      return;
    }

    event.preventDefault();
    event.currentTarget.focus({ preventScroll: true });
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
    setMoveOrigin(layoutRef.current[id] ? { ...layoutRef.current[id] } : null);
    setMoveBlocked(null);
  };

  const handlePointerMove = (event: ReactPointerEvent<HTMLDivElement>) => {
    const drag = dragRef.current;
    const element = boardRef.current;

    if (!drag || drag.pointerId !== event.pointerId || !element) {
      return;
    }

    event.preventDefault();

    const deltaX = event.clientX - drag.startX;
    const deltaY = event.clientY - drag.startY;

    // Lock each gesture to its first dominant axis, matching Tetris-style movement.
    if (!drag.axis && Math.max(Math.abs(deltaX), Math.abs(deltaY)) >= 8) {
      drag.axis = Math.abs(deltaX) >= Math.abs(deltaY) ? 'horizontal' : 'vertical';
    }

    if (!drag.axis) {
      return;
    }

    const cellSize = getBoardCellSize(element, columns);
    const pointerDelta = drag.axis === 'horizontal' ? deltaX : deltaY;
    const cellStep = drag.axis === 'horizontal' ? cellSize.column : cellSize.row;
    const desiredSteps = snapDistanceToGridStep(pointerDelta, cellStep);
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
    setMoveBlocked(
      movedSteps === 0
        ? {
          id: drag.id,
          direction: drag.axis === 'horizontal'
            ? (requestedSteps > 0 ? 'e' : 'w')
            : (requestedSteps > 0 ? 's' : 'n'),
        }
        : null,
    );
  };

  const endDrag = (event: ReactPointerEvent<HTMLDivElement>) => {
    if (dragRef.current?.pointerId === event.pointerId) {
      dragRef.current = null;
      setDraggingId(null);
      setMoveOrigin(null);
      setMoveBlocked(null);
    }
  };

  const handleResizePointerDown = (
    event: ReactPointerEvent<HTMLSpanElement>,
    id: string,
    direction: ResizeDirection,
  ) => {
    event.preventDefault();
    event.stopPropagation();
    event.currentTarget.parentElement?.focus({ preventScroll: true });
    event.currentTarget.setPointerCapture(event.pointerId);
    resizeRef.current = {
      id,
      direction,
      pointerId: event.pointerId,
      startX: event.clientX,
      startY: event.clientY,
      appliedColumns: 0,
      appliedRows: 0,
    };
    setActiveId(id);
    setResizingId(id);
    setResizingDirection(direction);
    setResizeBlocked(null);
  };

  const handleResizePointerMove = (event: ReactPointerEvent<HTMLElement>) => {
    const resize = resizeRef.current;
    const element = boardRef.current;

    if (!resize || resize.pointerId !== event.pointerId || !element) {
      return;
    }

    event.preventDefault();

    const cellSize = getBoardCellSize(element, columns);
    const usesColumns = resize.direction.includes('e') || resize.direction.includes('w');
    const usesRows = resize.direction.includes('n') || resize.direction.includes('s');
    const desiredColumns = usesColumns
      ? snapDistanceToGridStep(event.clientX - resize.startX, cellSize.column)
      : 0;
    const desiredRows = usesRows
      ? snapDistanceToGridStep(event.clientY - resize.startY, cellSize.row)
      : 0;
    const requestedColumns = desiredColumns - resize.appliedColumns;
    const requestedRows = desiredRows - resize.appliedRows;

    if (requestedColumns === 0 && requestedRows === 0) {
      return;
    }

    const resized = resizeBySteps(resize.id, resize.direction, requestedColumns, requestedRows);
    resize.appliedColumns += resized.columns;
    resize.appliedRows += resized.rows;
    setResizeBlocked(
      resized.columns === 0
        && resized.rows === 0
        && (requestedColumns !== 0 || requestedRows !== 0)
        ? { id: resize.id, direction: resize.direction }
        : null,
    );
  };

  const endResize = (event: ReactPointerEvent<HTMLElement>) => {
    if (resizeRef.current?.pointerId === event.pointerId) {
      resizeRef.current = null;
      setResizingId(null);
      setResizingDirection(null);
      setResizeBlocked(null);
    }
  };

  const handleBoardPointerDown = (event: ReactPointerEvent<HTMLDivElement>) => {
    const target = event.target as HTMLElement;
    const clickedEmptyCell = target.classList.contains('pd-board__cell');

    if (target !== event.currentTarget && !clickedEmptyCell) {
      return;
    }

    setActiveId(null);
    setMoveBlocked(null);
    setResizeBlocked(null);

    if (document.activeElement instanceof HTMLElement && event.currentTarget.contains(document.activeElement)) {
      document.activeElement.blur();
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

    if (event.shiftKey || event.altKey) {
      const resizeInput: Record<string, [ResizeDirection, number, number]> = {
        ArrowUp: ['n', 0, event.altKey ? 1 : -1],
        ArrowRight: ['e', event.altKey ? -1 : 1, 0],
        ArrowDown: ['s', 0, event.altKey ? -1 : 1],
        ArrowLeft: ['w', event.altKey ? 1 : -1, 0],
      };
      const [direction, deltaColumn, deltaRow] = resizeInput[event.key];
      resizeBySteps(id, direction, deltaColumn, deltaRow);
      return;
    }

    moveBySteps(id, movement[0], movement[1], 1);
  };

  const draggingPosition = draggingId ? board.layout[draggingId] : undefined;
  const resizingPosition = resizingId ? board.layout[resizingId] : undefined;
  const hasMovedFromOrigin = Boolean(
    moveOrigin
    && draggingPosition
    && (moveOrigin.col !== draggingPosition.col || moveOrigin.row !== draggingPosition.row),
  );
  const layoutBreakpoint = getLayoutBreakpoint(columns);
  const getCurrentLayoutSnapshot = () => createLayoutOverrideSnapshot(
    project.id,
    layoutBreakpoint,
    board.layout,
    tiles,
  );

  const logCurrentLayout = () => {
    const snapshot = getCurrentLayoutSnapshot();

    console.info(`[project-grid] ${project.id}/${layoutBreakpoint} layout override`, snapshot);
    console.log(`[project-grid] ${project.id}/${layoutBreakpoint} layout JSON\n${JSON.stringify(snapshot, null, 2)}`);
    console.table(snapshot[project.id][layoutBreakpoint]);
    setLayoutExportStatus(`logged ${project.id}/${layoutBreakpoint}`);
  };

  const downloadCurrentLayout = () => {
    downloadJsonFile(`${project.id}-${layoutBreakpoint}-layout.json`, getCurrentLayoutSnapshot());
    setLayoutExportStatus(`downloaded ${project.id}/${layoutBreakpoint}`);
  };

  return (
    <section className="pd-board-section" aria-labelledby="board-instructions">
      {showLayoutExportTools && (
        <div className="pd-board-tools" aria-label="Layout export tools">
          <label>
            <input
              type="checkbox"
              checked={layoutToolsEnabled}
              onChange={(event) => setLayoutToolsEnabled(event.currentTarget.checked)}
            />
            layout tools
          </label>
          {layoutToolsEnabled && (
            <div className="pd-board-tools__actions">
              <button type="button" onClick={logCurrentLayout}>
                log layout
              </button>
              <button type="button" onClick={downloadCurrentLayout}>
                download json
              </button>
              {layoutExportStatus && (
                <span className="pd-board-tools__status" aria-live="polite">
                  {layoutExportStatus}
                </span>
              )}
            </div>
          )}
        </div>
      )}
      <p id="board-instructions" className="pd-board-instructions">
        Drag tiles to move. Pull an edge or corner to resize by grid cells. Arrow keys move; Shift + arrow grows and Alt + arrow shrinks.
      </p>
      <div
        ref={boardRef}
        className="pd-board"
        style={{ '--board-columns': columns, '--board-rows': board.rows } as CSSProperties}
        onPointerDown={handleBoardPointerDown}
      >
        {Array.from({ length: columns * board.rows }).map((_, index) => (
          <span key={index} className="pd-board__cell" aria-hidden="true" />
        ))}
        {moveOrigin && draggingId && (
          <span
            className="pd-board__move-origin"
            style={{
              gridColumn: `${moveOrigin.col} / span ${moveOrigin.cols}`,
              gridRow: `${moveOrigin.row} / span ${moveOrigin.rows}`,
            }}
            aria-hidden="true"
          />
        )}
        {hasMovedFromOrigin && draggingPosition && (
          <span
            className="pd-board__move-destination"
            style={{
              gridColumn: `${draggingPosition.col} / span ${draggingPosition.cols}`,
              gridRow: `${draggingPosition.row} / span ${draggingPosition.rows}`,
            }}
            aria-hidden="true"
          />
        )}
        {resizingPosition && (
          <span
            className="pd-board__resize-preview"
            style={{
              gridColumn: `${resizingPosition.col} / span ${resizingPosition.cols}`,
              gridRow: `${resizingPosition.row} / span ${resizingPosition.rows}`,
            }}
            aria-hidden="true"
          />
        )}
        {tiles.map((tile) => {
          const position = board.layout[tile.id];

          if (!position) {
            return null;
          }

          const directions = getMoveOptions(board.layout, tile.id, columns, board.rows);
          const isActive = activeId === tile.id;
          const isResizing = resizingId === tile.id;
          const blockedResizeDirection = resizeBlocked?.id === tile.id ? resizeBlocked.direction : null;
          const blockedMoveDirection = moveBlocked?.id === tile.id ? moveBlocked.direction : null;
          const blockedDirection = blockedResizeDirection ?? blockedMoveDirection;
          const blockedEdges = (['n', 'e', 's', 'w'] as CardinalDirection[]).filter(
            (edge) => blockedDirection?.includes(edge),
          );
          const hasBlockedEdge = blockedEdges.length > 0;

          return (
            <div
              key={tile.id}
              data-tile-id={tile.id}
              className={`pd-board__item${isActive ? ' is-active' : ''}${draggingId === tile.id ? ' is-dragging' : ''}${isResizing ? ' is-resizing' : ''}${hasBlockedEdge ? ' is-interaction-blocked' : ''}`}
              style={{
                gridColumn: `${position.col} / span ${position.cols}`,
                gridRow: `${position.row} / span ${position.rows}`,
              }}
              tabIndex={0}
              draggable={false}
              aria-label={`${tile.eyebrow ?? tile.kind} tile, ${position.cols} by ${position.rows} cells. Arrow keys move; Shift grows; Alt shrinks.`}
              aria-roledescription="movable and resizable grid tile"
              onFocus={() => setActiveId(tile.id)}
              onKeyDown={(event) => handleKeyDown(event, tile.id)}
              onPointerDown={(event) => handlePointerDown(event, tile.id)}
              onPointerMove={(event) => {
                handlePointerMove(event);
                handleResizePointerMove(event);
              }}
              onPointerUp={(event) => {
                endDrag(event);
                endResize(event);
              }}
              onPointerCancel={(event) => {
                endDrag(event);
                endResize(event);
              }}
            >
              <span className="pd-move-affordance" aria-hidden="true">
                <span>↕</span>
                <span>↔</span>
                <small>drag</small>
              </span>
              <span className={`pd-move-hint pd-move-hint--up${directions.up ? ' is-valid' : ''}`} aria-hidden="true">↑</span>
              <span className={`pd-move-hint pd-move-hint--right${directions.right ? ' is-valid' : ''}`} aria-hidden="true">→</span>
              <span className={`pd-move-hint pd-move-hint--down${directions.down ? ' is-valid' : ''}`} aria-hidden="true">↓</span>
              <span className={`pd-move-hint pd-move-hint--left${directions.left ? ' is-valid' : ''}`} aria-hidden="true">←</span>
              <span className="pd-size-readout" aria-hidden="true">{position.cols} × {position.rows}</span>
              {blockedEdges.map((edge) => (
                <span key={edge} className={`pd-blocked-edge pd-blocked-edge--${edge}`} aria-hidden="true" />
              ))}
              {resizeDirections.map((direction) => (
                <span
                  key={direction}
                  className={`pd-resize-handle pd-resize-handle--${direction}${isResizing && resizingDirection === direction ? ' is-current' : ''}${blockedResizeDirection === direction ? ' is-blocked' : ''}`}
                  data-resize-handle={direction}
                  aria-hidden="true"
                  onPointerDown={(event) => handleResizePointerDown(event, tile.id, direction)}
                  onPointerMove={handleResizePointerMove}
                  onPointerUp={endResize}
                  onPointerCancel={endResize}
                  onLostPointerCapture={endResize}
                />
              ))}
              <ProjectTileView tile={tile} project={project} />
            </div>
          );
        })}
      </div>

      {/* Floating Side Panel */}
      <div
        className={`pd-grid-panel ${isPanelVisible ? 'is-visible' : ''} ${isExpanded ? 'is-expanded' : ''}`}
        onMouseEnter={() => setIsExpanded(true)}
        onMouseLeave={() => setIsExpanded(false)}
        onClick={() => setIsExpanded(!isExpanded)}
      >
        <div className="pd-grid-panel__tab">
          <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2">
            <rect x="3" y="3" width="7" height="7"></rect>
            <rect x="14" y="3" width="7" height="7"></rect>
            <rect x="14" y="14" width="7" height="7"></rect>
            <rect x="3" y="14" width="7" height="7"></rect>
          </svg>
          <span className="pd-grid-panel__arrow">◀</span>
        </div>
        <div className="pd-grid-panel__body" onClick={(e) => e.stopPropagation()}>
          <button
            type="button"
            className="pd-grid-panel__btn"
            onClick={() => {
              setSeed(getInitialSeed(project));
            }}
          >
            Remix Grid
          </button>
          <button
            type="button"
            className="pd-grid-panel__btn"
            onClick={() => {
              setSeed(null);
            }}
          >
            Default Layout
          </button>
        </div>
      </div>
    </section>
  );
}

export default function ProjectDetail({ project }: ProjectDetailProps) {
  const [seed, setSeed] = useState<number | null>(null);
  const assets = useMemo(() => getProjectAssets(project), [project]);
  const tiles = useMemo(() => getProjectTiles(project, assets, seed), [assets, project, seed]);
  const visualLabel = visualLabels[project.id] ?? 'project signal';

  return (
    <main className="pd-page">
      <nav className="pd-nav" aria-label="Project navigation">
        <a href="/">portfolio</a>
        <span>{project.core.dateLabel}</span>
      </nav>

      <header className="pd-hero" aria-labelledby="project-title">
        <div className="pd-title-lockup">
          <p className="pd-kicker">Project ( {visualLabel} )</p>
          <h1 id="project-title">{project.core.title}</h1>
          <p>{project.core.tagline}</p>
          <div className="pd-actions">
            {project.core.links.map((link) => (
              <a
                key={link.url}
                href={link.url}
                target="_blank"
                rel="noopener noreferrer"
                className={link.type === 'github' ? 'pd-action-github' : undefined}
              >
                {link.type === 'github' && (
                  <svg
                    viewBox="0 0 24 24"
                    width="14"
                    height="14"
                    fill="currentColor"
                    style={{ marginRight: '6px', display: 'inline-block', verticalAlign: 'text-bottom' }}
                  >
                    <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z" />
                  </svg>
                )}
                {link.label}
              </a>
            ))}
          </div>
        </div>
      </header>

      <InteractiveProjectGrid tiles={tiles} project={project} seed={seed} setSeed={setSeed} />
    </main>
  );
}
