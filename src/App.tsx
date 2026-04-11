import {
  type CSSProperties,
  type PointerEvent,
  startTransition,
  useDeferredValue,
  useEffect,
  useEffectEvent,
  useRef,
  useState,
} from "react";
import { atelierModes, atelierSignals, evidence, projects, routes, type Project } from "./data/projects";

const defaultProject = projects[0];
const archiveProjects = projects.filter((project) => !project.featured);
const archiveFocusProject = archiveProjects[0] ?? defaultProject;

const floatingSignals = [
  { x: 16, y: 18, label: "route logic", value: "multi-layer" },
  { x: 79, y: 16, label: "product loop", value: "observed" },
  { x: 88, y: 48, label: "system trust", value: "tested" },
  { x: 14, y: 82, label: "resource use", value: "efficient" },
];

function App() {
  const sceneRef = useRef<HTMLDivElement>(null);
  const [activeProjectId, setActiveProjectId] = useState(defaultProject.id);
  const [mode, setMode] = useState<"survey" | "immersion" | "archive">("survey");
  const [pointer, setPointer] = useState({ x: 0, y: 0 });
  const [sceneSize, setSceneSize] = useState({ width: 1280, height: 820 });

  const activeProject = projects.find((project) => project.id === activeProjectId) ?? defaultProject;
  const deferredProject = useDeferredValue(activeProject);
  const cameraProject = mode === "immersion" ? activeProject : mode === "archive" ? archiveFocusProject : null;

  const measureScene = useEffectEvent(() => {
    const element = sceneRef.current;
    if (!element) return;

    setSceneSize({
      width: element.clientWidth,
      height: element.clientHeight,
    });
  });

  useEffect(() => {
    measureScene();
    window.addEventListener("resize", measureScene);
    return () => window.removeEventListener("resize", measureScene);
  }, [measureScene]);

  const handlePointerMove = (event: PointerEvent<HTMLDivElement>) => {
    const rect = event.currentTarget.getBoundingClientRect();
    const x = ((event.clientX - rect.left) / rect.width - 0.5) * 2;
    const y = ((event.clientY - rect.top) / rect.height - 0.5) * 2;
    setPointer({ x, y });
  };

  const handlePointerLeave = () => {
    setPointer({ x: 0, y: 0 });
  };

  const focusProject = (projectId: string) => {
    startTransition(() => {
      setActiveProjectId(projectId);
      setMode("immersion");
    });
  };

  const switchToSurvey = () => {
    startTransition(() => {
      setMode("survey");
    });
  };

  const switchToArchive = () => {
    startTransition(() => {
      setActiveProjectId(archiveFocusProject.id);
      setMode("archive");
    });
  };

  const cameraScale = cameraProject?.world.cameraScale ?? 1;
  const cameraTranslateX = cameraProject
    ? (50 - cameraProject.world.x) * (sceneSize.width * 0.032)
    : 0;
  const cameraTranslateY = cameraProject
    ? (50 - cameraProject.world.y) * (sceneSize.height * 0.046)
    : 0;

  const worldStyle: CSSProperties = {
    transform: [
      `translate3d(${cameraTranslateX + pointer.x * (cameraProject ? 14 : 30)}px, ${cameraTranslateY + pointer.y * (cameraProject ? 9 : 22)}px, 0px)`,
      `scale(${cameraScale})`,
      `rotateX(${59 - pointer.y * 3.5}deg)`,
      `rotateZ(${-17 + pointer.x * 2.1}deg)`,
    ].join(" "),
  };

  const makeLayerStyle = (strength: number, lift = 0): CSSProperties => ({
    transform: `translate3d(${pointer.x * strength}px, ${pointer.y * strength * 0.5}px, ${lift}px)`,
  });

  const panelProject = mode === "archive" ? archiveFocusProject : deferredProject;

  return (
    <div className="atelier-root">
      <div className="atelier-noise" />

      <header className="atelier-hud">
        <div>
          <div className="atelier-hud__eyebrow">Danial Khalili / Systems Atelier</div>
          <div className="atelier-hud__subline">Explorable portfolio prototype / 2.5D system world</div>
        </div>

        <div className="atelier-hud__actions">
          <button
            className={`atelier-pill ${mode === "survey" ? "is-active" : ""}`}
            onClick={switchToSurvey}
            type="button"
          >
            Survey
          </button>
          <button
            className={`atelier-pill ${mode === "immersion" ? "is-active" : ""}`}
            onClick={() => focusProject(activeProject.id)}
            type="button"
          >
            Immerse
          </button>
          <button
            className={`atelier-pill ${mode === "archive" ? "is-active" : ""}`}
            onClick={switchToArchive}
            type="button"
          >
            Archive
          </button>
        </div>
      </header>

      <main className="atelier-main">
        <section
          ref={sceneRef}
          className="atelier-stage"
          onPointerLeave={handlePointerLeave}
          onPointerMove={handlePointerMove}
        >
          <div className="atelier-copy">
            <div className="atelier-copy__kicker">Systems Atelier / 2.5D exploration</div>
            <h1 className="atelier-copy__title">
              Enter a portfolio built like a layered machine for real products.
            </h1>
            <p className="atelier-copy__body">
              This version stops behaving like a brochure. Projects become chambers, devices, and signal nodes
              inside one explorable technical world. Move through it, zoom in, and open a dossier when
              something catches your eye.
            </p>

            <div className="atelier-copy__chips">
              {atelierSignals.map((signal) => (
                <span key={signal} className="atelier-chip">
                  {signal}
                </span>
              ))}
            </div>
          </div>

          <div className="atelier-stage__viewport">
            <div className="atelier-world" style={worldStyle}>
              <div className="atelier-world__plane atelier-world__plane--base" style={makeLayerStyle(6, -120)} />

              <div className="atelier-world__plane atelier-world__plane--terrain" style={makeLayerStyle(12, 0)}>
                <div className="atelier-world__grid" />
                <div className="atelier-world__ring atelier-world__ring--one" />
                <div className="atelier-world__ring atelier-world__ring--two" />
                <div className="atelier-world__ring atelier-world__ring--three" />
                <div className="atelier-world__glow atelier-world__glow--one" />
                <div className="atelier-world__glow atelier-world__glow--two" />
                <div className="atelier-world__glow atelier-world__glow--three" />
              </div>

              <div className="atelier-world__plane atelier-world__plane--routes" style={makeLayerStyle(16, 24)}>
                <svg className="atelier-routes" viewBox="0 0 100 100" preserveAspectRatio="none">
                  <defs>
                    <linearGradient id="routeGradient" x1="0" x2="1" y1="0" y2="1">
                      <stop offset="0%" stopColor="rgba(145, 236, 192, 0.7)" />
                      <stop offset="55%" stopColor="rgba(157, 214, 255, 0.65)" />
                      <stop offset="100%" stopColor="rgba(208, 167, 255, 0.72)" />
                    </linearGradient>
                  </defs>
                  {routes.map(([sourceId, targetId]) => {
                    const source = projects.find((project) => project.id === sourceId);
                    const target = projects.find((project) => project.id === targetId);
                    if (!source || !target) return null;

                    const midX = (source.world.x + target.world.x) / 2;
                    const midY = Math.min(source.world.y, target.world.y) - 10;

                    return (
                      <path
                        key={`${sourceId}-${targetId}`}
                        d={`M ${source.world.x} ${source.world.y} Q ${midX} ${midY}, ${target.world.x} ${target.world.y}`}
                        fill="none"
                        stroke="url(#routeGradient)"
                        strokeDasharray="1.8 2.8"
                        strokeLinecap="round"
                        strokeWidth="0.4"
                      />
                    );
                  })}
                </svg>
              </div>

              <div className="atelier-world__plane atelier-world__plane--signals" style={makeLayerStyle(24, 150)}>
                {floatingSignals.map((signal) => (
                  <div
                    key={signal.label}
                    className="atelier-signal"
                    style={{
                      left: `${signal.x}%`,
                      top: `${signal.y}%`,
                    }}
                  >
                    <div className="atelier-signal__label">{signal.label}</div>
                    <div className="atelier-signal__value">{signal.value}</div>
                  </div>
                ))}

                {evidence.map((item, index) => (
                  <div
                    key={item.label}
                    className="atelier-evidence"
                    style={{
                      left: `${24 + index * 18}%`,
                      top: index % 2 === 0 ? "88%" : "83%",
                    }}
                  >
                    <div className="atelier-evidence__label">{item.label}</div>
                    <div className="atelier-evidence__value">{item.value}</div>
                  </div>
                ))}
              </div>

              <div className="atelier-world__plane atelier-world__plane--nodes" style={makeLayerStyle(30, 280)}>
                {projects.map((project) => (
                  <ProjectNode
                    key={project.id}
                    isActive={project.id === activeProject.id && mode !== "survey"}
                    isDimmed={mode === "archive" ? project.featured : false}
                    onOpen={() => focusProject(project.id)}
                    project={project}
                  />
                ))}
              </div>
            </div>
          </div>

          <div className="atelier-map">
            <div className="atelier-map__title">World index</div>
            <div className="atelier-map__list">
              {projects.map((project) => (
                <button
                  key={project.id}
                  className={`atelier-map__item ${project.id === activeProject.id ? "is-active" : ""}`}
                  onClick={() => focusProject(project.id)}
                  type="button"
                >
                  <span className="atelier-map__dot" style={{ backgroundColor: project.world.hue }} />
                  <span>{project.shortTitle}</span>
                </button>
              ))}
            </div>
          </div>

          <aside className={`atelier-dossier ${mode === "survey" ? "is-peek" : "is-open"}`}>
            <div className="atelier-dossier__label">
              {mode === "archive" ? "Dormant chamber" : "System dossier"}
            </div>

            <div className="atelier-dossier__titleRow">
              <div>
                <h2 className="atelier-dossier__title">{panelProject.shortTitle}</h2>
                <p className="atelier-dossier__subtitle">
                  {panelProject.category} / {panelProject.timeframe}
                </p>
              </div>
              <span className="atelier-dossier__status">{panelProject.status}</span>
            </div>

            <p className="atelier-dossier__body">{panelProject.longDescription}</p>

            <div className="atelier-dossier__meta">
              <div>
                <span>Role</span>
                <strong>{panelProject.role}</strong>
              </div>
              <div>
                <span>Region</span>
                <strong>{panelProject.world.region}</strong>
              </div>
              <div>
                <span>Context</span>
                <strong>{panelProject.teamContext}</strong>
              </div>
            </div>

            <div className="atelier-dossier__metrics">
              {panelProject.metrics.map((metric) => (
                <div key={metric.label} className="atelier-dossier__metric">
                  <span>{metric.label}</span>
                  <strong>{metric.value}</strong>
                </div>
              ))}
            </div>

            <div className="atelier-dossier__section">
              <div className="atelier-dossier__sectionLabel">System outcomes</div>
              <div className="atelier-dossier__list">
                {panelProject.outcomes.map((outcome) => (
                  <div key={outcome} className="atelier-dossier__listItem">
                    {outcome}
                  </div>
                ))}
              </div>
            </div>

            <div className="atelier-dossier__section">
              <div className="atelier-dossier__sectionLabel">Tools and materials</div>
              <div className="atelier-dossier__tags">
                {panelProject.tools.map((tool) => (
                  <span key={tool} className="atelier-dossier__tag">
                    {tool}
                  </span>
                ))}
              </div>
            </div>

            <div className="atelier-dossier__section">
              <div className="atelier-dossier__sectionLabel">Artifacts</div>
              <div className="atelier-dossier__media">
                {panelProject.media.map((asset) => (
                  <div key={asset.title} className="atelier-dossier__mediaCard">
                    <div className="atelier-dossier__mediaType">{asset.kind}</div>
                    <div className="atelier-dossier__mediaTitle">{asset.title}</div>
                    <p>{asset.description}</p>
                  </div>
                ))}
              </div>
            </div>

            {panelProject.links.length > 0 ? (
              <div className="atelier-dossier__links">
                {panelProject.links.map((link) => (
                  <a key={link.href} className="atelier-dossier__link" href={link.href} target="_blank" rel="noreferrer">
                    {link.label}
                  </a>
                ))}
              </div>
            ) : null}
          </aside>

          <div className="atelier-statusbar">
            <div>
              <span className="atelier-statusbar__label">Active region</span>
              <strong>{mode === "archive" ? archiveFocusProject.world.region : activeProject.world.region}</strong>
            </div>
            <div>
              <span className="atelier-statusbar__label">Current intent</span>
              <strong>
                {mode === "survey"
                  ? "Scan and discover"
                  : mode === "archive"
                    ? "Reveal future or dormant systems"
                    : activeProject.world.note}
              </strong>
            </div>
          </div>
        </section>

        <section className="atelier-lower">
          <div className="atelier-rack">
            <div className="atelier-rack__heading">
              <div className="atelier-rack__eyebrow">Interaction logic</div>
              <h3 className="atelier-rack__title">How the world is meant to behave</h3>
            </div>

            <div className="atelier-rack__modes">
              {atelierModes.map((item) => (
                <div key={item.label} className="atelier-rack__mode">
                  <div className="atelier-rack__modeTitle">{item.label}</div>
                  <p>{item.description}</p>
                </div>
              ))}
            </div>
          </div>

          <div className="atelier-rack atelier-rack--archive">
            <div className="atelier-rack__heading">
              <div className="atelier-rack__eyebrow">Dormant systems</div>
              <h3 className="atelier-rack__title">Archive and future chambers</h3>
            </div>

            <div className="atelier-rack__archiveGrid">
              {archiveProjects.map((project) => (
                <button
                  key={project.id}
                  className="atelier-rack__archiveCard"
                  onClick={() => focusProject(project.id)}
                  type="button"
                >
                  <div className="atelier-rack__archiveTop">
                    <span>{project.shortTitle}</span>
                    <span>{project.status}</span>
                  </div>
                  <p>{project.shortDescription}</p>
                </button>
              ))}
            </div>
          </div>
        </section>
      </main>
    </div>
  );
}

type ProjectNodeProps = {
  project: Project;
  isActive: boolean;
  isDimmed: boolean;
  onOpen: () => void;
};

function ProjectNode({ project, isActive, isDimmed, onOpen }: ProjectNodeProps) {
  const nodeStyle = {
    left: `${project.world.x}%`,
    top: `${project.world.y}%`,
    ["--node-scale" as const]: String(project.world.scale),
    ["--node-hue" as const]: project.world.hue,
    ["--node-aura" as const]: project.world.aura,
    ["--node-depth" as const]: `${project.world.depth}px`,
  } as CSSProperties;

  return (
    <button
      className={`atelier-node atelier-node--${project.world.object} ${isActive ? "is-active" : ""} ${isDimmed ? "is-dimmed" : ""}`}
      onClick={onOpen}
      style={nodeStyle}
      type="button"
    >
      <span className="atelier-node__aura" />
      <span className="atelier-node__beam" />
      <span className="atelier-node__body">
        <span className="atelier-node__core" />
        <span className="atelier-node__rim atelier-node__rim--one" />
        <span className="atelier-node__rim atelier-node__rim--two" />
        <span className="atelier-node__satellite atelier-node__satellite--one" />
        <span className="atelier-node__satellite atelier-node__satellite--two" />
      </span>
      <span className="atelier-node__caption">
        <strong>{project.shortTitle}</strong>
        <small>{project.world.region}</small>
      </span>
    </button>
  );
}

export default App;
