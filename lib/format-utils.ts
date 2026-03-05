import { CDF_PER_USD } from "./constants";

export function formatPrice(price: number, currency: "USD" | "CDF", carCurrency: string | null | undefined): string {
  let amount = price;
  if (currency === "CDF" && carCurrency === "USD") amount = price * CDF_PER_USD;
  if (currency === "USD" && carCurrency === "CDF") amount = price / CDF_PER_USD;
  if (currency === "CDF") return `${Math.round(amount).toLocaleString()} FC`;
  return `$${amount.toLocaleString()}`;
}

export type RentalTier = { period: "hour" | "day" | "week" | "month"; price: number };

export function getBestRentalPrice(car: {
  rental_price_per_hour?: number | null;
  rental_price_per_day?: number | null;
  rental_price_per_week?: number | null;
  rental_price_per_month?: number | null;
}): number {
  return (
    car.rental_price_per_day ??
    car.rental_price_per_week ??
    car.rental_price_per_month ??
    car.rental_price_per_hour ??
    0
  );
}

export function getRentalTiers(car: {
  rental_price_per_hour?: number | null;
  rental_price_per_day?: number | null;
  rental_price_per_week?: number | null;
  rental_price_per_month?: number | null;
}): RentalTier[] {
  const tiers: RentalTier[] = [];
  if (car.rental_price_per_hour != null && car.rental_price_per_hour > 0) tiers.push({ period: "hour", price: car.rental_price_per_hour });
  if (car.rental_price_per_day != null && car.rental_price_per_day > 0) tiers.push({ period: "day", price: car.rental_price_per_day });
  if (car.rental_price_per_week != null && car.rental_price_per_week > 0) tiers.push({ period: "week", price: car.rental_price_per_week });
  if (car.rental_price_per_month != null && car.rental_price_per_month > 0) tiers.push({ period: "month", price: car.rental_price_per_month });
  return tiers;
}
