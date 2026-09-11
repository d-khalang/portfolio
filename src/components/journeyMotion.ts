export const INTRO_END = 0.15;
export const RIDE_END = 0.85;
export const SCROLL_DISTANCE = 15000;
export const CONTENT_TRAVEL = 500;
export const clamp01 = (value: number) => Math.max(0, Math.min(1, value));
export const smoothStep = (value: number) => value * value * (3 - 2 * value);
export const rideProgress = (progress: number) => clamp01((progress - INTRO_END) / (RIDE_END - INTRO_END));

// Wrap only at an exact image repeat. The two sides then show identical pixels.
export function tileOffset(distance: number, tileWidth: number) {
  return -(((distance % tileWidth) + tileWidth) % tileWidth);
}

export function bikePose(progress: number, origin: { x: number; y: number }, width: number) {
  const intro = clamp01(progress / INTRO_END);
  const introOut = 1 - (1 - intro) ** 3;
  let y: number;
  if (progress < .11) y = origin.y + (-15 - origin.y) * clamp01(progress / .11) ** 3;
  else if (progress < .135) y = -15 - 30 * (1 - (1 - (progress - .11) / .025) ** 2);
  else if (progress < INTRO_END) y = -45 + 30 * ((progress - .135) / .015) ** 2;
  else y = -15;
  const distance = rideProgress(progress) * SCROLL_DISTANCE;
  // Ease the road motion in so the landing has no discontinuous tilt or height.
  const roadBlend = smoothStep(clamp01((progress - INTRO_END) / .02));
  y += (Math.sin(distance / 1200 * Math.PI * 2) * 9 + Math.sin(distance / 48 * Math.PI * 2) * .1) * roadBlend;
  const exit = clamp01((progress - .83) / .07) ** 3;
  return {
    x: origin.x * (1 - intro) ** 2 + width * 2.5 * exit,
    y,
    rotation: -30 * (1 - introOut) + Math.cos(distance / 1200 * Math.PI * 2) * 4 * roadBlend,
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
