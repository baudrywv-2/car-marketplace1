# Change the Gmail profile picture next to DRCCARS emails

The circle next to **DRC Cars / no-reply@drccars.com** in Gmail is **not** set by the email HTML template.
It comes from Google’s sender identity (or BIMI).

Ready file (wheel logo on dark square):  
`public/gmail-avatar.png` → after deploy: https://www.drccars.com/gmail-avatar.png  
Also copy to Desktop if needed for upload.

---

## Option A — Fastest (if you use Google Workspace for drccars.com)

1. Sign in to Google with the Workspace user that owns the domain (or create `noreply@drccars.com` / use admin).
2. Open https://myaccount.google.com/personal-info → **Photo**
3. Upload `gmail-avatar.png` (square wheel logo).
4. In Supabase SMTP, set **Sender name** to `DRCCARS` (not “DRC Cars”).
5. Send a new test email. Gmail may take a while to refresh the cached avatar.

If mail is only sent via Resend SMTP and there is **no** Google account for that address, Option A alone may not show for every recipient — use Option B.

---

## Option B — Proper brand logo for everyone in Gmail (BIMI)

Gmail shows a brand logo in the inbox when BIMI is set up:

1. SPF + DKIM + DMARC already correct for `drccars.com` (via Resend domain setup).
2. DMARC policy must be `p=quarantine` or `p=reject` (not `p=none`).
3. Buy a **CMC** (Common Mark Certificate) or **VMC** (trademark) — DigiCert / Entrust, etc.
4. Host a BIMI SVG logo (SVG Tiny PS) on HTTPS.
5. Add DNS TXT: `default._bimi.drccars.com`

See: https://resend.com/docs/dashboard/domains/bimi

---

## Also update (recommended now)

Supabase → Authentication → SMTP / Email:

| Field        | Value                |
|-------------|----------------------|
| Sender name | `DRCCARS`            |
| Sender email| `no-reply@drccars.com` |

This fixes the display name; the circle photo still needs A or B above.
