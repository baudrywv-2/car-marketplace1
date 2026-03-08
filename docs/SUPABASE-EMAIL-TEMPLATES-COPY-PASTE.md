# Supabase email templates – copy & paste only

**Where:** Supabase Dashboard → **Authentication** → **Email Templates**.

For each template: open it in Supabase, paste the **Subject** into the Subject field, then paste **only** the Body content (the HTML inside the code block – do not copy any instruction line or backticks). Leave `{{ .ConfirmationURL }}` unchanged in the body. Click **Save**.

---

## 1. Confirm signup

**In Supabase:** Open **Confirm signup**.

**Subject** (copy this one line only):
```
Confirm your email – DRC Cars
```

**Body** – copy **only** the lines inside the block below (from `<div` to `</div>`). Do not copy this sentence or the backticks.
```
<div style="font-family: system-ui, sans-serif; background: #09090b; color: #fafafa; padding: 32px 24px; max-width: 480px; margin: 0 auto;">
  <div style="text-align: center; margin-bottom: 24px;">
    <img src="https://drccars.com/logo.png" alt="DRC Cars" width="120" height="40" style="height: 40px; width: auto;" />
  </div>
  <h1 style="font-size: 1.25rem; font-weight: 600; margin-bottom: 16px;">Confirm your email</h1>
  <p style="color: #a1a1aa; margin-bottom: 24px; line-height: 1.5;">You're almost set. Click the button below to confirm your email and start browsing or listing on DRC Cars.</p>
  <p style="text-align: center; margin: 24px 0;">
    <a href="{{ .ConfirmationURL }}" style="display: inline-block; background: #eab308; color: #09090b; padding: 12px 24px; text-decoration: none; font-weight: 600; border-radius: 6px;">Confirm email</a>
  </p>
  <p style="font-size: 12px; color: #71717a;">If you didn't create an account on drccars.com, you can ignore this email.</p>
</div>
```

---

## 2. Reset password

**In Supabase:** Open **Reset password**.

**Subject** (copy this one line only):
```
Reset your password – DRC Cars
```

**Body** – copy **only** the lines inside the block below (from `<div` to `</div>`). Do not copy this sentence or the backticks.
```
<div style="font-family: system-ui, sans-serif; background: #09090b; color: #fafafa; padding: 32px 24px; max-width: 480px; margin: 0 auto;">
  <div style="text-align: center; margin-bottom: 24px;">
    <img src="https://drccars.com/logo.png" alt="DRC Cars" width="120" height="40" style="height: 40px; width: auto;" />
  </div>
  <h1 style="font-size: 1.25rem; font-weight: 600; margin-bottom: 16px;">Reset your password</h1>
  <p style="color: #a1a1aa; margin-bottom: 24px; line-height: 1.5;">Click the button below to set a new password for your DRC Cars account.</p>
  <p style="text-align: center; margin: 24px 0;">
    <a href="{{ .ConfirmationURL }}" style="display: inline-block; background: #eab308; color: #09090b; padding: 12px 24px; text-decoration: none; font-weight: 600; border-radius: 6px;">Reset password</a>
  </p>
  <p style="font-size: 12px; color: #71717a;">If you didn't request a password reset, you can ignore this email.</p>
</div>
```

---

## 3. Magic link

**In Supabase:** Open **Magic link**.

**Subject** (copy this one line only):
```
Your login link – DRC Cars
```

**Body** – copy **only** the lines inside the block below (from `<div` to `</div>`). Do not copy this sentence or the backticks.
```
<div style="font-family: system-ui, sans-serif; background: #09090b; color: #fafafa; padding: 32px 24px; max-width: 480px; margin: 0 auto;">
  <div style="text-align: center; margin-bottom: 24px;">
    <img src="https://drccars.com/logo.png" alt="DRC Cars" width="120" height="40" style="height: 40px; width: auto;" />
  </div>
  <h1 style="font-size: 1.25rem; font-weight: 600; margin-bottom: 16px;">Sign in to DRC Cars</h1>
  <p style="color: #a1a1aa; margin-bottom: 24px; line-height: 1.5;">Click the button below to log in. This link will expire soon.</p>
  <p style="text-align: center; margin: 24px 0;">
    <a href="{{ .ConfirmationURL }}" style="display: inline-block; background: #eab308; color: #09090b; padding: 12px 24px; text-decoration: none; font-weight: 600; border-radius: 6px;">Log in</a>
  </p>
  <p style="font-size: 12px; color: #71717a;">If you didn't request this, you can ignore this email.</p>
</div>
```

---

**Easiest option:** Use the files in `docs/email-templates/`. Open each `*-body.html` file, select all (Ctrl+A / Cmd+A), copy, and paste into the Body field in Supabase. Those files contain only the HTML and nothing else.

---

## Logo URL

- Templates use **`https://drccars.com/logo.png`** by default. If your logo is there, no change.
- If your logo is elsewhere (e.g. `https://drccars.com/images/logo.png`), replace `https://drccars.com/logo.png` in **each** of the three Body templates (in Supabase and/or in the three `*-body.html` files in `docs/email-templates/`).
- No logo yet: in each Body, delete the `<img src="https://drccars.com/logo.png" ... />` line and use `<h2 style="color: #fafafa; margin: 0;">DRC Cars</h2>` in the same header div instead.
