/** @type {import('tailwindcss').Config} */
module.exports = {
  darkMode: ["class"],
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        // Wingman design tokens (design.md §2)
        ink: '#121009',
        surface: '#1B1712',
        'surface-2': '#241E17',
        hairline: 'rgba(239, 231, 213, 0.09)',
        cream: {
          DEFAULT: '#F0E7D3',
          dim: '#A89C87',
          faint: '#6E6557',
        },
        amber: {
          DEFAULT: '#D08C46',
          bright: '#EBB26B',
        },
        copper: '#B4683B',
        wine: '#9E4A38',
        sage: '#8FA382',
        glow: 'rgba(235, 178, 107, 0.14)',
        // shadcn tokens
        border: "hsl(var(--border))",
        input: "hsl(var(--input))",
        ring: "hsl(var(--ring))",
        background: "hsl(var(--background))",
        foreground: "hsl(var(--foreground))",
        primary: {
          DEFAULT: "hsl(var(--primary))",
          foreground: "hsl(var(--primary-foreground))",
        },
        secondary: {
          DEFAULT: "hsl(var(--secondary))",
          foreground: "hsl(var(--secondary-foreground))",
        },
        destructive: {
          DEFAULT: "hsl(var(--destructive) / <alpha-value>)",
          foreground: "hsl(var(--destructive-foreground) / <alpha-value>)",
        },
        muted: {
          DEFAULT: "hsl(var(--muted))",
          foreground: "hsl(var(--muted-foreground))",
        },
        accent: {
          DEFAULT: "hsl(var(--accent))",
          foreground: "hsl(var(--accent-foreground))",
        },
        popover: {
          DEFAULT: "hsl(var(--popover))",
          foreground: "hsl(var(--popover-foreground))",
        },
        card: {
          DEFAULT: "hsl(var(--card))",
          foreground: "hsl(var(--card-foreground))",
        },
        sidebar: {
          DEFAULT: "hsl(var(--sidebar-background))",
          foreground: "hsl(var(--sidebar-foreground))",
          primary: "hsl(var(--sidebar-primary))",
          "primary-foreground": "hsl(var(--sidebar-primary-foreground))",
          accent: "hsl(var(--sidebar-accent))",
          "accent-foreground": "hsl(var(--sidebar-accent-foreground))",
          border: "hsl(var(--sidebar-border))",
          ring: "hsl(var(--sidebar-ring))",
        },
      },
      fontFamily: {
        display: ['Fraunces', 'Georgia', 'serif'],
        sans: ['Manrope', 'ui-sans-serif', 'system-ui', 'sans-serif'],
        mono: ['"IBM Plex Mono"', 'ui-monospace', 'monospace'],
      },
      borderRadius: {
        xl: "calc(var(--radius) + 4px)",
        lg: "var(--radius)",
        md: "calc(var(--radius) - 2px)",
        sm: "calc(var(--radius) - 4px)",
        xs: "calc(var(--radius) - 6px)",
      },
      boxShadow: {
        xs: "0 1px 2px 0 rgb(0 0 0 / 0.05)",
      },
      transitionTimingFunction: {
        expo: 'cubic-bezier(0.22, 1, 0.36, 1)',
      },
      keyframes: {
        "accordion-down": {
          from: { height: "0" },
          to: { height: "var(--radix-accordion-content-height)" },
        },
        "accordion-up": {
          from: { height: "var(--radix-accordion-content-height)" },
          to: { height: "0" },
        },
        "caret-blink": {
          "0%,70%,100%": { opacity: "1" },
          "20%,50%": { opacity: "0" },
        },
        marquee: {
          from: { transform: 'translateX(0)' },
          to: { transform: 'translateX(-50%)' },
        },
        "meter-sweep": {
          from: { strokeDashoffset: 'var(--meter-full)' },
          to: { strokeDashoffset: 'var(--meter-val)' },
        },
        "pulse-underline": {
          "0%, 100%": { opacity: '0.35', transform: 'scaleX(0.85)' },
          "50%": { opacity: '1', transform: 'scaleX(1)' },
        },
        breathe: {
          "0%, 100%": { transform: 'scale(1)', opacity: '0.9' },
          "50%": { transform: 'scale(1.05)', opacity: '1' },
        },
        "fade-in": {
          from: { opacity: '0' },
          to: { opacity: '1' },
        },
      },
      animation: {
        "accordion-down": "accordion-down 0.2s ease-out",
        "accordion-up": "accordion-up 0.2s ease-out",
        "caret-blink": "caret-blink 1.25s ease-out infinite",
        marquee: 'marquee 40s linear infinite',
        "meter-sweep": 'meter-sweep 1.4s cubic-bezier(0.22, 1, 0.36, 1) forwards',
        "pulse-underline": 'pulse-underline 3s ease-in-out infinite',
        breathe: 'breathe 6s ease-in-out infinite',
        "fade-in": 'fade-in 300ms ease-out',
      },
    },
  },
  plugins: [require("tailwindcss-animate")],
}
