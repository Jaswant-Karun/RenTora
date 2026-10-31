import React from 'react';

interface CardProps {
  children: React.ReactNode;
  className?: string;
  hoverEffect?: boolean;
  onClick?: () => void;
}

export const Card: React.FC<CardProps> = ({
  children,
  className = '',
  hoverEffect = false,
  onClick,
}) => {
  return (
    <div
      onClick={onClick}
      className={`bg-white border border-[#E2E8F0] rounded-xl p-5 shadow-sm transition-all duration-200 text-[#172033] ${
        hoverEffect ? 'hover:border-[#CBD5E1] hover:shadow-md cursor-pointer' : ''
      } ${className}`}
    >
      {children}
    </div>
  );
};
