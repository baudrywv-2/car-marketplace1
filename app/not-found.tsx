import LogoMark from "./components/LogoMark";
import NotFoundContent from "./components/NotFoundContent";

export default function NotFound() {
  return (
    <div className="flex min-h-[calc(100vh-4rem)] flex-col items-center justify-center px-4 py-16">
      <LogoMark size={80} className="mb-6 opacity-90" />
      <NotFoundContent />
    </div>
  );
}
