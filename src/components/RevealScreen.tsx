import React, { useEffect, useRef } from 'react';

interface RevealScreenProps {
  name: string;
  auraName: string;
  auraColor: string;
  onRevealComplete: () => void;
}

const RevealScreen: React.FC<RevealScreenProps> = ({
  name,
  auraName,
  auraColor,
  onRevealComplete,
}) => {
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    timerRef.current = setTimeout(() => {
      onRevealComplete();
    }, 2500);

    return () => {
      if (timerRef.current !== null) {
        clearTimeout(timerRef.current);
      }
    };
  }, [onRevealComplete]);

  /** Lighten the aura color for the background tint */
  const bgTint = `${auraColor}15`;

  return (
    <div
      className="reveal-screen min-h-screen flex items-center justify-center relative overflow-hidden"
      style={{
        background: 'var(--bg)',
        transition: 'background 1.2s ease-in-out',
      }}
    >
      {/* Pulsing rings */}
      <div className="reveal-rings absolute inset-0 flex items-center justify-center pointer-events-none">
        {/* Ring 1 - innermost, fastest */}
        <div
          className="reveal-ring reveal-ring-1 absolute rounded-full"
          style={{
            borderColor: auraColor,
          }}
        />
        {/* Ring 2 - middle */}
        <div
          className="reveal-ring reveal-ring-2 absolute rounded-full"
          style={{
            borderColor: auraColor,
          }}
        />
        {/* Ring 3 - outermost, slowest */}
        <div
          className="reveal-ring reveal-ring-3 absolute rounded-full"
          style={{
            borderColor: auraColor,
          }}
        />
      </div>

      {/* Center glow dot */}
      <div
        className="reveal-dot absolute rounded-full"
        style={{
          backgroundColor: auraColor,
          boxShadow: `0 0 40px 20px ${auraColor}66, 0 0 80px 40px ${auraColor}33`,
        }}
      />

      {/* Text overlay */}
      <div className="reveal-text-container relative z-10 flex flex-col items-center gap-3">
        <p
          className="reveal-subtitle font-gmarket text-base tracking-wide"
          style={{ color: '#6B5B8D' }}
        >
          {name}님의 기운은...
        </p>
        <h1
          className="reveal-aura-name font-gmarket font-bold text-3xl"
          style={{ color: auraColor }}
        >
          {auraName}
        </h1>
      </div>
    </div>
  );
};

export default RevealScreen;
