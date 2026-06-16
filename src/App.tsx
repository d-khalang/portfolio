import React from 'react';
import JungleJourney from './components/JungleJourney';
import ProjectDetail from './components/ProjectDetail';
import projectsData from './content/projects.json';

const App: React.FC = () => {
  const projectMatch = window.location.pathname.match(/^\/projects\/([^/]+)\/?$/);
  const project = projectMatch
    ? projectsData.find((projectItem) => projectItem.slug === projectMatch[1])
    : undefined;

  if (project) {
    return <ProjectDetail project={project} />;
  }

  return <JungleJourney />;
};

export default App;
