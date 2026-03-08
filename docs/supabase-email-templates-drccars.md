# DRC Cars – Supabase email templates & redirects

Use this guide to brand auth emails and send users to **drccars.com** after confirmation (no localhost).

---

## 1. Redirect to drccars.com after confirmation

### In Supabase Dashboard

1. Go to **Authentication** → **URL Configuration**.
2. Set **Site URL** to: `https://drccars.com`
3. Under **Redirect URLs**, add (if not already present):
   - `https://drccars.com/**`
   - `https://drccars.com/login`
   - `https://drccars.com/reset-password`
   - For local dev you can also add: `http://localhost:3000/**`

Save. All confirmation and password-reset links will then redirect to drccars.com.

### In this app

- **Sign up**: `emailRedirectTo` is set to `https://drccars.com/login` (via `SITE_URL` from `lib/constants.ts`). After clicking the confirmation link, users land on the login page.
- **Reset password**: The reset email link sends users to `https://drccars.com/reset-password` (again using `SITE_URL`).

Ensure production env has:

```env
NEXT_PUBLIC_SITE_URL=https://drccars.com
```

---

## 2. Branded email templates (logo, colors, wording)

Paste the content below into **Supabase** → **Authentication** → **Email Templates** for each type.

**Brand colors (from drccars.com):**

- Background: `#09090b`
- Accent (gold): `#eab308`
- Text: `#fafafa`
- Muted: `#71717a`

**Logo:** Use your logo URL (e.g. `https://drccars.com/logo.png`). If you don’t have a logo yet, replace the `<img>` with a text title: **DRC Cars**.

---

### Confirm signup

**Subject:**  
`Confirm your email – DRC Cars`

**Body (HTML):**

```html
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

### Magic link

**Subject:**  
`Your login link – DRC Cars`

**Body (HTML):**

```html
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

### Reset password

**Subject:**  
`Reset your password – DRC Cars`

**Body (HTML):**

```html
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

## 3. Optional: other templates

You can reuse the same structure (logo block, dark background, gold button) for:

- **Invite user** – replace the main paragraph and button text; keep `{{ .ConfirmationURL }}` for the link.
- **Change email address** – same layout; use the variables Supabase provides for that template.

Do **not** remove the `{{ .ConfirmationURL }}` (or other variables Supabase shows in the default template); they are required for the links to work.

---

## 4. Logo URL

- If your logo is at `https://drccars.com/logo.png`, the templates above are ready.
- If you use another path (e.g. `/images/logo.png`), replace `https://drccars.com/logo.png` in each template with `https://drccars.com/images/logo.png`.
- If you don’t have a logo yet, remove the `<img>` line and use a text heading instead, e.g. `<h2 style="color: #fafafa;">DRC Cars</h2>`.
