import React from 'react';

interface LogoProps {
  className?: string;
  variant?: 'color' | 'white';
}

export const MatupiriLogo: React.FC<LogoProps> = ({ className = 'h-10', variant = 'color' }) => {
  const primaryColor = variant === 'white' ? '#FFFFFF' : '#4B0B56'; // Deep purple from Consórcio Matupiri logo
  const dashColor = variant === 'white' ? '#4B0B56' : '#FFFFFF';

  return (
    <svg
      viewBox="0 0 400 180"
      className={className}
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      {/* CONSÓRCIO */}
      <text
        x="20"
        y="32"
        fill={primaryColor}
        fontFamily="system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif"
        fontWeight="800"
        fontSize="24"
        letterSpacing="2"
      >
        CONSÓRCIO
      </text>

      {/* Matupiri */}
      <text
        x="18"
        y="102"
        fill={primaryColor}
        fontFamily="system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif"
        fontWeight="900"
        fontSize="76"
        letterSpacing="-1"
      >
        Matupiri
      </text>

      {/* Road line container */}
      <rect x="18" y="116" width="364" height="14" rx="7" fill={primaryColor} />
      {/* Dashed line inside */}
      <line
        x1="26"
        y1="123"
        x2="374"
        y2="123"
        stroke={dashColor}
        strokeWidth="3"
        strokeDasharray="8 6"
        strokeLinecap="round"
      />

      {/* MODERA ENGENHARIA • SCB BIM & GIS */}
      <text
        x="20"
        y="154"
        fill={primaryColor}
        fontFamily="system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif"
        fontWeight="800"
        fontSize="17.5"
        letterSpacing="0.5"
      >
        MODERA ENGENHARIA • SCB BIM & GIS
      </text>
    </svg>
  );
};
