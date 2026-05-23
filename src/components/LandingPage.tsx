import React from 'react';
import siteStructure from '../content/site-structure.json';

interface LandingPageProps {
  onStartJourney: () => void;
}

const LandingPage: React.FC<LandingPageProps> = ({ onStartJourney }) => {
  return (
    <header className="site-header min-h-screen flex flex-col justify-center items-center text-center p-8">
      <div className="site-header__inner max-w-2xl">
        <h1 className="text-6xl font-bold mb-4">{siteStructure.site.name}</h1>
        <p className="text-xl text-textSoft mb-8">
          {siteStructure.hero.supportingText}
        </p>
        <div className="flex gap-4 justify-center">
          <button 
            onClick={onStartJourney}
            className="button button--primary px-8 py-3 rounded-full font-medium"
          >
            Start the Journey
          </button>
          <a href="#contact" className="button button--secondary px-8 py-3 rounded-full font-medium">
            Contact
          </a>
        </div>
      </div>
    </header>
  );
};

export default LandingPage;
