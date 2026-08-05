import { describe, expect, it } from "vitest";
import {
  filtersFromSearchParams,
  hasAnyCarFilter,
  filtersToSearchParams,
} from "@/lib/car-search-query";

describe("car search filters", () => {
  it("parses browse URL params", () => {
    const sp = new URLSearchParams(
      "q=toyota&make=Toyota&province=Kinshasa&sort=priceLow&listingType=sale"
    );
    const f = filtersFromSearchParams(sp);
    expect(f.q).toBe("toyota");
    expect(f.make).toBe("Toyota");
    expect(f.province).toBe("Kinshasa");
    expect(f.sort).toBe("priceLow");
    expect(f.listingType).toBe("sale");
    expect(hasAnyCarFilter(f)).toBe(true);
  });

  it("round-trips filter params", () => {
    const f = filtersFromSearchParams(
      new URLSearchParams("make=Honda&type=SUV&minYear=2018")
    );
    const out = filtersToSearchParams(f);
    expect(out.get("make")).toBe("Honda");
    expect(out.get("type")).toBe("SUV");
    expect(out.get("minYear")).toBe("2018");
  });
});
