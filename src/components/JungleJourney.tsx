import { useLayoutEffect, useMemo, useRef, useState } from 'react';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import ScrollPerfTracker from './ScrollPerfTracker';
import { bikePose, projectPose, rideProgress, SCROLL_DISTANCE, CONTENT_TRAVEL } from './journeyMotion';

import projectsData from '../content/projects.json';
import JourneyEnvironment from './JourneyEnvironment';
import JourneyScenery, { type JourneySceneryHandle, type CardWindow } from './JourneyScenery';
import JungleFooter from './JungleFooter';
import BikeCharacter, { type BikeCharacterHandle } from './BikeCharacter';
import { ProjectBlueprint } from './ProjectBlueprint';

gsap.registerPlugin(ScrollTrigger);

export default function JungleJourney() {
  if (typeof window !== 'undefined' && window.__scrollPerf) {
    window.__scrollPerf.journeyRenders++;
  }

  const containerRef = useRef<HTMLDivElement>(null);
  const bikerRef = useRef<HTMLDivElement>(null);
  const sceneryRef = useRef<JourneySceneryHandle>(null);
  const bikeCharacterRef = useRef<BikeCharacterHandle>(null);
  const nearestProjectIndexRef = useRef(0);
  const [isHovered, setIsHovered] = useState(false);
  const [bikeColor, setBikeColor] = useState<string | undefined>(undefined);
  const [wheelColor, setWheelColor] = useState<string | undefined>(undefined);
  const [showOverlay, setShowOverlay] = useState(() => {
    return typeof window !== 'undefined' && !!window.location.hash;
  });
  const featuredProjects = useMemo(() => projectsData.filter((project) => project.featured), []);

  useLayoutEffect(() => {
    const container = containerRef.current;
    const bikerElement = bikerRef.current;

    if (!container || !bikerElement) {
      return;
    }

    const context = gsap.context(() => {
      const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
      let origin = { x: 0, y: 0 };
      let bikerWidth = 0;
      const highlight = container.querySelector<HTMLElement>('.jj-hero__statement--highlight');
      // offset geometry is independent of the current scroll/GSAP transform.
      const localOffset = (element: HTMLElement) => {
        let x = 0, y = 0;
        let node: HTMLElement | null = element;
        while (node && node !== container) {
          x += node.offsetLeft;
          y += node.offsetTop;
          node = node.offsetParent as HTMLElement | null;
        }
        return { x, y };
      };

      const projectElements = gsap.utils.toArray<HTMLElement>('.jj-project');

      const projectStates = projectElements.map((element) => ({
        element,
        baseLeft: Number(element.dataset.journeyLeft),
        width: 0, height: 0, top: 0,
        hidden: false,

      }));
      const progressHud = container.querySelector<HTMLElement>(
        '.jj-cloud-hud',
      );
      const footerEl = container.querySelector<HTMLElement>('.jj-footer');
      const heroElement = container.querySelector<HTMLElement>('.jj-hero');
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

      const listeners = new AbortController();
      let navigationTween: gsap.core.Tween | null = null;
      // Event listener for brand link to scroll back to top
      const brandBtn = container.querySelector<HTMLElement>('.jj-header__brand-btn');
      const handleBrandClick = (e: MouseEvent) => {
        e.preventDefault();
        const scrollObj = { y: window.scrollY };
        navigationTween?.kill();
        navigationTween = gsap.to(scrollObj, {
          y: 0,
          duration: 1.2,
          ease: 'power2.out',
          overwrite: 'auto',
          onUpdate: () => window.scrollTo(0, scrollObj.y),
        });
      };
      brandBtn?.addEventListener('click', handleBrandClick, { signal: listeners.signal });

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
          navigationTween?.kill();
          navigationTween = gsap.to(scrollObj, {
            y: targetScroll,
            duration: 1.2,
            ease: 'power2.out',
            overwrite: 'auto',
            onUpdate: () => window.scrollTo(0, scrollObj.y),
          });
        }, { signal: listeners.signal });

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
        }, { signal: listeners.signal });
      });

      // A wheel/touch/key action takes control back from a navigation tween.
      const cancelNavigation = () => navigationTween?.kill();
      window.addEventListener('wheel', cancelNavigation, { passive: true, signal: listeners.signal });
      window.addEventListener('touchstart', cancelNavigation, { passive: true, signal: listeners.signal });
      window.addEventListener('keydown', cancelNavigation, { signal: listeners.signal });

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
      let viewportWidth = container.clientWidth;
      const updateViewportSize = () => {
        viewportHeight = container.clientHeight;
        viewportWidth = container.clientWidth;
        bikerWidth = bikerElement.offsetWidth;
        if (highlight) {
          const position = localOffset(highlight);
          origin = {
            x: position.x + highlight.offsetWidth * .87 - viewportWidth / 2 + 20,
            y: position.y + highlight.offsetHeight * .18 - (viewportHeight - viewportHeight * (viewportWidth <= 720 ? .02 : .04)) + 15,
          };
        }
        // Read all layout before writing any styles. No geometry reads during scroll.
        projectStates.forEach(state => {
          state.width = state.element.offsetWidth;
          state.height = state.element.offsetHeight;
          state.top = state.element.offsetTop;
        });

      };
      updateViewportSize();
      ScrollTrigger.addEventListener('refreshInit', updateViewportSize);

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

      const setProjectStates = (progress: number) => {
        const tStart = performance.now();
        let nearest = 0;
        let nearestDistance = Infinity;
        let card: CardWindow | null = null;

        projectStates.forEach((state, index) => {
          const pose = projectPose(progress, state.baseLeft, viewportHeight);
          const distance = Math.abs(pose.left - 50);
          if (distance < nearestDistance) {
            nearestDistance = distance;
            nearest = index;
            card = pose.opacity > 0 ? {
              left: pose.left * viewportWidth / 100 - state.width * pose.scale / 2,
              top: state.top + pose.y + state.height * (.28 - .78 * pose.scale),
              width: state.width * pose.scale,
              height: state.height * pose.scale,
            } : null;

          }
          const hidden = pose.opacity === 0;
          if (hidden !== state.hidden) {
            state.element.style.visibility = hidden ? 'hidden' : 'visible';
            state.element.style.pointerEvents = hidden ? 'none' : 'auto';
            state.element.inert = hidden;
            state.hidden = hidden;
          }
          if (hidden) return;
          state.element.style.transform = `translate(-50%, -50%) translate3d(${-CONTENT_TRAVEL * rideProgress(progress)}vw, ${pose.y}px, 0) scale(${pose.scale})`;
          state.element.style.opacity = String(pose.opacity);
        });
        sceneryRef.current?.render(progress, card);
        updateProgressHud(nearest);
        nearestProjectIndexRef.current = nearest;
        const perf = window.__scrollPerf;
        if (perf) {
          perf.lastProjectStatesTime = performance.now() - tStart;
          perf.maxProjectStatesTime = Math.max(perf.maxProjectStatesTime, perf.lastProjectStatesTime);
        }
      };
      const renderMotion = (progress: number) => {
        setProjectStates(progress);
        const travelled = rideProgress(progress);
        const pose = bikePose(progress, origin, bikerWidth);
        if (!reduceMotion) {
          bikerElement.style.transform = `translateX(-50%) translate3d(${pose.x}px, ${pose.y}px, 0) rotate(${pose.rotation}deg) scale(${pose.scale})`;
          bikerElement.style.opacity = String(pose.opacity);
          bikerElement.style.visibility = pose.opacity === 0 ? 'hidden' : 'visible';
          bikerElement.style.zIndex = progress < .15 ? '12' : '6';
          bikeCharacterRef.current?.updateRotation(travelled * SCROLL_DISTANCE / 1800 * 360);
        } else {
          bikerElement.style.transform = 'translate(-50%, -15px)';
          bikerElement.style.opacity = String(pose.opacity);
          bikerElement.style.visibility = pose.opacity === 0 ? 'hidden' : 'visible';
        }
      };

      if (progressHud) {
        gsap.set(progressHud, { autoAlpha: 0, y: -12 });
      }

      renderMotion(0);

      const timeline = gsap.timeline({
        scrollTrigger: {
          trigger: container,
          start: 'top top',
          end: `+=${SCROLL_DISTANCE}`,
          scrub: 0.5,
          pin: true,
          invalidateOnRefresh: true,
          onUpdate: () => container.classList.add('is-scrolling'),
          onScrubComplete: () => container.classList.remove('is-scrolling'),
          onRefresh: (self) => { if (self.animation) updateJourney(self.animation.progress()); },
        },
      });
      function updateJourney(progress: number) {
        renderMotion(progress);
        if (heroElement) {
          heroElement.inert = progress >= .15;
          heroElement.classList.toggle('is-finished', progress >= .15);
        }
        if (typeof window !== 'undefined' && window.__scrollPerf) {
          window.__scrollPerf.scrollUpdates++;
          window.__scrollPerf.currentProgress = progress;

          if (progress < 0.15) {
            window.__scrollPerf.currentPhase = 'Hero Landing Phase';
          } else if (progress >= 0.82 && progress < 0.90) {
            window.__scrollPerf.currentPhase = 'Roots Transition Phase';
          } else if (progress >= 0.90) {
            window.__scrollPerf.currentPhase = 'Deep Roots Footer';
          } else {
            const activeProject = featuredProjects[nearestProjectIndexRef.current];
            window.__scrollPerf.currentPhase = activeProject
              ? `Active Project: ${activeProject.core.title}`
              : 'Project Cards Scroll';
          }
        }

        if (headerElement) {
          if (progress >= 0.88) {
            if (headerElement.className !== 'jj-header jj-header--dark') {
              headerElement.className = 'jj-header jj-header--dark';
            }
          } else if (progress >= 0.04) {
            if (headerElement.className !== 'jj-header jj-header--scrolled') {
              headerElement.className = 'jj-header jj-header--scrolled';
            }
          } else {
            if (headerElement.className !== 'jj-header') {
              headerElement.className = 'jj-header';
            }
          }
        }

        if (footerEl) {
          const shouldBeActive = progress >= 0.95;
          const isActive = footerEl.classList.contains('is-active');
          if (shouldBeActive !== isActive) {
            if (shouldBeActive) {
              footerEl.classList.add('is-active');
            } else {
              footerEl.classList.remove('is-active');
            }
          }
        }

      };
      // Numeric scrub keeps running after scroll events stop. Every moving part
      // must use the animation clock, not ScrollTrigger's raw input progress.
      timeline.eventCallback('onUpdate', () => updateJourney(timeline.progress()));

      // Intro animations: Fade/translate hero elements and fade fog backdrop
      timeline.to('.jj-hero__backdrop', {
        opacity: 0,
        duration: 0.15,
        ease: 'power2.inOut',
      }, 0);

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

      timeline.set('.jj-hero', {
        pointerEvents: 'none',
      }, 0.12);



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

      // --- Transitions to Deep Roots Footer at Scroll End ---
      // Move the landscape as one composited scene. The timeline ends at 1.

      // 1. HUD slides out first (earliest signal the journey is ending)
      if (progressHud) {
        timeline.to(progressHud, {
          y: -40,
          autoAlpha: 0,
          duration: 0.06,
          ease: 'power1.inOut',
        }, 0.82);
      }

      // 3. Background overlay fades in (instead of animating container backgroundColor)
      timeline.fromTo('.jj-bg-overlay', {
        opacity: 0,
      }, {
        opacity: 1,
        duration: 0.08,
        ease: 'power1.inOut',
      }, 0.85);

      // 4. Subtle dimming of the landscape environment
      timeline.to('.journey-environment', {
        opacity: 0.7,
        duration: 0.08,
        ease: 'power1.out',
      }, 0.85);

      // 5. One camera ascent instead of individually fading/moving every layer
      timeline.to('.jj-scene', {
        yPercent: -70,
        duration: 0.10,
        ease: 'power2.inOut',
      }, 0.87);

      // 6. Hide landscape layers completely to save GPU resources at the end
      timeline.to('.jj-scene', {
        autoAlpha: 0,
        duration: 0.08,
        ease: 'power1.inOut',
      }, 0.89);



      // 7. Footer slides up into view (latest, after landscape clears)
      timeline.fromTo('.jj-footer', {
        yPercent: 100,
        autoAlpha: 0,
      }, {
        yPercent: 0,
        autoAlpha: 1,
        duration: 0.10,
        ease: 'power2.out',

      }, 0.90);


      // Force initial layout/trigger refresh synchronously so that the document has its full scrollable height.
      // This enables both:
      // 1. Native browser scroll restoration (when navigating back via browser back button)
      // 2. Hash-based scroll positioning (when landing on a specific project hash)
      ScrollTrigger.refresh();
      let disposed = false;
      document.fonts.ready.then(() => {
        if (!disposed) ScrollTrigger.refresh();
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
        const scrollProgress = journeyProgress * 0.70 + 0.15;
        const targetScrollTop = scrollProgress * SCROLL_DISTANCE;

        window.scrollTo(0, targetScrollTop);
      };

      // Run hash navigation check immediately (pre-paint)
      handleHashNavigation();

      // The scroll position is already restored. Do not hide the page behind
      // a full-screen blurred, repeating animation while textures are loading.
      const timer = setTimeout(() => setShowOverlay(false), 50);
      return () => {
        clearTimeout(timer);
        listeners.abort();
        container.classList.remove('is-scrolling');
        navigationTween?.kill();
        disposed = true;
        ScrollTrigger.removeEventListener('refreshInit', updateViewportSize);
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
      <div className="jj-scene">
      <JourneyEnvironment />
      {/* Background overlay for dark transition — uses opacity instead of backgroundColor to avoid full-viewport repaint */}
      <div className="jj-bg-overlay" aria-hidden="true" />


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

      <JourneyScenery ref={sceneryRef} />

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
                <div className="jj-card__hero-overlay" />
                <div className="jj-card__hero-blueprint" aria-hidden="true">
                  <ProjectBlueprint projectId={project.id} />
                </div>
                <div className="jj-card__hero-content">
                  <p className="jj-card__label">Project 0{index + 1}</p>
                  <h2>{project.core.title}</h2>
                  <p className="jj-card__tagline">{project.core.tagline}</p>
                </div>
              </div>

              <div className="jj-card__info">
                <p>{project.story.summary}</p>
                <div className="jj-card__stack">
                  {project.core.stack.slice(0, 3).map((tech) => (
                    <span key={tech} className="jj-card__tech-tag">{tech}</span>
                  ))}
                  {project.core.stack.length > 3 && (
                    <span className="jj-card__tech-tag jj-card__tech-tag--more">
                      +{project.core.stack.length - 3}
                    </span>
                  )}
                </div>
              </div>
            </article>
          </a>
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
            ref={bikeCharacterRef}
            rotationAngle={0}
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

      </div>
      <JungleFooter />
      <ScrollPerfTracker />
    </main>

  );
}
