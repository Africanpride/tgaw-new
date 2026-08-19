import { ImageResponse } from "next/og";

export const size = { width: 1200, height: 630 };
export const contentType = "image/png";
export const alt = "The Global Altar Watch — Your Daily Faith Companion";

export default function OpengraphImage() {
  return new ImageResponse(
    (
      <div
        style={{
          height: "100%",
          width: "100%",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          background:
            "linear-gradient(135deg, #0b0b1a 0%, #1a1038 50%, #2a0f2e 100%)",
          color: "#ffffff",
          fontFamily: "Geist, sans-serif",
        }}
      >
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 16,
            marginBottom: 24,
          }}
        >
          <div
            style={{
              width: 64,
              height: 64,
              borderRadius: 14,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              background: "#7c3aed",
              fontSize: 32,
            }}
          >
            ✠
          </div>
        </div>
        <div
          style={{
            display: "flex",
            fontSize: 72,
            fontWeight: 700,
            letterSpacing: "0.02em",
            textAlign: "center",
          }}
        >
          The Global{" "}
          <span
            style={{
              marginLeft: 12,
              background:
                "linear-gradient(90deg, #a78bfa, #e879f9, #f87171)",
              WebkitBackgroundClip: "text",
              color: "transparent",
            }}
          >
            Altar
          </span>{" "}
          Watch
        </div>
        <div
          style={{
            fontSize: 26,
            color: "rgba(255,255,255,0.7)",
            marginTop: 24,
            textAlign: "center",
          }}
        >
          Your Daily Faith Companion — devotion, prayer, and fellowship worldwide
        </div>
      </div>
    ),
    { ...size },
  );
}