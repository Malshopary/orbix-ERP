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
    xs: { h: 'h-6', iconW: 'w-6 h-6', textSize: 'text-sm', gap: 'gap-1.5' },
    sm: { h: 'h-8', iconW: 'w-8 h-8', textSize: 'text-base', gap: 'gap-2' },
    md: { h: 'h-10', iconW: 'w-10 h-10', textSize: 'text-xl', gap: 'gap-2.5' },
    lg: { h: 'h-12', iconW: 'w-12 h-12', textSize: 'text-2xl', gap: 'gap-3' },
    xl: { h: 'h-14 sm:h-16', iconW: 'w-14 h-14 sm:w-16 sm:h-16', textSize: 'text-3xl sm:text-4xl', gap: 'gap-3.5' },
  }[size];

  const renderIconSvg = (customClass?: string) => (
    <svg
      viewBox="0 0 100 100"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={customClass || `${sizeDimensions.iconW} aspect-square shrink-0`}
      aria-label="ORBIX Emblem"
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

  if (variant === 'icon') {
    return renderIconSvg(`${sizeDimensions.h} w-auto aspect-square shrink-0 ${className}`);
  }

  if (variant === 'badge') {
    return (
      <div
        className={`inline-flex items-center ${sizeDimensions.gap} px-3 py-1.5 rounded-xl bg-slate-100/90 border border-slate-200 select-none ${className}`}
        dir="ltr"
        style={{ direction: 'ltr' }}
      >
        {renderIconSvg(`${sizeDimensions.h} w-auto aspect-square shrink-0`)}
        <span
          className={`font-black tracking-[0.18em] leading-none ${sizeDimensions.textSize}`}
          style={{ color: textColor, fontFamily: "'Readex Pro', -apple-system, sans-serif" }}
        >
          ORBIX
        </span>
      </div>
    );
  }

  return (
    <div
      className={`inline-flex items-center ${sizeDimensions.gap} select-none ${className}`}
      dir="ltr"
      style={{ direction: 'ltr' }}
    >
      {renderIconSvg(`${sizeDimensions.h} w-auto aspect-square shrink-0`)}
      <div className="flex flex-col text-left justify-center">
        <span
          className={`font-black tracking-[0.2em] leading-none ${sizeDimensions.textSize}`}
          style={{ color: textColor, fontFamily: "'Readex Pro', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif" }}
        >
          ORBIX
        </span>
      </div>
    </div>
  );
};
