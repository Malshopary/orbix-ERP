import React from 'react';

interface OrbixLogoProps {
  className?: string;
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl';
  variant?: 'full' | 'icon' | 'badge';
  theme?: 'light' | 'dark' | 'white';
}

export const OrbixLogo: React.FC<OrbixLogoProps> = ({
  className = '',
  size = 'md',
  variant = 'full',
  theme = 'light',
}) => {
  const navyColor = theme === 'white' ? '#FFFFFF' : theme === 'dark' ? '#38bdf8' : '#07215C';
  const greenColor = '#00C078';
  const textColor = theme === 'white' ? '#FFFFFF' : theme === 'dark' ? '#F8FAFC' : '#07215C';

  const sizeDimensions = {
    xs: { h: 'h-6', iconW: 24, fullW: 90 },
    sm: { h: 'h-8', iconW: 32, fullW: 115 },
    md: { h: 'h-10', iconW: 40, fullW: 145 },
    lg: { h: 'h-12', iconW: 48, fullW: 175 },
    xl: { h: 'h-16', iconW: 64, fullW: 230 },
  }[size];

  if (variant === 'icon') {
    return (
      <svg
        viewBox="0 0 100 100"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className={`${sizeDimensions.h} w-auto aspect-square shrink-0 ${className}`}
      >
        <g fill={navyColor}>
          <path d="M 45 7 L 18 22.5 C 14.5 24.8 14 28 14 33 L 14 42 L 31 32 C 33.5 30.5 35.5 31 37 32.5 L 45 40.5 Z" />
          <path d="M 55 7 L 82 22.5 C 85.5 24.8 86 28 86 33 L 86 42 L 69 32 C 66.5 30.5 64.5 31 63 32.5 L 55 40.5 Z" />
          <path d="M 45 93 L 18 77.5 C 14.5 75.2 14 72 14 67 L 14 58 L 31 68 C 33.5 69.5 35.5 69 37 67.5 L 45 59.5 Z" />
          <path d="M 55 93 L 82 77.5 C 85.5 75.2 86 72 86 67 L 86 58 L 69 68 C 66.5 69.5 64.5 69 63 67.5 L 55 59.5 Z" />
        </g>
        <circle cx="50" cy="50" r="14" fill={greenColor} />
      </svg>
    );
  }

  return (
    <svg
      viewBox="0 0 360 100"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={`${sizeDimensions.h} w-auto shrink-0 ${className}`}
    >
      <g transform="translate(4, 0)">
        <g fill={navyColor}>
          <path d="M 45 7 L 18 22.5 C 14.5 24.8 14 28 14 33 L 14 42 L 31 32 C 33.5 30.5 35.5 31 37 32.5 L 45 40.5 Z" />
          <path d="M 55 7 L 82 22.5 C 85.5 24.8 86 28 86 33 L 86 42 L 69 32 C 66.5 30.5 64.5 31 63 32.5 L 55 40.5 Z" />
          <path d="M 45 93 L 18 77.5 C 14.5 75.2 14 72 14 67 L 14 58 L 31 68 C 33.5 69.5 35.5 69 37 67.5 L 45 59.5 Z" />
          <path d="M 55 93 L 82 77.5 C 85.5 75.2 86 72 86 67 L 86 58 L 69 68 C 66.5 69.5 64.5 69 63 67.5 L 55 59.5 Z" />
        </g>
        <circle cx="50" cy="50" r="14" fill={greenColor} />
      </g>
      <text
        x="120"
        y="70"
        fontFamily="'Readex Pro', 'Segoe UI', 'Arial Black', sans-serif"
        fontSize="58"
        fontWeight="900"
        letterSpacing="4"
        fill={textColor}
      >
        ORBIX
      </text>
    </svg>
  );
};
