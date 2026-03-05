"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useParams, useSearchParams } from "next/navigation";
import { supabase } from "@/lib/supabase";

type Contact = {
  owner_phone: string | null;
  owner_whatsapp: string | null;
  owner_address: string | null;
};

export default function UnlockSuccessPage() {
  const params = useParams();
  const searchParams = useSearchParams();
  const carId = params.id as string;
  const sessionId = searchParams.get("session_id");
  const [contact, setContact] = useState<Contact | null>(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!sessionId || !carId) {
      setError("Invalid return URL.");
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
        setError(data.error || "Unlock failed.");
        return;
      }
      setContact(data.contact ?? null);
    })();
  }, [sessionId, carId]);

  if (loading) {
    return (
      <div className="mx-auto max-w-md px-4 py-12 text-center">
        <p className="text-zinc-600 dark:text-zinc-400">Confirming payment…</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="mx-auto max-w-md px-4 py-12">
        <p className="mb-4 text-red-600">{error}</p>
        <Link href={`/cars/${carId}`} className="text-zinc-900 underline dark:text-white">
          ← Back to listing
        </Link>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-md px-4 py-12">
      <h1 className="mb-4 text-base font-bold">Seller contact</h1>
      <div className="rounded-lg border border-zinc-200 bg-zinc-50 p-4 dark:border-zinc-700 dark:bg-zinc-800/50">
        <p><strong>Phone:</strong> {contact?.owner_phone || "—"}</p>
        <p><strong>WhatsApp:</strong> {contact?.owner_whatsapp || "—"}</p>
        <p><strong>Address:</strong> {contact?.owner_address || "—"}</p>
      </div>
      <Link href={`/cars/${carId}`} className="mt-6 inline-block text-zinc-900 underline dark:text-white">
        ← Back to listing
      </Link>
    </div>
  );
}
