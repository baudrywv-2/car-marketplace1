"use client";

import { useEffect } from "react";
import Link from "next/link";
import LogoMark from "./components/LogoMark";

export default function Error({
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
    <div className="flex min-h-[calc(100vh-4rem)] flex-col items-center justify-center px-4 py-16">
      <LogoMark size={64} className="mb-6 opacity-90" />
      <h1 className="text-heading mb-2 text-center text-[var(--foreground)]">Something went wrong</h1>
      <p className="text-body mb-8 max-w-sm text-center text-[var(--muted-foreground)]">
        An error occurred. Please try again or return to the home page.
      </p>
      <div className="flex gap-3">
        <button type="button" onClick={reset} className="btn-secondary">
          Try again
        </button>
        <Link href="/" className="btn-accent">
          Back to DRCCARS
        </Link>
      </div>
    </div>
  );
}
