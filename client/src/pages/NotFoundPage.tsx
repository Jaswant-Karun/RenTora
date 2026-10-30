import React from 'react';
import { Link } from 'react-router-dom';
import { Button } from '../components/common/Button';
import { ArrowLeft, Compass } from 'lucide-react';

export const NotFoundPage: React.FC = () => {
  return (
    <div className="min-h-[calc(100vh-10rem)] flex flex-col items-center justify-center p-6 text-center">
      <div className="w-16 h-16 rounded-3xl bg-brand-500/10 text-brand-400 flex items-center justify-center mb-6">
        <Compass className="w-8 h-8" />
      </div>
      <h1 className="text-4xl font-extrabold text-white">404 - Space Not Found</h1>
      <p className="text-sm text-slate-400 max-w-md mt-2">
        The equipment or institutional resource directory page you are looking for has been moved or does not exist.
      </p>
      <div className="mt-6">
        <Link to="/">
          <Button variant="primary" leftIcon={<ArrowLeft className="w-4 h-4" />}>
            Return to RENTORA Hub
          </Button>
        </Link>
      </div>
    </div>
  );
};
