import { ReactNode } from 'react';
import { Link } from 'react-router-dom';

type NavbarProps = {
  children?: ReactNode;
};

export default function Navbar({ children }: NavbarProps) {
  return (
    <nav className="bg-bg-nav">
      <div className="flex items-center justify-between px-4 py-2">
        <Link to="/" className="flex flex-col leading-none hover:opacity-80 transition-opacity">
          <span className="text-3xl font-bold text-white tracking-tight">mempool</span>
          <span className="text-3xl font-bold text-title-purple tracking-tight">.band</span>
        </Link>

        {children && <div className="flex items-center gap-4">{children}</div>}
      </div>
    </nav>
  );
}
