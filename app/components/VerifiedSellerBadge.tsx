"use client";

import { useLocale } from "@/app/contexts/LocaleContext";

type Props = {
  phoneVerified?: boolean;
  idVerified?: boolean;
  dealerVerified?: boolean;
  className?: string;
};

/** Shows 🟢 Verified Seller when at least one verification is true */
export default function VerifiedSellerBadge({
  phoneVerified,
  idVerified,
  dealerVerified,
  className = "",
}: Props) {
  const { t } = useLocale();
  const isVerified = !!(phoneVerified || idVerified || dealerVerified);

  if (!isVerified) return null;

  return (
    <span
      className={`inline-flex items-center gap-1 rounded-full bg-green-100 px-2 py-0.5 text-[10px] font-medium text-green-800 dark:bg-green-900/40 dark:text-green-400 ${className}`}
      title={
        [
          phoneVerified && t("verifiedPhone"),
          idVerified && t("verifiedId"),
          dealerVerified && t("verifiedDealer"),
        ]
          .filter(Boolean)
          .join(" · ") || t("verifiedSeller")
      }
    >
      <span className="text-green-600 dark:text-green-400" aria-hidden>
        ●
      </span>
      {t("verifiedSeller")}
    </span>
  );
}
