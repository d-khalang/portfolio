import { useEffect, useRef, useState } from 'react';

interface FrameDetail {
  type: string;
  startTime: number;
  duration: number;
  renderStart?: number;
  styleAndLayoutStart?: number;
  blockingDuration?: number;
  paintTime?: number;
  presentationTime?: number;
  scripts?: Array<{
    duration: number;
    invoker: string;
    sourceURL: string;
    sourceFunctionName: string;
    forcedStyleAndLayoutDuration: number;
  }>;
}

const recordingEnvironment = () => ({
  width: innerWidth, height: innerHeight, dpr: devicePixelRatio,
  userAgent: navigator.userAgent,
  page: location.origin + location.pathname,
  buildMode: import.meta.env.MODE,
});

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
      frameDrops: Array<{ phase: string; fps: number; time: number; durationMs?: number; progress?: number }>;
      phaseFrames: Record<string, { frames: number; totalMs: number; maxMs: number; over33ms: number; over50ms: number }>;
      longFrames: FrameDetail[];
      environment: ReturnType<typeof recordingEnvironment>;
    };
  }
}

// Initialize the global telemetry container if it doesn't exist
if (typeof window !== 'undefined') {
  window.__scrollPerf = Object.assign({
    journeyRenders: 0,
    bikeRenders: 0,
    scrollUpdates: 0,
    lastProjectStatesTime: 0,
    lastBikeUpdateTime: 0,
    maxProjectStatesTime: 0,
    maxBikeUpdateTime: 0,
    currentProgress: 0,
    currentPhase: 'Initializing',
    frameDrops: [],
    phaseFrames: {},
    longFrames: [],
    environment: recordingEnvironment(),
  }, window.__scrollPerf);
}

export default function ScrollPerfTracker() {
  const [isVisible, setIsVisible] = useState(false);
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
    // ?perf=1 records without the HUD. Opening it also starts a recording.
    if (!isVisible && !new URLSearchParams(window.location.search).has('perf')) return;
    const telemetry = window.__scrollPerf;
    telemetry.environment = recordingEnvironment();
    let lastFrame = 0;
    let lastDisplay = 0;
    let displayFrames = 0;
    let frameElapsed = 0;
    let previousPhase = telemetry.currentPhase;
    let previousProgress = telemetry.currentProgress;
    let rAFId: number;
    const observers: PerformanceObserver[] = [];
    for (const type of ['longtask', 'long-animation-frame']) {
      if (!PerformanceObserver.supportedEntryTypes.includes(type)) continue;
      const observer = new PerformanceObserver(list => {
        for (const entry of list.getEntries()) {
          // Duration alone cannot separate delayed frame scheduling from script
          // and rendering work. Keep the browser's attribution where available.
          const frame = entry as PerformanceEntry & Partial<FrameDetail>;
          telemetry.longFrames.push({
            type, startTime: entry.startTime, duration: entry.duration,
            renderStart: frame.renderStart,
            styleAndLayoutStart: frame.styleAndLayoutStart,
            blockingDuration: frame.blockingDuration,
            paintTime: frame.paintTime,
            presentationTime: frame.presentationTime,
            scripts: frame.scripts?.map(script => ({
              duration: script.duration, invoker: script.invoker,
              sourceURL: script.sourceURL, sourceFunctionName: script.sourceFunctionName,
              forcedStyleAndLayoutDuration: script.forcedStyleAndLayoutDuration,
            })),
          });
          if (telemetry.longFrames.length > 200) telemetry.longFrames.shift();
        }
      });
      observer.observe({ type });
      observers.push(observer);
    }
    const write = (element: HTMLElement | null, value: string) => {
      if (element && element.textContent !== value) element.textContent = value;
    };
    const updateMetrics = (now: number) => {
      if (document.visibilityState === 'hidden') {
        lastFrame = 0;
        lastDisplay = now;
        displayFrames = 0;
        frameElapsed = 0;
      } else {
        if (lastFrame) {
          const dt = now - lastFrame;
          const stats = telemetry.phaseFrames[previousPhase] ||= { frames: 0, totalMs: 0, maxMs: 0, over33ms: 0, over50ms: 0 };
          stats.frames++;
          stats.totalMs += dt;
          stats.maxMs = Math.max(stats.maxMs, dt);
          if (dt > 33.4) stats.over33ms++;
          if (dt > 50) stats.over50ms++;
          if (dt > 33.4) {
            telemetry.frameDrops.push({ phase: previousPhase, progress: previousProgress, durationMs: dt, fps: Math.round(1000 / dt), time: Math.round(now) });
            if (telemetry.frameDrops.length > 300) telemetry.frameDrops.shift();
          }
          frameElapsed += dt;
          displayFrames++;
        }
        lastFrame = now;
        previousPhase = telemetry.currentPhase;
        previousProgress = telemetry.currentProgress;
        // The HUD must not become a source of per-frame DOM/style work itself.
        if (isVisible && now - lastDisplay >= 250) {
          const fps = frameElapsed ? Math.round(displayFrames * 1000 / frameElapsed) : 0;
          write(fpsValRef.current, `${fps} FPS`);
          if (fpsValRef.current) fpsValRef.current.style.color = fps >= 55 ? '#10b981' : fps >= 35 ? '#f59e0b' : '#ef4444';
          write(jRendersValRef.current, String(telemetry.journeyRenders));
          write(bRendersValRef.current, String(telemetry.bikeRenders));
          write(scrollUpdatesValRef.current, String(telemetry.scrollUpdates));
          write(projTimeValRef.current, `${telemetry.lastProjectStatesTime.toFixed(2)}ms`);
          write(bikeTimeValRef.current, `${telemetry.lastBikeUpdateTime.toFixed(2)}ms`);
          write(maxProjTimeValRef.current, `${telemetry.maxProjectStatesTime.toFixed(2)}ms`);
          write(maxBikeTimeValRef.current, `${telemetry.maxBikeUpdateTime.toFixed(2)}ms`);
          write(progressValRef.current, `${Math.round(telemetry.currentProgress * 100)}%`);
          write(phaseValRef.current, telemetry.currentPhase);
          write(logContainerRef.current, telemetry.frameDrops.slice(-4).map(drop => `${drop.durationMs?.toFixed(1)}ms — ${drop.phase}`).join('\n'));
          lastDisplay = now;
          displayFrames = 0;
          frameElapsed = 0;
        }
      }
      rAFId = requestAnimationFrame(updateMetrics);
    };
    const resetFrame = () => { lastFrame = 0; };
    document.addEventListener('visibilitychange', resetFrame);
    rAFId = requestAnimationFrame(updateMetrics);
    return () => {
      cancelAnimationFrame(rAFId);
      observers.forEach(observer => observer.disconnect());
      document.removeEventListener('visibilitychange', resetFrame);
    };
  }, [isVisible]);

  const handleResetMax = () => {
    if (typeof window !== 'undefined' && window.__scrollPerf) {
      window.__scrollPerf.maxProjectStatesTime = 0;
      window.__scrollPerf.maxBikeUpdateTime = 0;
      window.__scrollPerf.frameDrops = [];
      window.__scrollPerf.phaseFrames = {};
      window.__scrollPerf.longFrames = [];
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
          bottom: '12px',
          right: '12px',
          zIndex: 10000,
          background: '#0f172a',
          color: '#38bdf8',
          border: '1px solid #38bdf8',
          borderRadius: '3px',
          padding: '3px 6px',
          fontSize: '9px',
          fontFamily: 'monospace',
          cursor: 'pointer',
          boxShadow: '0 2px 8px rgba(0,0,0,0.5)',
          opacity: 0.6,
          transition: 'opacity 0.2s',
        }}
        onMouseEnter={(e) => { e.currentTarget.style.opacity = '1'; }}
        onMouseLeave={(e) => { e.currentTarget.style.opacity = '0.6'; }}
      >
        {isVisible ? 'HIDE HUD' : 'SHOW HUD'}
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
              <span style={{ color: '#94a3b8' }}>Animation frames:</span>
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
            <div ref={logContainerRef} style={{ whiteSpace: 'pre-line', display: 'flex', flexDirection: 'column', gap: '3px', minHeight: '60px', background: '#020617', padding: '6px', borderRadius: '4px', border: '1px solid #1e293b' }}>
              {/* Dynamic logging elements added here */}
            </div>
          </div>
        </div>
      )}
    </>
  );
}
