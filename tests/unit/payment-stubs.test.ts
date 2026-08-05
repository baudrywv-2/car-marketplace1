import { describe, expect, it } from "vitest";
import { NextRequest } from "next/server";
import { POST as checkoutPost } from "@/app/api/checkout/route";
import { POST as unlockPost } from "@/app/api/unlock/route";

function emptyPost() {
  return new NextRequest("http://localhost/api/checkout", { method: "POST" });
}

describe("payment stubs (honesty)", () => {
  it("checkout returns 501", async () => {
    const res = await checkoutPost(emptyPost());
    expect(res.status).toBe(501);
    const body = await res.json();
    expect(body.error).toMatch(/not configured/i);
  });

  it("unlock returns 501", async () => {
    const res = await unlockPost(emptyPost());
    expect(res.status).toBe(501);
    const body = await res.json();
    expect(body.error).toMatch(/not configured/i);
  });
});
