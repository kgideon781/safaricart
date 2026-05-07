import { ImageResponse } from "next/og";

export const alt = "SafariCart — Kenya's online marketplace";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default function OgImage() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          padding: 80,
          background:
            "linear-gradient(135deg, #EA580C 0%, #F59E0B 60%, #166534 100%)",
          color: "#FFFFFF",
          fontFamily: "system-ui, sans-serif",
        }}
      >
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 20,
            fontSize: 36,
            fontWeight: 700,
            letterSpacing: -1,
          }}
        >
          <div
            style={{
              width: 64,
              height: 64,
              borderRadius: 16,
              background: "#FFFFFF",
              color: "#EA580C",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: 44,
              fontWeight: 800,
            }}
          >
            S
          </div>
          SafariCart
        </div>
        <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
          <div
            style={{
              fontSize: 80,
              fontWeight: 800,
              letterSpacing: -3,
              lineHeight: 1.05,
            }}
          >
            Shop the journey.
          </div>
          <div style={{ fontSize: 32, opacity: 0.95, maxWidth: 900 }}>
            Kenya&apos;s online marketplace · Trusted vendors across all 47
            counties · Pay with M-Pesa
          </div>
        </div>
      </div>
    ),
    { ...size },
  );
}
