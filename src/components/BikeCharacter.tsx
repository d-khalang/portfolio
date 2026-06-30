import React from 'react';
import './BikeCharacter.css';

// Import images
import riderFullUp from '../experiments/bike/images/right-up-full.webp';
import riderLegUp from '../experiments/bike/images/right-up-right-leg.webp';
import riderFull5 from '../experiments/bike/images/right-5-full.webp';
import riderLeg5 from '../experiments/bike/images/right-5-right-leg.webp';
import riderFullDown from '../experiments/bike/images/right-down-full.webp';
import riderLegDown from '../experiments/bike/images/right-down-right-leg.webp';
import riderFull8 from '../experiments/bike/images/right-8-full.webp';
import riderLeg8 from '../experiments/bike/images/right-8-right-leg.webp';

interface BikeCharacterProps {
  rotationAngle?: number; // Optional rotation angle in degrees. If not provided, runs infinite CSS animation.
  theme?: 'neon' | 'retro' | 'cyber';
  bikeColor?: string;
  wheelColor?: string;
  showRider?: boolean;
}

const BikeCharacter: React.FC<BikeCharacterProps> = ({
  rotationAngle,
  theme = 'neon',
  bikeColor = '#e63946',
  wheelColor = '#1d3557',
  showRider = true,
}) => {
  // Determine which frame is active if rotationAngle is provided
  let activeFrame: 'up' | '5' | 'down' | '8' = 'down';
  const isScrollDriven = rotationAngle !== undefined;

  if (isScrollDriven) {
    const angleNormalized = ((rotationAngle % 360) + 360) % 360;
    if (angleNormalized >= 0 && angleNormalized < 75) {
      activeFrame = '5';
    } else if (angleNormalized >= 75 && angleNormalized < 105) {
      activeFrame = 'down';
    } else if (angleNormalized >= 105 && angleNormalized < 210) {
      activeFrame = '8';
    } else {
      activeFrame = 'up';
    }
  }

  // Create inline styles for rotation
  const getRotationStyle = (offsetDeg: number = 0, speedFactor: number = 1) => {
    if (isScrollDriven) {
      return { transform: `rotate(${(rotationAngle * speedFactor) + offsetDeg}deg)` };
    }
    return undefined;
  };

  const getCounterRotationStyle = (offsetDeg: number = 0, speedFactor: number = 1) => {
    if (isScrollDriven) {
      return { transform: `rotate(${-(rotationAngle * speedFactor) - offsetDeg}deg)` };
    }
    return undefined;
  };

  const getChainringStyle = () => {
    if (isScrollDriven) {
      return { transform: `translate(-50%, 50%) rotate(${rotationAngle}deg)` };
    }
    return undefined;
  };

  const getCassetteStyle = () => {
    if (isScrollDriven) {
      return { transform: `translate(-50%, -50%) rotate(${rotationAngle}deg)` };
    }
    return undefined;
  };

  // Visibility classes for scroll-driven mode
  const getFrameClass = (frameName: 'up' | '5' | 'down' | '8') => {
    if (!isScrollDriven) return '';
    return activeFrame === frameName ? 'force-visible' : 'force-hidden';
  };

  return (
    <div 
      className={`bike-container theme-${theme} ${isScrollDriven ? 'scroll-driven' : 'auto-animate'}`}
      style={{
        '--bike-color': bikeColor,
        '--wheel-color': wheelColor,
        width: '100%',
        height: '100%',
      } as React.CSSProperties}
    >
      <svg 
        viewBox="0 0 500 380" 
        width="100%" 
        height="100%" 
        style={{ display: 'block', overflow: 'visible' }}
      >
        <foreignObject width="500" height="380" x="0" y="0" style={{ overflow: 'visible' }}>
          <div className="bike" style={{ position: 'absolute', width: '500px', height: '380px', left: 0, top: 0 }}>
            {/* Rear Wheel */}
            <div className="wheel rear-wheel" data-label="rear-wheel">
              <div className="tire"></div>
              <div className="rim" style={getRotationStyle()}></div>
              <div className="spokes" style={getRotationStyle()}></div>
              <div className="hub"></div>
              <div className="cassette" style={getCassetteStyle()}></div>
            </div>

            {/* Front Wheel */}
            <div className="wheel front-wheel" data-label="front-wheel">
              <div className="tire"></div>
              <div className="rim" style={getRotationStyle()}></div>
              <div className="spokes" style={getRotationStyle()}></div>
              <div className="hub"></div>
            </div>

            {/* Rider Back Leg (Layered behind frame stays and drivetrain) */}
            {showRider && (
              <>
                <img 
                  src={riderLegUp} 
                  className={`rider-back-leg rider-back-leg-up ${getFrameClass('up')}`} 
                  data-label="rider-back-leg" 
                  alt="Rider Back Leg Up"
                />
                <img 
                  src={riderLeg5} 
                  className={`rider-back-leg rider-back-leg-5 ${getFrameClass('5')}`} 
                  data-label="rider-back-leg" 
                  alt="Rider Back Leg 5"
                />
                <img 
                  src={riderLegDown} 
                  className={`rider-back-leg rider-back-leg-down ${getFrameClass('down')}`} 
                  data-label="rider-back-leg" 
                  alt="Rider Back Leg Down"
                />
                <img 
                  src={riderLeg8} 
                  className={`rider-back-leg rider-back-leg-8 ${getFrameClass('8')}`} 
                  data-label="rider-back-leg" 
                  alt="Rider Back Leg 8"
                />
              </>
            )}

            {/* Bike Frame Tubes */}
            <div className="frame">
              <div className="tube chain-stay" data-label="chain-stay"></div>
              <div className="tube seat-stay" data-label="seat-stay"></div>
              <div className="tube seat-tube" data-label="seat-tube"></div>
              <div className="tube down-tube" data-label="down-tube"></div>
              <div className="tube top-tube" data-label="top-tube"></div>
              
              {/* Bottom Bracket (Crank center) */}
              <div className="bottom-bracket" data-label="bottom-bracket"></div>
            </div>

            {/* Fork & Steerer */}
            <div className="fork-assembly">
              <div className="fork" data-label="fork"></div>
              <div className="head-tube" data-label="head-tube"></div>
              <div className="stem" data-label="stem"></div>
              <div className="handlebars" data-label="handlebars">
                <div className="bar-drop"></div>
              </div>
            </div>

            {/* Drivetrain (Crankset, chain, pedals) */}
            <div className="drivetrain">
              <div className="chainring" data-label="chainring" style={getChainringStyle()}></div>
              <div className="chain-upper" data-label="chain-upper"></div>
              <div className="chain-lower" data-label="chain-lower"></div>

              {/* Crank Arm & Pedal 1 */}
              <div className="crank-assembly crank-left" style={getRotationStyle(260)}>
                <div className="crank-arm" data-label="crank-arm"></div>
                <div className="pedal" data-label="pedal" style={getCounterRotationStyle(260)}></div>
              </div>
              
              {/* Crank Arm & Pedal 2 */}
              <div className="crank-assembly crank-right" style={getRotationStyle(80)}>
                <div className="crank-arm" data-label="crank-arm"></div>
                <div className="pedal" data-label="pedal" style={getCounterRotationStyle(80)}></div>
              </div>
            </div>

            {/* Saddle / Seat Assembly */}
            <div className="seat-assembly">
              <div className="seatpost" data-label="seatpost"></div>
              <div className="saddle" data-label="saddle"></div>
            </div>

            {/* Rider Front (Full torso + front leg) */}
            {showRider && (
              <>
                <img 
                  src={riderFullUp} 
                  className={`rider-front rider-front-up ${getFrameClass('up')}`} 
                  data-label="rider-character" 
                  alt="Rider Up"
                />
                <img 
                  src={riderFull5} 
                  className={`rider-front rider-front-5 ${getFrameClass('5')}`} 
                  data-label="rider-character" 
                  alt="Rider 5"
                />
                <img 
                  src={riderFullDown} 
                  className={`rider-front rider-front-down ${getFrameClass('down')}`} 
                  data-label="rider-character" 
                  alt="Rider Down"
                />
                <img 
                  src={riderFull8} 
                  className={`rider-front rider-front-8 ${getFrameClass('8')}`} 
                  data-label="rider-character" 
                  alt="Rider 8"
                />
              </>
            )}
          </div>
        </foreignObject>
      </svg>
    </div>
  );
};

export default BikeCharacter;
