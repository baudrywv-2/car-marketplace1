import { describe, expect, it } from "vitest";
import {
  sanitizeTitle,
  validateListing,
  type ListingFormFields,
} from "@/lib/listing-validation";

function baseForm(over: Partial<ListingFormFields> = {}): ListingFormFields {
  return {
    title: "2020 Toyota Corolla Kinshasa",
    make: "Toyota",
    make_other: "",
    model: "Corolla",
    type: "Sedan",
    listing_type: "sale",
    price: "8500",
    rental_price_per_hour: "",
    rental_price_per_day: "",
    rental_price_per_week: "",
    rental_price_per_month: "",
    ...over,
  };
}

describe("listing validation (publish smoke)", () => {
  it("sanitizes underscores in titles", () => {
    expect(sanitizeTitle("  Toyota__Camry  ")).toBe("Toyota Camry");
  });

  it("accepts a complete sale listing for publish", () => {
    expect(validateListing(baseForm(), "publish")).toEqual({ ok: true });
  });

  it("rejects publish without vehicle type", () => {
    const result = validateListing(baseForm({ type: "" }), "publish");
    expect(result).toEqual({ ok: false, errorKey: "vehicleTypeRequired" });
  });

  it("allows incomplete draft", () => {
    expect(validateListing(baseForm({ title: "Draft", type: "" }), "draft")).toEqual({
      ok: true,
    });
  });
});
