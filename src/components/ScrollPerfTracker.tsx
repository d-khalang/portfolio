import { useEffect, useRef, useState } from 'react';

// Declare global performance tracking object type
declare global {
  interface Window {
    __scrollPerf: {
      journeyRenders: number;
      bikeRenders: number;
      scrollUpdates: number;
      lastProjectStatesTime: number;
      lastBikeUpdateTime: number;
      maxProjectStatesTime: number;
      maxBikeUpdateTime: number;
      currentProgress: number;
      currentPhase: string;
      frameDrops: Array<{ phase: string; fps: number; time: number }>;
    };
  }
}

// Initialize the global telemetry container if it doesn't exist
if (typeof window !== 'undefined') {
  window.__scrollPerf = window.__scrollPerf || {
    journeyRenders: 0,
    bikeRenders: 0,
    scrollUpdates: 0,
    lastProjectStatesTime: 0,
    lastBikeUpdateTime: 0,
    maxProjectStatesTime: 0,
    maxBikeUpdateTime: 0,
    currentProgress: 0,
    currentPhase: 'Initializing',
    frameDrops: []
  };
}

export default function ScrollPerfTracker() {
  const [isVisible, setIsVisible] = useState(true);
  const panelRef = useRef<HTMLDivElement>(null);
  
  // Element refs for imperative direct DOM writes (avoids React rendering of the tracker itself)
  const fpsValRef = useRef<HTMLSpanElement>(null);
  const jRendersValRef = useRef<HTMLSpanElement>(null);
  const bRendersValRef = useRef<HTMLSpanElement>(null);
  const scrollUpdatesValRef = useRef<HTMLSpanElement>(null);
  const projTimeValRef = useRef<HTMLSpanElement>(null);
  const bikeTimeValRef = useRef<HTMLSpanElement>(null);
  const maxProjTimeValRef = useRef<HTMLSpanElement>(null);
  const maxBikeTimeValRef = useRef<HTMLSpanElement>(null);
  const progressValRef = useRef<HTMLSpanElement>(null);
  const phaseValRef = useRef<HTMLSpanElement>(null);
  const logContainerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!isVisible) return;

    let lastTime = performance.now();
    let frameCount = 0;
    let fps = 60;
    let rAFId: number;

    const updateMetrics = () => {
      const now = performance.now();
      frameCount++;

      // Calculate FPS every 500ms
      if (now >= lastTime + 500) {
        fps = Math.round((frameCount * 1000) / (now - lastTime));
        frameCount = 0;
        lastTime = now;

        // Visual indicator color based on FPS
        if (fpsValRef.current) {
          fpsValRef.current.textContent = `${fps} FPS`;
          if (fps >= 55) {
            fpsValRef.current.style.color = '#10b981'; // Green
          } else if (fps >= 35) {
            fpsValRef.current.style.color = '#f59e0b'; // Yellow
          } else {
            fpsValRef.current.style.color = '#ef4444'; // Red
            
            // Log frame drop
            const telemetry = window.__scrollPerf;
            const drop = {
              phase: telemetry.currentPhase,
              fps,
              time: Math.round(now)
            };
            telemetry.frameDrops.push(drop);

            // Append to log container
            if (logContainerRef.current) {
              const logEl = document.createElement('div');
              logEl.style.color = '#ef4444';
              logEl.style.fontSize = '10px';
              logEl.style.borderLeft = '2px solid #ef4444';
              logEl.style.paddingLeft = '4px';
              logEl.style.marginTop = '2px';
              logEl.textContent = `[${fps} FPS Drop] at ${telemetry.currentPhase} (${Math.round(telemetry.currentProgress * 100)}%)`;
              logContainerRef.current.appendChild(logEl);
              
              // Keep only last 4 logs
              while (logContainerRef.current.childNodes.length > 4) {
                logContainerRef.current.removeChild(logContainerRef.current.firstChild!);
              }
            }
          }
        }
      }

      // Read from global telemetry object and update DOM directly
      const telemetry = window.__scrollPerf;
      
      if (jRendersValRef.current) jRendersValRef.current.textContent = String(telemetry.journeyRenders);
      if (bRendersValRef.current) bRendersValRef.current.textContent = String(telemetry.bikeRenders);
      if (scrollUpdatesValRef.current) scrollUpdatesValRef.current.textContent = String(telemetry.scrollUpdates);
      
      if (projTimeValRef.current) projTimeValRef.current.textContent = `${telemetry.lastProjectStatesTime.toFixed(2)}ms`;
      if (bikeTimeValRef.current) bikeTimeValRef.current.textContent = `${telemetry.lastBikeUpdateTime.toFixed(2)}ms`;
      
      if (maxProjTimeValRef.current) maxProjTimeValRef.current.textContent = `${telemetry.maxProjectStatesTime.toFixed(2)}ms`;
      if (maxBikeTimeValRef.current) maxBikeTimeValRef.current.textContent = `${telemetry.maxBikeUpdateTime.toFixed(2)}ms`;
      
      if (progressValRef.current) progressValRef.current.textContent = `${Math.round(telemetry.currentProgress * 100)}%`;
      if (phaseValRef.current) {
        phaseValRef.current.textContent = telemetry.currentPhase;
        // Color code phases for high visibility
        if (telemetry.currentPhase.includes('Landing')) {
          phaseValRef.current.style.color = '#a855f7'; // Purple
        } else if (telemetry.currentPhase.includes('Journey')) {
          phaseValRef.current.style.color = '#3b82f6'; // Blue
        } else if (telemetry.currentPhase.includes('Transition')) {
          phaseValRef.current.style.color = '#f97316'; // Orange
        } else {
          phaseValRef.current.style.color = '#10b981'; // Green
        }
      }

      rAFId = requestAnimationFrame(updateMetrics);
    };

    rAFId = requestAnimationFrame(updateMetrics);
    return () => cancelAnimationFrame(rAFId);
  }, [isVisible]);

  const handleResetMax = () => {
    if (typeof window !== 'undefined' && window.__scrollPerf) {
      window.__scrollPerf.maxProjectStatesTime = 0;
      window.__scrollPerf.maxBikeUpdateTime = 0;
      window.__scrollPerf.frameDrops = [];
      if (logContainerRef.current) {
        logContainerRef.current.innerHTML = '';
      }
    }
  };

  const handleCopyJSON = () => {
    if (typeof window !== 'undefined' && window.__scrollPerf) {
      const data = JSON.stringify(window.__scrollPerf, null, 2);
      navigator.clipboard.writeText(data).then(() => {
        alert('Telemetry copied to clipboard as JSON!');
      }).catch(err => {
        console.error('Failed to copy telemetry:', err);
        console.log(data);
      });
    }
  };

  const handleDumpConsole = () => {
    if (typeof window !== 'undefined' && window.__scrollPerf) {
      console.log('--- SCROLL TELEMETRY DATA ---');
      console.log(window.__scrollPerf);
      alert('Telemetry logged to browser console (F12)!');
    }
  };

  return (
    <>
      {/* Toggle button */}
      <button
        onClick={() => setIsVisible(!isVisible)}
        style={{
          position: 'fixed',
          top: '20px',
          right: '20px',
          zIndex: 10000,
          background: '#0f172a',
          color: '#38bdf8',
          border: '1px solid #38bdf8',
          borderRadius: '4px',
          padding: '6px 10px',
          fontSize: '11px',
          fontFamily: 'monospace',
          cursor: 'pointer',
          boxShadow: '0 4px 12px rgba(0,0,0,0.5)',
          opacity: 0.85,
          transition: 'opacity 0.2s',
        }}
        onMouseEnter={(e) => { e.currentTarget.style.opacity = '1'; }}
        onMouseLeave={(e) => { e.currentTarget.style.opacity = '0.85'; }}
      >
        {isVisible ? 'HIDE TELEMETRY' : 'SHOW TELEMETRY'}
      </button>

      {isVisible && (
        <div
          ref={panelRef}
          style={{
            position: 'fixed',
            top: '60px',
            right: '20px',
            width: '280px',
            zIndex: 9999,
            backgroundColor: 'rgba(15, 23, 42, 0.95)',
            border: '1px solid #1e293b',
            borderRadius: '8px',
            padding: '14px',
            color: '#f8fafc',
            fontFamily: 'monospace',
            fontSize: '11px',
            boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.5)',
            pointerEvents: 'auto',
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid #334155', paddingBottom: '6px', marginBottom: '8px' }}>
            <span style={{ fontWeight: 'bold', color: '#38bdf8' }}>SCROLL TELEMETRY HUD</span>
            <span ref={fpsValRef} style={{ fontWeight: 'bold' }}>-- FPS</span>
          </div>

          <div style={{ display: 'flex', gap: '5px', marginBottom: '8px' }}>
            <button
              onClick={handleCopyJSON}
              style={{
                flex: 1,
                background: '#1e293b',
                border: '1px solid #475569',
                color: '#38bdf8',
                fontSize: '9px',
                padding: '4px',
                borderRadius: '3px',
                cursor: 'pointer'
              }}
            >
              COPY JSON
            </button>
            <button
              onClick={handleDumpConsole}
              style={{
                flex: 1,
                background: '#1e293b',
                border: '1px solid #475569',
                color: '#38bdf8',
                fontSize: '9px',
                padding: '4px',
                borderRadius: '3px',
                cursor: 'pointer'
              }}
            >
              DUMP CONSOLE
            </button>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '5px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span style={{ color: '#94a3b8' }}>Phase:</span>
              <span ref={phaseValRef} style={{ fontWeight: 'bold' }}>--</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span style={{ color: '#94a3b8' }}>Scroll Progress:</span>
              <span ref={progressValRef}>--</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span style={{ color: '#94a3b8' }}>Scroll trigger ticks:</span>
              <span ref={scrollUpdatesValRef}>0</span>
            </div>

            <div style={{ height: '1px', backgroundColor: '#334155', margin: '6px 0' }} />

            <div style={{ fontWeight: 'bold', color: '#f43f5e', marginBottom: '2px' }}>React Render Counters:</div>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span style={{ color: '#94a3b8' }}>JungleJourney:</span>
              <span ref={jRendersValRef} style={{ color: '#f43f5e' }}>0</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span style={{ color: '#94a3b8' }}>BikeCharacter:</span>
              <span ref={bRendersValRef} style={{ color: '#f43f5e' }}>0</span>
            </div>

            <div style={{ height: '1px', backgroundColor: '#334155', margin: '6px 0' }} />

            <div style={{ fontWeight: 'bold', color: '#10b981', marginBottom: '2px' }}>Execution Time (Live / Max):</div>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span style={{ color: '#94a3b8' }}>Card states calculation:</span>
              <span>
                <span ref={projTimeValRef}>0.00ms</span> / <span ref={maxProjTimeValRef} style={{ color: '#ef4444' }}>0.00ms</span>
              </span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span style={{ color: '#94a3b8' }}>Bike DOM updates:</span>
              <span>
                <span ref={bikeTimeValRef}>0.00ms</span> / <span ref={maxBikeTimeValRef} style={{ color: '#ef4444' }}>0.00ms</span>
              </span>
            </div>

            <div style={{ height: '1px', backgroundColor: '#334155', margin: '6px 0' }} />

            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ fontWeight: 'bold', color: '#f59e0b' }}>Jank Log (Last 4 drops):</span>
              <button
                onClick={handleResetMax}
                style={{
                  background: 'transparent',
                  border: '1px solid #475569',
                  borderRadius: '3px',
                  color: '#94a3b8',
                  fontSize: '9px',
                  cursor: 'pointer',
                  padding: '2px 4px'
                }}
              >
                RESET
              </button>
            </div>
            <div ref={logContainerRef} style={{ display: 'flex', flexDirection: 'column', gap: '3px', minHeight: '60px', background: '#020617', padding: '6px', borderRadius: '4px', border: '1px solid #1e293b' }}>
              {/* Dynamic logging elements added here */}
            </div>
          </div>
        </div>
      )}
    </>
  );
}
