import { forwardRef, useImperativeHandle, useLayoutEffect, useRef, useState } from 'react';
import { foregroundOpacity, rideProgress, tileOffset } from './journeyMotion';
import { scenerySurface, type SceneryTile, type ScenerySurface } from './scenerySurface';
import { sceneryCrops } from './sceneryCrops';
import mountain from '../assets/jungle/web/l1_mountain_cropped.webp';
import hills from '../assets/jungle/web/l2_green_cropped.webp';
import trees from '../assets/jungle/web/l3_trees_cropped.webp';
import road from '../assets/jungle/web/l4_road_cropped.webp';
import foreground from '../assets/jungle/web/l5_foreground_blurred_cropped.webp';

export interface CardWindow { left: number; top: number; width: number; height: number }
export interface JourneySceneryHandle { render: (progress: number, card: CardWindow | null) => void }
const scenery = [
  { src: mountain, speed: .12, y: 215, size: .70, group: 0 },
  { src: hills, speed: .28, y: 100, size: .85, group: 0 },
  { src: trees, speed: .45, y: 90, size: .65, group: 0 },
  { src: road, speed: .62, y: -70, size: .76, group: 2 },
  { src: foreground, speed: .85, y: 0, size: .70, group: 3 },
];

// Canvas bounds depend on the viewport, never on the 10,000px journey distance.
// Cap decoration resolution only; text, controls and the rider remain native DOM.
const MAX_SCENERY_DPR = 1;
const JourneyScenery = forwardRef<JourneySceneryHandle>((_, ref) => {
  const [generation, setGeneration] = useState(0);
  const fallback = useRef(false);
  const canvases = useRef<Array<HTMLCanvasElement | null>>([]);
  const state = useRef<{ progress: number; card: CardWindow | null }>({ progress: 0, card: null });
  const paint = useRef<(() => void) | null>(null);
  useImperativeHandle(ref, () => ({ render(progress, card) {
    state.current = { progress, card };
    paint.current?.();
  } }), []);

  useLayoutEffect(() => {
    const surfaces = canvases.current.filter((c): c is HTMLCanvasElement => !!c);
    const renderers: ScenerySurface[] = [];
    try {
      surfaces.forEach(canvas => renderers.push(scenerySurface(canvas, fallback.current)));
    } catch (error) {
      renderers.forEach(renderer => renderer.dispose());
      if (fallback.current) throw error;
      // A canvas cannot switch context types once WebGL was acquired. Remount
      // fresh canvases before falling back after shader/context setup failure.
      fallback.current = true;
      setGeneration(value => value + 1);
      return;
    }
    const lost = (event: Event) => event.preventDefault();
    const restored = () => setGeneration(value => value + 1);
    surfaces.forEach(canvas => {
      canvas.addEventListener('webglcontextlost', lost);
      canvas.addEventListener('webglcontextrestored', restored);
    });
    let disposed = false;
    let width = 0, height = 0, dpr = 1;
    let lastDistance = NaN;
    let lastCard = '';
    let loaded = false;
    let bitmapGeneration = 0;
    let bitmaps: ImageBitmap[] = [];
    const images = scenery.map(layer => {
      const image = new Image();
      image.decoding = 'async';
      image.src = layer.src;
      return image;
    });
    const tile = (index: number, distance: number): SceneryTile => {
      const layer = scenery[index];
      const crop = sceneryCrops[index];
      const originalHeight = height * layer.size;
      const w = originalHeight * crop.width / crop.height;
      return { id: index, image: bitmaps[index] || images[index], width: w,
        height: originalHeight * crop.croppedHeight / crop.height,
        top: height - originalHeight - layer.y + originalHeight * crop.top / crop.height,
        offset: tileOffset(distance * layer.speed, w) };
    };
    const draw = () => {
      if (!loaded || !width || !height) return;
      surfaces[3].style.opacity = String(foregroundOpacity(state.current.progress));
      const distance = rideProgress(state.current.progress) * 10000;
      if (distance !== lastDistance) {
        for (const group of [0, 2, 3]) {
          renderers[group].draw(scenery.flatMap((layer, i) => layer.group === group && images[i].naturalWidth ? [tile(i, distance)] : []));
        }
      }
      const card = state.current.card;
      const cardKey = card ? `${card.left},${card.top},${card.width},${card.height}` : '';
      if (cardKey !== lastCard || distance !== lastDistance) {
        renderers[1].draw(images[2].naturalWidth ? [tile(2, distance)] : [], card);
      }
      lastCard = cardKey;
      lastDistance = distance;
      surfaces[0].dataset.progress = String(state.current.progress);
    };
    const resize = () => {
      const host = surfaces[0].parentElement!;
      const nextWidth = host.clientWidth;
      const nextHeight = host.clientHeight;
      const nextDpr = Math.min(window.devicePixelRatio || 1, MAX_SCENERY_DPR);
      if (width === nextWidth && height === nextHeight && dpr === nextDpr) return;
      width = nextWidth; height = nextHeight; dpr = nextDpr;
      renderers.forEach(renderer => renderer.resize(width, height, dpr));
      lastDistance = NaN;
      lastCard = '';
      draw();
      if (loaded) prepareTiles();
    };
    const prepareTiles = async () => {
      const generation = ++bitmapGeneration;
      if (typeof createImageBitmap !== 'function') {
        draw();
        surfaces[0].dataset.ready = 'true';
        return;
      }
      // Resize once, not on every frame. In particular, don't repeatedly upload
      // 2752px source textures to a small, high-DPI phone viewport.
      const next = await Promise.all(images.map((image, i) => {
        const scale = Math.min(1, 2048 / image.naturalWidth, height * scenery[i].size * dpr / sceneryCrops[i].height);
        return createImageBitmap(image, {
          resizeWidth: Math.max(1, Math.round(image.naturalWidth * scale)),
          resizeHeight: Math.max(1, Math.round(image.naturalHeight * scale)),
          resizeQuality: 'high',
          premultiplyAlpha: 'premultiply',
        }).catch(() => null);
      }));
      if (disposed || generation !== bitmapGeneration) {
        next.forEach(bitmap => bitmap?.close());
        return;
      }
      if (next.some(bitmap => !bitmap)) {
        next.forEach(bitmap => bitmap?.close());
        draw();
        surfaces[0].dataset.ready = 'true';
        return;
      }
      bitmaps.forEach(bitmap => bitmap.close());
      bitmaps = next as ImageBitmap[];
      lastDistance = NaN;
      draw();
      surfaces[0].dataset.ready = 'true';
    };
    paint.current = draw;
    const observer = new ResizeObserver(resize);
    observer.observe(surfaces[0].parentElement!);
    resize();
    Promise.all(images.map(image => image.decode().catch(() => {}))).then(() => {
      if (disposed) return;
      loaded = true;
      prepareTiles();
    });
    return () => {
      disposed = true;
      paint.current = null;
      observer.disconnect();
      bitmaps.forEach(bitmap => bitmap.close());
      renderers.forEach(renderer => renderer.dispose());
      surfaces.forEach(canvas => {
        canvas.removeEventListener('webglcontextlost', lost);
        canvas.removeEventListener('webglcontextrestored', restored);
      });
    };
  }, [generation]);

  return <>{['back', 'reveal', 'road', 'front'].map((name, i) => (
    <canvas key={`${name}-${generation}`} ref={el => { canvases.current[i] = el; }}
      className={`jj-scenery jj-scenery--${name}`} aria-hidden="true" />
  ))}</>;
});
JourneyScenery.displayName = 'JourneyScenery';
export default JourneyScenery;
