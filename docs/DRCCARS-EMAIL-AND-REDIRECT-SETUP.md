# DRC Cars – One guide: Resend, redirect to drccars.com, branded emails

Do these steps in order. When done, users get emails from **no-reply@drccars.com**, with your logo and colors, and confirmation/reset links send them to **drccars.com** (not localhost).

---

## Step 1: Resend API key

1. Go to [resend.com](https://resend.com) and sign in.
2. Open **API Keys** (sidebar or **Integrate** → **API Keys**).
3. Click **Create API Key**, name it (e.g. `Supabase Auth`), create.
4. Copy the key (starts with `re_`). You won’t see it again.

---

## Step 2: Supabase custom SMTP (send from drccars.com)

1. Open [Supabase Dashboard](https://supabase.com/dashboard) → your **car-marketplace** project.
2. Go to **Authentication** → **Providers** → **Email**.
3. Find **SMTP Settings** / **Custom SMTP** and turn it **ON**.
4. Fill in:

   | Field           | Value                          |
   |-----------------|--------------------------------|
   | Sender email    | `no-reply@drccars.com`         |
   | Sender name     | `DRC Cars`                     |
   | Host            | `smtp.resend.com`              |
   | Port            | `587`                          |
   | Username        | `resend`                       |
   | Password        | *(paste your Resend API key)*  |

5. Click **Save**.

---

## Step 3: Redirect to drccars.com (no localhost after confirm)

1. In Supabase: **Authentication** → **URL Configuration**.
2. Set **Site URL** to: `https://drccars.com`
3. Under **Redirect URLs**, add:
   - `https://drccars.com/**`
4. Click **Save**.

The app code already uses `SITE_URL` for signup and reset links, so once this is set, confirmation and password-reset emails will send users to drccars.com.

---

## Step 4: Branded email templates in Supabase

1. In Supabase: **Authentication** → **Email Templates**.
2. For each template below, open it, set **Subject** and replace **Body** with the HTML given. Leave the variable `{{ .ConfirmationURL }}` exactly as written.

---

### 4a. Confirm signup

- **Subject:** `Confirm your email – DRC Cars`
- **Body:** paste this (replace the logo URL if yours is different):

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

### 4b. Reset password

- **Subject:** `Reset your password – DRC Cars`
- **Body:**

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

### 4c. Magic link (if you use it)

- **Subject:** `Your login link – DRC Cars`
- **Body:**

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

## Step 5: Logo

- **Default:** All templates use `https://drccars.com/logo.png`. If your logo lives at that URL, do nothing.
- **Logo elsewhere:** Replace `https://drccars.com/logo.png` with your logo URL in every place it appears:
  - In **Supabase:** Authentication → Email Templates → edit the **Body** of **Confirm signup**, **Reset password**, and **Magic link**. Find `https://drccars.com/logo.png` and replace with your URL (e.g. `https://drccars.com/images/logo.png`).
  - In this repo (so future copy-paste is correct): in `docs/email-templates/1-confirm-signup-body.html`, `2-reset-password-body.html`, and `3-magic-link-body.html`, replace `https://drccars.com/logo.png` with your URL.
- **No logo yet:** In each template Body, remove the `<img ... />` line and put this in its place inside the same `<div style="text-align: center; margin-bottom: 24px;">`:  
  `<h2 style="color: #fafafa; margin: 0;">DRC Cars</h2>`

---

## Step 6: Production env

In your hosting (e.g. Vercel):

1. Open your project → **Settings** → **Environment Variables**.
2. Add (or edit):
   - **Name:** `NEXT_PUBLIC_SITE_URL`
   - **Value:** `https://drccars.com`
3. **Save** and **redeploy** so the new variable is used (auth redirects and links will then point to drccars.com).

---

## Done

- Emails are sent via Resend from **no-reply@drccars.com**.
- Emails use your branding (dark background, gold button).
- After “Confirm email” or “Reset password”, users go to **drccars.com** (login or reset-password page), not localhost.

To test: sign up with a real email or use “Forgot password?” on the login page and check the inbox.
