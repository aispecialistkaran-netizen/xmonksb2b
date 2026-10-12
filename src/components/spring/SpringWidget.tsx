"use client";

import React, { useRef, useState } from "react";
import { useSpring, animated } from "@react-spring/web";

export interface SpringWidgetProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode;
  enableTilt?: boolean;
  delay?: number;
  className?: string;
  glowColor?: string;
}

export const SpringWidget: React.FC<SpringWidgetProps> = ({
  children,
  enableTilt = true,
  delay = 0,
  className = "",
  glowColor = "rgba(99, 102, 241, 0.15)",
  ...props
}) => {
  const cardRef = useRef<HTMLDivElement>(null);
  const [isHovered, setIsHovered] = useState(false);

  // Mount animation + 3D Tilt spring
  const [springProps, api] = useSpring(() => ({
    from: {
      opacity: 0,
      transform: "perspective(1000px) rotateX(8deg) rotateY(0deg) scale(0.97) translateY(12px)",
    },
    to: {
      opacity: 1,
      transform: "perspective(1000px) rotateX(0deg) rotateY(0deg) scale(1) translateY(0px)",
    },
    delay,
    config: {
      tension: 280,
      friction: 22,
    },
  }));

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!enableTilt || !cardRef.current) return;
    const rect = cardRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    const centerX = rect.width / 2;
    const centerY = rect.height / 2;

    // Calculate subtle tilt angle (-4 deg to +4 deg)
    const rotateX = ((centerY - y) / centerY) * 3.5;
    const rotateY = ((x - centerX) / centerX) * 3.5;

    api.start({
      transform: `perspective(1000px) rotateX(${rotateX}deg) rotateY(${rotateY}deg) scale(1.015) translateY(-2px)`,
      config: { tension: 350, friction: 20 },
    });
  };

  const handleMouseEnter = () => {
    setIsHovered(true);
  };

  const handleMouseLeave = () => {
    setIsHovered(false);
    api.start({
      transform: "perspective(1000px) rotateX(0deg) rotateY(0deg) scale(1) translateY(0px)",
      config: { tension: 300, friction: 20 },
    });
  };

  return (
    <animated.div
      ref={cardRef}
      style={springProps}
      onMouseMove={handleMouseMove}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      className={`relative transition-shadow duration-300 ${
        isHovered ? "shadow-xl" : "shadow-sm"
      } ${className}`}
      {...props}
    >
      {children}
    </animated.div>
  );
};
