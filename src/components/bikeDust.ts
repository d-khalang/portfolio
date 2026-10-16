// Scroll-driven dust is painted into the bike's single layer from the same
// frame update that turns the wheels. CSS transform animations would promote
// every particle to its own layer and force the rotating wheels, chainring and
// seat into overlap layers that are re-rasterised on every ride frame.
// Each entry mirrors a keyframe set in BikeCharacter.css: linear motion from
// the origin to (x, y, rotate, scale), opacity 0 → peak → 0.

export interface DustMotion {
  duration: number;
  delay: number;
  fromScale: number;
  peakAt: number;
  peak: number;
  x: number;
  y: number;
  rotate: number;
  toScale: number;
  /** Pedal particles are centred on their pedal before moving. */
  centered?: boolean;
}

const motion = (duration: number, delay: number, fromScale: number, peakAt: number, peak: number,
  x: number, y: number, rotate: number, toScale: number, centered = false): DustMotion =>
  ({ duration, delay, fromScale, peakAt, peak, x, y, rotate, toScale, centered });

export const DUST_MOTIONS: Record<string, Record<string, DustMotion>> = {
  'rear-wheel-dust': {
    'puff-1': motion(.7, 0, .4, .15, .85, -90, -45, 0, 1.6),
    'puff-2': motion(.8, .15, .3, .2, .9, -120, -30, 0, 1.4),
    'puff-3': motion(.9, .3, .5, .15, .75, -100, -60, 0, 2),
    'puff-4': motion(.65, .45, .3, .2, .8, -80, -25, 0, 1.2),
    'puff-5': motion(.85, .6, .4, .15, .85, -110, -50, 0, 1.7),
    'speck-1': motion(.4, .05, .5, .1, 1, -130, -70, 270, .8),
    'speck-2': motion(.45, .22, .6, .1, 1, -150, -50, -180, .9),
    'speck-3': motion(.5, .38, .4, .1, 1, -110, -90, 360, .7),
  },
  'front-wheel-dust': {
    'puff-1': motion(.75, 0, .4, .15, .7, -60, -25, 0, 1.3),
    'puff-2': motion(.85, .2, .4, .15, .75, -80, -35, 0, 1.5),
    'puff-3': motion(.65, .4, .3, .2, .6, -50, -15, 0, 1.1),
    'speck-1': motion(.45, .1, .5, .1, .9, -90, -45, 180, .7),
    'speck-2': motion(.5, .3, .4, .1, .8, -70, -30, -180, .6),
  },
  'pedal-dust': {
    'p-1': motion(.6, 0, .3, .15, .85, -40, 10, 120, 1.2, true),
    'p-2': motion(.7, .2, .4, .15, .9, -35, -15, -180, 1, true),
    'p-3': motion(.8, .4, .3, .2, .75, -50, -5, 90, 1.1, true),
  },
};

/** Pose at phase 0..1 within one cycle, matching the CSS keyframes. */
export function dustPose(m: DustMotion, phase: number) {
  const opacity = phase < m.peakAt ? m.peak * phase / m.peakAt : m.peak * (1 - phase) / (1 - m.peakAt);
  const scale = m.fromScale * (1 - phase) + m.toScale * phase;
  const transform = `${m.centered ? 'translate(-50%, -50%) ' : ''}translate(${m.x * phase}px, ${m.y * phase}px) rotate(${m.rotate * phase}deg) scale(${scale})`;
  return { opacity, transform };
}

/**
 * Seconds-based state of one particle. While riding it loops; after the rider
 * stops (`stoppedAt`) each particle finishes its current puff and then stays hidden.
 */
export function dustPhase(m: DustMotion, elapsed: number, stoppedAt: number | null) {
  const local = elapsed - m.delay;
  if (local < 0) return null;
  const cycle = Math.floor(local / m.duration);
  if (stoppedAt !== null) {
    const stoppedLocal = stoppedAt - m.delay;
    if (stoppedLocal < 0 || cycle > Math.floor(stoppedLocal / m.duration)) return null;
  }
  return local / m.duration - cycle;
}
