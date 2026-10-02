"use client";

// Last-resort error page when the root layout itself fails. Must render <html>.
export default function GlobalError({ reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return (
    <html lang="en">
      <body style={{ fontFamily: "Georgia, serif", background: "#F6F1E6", color: "#0B2A22", textAlign: "center", padding: "4rem 1rem" }}>
        <h1>Something went wrong</h1>
        <p>Please try again in a moment.</p>
        <button type="button" onClick={reset} style={{ minHeight: 44, padding: "0 1.5rem", background: "#0B3A2E", color: "#F6F1E6", border: 0 }}>
          Try again
        </button>
      </body>
    </html>
  );
}
