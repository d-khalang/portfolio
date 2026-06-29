import React, { useState } from 'react';
import './BikeExperiment.css';

const BikeExperiment: React.FC = () => {
  const [speed, setSpeed] = useState<number>(3); // 0 (paused) to 5 (fast)
  const [bikeColor, setBikeColor] = useState<string>('#e63946');
  const [wheelColor, setWheelColor] = useState<string>('#1d3557');
  const [theme, setTheme] = useState<'neon' | 'retro' | 'cyber'>('neon');

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

          <div 
            className="bike" 
            style={{ 
              ['--bike-color' as any]: bikeColor,
              ['--wheel-color' as any]: wheelColor,
              ['--rotation-speed' as any]: getRotationDuration(),
              ['--play-state' as any]: speed === 0 ? 'paused' : 'running'
            }}
          >
            {/* Rear Wheel */}
            <div className="wheel rear-wheel">
              <div className="tire"></div>
              <div className="rim"></div>
              <div className="spokes"></div>
              <div className="hub"></div>
              <div className="cassette"></div>
            </div>

            {/* Front Wheel */}
            <div className="wheel front-wheel">
              <div className="tire"></div>
              <div className="rim"></div>
              <div className="spokes"></div>
              <div className="hub"></div>
            </div>

            {/* Bike Frame Tubes */}
            <div className="frame">
              <div className="tube chain-stay"></div>
              <div className="tube seat-stay"></div>
              <div className="tube seat-tube"></div>
              <div className="tube down-tube"></div>
              <div className="tube top-tube"></div>
              
              {/* Bottom Bracket (Crank center) */}
              <div className="bottom-bracket"></div>
            </div>

            {/* Fork & Steerer */}
            <div className="fork-assembly">
              <div className="fork"></div>
              <div className="head-tube"></div>
              <div className="stem"></div>
              <div className="handlebars">
                <div className="bar-drop"></div>
              </div>
            </div>

            {/* Drivetrain (Crankset, pedals, chain) */}
            <div className="drivetrain">
              <div className="chainring"></div>
              <div className="chain-upper"></div>
              <div className="chain-lower"></div>
              
              {/* Crank Arm & Pedal 1 */}
              <div className="crank-assembly crank-left">
                <div className="crank-arm"></div>
                <div className="pedal"></div>
              </div>
              
              {/* Crank Arm & Pedal 2 */}
              <div className="crank-assembly crank-right">
                <div className="crank-arm"></div>
                <div className="pedal"></div>
              </div>
            </div>

            {/* Saddle / Seat Assembly */}
            <div className="seat-assembly">
              <div className="seatpost"></div>
              <div className="saddle"></div>
            </div>
          </div>
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
