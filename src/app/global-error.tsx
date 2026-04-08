"use client";

import { useEffect } from "react";

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <html lang="en">
      <body style={{ fontFamily: "Inter, system-ui, sans-serif" }}>
        <div
          style={{
            display: "flex",
            minHeight: "100vh",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            padding: "1rem",
            background: "#f0fdf4",
          }}
        >
          <div style={{ textAlign: "center", maxWidth: 480 }}>
            <div
              style={{
                width: 80,
                height: 80,
                borderRadius: 16,
                background: "#fee2e2",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                margin: "0 auto 24px",
                fontSize: 36,
              }}
            >
              !
            </div>
            <h1 style={{ fontSize: 32, fontWeight: 700, color: "#0f172a" }}>
              Critical Error
            </h1>
            <p
              style={{
                marginTop: 12,
                color: "#64748b",
                fontSize: 16,
                lineHeight: 1.6,
              }}
            >
              The application encountered a critical error. Your data is safe.
              Please try refreshing.
            </p>
            <button
              onClick={reset}
              style={{
                marginTop: 24,
                padding: "10px 24px",
                borderRadius: 8,
                background: "#059669",
                color: "white",
                border: "none",
                fontSize: 14,
                fontWeight: 600,
                cursor: "pointer",
              }}
            >
              Try again
            </button>
          </div>
        </div>
      </body>
    </html>
  );
}
