/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  // data/cards.json (OpenSourceCardService 폴백)을 서버리스 번들에 포함
  experimental: {
    outputFileTracingIncludes: {
      "/cards": ["./data/cards.json"],
      "/cards/[id]": ["./data/cards.json"],
      "/api/cards": ["./data/cards.json"],
      "/deck-simulator": ["./data/cards.json"],
    },
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
    ],
  },
};

export default nextConfig;
