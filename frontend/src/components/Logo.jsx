import React from 'react';

export default function Logo({ size = 38, className = "" }) {
  return (
    <div 
      className={`relative flex items-center justify-center shrink-0 ${className}`}
      style={{ width: size, height: size }}
    >
      <svg
        viewBox="0 0 64 64"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className="w-full h-full drop-shadow-md"
      >
        {/* Shield / Emblem Background */}
        <rect
          x="2"
          y="2"
          width="60"
          height="60"
          rx="12"
          fill="#132419"
          stroke="#34D399"
          strokeWidth="2"
          strokeOpacity="0.5"
        />
        
        {/* Subtle Mountain Relief Grid in Background */}
        <path
          d="M6 46L58 46M6 52L58 52"
          stroke="#2D4A37"
          strokeWidth="1"
          strokeDasharray="2 3"
        />

        {/* Back Himalayan Ridge */}
        <polygon
          points="10,48 26,22 38,36 48,26 56,48"
          fill="#254332"
          opacity="0.9"
        />

        {/* Front Himalayan Peaks */}
        <polygon
          points="6,48 22,20 34,34 22,48"
          fill="#3E654D"
        />
        <polygon
          points="22,20 28,12 36,24 34,34"
          fill="#E5DEC9"
          opacity="0.95"
        />
        <polygon
          points="34,48 44,24 58,48"
          fill="#2C4E3A"
        />
        <polygon
          points="44,24 49,17 53,24"
          fill="#F1EDE2"
        />

        {/* Setu (Bridge & Highway Arc) crossing the valley */}
        <path
          d="M4 44 C 18 36, 46 36, 60 44"
          stroke="#F59E0B"
          strokeWidth="3.5"
          strokeLinecap="round"
        />
        <path
          d="M8 48 C 22 41, 42 41, 56 48"
          stroke="#D97706"
          strokeWidth="1.5"
          strokeDasharray="2 2"
        />

        {/* Bridge Suspension Cables */}
        <line x1="22" y1="38" x2="22" y2="46" stroke="#FBBF24" strokeWidth="1" strokeOpacity="0.8" />
        <line x1="32" y1="36.5" x2="32" y2="45" stroke="#FBBF24" strokeWidth="1" strokeOpacity="0.8" />
        <line x1="42" y1="38" x2="42" y2="46" stroke="#FBBF24" strokeWidth="1" strokeOpacity="0.8" />

        {/* Beacon / Summit Sensor Light */}
        <circle cx="28" cy="12" r="2.5" fill="#34D399" />
        <circle cx="28" cy="12" r="4.5" stroke="#34D399" strokeWidth="1" strokeOpacity="0.6" />
      </svg>
    </div>
  );
}
