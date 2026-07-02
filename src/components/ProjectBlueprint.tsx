import React from 'react';

interface ProjectBlueprintProps {
  projectId: string;
}

export const ProjectBlueprint: React.FC<ProjectBlueprintProps> = ({ projectId }) => {
  switch (projectId) {
    case 'atlas':
      return (
        <svg viewBox="0 0 400 160" fill="none" stroke="currentColor">
          <circle cx="200" cy="80" r="60" strokeDasharray="4 4" opacity="0.2" />
          <circle cx="200" cy="80" r="40" opacity="0.35" />
          <circle cx="200" cy="80" r="20" opacity="0.55" />
          <line x1="200" y1="10" x2="200" y2="150" strokeDasharray="3 3" opacity="0.15" />
          <line x1="100" y1="80" x2="300" y2="80" strokeDasharray="3 3" opacity="0.15" />
          <path d="M 120,90 Q 160,50 200,90 T 280,90" strokeWidth="1.5" opacity="0.75" />
          <path d="M 130,105 Q 165,70 200,105 T 270,105" strokeWidth="1" opacity="0.45" strokeDasharray="2 2" />
          <path d="M200,60 L205,70 L195,70 Z" fill="#e06050" stroke="none" />
          <text x="285" y="30" fontSize="8" fontFamily="monospace" opacity="0.55" fill="currentColor" stroke="none">[LAT: 45.0703]</text>
          <text x="285" y="42" fontSize="8" fontFamily="monospace" opacity="0.55" fill="currentColor" stroke="none">[LNG: 7.6869]</text>
        </svg>
      );
    case 'kartino':
      return (
        <svg viewBox="0 0 400 160" fill="none" stroke="currentColor">
          <rect x="75" y="35" width="105" height="65" rx="6" strokeWidth="1.5" opacity="0.7" />
          <rect x="220" y="60" width="105" height="65" rx="6" strokeWidth="1.5" opacity="0.4" strokeDasharray="3 3" />
          <line x1="90" y1="52" x2="145" y2="52" strokeWidth="2" opacity="0.5" />
          <line x1="90" y1="67" x2="160" y2="67" opacity="0.35" />
          <line x1="90" y1="77" x2="120" y2="77" opacity="0.35" />
          <line x1="235" y1="77" x2="285" y2="77" strokeWidth="2" opacity="0.35" />
          <line x1="235" y1="92" x2="295" y2="92" opacity="0.25" />
          <path d="M 190,67 Q 205,67 205,80" strokeWidth="1.5" strokeDasharray="3 3" opacity="0.6" />
          <polygon points="205,80 202,75 208,75" fill="currentColor" stroke="none" />
          <circle cx="205" cy="95" r="3.5" fill="currentColor" opacity="0.7" />
          <text x="330" y="35" fontSize="8" fontFamily="monospace" opacity="0.6" fill="currentColor" stroke="none">[CEFR]</text>
          <text x="330" y="48" fontSize="12" fontWeight="bold" fontFamily="monospace" fill="#e8b84a" stroke="none">[B2]</text>
        </svg>
      );
    case 'recore':
      return (
        <svg viewBox="0 0 400 160" fill="none" stroke="currentColor">
          <rect x="70" y="30" width="65" height="38" rx="4" opacity="0.4" />
          <rect x="150" y="30" width="65" height="38" rx="4" opacity="0.7" strokeWidth="1.5" />
          <rect x="230" y="30" width="65" height="38" rx="4" opacity="0.4" />
          <rect x="70" y="80" width="65" height="38" rx="4" opacity="0.4" />
          <rect x="150" y="80" width="65" height="38" rx="4" opacity="0.4" />
          <rect x="230" y="80" width="65" height="38" rx="4" opacity="0.7" strokeWidth="1.5" />
          <path d="M 102,49 L 102,64 L 182,64 L 182,80" strokeDasharray="3 3" opacity="0.5" />
          <circle cx="182" cy="49" r="3" fill="currentColor" opacity="0.7" />
          <path d="M 330,60 C 330,55 350,55 350,60 L 350,90 C 350,95 330,95 330,90 Z" opacity="0.5" />
          <path d="M 330,60 C 330,65 350,65 350,60" opacity="0.5" />
          <path d="M 330,70 C 330,75 350,75 350,70" opacity="0.5" />
          <path d="M 330,80 C 330,85 350,85 350,80" opacity="0.5" />
          <text x="310" y="125" fontSize="8" fontFamily="monospace" opacity="0.5" fill="currentColor" stroke="none">[RECORE.DB]</text>
        </svg>
      );
    case 'replication-toolbox':
      return (
        <svg viewBox="0 0 400 160" fill="none" stroke="currentColor">
          <rect x="60" y="25" width="120" height="95" rx="6" opacity="0.6" />
          <rect x="200" y="25" width="120" height="95" rx="6" opacity="0.6" />
          <line x1="75" y1="40" x2="120" y2="40" strokeWidth="2" opacity="0.45" />
          <line x1="75" y1="52" x2="150" y2="52" opacity="0.35" />
          <line x1="90" y1="64" x2="140" y2="64" opacity="0.35" />
          <line x1="75" y1="76" x2="110" y2="76" opacity="0.35" />
          <line x1="215" y1="40" x2="260" y2="40" strokeWidth="2" opacity="0.45" />
          <line x1="215" y1="52" x2="290" y2="52" opacity="0.35" />
          <line x1="230" y1="64" x2="280" y2="64" opacity="0.35" />
          <line x1="215" y1="76" x2="250" y2="76" opacity="0.35" />
          <circle cx="345" cy="40" r="10" fill="#5aac6e" opacity="0.15" stroke="none" />
          <path d="M 340,40 L 343,43 L 350,36" stroke="#5aac6e" strokeWidth="2" opacity="0.8" />
          <text x="305" y="125" fontSize="8" fontFamily="monospace" opacity="0.5" fill="currentColor" stroke="none">[DIFF_OK: 100%]</text>
        </svg>
      );
    case 'smart-plant-care':
      return (
        <svg viewBox="0 0 400 160" fill="none" stroke="currentColor">
          <rect x="60" y="30" width="80" height="85" rx="8" opacity="0.6" />
          <circle cx="100" cy="50" r="8" opacity="0.4" />
          <line x1="100" y1="58" x2="100" y2="95" strokeWidth="1.5" opacity="0.5" />
          <path d="M 100,75 L 140,75 L 155,90 L 190,90" strokeDasharray="3 3" opacity="0.5" />
          <path d="M 230,115 Q 230,60 255,35" strokeWidth="2" opacity="0.75" />
          <path d="M 243,80 Q 220,70 215,65" opacity="0.5" />
          <path d="M 245,65 Q 270,55 275,50" opacity="0.5" />
          <path d="M 195,85 C 195,80 200,80 200,85 C 200,90 195,90 195,85" fill="#e06050" stroke="none" opacity="0.8" />
          <text x="305" y="125" fontSize="8" fontFamily="monospace" opacity="0.5" fill="currentColor" stroke="none">[MOISTURE: 72%]</text>
        </svg>
      );
    default:
      return (
        <svg viewBox="0 0 400 160" fill="none" stroke="currentColor">
          <line x1="20" y1="20" x2="380" y2="140" opacity="0.3" strokeDasharray="4 4" />
          <line x1="20" y1="140" x2="380" y2="20" opacity="0.3" strokeDasharray="4 4" />
          <text x="160" y="85" fontSize="12" fontFamily="monospace" opacity="0.6" fill="currentColor" stroke="none">[PROJECT WORK]</text>
        </svg>
      );
  }
};
