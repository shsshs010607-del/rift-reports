import { CARD_DOMAINS } from "@/lib/constants";

const DOMAIN_COLOR = new Map<string, string>(CARD_DOMAINS.map((d) => [d.slug, d.color]));

const NEUTRAL = "#8b8fa3";

/** 카드 도메인 색 배열 (무색이면 중립 회색 1개). */
export function domainColors(slugs: readonly string[]): string[] {
  const cs = slugs.map((s) => DOMAIN_COLOR.get(s)).filter(Boolean) as string[];
  return cs.length ? cs : [NEUTRAL];
}

/** 단색이면 hex, 다색이면 좌→우 그라디언트 문자열. */
export function domainGradient(slugs: readonly string[], angle = "90deg"): string {
  const cs = domainColors(slugs);
  return cs.length === 1 ? cs[0] : `linear-gradient(${angle}, ${cs.join(", ")})`;
}

/** 카드 아트 뒤에 깔 은은한 방사형 틴트. */
export function domainWash(slugs: readonly string[]): string {
  const [a, b = a] = domainColors(slugs);
  return `radial-gradient(120% 90% at 30% 0%, ${a}22, transparent 55%), radial-gradient(120% 90% at 80% 100%, ${b}1f, transparent 55%)`;
}

export const RARITY_STYLE: Record<
  string,
  { label: string; className: string; ring: string }
> = {
  common: {
    label: "커먼",
    className: "bg-surface-container text-on-surface-variant",
    ring: "transparent",
  },
  uncommon: {
    label: "언커먼",
    className: "bg-tertiary-fixed text-on-tertiary-fixed",
    ring: "#4ede9f",
  },
  rare: {
    label: "레어",
    className: "bg-primary-fixed text-on-primary-fixed-variant",
    ring: "#6063ee",
  },
  epic: {
    label: "에픽",
    className: "bg-secondary-fixed text-on-secondary-fixed-variant",
    ring: "#fea619",
  },
};

export const rarityStyle = (slug: string) =>
  RARITY_STYLE[slug] ?? { label: slug, className: "bg-surface-container text-on-surface-variant", ring: "transparent" };
