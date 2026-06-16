import projectsData from '../content/projects.json';
import './ProjectDetail.css';

type Project = (typeof projectsData)[number];

interface ProjectDetailProps {
  project: Project;
}

const projectVisualLabels: Record<string, string> = {
  atlas: 'Cartography Workbench',
  kartino: 'Learning Loop',
  recore: 'Active Blueprint',
  'replication-toolbox': 'Research Artifact',
  'smart-plant-care': 'IoT Control Bench',
};

function getProjectTone(project: Project) {
  if (project.id === 'atlas') {
    return 'atlas';
  }

  if (project.id === 'kartino') {
    return 'kartino';
  }

  if (project.id === 'recore') {
    return 'recore';
  }

  if (project.id === 'smart-plant-care') {
    return 'plant';
  }

  return 'future';
}

function ProjectArtifact({ project }: ProjectDetailProps) {
  const tone = getProjectTone(project);

  if (project.id === 'atlas') {
    return (
      <div className="pd-artifact pd-artifact--atlas" aria-label="Atlas visual artifact">
        <div className="pd-map">
          <span className="pd-contour pd-contour--one" />
          <span className="pd-contour pd-contour--two" />
          <span className="pd-contour pd-contour--three" />
          <span className="pd-map-pin pd-map-pin--one" />
          <span className="pd-map-pin pd-map-pin--two" />
          <span className="pd-map-pin pd-map-pin--three" />
        </div>
        <div className="pd-layer-stack">
          {['Historical cartography', 'Resilience layers', 'Vector features'].map(
            (layer) => (
              <span key={layer}>{layer}</span>
            ),
          )}
        </div>
        <div className="pd-inspector">
          <strong>Layer inspector</strong>
          <span>mixed spatial content</span>
          <span>map and sidebar sync</span>
        </div>
      </div>
    );
  }

  if (project.id === 'kartino') {
    return (
      <div className="pd-artifact pd-artifact--kartino" aria-label="Kartino visual artifact">
        <div className="pd-phone">
          <span className="pd-chat pd-chat--bot">Send a topic</span>
          <span className="pd-chat pd-chat--user">urban resilience</span>
          <span className="pd-chat pd-chat--bot">3 cards ready</span>
        </div>
        <div className="pd-flashcard">
          <span>Review card</span>
          <strong>What makes a learning loop reliable?</strong>
          <div>
            <button type="button">Again</button>
            <button type="button">Good</button>
          </div>
        </div>
        <div className="pd-telemetry">
          <span>Creation</span>
          <strong>77-84%</strong>
          <span>Rating</span>
          <strong>89-92%</strong>
        </div>
      </div>
    );
  }

  if (project.id === 'recore') {
    return (
      <div className="pd-artifact pd-artifact--recore" aria-label="RECORE visual artifact">
        <div className="pd-blueprint-grid">
          <span className="pd-node pd-node--one">Case study</span>
          <span className="pd-node pd-node--two">Platform UI</span>
          <span className="pd-node pd-node--three">Architecture</span>
          <span className="pd-connector pd-connector--one" />
          <span className="pd-connector pd-connector--two" />
        </div>
        <div className="pd-note">
          <strong>Growing dossier</strong>
          <span>screenshots and technical writing pending</span>
        </div>
      </div>
    );
  }

  return (
    <div className={`pd-artifact pd-artifact--${tone}`} aria-label={`${project.core.title} visual artifact`}>
      <div className="pd-placeholder-device">
        <span>{projectVisualLabels[project.id] ?? 'Project Artifact'}</span>
        <strong>{project.core.status}</strong>
      </div>
      <div className="pd-placeholder-list">
        {project.story.highlights.slice(0, 3).map((highlight) => (
          <span key={highlight}>{highlight}</span>
        ))}
      </div>
    </div>
  );
}

function MediaSlot({
  title,
  caption,
  src,
}: {
  title: string;
  caption: string;
  src?: string;
}) {
  return (
    <article className="pd-media-slot">
      <div className="pd-media-frame">
        <span>{src ? 'Asset path set' : 'Placeholder needed'}</span>
      </div>
      <h3>{title}</h3>
      <p>{caption}</p>
    </article>
  );
}

export default function ProjectDetail({ project }: ProjectDetailProps) {
  const tone = getProjectTone(project);
  const visualLabel = projectVisualLabels[project.id] ?? 'Project Artifact';

  return (
    <main className={`pd-page pd-page--${tone}`}>
      <nav className="pd-nav" aria-label="Project navigation">
        <a href="/">Back to journey</a>
        <span>{project.core.dateLabel}</span>
      </nav>

      <section className="pd-hero">
        <div className="pd-hero__copy">
          <p className="pd-kicker">{visualLabel}</p>
          <h1>{project.core.title}</h1>
          <p>{project.core.tagline}</p>

          <div className="pd-meta">
            <span>{project.core.role}</span>
            <span>{project.core.teamContext}</span>
            <span>{project.core.status}</span>
          </div>
        </div>

        <ProjectArtifact project={project} />
      </section>

      <section className="pd-story-grid" aria-label="Project story">
        <article>
          <span>Problem</span>
          <p>{project.story.problem}</p>
        </article>
        <article>
          <span>Solution</span>
          <p>{project.story.solution}</p>
        </article>
        <article>
          <span>Outcome</span>
          <p>{project.story.outcome}</p>
        </article>
      </section>

      <section className="pd-section pd-section--split">
        <div>
          <p className="pd-kicker">Highlights</p>
          <h2>What this project shows</h2>
        </div>
        <ul className="pd-highlight-list">
          {project.story.highlights.map((highlight) => (
            <li key={highlight}>{highlight}</li>
          ))}
        </ul>
      </section>

      <section className="pd-metrics" aria-label="Project metrics">
        {project.story.metrics.map((metric) => (
          <article key={`${metric.label}-${metric.value}`}>
            <span>{metric.label}</span>
            <strong>{metric.value}</strong>
          </article>
        ))}
      </section>

      <section className="pd-section pd-section--split">
        <div>
          <p className="pd-kicker">Build Notes</p>
          <h2>Stack and decisions</h2>
        </div>
        <div className="pd-stack">
          {project.core.stack.map((item) => (
            <span key={item}>{item}</span>
          ))}
        </div>
      </section>

      <section className="pd-gallery">
        <div>
          <p className="pd-kicker">Media Slots</p>
          <h2>Ready for real project assets</h2>
        </div>
        <div className="pd-gallery-grid">
          <MediaSlot
            title={project.media.cover.title}
            caption={project.media.cover.caption}
            src={project.media.cover.src}
          />
          {project.media.gallery.map((item) => (
            <MediaSlot
              key={`${item.title}-${item.caption}`}
              title={item.title}
              caption={item.caption}
              src={item.src}
            />
          ))}
        </div>
      </section>

      {project.story.nextSteps.length > 0 && (
        <section className="pd-next">
          <p className="pd-kicker">Next</p>
          <h2>What needs your input</h2>
          <ul>
            {project.story.nextSteps.map((step) => (
              <li key={step}>{step}</li>
            ))}
          </ul>
        </section>
      )}
    </main>
  );
}
