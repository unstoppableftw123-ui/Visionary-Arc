/** @type {import('tailwindcss').Config} */
module.exports = {
  darkMode: ["class"],
  content: [
    "./src/**/*.{js,jsx,ts,tsx}",
    "./public/index.html"
  ],
  theme: {
    extend: {
      fontFamily: {
        sans:    ['DM Sans', 'sans-serif'],
        heading: ['var(--font-heading)', 'serif'],
        display: ['var(--font-display)', 'serif'],
        mono:    ['DM Mono', 'monospace'],
        'hub-sans': ['DM Sans', 'sans-serif'],
        'hub-mono': ['DM Mono', 'monospace'],
      },
      colors: {
        border:      "hsl(var(--border))",
        input:       "hsl(var(--input))",
        ring:        "hsl(var(--ring))",
        background:  "hsl(var(--background))",
        foreground:  "hsl(var(--foreground))",
        primary: {
          DEFAULT:    "hsl(var(--primary))",
          foreground: "hsl(var(--primary-foreground))",
        },
        secondary: {
          DEFAULT:    "hsl(var(--secondary))",
          foreground: "hsl(var(--secondary-foreground))",
        },
        destructive: {
          DEFAULT:    "hsl(var(--destructive))",
          foreground: "hsl(var(--destructive-foreground))",
        },
        muted: {
          DEFAULT:    "hsl(var(--muted))",
          foreground: "hsl(var(--muted-foreground))",
        },
        accent: {
          DEFAULT:    "hsl(var(--accent))",
          foreground: "hsl(var(--accent-foreground))",
        },
        popover: {
          DEFAULT:    "hsl(var(--popover))",
          foreground: "hsl(var(--popover-foreground))",
        },
        card: {
          DEFAULT:    "hsl(var(--card))",
          foreground: "hsl(var(--card-foreground))",
        },
        chart: {
          1: "hsl(var(--chart-1))",
          2: "hsl(var(--chart-2))",
          3: "hsl(var(--chart-3))",
          4: "hsl(var(--chart-4))",
          5: "hsl(var(--chart-5))",
        },
        brand: {
          orange:  '#e8722a',
          deep:    '#d45a1a',
          brown:   '#6b4226',
          tan:     '#c4a882',
          cream:   '#ede0cc',
          muted:   '#a08060',
          dim:     '#5a3e28',
          bg:      '#0e0a07',
          surface: '#150f09',
          card:    '#1e1510',
          border:  '#3d2518',
        },
        hub: {
          bg: "var(--hub-bg)",
          surface: "var(--hub-surface)",
          elevated: "var(--hub-elevated)",
          border: "var(--hub-border)",
          accent: "var(--hub-accent)",
          accentGlow: "var(--hub-accent-glow)",
          text: "var(--hub-text)",
          muted: "var(--hub-muted)",
          dimmed: "var(--hub-dimmed)",
          success: "var(--hub-success)",
          error: "var(--hub-error)",
        },
      },
      borderRadius: {
        sm: "8px",
        md: "14px",
        lg: "18px",
        xl: "24px",
        "2xl": "var(--radius-xl)",
        full: "9999px",
        DEFAULT: "var(--radius)",
      },
      boxShadow: {
        rest: "var(--shadow-rest)",
        hover: "var(--shadow-hover)",
        glow: "var(--shadow-glow)",
        "accent-glow": "var(--shadow-accent-glow)",
      },
      transitionProperty: {
        lift: "transform, box-shadow",
      },
      perspective: {
        1000: "1000px",
      },

      /* ── Custom easing curves ── */
      transitionTimingFunction: {
        /* Overshoot spring — used for bouncy entrances */
        spring:     "cubic-bezier(0.34, 1.56, 0.64, 1)",
        /* Smooth deceleration — used for exits */
        "out-expo": "cubic-bezier(0.16, 1, 0.3, 1)",
      },

      keyframes: {
        /* Accordion */
        "accordion-down": {
          from: { height: "0" },
          to:   { height: "var(--radix-accordion-content-height)" },
        },
        "accordion-up": {
          from: { height: "var(--radix-accordion-content-height)" },
          to:   { height: "0" },
        },

        /* Skeleton shimmer */
        "skeleton-pulse": {
          "0%, 100%": { opacity: "1"    },
          "50%":       { opacity: "0.45" },
        },

        /* Tab content crossfade (fade + rise) */
        "tab-in": {
          from: { opacity: "0", transform: "translateY(5px)" },
          to:   { opacity: "1", transform: "translateY(0)"   },
        },

        /* Icon bounce on click (spring overshoot) */
        "icon-bounce": {
          "0%":   { transform: "scale(1)"    },
          "30%":  { transform: "scale(0.78)" },
          "60%":  { transform: "scale(1.2)"  },
          "80%":  { transform: "scale(0.95)" },
          "100%": { transform: "scale(1)"    },
        },

        /* Input shake on invalid submit */
        "shake": {
          "0%, 100%": { transform: "translateX(0)"   },
          "20%":       { transform: "translateX(-5px)" },
          "40%":       { transform: "translateX(5px)"  },
          "60%":       { transform: "translateX(-3px)" },
          "80%":       { transform: "translateX(3px)"  },
        },

        /* Checkmark pop-in on selection */
        "check-pop": {
          from: { transform: "scale(0) rotate(-15deg)", opacity: "0" },
          to:   { transform: "scale(1) rotate(0deg)",   opacity: "1" },
        },
        "pulse-dot": {
          "0%, 100%": { opacity: "1", boxShadow: "0 0 0 0 rgba(124, 109, 240, 0.4)" },
          "50%": { opacity: "0.85", boxShadow: "0 0 0 6px rgba(124, 109, 240, 0)" },
        },
      },

      animation: {
        "accordion-down":  "accordion-down 0.2s ease-out",
        "accordion-up":    "accordion-up 0.2s ease-out",
        "skeleton-pulse":  "skeleton-pulse 1.6s ease-in-out infinite",
        "tab-in":          "tab-in 0.22s cubic-bezier(0.16, 1, 0.3, 1) both",
        "icon-bounce":     "icon-bounce 0.28s cubic-bezier(0.34, 1.56, 0.64, 1) forwards",
        "shake":           "shake 0.38s cubic-bezier(0.36, 0.07, 0.19, 0.97) both",
        "check-pop":       "check-pop 0.18s cubic-bezier(0.34, 1.56, 0.64, 1) both",
        "pulse-dot":       "pulse-dot 2s ease-in-out infinite",
      },
    },
  },
  plugins: [require("tailwindcss-animate")],
}
