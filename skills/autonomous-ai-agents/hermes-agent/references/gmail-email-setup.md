# Gmail Email Setup — Hermes Gateway

Configuring `hermescruise@gmail.com` for IMAP/SMTP through the Hermes gateway was a multi-hour debugging session. This document captures every pitfall encountered so the next attempt (or the next account) doesn't repeat them.

## Prerequisites (ALL required — miss one and it fails silently with "BadCredentials")

1. **2-Step Verification must be ON** — App Passwords are invisible without it
2. **IMAP must be enabled** in Gmail settings (gear → See all settings → Forwarding and POP/IMAP → Enable IMAP → Save)
3. **Account must be "warm"** — brand new accounts may silently block third-party app access. Send at least one email from the web UI first.
4. **Recovery phone recommended** — new accounts without a phone may have tighter restrictions

## Generating the App Password

1. Sign into the **correct account** (check avatar in top-right)
2. Go to https://myaccount.google.com/apppasswords
3. Select app: **Other (custom name)** → type **Hermes**
4. Copy the 16-char code (format: `abcd efgh ijkl mnop`)
5. **Strip spaces** before using — Google displays them with spaces but the actual password is 16 contiguous chars

## .env Configuration

```ini
EMAIL_ADDRESS=hermescruise@gmail.com
EMAIL_PASSWORD=abcdefghijklmnop     # 16 chars, NO spaces
EMAIL_IMAP_HOST=imap.gmail.com
EMAIL_IMAP_PORT=993
EMAIL_SMTP_HOST=smtp.gmail.com
EMAIL_SMTP_PORT=587
EMAIL_POLL_INTERVAL=15
EMAIL_ALLOWED_USERS=your@email.com
EMAIL_HOME_ADDRESS=your@email.com
```

After updating .env:
```bash
systemctl --user restart hermes-gateway
```

## Testing Credentials

Test SMTP directly to rule out Hermes-specific issues:

```bash
# Read password from .env
PASS=$(grep EMAIL_PASSWORD ~/.hermes/.env | cut -d= -f2)

# Test SMTP STARTTLS (port 587)
python3 -c "
import smtplib
s = smtplib.SMTP('smtp.gmail.com', 587, timeout=10)
s.starttls()
s.login('hermescruise@gmail.com', '$PASS')
print('SMTP OK')
s.quit()
"

# Test IMAP (port 993)
python3 -c "
import imaplib
m = imaplib.IMAP4_SSL('imap.gmail.com', 993, timeout=10)
m.login('hermescruise@gmail.com', '$PASS')
print('IMAP OK')
m.logout()
"
```

## Common Failures

| Symptom | Root cause | Fix |
|---------|-----------|-----|
| `535 BadCredentials` | Spaces in password | `tr -d ' '` |
| `535 BadCredentials` | IMAP not enabled | Enable in Gmail settings |
| `535 BadCredentials` | App Password generated under wrong account | Check avatar, regenerate |
| `535 BadCredentials` | 2FA not actually on | Enable at myaccount.google.com/security |
| `535 BadCredentials` | Account too new / cold | Send email from web UI first |

## Dead Ends

- **DisplayUnlockCaptcha** (accounts.google.com/DisplayUnlockCaptcha) — Google deprecated this. "This website is no longer available. To better protect your account, Google no longer allows account access with this website."
- **"Allow less secure apps"** — Google removed this toggle entirely. App Passwords are the only path.
- **Port 465 vs 587** — both work if credentials are valid. Port doesn't matter when auth fails.
- **Multiple App Passwords** — generating 5+ passwords for the same account won't help if the underlying issue (IMAP off, 2FA off, cold account) isn't fixed.

## Session Status (2026-05-03)

As of this session, `hermescruise@gmail.com` SMTP/IMAP was **NOT** successfully authenticated despite 5+ App Password attempts. The account was brand new and may still be under Google's new-account restrictions. Recommended next step: use the account normally for a few days (send/receive emails via web UI), then try a fresh App Password.
