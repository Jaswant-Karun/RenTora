import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { ChevronRight, Home } from 'lucide-react';

export const Breadcrumbs: React.FC = () => {
  const location = useLocation();
  const pathnames = location.pathname.split('/').filter((x) => x);

  if (pathnames.length === 0 || location.pathname === '/' || location.pathname === '/intro') {
    return null;
  }

  const formatSegment = (str: string) => {
    return str
      .replace(/-/g, ' ')
      .replace(/_/g, ' ')
      .replace(/\b\w/g, (char) => char.toUpperCase());
  };

  return (
    <nav className="flex items-center space-x-1.5 text-xs text-[#64748B] mb-4">
      <Link
        to="/dashboard"
        className="flex items-center hover:text-[#1769D2] transition-colors"
      >
        <Home className="w-3.5 h-3.5 mr-1" />
        <span>Console</span>
      </Link>
      {pathnames.map((segment, index) => {
        const routeTo = `/${pathnames.slice(0, index + 1).join('/')}`;
        const isLast = index === pathnames.length - 1;

        if (segment === 'dashboard' && index === 0) return null;

        return (
          <React.Fragment key={routeTo}>
            <ChevronRight className="w-3 h-3 text-slate-400 shrink-0" />
            {isLast ? (
              <span className="font-medium text-[#172033] truncate max-w-[200px]">
                {formatSegment(segment)}
              </span>
            ) : (
              <Link
                to={routeTo}
                className="hover:text-[#1769D2] transition-colors truncate max-w-[150px]"
              >
                {formatSegment(segment)}
              </Link>
            )}
          </React.Fragment>
        );
      })}
    </nav>
  );
};
