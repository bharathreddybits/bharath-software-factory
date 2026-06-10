import type { MetadataRoute } from "next";
import factoryConfig from "@/src/config/factory.config";

export default function robots(): MetadataRoute.Robots {
  const base = `https://${factoryConfig.product.domain}`;
  return {
    rules: {
      userAgent: "*",
      allow: "/",
      disallow: ["/dashboard/", "/onboarding/", "/api/"],
    },
    sitemap: `${base}/sitemap.xml`,
  };
}
