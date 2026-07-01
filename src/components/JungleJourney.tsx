import { useLayoutEffect, useRef, useState } from 'react';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

import mountainLayer from '../assets/jungle/web/l1_mountain.webp';
import greenLayer from '../assets/jungle/web/l2_green.webp';
import treeLayer from '../assets/jungle/web/l3_trees.webp';
import roadLayer from '../assets/jungle/web/l4_road.webp';
import foregroundLayer from '../assets/jungle/web/l5_foreground_blurred.webp';
import projectsData from '../content/projects.json';
import JourneyEnvironment from './JourneyEnvironment';
import JungleFooter from './JungleFooter';
import BikeCharacter from './BikeCharacter';

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
  bumpWavelength: 1200,
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
  const bikerRef = useRef<HTMLDivElement>(null);
  const [rotationAngle, setRotationAngle] = useState(0);
  const [isHovered, setIsHovered] = useState(false);
  const [bikeColor, setBikeColor] = useState<string | undefined>(undefined);
  const [wheelColor, setWheelColor] = useState<string | undefined>(undefined);
  const [showOverlay, setShowOverlay] = useState(() => {
    return typeof window !== 'undefined' && !!window.location.hash;
  });
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
      const setBikerRotation = gsap.quickSetter(bikerElement, 'rotation', 'deg');

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

        // Horizontal target: align biker center with ~87% of the highlight text width + 20px right
        targetX = (highlightRect.left + highlightRect.width * 0.87) - (containerRect.width / 2) + 20;

        // Vertical target: place the biker's wheels one line space to the bottom + 15px down
        const isMobile = window.innerWidth <= 720;
        const bottomOffset = containerRect.height * (isMobile ? 0.02 : 0.04);
        const bikerBottomDefault = containerRect.height - bottomOffset;

        targetY = (highlightRect.top + highlightRect.height * 0.18) - bikerBottomDefault + 15;
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
        element: projectElement,
        baseLeft: Number(projectElement.dataset.journeyLeft),
        setX: gsap.quickSetter(projectElement, 'x', 'vw'),
        setY: gsap.quickSetter(projectElement, 'y', 'px'),
        setScaleX: gsap.quickSetter(projectElement, 'scaleX'),
        setScaleY: gsap.quickSetter(projectElement, 'scaleY'),
        setOpacity: gsap.quickSetter(projectElement, 'opacity'),
      }));
      const progressHud = container.querySelector<HTMLElement>(
        '.jj-cloud-hud',
      );
      const headerElement = container.querySelector<HTMLElement>('.jj-header');

      const progressHudCounter = progressHud?.querySelector<HTMLElement>(
        '.jj-cloud-hud__counter',
      );
      const progressHudTitle = progressHud?.querySelector<HTMLElement>(
        '.jj-cloud-hud__title',
      );
      const progressHudSegments = progressHud
        ? Array.from(
          progressHud.querySelectorAll<HTMLElement>(
            '.jj-cloud-hud__nav',
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
          const scrollProgress = journeyProgress * 0.70 + 0.15;
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
      const hudTrack = progressHud?.querySelector<HTMLElement>('.jj-cloud-hud__track');
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
        const journeyEnd = 0.85;
        const journeyProgress = scrollProgress < introThreshold
          ? 0
          : Math.min(1, (scrollProgress - introThreshold) / (journeyEnd - introThreshold));

        const hiddenYOffset =
          viewportHeight * PROJECT_CARD_MOTION.hiddenYOffsetRatio;
        const activeYOffset =
          viewportHeight * PROJECT_CARD_MOTION.activeYOffsetRatio;
        const projectX = -CONTENT_TRAVEL * journeyProgress;
        let nearestProjectIndex = 0;
        let nearestProjectDistance = Number.POSITIVE_INFINITY;

        projectStates.forEach(({
          element,
          baseLeft,
          setX,
          setY,
          setScaleX,
          setScaleY,
          setOpacity,
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

          // Card reaches full opacity (1.0) quickly (by 10% of its journey up)
          const cardOpacity = gsap.utils.clamp(0, 1, focusProgress / 0.1);
          setOpacity(cardOpacity);

          if (cardOpacity <= 0) {
            element.style.visibility = 'hidden';
            element.style.pointerEvents = 'none';
          } else {
            element.style.visibility = 'visible';
            element.style.pointerEvents = 'auto';
          }
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
          color: '#123b45',
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
                const journeyEnd = 0.85;
                const journeyProgress = self.progress < introThreshold
                  ? 0
                  : Math.min(1, (self.progress - introThreshold) / (journeyEnd - introThreshold));
                const travelledDistance = journeyProgress * SCROLL_DISTANCE;
                setBikerY(getBikerRideY(travelledDistance, 1));
                setRotationAngle((travelledDistance / 1800) * 360); // 480px of scroll per pedal rotation

                // Tilt bike upward (negative degrees) when climbing, and downward (positive degrees) when descending
                const tiltAngle = Math.cos((travelledDistance / BIKER_RIDE.bumpWavelength) * Math.PI * 2) * 4; // Max 4 degrees tilt
                setBikerRotation(tiltAngle);
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

      timeline.to('.jj-hero__header', {
        y: -30,
        opacity: 0,
        duration: 0.10,
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

      if (progressHud) {
        // Fade in HUD during the intro
        timeline.to(progressHud, {
          autoAlpha: 1,
          y: 0,
          duration: 0.08,
          ease: 'power2.out',
          overwrite: 'auto',
        }, 0.08);

        // Parallax: translate cloud HUD horizontally on scroll
        timeline.to(progressHud, {
          x: '-6vw',
          ease: 'none',
          duration: 0.70, // compressed from 0.85
        }, 0.15);
      }

      // Track animations: animate layers horizontally after the intro threshold
      gsap.utils.toArray<HTMLElement>('.jj-layer-track').forEach((track) => {
        const travel = Number(track.dataset.travel);

        timeline.to(
          track,
          {
            x: -travel,
            ease: 'none',
            duration: 0.70, // compressed from 0.85
            force3D: true,
          },
          0.15,
        );
      });

      // --- Transitions to Deep Roots Footer at Scroll End (progress 0.85 -> 1.0) ---

      // 1. Biker exit: drives off-screen right with speed
      if (!reduceMotion) {
        timeline.to(bikerElement, {
          xPercent: 200,
          opacity: 0,
          duration: 0.07,
          ease: 'power2.in',
        }, 0.85);
      }

      // 2. Landscape ascent: environment layers slide upward to occupy top half
      timeline.to(['.jj-layer', '.journey-environment'], {
        yPercent: -70,
        duration: 0.10,
        ease: 'power2.inOut',
        stagger: 0.01,
      }, 0.85);

      // 3. Environment background transitions to deep roots charcoal teal
      timeline.to(container, {
        backgroundColor: '#08171a',
        duration: 0.07,
        ease: 'power1.inOut',
      }, 0.85);

      // 4. Subtle dimming of the landscape environment (instead of full fade-out)
      timeline.to('.journey-environment', {
        opacity: 0.7,
        duration: 0.08,
        ease: 'power1.out',
      }, 0.85);

      // 5. Header transitions to dark-mode styling
      if (headerElement) {
        timeline.to(headerElement, {
          backgroundColor: 'rgba(8, 23, 26, 0.86)',
          borderColor: 'rgba(16, 185, 129, 0.2)',
          boxShadow: '0 8px 28px rgba(8, 23, 26, 0.5)',
          color: '#c8dad4',
          duration: 0.07,
          ease: 'power1.inOut',
        }, 0.88);
      }

      // 6. HUD slides out of view (and slides back in on reverse scroll)
      if (progressHud) {
        timeline.to(progressHud, {
          y: -40,
          autoAlpha: 0,
          duration: 0.07,
          ease: 'power1.inOut',
        }, 0.85);
      }

      // 7. Footer slides up into view
      timeline.fromTo('.jj-footer', {
        yPercent: 100,
        autoAlpha: 0,
      }, {
        yPercent: 0,
        autoAlpha: 1,
        duration: 0.12,
        ease: 'power2.out',
      }, 0.88);


      // Force initial layout/trigger refresh synchronously so that the document has its full scrollable height.
      // This enables both:
      // 1. Native browser scroll restoration (when navigating back via browser back button)
      // 2. Hash-based scroll positioning (when landing on a specific project hash)
      ScrollTrigger.refresh();

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
        const scrollProgress = journeyProgress * 0.70 + 0.15;
        const targetScrollTop = scrollProgress * SCROLL_DISTANCE;

        window.scrollTo(0, targetScrollTop);
      };

      // Run hash navigation check immediately (pre-paint)
      handleHashNavigation();

      // Run on a tiny timeout to override the browser's native scroll restoration,
      // then run the CRT flicker/flash transition animation and remove the overlay.
      const timer = setTimeout(() => {
        handleHashNavigation();

        if (window.location.hash) {
          gsap.fromTo(
            '.jj-transition-overlay',
            { opacity: 0.94 },
            {
              opacity: 0.6,
              duration: 0.1,
              repeat: 3,
              yoyo: true,
              ease: 'none',
              onComplete: () => {
                gsap.to('.jj-transition-overlay', {
                  opacity: 0,
                  duration: 0.4,
                  ease: 'power2.inOut',
                  onComplete: () => setShowOverlay(false),
                });
              },
            }
          );
        }
      }, 50);

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
      {showOverlay && (
        <div className="jj-transition-overlay">
          <div className="jj-transition-overlay__content">
            <span className="jj-transition-overlay__blink" />
            <span>RESTORING SIGNAL...</span>
          </div>
        </div>
      )}
      <JourneyEnvironment />



      <div className="jj-cloud-hud" aria-label="Journey Progress HUD">
        {/* Info Cloud (Wider, left side) */}
        <div className="jj-cloud-hud__info">
          <div className="jj-cloud-hud__bubble" aria-hidden="true" />
          <span className="jj-cloud-hud__counter">
            {`[01 / ${String(featuredProjects.length).padStart(2, '0')}]`}
          </span>
          <span className="jj-cloud-hud__title">
            {featuredProjects[0]?.core.title}
          </span>
        </div>

        {/* Nav Clouds Track (Middle/right side, one cloud per project) */}
        <div className="jj-cloud-hud__track">
          {featuredProjects.map((project, index) => (
            <button
              key={project.id}
              className={`jj-cloud-hud__nav jj-cloud-hud__nav--${index}`}
              type="button"
              data-state={index === 0 ? 'active' : 'upcoming'}
              aria-label={`Jump to ${project.core.title}`}
            />
          ))}
        </div>
      </div>

      <div className="jj-hero" aria-label="Hero Introduction">
        <div className="jj-hero__backdrop" />

        <header className="jj-hero__header">
          <div className="jj-hero__header-inner">
            <span className="jj-hero__header-name">Danial Khalili</span>
            <span className="jj-hero__header-role">Full-Stack Software Engineer</span>
          </div>
        </header>

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
            href={`${import.meta.env.BASE_URL}projects/${project.slug}`}
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

      <div
        ref={bikerRef}
        className="jj-biker"
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
      >
        <div style={{ position: 'relative', width: '100%', height: '100%', pointerEvents: 'auto' }}>
          <BikeCharacter
            rotationAngle={rotationAngle}
            theme="retro"
            bikeColor={bikeColor}
            wheelColor={wheelColor}
          />

          {/* Small Customizer Pop-up Panel */}
          <div className={`jj-biker-popup ${isHovered ? 'visible' : ''}`}>
            <div className="popup-title">Bike Customizer</div>

            <div className="popup-control">
              <label>Frame Color:</label>
              <div className="popup-presets">
                {['#d94e34', '#e63946', '#457b9d', '#ffb703', '#2a9d8f'].map((color) => (
                  <button
                    key={color}
                    className={`popup-color-preset ${bikeColor === color ? 'active' : ''}`}
                    style={{ backgroundColor: color }}
                    onClick={() => setBikeColor(color)}
                  />
                ))}
                <input
                  type="color"
                  value={bikeColor || '#d94e34'}
                  onChange={(e) => setBikeColor(e.target.value)}
                  className="popup-color-picker"
                />
              </div>
            </div>

            <div className="popup-control">
              <label>Wheels Accent:</label>
              <div className="popup-presets">
                {['#2b2d42', '#1d3557', '#e63946', '#2a9d8f', '#a8dadc'].map((color) => (
                  <button
                    key={color}
                    className={`popup-color-preset ${wheelColor === color ? 'active' : ''}`}
                    style={{ backgroundColor: color }}
                    onClick={() => setWheelColor(color)}
                  />
                ))}
                <input
                  type="color"
                  value={wheelColor || '#2b2d42'}
                  onChange={(e) => setWheelColor(e.target.value)}
                  className="popup-color-picker"
                />
              </div>
            </div>

            {(bikeColor !== undefined || wheelColor !== undefined) && (
              <button
                className="popup-reset-btn"
                onClick={() => {
                  setBikeColor(undefined);
                  setWheelColor(undefined);
                }}
              >
                Reset Colors
              </button>
            )}
          </div>
        </div>
      </div>

      <JungleFooter />
    </main>

  );
}
