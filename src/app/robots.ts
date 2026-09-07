import type { MetadataRoute } from "next";
import { SITE } from "@/lib/constants";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: "*",
      allow: "/",
      // 로그인 전용·운영 페이지는 색인 제외
      disallow: ["/admin", "/me", "/onboarding", "/auth/", "/api/"],
    },
    sitemap: `${SITE.url}/sitemap.xml`,
  };
}
