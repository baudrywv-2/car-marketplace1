import Link from "next/link";
import LogoMark from "./components/LogoMark";

export default function NotFound() {
  return (
    <div className="flex min-h-[calc(100vh-4rem)] flex-col items-center justify-center px-4 py-16">
      <LogoMark size={80} className="mb-6 opacity-90" />
      <h1 className="text-heading mb-2 text-center text-[var(--foreground)]">Page not found</h1>
      <p className="text-body mb-8 max-w-sm text-center text-[var(--muted-foreground)]">
        The page you&apos;re looking for doesn&apos;t exist or has been moved.
      </p>
      <Link href="/" className="btn-accent">
        Back to DRCCARS
      </Link>
    </div>
  );
}
