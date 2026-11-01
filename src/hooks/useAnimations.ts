import { useEffect, useRef, useState, useCallback } from "react";

/* ==========================================================================
   useScrollReveal — Intersection Observer hook for scroll-triggered reveals
   ========================================================================== */
export function useScrollReveal(
  options: { threshold?: number; rootMargin?: string; once?: boolean } = {}
) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    const { threshold = 0.15, rootMargin = "0px 0px -40px 0px", once = true } = options;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          el.classList.add("revealed");
          if (once) observer.unobserve(el);
        } else if (!once) {
          el.classList.remove("revealed");
        }
      },
      { threshold, rootMargin }
    );

    observer.observe(el);
    return () => observer.disconnect();
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  return ref;
}

/* ==========================================================================
   useStaggerReveal — Reveals children with stagger delays
   ========================================================================== */
export function useStaggerReveal(
  options: { threshold?: number; rootMargin?: string } = {}
) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    const { threshold = 0.1, rootMargin = "0px 0px -30px 0px" } = options;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          const children = el.querySelectorAll(".reveal, .reveal-left, .reveal-right, .reveal-scale");
          children.forEach((child) => child.classList.add("revealed"));
          observer.unobserve(el);
        }
      },
      { threshold, rootMargin }
    );

    observer.observe(el);
    return () => observer.disconnect();
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  return ref;
}

/* ==========================================================================
   useCountUp — Animated counter hook
   ========================================================================== */
export function useCountUp(
  target: number,
  options: { duration?: number; startOnMount?: boolean } = {}
) {
  const [count, setCount] = useState(0);
  const [started, setStarted] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  const { duration = 1800 } = options;

  const start = useCallback(() => {
    if (started) return;
    setStarted(true);

    const startTime = performance.now();
    const step = (now: number) => {
      const elapsed = now - startTime;
      const progress = Math.min(elapsed / duration, 1);
      // ease-out cubic
      const eased = 1 - Math.pow(1 - progress, 3);
      setCount(Math.round(eased * target));
      if (progress < 1) requestAnimationFrame(step);
    };
    requestAnimationFrame(step);
  }, [target, duration, started]);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          start();
          observer.unobserve(el);
        }
      },
      { threshold: 0.3 }
    );

    observer.observe(el);
    return () => observer.disconnect();
  }, [start]);

  return { count, ref };
}

/* ==========================================================================
   useCursorGlow — Custom cursor effect for desktop
   ========================================================================== */
export function useCursorGlow() {
  const glowRef = useRef<HTMLDivElement>(null);
  const dotRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // Only on devices with fine pointer (desktop)
    if (!window.matchMedia("(hover: hover) and (pointer: fine)").matches) return;

    const glow = glowRef.current;
    const dot = dotRef.current;
    if (!glow || !dot) return;

    let mouseX = -100;
    let mouseY = -100;
    let glowX = -100;
    let glowY = -100;

    const handleMove = (e: MouseEvent) => {
      mouseX = e.clientX;
      mouseY = e.clientY;
      dot.style.left = `${mouseX}px`;
      dot.style.top = `${mouseY}px`;

      // Check if hovering over interactive element
      const target = e.target as HTMLElement;
      const isInteractive = target.closest("button, a, input, select, textarea, [role='button'], label");
      if (isInteractive) {
        glow.classList.add("hovering");
      } else {
        glow.classList.remove("hovering");
      }
    };

    const animate = () => {
      glowX += (mouseX - glowX) * 0.15;
      glowY += (mouseY - glowY) * 0.15;
      glow.style.left = `${glowX}px`;
      glow.style.top = `${glowY}px`;
      requestAnimationFrame(animate);
    };

    document.addEventListener("mousemove", handleMove);
    const frameId = requestAnimationFrame(animate);

    return () => {
      document.removeEventListener("mousemove", handleMove);
      cancelAnimationFrame(frameId);
    };
  }, []);

  return { glowRef, dotRef };
}
