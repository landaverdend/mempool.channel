import { useEffect, useRef } from 'react';
import { GithubIcon, MempoolSpaceIcon } from './Icons';

type AboutModalProps = {
  isOpen: boolean;
  onClose: () => void;
};

export default function AboutModal({ isOpen, onClose }: AboutModalProps) {
  const modalRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };

    if (isOpen) {
      document.addEventListener('keydown', handleEscape);
      document.body.style.overflow = 'hidden';
    }

    return () => {
      document.removeEventListener('keydown', handleEscape);
      document.body.style.overflow = '';
    };
  }, [isOpen, onClose]);

  const handleBackdropClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) onClose();
  };

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4"
      onClick={handleBackdropClick}>
      <div
        ref={modalRef}
        className="bg-bg-card border border-border rounded-lg w-full max-w-lg max-h-[90vh] overflow-y-auto animate-in fade-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-border">
          <h2 className="text-lg font-semibold text-fg">About</h2>
          <button
            onClick={onClose}
            className="text-fg-muted hover:text-fg transition-colors p-1 cursor-pointer"
            aria-label="Close">
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6">
          {/* Project Info */}
          <div className="space-y-3">
            <div className="flex items-center gap-3">
              <img src="/btc_jukebox.png" alt="mempool.music logo" className="w-12 h-16" />
              <div>
                <h3 className="text-xl font-medium text-fg">
                  mempool<span className="text-title-purple">.music</span>
                </h3>
                <p className="text-sm text-fg-muted">Lightning-powered jukebox</p>
              </div>
            </div>
            <p className="text-sm text-fg-muted leading-relaxed">
              A collaborative music experience powered by the Lightning Network. Host a listening party, share your room code, and
              let your friends queue songs by paying with sats.
            </p>
          </div>

          {/* How it works */}
          <div className="space-y-3">
            <h4 className="text-sm font-semibold text-fg uppercase tracking-wide">How It Works</h4>
            <div className="space-y-2">
              <div className="flex items-start gap-3">
                <div className="w-6 h-6 rounded-full bg-tertiary/30 flex items-center justify-center flex-shrink-0 mt-0.5">
                  <span className="text-xs font-medium text-title-purple">1</span>
                </div>
                <p className="text-sm text-fg-muted">
                  <span className="text-fg">Host a room</span> by connecting your NWC-compatible wallet
                </p>
              </div>
              <div className="flex items-start gap-3">
                <div className="w-6 h-6 rounded-full bg-tertiary/30 flex items-center justify-center flex-shrink-0 mt-0.5">
                  <span className="text-xs font-medium text-title-purple">2</span>
                </div>
                <p className="text-sm text-fg-muted">
                  <span className="text-fg">Share the room code</span> with friends to let them join
                </p>
              </div>
              <div className="flex items-start gap-3">
                <div className="w-6 h-6 rounded-full bg-tertiary/30 flex items-center justify-center flex-shrink-0 mt-0.5">
                  <span className="text-xs font-medium text-title-purple">3</span>
                </div>
                <p className="text-sm text-fg-muted">
                  <span className="text-fg">Queue songs</span> by paying with Lightning - the host earns sats!
                </p>
              </div>
            </div>
          </div>

          {/* Links */}
          <div className="space-y-3">
            <h4 className="text-sm font-semibold text-fg uppercase tracking-wide">Links</h4>
            <div className="flex flex-wrap gap-2">
              <a
                href="https://github.com/landaverdend/mempool.music"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 px-3 py-2 bg-bg-stat hover:bg-secondary/50 rounded-lg transition-colors text-sm text-fg-muted hover:text-fg">
                <GithubIcon />
                GitHub
              </a>
              <a
                href="https://mempool.space"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 px-3 py-2 bg-bg-stat hover:bg-secondary/50 rounded-lg transition-colors text-sm text-fg-muted hover:text-fg">
                <MempoolSpaceIcon />
                mempool.space
              </a>
            </div>
          </div>

          {/* Tech Stack */}
          <div className="space-y-3">
            <h4 className="text-sm font-semibold text-fg uppercase tracking-wide">Built With</h4>
            <div className="flex flex-wrap gap-2">
              {['React', 'TypeScript', 'Tailwind CSS', 'Websockets', 'Lightning Network', 'NWC'].map((tech) => (
                <span key={tech} className="px-2 py-1 bg-secondary/50 rounded text-xs text-fg-muted">
                  {tech}
                </span>
              ))}
            </div>
          </div>

          {/* Footer */}
          <div className="pt-4 border-t border-border">
            <p className="text-xs text-fg-muted/60 text-center">
              Inspired by{' '}
              <a href="https://mempool.space" target="_blank" rel="noopener noreferrer" className="text-link hover:underline">
                mempool.space
              </a>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
