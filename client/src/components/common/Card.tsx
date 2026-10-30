import React from 'react';

interface CardProps {
  children: React.ReactNode;
  className?: string;
  hoverEffect?: boolean;
}

export const Card: React.FC<CardProps> = ({
  children,
  className = '',
  hoverEffect = false,
}) => {
  return (
    <div
      className={`bg-slate-900/70 backdrop-blur-md border border-slate-800/80 rounded-2xl p-6 shadow-xl transition-all duration-300
        ${
          hoverEffect
            ? 'hover:border-slate-700 hover:shadow-2xl hover:shadow-brand-500/5 hover:-translate-y-1'
            : ''
        } ${className}`}
    >
      {children}
    </div>
  );
};
