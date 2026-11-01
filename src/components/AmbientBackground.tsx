import React from "react";

/**
 * AmbientBackground — Premium atmospheric lighting with animated glowing orbs,
 * subtle grid pattern, and layered depth using the CIT Maroon/Amber brand palette.
 *
 * Variants:
 * - "hero" : Stronger, larger orbs for login/hero pages
 * - "subtle" : Lighter ambient for dashboard/internal pages
 * - "dark" : For dark-background sections (navbar area)
 */
interface AmbientBackgroundProps {
  variant?: "hero" | "subtle" | "dark";
  showGrid?: boolean;
  className?: string;
}

export default function AmbientBackground({
  variant = "subtle",
  showGrid = false,
  className = "",
}: AmbientBackgroundProps) {
  const isHero = variant === "hero";

  return (
    <div
      aria-hidden="true"
      className={`absolute inset-0 overflow-hidden pointer-events-none ${className}`}
    >
      {/* Primary maroon glow — top-right */}
      <div
        className="ambient-orb ambient-orb-primary"
        style={{
          width: isHero ? "600px" : "400px",
          height: isHero ? "600px" : "400px",
          top: isHero ? "-15%" : "-10%",
          right: isHero ? "-10%" : "-5%",
          opacity: isHero ? 0.6 : 0.35,
        }}
      />

      {/* Secondary amber glow — bottom-left */}
      <div
        className="ambient-orb ambient-orb-secondary"
        style={{
          width: isHero ? "500px" : "350px",
          height: isHero ? "500px" : "350px",
          bottom: isHero ? "-12%" : "-8%",
          left: isHero ? "-8%" : "-5%",
          opacity: isHero ? 0.5 : 0.3,
        }}
      />

      {/* Warm accent glow — center-right */}
      <div
        className="ambient-orb ambient-orb-warm"
        style={{
          width: isHero ? "420px" : "280px",
          height: isHero ? "420px" : "280px",
          top: "45%",
          right: isHero ? "15%" : "10%",
          opacity: isHero ? 0.4 : 0.2,
        }}
      />

      {/* Extra maroon glow — top-left (hero only) */}
      {isHero && (
        <div
          className="ambient-orb"
          style={{
            width: "350px",
            height: "350px",
            top: "20%",
            left: "5%",
            opacity: 0.25,
            background: "radial-gradient(circle, rgba(123,17,35,0.08) 0%, transparent 70%)",
            filter: "blur(80px)",
            animation: "float-reverse 22s cubic-bezier(0.25,0.46,0.45,0.94) infinite",
            animationDelay: "-4s",
          }}
        />
      )}

      {/* Decorative grid pattern overlay */}
      {showGrid && (
        <div
          className="absolute inset-0 grid-pattern"
          style={{ opacity: 0.4 }}
        />
      )}

      {/* Subtle vignette for depth */}
      <div
        className="absolute inset-0"
        style={{
          background: `radial-gradient(ellipse at center, transparent 50%, ${
            variant === "dark" ? "rgba(15,23,42,0.3)" : "rgba(250,247,242,0.4)"
          } 100%)`,
        }}
      />
    </div>
  );
}
