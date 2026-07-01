import React from 'react';
import JungleJourney from './components/JungleJourney';
import ProjectDetail from './components/ProjectDetail';
import BikeExperiment from './experiments/bike/BikeExperiment';
import projectsData from './content/projects.json';

const App: React.FC = () => {
  const base = import.meta.env.BASE_URL;
  // Strip base path (e.g. '/portfolio/') and ensure it starts with '/'
  const path = window.location.pathname.replace(new RegExp(`^${base.replace(/\/$/, '')}`), '') || '/';

  if (path === '/experiments/bike' || path === '/bike') {
    return <BikeExperiment />;
  }

  const projectMatch = path.match(/^\/projects\/([^/]+)\/?$/);
  const project = projectMatch
    ? projectsData.find((projectItem) => projectItem.slug === projectMatch[1])
    : undefined;

  if (project) {
    return <ProjectDetail project={project} />;
  }

  return <JungleJourney />;
};

export default App;
