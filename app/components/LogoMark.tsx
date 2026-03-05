"use client";

/** DRCCARS branded logo mark – DC monogram with car wheel accent */
export default function LogoMark({ className = "", size = 24 }: { className?: string; size?: number }) {
  return (
    <svg
      viewBox="0 0 48 48"
      width={size}
      height={size}
      className={`${className}`}
      style={{ color: "var(--accent)" }}
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden
    >
      <rect width="48" height="48" rx="10" fill="currentColor" />
      {/* D */}
      <path d="M11 11h5v26h-5z" fill="white" />
      <path d="M16 11c7.5 0 11 4.5 11 12s-3.5 12-11 12V11z" fill="white" />
      {/* C – arc opening right */}
      <path
        d="M34 14 A10 10 0 0 0 34 34"
        stroke="white"
        strokeWidth="4"
        strokeLinecap="round"
        fill="none"
      />
      {/* Wheel dot – car accent */}
      <circle cx="38" cy="30" r="2.5" fill="white" />
    </svg>
  );
}
