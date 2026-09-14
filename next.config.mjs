/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  // data/*.json (카드 스냅샷·한글 번역)을 서버리스 번들에 포함
  outputFileTracingIncludes: {
    "/cards": ["./data/cards.json", "./data/cards-ko.json"],
    "/api/cards": ["./data/cards.json", "./data/cards-ko.json"],
    "/deck-simulator": ["./data/cards.json", "./data/cards-ko.json"],
    "/rules": ["./data/cards.json", "./data/cards-ko.json"],
    "/trading": ["./data/cards-ko.json"],
    "/trading/cards/[printId]": ["./data/cards-ko.json"],
  },
  images: {
    remotePatterns: [
      // Supabase Storage public bucket
      { protocol: "https", hostname: "*.supabase.co", pathname: "/storage/v1/object/public/**" },
      // TCGplayer 카드 이미지 CDN (JustTCG 는 이미지 미제공)
      { protocol: "https", hostname: "tcgplayer-cdn.tcgplayer.com" },
      { protocol: "https", hostname: "product-images.tcgplayer.com" },
      // Riftcodex 카드 이미지 = Riot 공식 CDN
      { protocol: "https", hostname: "cmsassets.rgpub.io" },
      // YouTube 썸네일
      { protocol: "https", hostname: "i.ytimg.com" },
      // 구글 OAuth 프로필 사진 (구글 로그인 유저 아바타)
      { protocol: "https", hostname: "lh3.googleusercontent.com" },
    ],
  },
  // 기본 보안 헤더. CSP 는 AdSense/폰트/OAuth 조합을 실제 배포에서 검증 없이
  // 강하게 걸면 광고·폰트가 조용히 깨질 위험이 있어 별도 작업으로 남겨둠.
  async headers() {
    return [
      {
        source: "/:path*",
        headers: [
          { key: "X-Content-Type-Options", value: "nosniff" },
          { key: "X-Frame-Options", value: "SAMEORIGIN" },
          { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
          {
            key: "Permissions-Policy",
            value: "camera=(), microphone=(), geolocation=(), payment=(), usb=()",
          },
          { key: "Strict-Transport-Security", value: "max-age=63072000; includeSubDomains; preload" },
        ],
      },
    ];
  },
};

export default nextConfig;
