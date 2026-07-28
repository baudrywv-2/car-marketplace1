SUPABASE EMAIL TEMPLATES – DRCCARS (premium)
============================================

Emails are sent by Supabase Auth. Update templates in:
  Supabase Dashboard → Authentication → Email Templates

LOGO (hosted on the site after deploy):
  https://www.drccars.com/email-logo.png
  (file in repo: public/email-logo.png — wheel monogram)

1) CONFIRM SIGNUP
   Subject: 1-confirm-signup-subject.txt
   Body:    1-confirm-signup-body.html   (keep {{ .ConfirmationURL }})

2) RESET PASSWORD
   Subject: 2-reset-password-subject.txt
   Body:    2-reset-password-body.html   (keep {{ .ConfirmationURL }})

3) MAGIC LINK
   Subject: 3-magic-link-subject.txt
   Body:    3-magic-link-body.html       (keep {{ .ConfirmationURL }})

Steps:
  1. Deploy / push so email-logo.png is live on drccars.com
  2. Open each template in Supabase → paste Subject + Body → Save
  3. Send a test signup to verify logo + French copy

Optional: Authentication → Email → also set Sender name to "DRCCARS"
