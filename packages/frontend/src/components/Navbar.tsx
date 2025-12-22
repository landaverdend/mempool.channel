import { ReactNode } from 'react';
import { Link } from 'react-router-dom';

type NavbarProps = {
  children?: ReactNode;
};

export default function Navbar({ children }: NavbarProps) {
  return (
    <nav className="bg-bg-nav">
      <div className="flex items-center justify-between px-3 sm:px-4 py-2">
        <div className="flex items-center gap-1.5 sm:gap-2">
          <img src="/btc_jukebox.png" alt="Mempool Band Logo" className="w-10 h-13 sm:w-13 sm:h-17" />
          <Link to="/" className="flex flex-col leading-none hover:opacity-80 transition-opacity">
            <span className="text-xl sm:text-3xl font-bold text-white tracking-tight">mempool</span>
            <span className="text-xl sm:text-3xl font-bold text-title-purple tracking-tight">.music</span>
          </Link>
        </div>
        {children}
      </div>
    </nav>
  );
}
