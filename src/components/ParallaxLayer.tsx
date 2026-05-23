import React from 'react';

interface ParallaxLayerProps {
  depth: number;
  zIndex: number;
  className?: string;
  color?: string;
}

const ParallaxLayer: React.FC<ParallaxLayerProps> = ({ depth, zIndex, className = "", color }) => {
  return (
    <div 
      className={`absolute inset-0 h-full w-[10000px] parallax-layer ${className}`}
      data-depth={depth}
      style={{ 
        zIndex, 
        backgroundColor: color,
        transform: `translate3d(0, 0, 0)`,
        pointerEvents: 'none'
      }}
    />
  );
};

export default ParallaxLayer;
