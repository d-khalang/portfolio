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

export default function JungleFooter() {
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    navigator.clipboard.writeText('danikhalang@gmail.com');
    setCopied(true);
    setTimeout(() => setCopied(false), 2200);
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

      <div className="jj-footer__content">
        {/* Left Column: Editorial Greeting */}
        <div className="jj-footer__info">
          <span className="jj-footer__kicker">[ END OF THE TRAIL ]</span>
          <h2 className="jj-footer__heading">
            The roots<br />connect here.
          </h2>
          <p className="jj-footer__body">
            If something sparked your curiosity along the way — a project,
            an idea, or just a good conversation — I'd love to hear from you.
          </p>
        </div>

        {/* Right Column: Contact Grid */}
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
