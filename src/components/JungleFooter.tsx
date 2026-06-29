import React, { useState, useEffect, useRef } from 'react';
import './JungleFooter.css';
import networkBg from '../assets/jungle/network.webp';

// SVG Path definitions for organic root systems branching from top to bottom nodes
const ROOT_PATHS = [
  // Left trunk -> System Status node
  {
    id: 'root-left-main',
    d: 'M 150 0 C 140 120, 180 200, 110 320 C 70 390, 90 480, 120 540',
    nodeX: 120,
    nodeY: 540,
    panelIndex: 0
  },
  {
    id: 'root-left-branch1',
    d: 'M 160 160 C 130 220, 110 280, 75 340',
    nodeX: 75,
    nodeY: 340,
    panelIndex: 0
  },
  // Center trunk -> Root Channels nodes
  {
    id: 'root-center-main',
    d: 'M 500 0 C 520 150, 480 280, 540 380 C 580 450, 510 520, 480 620',
    nodeX: 480,
    nodeY: 620,
    panelIndex: 1
  },
  {
    id: 'root-center-branch1',
    d: 'M 505 200 C 450 260, 420 320, 390 410',
    nodeX: 390,
    nodeY: 410,
    panelIndex: 1
  },
  {
    id: 'root-center-branch2',
    d: 'M 525 330 C 590 400, 610 460, 650 520',
    nodeX: 650,
    nodeY: 520,
    panelIndex: 1
  },
  // Right trunk -> Signal Transmitter nodes
  {
    id: 'root-right-main',
    d: 'M 850 0 C 830 140, 890 260, 860 380 C 830 470, 870 540, 920 600',
    nodeX: 920,
    nodeY: 600,
    panelIndex: 2
  },
  {
    id: 'root-right-branch1',
    d: 'M 870 200 C 920 280, 950 360, 990 430',
    nodeX: 990,
    nodeY: 430,
    panelIndex: 2
  }
];

export default function JungleFooter() {
  // Real-time clock for System Status
  const [time, setTime] = useState('');
  useEffect(() => {
    const updateClock = () => {
      const now = new Date();
      setTime(
        now.toLocaleTimeString('en-US', {
          hour12: false,
          hour: '2-digit',
          minute: '2-digit',
          second: '2-digit'
        })
      );
    };
    updateClock();
    const interval = setInterval(updateClock, 1000);
    return () => clearInterval(interval);
  }, []);

  // Email Copy feedback state
  const [copied, setCopied] = useState(false);
  const handleCopyEmail = (e: React.MouseEvent) => {
    e.preventDefault();
    navigator.clipboard.writeText('danikhalang@gmail.com');
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);

    // Also output to the terminal!
    addTerminalLine(`> System.Clipboard.write("danikhalang@gmail.com")`);
    addTerminalLine(`> [CLIPBOARD_SUCCESS] Email copied to buffer.`);
  };

  // Simulated Terminal State
  const [terminalLines, setTerminalLines] = useState<Array<{ text: string; type: 'sys' | 'success' | 'cmd' }>>([
    { text: 'ROOT_NETWORK: connection established.', type: 'sys' },
    { text: 'Local mycelium nodes online: 7/7', type: 'sys' },
    { text: 'Ready to route signal packets.', type: 'sys' }
  ]);
  const [inputText, setInputText] = useState('');
  const terminalBodyRef = useRef<HTMLDivElement>(null);

  // Auto-scroll terminal to bottom
  useEffect(() => {
    if (terminalBodyRef.current) {
      terminalBodyRef.current.scrollTop = terminalBodyRef.current.scrollHeight;
    }
  }, [terminalLines]);

  const addTerminalLine = (text: string, type: 'sys' | 'success' | 'cmd' = 'sys') => {
    setTerminalLines((prev) => [...prev, { text, type }]);
  };

  const handleSendSignal = (messageText: string) => {
    if (!messageText.trim()) return;

    // Add command line
    addTerminalLine(`$ transmit --message "${messageText}"`, 'cmd');

    // Simulate routing hops
    setTimeout(() => {
      addTerminalLine(`> Resolving danikhalang@gmail.com ... OK`, 'sys');
    }, 400);

    setTimeout(() => {
      addTerminalLine(`> Encrypting package & routing through root nodes...`, 'sys');
    }, 900);

    setTimeout(() => {
      addTerminalLine(`> ✓ Signal delivered to Danial's inbox via root nodes.`, 'success');
    }, 1500);
  };

  const handleFormSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputText.trim()) return;
    handleSendSignal(inputText);
    setInputText('');
  };

  const handleQuickAction = (text: string) => {
    handleSendSignal(text);
  };

  return (
    <footer className="jj-footer">
      {/* Gradual Transparency Mycelium Background Image */}
      <div
        className="jj-footer__bg"
        style={{ backgroundImage: `url(${networkBg})` }}
        aria-hidden="true"
      />

      {/* Animated SVG Mycelium/Root Network */}
      <svg
        className="jj-root-network"
        viewBox="0 0 1200 700"
        preserveAspectRatio="none"
        aria-hidden="true"
      >
        <defs>
          <linearGradient id="root-grad" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="#10b981" stopOpacity="0.4" />
            <stop offset="100%" stopColor="#08171a" stopOpacity="0.05" />
          </linearGradient>
          <filter id="root-glow-filter">
            <feGaussianBlur stdDeviation="3" result="coloredBlur"/>
            <feMerge>
              <feMergeNode in="coloredBlur"/>
              <feMergeNode in="SourceGraphic"/>
            </feMerge>
          </filter>
        </defs>

        {/* Drawn static/pulsing root lines */}
        {ROOT_PATHS.map((path) => (
          <g key={path.id}>
            <path
              className="jj-root-path"
              d={path.d}
            />
            <path
              className="jj-root-pulse"
              d={path.d}
              style={{
                animation: `journey-cloud-drift 4s infinite ease-in-out` // placeholder/base animation handled in CSS
              }}
            />
            {/* Target active nodes */}
            <circle
              className="jj-root-node active"
              cx={path.nodeX}
              cy={path.nodeY}
              r="5"
            />
          </g>
        ))}
      </svg>

      <div className="jj-footer__content">
        <div className="jj-footer__grid">
          {/* Column 1: System Status */}
          <section className="jj-panel">
            <h2 className="jj-panel__title">
              System Info
              <span className="jj-panel__tag">NODE_01</span>
            </h2>
            <div className="jj-status-list">
              <div className="jj-status-item">
                <span className="jj-status-label">Availability</span>
                <span className="jj-status-val">
                  <span className="jj-led" />
                  Ready to Collaborate
                </span>
              </div>
              <div className="jj-status-item">
                <span className="jj-status-label">Primary Target</span>
                <span className="jj-status-val">Turin, IT</span>
              </div>
              <div className="jj-status-item">
                <span className="jj-status-label">Network Protocol</span>
                <span className="jj-status-val">TCP/IP Mycelium V3</span>
              </div>
              <div className="jj-status-item">
                <span className="jj-status-label">Active Time</span>
                <span className="jj-status-val">{time || '00:00:00'}</span>
              </div>
              <a
                href="/cv-danial-khalili.pdf"
                className="jj-cv-btn"
                target="_blank"
                rel="noopener noreferrer"
              >
                Download CV
                <svg
                  width="14"
                  height="14"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                  <polyline points="7 10 12 15 17 10" />
                  <line x1="12" y1="15" x2="12" y2="3" />
                </svg>
              </a>
            </div>
          </section>

          {/* Column 2: Root Channels / Connections */}
          <section className="jj-panel">
            <h2 className="jj-panel__title">
              Root Channels
              <span className="jj-panel__tag">ROUTERS</span>
            </h2>
            <div className="jj-channels-grid">
              {/* Email (Copy to Clipboard) */}
              <button
                className="jj-channel-card jj-copy-trigger"
                onClick={handleCopyEmail}
                type="button"
                aria-label="Copy Email"
              >
                <div className="jj-channel-header">
                  <span className="jj-channel-label">Email</span>
                  <svg
                    className="jj-channel-icon"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z" />
                    <polyline points="22,6 12,13 2,6" />
                  </svg>
                </div>
                <span className="jj-channel-val">danikhalang@gmail.com</span>
                <span className="jj-copy-badge" style={{ opacity: copied ? 1 : 0.4 }}>
                  {copied ? '[Copied!]' : '[Click to Copy]'}
                </span>
              </button>

              {/* GitHub */}
              <a
                className="jj-channel-card"
                href="https://github.com/d-khalang"
                target="_blank"
                rel="noopener noreferrer"
              >
                <div className="jj-channel-header">
                  <span className="jj-channel-label">GitHub</span>
                  <svg
                    className="jj-channel-icon"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <path d="M9 19c-5 1.5-5-2.5-7-3m14 6v-3.87a3.37 3.37 0 0 0-.94-2.61c3.14-.35 6.44-1.54 6.44-7A5.44 5.44 0 0 0 20 4.77 5.07 5.07 0 0 0 19.91 1S18.73.65 16 2.48a13.38 13.38 0 0 0-7 0C6.27.65 5.09 1 5.09 1A5.07 5.07 0 0 0 5 4.77a5.44 5.44 0 0 0-1.5 3.78c0 5.42 3.3 6.61 6.44 7A3.37 3.37 0 0 0 9 18.13V22" />
                  </svg>
                </div>
                <span className="jj-channel-val">d-khalang</span>
                <span className="jj-copy-badge" style={{ opacity: 0.4 }}>[GitHub Profile]</span>
              </a>

              {/* LinkedIn */}
              <a
                className="jj-channel-card"
                href="https://linkedin.com/in/daniel-s-khalili"
                target="_blank"
                rel="noopener noreferrer"
              >
                <div className="jj-channel-header">
                  <span className="jj-channel-label">LinkedIn</span>
                  <svg
                    className="jj-channel-icon"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <path d="M16 8a6 6 0 0 1 6 6v7h-4v-7a2 2 0 0 0-2-2 2 2 0 0 0-2 2v7h-4v-7a6 6 0 0 1 6-6z" />
                    <rect x="2" y="9" width="4" height="12" />
                    <circle cx="4" cy="4" r="2" />
                  </svg>
                </div>
                <span className="jj-channel-val">daniel-s-khalili</span>
                <span className="jj-copy-badge" style={{ opacity: 0.4 }}>[LinkedIn Profile]</span>
              </a>

              {/* Telegram */}
              <a
                className="jj-channel-card"
                href="https://t.me/danikhalang"
                target="_blank"
                rel="noopener noreferrer"
              >
                <div className="jj-channel-header">
                  <span className="jj-channel-label">Telegram</span>
                  <svg
                    className="jj-channel-icon"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <line x1="22" y1="2" x2="11" y2="13" />
                    <polygon points="22 2 15 22 11 13 2 9 22 2" />
                  </svg>
                </div>
                <span className="jj-channel-val">@danikhalang</span>
                <span className="jj-copy-badge" style={{ opacity: 0.4 }}>[Telegram Link]</span>
              </a>
            </div>
          </section>

          {/* Column 3: Signal Transmitter / Interactive Console */}
          <section className="jj-panel">
            <h2 className="jj-panel__title">
              Transmitter
              <span className="jj-panel__tag">CONSOLE</span>
            </h2>
            <div className="jj-terminal">
              <div className="jj-terminal-header">
                <div className="jj-terminal-dots">
                  <span className="jj-terminal-dot jj-terminal-dot--red" />
                  <span className="jj-terminal-dot" />
                  <span className="jj-terminal-dot jj-terminal-dot--green" />
                </div>
                <span className="jj-terminal-name">root_signal.sh</span>
              </div>

              <div className="jj-terminal-body" ref={terminalBodyRef}>
                {terminalLines.map((line, index) => (
                  <div
                    key={index}
                    className={`jj-terminal-line ${
                      line.type === 'sys'
                        ? 'jj-terminal-line--system'
                        : line.type === 'success'
                        ? 'jj-terminal-line--success'
                        : ''
                    }`}
                  >
                    {line.text}
                  </div>
                ))}
                <div className="jj-terminal-input-wrap">
                  <span>&gt;</span>
                  <form onSubmit={handleFormSubmit} style={{ width: '100%' }}>
                    <input
                      className="jj-terminal-input"
                      type="text"
                      placeholder="Type a message & press enter..."
                      value={inputText}
                      onChange={(e) => setInputText(e.target.value)}
                    />
                  </form>
                </div>
              </div>

              <div className="jj-terminal-quick-actions">
                <button
                  type="button"
                  className="jj-quick-btn"
                  onClick={() => handleQuickAction("LET'S COLLABORATE")}
                >
                  [Collaborate]
                </button>
                <button
                  type="button"
                  className="jj-quick-btn"
                  onClick={() => handleQuickAction("COFFEE CHAT")}
                >
                  [Coffee]
                </button>
                <button
                  type="button"
                  className="jj-quick-btn"
                  onClick={() => handleQuickAction("SAYING HI")}
                >
                  [Say Hi]
                </button>
              </div>
            </div>
          </section>
        </div>
      </div>

      {/* Footer Baseline */}
      <div className="jj-footer__baseline">
        <div>DESIGN &amp; DEVELOPMENT BY DANI KHALILI</div>
        <div className="jj-footer__baseline-meta">
          <span>ROOT_PROTOCOL V3.0</span>
          <span>© 2026 ALL RIGHTS RESERVED</span>
        </div>
      </div>
    </footer>
  );
}
