import { ImageResponse } from "next/og";

export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default function OpengraphImage() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          background: "#f5f6f4",
          fontFamily: "sans-serif",
        }}
      >
        <svg width="140" height="140" viewBox="0 0 32 32" fill="none">
          <rect x="5" y="20" width="5" height="8" fill="#047857" />
          <rect x="13.5" y="14" width="5" height="14" fill="#047857" />
          <rect x="22" y="6" width="5" height="22" fill="#047857" />
          <path d="M4 17L14 9L20 12L28 4" stroke="#1a2421" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
          <path d="M22 4H28V10" stroke="#1a2421" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
        <div style={{ marginTop: 24, fontSize: 72, fontWeight: 800, color: "#1a2421" }}>Runway</div>
        <div style={{ marginTop: 16, fontSize: 30, color: "#5b6b64", display: "flex" }}>
          Get paid on your invoices today, not in 60 days
        </div>
      </div>
    ),
    { ...size },
  );
}
