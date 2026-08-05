import { CAR_MAKES, CAR_TYPES, OTHER_MAKE } from "@/lib/constants";

export type ListingFormFields = {
  title: string;
  make: string;
  make_other: string;
  model: string;
  type: string;
  listing_type: "sale" | "rent" | "both";
  price: string;
  rental_price_per_hour: string;
  rental_price_per_day: string;
  rental_price_per_week: string;
  rental_price_per_month: string;
};

export type ListingValidateMode = "draft" | "publish";

export type ListingValidateResult =
  | { ok: true }
  | { ok: false; errorKey: string };

const TITLE_MIN = 8;
const TITLE_MAX = 120;
const MODEL_MIN = 2;
const MODEL_MAX = 80;
const MAKE_OTHER_MAX = 60;

const LISTED_MAKES = new Set<string>(
  CAR_MAKES.filter((m) => m !== OTHER_MAKE)
);
const TYPE_SET = new Set<string>(CAR_TYPES);

/** Trim, replace underscores, collapse whitespace, strip control chars. */
export function sanitizeTitle(raw: string): string {
  return String(raw ?? "")
    .replace(/[\u0000-\u001F\u007F]/g, "")
    .replace(/_/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

/** Resolve stored make: allowlisted make, or custom Other text (never the literal "Other"). */
export function normalizeMake(form: Pick<ListingFormFields, "make" | "make_other">): string {
  if (form.make === OTHER_MAKE) {
    return form.make_other.trim().slice(0, MAKE_OTHER_MAX);
  }
  return form.make.trim();
}

export function sanitizeModel(raw: string): string {
  return String(raw ?? "")
    .replace(/[\u0000-\u001F\u007F]/g, "")
    .replace(/_/g, " ")
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, MODEL_MAX);
}

export function validateListing(
  form: ListingFormFields,
  mode: ListingValidateMode
): ListingValidateResult {
  const title = sanitizeTitle(form.title);
  if (!title) return { ok: false, errorKey: "titleRequired" };
  if (mode === "publish" && title.length < TITLE_MIN) {
    return { ok: false, errorKey: "titleTooShort" };
  }
  if (title.length > TITLE_MAX) return { ok: false, errorKey: "titleTooLong" };

  if (mode === "draft") return { ok: true };

  const make = normalizeMake(form);
  if (!make) return { ok: false, errorKey: "makeRequired" };
  if (form.make === OTHER_MAKE) {
    if (make.length < 2) return { ok: false, errorKey: "makeRequired" };
  } else if (!LISTED_MAKES.has(make) && form.make !== OTHER_MAKE) {
    // Allow listed make string even if select was tampered — must be in allowlist
    if (!LISTED_MAKES.has(form.make.trim())) {
      return { ok: false, errorKey: "makeRequired" };
    }
  }

  const model = sanitizeModel(form.model);
  if (model.length < MODEL_MIN) return { ok: false, errorKey: "modelRequired" };

  const type = form.type.trim();
  if (!type) return { ok: false, errorKey: "vehicleTypeRequired" };
  if (!TYPE_SET.has(type)) return { ok: false, errorKey: "invalidVehicleType" };

  return { ok: true };
}

type Contact = { phone: string | null; whatsapp: string | null };

type BuildPayloadForm = ListingFormFields & {
  description: string;
  year: string;
  mileage: string;
  province: string;
  country: string;
  transmission: string;
  fuel_type: string;
  currency: string;
  condition: string;
  discount_percent: string;
  images: string[];
  owner_address: string;
  rental_currency: string;
  rental_min_hours: string;
  rental_event_type: string[];
  features: string[];
};

/** Shared cars insert/update payload from form + seller contact. */
export function buildListingPayload(form: BuildPayloadForm, contact: Contact) {
  const isRent = form.listing_type === "rent" || form.listing_type === "both";
  const make = normalizeMake(form);
  return {
    title: sanitizeTitle(form.title).slice(0, TITLE_MAX),
    description: form.description.trim() || null,
    price: form.listing_type === "rent" ? 0 : parseFloat(form.price) || 0,
    make,
    model: sanitizeModel(form.model),
    year: form.year ? parseInt(form.year, 10) : null,
    mileage: form.mileage ? parseInt(form.mileage, 10) : null,
    province: form.province.trim() || null,
    city: null as string | null,
    country: form.country.trim() || null,
    type: form.type.trim() || null,
    transmission: form.transmission.trim() || null,
    fuel_type: form.fuel_type.trim() || null,
    currency: form.currency || "USD",
    condition: form.condition || "used",
    discount_percent: form.discount_percent ? parseFloat(form.discount_percent) : null,
    images: form.images.slice(0, 4),
    owner_phone: contact.phone,
    owner_whatsapp: contact.whatsapp,
    owner_address: form.owner_address.trim() || null,
    listing_type: form.listing_type,
    rental_price_per_hour:
      isRent && form.rental_price_per_hour ? parseFloat(form.rental_price_per_hour) : null,
    rental_price_per_day:
      isRent && form.rental_price_per_day ? parseFloat(form.rental_price_per_day) : null,
    rental_price_per_week:
      isRent && form.rental_price_per_week ? parseFloat(form.rental_price_per_week) : null,
    rental_price_per_month:
      isRent && form.rental_price_per_month ? parseFloat(form.rental_price_per_month) : null,
    rental_currency: isRent ? form.rental_currency || "USD" : null,
    rental_min_hours:
      isRent && form.rental_min_hours ? parseInt(form.rental_min_hours, 10) : null,
    rental_event_type:
      isRent && form.rental_event_type.length > 0 ? form.rental_event_type : null,
    features: form.features.length > 0 ? form.features : null,
  };
}

export function hasAtLeastOneRentalPrice(form: ListingFormFields): boolean {
  return !!(
    form.rental_price_per_hour ||
    form.rental_price_per_day ||
    form.rental_price_per_week ||
    form.rental_price_per_month
  );
}
