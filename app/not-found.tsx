import Link from "next/link";
import LogoMark from "./components/LogoMark";
import NotFoundContent from "./components/NotFoundContent";

export default function NotFound() {
  return (
    <div className="flex min-h-[calc(100vh-4rem)] flex-col items-center justify-center px-4 py-16">
      <Link
        href="/"
        className="mb-6 inline-flex opacity-90 transition-opacity hover:opacity-100 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--accent)]"
        aria-label="DRCCARS"
      >
        <LogoMark size={80} />
      </Link>
      <NotFoundContent />
    </div>
  );
}
