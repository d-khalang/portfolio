import { useLayoutEffect, useRef } from 'react';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

import mountainLayer from '../assets/jungle/web/l1_mountain.webp';
import greenLayer from '../assets/jungle/web/l2_green.webp';
import treeLayer from '../assets/jungle/web/l3_trees.webp';
import roadLayer from '../assets/jungle/web/l4_road.webp';
import foregroundLayer from '../assets/jungle/web/l5_foreground_blurred.webp';
import biker from '../assets/jungle/web/biker.webp';
import projectsData from '../content/projects.json';
import JourneyEnvironment from './JourneyEnvironment';

gsap.registerPlugin(ScrollTrigger);

const SCROLL_DISTANCE = 10000;
const CONTENT_TRAVEL = 300;
const PROJECT_CARD_MOTION = {
  hiddenScale: 0.5,
  hiddenYOffsetRatio: 0.25,
  activeYOffsetRatio: -0.22,
  focusDistanceVw: 5,
  transitionDistanceVw: 45,
};
const PROJECT_CARD_REVEAL = {
  minMaskAlpha: 0.22,
  maxMaskAlpha: 1,
  widthRatio: 0.66,
  heightRatio: 0.62,
};
const BIKER_RIDE = {
  startYOffset: -15,
  bumpAmplitude: 9,
  bumpWavelength: 850,
  vibrationAmplitude: 0.1,
  vibrationWavelength: 48,
};

interface LayerDefinition {
  id: string;
  src: string;
  speed: number;
  zIndex: number;
  x: number;
  y: number;
  size: number;
  opacity?: number;
}

const layers: LayerDefinition[] = [
  {
    id: 'mountains',
    src: mountainLayer,
    speed: 0.12,
    zIndex: 1,
    x: 0,
    y: 215,
    size: 70,
  },
  {
    id: 'green-hills',
    src: greenLayer,
    speed: 0.28,
    zIndex: 2,
    x: 0,
    y: 130,
    size: 85,
  },
  {
    id: 'close-trees',
    src: treeLayer,
    speed: 0.45,
    zIndex: 4,
    x: 0,
    y: 72,
    size: 62,
  },
  {
    id: 'road',
    src: roadLayer,
    speed: 0.62,
    zIndex: 5,
    x: 0,
    y: -70,
    size: 76,
  },
  {
    id: 'foreground',
    src: foregroundLayer,
    speed: 0.85,
    zIndex: 7,
    x: 0,
    y: -88,
    size: 70,
    opacity: 0.8,
  },
];

const cardOccludingLayerIds = new Set(['close-trees', 'foreground']);

function getBikerRideY(distance: number, speedFactor: number = 1) {
  const bump =
    Math.sin((distance / BIKER_RIDE.bumpWavelength) * Math.PI * 2) *
    BIKER_RIDE.bumpAmplitude *
    speedFactor;
  const vibration =
    Math.sin((distance / BIKER_RIDE.vibrationWavelength) * Math.PI * 2) *
    (BIKER_RIDE.vibrationAmplitude * (0.3 + 0.7 * speedFactor));

  return BIKER_RIDE.startYOffset + bump + vibration;
}

function smoothProjectFocus(progress: number) {
  return progress * progress * (3 - 2 * progress);
}

export default function JungleJourney() {
  const containerRef = useRef<HTMLDivElement>(null);
  const bikerRef = useRef<HTMLImageElement>(null);
  const featuredProjects = projectsData.filter((project) => project.featured);

  useLayoutEffect(() => {
    const container = containerRef.current;
    const bikerElement = bikerRef.current;

    if (!container || !bikerElement) {
      return;
    }

    const context = gsap.context(() => {
      gsap.set(bikerElement, { xPercent: -50 });
      const setBikerY = gsap.quickSetter(bikerElement, 'y', 'px');
      
      const reduceMotion = window.matchMedia(
        '(prefers-reduced-motion: reduce)',
      ).matches;

      if (!reduceMotion) {
        setBikerY(getBikerRideY(0, 0));
      }

      const projectElements = gsap.utils.toArray<HTMLElement>('.jj-project');
      const setProjectStates = (scrollProgress: number) => {
        const introThreshold = 0.15;
        const journeyProgress = scrollProgress < introThreshold
          ? 0
          : (scrollProgress - introThreshold) / (1 - introThreshold);

        const viewportHeight = window.innerHeight;
        const hiddenYOffset =
          viewportHeight * PROJECT_CARD_MOTION.hiddenYOffsetRatio;
        const activeYOffset =
          viewportHeight * PROJECT_CARD_MOTION.activeYOffsetRatio;
        let activeProjectElement: HTMLElement | undefined;
        let activeProjectProgress = 0;

        projectElements.forEach((projectElement) => {
          const baseLeft = Number(projectElement.dataset.journeyLeft);
          const currentLeft = baseLeft - CONTENT_TRAVEL * journeyProgress;
          const distanceFromFocus = Math.abs(currentLeft - 50);
          const rawProgress =
            1 -
            (distanceFromFocus - PROJECT_CARD_MOTION.focusDistanceVw) /
            (PROJECT_CARD_MOTION.transitionDistanceVw -
              PROJECT_CARD_MOTION.focusDistanceVw);
          const focusProgress = smoothProjectFocus(
            gsap.utils.clamp(0, 1, rawProgress),
          );

          gsap.set(projectElement, {
            x: `-${CONTENT_TRAVEL * journeyProgress}vw`,
            y: gsap.utils.interpolate(
              hiddenYOffset,
              activeYOffset,
              focusProgress,
            ),
            scale: gsap.utils.interpolate(
              PROJECT_CARD_MOTION.hiddenScale,
              1,
              focusProgress,
            ),
            force3D: true,
          });

          if (focusProgress > activeProjectProgress) {
            activeProjectProgress = focusProgress;
            activeProjectElement = projectElement;
          }
        });

        const readableProjectElement = activeProjectElement;

        if (!readableProjectElement || scrollProgress < introThreshold) {
          container.style.setProperty('--jj-card-mask-alpha', '1');
          return;
        }

        const cardBounds = readableProjectElement.getBoundingClientRect();
        const maskAlpha = gsap.utils.interpolate(
          PROJECT_CARD_REVEAL.maxMaskAlpha,
          PROJECT_CARD_REVEAL.minMaskAlpha,
          activeProjectProgress,
        );

        container.style.setProperty(
          '--jj-card-mask-x',
          `${cardBounds.left + cardBounds.width / 2}px`,
        );
        container.style.setProperty(
          '--jj-card-mask-y',
          `${cardBounds.top + cardBounds.height / 2}px`,
        );
        container.style.setProperty(
          '--jj-card-mask-radius-x',
          `${cardBounds.width * PROJECT_CARD_REVEAL.widthRatio}px`,
        );
        container.style.setProperty(
          '--jj-card-mask-radius-y',
          `${cardBounds.height * PROJECT_CARD_REVEAL.heightRatio}px`,
        );
        container.style.setProperty('--jj-card-mask-alpha', `${maskAlpha}`);
      };

      gsap.set(projectElements, {
        transformOrigin: '50% 78%',
      });
      setProjectStates(0);

      const timeline = gsap.timeline({
        scrollTrigger: {
          trigger: container,
          start: 'top top',
          end: `+=${SCROLL_DISTANCE}`,
          scrub: 0.5,
          pin: true,
          invalidateOnRefresh: true,
          onUpdate: (self) => {
            setProjectStates(self.progress);

            if (!reduceMotion) {
              const introThreshold = 0.15;
              const journeyProgress = self.progress < introThreshold
                ? 0
                : (self.progress - introThreshold) / (1 - introThreshold);
                
              const speedFactor = self.progress < introThreshold
                ? self.progress / introThreshold
                : 1;

              const travelledDistance = journeyProgress * SCROLL_DISTANCE;
              setBikerY(getBikerRideY(travelledDistance, speedFactor));
            }
          },
        },
      });

      // Intro animations: Fade/translate hero elements and fade fog backdrop
      timeline.to('.jj-hero__backdrop', {
        opacity: 0,
        duration: 0.15,
        ease: 'power2.inOut',
      }, 0);

      timeline.to('.jj-hero__header', {
        y: -40,
        opacity: 0,
        duration: 0.1,
        ease: 'power2.inOut',
      }, 0);

      timeline.to('.jj-hero__content', {
        y: -60,
        opacity: 0,
        duration: 0.12,
        ease: 'power2.inOut',
      }, 0);

      timeline.to('.jj-hero__footer', {
        y: 30,
        opacity: 0,
        duration: 0.08,
        ease: 'power2.inOut',
      }, 0);

      timeline.to('.jj-hero', {
        pointerEvents: 'none',
        duration: 0.01,
      }, 0.12);

      // Track animations: animate layers horizontally after the intro threshold
      gsap.utils.toArray<HTMLElement>('.jj-layer-track').forEach((track) => {
        const travel = Number(track.dataset.travel);

        timeline.to(
          track,
          {
            x: -travel,
            ease: 'none',
            duration: 0.85,
            force3D: true,
          },
          0.15,
        );
      });
    }, container);

    return () => context.revert();
  }, []);

  return (
    <main ref={containerRef} className="jj-container">
      <JourneyEnvironment />

      <div className="jj-hero" aria-label="Hero Introduction">
        <div className="jj-hero__backdrop" />
        <header className="jj-hero__header">
          <span className="jj-hero__meta">DANIAL KHALILI</span>
          <span className="jj-hero__meta jj-hero__meta--center">[PORTFOLIO // V3]</span>
          <span className="jj-hero__meta jj-hero__meta--right">SYS_STATUS: ACTIVE</span>
        </header>
        
        <div className="jj-hero__content">
          <h1 className="jj-hero__statement">
            <span>BUILDING</span>
            <span>COMPLEX</span>
            <span>SYSTEMS</span>
            <span className="jj-hero__statement--highlight">WITH TASTE</span>
          </h1>
          <div className="jj-hero__profile">
            <span className="jj-hero__name">Danial Khalili</span>
            <span className="jj-hero__divider">//</span>
            <span className="jj-hero__role">Full-Stack Software Engineer</span>
          </div>
        </div>

        <div className="jj-hero__footer">
          <div className="jj-hero__scroll">
            <span className="jj-hero__scroll-indicator" />
            <span className="jj-hero__scroll-text">[00 // SCROLL TO RIDE]</span>
          </div>
        </div>
      </div>

      {layers.map((layer) => {
        const travel = Math.ceil(SCROLL_DISTANCE * layer.speed);
        const isCardOccluder = cardOccludingLayerIds.has(layer.id);

        return (
          <div
            key={layer.id}
            className={`jj-layer${isCardOccluder ? ' jj-layer--card-occluder-base' : ''}`}
            style={{
              opacity: layer.opacity,
              zIndex: isCardOccluder ? 2.5 : layer.zIndex,
            }}
            aria-hidden="true"
          >
            <div
              className="jj-layer-track"
              data-travel={travel}
              style={{
                width: `calc(100% + ${travel + 4}px)`,
                backgroundImage: `url(${layer.src})`,
                backgroundPositionX: `${layer.x}px`,
                backgroundPositionY: `calc(100% - ${layer.y}px)`,
                backgroundSize: `auto ${layer.size}%`,
              }}
            />
          </div>
        );
      })}

      {featuredProjects.map((project, index) => {
        const journeyPosition = project.journeyPosition ?? 0.5;
        const left = 65 + CONTENT_TRAVEL * journeyPosition;
        const url =
          project.core.links[0]?.url.replace(/https?:\/\/(www\.)?/, '') ??
          'in-progress';

        return (
          <a
            key={project.id}
            className="jj-project"
            data-journey-left={left}
            href={`/projects/${project.slug}`}
            style={{ left: `${left}vw` }}
          >
            <article className="jj-card">
              <div className="jj-card__chrome">
                <span className="jj-dot jj-dot--red" />
                <span className="jj-dot jj-dot--yellow" />
                <span className="jj-dot jj-dot--green" />
                <span className="jj-card__url">{url}</span>
              </div>

              <div className="jj-card__hero">
                <p className="jj-card__label">Project 0{index + 1}</p>
                <h2>{project.core.title}</h2>
                <p>{project.core.tagline}</p>
              </div>

              <div className="jj-card__info">
                <p>{project.story.summary}</p>
              </div>
            </article>
          </a>
        );
      })}

      {layers
        .filter((layer) => cardOccludingLayerIds.has(layer.id))
        .map((layer) => {
          const travel = Math.ceil(SCROLL_DISTANCE * layer.speed);

          return (
            <div
              key={`${layer.id}-card-reveal`}
              className="jj-layer jj-layer--card-reveal"
              style={{
                opacity: layer.opacity,
                zIndex: layer.zIndex,
              }}
              aria-hidden="true"
            >
              <div
                className="jj-layer-track"
                data-travel={travel}
                style={{
                  width: `calc(100% + ${travel + 4}px)`,
                  backgroundImage: `url(${layer.src})`,
                  backgroundPositionX: `${layer.x}px`,
                  backgroundPositionY: `calc(100% - ${layer.y}px)`,
                  backgroundSize: `auto ${layer.size}%`,
                }}
              />
            </div>
          );
        })}

      <img
        ref={bikerRef}
        src={biker}
        alt="Biker travelling through the project landscape"
        className="jj-biker"
        decoding="async"
        fetchPriority="high"
        draggable={false}
      />
    </main>
  );
}
