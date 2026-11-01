import React, { useEffect, useRef } from "react";

/**
 * DecorativeLines — Animated SVG connecting lines with glowing nodes
 * Used for visual hierarchy between sections and feature cards.
 */
interface DecorativeLinesProps {
  variant?: "vertical" | "horizontal" | "corner";
  height?: number;
  className?: string;
}

export function DecorativeLineV({
  height = 60,
  className = "",
}: {
  height?: number;
  className?: string;
}) {
  const ref = useRef<SVGSVGElement>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          el.classList.add("animate-in");
          observer.unobserve(el);
        }
      },
      { threshold: 0.5 }
    );

    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  return (
    <div className={`flex flex-col items-center ${className}`}>
      <div className="node-dot-sm" />
      <svg
        ref={ref}
        width="2"
        height={height}
        className="opacity-0 transition-opacity duration-700"
        style={{ opacity: 0 }}
      >
        <line
          x1="1"
          y1="0"
          x2="1"
          y2={height}
          stroke="rgba(123,17,35,0.15)"
          strokeWidth="1"
          strokeDasharray={height}
          strokeDashoffset={height}
          style={{
            transition: "stroke-dashoffset 1s cubic-bezier(0.19,1,0.22,1) 0.2s",
          }}
        />
      </svg>
      <div className="node-dot-sm" />
      <style>{`
        svg.animate-in { opacity: 1 !important; }
        svg.animate-in line { stroke-dashoffset: 0 !important; }
      `}</style>
    </div>
  );
}

export function DecorativeLineH({
  width = 120,
  className = "",
}: {
  width?: number;
  className?: string;
}) {
  const ref = useRef<SVGSVGElement>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          el.classList.add("animate-in");
          observer.unobserve(el);
        }
      },
      { threshold: 0.5 }
    );

    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  return (
    <div className={`flex items-center gap-0 ${className}`}>
      <div className="node-dot-sm" />
      <svg
        ref={ref}
        width={width}
        height="2"
        className="opacity-0 transition-opacity duration-700"
        style={{ opacity: 0 }}
      >
        <line
          x1="0"
          y1="1"
          x2={width}
          y2="1"
          stroke="rgba(123,17,35,0.15)"
          strokeWidth="1"
          strokeDasharray={width}
          strokeDashoffset={width}
          style={{
            transition: "stroke-dashoffset 1s cubic-bezier(0.19,1,0.22,1) 0.2s",
          }}
        />
      </svg>
      <div className="node-dot-sm" />
      <style>{`
        svg.animate-in { opacity: 1 !important; }
        svg.animate-in line { stroke-dashoffset: 0 !important; }
      `}</style>
    </div>
  );
}

/**
 * AnimatedGeometry — Decorative geometric shapes with subtle animation
 */
export function AnimatedGeometry({ className = "" }: { className?: string }) {
  return (
    <div
      aria-hidden="true"
      className={`absolute pointer-events-none ${className}`}
      style={{ opacity: 0.06 }}
    >
      <svg width="200" height="200" viewBox="0 0 200 200" fill="none">
        <circle
          cx="100"
          cy="100"
          r="80"
          stroke="rgba(123,17,35,0.3)"
          strokeWidth="0.5"
          strokeDasharray="4 8"
          style={{ animation: "spin-slow 60s linear infinite" }}
        />
        <circle
          cx="100"
          cy="100"
          r="55"
          stroke="rgba(180,83,9,0.2)"
          strokeWidth="0.5"
          strokeDasharray="2 6"
          style={{ animation: "spin-slow 45s linear infinite reverse" }}
        />
        <circle
          cx="100"
          cy="100"
          r="30"
          stroke="rgba(123,17,35,0.15)"
          strokeWidth="0.5"
        />
        {/* Corner crosses */}
        {[
          [20, 20],
          [180, 20],
          [20, 180],
          [180, 180],
        ].map(([x, y], i) => (
          <g key={i}>
            <line
              x1={x - 4}
              y1={y}
              x2={x + 4}
              y2={y}
              stroke="rgba(123,17,35,0.2)"
              strokeWidth="0.5"
            />
            <line
              x1={x}
              y1={y - 4}
              x2={x}
              y2={y + 4}
              stroke="rgba(123,17,35,0.2)"
              strokeWidth="0.5"
            />
          </g>
        ))}
      </svg>
    </div>
  );
}
