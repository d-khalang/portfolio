import React, { useRef, useImperativeHandle, forwardRef, useLayoutEffect, useCallback } from 'react';
import './BikeCharacter.css';

// Import images
import riderFullUp from '../experiments/bike/images/right-up-full.webp';
import riderLegUp from '../experiments/bike/images/right-up-right-leg.webp';
import riderFull5 from '../experiments/bike/images/right-5-full.webp';
import riderLeg5 from '../experiments/bike/images/right-5-right-leg.webp';
import riderFullDown from '../experiments/bike/images/right-down-full.webp';
import riderLegDown from '../experiments/bike/images/right-down-right-leg.webp';
import riderFull8 from '../experiments/bike/images/right-8-full.webp';
import riderLeg8 from '../experiments/bike/images/right-8-right-leg.webp';

interface BikeCharacterProps {
  rotationAngle?: number; // Optional rotation angle in degrees. If not provided, runs infinite CSS animation.
  theme?: 'neon' | 'retro' | 'cyber';
  bikeColor?: string;
  wheelColor?: string;
  showRider?: boolean;
  rotationSpeed?: string; // Optional custom rotation speed (e.g. "3s" or "0s" for paused)
  playState?: string; // Optional custom animation-play-state (e.g. "running" or "paused")
  showLabels?: boolean; // Optional flag to show debug labels overlay
}

export interface BikeCharacterHandle {
  /** Imperatively update the wheel rotation angle — bypasses React rendering for scroll-driven perf */
  updateRotation: (angle: number) => void;
}

type FrameName = 'up' | '5' | 'down' | '8';

function getFrameForAngle(rotationAngle: number): FrameName {
  const physicalAngle = rotationAngle + 50;
  const angleNormalized = ((physicalAngle % 360) + 360) % 360;
  if (angleNormalized >= 0 && angleNormalized < 75) return '5';
  if (angleNormalized >= 75 && angleNormalized < 105) return 'down';
  if (angleNormalized >= 105 && angleNormalized < 210) return '8';
  return 'up';
}

const BikeCharacter = forwardRef<BikeCharacterHandle, BikeCharacterProps>(({
  rotationAngle,
  theme = 'neon',
  bikeColor,
  wheelColor,
  showRider = true,
  rotationSpeed,
  playState,
  showLabels = false,
}, ref) => {
  if (typeof window !== 'undefined' && window.__scrollPerf) {
    window.__scrollPerf.bikeRenders++;
  }

  const isScrollDriven = rotationAngle !== undefined;

  // --- Refs for imperative DOM updates (scroll-driven mode) ---
  const containerElRef = useRef<HTMLDivElement>(null);
  const prevAngleRef = useRef(rotationAngle ?? 0);
  const movingTimerRef = useRef<number | null>(null);
  const currentFrameRef = useRef<FrameName>('down');

  // Refs for all rotating elements — populated via callback refs
  const rimEls = useRef<HTMLDivElement[]>([]);
  const spokeEls = useRef<HTMLDivElement[]>([]);
  const chainringEl = useRef<HTMLDivElement | null>(null);
  const cassetteEl = useRef<HTMLDivElement | null>(null);
  const crankLeftEl = useRef<HTMLDivElement | null>(null);
  const crankRightEl = useRef<HTMLDivElement | null>(null);
  const pedalLeftEl = useRef<HTMLDivElement | null>(null);
  const pedalRightEl = useRef<HTMLDivElement | null>(null);
  // Rider frame image refs (for visibility toggling)
  const riderFrontEls = useRef<Map<FrameName, HTMLImageElement>>(new Map());
  const riderBackLegEls = useRef<Map<FrameName, HTMLImageElement>>(new Map());
  // Dust cloud refs
  const dustEls = useRef<HTMLDivElement[]>([]);


  // Callback refs for rotating elements (collected once on mount)
  const collectRim = useCallback((el: HTMLDivElement | null) => {
    if (el && !rimEls.current.includes(el)) rimEls.current.push(el);
  }, []);
  const collectSpoke = useCallback((el: HTMLDivElement | null) => {
    if (el && !spokeEls.current.includes(el)) spokeEls.current.push(el);
  }, []);
  const collectDust = useCallback((el: HTMLDivElement | null) => {
    if (el && !dustEls.current.includes(el)) dustEls.current.push(el);
  }, []);

  // Imperative handle: parent calls this to update rotation without causing re-render
  useImperativeHandle(ref, () => ({
    updateRotation(angle: number) {
      const tStart = performance.now();

      // 1. Update rotating element transforms directly
      const rimStyle = `rotate(${angle}deg)`;
      for (const el of rimEls.current) el.style.transform = rimStyle;
      for (const el of spokeEls.current) el.style.transform = rimStyle;

      if (chainringEl.current) {
        chainringEl.current.style.transform = `translate(-50%, 50%) rotate(${angle}deg)`;
      }
      if (cassetteEl.current) {
        cassetteEl.current.style.transform = `translate(-50%, -50%) rotate(${angle}deg)`;
      }

      // Crank assemblies
      const crankLeftAngle = angle + 230;
      const crankRightAngle = angle + 50;
      if (crankLeftEl.current) {
        crankLeftEl.current.style.transform = `rotate(${crankLeftAngle}deg)`;
      }
      if (crankRightEl.current) {
        crankRightEl.current.style.transform = `rotate(${crankRightAngle}deg)`;
      }
      // Counter-rotate pedals to keep them level
      if (pedalLeftEl.current) {
        pedalLeftEl.current.style.transform = `rotate(${-crankLeftAngle}deg)`;
      }
      if (pedalRightEl.current) {
        pedalRightEl.current.style.transform = `rotate(${-crankRightAngle}deg)`;
      }

      // 2. Determine active rider frame and toggle visibility
      const newFrame = getFrameForAngle(angle);
      if (newFrame !== currentFrameRef.current) {
        // Hide previous frame
        const prevFront = riderFrontEls.current.get(currentFrameRef.current);
        const prevBack = riderBackLegEls.current.get(currentFrameRef.current);
        if (prevFront) prevFront.classList.replace('force-visible', 'force-hidden');
        if (prevBack) prevBack.classList.replace('force-visible', 'force-hidden');
        // Show new frame
        const nextFront = riderFrontEls.current.get(newFrame);
        const nextBack = riderBackLegEls.current.get(newFrame);
        if (nextFront) nextFront.classList.replace('force-hidden', 'force-visible');
        if (nextBack) nextBack.classList.replace('force-hidden', 'force-visible');
        currentFrameRef.current = newFrame;
      }

      // 3. Toggle dust/moving class via direct DOM (no React state)
      if (angle !== prevAngleRef.current) {
        // Add moving class
        for (const el of dustEls.current) {
          if (!el.classList.contains('is-moving')) el.classList.add('is-moving');
        }
        prevAngleRef.current = angle;

        // Clear previous timer and set new one
        if (movingTimerRef.current !== null) {
          window.clearTimeout(movingTimerRef.current);
        }
        movingTimerRef.current = window.setTimeout(() => {
          for (const el of dustEls.current) {
            el.classList.remove('is-moving');
          }
        }, 200);
      }

      const tEnd = performance.now();
      const duration = tEnd - tStart;
      if (typeof window !== 'undefined' && window.__scrollPerf) {
        window.__scrollPerf.lastBikeUpdateTime = duration;
        if (duration > window.__scrollPerf.maxBikeUpdateTime) {
          window.__scrollPerf.maxBikeUpdateTime = duration;
        }
      }
    },
  }), []);

  // Cleanup timer on unmount
  useLayoutEffect(() => {
    return () => {
      if (movingTimerRef.current !== null) {
        window.clearTimeout(movingTimerRef.current);
      }
    };
  }, []);

  // For non-scroll-driven mode, compute values from props
  let activeFrame: FrameName = 'down';
  const isCurrentlyMoving = !isScrollDriven && playState !== 'paused';

  if (isScrollDriven) {
    activeFrame = getFrameForAngle(rotationAngle);
  }

  // Create inline styles for rotation (non-scroll-driven mode only — scroll mode uses imperative updates)
  const getRotationStyle = (offsetDeg: number = 0, speedFactor: number = 1) => {
    if (isScrollDriven) {
      return { transform: `rotate(${(rotationAngle * speedFactor) + offsetDeg}deg)` };
    }
    return undefined;
  };

  const getCounterRotationStyle = (offsetDeg: number = 0, speedFactor: number = 1) => {
    if (isScrollDriven) {
      return { transform: `rotate(${-(rotationAngle * speedFactor) - offsetDeg}deg)` };
    }
    return undefined;
  };

  const getChainringStyle = () => {
    if (isScrollDriven) {
      return { transform: `translate(-50%, 50%) rotate(${rotationAngle}deg)` };
    }
    return undefined;
  };

  const getCassetteStyle = () => {
    if (isScrollDriven) {
      return { transform: `translate(-50%, -50%) rotate(${rotationAngle}deg)` };
    }
    return undefined;
  };

  // Visibility classes for scroll-driven mode
  const getFrameClass = (frameName: FrameName) => {
    if (!isScrollDriven) return '';
    return activeFrame === frameName ? 'force-visible' : 'force-hidden';
  };

  // Dynamically compile style variables to preserve default theme stylesheets
  const containerStyle: React.CSSProperties = {
    width: '100%',
    height: '100%',
  };

  if (bikeColor) {
    (containerStyle as any)['--bike-color'] = bikeColor;
  }
  if (wheelColor) {
    (containerStyle as any)['--wheel-color'] = wheelColor;
  }
  if (rotationSpeed) {
    (containerStyle as any)['--rotation-speed'] = rotationSpeed;
  }
  if (playState) {
    (containerStyle as any)['--play-state'] = playState;
  }

  return (
    <div 
      ref={containerElRef}
      className={`bike-container theme-${theme} ${isScrollDriven ? 'scroll-driven' : 'auto-animate'}`}
      style={containerStyle}
    >
      <svg 
        viewBox="0 0 500 380" 
        width="100%" 
        height="100%" 
        style={{ display: 'block', overflow: 'visible' }}
      >
        <foreignObject width="500" height="380" x="0" y="0" style={{ overflow: 'visible' }}>
          <div className={`bike ${showLabels ? 'show-debug-labels' : ''}`} style={{ position: 'absolute', width: '500px', height: '380px', left: 0, top: 0 }}>
            {/* Rear Wheel Dust */}
            <div ref={collectDust} className={`dust-cloud rear-wheel-dust ${isCurrentlyMoving ? 'is-moving' : ''}`}>
              <div className="dust-puff puff-1"></div>
              <div className="dust-puff puff-2"></div>
              <div className="dust-puff puff-3"></div>
              <div className="dust-puff puff-4"></div>
              <div className="dust-puff puff-5"></div>
              <div className="dirt-speck speck-1"></div>
              <div className="dirt-speck speck-2"></div>
              <div className="dirt-speck speck-3"></div>
            </div>

            {/* Rear Wheel */}
            <div className="wheel rear-wheel" data-label="rear-wheel">
              <div className="tire"></div>
              <div className="rim" ref={collectRim} style={getRotationStyle()}></div>
              <div className="spokes" ref={collectSpoke} style={getRotationStyle()}></div>
              <div className="hub"></div>
              <div className="cassette" ref={el => { cassetteEl.current = el; }} style={getCassetteStyle()}></div>
            </div>

            {/* Front Wheel Dust */}
            <div ref={collectDust} className={`dust-cloud front-wheel-dust ${isCurrentlyMoving ? 'is-moving' : ''}`}>
              <div className="dust-puff puff-1"></div>
              <div className="dust-puff puff-2"></div>
              <div className="dust-puff puff-3"></div>
              <div className="dirt-speck speck-1"></div>
              <div className="dirt-speck speck-2"></div>
            </div>

            {/* Front Wheel */}
            <div className="wheel front-wheel" data-label="front-wheel">
              <div className="tire"></div>
              <div className="rim" ref={collectRim} style={getRotationStyle()}></div>
              <div className="spokes" ref={collectSpoke} style={getRotationStyle()}></div>
              <div className="hub"></div>
            </div>

            {/* Rider Back Leg (Layered behind frame stays and drivetrain) */}
            {showRider && (
              <>
                <img 
                  src={riderLegUp} 
                  ref={el => { if (el) riderBackLegEls.current.set('up', el); }}
                  className={`rider-back-leg rider-back-leg-up ${getFrameClass('up')}`} 
                  data-label="rider-back-leg" 
                  alt="Rider Back Leg Up"
                />
                <img 
                  src={riderLeg5} 
                  ref={el => { if (el) riderBackLegEls.current.set('5', el); }}
                  className={`rider-back-leg rider-back-leg-5 ${getFrameClass('5')}`} 
                  data-label="rider-back-leg" 
                  alt="Rider Back Leg 5"
                />
                <img 
                  src={riderLegDown} 
                  ref={el => { if (el) riderBackLegEls.current.set('down', el); }}
                  className={`rider-back-leg rider-back-leg-down ${getFrameClass('down')}`} 
                  data-label="rider-back-leg" 
                  alt="Rider Back Leg Down"
                />
                <img 
                  src={riderLeg8} 
                  ref={el => { if (el) riderBackLegEls.current.set('8', el); }}
                  className={`rider-back-leg rider-back-leg-8 ${getFrameClass('8')}`} 
                  data-label="rider-back-leg" 
                  alt="Rider Back Leg 8"
                />
              </>
            )}

            {/* Bike Frame Tubes */}
            <div className="frame">
              <div className="tube chain-stay" data-label="chain-stay"></div>
              <div className="tube seat-stay" data-label="seat-stay"></div>
              <div className="tube seat-tube" data-label="seat-tube"></div>
              <div className="tube down-tube" data-label="down-tube"></div>
              <div className="tube top-tube" data-label="top-tube"></div>
              
              {/* Bottom Bracket (Crank center) */}
              <div className="bottom-bracket" data-label="bottom-bracket"></div>
            </div>

            {/* Fork & Steerer */}
            <div className="fork-assembly">
              <div className="fork" data-label="fork"></div>
              <div className="head-tube" data-label="head-tube"></div>
              <div className="stem" data-label="stem"></div>
              <div className="handlebars" data-label="handlebars">
                <div className="bar-drop"></div>
              </div>
            </div>

            {/* Drivetrain (Crankset, chain, pedals) */}
            <div className="drivetrain">
              <div className="chainring" data-label="chainring" ref={el => { chainringEl.current = el; }} style={getChainringStyle()}></div>
              <div className="chain-upper" data-label="chain-upper"></div>
              <div className="chain-lower" data-label="chain-lower"></div>

              {/* Crank Arm & Pedal 1 */}
              <div className="crank-assembly crank-left" ref={el => { crankLeftEl.current = el; }} style={getRotationStyle(230)}>
                <div className="crank-arm" data-label="crank-arm"></div>
                <div className="pedal" data-label="pedal" ref={el => { pedalLeftEl.current = el; }} style={getCounterRotationStyle(230)}>
                  <div ref={collectDust} className={`pedal-dust ${isCurrentlyMoving ? 'is-moving' : ''}`}>
                    <div className="pedal-particle p-1"></div>
                    <div className="pedal-particle p-2"></div>
                    <div className="pedal-particle p-3"></div>
                  </div>
                </div>
              </div>
              
              {/* Crank Arm & Pedal 2 */}
              <div className="crank-assembly crank-right" ref={el => { crankRightEl.current = el; }} style={getRotationStyle(50)}>
                <div className="crank-arm" data-label="crank-arm"></div>
                <div className="pedal" data-label="pedal" ref={el => { pedalRightEl.current = el; }} style={getCounterRotationStyle(50)}>
                  <div ref={collectDust} className={`pedal-dust ${isCurrentlyMoving ? 'is-moving' : ''}`}>
                    <div className="pedal-particle p-1"></div>
                    <div className="pedal-particle p-2"></div>
                    <div className="pedal-particle p-3"></div>
                  </div>
                </div>
              </div>
            </div>

            {/* Saddle / Seat Assembly */}
            <div className="seat-assembly">
              <div className="seatpost" data-label="seatpost"></div>
              <div className="saddle" data-label="saddle"></div>
            </div>

            {/* Rider Front (Full torso + front leg) */}
            {showRider && (
              <>
                <img 
                  src={riderFullUp} 
                  ref={el => { if (el) riderFrontEls.current.set('up', el); }}
                  className={`rider-front rider-front-up ${getFrameClass('up')}`} 
                  data-label="rider-character" 
                  alt="Rider Up"
                />
                <img 
                  src={riderFull5} 
                  ref={el => { if (el) riderFrontEls.current.set('5', el); }}
                  className={`rider-front rider-front-5 ${getFrameClass('5')}`} 
                  data-label="rider-character" 
                  alt="Rider 5"
                />
                <img 
                  src={riderFullDown} 
                  ref={el => { if (el) riderFrontEls.current.set('down', el); }}
                  className={`rider-front rider-front-down ${getFrameClass('down')}`} 
                  data-label="rider-character" 
                  alt="Rider Down"
                />
                <img 
                  src={riderFull8} 
                  ref={el => { if (el) riderFrontEls.current.set('8', el); }}
                  className={`rider-front rider-front-8 ${getFrameClass('8')}`} 
                  data-label="rider-character" 
                  alt="Rider 8"
                />
              </>
            )}
          </div>
        </foreignObject>
      </svg>
    </div>
  );
});

BikeCharacter.displayName = 'BikeCharacter';

export default BikeCharacter;
