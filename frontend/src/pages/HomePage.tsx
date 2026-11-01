import React, { useEffect, useRef, useState, useCallback } from "react";
import {
  ArrowRight,
  Calendar,
  Shield,
  BookOpen,
  GraduationCap,
  Sparkles,
  Zap,
  CheckCircle2,
  Clock,
  Users,
  Building2,
  Layers,
  GitBranch,
  Target,
  Activity,
  ChevronDown,
  ExternalLink,
  Award,
  Cpu,
  Database,
  Lock,
  BarChart3,
  FileCheck,
  Bot,
  MousePointer2,
} from "lucide-react";

/* ==========================================================================
   SCROLL-PROGRESS ENGINE — drives all bidirectional animations
   ========================================================================== */

function useScrollProgress() {
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    const onScroll = () => {
      const h = document.documentElement.scrollHeight - window.innerHeight;
      if (h <= 0) { setProgress(0); return; }
      setProgress(Math.min(1, Math.max(0, window.scrollY / h)));
    };
    window.addEventListener("scroll", onScroll, { passive: true });
    onScroll();
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return progress;
}

/* Element-level scroll progress: 0 when element enters viewport bottom,
   1 when it reaches viewport top. Works in both scroll directions. */
function useElementProgress(ref: React.RefObject<Element | null>, offset = 0.2) {
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    const onScroll = () => {
      const rect = el.getBoundingClientRect();
      const windowH = window.innerHeight;
      // raw: 0 when bottom of viewport, 1 when top
      const raw = 1 - (rect.top - windowH * offset) / (windowH * (1 - offset));
      setProgress(Math.min(1, Math.max(0, raw)));
    };

    window.addEventListener("scroll", onScroll, { passive: true });
    onScroll();
    return () => window.removeEventListener("scroll", onScroll);
  }, [ref, offset]);

  return progress;
}

/* Smooth easing function */
function easeOutExpo(t: number): number {
  return t === 1 ? 1 : 1 - Math.pow(2, -10 * t);
}

function easeOutCubic(t: number): number {
  return 1 - Math.pow(1 - t, 3);
}

function clamp(v: number, min: number, max: number) {
  return Math.min(max, Math.max(min, v));
}

/* Map a sub-range [start, end] of progress [0..1] to [0..1] */
function subProgress(p: number, start: number, end: number): number {
  if (end <= start) return 0;
  return clamp((p - start) / (end - start), 0, 1);
}


/* ==========================================================================
   ANIMATED COUNTER COMPONENT
   ========================================================================== */
function AnimatedCounter({ value, suffix = "", prefix = "", label, duration = 2000 }: {
  value: number; suffix?: string; prefix?: string; label: string; duration?: number;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const [count, setCount] = useState(0);
  const [started, setStarted] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const obs = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting && !started) {
          setStarted(true);
          const t0 = performance.now();
          const step = (now: number) => {
            const p = Math.min((now - t0) / duration, 1);
            const eased = easeOutCubic(p);
            setCount(Math.round(eased * value));
            if (p < 1) requestAnimationFrame(step);
          };
          requestAnimationFrame(step);
        }
        if (!entry.isIntersecting && started) {
          setStarted(false);
          setCount(0);
        }
      },
      { threshold: 0.3 }
    );
    obs.observe(el);
    return () => obs.disconnect();
  }, [value, duration, started]);

  return (
    <div ref={ref} className="hp-stat-card">
      <div className="hp-stat-number">
        <span className="hp-stat-prefix">{prefix}</span>
        {count}
        <span className="hp-stat-suffix">{suffix}</span>
      </div>
      <div className="hp-stat-label">{label}</div>
    </div>
  );
}


/* ==========================================================================
   SCROLL-DRIVEN SECTION COMPONENT — bidirectional reveal
   ========================================================================== */
function ScrollSection({ children, className = "", delay = 0 }: {
  children: React.ReactNode; className?: string; delay?: number;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const p = useElementProgress(ref, 0.15);
  const eased = easeOutExpo(clamp((p - delay) * (1 / (1 - delay)), 0, 1));

  return (
    <div
      ref={ref}
      className={className}
      style={{
        opacity: eased,
        transform: `translateY(${(1 - eased) * 60}px)`,
        willChange: "opacity, transform",
        transition: "none",
      }}
    >
      {children}
    </div>
  );
}

/* Word-by-word text reveal */
function WordReveal({ text, className = "", as: tag = "h2" }: {
  text: string; className?: string; as?: string;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const p = useElementProgress(ref, 0.2);
  const words = text.split(" ");

  return React.createElement(
    tag,
    { ref, className: `hp-word-reveal ${className}` },
    words.map((word: string, i: number) => {
      const wordP = easeOutExpo(clamp((p - i * 0.04) * 2.5, 0, 1));
      return (
        <span
          key={i}
          className="hp-word"
          style={{
            opacity: wordP,
            transform: `translateY(${(1 - wordP) * 40}px)`,
            display: "inline-block",
            willChange: "opacity, transform",
          }}
        >
          {word}&nbsp;
        </span>
      );
    })
  );
}


/* ==========================================================================
   ANIMATED SVG CURVE — glowing light trail
   ========================================================================== */
function GlowingCurve({ d, className = "", delay = 0 }: {
  d: string; className?: string; delay?: number;
}) {
  const ref = useRef<SVGSVGElement>(null);
  const p = useElementProgress(ref, 0.1);
  const eased = easeOutCubic(clamp(p * 1.5 - delay, 0, 1));

  return (
    <svg
      ref={ref}
      className={`hp-glow-curve ${className}`}
      viewBox="0 0 1200 200"
      fill="none"
      preserveAspectRatio="none"
    >
      <defs>
        <linearGradient id="curveGrad" x1="0%" y1="0%" x2="100%" y2="0%">
          <stop offset="0%" stopColor="rgba(123,17,35,0)" />
          <stop offset="30%" stopColor="rgba(123,17,35,0.5)" />
          <stop offset="60%" stopColor="rgba(180,83,9,0.4)" />
          <stop offset="100%" stopColor="rgba(123,17,35,0)" />
        </linearGradient>
        <filter id="curveBlur">
          <feGaussianBlur stdDeviation="4" />
        </filter>
      </defs>
      {/* Glow layer */}
      <path
        d={d}
        stroke="url(#curveGrad)"
        strokeWidth="6"
        filter="url(#curveBlur)"
        strokeDasharray="2000"
        strokeDashoffset={2000 - eased * 2000}
        opacity={0.6}
      />
      {/* Sharp line */}
      <path
        d={d}
        stroke="url(#curveGrad)"
        strokeWidth="1.5"
        strokeDasharray="2000"
        strokeDashoffset={2000 - eased * 2000}
      />
    </svg>
  );
}


/* ==========================================================================
   ANIMATED GRID BACKGROUND
   ========================================================================== */
function TechGrid() {
  return (
    <div className="hp-tech-grid" aria-hidden="true">
      <svg width="100%" height="100%" xmlns="http://www.w3.org/2000/svg">
        <defs>
          <pattern id="hpGrid" width="60" height="60" patternUnits="userSpaceOnUse">
            <path d="M 60 0 L 0 0 0 60" fill="none" stroke="rgba(123,17,35,0.04)" strokeWidth="0.5" />
          </pattern>
        </defs>
        <rect width="100%" height="100%" fill="url(#hpGrid)" />
      </svg>
    </div>
  );
}


/* ==========================================================================
   FLOATING PARTICLES
   ========================================================================== */
function Particles() {
  const particles = Array.from({ length: 20 }, (_, i) => ({
    id: i,
    x: Math.random() * 100,
    y: Math.random() * 100,
    size: 2 + Math.random() * 3,
    duration: 15 + Math.random() * 25,
    delay: Math.random() * -20,
  }));

  return (
    <div className="hp-particles" aria-hidden="true">
      {particles.map(p => (
        <div
          key={p.id}
          className="hp-particle"
          style={{
            left: `${p.x}%`,
            top: `${p.y}%`,
            width: `${p.size}px`,
            height: `${p.size}px`,
            animationDuration: `${p.duration}s`,
            animationDelay: `${p.delay}s`,
          }}
        />
      ))}
    </div>
  );
}


/* ==========================================================================
   ANIMATED TECHNICAL LINE DRAWING
   ========================================================================== */
function TechDiagram() {
  const ref = useRef<SVGSVGElement>(null);
  const p = useElementProgress(ref, 0.15);
  const draw = easeOutCubic(p);

  return (
    <svg ref={ref} className="hp-tech-diagram" viewBox="0 0 400 300" fill="none">
      {/* Central node */}
      <circle cx="200" cy="150" r={8 * draw} fill="#7B1123" opacity={draw}>
        <animate attributeName="r" values="6;10;6" dur="3s" repeatCount="indefinite" />
      </circle>
      <circle cx="200" cy="150" r={20 * draw} stroke="rgba(123,17,35,0.2)" strokeWidth="1" fill="none" opacity={draw} />

      {/* Connecting lines to outer nodes */}
      {[
        { x: 60, y: 60, label: "Solver" },
        { x: 340, y: 60, label: "Rooms" },
        { x: 60, y: 240, label: "Faculty" },
        { x: 340, y: 240, label: "NLP" },
        { x: 200, y: 30, label: "Admin" },
        { x: 200, y: 270, label: "Events" },
      ].map((node, i) => {
        const nodeP = easeOutCubic(clamp(draw - i * 0.08, 0, 1));
        return (
          <g key={i} opacity={nodeP}>
            <line
              x1="200" y1="150"
              x2={200 + (node.x - 200) * nodeP}
              y2={150 + (node.y - 150) * nodeP}
              stroke="rgba(123,17,35,0.15)"
              strokeWidth="1"
              strokeDasharray="4 4"
            />
            <circle cx={node.x} cy={node.y} r={5 * nodeP} fill="rgba(123,17,35,0.6)">
              <animate attributeName="opacity" values="0.4;1;0.4" dur={`${2 + i * 0.3}s`} repeatCount="indefinite" />
            </circle>
            <text
              x={node.x}
              y={node.y + 18}
              textAnchor="middle"
              fill="rgba(123,17,35,0.5)"
              fontSize="10"
              fontFamily="monospace"
            >
              {node.label}
            </text>
          </g>
        );
      })}
    </svg>
  );
}


/* ==========================================================================
   PROJECT CARD COMPONENT
   ========================================================================== */
function ProjectCard({ project, index, reversed = false }: {
  project: {
    title: string; tag: string; description: string; features: string[];
    icon: React.ComponentType<{ className?: string }>; accent: string;
  };
  index: number;
  reversed?: boolean;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const p = useElementProgress(ref, 0.12);
  const eased = easeOutExpo(clamp(p * 1.4, 0, 1));
  const Icon = project.icon;

  return (
    <div
      ref={ref}
      className={`hp-project-card ${reversed ? "hp-project-reversed" : ""}`}
      style={{
        opacity: eased,
        transform: `translateX(${(1 - eased) * (reversed ? -80 : 80)}px) translateY(${(1 - eased) * 30}px)`,
        willChange: "opacity, transform",
        "--project-accent": project.accent,
      } as React.CSSProperties}
    >
      {/* Visual Side */}
      <div className="hp-project-visual">
        <div className="hp-project-icon-wrap" style={{ borderColor: project.accent }}>
          <span style={{ color: project.accent, display: "flex" }}><Icon className="hp-project-icon" /></span>
        </div>
        <div className="hp-project-number">{String(index + 1).padStart(2, "0")}</div>
        {/* Decorative orbit */}
        <svg className="hp-project-orbit" viewBox="0 0 200 200">
          <circle cx="100" cy="100" r="70" stroke={project.accent} strokeWidth="0.5" fill="none" strokeDasharray="4 8" opacity="0.3">
            <animateTransform attributeName="transform" type="rotate" from="0 100 100" to="360 100 100" dur="30s" repeatCount="indefinite" />
          </circle>
          <circle cx="100" cy="30" r="3" fill={project.accent} opacity="0.5">
            <animateTransform attributeName="transform" type="rotate" from="0 100 100" to="360 100 100" dur="8s" repeatCount="indefinite" />
          </circle>
        </svg>
      </div>

      {/* Content Side */}
      <div className="hp-project-content">
        <div className="hp-project-tag">{project.tag}</div>
        <h3 className="hp-project-title">{project.title}</h3>
        <p className="hp-project-desc">{project.description}</p>
        <ul className="hp-project-features">
          {project.features.map((f, fi) => (
            <li key={fi} className="hp-project-feature"
              style={{
                opacity: easeOutCubic(clamp((eased - 0.3 - fi * 0.08) * 3, 0, 1)),
                transform: `translateX(${(1 - easeOutCubic(clamp((eased - 0.3 - fi * 0.08) * 3, 0, 1))) * 20}px)`,
              }}
            >
              <CheckCircle2 className="hp-feature-check" />
              <span>{f}</span>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}


/* ==========================================================================
   ROLE CARD FOR ARCHITECTURE SECTION
   ========================================================================== */
function RoleCard({ role, delay }: {
  role: { title: string; desc: string; icon: React.ComponentType<{ className?: string }>; color: string };
  delay: number;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const p = useElementProgress(ref, 0.15);
  const eased = easeOutExpo(clamp((p - delay) * 2, 0, 1));
  const Icon = role.icon;

  return (
    <div
      ref={ref}
      className="hp-role-card"
      style={{
        opacity: eased,
        transform: `translateY(${(1 - eased) * 40}px) scale(${0.9 + eased * 0.1})`,
      }}
    >
      <div className="hp-role-icon" style={{ background: role.color }}>
        <Icon className="w-5 h-5 text-white" />
      </div>
      <h4 className="hp-role-title">{role.title}</h4>
      <p className="hp-role-desc">{role.desc}</p>
    </div>
  );
}


/* ==========================================================================
   MAIN HOMEPAGE COMPONENT
   ========================================================================== */
interface HomePageProps {
  onEnter: () => void;
}

export default function HomePage({ onEnter }: HomePageProps) {
  const scrollProgress = useScrollProgress();
  const heroRef = useRef<HTMLDivElement>(null);
  const heroP = useElementProgress(heroRef, 0);

  // Parallax factor for hero elements
  const heroParallax = heroP * 0.3;

  // Page transition
  const [transitioning, setTransitioning] = useState(false);
  const handleEnter = useCallback(() => {
    setTransitioning(true);
    setTimeout(onEnter, 800);
  }, [onEnter]);

  // Projects data from actual CampusNx9 features
  const projects = [
    {
      title: "Constraint-Satisfaction Timetable Engine",
      tag: "CP-SAT Solver · OR-Tools",
      description:
        "A mathematically rigorous scheduling engine that assigns 189 weekly sessions across 27 rooms, 40 faculty members, and 14 student groups — producing conflict-free timetables with zero hard violations. The solver enforces room-type matching, batch integrity, capacity bounds, lunch-hour protection, and synchronized elective baskets, while minimizing soft penalties like student idle gaps and uneven workload distribution.",
      features: [
        "Zero hard violations guaranteed by constraint propagation",
        "189 sessions × 27 rooms × 8 periods × 5 days search space",
        "Elective basket synchronization across departments",
        "Lunch-hour period 5-6 strictly protected",
      ],
      icon: Cpu,
      accent: "#7B1123",
    },
    {
      title: "Intelligent Disruption Repair",
      tag: "Minimal-Change Rescheduling",
      description:
        "When real-world disruptions occur — a faculty member falls ill, a classroom floods, a new course section is added — the repair engine finds replacement slots with the fewest possible timetable changes. Every proposed modification comes with a clear reason derived from actual data, and nothing is applied until an Admin explicitly approves the diff.",
      features: [
        "Fewest-moves repair strategy preserves schedule stability",
        "Human-readable diff with reasons for every change",
        "Requires Admin approval before any modification takes effect",
        "Handles faculty leave, room closures, and new sessions",
      ],
      icon: GitBranch,
      accent: "#8B3A2F",
    },
    {
      title: "Spectra Fest Venue Booking System",
      tag: "Priority-Based Resource Allocation",
      description:
        "During Spectra cultural week, student clubs compete for the same rooms as regular classes and exams. The booking engine evaluates priority scores, manages approval workflows, suggests alternative slots when conflicts arise, and can displace regular sessions for institute-level events — all while maintaining a transparent audit trail and preventing self-approval of requests.",
      features: [
        "Priority-scored allocation with automatic conflict resolution",
        "Alternative slot recommendations when requested venue is occupied",
        "Cross-role verification blocks self-approval of any request",
        "Institute events can displace regular classes with full audit",
      ],
      icon: Calendar,
      accent: "#B45309",
    },
    {
      title: "41-Exam Midsemester Scheduler",
      tag: "Half-Capacity Room Constraints",
      description:
        "Exam scheduling follows stricter rules than regular timetabling: rooms operate at half their normal capacity to maintain invigilation standards, no student group can have concurrent exams, and the solver distributes papers across available slots to minimize student fatigue. The engine produces a complete, validated exam timetable that respects every hard constraint.",
      features: [
        "Half-capacity room enforcement for exam seating standards",
        "No concurrent exams for any student group",
        "Validated by the official competition validator",
        "Distributes exams to reduce back-to-back papers",
      ],
      icon: GraduationCap,
      accent: "#6B2143",
    },
    {
      title: "Natural Language Scheduling Assistant",
      tag: "Deterministic NLP · English + Hinglish",
      description:
        "Faculty and club representatives submit scheduling requests in plain language — English or Hinglish — as they would over WhatsApp. A deterministic parser extracts intent, time preferences, room requirements, and constraints without any LLM dependency. When phrasing is ambiguous, the system asks follow-up questions rather than guessing, ensuring every interpreted request is traceable to the original text.",
      features: [
        "Parses English and Hinglish natural-language requests",
        "No LLM required — fully deterministic extraction pipeline",
        "Asks clarifying questions for ambiguous input",
        "~82% field-match accuracy on competition dataset",
      ],
      icon: Bot,
      accent: "#4A6741",
    },
  ];

  const roles = [
    {
      title: "Dean's Office",
      desc: "Master timetable solver, disruption approvals, official exports & complete audit authority.",
      icon: Shield,
      color: "rgba(123,17,35,0.85)",
    },
    {
      title: "Dept. Coordinator",
      desc: "Course & lab scheduling, room allocations, instructor workload balancing across the department.",
      icon: BookOpen,
      color: "rgba(180,83,9,0.85)",
    },
    {
      title: "Faculty Member",
      desc: "Personal weekly grid, unavailability declaration, AI-assisted rescheduling requests.",
      icon: GraduationCap,
      color: "rgba(107,33,67,0.85)",
    },
    {
      title: "Club Representative",
      desc: "Spectra venue requests, priority evaluation, availability checks & decision tracking.",
      icon: Sparkles,
      color: "rgba(74,103,65,0.85)",
    },
  ];

  return (
    <div className={`hp-root ${transitioning ? "hp-transitioning" : ""}`}>
      {/* Global background layers */}
      <div className="hp-bg-base" aria-hidden="true" />
      <TechGrid />
      <Particles />

      {/* Ambient light sources */}
      <div className="hp-ambient-light hp-ambient-1" aria-hidden="true"
        style={{ transform: `translate(${scrollProgress * 50}px, ${scrollProgress * -30}px)` }}
      />
      <div className="hp-ambient-light hp-ambient-2" aria-hidden="true"
        style={{ transform: `translate(${scrollProgress * -40}px, ${scrollProgress * 20}px)` }}
      />
      <div className="hp-ambient-light hp-ambient-3" aria-hidden="true"
        style={{ transform: `translate(${scrollProgress * 30}px, ${scrollProgress * 40}px)` }}
      />

      {/* Scroll progress indicator */}
      <div className="hp-scroll-indicator" style={{ transform: `scaleX(${scrollProgress})` }} />

      {/* =====================================================================
          NAVIGATION BAR
          ===================================================================== */}
      <nav className="hp-nav" style={{
        backdropFilter: scrollProgress > 0.02 ? "blur(20px)" : "blur(0px)",
        background: scrollProgress > 0.02 ? "rgba(250,247,242,0.85)" : "transparent",
        borderBottomColor: scrollProgress > 0.02 ? "rgba(232,220,190,0.6)" : "transparent",
      }}>
        <div className="hp-nav-inner">
          <div className="hp-nav-brand">
            <img src="/logo.png" alt="CampusNx9" className="hp-nav-logo" />
            <div className="hp-nav-brand-text">
              <span className="hp-nav-title">Campus<span className="hp-nav-accent">Nx9</span></span>
              <span className="hp-nav-subtitle">Chilika Institute of Technology</span>
            </div>
          </div>
          <div className="hp-nav-actions">
            <span className="hp-nav-badge">
              <span className="hp-nav-badge-dot" />
              System Active
            </span>
            <button className="hp-nav-cta" onClick={handleEnter}>
              Sign In
              <ArrowRight className="w-4 h-4 hp-btn-arrow" />
            </button>
          </div>
        </div>
      </nav>


      {/* =====================================================================
          HERO SECTION
          ===================================================================== */}
      <section className="hp-hero" ref={heroRef}>
        {/* Parallax background crest */}
        <div className="hp-hero-crest" style={{
          transform: `translateY(${heroParallax * 100}px) scale(${1 + heroParallax * 0.3})`,
          opacity: 0.04 + (1 - heroP) * 0.03,
        }}>
          <img src="/cit_crest.png" alt="" aria-hidden="true" />
        </div>

        {/* Glowing curves */}
        <GlowingCurve
          d="M0,100 Q300,20 600,100 T1200,80"
          className="hp-hero-curve-1"
          delay={0}
        />
        <GlowingCurve
          d="M0,150 Q400,200 700,120 T1200,160"
          className="hp-hero-curve-2"
          delay={0.1}
        />

        {/* Hero content */}
        <div className="hp-hero-content">
          <div className="hp-hero-eyebrow"
            style={{
              opacity: easeOutExpo(clamp(heroP * 3, 0, 1)),
              transform: `translateY(${(1 - easeOutExpo(clamp(heroP * 3, 0, 1))) * 20}px)`,
            }}
          >
            <Award className="w-4 h-4" />
            <span>Zero Hard Violations · Mathematically Verified Scheduling</span>
          </div>

          <h1 className="hp-hero-title">
            {["The", "Campus", "Operating", "System"].map((word, i) => {
              const wp = easeOutExpo(clamp((heroP - 0.02 - i * 0.03) * 4, 0, 1));
              return (
                <span key={i} className={`hp-hero-word ${i === 1 ? "hp-hero-word-accent" : ""}`}
                  style={{
                    opacity: wp,
                    transform: `translateY(${(1 - wp) * 80}px)`,
                    display: "inline-block",
                  }}
                >
                  {word}{i < 3 ? "\u00A0" : ""}
                </span>
              );
            })}
          </h1>

          <p className="hp-hero-subtitle"
            style={{
              opacity: easeOutExpo(clamp((heroP - 0.12) * 3, 0, 1)),
              transform: `translateY(${(1 - easeOutExpo(clamp((heroP - 0.12) * 3, 0, 1))) * 30}px)`,
            }}
          >
            CampusNx9 replaces hand-made timetables with a constraint-satisfaction solver
            that schedules 189 sessions across 27 rooms and 40 faculty members — producing
            mathematically verified, conflict-free academic schedules for Chilika Institute of Technology.
          </p>

          <div className="hp-hero-actions"
            style={{
              opacity: easeOutExpo(clamp((heroP - 0.18) * 3, 0, 1)),
              transform: `translateY(${(1 - easeOutExpo(clamp((heroP - 0.18) * 3, 0, 1))) * 25}px)`,
            }}
          >
            <button className="hp-btn-primary" onClick={handleEnter}>
              <span>Enter Platform</span>
              <ArrowRight className="w-5 h-5 hp-btn-arrow" />
            </button>
            <a href="#projects" className="hp-btn-secondary">
              <span>Explore Features</span>
              <ChevronDown className="w-4 h-4" />
            </a>
          </div>

          {/* Scroll indicator */}
          <div className="hp-scroll-hint"
            style={{ opacity: clamp(1 - heroP * 3, 0, 1) }}
          >
            <MousePointer2 className="w-4 h-4" />
            <span>Scroll to explore</span>
            <div className="hp-scroll-hint-line" />
          </div>
        </div>
      </section>


      {/* =====================================================================
          STATISTICS BAR
          ===================================================================== */}
      <section className="hp-stats-section">
        <div className="hp-stats-inner">
          <AnimatedCounter value={189} label="Academic Sessions" suffix="" />
          <AnimatedCounter value={27} label="Campus Rooms" suffix="" />
          <AnimatedCounter value={40} label="Faculty Members" suffix="" />
          <AnimatedCounter value={14} label="Student Groups" suffix="" />
          <AnimatedCounter value={41} label="Midsem Exams" suffix="" />
          <AnimatedCounter value={0} label="Hard Violations" prefix="" suffix="" />
        </div>
      </section>


      {/* =====================================================================
          ABOUT SECTION
          ===================================================================== */}
      <section className="hp-section hp-about-section">
        <div className="hp-section-inner">
          <GlowingCurve
            d="M0,100 Q200,30 500,120 T1200,60"
            className="hp-section-curve"
          />

          <ScrollSection className="hp-about-grid">
            <div className="hp-about-image-wrap">
              <div className="hp-about-image-container">
                <img src="/cit_banner.png" alt="Chilika Institute of Technology Campus" className="hp-about-image" />
                <div className="hp-about-image-overlay" />
                <div className="hp-about-image-badge">
                  <Building2 className="w-4 h-4" />
                  <span>CIT Campus</span>
                </div>
              </div>
            </div>
            <div className="hp-about-content">
              <div className="hp-section-tag">
                <Target className="w-3.5 h-3.5" />
                <span>The Problem We Solve</span>
              </div>
              <WordReveal
                text="Hand-made timetables break. Ours don't."
                className="hp-about-heading"
              />
              <ScrollSection delay={0.1}>
                <p className="hp-about-text">
                  Every semester, academic coordinators spend weeks assembling timetables by hand — only to discover a physics professor scheduled in two rooms simultaneously, a laboratory double-booked during lunch, or an elective basket that forces students to choose between required courses.
                </p>
              </ScrollSection>
              <ScrollSection delay={0.2}>
                <p className="hp-about-text">
                  Mid-semester disruptions compound the problem: a single faculty emergency can cascade through dozens of sessions, and every manual fix risks introducing new conflicts. Event coordinators compete for the same rooms with no systematic way to resolve priority disputes.
                </p>
              </ScrollSection>
              <ScrollSection delay={0.3}>
                <p className="hp-about-text hp-about-highlight">
                  CampusNx9 makes the rules explicit and machine-checked. No invalid schedule is ever accepted, changes disturb as little as possible, and every decision comes with a reason taken from real data.
                </p>
              </ScrollSection>
            </div>
          </ScrollSection>
        </div>
      </section>


      {/* =====================================================================
          PROJECTS SECTION
          ===================================================================== */}
      <section className="hp-section hp-projects-section" id="projects">
        <div className="hp-section-inner">
          <ScrollSection className="hp-section-header">
            <div className="hp-section-tag">
              <Layers className="w-3.5 h-3.5" />
              <span>Platform Capabilities</span>
            </div>
            <WordReveal
              text="Five engines, one verified operating system"
              className="hp-section-heading"
            />
            <p className="hp-section-subheading">
              Each module in CampusNx9 addresses a specific scheduling challenge faced by academic institutions — from initial timetable generation to mid-semester disruption recovery.
            </p>
          </ScrollSection>

          <div className="hp-projects-list">
            {projects.map((project, i) => (
              <React.Fragment key={i}>
                <ProjectCard project={project} index={i} reversed={i % 2 !== 0} />
                {i < projects.length - 1 && (
                  <ScrollSection className="hp-project-divider" delay={0.1}>
                    <div className="hp-project-divider-line" />
                    <div className="hp-project-divider-dot" />
                    <div className="hp-project-divider-line" />
                  </ScrollSection>
                )}
              </React.Fragment>
            ))}
          </div>
        </div>
      </section>


      {/* =====================================================================
          ARCHITECTURE / TECH DIAGRAM SECTION
          ===================================================================== */}
      <section className="hp-section hp-arch-section">
        <div className="hp-section-inner">
          <ScrollSection className="hp-section-header">
            <div className="hp-section-tag">
              <Database className="w-3.5 h-3.5" />
              <span>System Architecture</span>
            </div>
            <WordReveal
              text="Every rule enforced, every decision auditable"
              className="hp-section-heading"
            />
            <p className="hp-section-subheading">
              A clean separation between the React frontend, FastAPI backend with RBAC enforcement, and the independent constraint-satisfaction solvers ensures that no scheduling logic depends on the UI or any LLM.
            </p>
          </ScrollSection>

          <div className="hp-arch-grid">
            <ScrollSection className="hp-arch-diagram-wrap" delay={0.05}>
              <TechDiagram />
              <div className="hp-arch-stack">
                {[
                  { label: "React 18 + TypeScript", sub: "Dashboard & Forms" },
                  { label: "FastAPI + RBAC", sub: "JWT Auth & Permissions" },
                  { label: "OR-Tools CP-SAT", sub: "Constraint Solver Engine" },
                  { label: "SQLite + Pydantic v2", sub: "State & Validation" },
                ].map((item, i) => (
                  <ScrollSection key={i} className="hp-arch-item" delay={0.1 + i * 0.06}>
                    <div className="hp-arch-dot" />
                    <div>
                      <div className="hp-arch-label">{item.label}</div>
                      <div className="hp-arch-sublabel">{item.sub}</div>
                    </div>
                  </ScrollSection>
                ))}
              </div>
            </ScrollSection>

            <ScrollSection className="hp-arch-roles" delay={0.15}>
              <h3 className="hp-arch-roles-title">Role-Based Access Control</h3>
              <p className="hp-arch-roles-desc">
                Four distinct institutional roles with enforced permission boundaries. Nobody can approve their own request — cross-role verification is mandatory.
              </p>
              <div className="hp-roles-grid">
                {roles.map((role, i) => (
                  <RoleCard key={i} role={role} delay={i * 0.06} />
                ))}
              </div>
            </ScrollSection>
          </div>
        </div>
      </section>


      {/* =====================================================================
          CONSTRAINTS SHOWCASE
          ===================================================================== */}
      <section className="hp-section hp-constraints-section">
        <div className="hp-section-inner">
          <ScrollSection className="hp-section-header">
            <div className="hp-section-tag">
              <FileCheck className="w-3.5 h-3.5" />
              <span>Solver Constraints</span>
            </div>
            <WordReveal
              text="Hard rules that never bend. Soft goals that always improve."
              className="hp-section-heading"
            />
          </ScrollSection>

          <div className="hp-constraints-grid">
            <ScrollSection className="hp-constraint-block hp-constraint-hard" delay={0.05}>
              <div className="hp-constraint-header">
                <Lock className="w-5 h-5" />
                <span>Hard Constraints</span>
                <span className="hp-constraint-badge hp-badge-hard">Strictly Enforced</span>
              </div>
              <ul className="hp-constraint-list">
                {[
                  "No faculty double-bookings — one teacher, one room, one slot",
                  "No room overlaps — each venue hosts exactly one session per period",
                  "Batch integrity — student groups cannot be split across locations",
                  "Room type matching — labs in lab rooms, lectures in classrooms",
                  "Capacity bounds — room size meets or exceeds batch enrollment",
                  "Unavailability respected — declared faculty leave is inviolable",
                ].map((rule, i) => (
                  <ScrollSection key={i} as-li className="hp-constraint-item" delay={0.06 + i * 0.04}>
                    <div className="hp-constraint-dot hp-dot-hard" />
                    <span>{rule}</span>
                  </ScrollSection>
                ))}
              </ul>
            </ScrollSection>

            <ScrollSection className="hp-constraint-block hp-constraint-soft" delay={0.1}>
              <div className="hp-constraint-header">
                <BarChart3 className="w-5 h-5" />
                <span>Soft Constraints</span>
                <span className="hp-constraint-badge hp-badge-soft">Penalty Minimized</span>
              </div>
              <ul className="hp-constraint-list">
                {[
                  "Minimize student idle gaps between consecutive classes",
                  "Distribute faculty workload evenly across weekdays",
                  "Accommodate preferred morning or afternoon teaching slots",
                  "Optimize utilization of specialized labs and large auditoriums",
                  "Reduce back-to-back exam papers for student groups",
                  "Preserve schedule continuity during disruption repair",
                ].map((rule, i) => (
                  <ScrollSection key={i} className="hp-constraint-item" delay={0.06 + i * 0.04}>
                    <div className="hp-constraint-dot hp-dot-soft" />
                    <span>{rule}</span>
                  </ScrollSection>
                ))}
              </ul>
            </ScrollSection>
          </div>
        </div>
      </section>


      {/* =====================================================================
          FINAL CTA SECTION
          ===================================================================== */}
      <section className="hp-section hp-final-section">
        <GlowingCurve
          d="M0,60 Q300,180 600,80 T1200,120"
          className="hp-final-curve"
        />
        <div className="hp-final-content">
          <ScrollSection>
            <div className="hp-final-eyebrow">
              <Zap className="w-4 h-4" />
              <span>Ready to experience verified scheduling?</span>
            </div>
          </ScrollSection>

          <WordReveal
            text="Enter CampusNx9"
            className="hp-final-heading"
            as="h2"
          />

          <ScrollSection delay={0.15}>
            <p className="hp-final-text">
              Sign in as any of the four institutional roles — Dean's Office, Department Coordinator,
              Faculty Member, or Club Representative — and explore a fully operational scheduling platform
              where every rule is enforced and every decision is auditable.
            </p>
          </ScrollSection>

          <ScrollSection delay={0.25}>
            <div className="hp-final-actions">
              <button className="hp-btn-final" onClick={handleEnter}>
                <span>Enter the Platform</span>
                <ArrowRight className="w-5 h-5 hp-btn-arrow" />
              </button>
            </div>
          </ScrollSection>

          {/* Floating CIT crest */}
          <div className="hp-final-crest">
            <img src="/cit_crest.png" alt="" aria-hidden="true" />
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="hp-footer">
        <div className="hp-footer-inner">
          <div className="hp-footer-brand">
            <img src="/logo.png" alt="CampusNx9" className="hp-footer-logo" />
            <div>
              <span className="hp-footer-title">Campus<span className="hp-nav-accent">Nx9</span></span>
              <span className="hp-footer-sub">Chilika Institute of Technology</span>
            </div>
          </div>
          <div className="hp-footer-tagline">
            Automated Academic Scheduling
            <span className="hp-footer-sep">·</span>
            Venue Resource Optimization
            <span className="hp-footer-sep">·</span>
            <span className="hp-footer-highlight">Zero Hard Violations</span>
          </div>
          <div className="hp-footer-status">
            <span className="hp-footer-status-dot" />
            <span>System Active</span>
          </div>
        </div>
      </footer>

      {/* Page transition overlay */}
      <div className={`hp-transition-overlay ${transitioning ? "hp-transition-active" : ""}`} />
    </div>
  );
}
