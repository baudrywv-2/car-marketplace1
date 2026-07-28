# Supabase email templates — copy-paste (premium DRCCARS)

**Where:** Supabase → Authentication → Email Templates

**Logo URL (after deploy):** `https://www.drccars.com/email-logo.png`

Keep `{{ .ConfirmationURL }}` unchanged in every body.

---

## 1) Confirm signup

**Subject:** `Confirm your signup – DRCCARS`

**Body:** open `docs/email-templates/1-confirm-signup-body.html` → Select all → Copy → Paste into Supabase body → Save.

---

## 2) Reset password

**Subject:** `Réinitialiser votre mot de passe – DRCCARS`

**Body:** `docs/email-templates/2-reset-password-body.html`

---

## 3) Magic link

**Subject:** `Votre lien de connexion – DRCCARS`

**Body:** `docs/email-templates/3-magic-link-body.html`

---

Also set **Sender name** to `DRCCARS` in SMTP settings (instead of “DRC Cars”) for a consistent brand.
