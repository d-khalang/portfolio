import { useLayoutEffect, useRef } from 'react';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

import mountainLayer from '../assets/jungle/l1_montain_tile.png';
import greenLayer from '../assets/jungle/l2_green_tile.png';
import biker from '../assets/jungle_old/biker.png';
import projectsData from '../content/projects.json';

gsap.registerPlugin(ScrollTrigger);

const SCROLL_DISTANCE = 5000;
const CONTENT_TRAVEL = 300;

interface LayerDefinition {
  id: string;
  src: string;
  speed: number;
  zIndex: number;
}

const layers: LayerDefinition[] = [
  { id: 'mountains', src: mountainLayer, speed: 0.12, zIndex: 1 },
  { id: 'green-hills', src: greenLayer, speed: 0.28, zIndex: 2 },
];

const bikerBob = [0, -8, 4, -12, 2, -6, 8, -10, 3, -5, 0];

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
      const scrollTrigger = {
        trigger: container,
        start: 'top top',
        end: `+=${SCROLL_DISTANCE}`,
        scrub: 0.5,
      };

      gsap.utils.toArray<HTMLElement>('.jj-layer').forEach((layer) => {
        const speed = Number(layer.dataset.speed);

        gsap.to(layer, {
          backgroundPositionX: -SCROLL_DISTANCE * speed,
          ease: 'none',
          scrollTrigger,
        });
      });

      gsap.to('.jj-project', {
        x: `-${CONTENT_TRAVEL}vw`,
        ease: 'none',
        scrollTrigger,
      });

      gsap.set(bikerElement, { xPercent: -50 });

      const bobTimeline = gsap.timeline({ scrollTrigger });
      bikerBob.slice(1).forEach((y) => {
        bobTimeline.to(bikerElement, {
          y,
          duration: 1,
          ease: 'sine.inOut',
        });
      });

      ScrollTrigger.create({
        ...scrollTrigger,
        pin: true,
        invalidateOnRefresh: true,
      });
    }, container);

    return () => context.revert();
  }, []);

  return (
    <main ref={containerRef} className="jj-container">
      <div className="jj-sky" aria-hidden="true" />

      {layers.map((layer) => (
        <div
          key={layer.id}
          className="jj-layer"
          data-speed={layer.speed}
          style={{
            backgroundImage: `url(${layer.src})`,
            zIndex: layer.zIndex,
          }}
          aria-hidden="true"
        />
      ))}

      {featuredProjects.map((project, index) => {
        const journeyPosition = project.journeyPosition ?? 0.5;
        const left = 65 + CONTENT_TRAVEL * journeyPosition;
        const url =
          project.core.links[0]?.url.replace(/https?:\/\/(www\.)?/, '') ??
          'in-progress';

        return (
          <section
            key={project.id}
            className="jj-project"
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
          </section>
        );
      })}

      <img
        ref={bikerRef}
        src={biker}
        alt="Biker travelling through the project landscape"
        className="jj-biker"
        draggable={false}
      />
    </main>
  );
}
