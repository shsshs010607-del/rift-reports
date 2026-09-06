/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  images: {
    remotePatterns: [
      // Supabase Storage public bucket
      { protocol: "https", hostname: "*.supabase.co", pathname: "/storage/v1/object/public/**" },
      // TCGplayer 카드 이미지 CDN (JustTCG 는 이미지 미제공)
      { protocol: "https", hostname: "tcgplayer-cdn.tcgplayer.com" },
      { protocol: "https", hostname: "product-images.tcgplayer.com" },
    ],
  },
};

export default nextConfig;
