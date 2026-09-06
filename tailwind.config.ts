import type { Config } from "tailwindcss";

/**
 * Rift Report — "Tactile Neo-Arcade" 디자인 시스템 (DESIGN.md 기준).
 * 밝은 라벤더 캔버스 + 인디고 프라이머리 + 티어별 고채도 액센트.
 * 색 토큰은 globals.css 의 CSS 변수와 1:1 매핑된다 ("R G B" 형식).
 */
const config: Config = {
  content: ["./src/app/**/*.{ts,tsx}", "./src/components/**/*.{ts,tsx}"],
  theme: {
    container: {
      center: true,
      padding: { DEFAULT: "1rem", lg: "1.5rem" },
      screens: { "2xl": "1280px" },
    },
    extend: {
      colors: {
        // 표면 매트릭스
        canvas: "rgb(var(--canvas) / <alpha-value>)",           // #F5F3FF 페이지 배경
        subcanvas: "rgb(var(--subcanvas) / <alpha-value>)",     // #EEF2FF 그룹 표면
        card: "rgb(var(--card) / <alpha-value>)",               // #FFFFFF 카드
        "card-alt": "rgb(var(--card-alt) / <alpha-value>)",     // #FAF8FF 보조 카드
        line: "rgb(var(--line) / <alpha-value>)",               // 아웃라인
        ink: "rgb(var(--ink) / <alpha-value>)",                 // 본문 텍스트 (#1E1B4B)
        "ink-soft": "rgb(var(--ink-soft) / <alpha-value>)",     // 보조 텍스트

        // 브랜드
        primary: {
          DEFAULT: "rgb(var(--primary) / <alpha-value>)",       // #6366F1
          strong: "rgb(var(--primary-strong) / <alpha-value>)", // #4F46E5
          wash: "rgb(var(--primary-wash) / <alpha-value>)",     // #EEF2FF
        },
        amber: "rgb(var(--amber) / <alpha-value>)",             // #F59E0B
        emerald: "rgb(var(--emerald) / <alpha-value>)",         // #10B981
        coral: "rgb(var(--coral) / <alpha-value>)",             // #F43F5E

        // 티어 / 레어도 액센트
        tier: {
          s: "rgb(var(--tier-s) / <alpha-value>)",  // Amber
          a: "rgb(var(--tier-a) / <alpha-value>)",  // Sky
          b: "rgb(var(--tier-b) / <alpha-value>)",  // Emerald
          c: "rgb(var(--tier-c) / <alpha-value>)",  // Slate
        },
      },
      fontFamily: {
        // 구조/타이틀/뱃지 (next/font 가 --font-display 주입)
        display: [
          "var(--font-display)",
          '"Pretendard Variable"',
          "Pretendard",
          "system-ui",
          "sans-serif",
        ],
        // 본문/피드/카드 스탯 (next/font 가 --font-sans 주입)
        sans: [
          "var(--font-sans)",
          '"Pretendard Variable"',
          "Pretendard",
          '"Noto Sans KR"',
          "system-ui",
          "sans-serif",
        ],
      },
      fontSize: {
        "display-hero": ["48px", { lineHeight: "56px", letterSpacing: "-0.03em", fontWeight: "800" }],
        "headline-lg": ["32px", { lineHeight: "40px", letterSpacing: "-0.02em", fontWeight: "700" }],
        "headline-md": ["24px", { lineHeight: "32px", letterSpacing: "-0.01em", fontWeight: "700" }],
        "headline-sm": ["18px", { lineHeight: "26px", letterSpacing: "-0.005em", fontWeight: "600" }],
        "title-md": ["16px", { lineHeight: "24px", fontWeight: "600" }],
        "body-lg": ["16px", { lineHeight: "24px", letterSpacing: "-0.01em" }],
        "body-md": ["14px", { lineHeight: "22px" }],
        "body-sm": ["12px", { lineHeight: "18px", letterSpacing: "0.01em" }],
        "label-lg": ["14px", { lineHeight: "20px", letterSpacing: "0.02em", fontWeight: "700" }],
        "label-sm": ["10px", { lineHeight: "14px", letterSpacing: "0.06em", fontWeight: "800" }],
      },
      borderRadius: {
        DEFAULT: "0.5rem",
        md: "0.75rem",
        lg: "1rem",
        xl: "1.5rem",
        "2xl": "1rem", // DESIGN: 카드 표준 16px
      },
      boxShadow: {
        // 인디고 틴트 앰비언트 (murky drop-shadow 지양)
        e1: "0 4px 20px -2px rgb(99 102 241 / 0.08), 0 2px 6px -1px rgb(99 102 241 / 0.04)",
        e2: "0 12px 30px -4px rgb(99 102 241 / 0.16), 0 4px 10px -2px rgb(99 102 241 / 0.08)",
        e3: "0 20px 40px -6px rgb(30 27 75 / 0.14)",
        "glow-amber": "0 0 24px -2px rgb(245 158 11 / 0.35)",
        "glow-primary": "0 0 0 4px rgb(99 102 241 / 0.15)",
      },
      spacing: {
        gutter: "1.5rem",
      },
      keyframes: {
        "press-in": { "0%": { transform: "translateY(0)" }, "100%": { transform: "translateY(2px)" } },
      },
    },
  },
  plugins: [],
};

export default config;
