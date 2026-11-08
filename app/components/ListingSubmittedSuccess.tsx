"use client";

import Link from "next/link";
import { useLocale } from "@/app/contexts/LocaleContext";

type Props = {
  mode?: "submitted" | "draft";
};

export default function ListingSubmittedSuccess({ mode = "submitted" }: Props) {
  const { t } = useLocale();
  const isDraft = mode === "draft";

  return (
    <div className="mx-auto max-w-xl px-4 py-8 sm:px-6 sm:py-12">
      <div className="rounded-[var(--radius-lg)] border border-[var(--accent)]/40 bg-[var(--accent-muted)] p-6 sm:p-8">
        <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-[var(--accent)] text-xl font-bold text-black">
          ✓
        </div>
        <h1 className="text-heading mb-2 text-[var(--foreground)]">
          {isDraft ? t("draftSavedTitle") : t("submittedForApproval")}
        </h1>
        <p className="text-body mb-5 text-[var(--muted-foreground)]">
          {isDraft ? t("draftSavedDesc") : t("submittedForApprovalDesc")}
        </p>

        {!isDraft && (
          <ol className="mb-6 list-decimal space-y-2 pl-5 text-[13px] text-[var(--muted-foreground)]">
            <li>{t("submitNextStepReview")}</li>
            <li>{t("submitNextStepNotify")}</li>
            <li>{t("submitNextStepLive")}</li>
          </ol>
        )}

        <div className="flex flex-col gap-2 sm:flex-row sm:flex-wrap">
          <Link href="/dashboard/seller" className="btn-primary inline-flex min-h-12 items-center justify-center">
            {t("backToDashboard")}
          </Link>
          <Link href="/dashboard/cars/new" className="btn-secondary inline-flex min-h-12 items-center justify-center">
            {t("addAnotherListing")}
          </Link>
          {!isDraft && (
            <Link
              href="/dashboard/seller?tab=pending"
              className="inline-flex min-h-12 items-center justify-center px-3 text-[13px] font-medium text-[var(--accent)] hover:underline"
            >
              {t("viewPendingListings")}
            </Link>
          )}
        </div>
      </div>
    </div>
  );
}
