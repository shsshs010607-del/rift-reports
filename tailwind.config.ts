import type { Config } from "tailwindcss";

/**
 * Rift Report — "RIFTREPORT Hub" (Material 3 · Neo-Arcade).
 * globals.css 의 CSS 변수와 1:1. MD3 토큰명 + 기존 시맨틱 별칭 둘 다 노출.
 */
const rgb = (v: string) => `rgb(var(${v}) / <alpha-value>)`;

const config: Config = {
  content: [
    "./src/app/**/*.{ts,tsx}",
    "./src/components/**/*.{ts,tsx}",
    "./src/lib/**/*.{ts,tsx}",
  ],
  theme: {
    container: {
      center: true,
      padding: { DEFAULT: "1rem", lg: "1.5rem" },
      screens: { "2xl": "1280px" },
    },
    extend: {
      colors: {
        // ── Material 3 토큰 ──
        background: rgb("--background"),
        surface: {
          DEFAULT: rgb("--surface"),
          dim: rgb("--surface-dim"),
          variant: rgb("--surface-variant"),
        },
        "surface-container-lowest": rgb("--surface-container-lowest"),
        "surface-container-low": rgb("--surface-container-low"),
        "surface-container": rgb("--surface-container"),
        "surface-container-high": rgb("--surface-container-high"),
        "surface-container-highest": rgb("--surface-container-highest"),
        "inverse-surface": rgb("--inverse-surface"),
        "inverse-on-surface": rgb("--inverse-on-surface"),
        "on-surface": rgb("--on-surface"),
        "on-surface-variant": rgb("--on-surface-variant"),
        outline: rgb("--outline"),
        "outline-variant": rgb("--outline-variant"),
        primary: {
          DEFAULT: rgb("--primary"),
          container: rgb("--primary-container"),
          strong: rgb("--on-primary-fixed-variant"),
          fixed: rgb("--primary-fixed"),
          wash: rgb("--primary-fixed"),
        },
        "primary-container": rgb("--primary-container"),
        "on-primary": rgb("--on-primary"),
        "primary-fixed": rgb("--primary-fixed"),
        "primary-fixed-dim": rgb("--primary-fixed-dim"),
        "on-primary-fixed": rgb("--on-primary-fixed"),
        "on-primary-fixed-variant": rgb("--on-primary-fixed-variant"),
        "inverse-primary": rgb("--inverse-primary"),
        secondary: {
          DEFAULT: rgb("--secondary"),
          container: rgb("--secondary-container"),
          fixed: rgb("--secondary-fixed"),
        },
        "secondary-container": rgb("--secondary-container"),
        "secondary-fixed": rgb("--secondary-fixed"),
        "secondary-fixed-dim": rgb("--secondary-fixed-dim"),
        "on-secondary-fixed": rgb("--on-secondary-fixed"),
        "on-secondary-fixed-variant": rgb("--on-secondary-fixed-variant"),
        "on-secondary-container": rgb("--on-secondary-container"),
        tertiary: {
          DEFAULT: rgb("--tertiary"),
          container: rgb("--tertiary-container"),
          fixed: rgb("--tertiary-fixed"),
        },
        "tertiary-container": rgb("--tertiary-container"),
        "tertiary-fixed": rgb("--tertiary-fixed"),
        "tertiary-fixed-dim": rgb("--tertiary-fixed-dim"),
        "on-tertiary-fixed": rgb("--on-tertiary-fixed"),
        error: {
          DEFAULT: rgb("--error"),
          container: rgb("--error-container"),
        },
        "error-container": rgb("--error-container"),
        "on-error-container": rgb("--on-error-container"),

        // ── 기존 시맨틱 별칭 (하위호환) ──
        canvas: rgb("--background"),
        subcanvas: rgb("--surface-container"),
        card: {
          DEFAULT: rgb("--surface-container-lowest"),
          alt: rgb("--surface-container-low"),
        },
        "card-alt": rgb("--surface-container-low"),
        line: rgb("--outline-variant"),
        ink: {
          DEFAULT: rgb("--on-surface"),
          soft: rgb("--on-surface-variant"),
        },
        "ink-soft": rgb("--on-surface-variant"),
        amber: rgb("--secondary"),
        emerald: rgb("--tertiary"),
        coral: rgb("--error"),
        scrim: rgb("--scrim"),
        tier: {
          s: rgb("--secondary-container"),
          a: rgb("--primary"),
          b: rgb("--tertiary-container"),
          c: rgb("--outline"),
        },
      },
      fontFamily: {
        display: [
          "var(--font-display)",
          '"Plus Jakarta Sans"',
          '"Pretendard Variable"',
          "Pretendard",
          "system-ui",
          "sans-serif",
        ],
        sans: [
          "var(--font-sans)",
          "Inter",
          '"Pretendard Variable"',
          "Pretendard",
          '"Noto Sans KR"',
          "system-ui",
          "sans-serif",
        ],
      },
      fontSize: {
        "display-hero": ["48px", { lineHeight: "56px", letterSpacing: "-0.03em", fontWeight: "800" }],
        "display-hero-mobile": ["32px", { lineHeight: "40px", letterSpacing: "-0.02em", fontWeight: "800" }],
        "headline-lg": ["32px", { lineHeight: "40px", letterSpacing: "-0.02em", fontWeight: "700" }],
        "headline-md": ["24px", { lineHeight: "32px", letterSpacing: "-0.01em", fontWeight: "700" }],
        "headline-sm": ["18px", { lineHeight: "26px", letterSpacing: "-0.005em", fontWeight: "600" }],
        "title-md": ["16px", { lineHeight: "24px", fontWeight: "600" }],
        "body-lg": ["16px", { lineHeight: "24px", letterSpacing: "-0.01em" }],
        "body-md": ["14px", { lineHeight: "22px" }],
        "body-sm": ["12px", { lineHeight: "18px", letterSpacing: "0.01em" }],
        "label-lg": ["14px", { lineHeight: "20px", letterSpacing: "0.02em", fontWeight: "700" }],
        "label-md": ["12px", { lineHeight: "16px", letterSpacing: "0.04em", fontWeight: "700" }],
        "label-sm": ["10px", { lineHeight: "14px", letterSpacing: "0.06em", fontWeight: "800" }],
      },
      spacing: {
        "space-2xs": "0.25rem",
        "space-xs": "0.5rem",
        "space-sm": "0.75rem",
        "space-md": "1rem",
        "space-lg": "1.5rem",
        "space-xl": "2rem",
        "space-2xl": "3rem",
        "space-3xl": "4rem",
        "gutter-desktop": "1.5rem",
        gutter: "1.5rem",
      },
      borderRadius: {
        DEFAULT: "0.25rem",
        lg: "0.5rem",
        xl: "0.75rem",
        "2xl": "1rem",
      },
      boxShadow: {
        e1: "0 4px 20px -2px rgb(99 102 241 / 0.08), 0 2px 6px -1px rgb(99 102 241 / 0.04)",
        e2: "0 12px 30px -4px rgb(99 102 241 / 0.16), 0 4px 10px -2px rgb(99 102 241 / 0.08)",
        e3: "0 20px 40px -6px rgb(30 27 75 / 0.14)",
        header: "0 4px 20px -2px rgb(99 102 241 / 0.08)",
        "glow-amber": "0 0 24px -2px rgb(245 158 11 / 0.35)",
        xs: "0 1px 2px rgb(99 102 241 / 0.08)",
      },
    },
  },
  plugins: [],
};

export default config;
