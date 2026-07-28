import type { User, SupabaseClient } from "@supabase/supabase-js";

export type SellerProfileRow = {
  id: string;
  full_name: string | null;
  role: string;
  company_name: string | null;
  phone: string | null;
  whatsapp: string | null;
  city?: string | null;
  age?: number | null;
  avatar_url?: string | null;
  bio?: string | null;
};

function digits(v: string | null | undefined) {
  return (v ?? "").replace(/\D/g, "");
}

/**
 * Ensure profile exists and inherits signup metadata (phone, name, role, company, city).
 */
export async function syncSellerProfileFromAuth(
  supabase: SupabaseClient,
  user: User
): Promise<SellerProfileRow> {
  const meta = (user.user_metadata ?? {}) as Record<string, unknown>;
  const metaPhone = digits(typeof meta.phone === "string" ? meta.phone : "");
  const metaWhatsapp = digits(typeof meta.whatsapp === "string" ? meta.whatsapp : "") || metaPhone;
  const metaName = typeof meta.full_name === "string" ? meta.full_name.trim() : "";
  const metaRole = typeof meta.role === "string" ? meta.role : "buyer";
  const metaCompany =
    typeof meta.company_name === "string" && meta.company_name.trim() ? meta.company_name.trim() : null;
  const metaCity = typeof meta.city === "string" && meta.city.trim() ? meta.city.trim() : null;

  const { data: existingRaw } = await supabase
    .from("profiles")
    .select("id, full_name, role, company_name, phone, whatsapp, city, age, avatar_url, bio")
    .eq("id", user.id)
    .maybeSingle();

  const current = (existingRaw ?? null) as SellerProfileRow | null;
  const phoneDigits = digits(current?.phone);
  const needsPhone = phoneDigits.length < 9 && metaPhone.length >= 9;
  const needsName = !current?.full_name?.trim() && !!metaName;
  const needsCompany = !current?.company_name?.trim() && !!metaCompany;
  const needsCity = !current?.city?.trim() && !!metaCity;
  const needsInsert = !current;

  if (needsInsert || needsPhone || needsName || needsCompany || needsCity) {
    const payload = {
      id: user.id,
      full_name: current?.full_name?.trim() || metaName || user.email || "User",
      role: current?.role || metaRole || "buyer",
      phone: needsPhone ? metaPhone : current?.phone ?? (metaPhone || null),
      whatsapp:
        digits(current?.whatsapp).length >= 9
          ? current!.whatsapp
          : metaWhatsapp.length >= 9
            ? metaWhatsapp
            : current?.whatsapp ?? (metaPhone || null),
      company_name: current?.company_name?.trim() || metaCompany,
      city: current?.city?.trim() || metaCity,
      age: current?.age ?? null,
      avatar_url: current?.avatar_url ?? null,
      bio: current?.bio ?? null,
    };

    const { data: upsertedRaw } = await supabase
      .from("profiles")
      .upsert(payload, { onConflict: "id" })
      .select("id, full_name, role, company_name, phone, whatsapp, city, age, avatar_url, bio")
      .single();

    if (upsertedRaw) return upsertedRaw as SellerProfileRow;
  }

  if (current) return current;

  return {
    id: user.id,
    full_name: metaName || user.email || "User",
    role: metaRole || "buyer",
    company_name: metaCompany,
    phone: metaPhone || null,
    whatsapp: metaWhatsapp || metaPhone || null,
    city: metaCity,
    age: null,
    avatar_url: null,
    bio: null,
  };
}

export function sellerDisplayName(profile: {
  company_name?: string | null;
  full_name?: string | null;
}) {
  return profile.company_name?.trim() || profile.full_name?.trim() || "Seller";
}

export function isCompanySeller(profile: { company_name?: string | null }) {
  return !!(profile.company_name && profile.company_name.trim());
}
