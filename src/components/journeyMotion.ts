export const INTRO_END = 0.15;
export const RIDE_END = 0.85;
export const SCROLL_DISTANCE = 15000;
export const CONTENT_TRAVEL = 500;
export const clamp01 = (value: number) => Math.max(0, Math.min(1, value));
export const smoothStep = (value: number) => value * value * (3 - 2 * value);
// A short launch ramp rejoins the original distance exactly, keeping every
// project/hash destination unchanged beyond the first few scroll frames.
export function rideProgress(progress: number) {
  const start = clamp01((progress - INTRO_END) / .02);
  const linear = clamp01((progress - INTRO_END) / (RIDE_END - INTRO_END));
  return linear * (2 * start - start * start);
}

export function bikeDrive(progress: number) {
  const wheel = rideProgress(progress) * SCROLL_DISTANCE / 1800 * 360;
  // Coast into the launch before engaging the cranks and both rider sprites.
  // Progress-based staging stays reversible and cannot leave stale timers after
  // a fast scroll, hash jump or navigation back to the hero.
  const engagement = smoothStep(clamp01((progress - .156) / .024));
  return { wheel, pedals: wheel * engagement, dust: progress > .168 && progress < .82 };
}

// Wrap only at an exact image repeat. The two sides then show identical pixels.
export function tileOffset(distance: number, tileWidth: number) {
  return -(((distance % tileWidth) + tileWidth) % tileWidth);
}

export function bikePose(progress: number, origin: { x: number; y: number }, width: number) {
  const intro = clamp01(progress / INTRO_END);
  const introOut = 1 - (1 - intro) ** 3;
  let y: number;
  if (progress < .11) y = origin.y + (-15 - origin.y) * smoothStep(clamp01(progress / .11));
  else if (progress < .14) y = -15 - 10 * Math.sin(Math.PI * (progress - .11) / .03) ** 2;
  else y = -15;
  const anticipation = Math.sin(Math.PI * clamp01((progress - .132) / .03)) ** 2;
  const distance = rideProgress(progress) * SCROLL_DISTANCE;
  // Ease the road motion in so the landing has no discontinuous tilt or height.
  const roadBlend = smoothStep(clamp01((progress - INTRO_END) / .02));
  y += (Math.sin(distance / 1200 * Math.PI * 2) * 9 + Math.sin(distance / 48 * Math.PI * 2) * .1) * roadBlend;
  const exit = clamp01((progress - .83) / .07) ** 3;
  return {
    x: origin.x * (1 - intro) ** 2 - 5 * anticipation + width * 2.5 * exit,
    y,
    rotation: -30 * (1 - introOut) - 3 * anticipation + Math.cos(distance / 1200 * Math.PI * 2) * 4 * roadBlend,
    scale: .85 + .15 * introOut,
    opacity: 1 - exit,
  };
}

export function projectPose(progress: number, baseLeft: number, viewportHeight: number) {
  const left = baseLeft - CONTENT_TRAVEL * rideProgress(progress);
  const focus = smoothStep(clamp01(1 - (Math.abs(left - 50) - 5) / 40));
  return {
    left,
    y: viewportHeight * .25 * (1 - focus),
    scale: .5 + .5 * focus,
    opacity: progress < INTRO_END || progress >= RIDE_END ? 0 : clamp01(focus / .1),
  };
}
