import React, { useRef, useEffect } from 'react';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

import l1 from '../assets/jungle/l1_very_back_no_bg.webp';
import l2 from '../assets/jungle/l2_back_areas_no_bg.webp';
import l3 from '../assets/jungle/l3_back_vegetation_no_bg.webp';
// import l4 from '../assets/jungle/l4_bike_road_no_bg.webp';
import l5 from '../assets/jungle/l5_vegetation_no_bg.webp';
import road from '../assets/jungle/5000px_road_no_bg.webp';
import biker from '../assets/jungle/biker.png';
import fullBack from '../assets/jungle/full_back.webp';

gsap.registerPlugin(ScrollTrigger);

/*
  Each layer moves independently — NO shared parent track.
  This makes parallax obvious because slow layers barely move
  while fast layers zip by.

  Layer stacking (back → front):
    CSS Sky gradient          z: 1    move: 0        (static)
    L1 – clouds & mountain    z: 2    move: -400px   (barely moves)
    L2 – mid-ground terrain   z: 3    move: -1200px  (slow)
    ── PROJECT CARD ──        z: 4    move: -2000px  (medium)
    L3 – dense vegetation     z: 5    move: -2800px  (medium-fast, occludes card)
    L4 – bike road            z: 6    move: -4000px  (fast)
    L5 – foreground foliage   z: 7    move: -5000px  (fastest)
*/

const SCROLL_DISTANCE = 5000; // how far the user needs to scroll (in px)

interface LayerDef {
  src: string;
  z: number;
  xEnd: number;       // how far this layer moves left (in px)
  bottom: string;
  height: string;
  repeat: number;
  opacity?: number;
}

const layers: LayerDef[] = [
  // L1 – very back: clouds & mountain (barely moves)
  { src: l1, z: 2, xEnd: -400,  bottom: '18%', height: '70%', repeat: 4, opacity: 0.85 },
  // L2 – back terrain & bridge (slow)
  { src: l2, z: 3, xEnd: -1200, bottom: '10%', height: '60%', repeat: 4 },
  // L3 – dense vegetation (occludes the card — moves faster than card)
  { src: l3, z: 5, xEnd: -2800, bottom: '0%',  height: '58%', repeat: 6 },
  // L4 – bike road layer (kept for any extra road vegetation)
  // { src: l4, z: 6, xEnd: -4000, bottom: '-2%', height: '50%', repeat: 5 },
  // road – road layer (kept for any extra road vegetation)
  // { src: road, z: 6, xEnd: -4000, bottom: '0%', height: '50%', repeat: 5 },
  // L5 – foreground foliage (fastest)
  { src: l5, z: 7, xEnd: -5000, bottom: '-5%', height: '48%', repeat: 10 },
];

// Biker Y-axis bobbing keyframes to simulate riding on a wavy road.
// Each entry is { progress: 0-1, y: px offset }.
// Tune these values once you see how the road curves.
const BIKER_BOB: { progress: number; y: number }[] = [
  { progress: 0.00, y:  0  },
  { progress: 0.10, y: -8  },
  { progress: 0.20, y:  4  },
  { progress: 0.30, y: -12 },
  { progress: 0.40, y:  2  },
  { progress: 0.50, y: -6  },
  { progress: 0.60, y:  8  },
  { progress: 0.70, y: -10 },
  { progress: 0.80, y:  3  },
  { progress: 0.90, y: -5  },
  { progress: 1.00, y:  0  },
];

const CARD_X_END = -2000; // project card movement

const JungleJourney: React.FC = () => {
  const containerRef = useRef<HTMLDivElement>(null);
  const bikerRef = useRef<HTMLImageElement>(null);

  useEffect(() => {
    if (!containerRef.current) return;

    const ctx = gsap.context(() => {
      const container = containerRef.current!;

      // Shared ScrollTrigger config for all layers
      const triggerConfig = {
        trigger: container,
        start: 'top top',
        end: `+=${SCROLL_DISTANCE}`,
        scrub: 0.5,
        pin: true,
        invalidateOnRefresh: true,
      };

      // Animate each layer independently
      const layerEls = container.querySelectorAll<HTMLElement>('.jj-layer');
      layerEls.forEach((el) => {
        const xEnd = parseFloat(el.dataset.xend || '0');
        gsap.to(el, {
          x: xEnd,
          ease: 'none',
          scrollTrigger: {
            trigger: container,
            start: 'top top',
            end: `+=${SCROLL_DISTANCE}`,
            scrub: 0.5,
          },
        });
      });

      // Animate the project card
      const card = container.querySelector<HTMLElement>('.jj-project');
      if (card) {
        gsap.to(card, {
          x: CARD_X_END,
          ease: 'none',
          scrollTrigger: {
            trigger: container,
            start: 'top top',
            end: `+=${SCROLL_DISTANCE}`,
            scrub: 0.5,
          },
        });
      }

      // ── Road layer (single 5000px image, same speed as L4) ──
      const roadEl = container.querySelector<HTMLElement>('.jj-road');
      if (roadEl) {
        gsap.to(roadEl, {
          x: -4000,
          ease: 'none',
          scrollTrigger: {
            trigger: container,
            start: 'top top',
            end: `+=${SCROLL_DISTANCE}`,
            scrub: 0.5,
          },
        });
      }

      // ── New Full Background (very back layer, slow movement) ──
      const fullBackEl = container.querySelector<HTMLElement>('.jj-full-back');
      if (fullBackEl) {
        gsap.to(fullBackEl, {
          x: -800,
          ease: 'none',
          scrollTrigger: {
            trigger: container,
            start: 'top top',
            end: `+=${SCROLL_DISTANCE}`,
            scrub: 0.5,
          },
        });
      }

      // ── Biker Y-axis bobbing ──
      if (bikerRef.current) {
        // Build a GSAP timeline with the bobbing keyframes
        const bobTl = gsap.timeline({
          scrollTrigger: {
            trigger: container,
            start: 'top top',
            end: `+=${SCROLL_DISTANCE}`,
            scrub: 0.5,
          },
        });

        for (let i = 0; i < BIKER_BOB.length - 1; i++) {
          const from = BIKER_BOB[i];
          const to = BIKER_BOB[i + 1];
          const duration = to.progress - from.progress;
          bobTl.to(bikerRef.current, {
            y: to.y,
            duration,
            ease: 'sine.inOut',
          });
        }
      }

      // Pin the container (one ScrollTrigger to handle the pin)
      ScrollTrigger.create(triggerConfig);
    }, containerRef);

    return () => ctx.revert();
  }, []);

  return (
    <div ref={containerRef} className="jj-container">

      {/* CSS Sky — static background */}
      <div className="jj-sky" />

      {/* Back layers (L1, L2) — behind the card (Commented out for comparison)
      {layers
        .filter((l) => l.z <= 3)
        .map((layer, i) => (
          <div
            key={`back-${i}`}
            className="jj-layer"
            data-xend={layer.xEnd}
            style={{
              zIndex: layer.z,
              bottom: layer.bottom,
              height: layer.height,
              opacity: layer.opacity ?? 1,
            }}
          >
            {Array.from({ length: layer.repeat }).map((_, ri) => (
              <img key={ri} src={layer.src} alt="" className="jj-layer-img" draggable={false} />
            ))}
          </div>
        ))}
      */}

      {/* ── New Full Background (Very back of the scene, single long image) ── */}
      <div
        className="jj-full-back"
        style={{
          position: 'absolute',
          top: 0,
          bottom: 0,
          left: 0,
          width: '2500px',
          height: '100%',
          zIndex: 2,
          willChange: 'transform',
        }}
      >
        <img
          src={fullBack}
          alt=""
          style={{
            width: '100%',
            height: '100%',
            objectFit: 'cover',
            objectPosition: 'left 45%',
            display: 'block',
          }}
          draggable={false}
        />
      </div>

      {/* ── PROJECT CARD (z:4 — between L2 and L3) ── */}
      <div className="jj-project" style={{ zIndex: 4 }}>
        <article className="jj-card">
          {/* Browser chrome */}
          <div className="jj-card__chrome">
            <span className="jj-dot jj-dot--red" />
            <span className="jj-dot jj-dot--yellow" />
            <span className="jj-dot jj-dot--green" />
            <span className="jj-card__url">kartino.it</span>
          </div>

          <div className="jj-card__body">
            <div className="jj-card__hero">
              <h2 className="jj-card__hero-title">KARTINO</h2>
              <p className="jj-card__hero-sub">AI-Powered Flashcards</p>
            </div>

            <div className="jj-card__info">
              <div className="jj-card__label">PROJECT 02</div>
              <h3 className="jj-card__title">"KARTINO"</h3>
              <p className="jj-card__desc">
                AI-powered Telegram flashcards rebuilt into a production-ready learning system.
              </p>
            </div>
          </div>
        </article>
      </div>

      {/* Front layers (L3, L4, L5) — these occlude the card */}
      {layers
        .filter((l) => l.z > 3)
        .map((layer, i) => (
          <div
            key={`front-${i}`}
            className="jj-layer"
            data-xend={layer.xEnd}
            style={{
              zIndex: layer.z,
              bottom: layer.bottom,
              height: layer.height,
              opacity: layer.opacity ?? 1,
            }}
          >
            {Array.from({ length: layer.repeat }).map((_, ri) => (
              <img key={ri} src={layer.src} alt="" className="jj-layer-img" draggable={false} />
            ))}
          </div>
        ))}

      {/* ── 5000px Road (sits at L4 level, single wide image) ── */}
      <div
        className="jj-road"
        style={{
          position: 'absolute',
          bottom: '-5%',
          left: 0,
          width: '5000px',
          height: 'auto',
          zIndex: 6,
          willChange: 'transform',
        }}
      >
        <img
          src={road}
          alt=""
          style={{ width: '100%', height: 'auto', display: 'block' }}
          draggable={false}
        />
      </div>

      {/* ── Biker (fixed X, bobs on Y) ── */}
      <img
        ref={bikerRef}
        src={biker}
        alt="Biker"
        className="jj-biker"
        draggable={false}
        style={{
          position: 'absolute',
          left: '50%',
          bottom: '10%',
          transform: 'translateX(-50%)',
          height: '18%',
          zIndex: 6,
          pointerEvents: 'none',
          willChange: 'transform',
        }}
      />

    </div>
  );
};

export default JungleJourney;
