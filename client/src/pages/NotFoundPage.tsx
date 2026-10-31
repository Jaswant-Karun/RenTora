import React from 'react';
import { Link } from 'react-router-dom';
import { Button } from '../components/common/Button';
import { ArrowLeft, Compass } from 'lucide-react';

export const NotFoundPage: React.FC = () => {
  return (
    <div className="min-h-[60vh] flex flex-col items-center justify-center p-6 text-center">
      <div className="w-16 h-16 rounded-2xl bg-[#EFF6FF] text-[#1769D2] flex items-center justify-center mb-4 border border-blue-100 shadow-sm">
        <Compass className="w-8 h-8" />
      </div>
      <h1 className="text-3xl font-extrabold text-[#172033] tracking-tight">404 - Page Not Found</h1>
      <p className="text-xs sm:text-sm text-[#64748B] max-w-md mt-1.5">
        The equipment or institutional resource directory page you are looking for has been relocated or does not exist.
      </p>
      <div className="mt-6 flex items-center gap-3">
        <Link to="/dashboard">
          <Button variant="primary" leftIcon={<ArrowLeft className="w-4 h-4" />}>
            Return to Console
          </Button>
        </Link>
        <Link to="/dashboard/explore">
          <Button variant="outline">
            Browse Equipment
          </Button>
        </Link>
      </div>
    </div>
  );
};

export default NotFoundPage;
