"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useParams, useSearchParams } from "next/navigation";
import { useLocale } from "@/app/contexts/LocaleContext";

type Contact = {
  owner_phone: string | null;
  owner_whatsapp: string | null;
  owner_address: string | null;
};

export default function UnlockSuccessPage() {
  const params = useParams();
  const searchParams = useSearchParams();
  const { t } = useLocale();
  const carId = params.id as string;
  const sessionId = searchParams.get("session_id");
  const [contact, setContact] = useState<Contact | null>(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!sessionId || !carId) {
      setError(t("invalidReturnUrl"));
      setLoading(false);
      return;
    }
    (async () => {
      const res = await fetch("/api/unlock", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ sessionId, carId }),
      });
      const data = await res.json();
      setLoading(false);
      if (!res.ok) {
        setError(data.error || t("unlockFailed"));
        return;
      }
      setContact(data.contact ?? null);
    })();
  }, [sessionId, carId, t]);

  if (loading) {
    return (
      <div className="mx-auto max-w-md px-4 py-12 text-center">
        <p className="text-zinc-600 dark:text-zinc-400">{t("confirmingPayment")}</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="mx-auto max-w-md px-4 py-12">
        <p className="mb-4 text-red-600">{error}</p>
        <Link href={`/cars/${carId}`} className="text-zinc-900 underline dark:text-white">
          {t("backToListing")}
        </Link>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-md px-4 py-12">
      <h1 className="mb-4 text-base font-bold">{t("sellerContact")}</h1>
      <div className="rounded-lg border border-zinc-200 bg-zinc-50 p-4 dark:border-zinc-700 dark:bg-zinc-800/50">
        <p><strong>{t("phone")}:</strong> {contact?.owner_phone || "—"}</p>
        <p><strong>{t("whatsapp")}:</strong> {contact?.owner_whatsapp || "—"}</p>
        <p><strong>{t("address")}:</strong> {contact?.owner_address || "—"}</p>
      </div>
      <Link href={`/cars/${carId}`} className="mt-6 inline-block text-zinc-900 underline dark:text-white">
        {t("backToListing")}
      </Link>
    </div>
  );
}
