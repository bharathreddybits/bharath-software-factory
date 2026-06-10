import type { MetadataRoute } from "next";
import factoryConfig from "@/src/config/factory.config";

export default function sitemap(): MetadataRoute.Sitemap {
  const base = `https://${factoryConfig.product.domain}`;
  const { changeFrequency, priority } = factoryConfig.seo.sitemap;

  return [
    { url: base, lastModified: new Date(), changeFrequency, priority },
    { url: `${base}/login`, lastModified: new Date(), changeFrequency: "yearly", priority: 0.5 },
    { url: `${base}/signup`, lastModified: new Date(), changeFrequency: "yearly", priority: 0.8 },
  ];
}
