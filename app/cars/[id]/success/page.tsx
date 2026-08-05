"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { useLocale } from "@/app/contexts/LocaleContext";

/** Legacy Stripe return URL — payments are disabled; send users back to the listing. */
export default function UnlockSuccessPage() {
  const params = useParams();
  const { t } = useLocale();
  const carId = params.id as string;

  return (
    <div className="mx-auto max-w-md px-4 py-12">
      <h1 className="mb-4 text-base font-bold">{t("sellerContact")}</h1>
      <p className="mb-4 text-[12px] leading-relaxed text-[var(--muted-foreground)]">
        {t("paymentNotAvailable")}
      </p>
      <p className="mb-6 text-[12px] leading-relaxed text-[var(--muted-foreground)]">
        {t("unlockSafetyNote")}
      </p>
      <Link href={`/cars/${carId}`} className="text-zinc-900 underline dark:text-white">
        {t("backToListing")}
      </Link>
    </div>
  );
}
