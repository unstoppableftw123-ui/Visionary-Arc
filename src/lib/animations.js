/**
 * Animation Utilities
 *
 * Two categories:
 *   1. Framer Motion variant objects (fadeIn, slideInRight, …)
 *   2. React components for CSS text effects (GlitchText, GradientText, …)
 *
 * All text-effect CSS keyframes live in index.css.
 *
 * ── Framer Motion usage ──────────────────────────────────────────────
 * import { motion } from 'framer-motion';
 * import { fadeIn } from '../lib/animations';
 *
 * <motion.div variants={fadeIn} initial="initial" animate="animate" exit="exit">
 *   content
 * </motion.div>
 *
 * ── Text effect component usage ──────────────────────────────────────
 * import { GlitchText, GradientText, TypewriterText, HighlightWord } from '../lib/animations';
 *
 * <h1><GlitchText>My headline</GlitchText></h1>
 * <GradientText as="h2" className="text-4xl">Animated gradient</GradientText>
 * <TypewriterText text="Typed text…" speed={35} delay={400} />
 * <p>The most <HighlightWord>important</HighlightWord> word.</p>
 */

import React, { useState, useEffect, useRef, useCallback } from 'react';

/* ═══════════════════════════════════════════════════════════════
   FRAMER MOTION VARIANT OBJECTS
═══════════════════════════════════════════════════════════════ */

// Fade animation: opacity 0 → 1
export const fadeIn = {
  initial: { opacity: 0 },
  animate: { opacity: 1 },
  exit:    { opacity: 0 },
};

// Slide in from right
export const slideInRight = {
  initial: { x: '100%', opacity: 0 },
  animate: { x: 0,      opacity: 1 },
  exit:    { x: '-100%', opacity: 0 },
};

// Slide in from left
export const slideInLeft = {
  initial: { x: '-100%', opacity: 0 },
  animate: { x: 0,       opacity: 1 },
  exit:    { x: '100%',  opacity: 0 },
};

// Scale up
export const scaleUp = {
  initial: { scale: 0.8, opacity: 0 },
  animate: { scale: 1,   opacity: 1 },
  exit:    { scale: 0.8, opacity: 0 },
};

// Float — gentle up/down
export const float = {
  initial: { y: 0 },
  animate: {
    y: [-10, 10, -10],
    transition: { duration: 3, repeat: Infinity, ease: 'easeInOut' },
  },
};

// Glitch — Framer Motion jitter variant (kept for backward compat)
export const glitch = {
  initial: { x: 0, y: 0 },
  animate: {
    x: [0, -2, 2, -1, 1, 0],
    y: [0,  1, -1,  2, -2, 0],
    transition: { duration: 0.3, repeat: Infinity, repeatDelay: 2, ease: 'easeInOut' },
  },
};

// Stagger container
export const staggerContainer = {
  initial: { opacity: 0 },
  animate: { opacity: 1, transition: { staggerChildren: 0.1 } },
};

// Stagger item
export const staggerItem = {
  initial: { opacity: 0, y: 20 },
  animate: { opacity: 1, y: 0  },
};

// Bounce
export const bounce = {
  initial: { y: 0 },
  animate: {
    y: [0, -20, 0],
    transition: { duration: 0.6, repeat: Infinity, repeatDelay: 1, ease: 'easeOut' },
  },
};

// Pulse
export const pulse = {
  initial: { scale: 1 },
  animate: {
    scale: [1, 1.05, 1],
    transition: { duration: 2, repeat: Infinity, ease: 'easeInOut' },
  },
};

// Common transition presets
export const transitions = {
  smooth: { duration: 0.3, ease: 'easeInOut' },
  bouncy: { type: 'spring', stiffness: 400, damping: 10 },
  slow:   { duration: 0.6, ease: 'easeInOut' },
  fast:   { duration: 0.15, ease: 'easeOut' },
};

/* ═══════════════════════════════════════════════════════════════
   TEXT EFFECT COMPONENTS
   CSS lives in index.css — see the "TEXT EFFECT" sections there.
═══════════════════════════════════════════════════════════════ */

/**
 * GlitchText
 * ──────────
 * Wraps text in a span that triggers a 0.2 s RGB-split / clip-path glitch
 * on hover. Two CSS ::before/::after pseudo-elements carry offset red and
 * blue copies of the text; different clip-path slices reveal each frame.
 *
 * ⚠  children must be a plain string so data-text matches the DOM text.
 *
 * Props:
 *   as        – root element tag (default: 'span')
 *   className – extra Tailwind / CSS classes
 *   children  – string text
 */
export function GlitchText({ children, className = '', as: Tag = 'span' }) {
  const text = typeof children === 'string' ? children : undefined;
  return (
    <Tag
      className={`glitch-text${className ? ` ${className}` : ''}`}
      data-text={text}
    >
      {children}
    </Tag>
  );
}

/**
 * GradientText
 * ────────────
 * Animated violet → indigo → sky gradient applied via background-clip: text.
 * The gradient shifts continuously (5 s loop).
 *
 * Props:
 *   as        – root element tag (default: 'span')
 *   className – extra classes (font-size, weight, etc.)
 *   children  – React children
 */
export function GradientText({ children, className = '', as: Tag = 'span' }) {
  return (
    <Tag className={`gradient-text${className ? ` ${className}` : ''}`}>
      {children}
    </Tag>
  );
}

/**
 * TypewriterText
 * ──────────────
 * Types `text` character-by-character on mount. When complete, a blinking
 * cursor (thin vertical bar matching current text colour) appears at the end.
 * Plays once; does NOT repeat.
 *
 * Props:
 *   text      – string to type
 *   speed     – ms between characters (default: 35)
 *   delay     – ms before typing starts (default: 0)
 *   className – extra classes on the outer span
 *   cursorClassName – extra classes on the cursor span
 */
export function TypewriterText({
  text,
  speed = 35,
  delay = 0,
  className = '',
  cursorClassName = '',
}) {
  const [displayed,  setDisplayed]  = useState('');
  const [done,       setDone]       = useState(false);
  const [started,    setStarted]    = useState(delay === 0);
  const indexRef = useRef(0);

  // Honour the start delay
  useEffect(() => {
    if (delay <= 0) return;
    const t = setTimeout(() => setStarted(true), delay);
    return () => clearTimeout(t);
  }, [delay]);

  // Typing loop — uses a ref for the current index to avoid stale closures
  useEffect(() => {
    if (!started) return;
    if (indexRef.current >= text.length) {
      setDone(true);
      return;
    }

    const t = setTimeout(() => {
      indexRef.current += 1;
      setDisplayed(text.slice(0, indexRef.current));
    }, speed);

    return () => clearTimeout(t);
  }, [displayed, started, text, speed]);

  return (
    <span className={className} aria-label={text}>
      {/* Screen-reader gets the full text immediately via aria-label */}
      <span aria-hidden="true">{displayed}</span>
      {/* Blinking cursor — thin vertical bar */}
      <span
        aria-hidden="true"
        className={cursorClassName}
        style={{
          display:          'inline-block',
          width:            '2px',
          height:           '1.1em',
          backgroundColor:  'currentColor',
          marginLeft:       '1px',
          verticalAlign:    'text-bottom',
          borderRadius:     '1px',
          animation:        done
            ? 'cursor-blink 1.1s step-start infinite'
            : 'none',
          opacity:          done ? undefined : 1,
        }}
      />
    </span>
  );
}

/**
 * HighlightWord
 * ─────────────
 * Draws an amber highlight "stripe" beneath key words as they scroll into view.
 * Uses IntersectionObserver (fires once) to add the `.revealed` class, which
 * triggers the CSS scaleX(0→1) animation on the ::after pseudo-element.
 *
 * Props:
 *   children  – React children (text or elements)
 *   className – extra classes
 *   threshold – IntersectionObserver threshold 0–1 (default: 0.6)
 *   delay     – animation-delay in ms (default: 0, stagger multiple words)
 */
export function HighlightWord({ children, className = '', threshold = 0.6, delay = 0 }) {
  const ref      = useRef(null);
  const [revealed, setRevealed] = useState(false);

  const observe = useCallback(() => {
    const el = ref.current;
    if (!el) return;
    const obs = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setRevealed(true);
          obs.disconnect();
        }
      },
      { threshold }
    );
    obs.observe(el);
    return () => obs.disconnect();
  }, [threshold]);

  useEffect(observe, [observe]);

  return (
    <span
      ref={ref}
      className={`highlight-word${revealed ? ' revealed' : ''}${className ? ` ${className}` : ''}`}
      style={delay ? { '--highlight-delay': `${delay}ms` } : undefined}
    >
      {children}
    </span>
  );
}
