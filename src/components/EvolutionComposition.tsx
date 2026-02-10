import React, { useState } from 'react';
import { AbsoluteFill, useCurrentFrame, interpolate } from 'remotion';

interface EvolutionProps {
  oldImageSrc: string;
  newImageSrc: string;
  oldEmoji: string;
  newEmoji: string;
  themeColor: string;
  newStageName: string;
  mascotName: string;
}

export const EVOLUTION_DURATION = 150; // 5 seconds at 30fps
export const EVOLUTION_FPS = 30;

function FallbackImage({
  src,
  emoji,
  size,
  style,
}: {
  src: string;
  emoji: string;
  size: number;
  style: React.CSSProperties;
}) {
  const [error, setError] = useState(false);
  if (error) {
    return (
      <div
        style={{
          ...style,
          width: size,
          height: size,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontSize: size * 0.5,
        }}
      >
        {emoji}
      </div>
    );
  }
  return (
    <img
      src={src}
      alt=""
      onError={() => setError(true)}
      style={{ ...style, width: size, height: size, objectFit: 'contain' }}
    />
  );
}

export const EvolutionComposition: React.FC<EvolutionProps> = ({
  oldImageSrc,
  newImageSrc,
  oldEmoji,
  newEmoji,
  themeColor,
  newStageName,
  mascotName,
}) => {
  const frame = useCurrentFrame();

  // Phase 1: Old mascot visible then shrinks (0-40)
  const oldScale = interpolate(frame, [0, 20, 40], [1, 1, 0], {
    extrapolateRight: 'clamp',
  });
  const oldOpacity = interpolate(frame, [20, 40], [1, 0], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });

  // Phase 2: Flash burst (35-65)
  const flashOpacity = interpolate(frame, [35, 42, 52, 65], [0, 1, 1, 0], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });

  // Phase 3: New mascot grows with bounce (55-95)
  const newScale = interpolate(frame, [55, 72, 82, 90], [0, 1.3, 0.9, 1], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });
  const newOpacity = interpolate(frame, [55, 65], [0, 1], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });

  // Glow ring pulsing (55-150)
  const ringScale = interpolate(frame, [55, 80, 100, 120, 150], [0.3, 1.1, 0.95, 1.05, 1], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });
  const ringOpacity = interpolate(frame, [55, 70, 130, 150], [0, 0.7, 0.5, 0.3], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });

  // Text fade in (85-150)
  const textOpacity = interpolate(frame, [85, 105], [0, 1], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });
  const textY = interpolate(frame, [85, 105], [30, 0], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });

  // Particles bursting outward (35-100)
  const particles = Array.from({ length: 16 }).map((_, i) => {
    const angle = (i / 16) * Math.PI * 2;
    const delay = 35 + (i % 4) * 3;
    const progress = interpolate(frame, [delay, delay + 40], [0, 1], {
      extrapolateLeft: 'clamp',
      extrapolateRight: 'clamp',
    });
    const opacity = interpolate(frame, [delay, delay + 15, delay + 40], [0, 1, 0], {
      extrapolateLeft: 'clamp',
      extrapolateRight: 'clamp',
    });
    const distance = progress * 140;
    const size = 3 + (i % 4) * 2.5;
    return {
      x: Math.cos(angle) * distance,
      y: Math.sin(angle) * distance,
      opacity,
      size,
    };
  });

  // Sparkle dots floating around new mascot (70-150)
  const sparkles = Array.from({ length: 8 }).map((_, i) => {
    const angle = (i / 8) * Math.PI * 2 + frame * 0.02;
    const radius = 80 + Math.sin(frame * 0.05 + i) * 15;
    const opacity = interpolate(frame, [70 + i * 3, 85 + i * 3, 140, 150], [0, 0.8, 0.8, 0], {
      extrapolateLeft: 'clamp',
      extrapolateRight: 'clamp',
    });
    return {
      x: Math.cos(angle) * radius,
      y: Math.sin(angle) * radius,
      opacity,
    };
  });

  return (
    <AbsoluteFill
      style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        fontFamily: 'GmarketSans, sans-serif',
      }}
    >
      {/* Outer glow ring */}
      <div
        style={{
          position: 'absolute',
          width: 260,
          height: 260,
          borderRadius: '50%',
          background: `${themeColor}25`,
          boxShadow: `0 0 80px 40px ${themeColor}30, 0 0 120px 60px ${themeColor}15`,
          transform: `scale(${ringScale})`,
          opacity: ringOpacity,
        }}
      />

      {/* Burst particles */}
      {particles.map((p, i) => (
        <div
          key={`p${i}`}
          style={{
            position: 'absolute',
            width: p.size,
            height: p.size,
            borderRadius: '50%',
            background: i % 2 === 0 ? themeColor : 'white',
            transform: `translate(${p.x}px, ${p.y}px)`,
            opacity: p.opacity,
            boxShadow: `0 0 ${p.size * 2}px ${themeColor}`,
          }}
        />
      ))}

      {/* Sparkles orbiting */}
      {sparkles.map((s, i) => (
        <div
          key={`s${i}`}
          style={{
            position: 'absolute',
            width: 4,
            height: 4,
            borderRadius: '50%',
            background: 'white',
            transform: `translate(${s.x}px, ${s.y}px)`,
            opacity: s.opacity,
            boxShadow: `0 0 6px 2px white`,
          }}
        />
      ))}

      {/* Old mascot */}
      {frame < 55 && (
        <FallbackImage
          src={oldImageSrc}
          emoji={oldEmoji}
          size={120}
          style={{
            position: 'absolute',
            transform: `scale(${oldScale})`,
            opacity: oldOpacity,
          }}
        />
      )}

      {/* Flash */}
      <div
        style={{
          position: 'absolute',
          width: 350,
          height: 350,
          borderRadius: '50%',
          background: `radial-gradient(circle, white 0%, ${themeColor}80 30%, ${themeColor}30 60%, transparent 80%)`,
          opacity: flashOpacity,
        }}
      />

      {/* New mascot */}
      {frame >= 55 && (
        <FallbackImage
          src={newImageSrc}
          emoji={newEmoji}
          size={160}
          style={{
            position: 'absolute',
            transform: `scale(${newScale})`,
            opacity: newOpacity,
            filter: `drop-shadow(0 0 20px ${themeColor}60)`,
          }}
        />
      )}

      {/* Text */}
      <div
        style={{
          position: 'absolute',
          bottom: 30,
          textAlign: 'center',
          opacity: textOpacity,
          transform: `translateY(${textY}px)`,
          width: '100%',
          padding: '0 20px',
        }}
      >
        <div
          style={{
            fontSize: 22,
            fontWeight: 'bold',
            color: 'white',
            marginBottom: 8,
            textShadow: `0 0 20px ${themeColor}, 0 2px 4px rgba(0,0,0,0.3)`,
          }}
        >
          {mascotName}이가 진화했어요!
        </div>
        <div
          style={{
            fontSize: 14,
            color: 'rgba(255, 255, 255, 0.8)',
            textShadow: '0 1px 3px rgba(0,0,0,0.3)',
          }}
        >
          {newStageName} 단계에 도달했습니다
        </div>
      </div>
    </AbsoluteFill>
  );
};
