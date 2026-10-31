import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { ChevronRight, Home } from 'lucide-react';

const SEGMENT_LABELS: Record<string, string> = {
  dashboard: 'Borrower Console',
  explore: 'Resource Marketplace',
  resources: 'Equipment Catalog',
  bookings: 'My Bookings',
  waitlist: 'Waiting List',
  activity: 'Resource Activity',
  notifications: 'Notifications',
  profile: 'User Profile',
  settings: 'Settings',
  owner: 'Custodian Hub',
  requests: 'Booking Requests',
  approved: 'Approved Bookings',
  checkin: 'Check-in & Handover',
  'add-resource': 'Add Equipment',
  'condition-reports': 'Condition Reports',
  incidents: 'Safety Incidents',
  calendar: 'Schedule Calendar',
  analytics: 'Resource Analytics',
  audit: 'Immutable Audit Ledger',
  manager: 'Manager Hub',
  admin: 'Admin Console',
  // Tab labels
  stats: 'Institutional Statistics',
  'ai-analytics': 'AI Demand & Utilization',
  approvals: 'Resource Approvals',
  users: 'User Verification & Roles',
  eligibility: 'Eligibility Tier Policies',
  conflicts: 'Conflict Resolution',
  disputes: 'Dispute Arbitration',
  'fair-allocation': 'Fair Allocation Policy',
  overview: 'Platform Overview',
  institutions: 'Partner Institutions',
};

export const Breadcrumbs: React.FC = () => {
  const location = useLocation();
  const pathnames = location.pathname.split('/').filter((x) => x);

  if (pathnames.length === 0 || location.pathname === '/' || location.pathname === '/intro') {
    return null;
  }

  const queryParams = new URLSearchParams(location.search);
  const activeTab = queryParams.get('tab');

  const formatSegment = (str: string) => {
    if (SEGMENT_LABELS[str.toLowerCase()]) {
      return SEGMENT_LABELS[str.toLowerCase()];
    }
    // Check if it's a 24-character hexadecimal MongoDB ID
    if (/^[0-9a-fA-F]{24}$/.test(str)) {
      return 'Equipment Details';
    }
    return str
      .replace(/-/g, ' ')
      .replace(/_/g, ' ')
      .replace(/\b\w/g, (char) => char.toUpperCase());
  };

  // Determine root destination
  const isOwner = location.pathname.startsWith('/owner');
  const isManager = location.pathname.startsWith('/manager');
  const isAdmin = location.pathname.startsWith('/admin');

  const rootTo = isOwner ? '/owner' : isManager ? '/manager' : isAdmin ? '/admin' : '/dashboard';
  const rootLabel = isOwner ? 'Custodian Hub' : isManager ? 'Manager Hub' : isAdmin ? 'Admin Console' : 'Console';

  return (
    <nav className="flex items-center space-x-1.5 text-xs text-[#64748B] mb-4" aria-label="Breadcrumb">
      <Link
        to={rootTo}
        className="flex items-center hover:text-[#1769D2] font-medium transition-colors"
      >
        <Home className="w-3.5 h-3.5 mr-1" />
        <span>{rootLabel}</span>
      </Link>
      {pathnames.map((segment, index) => {
        const routeTo = `/${pathnames.slice(0, index + 1).join('/')}`;
        const isLastSegment = index === pathnames.length - 1;
        const isRootSegment =
          (segment === 'dashboard' && index === 0) ||
          (segment === 'owner' && index === 0) ||
          (segment === 'manager' && index === 0) ||
          (segment === 'admin' && index === 0);

        if (isRootSegment) return null;

        const isTerminal = isLastSegment && !activeTab;

        return (
          <React.Fragment key={routeTo}>
            <ChevronRight className="w-3 h-3 text-[#94A3B8] shrink-0" />
            {isTerminal ? (
              <span className="font-semibold text-[#172033] truncate max-w-[200px]">
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

      {/* If tab parameter is present in URL */}
      {activeTab && SEGMENT_LABELS[activeTab] && (
        <React.Fragment key="active-tab">
          <ChevronRight className="w-3 h-3 text-[#94A3B8] shrink-0" />
          <span className="font-semibold text-[#172033] truncate max-w-[220px]">
            {SEGMENT_LABELS[activeTab]}
          </span>
        </React.Fragment>
      )}
    </nav>
  );
};

export default Breadcrumbs;
