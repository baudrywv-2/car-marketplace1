SUPABASE EMAIL TEMPLATES – COPY-PASTE
=====================================

Where to paste: Supabase Dashboard → Authentication → Email Templates.

For each template in Supabase, do this:

1. CONFIRM SIGNUP
   - Open the "Confirm signup" template.
   - Subject: copy from 1-confirm-signup-subject.txt → paste into Subject.
   - Body: open 1-confirm-signup-body.html, Select All (Ctrl+A / Cmd+A), Copy, paste into Body.
   - Save. Do NOT change {{ .ConfirmationURL }} in the body.

2. RESET PASSWORD
   - Open the "Reset password" template.
   - Subject: copy from 2-reset-password-subject.txt → paste into Subject.
   - Body: open 2-reset-password-body.html, Select All, Copy, paste into Body.
   - Save. Do NOT change {{ .ConfirmationURL }}.

3. MAGIC LINK
   - Open the "Magic link" template.
   - Subject: copy from 3-magic-link-subject.txt → paste into Subject.
   - Body: open 3-magic-link-body.html, Select All, Copy, paste into Body.
   - Save. Do NOT change {{ .ConfirmationURL }}.

Done.

LOGO: Templates use https://drccars.com/logo.png. If your logo is elsewhere, replace that URL in all three *-body.html files (and in Supabase if you already pasted). No logo? Replace the <img> line with: <h2 style="color: #fafafa; margin: 0;">DRC Cars</h2>
