import React, { useState } from 'react';
import './BikeExperiment.css';
import BikeCharacter from '../../components/BikeCharacter';

const BikeExperiment: React.FC = () => {
  const [speed, setSpeed] = useState<number>(3); // 0 (paused) to 5 (fast)
  const [bikeColor, setBikeColor] = useState<string>('#e63946');
  const [wheelColor, setWheelColor] = useState<string>('#1d3557');
  const [theme, setTheme] = useState<'neon' | 'retro' | 'cyber'>('neon');
  const [showLabels, setShowLabels] = useState<boolean>(true); // Enabled by default for user communication
  const [showRider, setShowRider] = useState<boolean>(true); // Show character on top of the bike

  // Map speed slider value to animation duration in seconds
  const getRotationDuration = () => {
    if (speed === 0) return '0s';
    return `${6 - speed}s`; // Faster speed = shorter animation duration
  };

  const handleBackToHome = () => {
    window.location.href = '/';
  };

  return (
    <div className={`bike-experiment-wrapper theme-${theme}`}>
      <div className="experiment-header">
        <button className="back-btn" onClick={handleBackToHome}>
          &larr; Back to Portfolio
        </button>
        <h1>CSS Bicycle Experiment</h1>
        <p>A stylized road bicycle drawn entirely using pure CSS shapes and animations.</p>
      </div>

      <div className="experiment-container">
        {/* The Canvas */}
        <div className="bike-canvas">
          <div className="scrolling-background">
            <div className="grid-lines"></div>
            <div className="mountains"></div>
            <div className="road"></div>
          </div>

          <BikeCharacter
            theme={theme}
            bikeColor={bikeColor}
            wheelColor={wheelColor}
            showRider={showRider}
            rotationSpeed={getRotationDuration()}
            playState={speed === 0 ? 'paused' : 'running'}
            showLabels={showLabels}
          />
        </div>

        {/* The Controls Panel */}
        <div className="control-panel">
          <h3>Experiment Controls</h3>
          
          <div className="control-group">
            <label>Pedaling Speed: {speed === 0 ? 'Paused' : `${speed}x`}</label>
            <input 
              type="range" 
              min="0" 
              max="5" 
              value={speed} 
              onChange={(e) => setSpeed(Number(e.target.value))} 
            />
          </div>

          <div className="control-group">
            <label>Frame Color:</label>
            <div className="color-presets">
              {['#e63946', '#457b9d', '#ffb703', '#2a9d8f', '#a8dadc'].map((color) => (
                <button 
                  key={color} 
                  className={`color-preset ${bikeColor === color ? 'active' : ''}`}
                  style={{ backgroundColor: color }}
                  onClick={() => setBikeColor(color)}
                />
              ))}
              <input 
                type="color" 
                value={bikeColor} 
                onChange={(e) => setBikeColor(e.target.value)} 
              />
            </div>
          </div>

          <div className="control-group">
            <label>Wheel Accent Color:</label>
            <div className="color-presets">
              {['#1d3557', '#3d3d3d', '#f1faee', '#e63946', '#8d99ae'].map((color) => (
                <button 
                  key={color} 
                  className={`color-preset ${wheelColor === color ? 'active' : ''}`}
                  style={{ backgroundColor: color }}
                  onClick={() => setWheelColor(color)}
                />
              ))}
              <input 
                type="color" 
                value={wheelColor} 
                onChange={(e) => setWheelColor(e.target.value)} 
              />
            </div>
          </div>

          <div className="control-group">
            <label>Theme Style:</label>
            <div className="theme-toggle">
              {(['neon', 'retro', 'cyber'] as const).map((t) => (
                <button 
                  key={t} 
                  className={`theme-btn ${theme === t ? 'active' : ''}`}
                  onClick={() => setTheme(t)}
                >
                  {t.toUpperCase()}
                </button>
              ))}
            </div>
          </div>

          <div className="control-group label-toggle-group">
            <label className="checkbox-label" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer' }}>
              <input 
                type="checkbox" 
                checked={showLabels} 
                onChange={(e) => setShowLabels(e.target.checked)} 
                style={{ cursor: 'pointer' }}
              />
              Show CSS Class Labels
            </label>
          </div>

          <div className="control-group rider-toggle-group">
            <label className="checkbox-label" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer' }}>
              <input 
                type="checkbox" 
                checked={showRider} 
                onChange={(e) => setShowRider(e.target.checked)} 
                style={{ cursor: 'pointer' }}
              />
              Show Rider Character
            </label>
          </div>

          <div className="css-fun-facts">
            <h4>How it works:</h4>
            <ul>
              <li><strong>Frames & Forks</strong>: Drawn using `div` bars rotated with `transform: rotate(deg)`.</li>
              <li><strong>Spokes</strong>: Rendered using a `repeating-conic-gradient` background.</li>
              <li><strong>Crank & Pedals</strong>: Animated with rotating transforms while keeping the pedals horizontal using counter-rotation.</li>
              <li><strong>Parallax BG</strong>: Uses infinite keyframe translations.</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
};

export default BikeExperiment;
