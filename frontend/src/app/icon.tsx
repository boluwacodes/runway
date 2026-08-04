import { ImageResponse } from "next/og";

export const size = { width: 32, height: 32 };
export const contentType = "image/png";

export default function Icon() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          background: "#f5f6f4",
        }}
      >
        <svg width="26" height="26" viewBox="0 0 32 32" fill="none">
          <rect x="5" y="20" width="5" height="8" fill="#047857" />
          <rect x="13.5" y="14" width="5" height="14" fill="#047857" />
          <rect x="22" y="6" width="5" height="22" fill="#047857" />
          <path d="M4 17L14 9L20 12L28 4" stroke="#1a2421" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
          <path d="M22 4H28V10" stroke="#1a2421" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </div>
    ),
    { ...size },
  );
}
