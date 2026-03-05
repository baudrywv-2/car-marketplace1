"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { supabase } from "@/lib/supabase";
import { useLocale } from "@/app/contexts/LocaleContext";

export default function DashboardPage() {
  const router = useRouter();
  const { t } = useLocale();

  useEffect(() => {
    async function load() {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        router.replace("/login?next=/dashboard");
        return;
      }
      const { data: profile } = await supabase
        .from("profiles")
        .select("role")
        .eq("id", user.id)
        .single();
      const role = profile?.role ?? "buyer";
      if (role === "admin") {
        router.replace("/dashboard/admin");
        return;
      }
      if (role === "seller") {
        router.replace("/dashboard/seller");
        return;
      }
      router.replace("/dashboard/buyer");
    }
    load();
  }, [router]);

  return (
    <div className="mx-auto max-w-6xl px-4 py-10 sm:px-6">
      <p className="text-body text-[var(--muted-foreground)]">{t("loading")}</p>
      <p className="mt-2 text-caption text-[var(--muted-foreground)]">
        Redirecting to your dashboard…
      </p>
      <div className="mt-4 flex flex-wrap gap-3">
        <Link href="/dashboard/admin" className="text-caption text-[var(--accent)] hover:underline">
          Admin
        </Link>
        <Link href="/dashboard/seller" className="text-caption text-[var(--accent)] hover:underline">
          Seller
        </Link>
        <Link href="/dashboard/buyer" className="text-caption text-[var(--accent)] hover:underline">
          Buyer
        </Link>
      </div>
    </div>
  );
}
