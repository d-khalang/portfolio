import { useState } from 'react';
import './JungleFooter.css';
import networkBg from '../assets/jungle/network.webp';

const SOCIALS = [
  {
    label: 'GitHub',
    href: 'https://github.com/d-khalang',
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        <path d="M9 19c-5 1.5-5-2.5-7-3m14 6v-3.87a3.37 3.37 0 0 0-.94-2.61c3.14-.35 6.44-1.54 6.44-7A5.44 5.44 0 0 0 20 4.77 5.07 5.07 0 0 0 19.91 1S18.73.65 16 2.48a13.38 13.38 0 0 0-7 0C6.27.65 5.09 1 5.09 1A5.07 5.07 0 0 0 5 4.77a5.44 5.44 0 0 0-1.5 3.78c0 5.42 3.3 6.61 6.44 7A3.37 3.37 0 0 0 9 18.13V22" />
      </svg>
    ),
  },
  {
    label: 'LinkedIn',
    href: 'https://linkedin.com/in/daniel-s-khalili',
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        <path d="M16 8a6 6 0 0 1 6 6v7h-4v-7a2 2 0 0 0-2-2 2 2 0 0 0-2 2v7h-4v-7a6 6 0 0 1 6-6z" />
        <rect x="2" y="9" width="4" height="12" />
        <circle cx="4" cy="4" r="2" />
      </svg>
    ),
  },
  {
    label: 'Telegram',
    href: 'https://t.me/danikhalang',
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        <line x1="22" y1="2" x2="11" y2="13" />
        <polygon points="22 2 15 22 11 13 2 9 22 2" />
      </svg>
    ),
  },
];

const ROOT_PATHS = [
  { id: 'root-left-main', d: 'M 150 0 C 140 120, 180 200, 110 320 C 70 390, 90 480, 120 540', nodeX: 120, nodeY: 540 },
  { id: 'root-left-branch1', d: 'M 160 160 C 130 220, 110 280, 75 340', nodeX: 75, nodeY: 340 },
  { id: 'root-center-main', d: 'M 500 0 C 520 150, 480 280, 540 380 C 580 450, 510 520, 480 620', nodeX: 480, nodeY: 620 },
  { id: 'root-center-branch1', d: 'M 505 200 C 450 260, 420 320, 390 410', nodeX: 390, nodeY: 410 },
  { id: 'root-center-branch2', d: 'M 525 330 C 590 400, 610 460, 650 520', nodeX: 650, nodeY: 520 },
  { id: 'root-right-main', d: 'M 850 0 C 830 140, 890 260, 860 380 C 830 470, 870 540, 920 600', nodeX: 920, nodeY: 600 },
  { id: 'root-right-branch1', d: 'M 870 200 C 920 280, 950 360, 990 430', nodeX: 990, nodeY: 430 }
];

export default function JungleFooter() {
  const [copied, setCopied] = useState(false);
  const [signalState, setSignalState] = useState<{ status: 'idle' | 'routing' | 'sent'; label: string }>({
    status: 'idle',
    label: ''
  });

  const handleCopy = () => {
    navigator.clipboard.writeText('danikhalang@gmail.com');
    setCopied(true);
    setTimeout(() => setCopied(false), 2200);
  };

  const handleSignalTrigger = (option: 'collab' | 'coffee' | 'hi') => {
    if (signalState.status !== 'idle') return;

    let optionLabel = '';
    let mailtoUrl = '';

    switch (option) {
      case 'collab':
        optionLabel = 'Collaborate';
        mailtoUrl = "mailto:danikhalang@gmail.com?subject=Collaborate%20with%20Danial&body=Hi%20Danial%2C%0A%0AI%20was%20browsing%20your%20portfolio%20and%20would%20love%20to%20discuss%20working%20together%20on...";
        break;
      case 'coffee':
        optionLabel = 'Coffee Chat';
        mailtoUrl = "mailto:danikhalang@gmail.com?subject=Coffee%20Chat%20%2F%20Let's%20connect&body=Hi%20Danial%2C%0A%0AI'd%20love%20to%20grab%20a%20coffee%20(or%20have%20a%20virtual%20chat)%20to%20talk%20about...";
        break;
      case 'hi':
        optionLabel = 'Say Hello';
        mailtoUrl = "mailto:danikhalang@gmail.com?subject=Just%20saying%20hi!&body=Hi%20Danial%2C%0A%0AJust%20stopping%20by%20your%20portfolio%20to%20say%20hello!%20Stunning%20work.";
        break;
    }

    setSignalState({ status: 'routing', label: optionLabel });

    setTimeout(() => {
      setSignalState({ status: 'sent', label: optionLabel });
      window.location.href = mailtoUrl;

      // Reset state after a few seconds
      setTimeout(() => {
        setSignalState({ status: 'idle', label: '' });
      }, 3500);
    }, 1200);
  };

  return (
    <footer className="jj-footer">
      {/* Gradual Transparency Mycelium Background Image */}
      <div
        className="jj-footer__bg"
        style={{ backgroundImage: `url(${networkBg})` }}
        aria-hidden="true"
      />

      {/* Warm ambient glow */}
      <div className="jj-footer__glow" aria-hidden="true" />

      {/* Animated SVG Mycelium/Root Network */}
      <svg
        className="jj-root-network"
        viewBox="0 0 1200 700"
        preserveAspectRatio="none"
        aria-hidden="true"
      >
        {ROOT_PATHS.map((path) => (
          <g key={path.id}>
            <path
              className="jj-root-path"
              d={path.d}
            />
            <path
              className={`jj-root-pulse ${signalState.status === 'routing' ? 'routing' : ''}`}
              d={path.d}
            />
            <circle
              className={`jj-root-node ${signalState.status === 'routing' ? 'active' : ''}`}
              cx={path.nodeX}
              cy={path.nodeY}
              r="4"
            />
          </g>
        ))}
      </svg>

      <div className="jj-footer__content">
        {/* Left Column: Editorial Greeting & Signal Starters */}
        <div className="jj-footer__info">
          <span className="jj-footer__kicker">[ END OF THE TRAIL ]</span>
          <h2 className="jj-footer__heading">
            The roots<br />connect here.
          </h2>

          <div className="jj-footer__signals-section">
            <span className="jj-footer__group-label">Send a signal through the roots:</span>
            <div className="jj-footer__signals-grid">
              <button
                type="button"
                className={`jj-footer__signal-btn ${signalState.status !== 'idle' ? 'disabled' : ''}`}
                onClick={() => handleSignalTrigger('collab')}
                disabled={signalState.status !== 'idle'}
              >
                [ Collaborate ]
              </button>
              <button
                type="button"
                className={`jj-footer__signal-btn ${signalState.status !== 'idle' ? 'disabled' : ''}`}
                onClick={() => handleSignalTrigger('coffee')}
                disabled={signalState.status !== 'idle'}
              >
                [ Coffee Chat ]
              </button>
              <button
                type="button"
                className={`jj-footer__signal-btn ${signalState.status !== 'idle' ? 'disabled' : ''}`}
                onClick={() => handleSignalTrigger('hi')}
                disabled={signalState.status !== 'idle'}
              >
                [ Say Hello ]
              </button>
            </div>
            
            <div className="jj-footer__signal-status">
              {signalState.status === 'routing' && (
                <span className="jj-footer__status-text routing">
                  Routing "{signalState.label}" signal through root nodes...
                </span>
              )}
              {signalState.status === 'sent' && (
                <span className="jj-footer__status-text sent">
                  ✓ Connection established. Opening email client...
                </span>
              )}
              {signalState.status === 'idle' && (
                <span className="jj-footer__status-text idle">
                  System ready. Select a node to connect.
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Right Column: Direct Connections */}
        <div className="jj-footer__actions">
          <div className="jj-footer__actions-group">
            <span className="jj-footer__group-label">Direct Connection</span>
            <button
              type="button"
              className="jj-footer__email"
              onClick={handleCopy}
              aria-label="Copy email address"
            >
              <span className="jj-footer__email-text">
                danikhalang@gmail.com
              </span>
              <span className="jj-footer__email-hint">
                {copied ? '— copied to clipboard' : '— click to copy'}
              </span>
            </button>
          </div>

          <div className="jj-footer__actions-group">
            <span className="jj-footer__group-label">Digital Presence</span>
            <nav className="jj-footer__socials" aria-label="Social links">
              {SOCIALS.map((s) => (
                <a
                  key={s.label}
                  className="jj-footer__social"
                  href={s.href}
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label={s.label}
                >
                  <span className="jj-footer__social-icon">{s.icon}</span>
                  <span className="jj-footer__social-label">{s.label}</span>
                </a>
              ))}
            </nav>
          </div>
        </div>
      </div>

      {/* Baseline */}
      <div className="jj-footer__baseline">
        <span>Designed & built by Danial Khalili</span>
        <span>© 2026</span>
      </div>
    </footer>
  );
}
