import projectsData from "./content/projects.json";
import siteStructureData from "./content/site-structure.json";
import visualSystemData from "./content/visual-system.json";
import "./site.css";

type ProjectLink = {
  label: string;
  url: string;
  type: string;
};

type ProjectMetric = {
  label: string;
  value: string;
};

type ProjectMediaItem = {
  type: "image" | "video";
  title: string;
  caption: string;
  src: string;
  poster?: string;
  alt: string;
};

type Project = {
  id: string;
  slug: string;
  featured: boolean;
  core: {
    title: string;
    tagline: string;
    status: string;
    dateLabel: string;
    role: string;
    teamContext: string;
    stack: string[];
    categories: string[];
    links: ProjectLink[];
  };
  story: {
    summary: string;
    problem: string;
    solution: string;
    outcome: string;
    highlights: string[];
    metrics: ProjectMetric[];
    lessons: string[];
    nextSteps: string[];
  };
  media: {
    cover: ProjectMediaItem;
    gallery: ProjectMediaItem[];
    visualStyle: {
      accent: string;
      tone: string;
    };
  };
};

type SiteStructure = {
  site: {
    name: string;
    title: string;
    description: string;
  };
  navigation: Array<{ label: string; href: string }>;
  hero: {
    eyebrow: string;
    headline: string;
    supportingText: string;
    primaryAction: { label: string; href: string };
    secondaryAction: { label: string; href: string };
    signalItems: string[];
  };
  projectsIntro: {
    eyebrow: string;
    title: string;
    body: string;
  };
  approach: {
    eyebrow: string;
    title: string;
    body: string;
    principles: Array<{ title: string; body: string }>;
  };
  about: {
    eyebrow: string;
    title: string;
    body: string;
  };
  contact: {
    eyebrow: string;
    title: string;
    body: string;
    items: Array<{ label: string; value: string }>;
  };
  footer: {
    note: string;
  };
};

type VisualSystem = {
  colors: {
    background: string;
    surface: string;
    surfaceStrong: string;
    text: string;
    textSoft: string;
    line: string;
    shadow: string;
    usage: Record<string, string>;
    gradients: Record<string, string>;
  };
  typography: {
    scale: Record<string, string>;
  };
  spacing: {
    sectionPadding: string;
    contentWidth: string;
  };
  motion: {
    durations: Record<string, string>;
    easing: Record<string, string>;
  };
};

const projects = projectsData as Project[];
const siteStructure = siteStructureData as SiteStructure;
const visualSystem = visualSystemData as VisualSystem;

const featuredProjects = projects.filter((project) => project.featured);
const archiveProjects = projects.filter((project) => !project.featured);

const root = document.querySelector<HTMLDivElement>("#root");

if (!root) {
  throw new Error("Root element not found.");
}

applyVisualTokens(visualSystem);
applyMetadata(siteStructure);
root.innerHTML = renderSite();
activateRevealAnimations();

function applyMetadata(structure: SiteStructure) {
  document.title = structure.site.title;

  const descriptionTag = document.querySelector('meta[name="description"]');
  if (descriptionTag) {
    descriptionTag.setAttribute("content", structure.site.description);
  }
}

function applyVisualTokens(system: VisualSystem) {
  const style = document.documentElement.style;
  const entries: Array<[string, string]> = [
    ["--color-background", system.colors.background],
    ["--color-surface", system.colors.surface],
    ["--color-surface-strong", system.colors.surfaceStrong],
    ["--color-text", system.colors.text],
    ["--color-text-soft", system.colors.textSoft],
    ["--color-line", system.colors.line],
    ["--color-shadow", system.colors.shadow],
    ["--color-primary", system.colors.usage.primary],
    ["--color-secondary", system.colors.usage.secondary],
    ["--color-accent-warm", system.colors.usage.accentWarm],
    ["--color-accent-cool", system.colors.usage.accentCool],
    ["--color-accent-violet", system.colors.usage.accentViolet],
    ["--color-accent-deep", system.colors.usage.accentDeep],
    ["--gradient-hero", system.colors.gradients.heroWash],
    ["--gradient-card", system.colors.gradients.cardGlow],
    ["--size-hero", system.typography.scale.hero],
    ["--size-h1", system.typography.scale.h1],
    ["--size-h2", system.typography.scale.h2],
    ["--size-h3", system.typography.scale.h3],
    ["--size-body", system.typography.scale.body],
    ["--size-small", system.typography.scale.small],
    ["--size-meta", system.typography.scale.meta],
    ["--space-section", system.spacing.sectionPadding],
    ["--layout-width", system.spacing.contentWidth],
    ["--motion-fast", system.motion.durations.fast],
    ["--motion-base", system.motion.durations.base],
    ["--motion-slow", system.motion.durations.slow],
    ["--ease-standard", system.motion.easing.standard],
    ["--ease-soft", system.motion.easing.soft],
  ];

  entries.forEach(([name, value]) => style.setProperty(name, value));
}

function renderSite() {
  return `
    <div class="site-shell">
      <div class="site-grain"></div>
      <header class="site-header">
        <div class="site-header__inner">
          <a class="site-brand" href="#top">
            <span class="site-brand__name">${escapeHtml(siteStructure.site.name)}</span>
            <span class="site-brand__tag">Portfolio / Product engineer / System builder</span>
          </a>
          <nav class="site-nav" aria-label="Primary">
            ${siteStructure.navigation
              .map(
                (item) =>
                  `<a class="site-nav__link" href="${escapeAttribute(item.href)}">${escapeHtml(item.label)}</a>`,
              )
              .join("")}
          </nav>
        </div>
      </header>

      <main id="top">
        <section class="hero section-block">
          <div class="layout">
            <div class="hero__grid">
              <div class="hero__content" data-reveal>
                <p class="eyebrow">${escapeHtml(siteStructure.hero.eyebrow)}</p>
                <h1 class="hero__title">${escapeHtml(siteStructure.hero.headline)}</h1>
                <p class="hero__body">${escapeHtml(siteStructure.hero.supportingText)}</p>
                <div class="hero__actions">
                  <a class="button button--primary" href="${escapeAttribute(siteStructure.hero.primaryAction.href)}">
                    ${escapeHtml(siteStructure.hero.primaryAction.label)}
                  </a>
                  <a class="button button--secondary" href="${escapeAttribute(siteStructure.hero.secondaryAction.href)}">
                    ${escapeHtml(siteStructure.hero.secondaryAction.label)}
                  </a>
                </div>
                <div class="hero__signals">
                  ${siteStructure.hero.signalItems
                    .map((item) => `<span class="signal-chip">${escapeHtml(item)}</span>`)
                    .join("")}
                </div>
              </div>

              <div class="hero-visual" aria-hidden="true" data-reveal>
                <div class="hero-visual__panel">
                  <div class="hero-visual__tile hero-visual__tile--wide"></div>
                  <div class="hero-visual__tile hero-visual__tile--tall"></div>
                  <div class="hero-visual__tile hero-visual__tile--warm"></div>
                  <div class="hero-visual__tile hero-visual__tile--violet"></div>
                  <div class="hero-visual__tile hero-visual__tile--deep"></div>
                  <svg class="hero-visual__lines" viewBox="0 0 600 720" preserveAspectRatio="none">
                    <path d="M40 168C40 118 84 84 136 84H224C278 84 320 122 320 172V232" />
                    <path d="M214 354C214 292 264 242 326 242H432C492 242 542 288 542 350V464" />
                    <path d="M84 462C84 384 146 322 224 322H276C354 322 416 384 416 462V610" />
                    <path d="M332 62C332 30 356 8 388 8H516C548 8 574 34 574 66V168" />
                  </svg>
                </div>
              </div>
            </div>
          </div>
        </section>

        <section id="projects" class="section-block">
          <div class="layout">
            <div class="section-heading" data-reveal>
              <p class="eyebrow">${escapeHtml(siteStructure.projectsIntro.eyebrow)}</p>
              <h2 class="section-title">${escapeHtml(siteStructure.projectsIntro.title)}</h2>
              <p class="section-copy">${escapeHtml(siteStructure.projectsIntro.body)}</p>
            </div>
            <div class="project-stack">
              ${featuredProjects.map((project, index) => renderProjectCard(project, index)).join("")}
            </div>
          </div>
        </section>

        <section id="approach" class="section-block">
          <div class="layout">
            <div class="split-grid">
              <article class="info-card info-card--large" data-reveal>
                <p class="eyebrow">${escapeHtml(siteStructure.approach.eyebrow)}</p>
                <h2 class="section-title">${escapeHtml(siteStructure.approach.title)}</h2>
                <p class="section-copy">${escapeHtml(siteStructure.approach.body)}</p>
              </article>
              <div class="principles-grid">
                ${siteStructure.approach.principles
                  .map(
                    (principle) => `
                      <article class="info-card" data-reveal>
                        <h3 class="info-card__title">${escapeHtml(principle.title)}</h3>
                        <p class="info-card__body">${escapeHtml(principle.body)}</p>
                      </article>
                    `,
                  )
                  .join("")}
              </div>
            </div>
          </div>
        </section>

        <section id="about" class="section-block">
          <div class="layout">
            <div class="two-column">
              <article class="info-card info-card--warm" data-reveal>
                <p class="eyebrow">${escapeHtml(siteStructure.about.eyebrow)}</p>
                <h2 class="section-title">${escapeHtml(siteStructure.about.title)}</h2>
                <p class="section-copy">${escapeHtml(siteStructure.about.body)}</p>
              </article>

              <article class="info-card info-card--tall" data-reveal>
                <p class="eyebrow">Signals</p>
                <ul class="signal-list">
                  <li>Frontend and product thinking</li>
                  <li>Full-stack implementation</li>
                  <li>Geospatial, AI, resilience, and IoT range</li>
                  <li>Interfaces designed to stay clear under complexity</li>
                </ul>
              </article>
            </div>
          </div>
        </section>

        <section class="section-block">
          <div class="layout">
            <div class="section-heading" data-reveal>
              <p class="eyebrow">Archive</p>
              <h2 class="section-title">More work, experiments, and incoming chapters.</h2>
            </div>
            <div class="archive-grid">
              ${archiveProjects.map((project) => renderArchiveCard(project)).join("")}
            </div>
          </div>
        </section>

        <section id="contact" class="section-block">
          <div class="layout">
            <article class="contact-panel" data-reveal>
              <div class="contact-panel__copy">
                <p class="eyebrow">${escapeHtml(siteStructure.contact.eyebrow)}</p>
                <h2 class="section-title">${escapeHtml(siteStructure.contact.title)}</h2>
                <p class="section-copy">${escapeHtml(siteStructure.contact.body)}</p>
              </div>
              <div class="contact-panel__items">
                ${siteStructure.contact.items
                  .map(
                    (item) => `
                      <div class="contact-item">
                        <span class="contact-item__label">${escapeHtml(item.label)}</span>
                        <strong class="contact-item__value">${escapeHtml(item.value)}</strong>
                      </div>
                    `,
                  )
                  .join("")}
              </div>
            </article>
          </div>
        </section>
      </main>

      <footer class="site-footer">
        <div class="layout site-footer__inner">
          <span>${escapeHtml(siteStructure.site.name)}</span>
          <span>${escapeHtml(siteStructure.footer.note)}</span>
        </div>
      </footer>
    </div>
  `;
}

function renderProjectCard(project: Project, index: number) {
  const accent = project.media.visualStyle.accent;
  const reversedClass = index % 2 === 1 ? " project-card--reverse" : "";

  return `
    <article class="project-card${reversedClass}" data-reveal style="--project-accent: ${escapeAttribute(accent)}">
      <div class="project-card__media">
        ${renderMediaPlaceholder(project)}
      </div>
      <div class="project-card__content">
        <div class="project-card__meta">
          <span>${escapeHtml(project.core.status)}</span>
          <span>${escapeHtml(project.core.dateLabel)}</span>
        </div>
        <h3 class="project-card__title">${escapeHtml(project.core.title)}</h3>
        <p class="project-card__tagline">${escapeHtml(project.core.tagline)}</p>
        <p class="project-card__summary">${escapeHtml(project.story.summary)}</p>
        <div class="project-card__story">
          <div>
            <span class="story-label">Problem</span>
            <p>${escapeHtml(project.story.problem)}</p>
          </div>
          <div>
            <span class="story-label">Solution</span>
            <p>${escapeHtml(project.story.solution)}</p>
          </div>
          <div>
            <span class="story-label">Outcome</span>
            <p>${escapeHtml(project.story.outcome)}</p>
          </div>
        </div>
        <div class="project-card__highlights">
          ${project.story.highlights.map((item) => `<div class="highlight-pill">${escapeHtml(item)}</div>`).join("")}
        </div>
        <div class="project-card__metrics">
          ${project.story.metrics
            .map(
              (metric) => `
                <div class="metric-card">
                  <span>${escapeHtml(metric.label)}</span>
                  <strong>${escapeHtml(metric.value)}</strong>
                </div>
              `,
            )
            .join("")}
        </div>
        <div class="project-card__footer">
          <div class="tag-row">
            ${project.core.stack.map((tool) => `<span class="tag">${escapeHtml(tool)}</span>`).join("")}
          </div>
          ${
            project.core.links.length > 0
              ? `<div class="link-row">${project.core.links
                  .map(
                    (link) =>
                      `<a class="text-link" href="${escapeAttribute(link.url)}" target="_blank" rel="noreferrer">${escapeHtml(link.label)}</a>`,
                  )
                  .join("")}</div>`
              : ""
          }
        </div>
      </div>
    </article>
  `;
}

function renderMediaPlaceholder(project: Project) {
  const cover = project.media.cover;
  const gallery = project.media.gallery.slice(0, 2);

  return `
    <div class="media-panel">
      <div class="media-cover media-cover--placeholder">
        <div class="media-cover__art"></div>
        <div class="media-cover__caption">
          <span>${escapeHtml(cover.title)}</span>
          <strong>${escapeHtml(project.media.visualStyle.tone)}</strong>
        </div>
      </div>
      <div class="media-gallery">
        ${gallery
          .map(
            (item) => `
              <div class="media-thumb media-thumb--placeholder">
                <span class="media-thumb__label">${escapeHtml(item.type)}</span>
                <strong>${escapeHtml(item.title)}</strong>
                <p>${escapeHtml(item.caption)}</p>
              </div>
            `,
          )
          .join("")}
      </div>
    </div>
  `;
}

function renderArchiveCard(project: Project) {
  return `
    <article class="archive-card" data-reveal style="--project-accent: ${escapeAttribute(project.media.visualStyle.accent)}">
      <div class="archive-card__top">
        <span>${escapeHtml(project.core.status)}</span>
        <span>${escapeHtml(project.core.dateLabel)}</span>
      </div>
      <h3 class="archive-card__title">${escapeHtml(project.core.title)}</h3>
      <p class="archive-card__copy">${escapeHtml(project.story.summary)}</p>
    </article>
  `;
}

function activateRevealAnimations() {
  const revealItems = Array.from(document.querySelectorAll<HTMLElement>("[data-reveal]"));

  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add("is-visible");
          observer.unobserve(entry.target);
        }
      });
    },
    {
      threshold: 0.16,
      rootMargin: "0px 0px -10% 0px",
    },
  );

  revealItems.forEach((item) => observer.observe(item));
}

function escapeHtml(value: string) {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}

function escapeAttribute(value: string) {
  return escapeHtml(value);
}
