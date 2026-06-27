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

const SCROLL_DISTANCE = 15000;
const PARALLAX_TRAVEL_DISTANCE = 10000;
const CONTENT_TRAVEL = 500;
const PROJECT_CARD_MOTION = {
  hiddenScale: 0.5,
  hiddenYOffsetRatio: 0.25,
  activeYOffsetRatio: 0,
  focusDistanceVw: 5,
  transitionDistanceVw: 45,
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
    y: 100,
    size: 85,
  },
  {
    id: 'close-trees',
    src: treeLayer,
    speed: 0.45,
    zIndex: 5,
    x: 0,
    y: 90,
    size: 65,
  },
  {
    id: 'road',
    src: roadLayer,
    speed: 0.62,
    zIndex: 6,
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
    y: 0,
    size: 70,
    opacity: 0.7,
  },
];

const cardOccludingLayerIds = new Set(['close-trees']);

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

      let targetX = 0;
      let targetY = 0;

      const getBikerTargetCoords = () => {
        const highlight = container.querySelector<HTMLElement>('.jj-hero__statement--highlight');
        if (!highlight) return { x: 0, y: 0 };

        const containerRect = container.getBoundingClientRect();
        const highlightRect = highlight.getBoundingClientRect();

        // Horizontal target: align biker center with ~87% of the highlight text width (shifting 0.05 / half-character to the right)
        targetX = (highlightRect.left + highlightRect.width * 0.87) - (containerRect.width / 2);

        // Vertical target: place the biker's wheels one line space to the bottom (using highlightRect.height)
        const isMobile = window.innerWidth <= 720;
        const bottomOffset = containerRect.height * (isMobile ? 0.02 : 0.04);
        const bikerBottomDefault = containerRect.height - bottomOffset;

        targetY = (highlightRect.top + highlightRect.height * 0.18) - bikerBottomDefault;
        return { x: targetX, y: targetY };
      };

      if (!reduceMotion) {
        const coords = getBikerTargetCoords();
        gsap.set(bikerElement, {
          y: coords.y,
          x: coords.x,
          rotation: -30,
          scale: 0.85,
          zIndex: 12,
        });
      }

      const projectElements = gsap.utils.toArray<HTMLElement>('.jj-project');
      const cardRevealElements = gsap.utils.toArray<HTMLElement>(
        '.jj-layer--card-reveal',
      );

      gsap.set(projectElements, {
        xPercent: -50,
        yPercent: -50,
        transformOrigin: '50% 78%',
        force3D: true,
      });

      const projectStates = projectElements.map((projectElement) => ({
        baseLeft: Number(projectElement.dataset.journeyLeft),
        setX: gsap.quickSetter(projectElement, 'x', 'vw'),
        setY: gsap.quickSetter(projectElement, 'y', 'px'),
        setScaleX: gsap.quickSetter(projectElement, 'scaleX'),
        setScaleY: gsap.quickSetter(projectElement, 'scaleY'),
      }));
      const progressHud = container.querySelector<HTMLElement>(
        '.jj-progress-hud',
      );
      const headerElement = container.querySelector<HTMLElement>('.jj-header');
      const headerCenterIntro = container.querySelector<HTMLElement>('.jj-header__center-intro');

      const progressHudCounter = progressHud?.querySelector<HTMLElement>(
        '.jj-progress-hud__counter',
      );
      const progressHudTitle = progressHud?.querySelector<HTMLElement>(
        '.jj-progress-hud__title',
      );
      const progressHudSegments = progressHud
        ? Array.from(
          progressHud.querySelectorAll<HTMLElement>(
            '.jj-progress-hud__segment',
          ),
        )
        : [];
      let activeHudProjectIndex = -1;

      // Event listener for brand link to scroll back to top
      const brandBtn = container.querySelector<HTMLElement>('.jj-header__brand-btn');
      const handleBrandClick = (e: MouseEvent) => {
        e.preventDefault();
        const scrollObj = { y: window.scrollY };
        gsap.to(scrollObj, {
          y: 0,
          duration: 1.2,
          ease: 'power2.out',
          overwrite: 'auto',
          onUpdate: () => window.scrollTo(0, scrollObj.y),
        });
      };
      brandBtn?.addEventListener('click', handleBrandClick as any);

      // Event listeners for HUD segments
      progressHudSegments.forEach((segment, index) => {
        segment.addEventListener('click', (e) => {
          e.preventDefault();
          const project = featuredProjects[index];
          if (!project) return;
          const journeyPosition = project.journeyPosition ?? 0.5;
          const journeyProgress = journeyPosition + 0.03;
          const scrollProgress = journeyProgress * 0.85 + 0.15;
          const targetScroll = scrollProgress * SCROLL_DISTANCE;

          const scrollObj = { y: window.scrollY };
          gsap.to(scrollObj, {
            y: targetScroll,
            duration: 1.2,
            ease: 'power2.out',
            overwrite: 'auto',
            onUpdate: () => window.scrollTo(0, scrollObj.y),
          });
        });

        segment.addEventListener('pointerenter', () => {
          const project = featuredProjects[index];
          if (project && progressHudTitle) {
            progressHudTitle.textContent = project.core.title;
          }
          if (progressHudCounter) {
            const current = String(index + 1).padStart(2, '0');
            const total = String(featuredProjects.length).padStart(2, '0');
            progressHudCounter.textContent = `[${current} / ${total}]`;
          }
        });
      });

      // Reset hover previews when pointer leaves the HUD track
      const hudTrack = progressHud?.querySelector<HTMLElement>('.jj-progress-hud__track');
      const handleHudTrackLeave = () => {
        const project = featuredProjects[activeHudProjectIndex];
        if (project) {
          if (progressHudTitle) {
            progressHudTitle.textContent = project.core.title;
          }
          if (progressHudCounter) {
            const current = String(activeHudProjectIndex + 1).padStart(2, '0');
            const total = String(featuredProjects.length).padStart(2, '0');
            progressHudCounter.textContent = `[${current} / ${total}]`;
          }
        } else {
          if (progressHudTitle) {
            progressHudTitle.textContent = '[PORTFOLIO // V3]';
          }
          if (progressHudCounter) {
            progressHudCounter.textContent = '[00 / 05]';
          }
        }
      };
      hudTrack?.addEventListener('pointerleave', handleHudTrackLeave);

      let viewportHeight = container.clientHeight;

      const updateViewportSize = () => {
        viewportHeight = container.clientHeight;
      };

      window.addEventListener('resize', updateViewportSize, { passive: true });

      // Pointer parallax removed to clean up text shifting

      const updateProgressHud = (projectIndex: number) => {
        if (projectIndex === activeHudProjectIndex) {
          return;
        }

        const project = featuredProjects[projectIndex];

        if (!project) {
          return;
        }

        activeHudProjectIndex = projectIndex;

        if (progressHudCounter) {
          const current = String(projectIndex + 1).padStart(2, '0');
          const total = String(featuredProjects.length).padStart(2, '0');
          progressHudCounter.textContent = `[${current} / ${total}]`;
        }

        if (progressHudTitle) {
          progressHudTitle.textContent = project.core.title;
        }

        progressHudSegments.forEach((segment, segmentIndex) => {
          segment.dataset.state = segmentIndex < projectIndex
            ? 'complete'
            : segmentIndex === projectIndex
              ? 'active'
              : 'upcoming';
        });
      };

      const setProjectStates = (scrollProgress: number) => {
        const introThreshold = 0.15;
        const journeyProgress = scrollProgress < introThreshold
          ? 0
          : (scrollProgress - introThreshold) / (1 - introThreshold);

        const hiddenYOffset =
          viewportHeight * PROJECT_CARD_MOTION.hiddenYOffsetRatio;
        const activeYOffset =
          viewportHeight * PROJECT_CARD_MOTION.activeYOffsetRatio;
        const projectX = -CONTENT_TRAVEL * journeyProgress;
        let nearestProjectIndex = 0;
        let nearestProjectDistance = Number.POSITIVE_INFINITY;

        projectStates.forEach(({
          baseLeft,
          setX,
          setY,
          setScaleX,
          setScaleY,
        }, projectIndex) => {
          const currentLeft = baseLeft - CONTENT_TRAVEL * journeyProgress;
          const distanceFromFocus = Math.abs(currentLeft - 50);

          if (distanceFromFocus < nearestProjectDistance) {
            nearestProjectDistance = distanceFromFocus;
            nearestProjectIndex = projectIndex;
          }

          const rawProgress =
            1 -
            (distanceFromFocus - PROJECT_CARD_MOTION.focusDistanceVw) /
            (PROJECT_CARD_MOTION.transitionDistanceVw -
              PROJECT_CARD_MOTION.focusDistanceVw);
          const focusProgress = smoothProjectFocus(
            gsap.utils.clamp(0, 1, rawProgress),
          );

          setX(projectX);
          setY(
            hiddenYOffset +
            (activeYOffset - hiddenYOffset) * focusProgress,
          );
          const scale =
            PROJECT_CARD_MOTION.hiddenScale +
            (1 - PROJECT_CARD_MOTION.hiddenScale) * focusProgress;

          setScaleX(scale);
          setScaleY(scale);
        });

        const activeProject = projectElements[nearestProjectIndex];

        if (activeProject && cardRevealElements.length > 0) {
          const cardBounds = activeProject.getBoundingClientRect();

          cardRevealElements.forEach((element) => {
            const layerBounds = element.getBoundingClientRect();
            const cardLeft = cardBounds.left - layerBounds.left;
            const cardTop = cardBounds.top - layerBounds.top;
            const cardRight = cardBounds.right - layerBounds.left;
            const cardBottom = cardBounds.bottom - layerBounds.top;
            const intersectsLayer =
              cardRight > 0 &&
              cardLeft < layerBounds.width &&
              cardBottom > 0 &&
              cardTop < layerBounds.height;
            const clipPath = intersectsLayer
              ? `inset(${Math.max(0, cardTop)}px ${Math.max(0, layerBounds.width - cardRight)}px ${Math.max(0, layerBounds.height - cardBottom)}px ${Math.max(0, cardLeft)}px round ${Math.min(16, 16 * (cardBounds.width / 420))}px)`
              : 'inset(50% 50% 50% 50%)';

            element.style.clipPath = clipPath;
            element.style.setProperty('-webkit-clip-path', clipPath);
            element.style.setProperty('--card-mask-left', `${cardLeft}px`);
            element.style.setProperty('--card-mask-top', `${cardTop}px`);
            element.style.setProperty('--card-mask-width', `${cardBounds.width}px`);
            element.style.setProperty('--card-mask-height', `${cardBounds.height}px`);
          });
        }

        updateProgressHud(nearestProjectIndex);
      };

      if (headerElement) {
        gsap.set(headerElement, {
          backgroundColor: 'rgba(219, 232, 228, 0)',
          borderColor: 'rgba(18, 59, 69, 0)',
          boxShadow: '0 8px 28px rgba(18, 59, 69, 0)',
          color: '#dbe8e4',
        });
      }

      if (progressHud) {
        gsap.set(progressHud, { autoAlpha: 0, y: -12 });
      }

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
              if (self.progress >= introThreshold) {
                const journeyProgress = (self.progress - introThreshold) / (1 - introThreshold);
                const travelledDistance = journeyProgress * SCROLL_DISTANCE;
                setBikerY(getBikerRideY(travelledDistance, 1));
              }
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

      if (!reduceMotion) {
        // Set zIndex at the beginning and when landing
        timeline.set(bikerElement, { zIndex: 12 }, 0);
        timeline.set(bikerElement, { zIndex: 6 }, 0.15);

        // X animation (smooth move from right to center)
        timeline.fromTo(bikerElement, {
          x: () => getBikerTargetCoords().x,
        }, {
          x: 0,
          duration: 0.15,
          ease: 'power1.out',
        }, 0);

        // Rotation animation (starts tilted, swings back, settles)
        timeline.fromTo(bikerElement, {
          rotation: -30,
        }, {
          rotation: 0,
          duration: 0.15,
          ease: 'power2.out',
        }, 0);

        // Scale animation (starts slightly smaller, scales up as it lands)
        timeline.fromTo(bikerElement, {
          scale: 0.85,
        }, {
          scale: 1,
          duration: 0.15,
          ease: 'power2.out',
        }, 0);

        // Y animation (falling and bouncing)
        timeline.fromTo(bikerElement, {
          y: () => getBikerTargetCoords().y,
        }, {
          y: BIKER_RIDE.startYOffset,
          duration: 0.11,
          ease: 'power2.in',
        }, 0);

        timeline.to(bikerElement, {
          y: BIKER_RIDE.startYOffset - 30, // bounce up 30px
          duration: 0.025,
          ease: 'power1.out',
        }, 0.11);

        timeline.to(bikerElement, {
          y: BIKER_RIDE.startYOffset,
          duration: 0.015,
          ease: 'power1.in',
        }, 0.135);
      }

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

      if (headerElement) {
        timeline.to(headerElement, {
          backgroundColor: 'rgba(219, 232, 228, 0.86)',
          borderColor: 'rgba(18, 59, 69, 0.24)',
          boxShadow: '0 8px 28px rgba(18, 59, 69, 0.1)',
          backdropFilter: 'blur(8px)',
          color: '#123b45',
          duration: 0.08,
          ease: 'power2.inOut',
        }, 0.04);
      }

      if (headerCenterIntro) {
        timeline.to(headerCenterIntro, {
          autoAlpha: 0,
          y: -10,
          duration: 0.08,
          ease: 'power2.inOut',
        }, 0.04);
      }

      if (progressHud) {
        timeline.to(progressHud, {
          autoAlpha: 1,
          y: 0,
          duration: 0.08,
          ease: 'power2.out',
        }, 0.08);
      }

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

      // Detect URL hash on load to jump directly to a project
      const handleHashNavigation = () => {
        const hash = window.location.hash;
        if (!hash) return;
        const slug = hash.replace('#', '');
        const projectIndex = featuredProjects.findIndex(p => p.slug === slug);
        if (projectIndex === -1) return;

        const project = featuredProjects[projectIndex];
        const journeyPosition = project.journeyPosition ?? 0.5;
        const journeyProgress = journeyPosition + 0.03;
        const scrollProgress = journeyProgress * 0.85 + 0.15;
        const targetScrollTop = scrollProgress * SCROLL_DISTANCE;

        window.scrollTo(0, targetScrollTop);
        ScrollTrigger.refresh();
      };

      // Run immediately
      handleHashNavigation();

      // Run on a tiny timeout just in case of DOM/rendering ticks
      const timer = setTimeout(handleHashNavigation, 50);

      return () => {
        clearTimeout(timer);
        window.removeEventListener('resize', updateViewportSize);
        brandBtn?.removeEventListener('click', handleBrandClick as any);
        hudTrack?.removeEventListener('pointerleave', handleHudTrackLeave);
      };
    }, container);

    return () => context.revert();
  }, []);

  return (
    <main ref={containerRef} className="jj-container">
      <JourneyEnvironment />

      <header className="jj-header">
        <div className="jj-header__inner">
          <div className="jj-header__brand">
            <button className="jj-header__brand-btn" type="button">
              <span className="jj-hero__meta">DANIAL KHALILI</span>
            </button>
          </div>

          <div className="jj-header__center">
            <div className="jj-header__center-intro">
              <span className="jj-hero__meta jj-hero__meta--center">[PORTFOLIO // V3]</span>
            </div>

            <div className="jj-header__center-hud jj-progress-hud" aria-label="Journey Progress">
              <span className="jj-progress-hud__counter">
                {`[01 / ${String(featuredProjects.length).padStart(2, '0')}]`}
              </span>
              <span className="jj-progress-hud__title">
                {featuredProjects[0]?.core.title}
              </span>
              <span
                className="jj-progress-hud__track"
                style={{
                  gridTemplateColumns: `repeat(${featuredProjects.length}, minmax(0, 1fr))`,
                }}
              >
                {featuredProjects.map((project, index) => (
                  <button
                    key={project.id}
                    className="jj-progress-hud__segment"
                    type="button"
                    data-state={index === 0 ? 'active' : 'upcoming'}
                    aria-label={`Jump to ${project.core.title}`}
                  />
                ))}
              </span>
            </div>
          </div>

          <div className="jj-header__status">
            <span className="jj-hero__meta jj-hero__meta--right">SYS_STATUS: ACTIVE</span>
          </div>
        </div>
      </header>

      <div className="jj-hero" aria-label="Hero Introduction">
        <div className="jj-hero__backdrop" />

        <div className="jj-hero__content">
          <div className="jj-hero__content-inner">
            <h1 className="jj-hero__statement">
              <span>BUILDING</span>
              <span>COMPLEX</span>
              <span>SYSTEMS</span>
              <span
                className="jj-hero__statement--highlight"
                data-text="WITH TASTE"
              >
                WITH TASTE
              </span>
            </h1>
            <div className="jj-hero__profile">
              <span className="jj-hero__name">Danial Khalili</span>
              <span className="jj-hero__divider">//</span>
              <span className="jj-hero__role">Full-Stack Software Engineer</span>
            </div>
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
        const travel = Math.ceil(PARALLAX_TRAVEL_DISTANCE * layer.speed);
        const isCardOccluder = cardOccludingLayerIds.has(layer.id);

        return (
          <div
            key={layer.id}
            className={`jj-layer${isCardOccluder ? ' jj-layer--card-occluder-base' : ''}`}
            style={{
              opacity: layer.opacity,
              zIndex: isCardOccluder ? 3 : layer.zIndex,
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
          const travel = Math.ceil(PARALLAX_TRAVEL_DISTANCE * layer.speed);

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
