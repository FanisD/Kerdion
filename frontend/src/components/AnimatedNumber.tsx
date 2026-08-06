"use client";

import { useEffect, useState } from "react";

export function AnimatedNumber({ value, decimals = 4 }: { value: number; decimals?: number }) {
  const [displayValue, setDisplayValue] = useState(value);

  useEffect(() => {
    let startTimestamp: number | null = null;
    const duration = 800; // ms transition
    const startValue = displayValue;
    const endValue = value;

    if (startValue === endValue) return;

    const step = (timestamp: number) => {
      if (!startTimestamp) startTimestamp = timestamp;
      const progress = Math.min((timestamp - startTimestamp) / duration, 1);
      
      // easeOutExpo for dramatic but smooth deceleration
      const easeProgress = progress === 1 ? 1 : 1 - Math.pow(2, -10 * progress);
      
      setDisplayValue(startValue + (endValue - startValue) * easeProgress);
      
      if (progress < 1) {
        window.requestAnimationFrame(step);
      } else {
        setDisplayValue(endValue);
      }
    };

    window.requestAnimationFrame(step);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [value]); 

  return <>{displayValue.toFixed(decimals)}</>;
}
