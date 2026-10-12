"use client";

import React from "react";
import { useSpring, animated } from "@react-spring/web";
import { formatINR } from "@/lib/formatters";

export interface SpringCounterProps {
  value: number;
  isCurrency?: boolean;
  prefix?: string;
  suffix?: string;
  decimals?: number;
  className?: string;
}

export const SpringCounter: React.FC<SpringCounterProps> = ({
  value,
  isCurrency = false,
  prefix = "",
  suffix = "",
  decimals = 0,
  className = "",
}) => {
  const { animatedValue } = useSpring({
    from: { animatedValue: 0 },
    to: { animatedValue: value || 0 },
    config: {
      tension: 180,
      friction: 24,
    },
  });

  return (
    <animated.span className={className}>
      {animatedValue.to((val) => {
        if (isCurrency) {
          return `${prefix}${formatINR(Math.round(val))}${suffix}`;
        }
        const formatted = decimals > 0 ? val.toFixed(decimals) : Math.round(val).toLocaleString();
        return `${prefix}${formatted}${suffix}`;
      })}
    </animated.span>
  );
};
