import React from 'react';

interface IconProps {
  size?: number;
  color?: string;
  className?: string;
}

export function SparkleIcon({
  size = 24,
  color = 'currentColor',
  className,
}: IconProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
    >
      <path
        d="M12 2L13.09 8.26L18 6L14.74 10.91L21 12L14.74 13.09L18 18L13.09 15.74L12 22L10.91 15.74L6 18L9.26 13.09L3 12L9.26 10.91L6 6L10.91 8.26L12 2Z"
        fill={color}
      />
    </svg>
  );
}

export function ShareIcon({
  size = 24,
  color = 'currentColor',
  className,
}: IconProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
    >
      <path
        d="M20 12L13 5V9C8 10 5 14 4 19C6.5 15.5 10 13.9 13 13.9V18L20 12Z"
        fill={color}
      />
    </svg>
  );
}

export function AuraSilhouetteIcon({
  size = 24,
  color = 'currentColor',
  className,
}: IconProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 48 48"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
    >
      {/* Round body */}
      <circle cx="24" cy="26" r="16" fill={color} opacity="0.18" />
      {/* Left eye */}
      <ellipse cx="19" cy="24" rx="2.5" ry="3" fill={color} opacity="0.25" />
      {/* Right eye */}
      <ellipse cx="29" cy="24" rx="2.5" ry="3" fill={color} opacity="0.25" />
      {/* Sparkle on top */}
      <path
        d="M24 6L25.2 10.5L29 9L26.3 12.5L30 14L26.3 15.5L29 19L25.2 17.5L24 22L22.8 17.5L19 19L21.7 15.5L18 14L21.7 12.5L19 9L22.8 10.5L24 6Z"
        fill={color}
        opacity="0.15"
      />
    </svg>
  );
}

export function FlameIcon({
  size = 24,
  color = 'var(--primary)',
  className,
}: IconProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
    >
      <path
        d="M12 23C7.03 23 3 18.97 3 14c0-3.21 1.73-6.15 4.5-8.09.36-.25.83.08.74.51-.35 1.7.15 3.48 1.38 4.71.18.18.5.06.5-.2 0-2.07.77-4.05 2.15-5.58C13.92 3.5 15.46 2.3 17.23 1.6c.39-.15.78.23.63.62-.6 1.58-.32 3.37.73 4.67C20.1 8.84 21 11.32 21 14c0 4.97-4.03 9-9 9z"
        fill={color}
      />
      <path
        d="M14.5 18.5c0 1.38-1.12 2.5-2.5 2.5s-2.5-1.12-2.5-2.5c0-1.63 1.51-2.84 2.16-3.31.14-.1.34-.1.48 0 .78.52 2.36 1.74 2.36 3.31z"
        fill="white"
        opacity="0.4"
      />
    </svg>
  );
}

export function RefreshIcon({
  size = 24,
  color = 'currentColor',
  className,
}: IconProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
    >
      <path
        d="M17.65 6.35A7.96 7.96 0 0 0 12 4C7.58 4 4.01 7.58 4.01 12S7.58 20 12 20c3.73 0 6.84-2.55 7.73-6h-2.08A5.99 5.99 0 0 1 12 18c-3.31 0-6-2.69-6-6s2.69-6 6-6c1.66 0 3.14.69 4.22 1.78L13 11h7V4l-2.35 2.35Z"
        fill={color}
      />
    </svg>
  );
}
