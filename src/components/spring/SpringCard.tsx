"use client";

import React, { useState } from "react";
import { useSpring, animated } from "@react-spring/web";

export interface SpringCardProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode;
  className?: string;
  onClick?: (e: React.MouseEvent<HTMLDivElement>) => void;
  scaleOnHover?: number;
  pressScale?: number;
}

export const SpringCard: React.FC<SpringCardProps> = ({
  children,
  className = "",
  onClick,
  scaleOnHover = 1.015,
  pressScale = 0.985,
  ...props
}) => {
  const [isHovered, setIsHovered] = useState(false);
  const [isPressed, setIsPressed] = useState(false);

  const springProps = useSpring({
    transform: isPressed
      ? `scale(${pressScale}) translateY(0px)`
      : isHovered
      ? `scale(${scaleOnHover}) translateY(-2px)`
      : `scale(1) translateY(0px)`,
    boxShadow: isHovered
      ? "0 10px 25px -5px rgba(0, 0, 0, 0.12), 0 8px 10px -6px rgba(0, 0, 0, 0.08)"
      : "0 1px 3px 0 rgba(0, 0, 0, 0.05), 0 1px 2px -1px rgba(0, 0, 0, 0.05)",
    config: {
      tension: 400,
      friction: 22,
    },
  });

  return (
    <animated.div
      style={springProps}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => {
        setIsHovered(false);
        setIsPressed(false);
      }}
      onMouseDown={() => setIsPressed(true)}
      onMouseUp={() => setIsPressed(false)}
      onClick={onClick}
      className={`select-none cursor-pointer ${className}`}
      {...props}
    >
      {children}
    </animated.div>
  );
};
