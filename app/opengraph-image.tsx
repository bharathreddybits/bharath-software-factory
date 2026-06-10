import { ImageResponse } from "next/og";
import factoryConfig from "@/src/config/factory.config";

export const runtime = "edge";
export const alt = factoryConfig.seo.openGraph.title;
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default function OGImage() {
  return new ImageResponse(
    <div
      style={{
        background: "#09090b",
        width: "100%",
        height: "100%",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        padding: "80px",
        gap: "24px",
      }}
    >
      <p
        style={{
          color: "white",
          fontSize: 72,
          fontWeight: 700,
          margin: 0,
          letterSpacing: "-2px",
          textAlign: "center",
          lineHeight: 1.1,
        }}
      >
        {factoryConfig.product.name}
      </p>
      <p
        style={{
          color: "#a1a1aa",
          fontSize: 32,
          margin: 0,
          textAlign: "center",
        }}
      >
        {factoryConfig.product.tagline}
      </p>
    </div>,
    { ...size }
  );
}
