# Gmail Email Setup Troubleshooting

Account: `hermescruise@gmail.com` (attempted, not yet working as of 2026-05-03)

## Prerequisites (all must be true)

1. **2-Factor Authentication ON** — App Passwords require 2FA. Check at: https://myaccount.google.com/security
2. **IMAP enabled** — Gmail → Settings → Forwarding and POP/IMAP → Enable IMAP → Save
3. **Correct Google account** — App Passwords page shows the right avatar/email in top-right. Generate passwords while signed into the Hermes account, NOT your personal account.

## App Password Format

Google displays App Passwords as `xxxx xxxx xxxx xxxx` (4 groups of 4 with spaces). **Strip the spaces** — the actual password is 16 chars, no spaces:

```bash
# In .env, the value must be 16 chars with NO spaces:
EMAIL_PASSWORD=lxixadufohfchict  # correct
EMAIL_PASSWORD=lxix aduf ohfc hict  # WRONG — spaces cause BadCredentials
```

## When Credentials Are Correct but Still Rejected

If password is 16 chars + no spaces and Google still returns `535 BadCredentials`, rule out these:

1. **IMAP wasn't enabled** when the App Password was generated → generate a fresh one after enabling IMAP
2. **Account too new** — Google sometimes blocks SMTP/IMAP for hours after account creation
3. **Security alert pending** — check inbox at hermescruise@gmail.com for "Sign-in attempt blocked" email
4. **DisplayUnlockCaptcha page is deprecated** (as of 2026) — don't bother with that URL

## Testing Credentials Independently

Before relying on Hermes' built-in SMTP, test credentials directly:

```python
# SMTP test (port 587 STARTTLS)
import smtplib
server = smtplib.SMTP('smtp.gmail.com', 587, timeout=10)
server.starttls()
server.login('hermescruise@gmail.com', password)

# IMAP test (port 993 SSL)
import imaplib
mail = imaplib.IMAP4_SSL('imap.gmail.com', 993, timeout=10)
mail.login('hermescruise@gmail.com', password)
```

If IMAP also fails, the App Password is genuinely wrong or Google is blocking the account entirely.

## .env Configuration (uncommented, filled in)

```ini
EMAIL_ADDRESS=hermescruise@gmail.com
EMAIL_PASSWORD=16charNoSpaces
EMAIL_IMAP_HOST=imap.gmail.com
EMAIL_IMAP_PORT=993
EMAIL_SMTP_HOST=smtp.gmail.com
EMAIL_SMTP_PORT=587
EMAIL_POLL_INTERVAL=15
EMAIL_ALLOWED_USERS=tiagocruz3@gmail.com
EMAIL_HOME_ADDRESS=tiagocruz3@gmail.com
```

Restart gateway after changes: `systemctl --user restart hermes-gateway`