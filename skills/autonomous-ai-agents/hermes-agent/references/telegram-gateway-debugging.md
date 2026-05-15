# Telegram Gateway Debugging

## Symptom → Diagnosis → Fix

### 1. "No messaging platforms enabled" on Gateway Start

**Log signature:**
```
WARNING gateway.run: No messaging platforms enabled.
WARNING gateway.run: Gateway will continue running for cron job execution.
```
(No "Connecting to telegram..." line appears.)

**Root cause:** `TELEGRAM_BOT_TOKEN` is missing or unparseable when the gateway process starts.

**Check:**
```bash
grep "TELEGRAM_BOT_TOKEN" ~/.hermes/.env
```

**Common `.env` formatting issues that break parsing:**
- Inline `#` comments on the same line: `TELEGRAM_BOT_TOKEN=12345:abc # my bot` — the `#` gets treated as part of the value
- Trailing whitespace after the value
- Missing `=` sign

**Fix:** Keep comments on their own line:
```env
# Telegram bot for Hermes
TELEGRAM_BOT_TOKEN=12345:abcdefgh
```
Then restart: `systemctl --user restart hermes-gateway.service`

---

### 2. Gateway Connects But Messages Not Received

**Log signature:**
```
INFO gateway.platforms.telegram: [Telegram] Connected to Telegram (polling mode)
INFO gateway.run: ✓ telegram connected
```
...but then NO `inbound message:` lines appear, even minutes after sending test messages.

**Root cause:** The polling loop got stuck. This happens when the gateway was SIGTERM'd during an active Telegram agent session and the new process picks up a stale state.

**Fix:**
```bash
systemctl --user restart hermes-gateway.service
# Wait 3s, then verify:
tail -5 ~/.hermes/logs/gateway.log | grep "Connected to Telegram"
```
Then send a message from the Telegram client and watch for:
```
INFO gateway.run: inbound message: platform=telegram ...
```

If still no inbound messages after restart, check the bot token is still valid by sending a test message outbound:
```
send_message target=telegram:CHAT_ID message="test"
```

---

### 3. "No home channel set" on send_message

**Error:**
```
No home channel set for telegram to determine where to send the message.
```

**Root cause:** `TELEGRAM_HOME_CHANNEL` is not configured in config.yaml.

**Find your chat ID:** Look in gateway.log for inbound message lines:
```
INFO gateway.run: inbound message: platform=telegram user=... chat=7847610860 msg='...'
```
The `chat=` value (e.g., `7847610860`) is your chat ID.

**Fix:**
```bash
hermes config set TELEGRAM_HOME_CHANNEL 7847610860
```
No gateway restart needed — takes effect immediately.

**Verify:**
```bash
hermes config | grep TELEGRAM_HOME_CHANNEL
```

---

### 4. Telegram DNS / Connectivity Fallback

**Log signature (normal, not an error):**
```
INFO gateway.platforms.telegram_network: DoH discovery yielded no new IPs
  (system DNS: 149.154.166.110); using seed fallback IPs 149.154.167.220
INFO gateway.platforms.telegram: [Telegram] Telegram fallback IPs active: 149.154.167.220
```

This happens when the system DNS can't resolve api.telegram.org. Hermes ships with seed fallback IPs and uses DoH (DNS-over-HTTPS) to discover additional IPs. The fallback path works fine — polling and message delivery continue normally through the fallback IP.

Only investigate if you additionally see connection errors:
```
WARNING gateway.platforms.telegram_network: [Telegram] Primary api.telegram.org connection failed
WARNING gateway.platforms.telegram_network: [Telegram] Primary api.telegram.org path unreachable
```
In that case, check network connectivity: `curl -v https://api.telegram.org/bot<TOKEN>/getMe`

---

## Quick Health Check Sequence

```bash
# 1. Is the gateway running?
systemctl --user is-active hermes-gateway.service

# 2. Did it connect to Telegram?
tail -30 ~/.hermes/logs/gateway.log | grep -E "Connected to Telegram|No messaging platforms"

# 3. Is it receiving messages?
tail -30 ~/.hermes/logs/gateway.log | grep "inbound message"

# 4. Is the bot token present?
grep -c "TELEGRAM_BOT_TOKEN=" ~/.hermes/.env

# 5. Home channel set?
hermes config | grep TELEGRAM_HOME_CHANNEL
```
