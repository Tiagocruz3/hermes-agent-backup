# DNS CNAME Pattern for Self-Hosted Subdomains

## Standard Subdomain Setup

For any new service on a self-hosted stack, use this DNS pattern:

| Type | Host | Points to | TTL |
|------|------|-----------|-----|
| A | @ | `<vps-ip>` | 600 |
| CNAME | `<service>` | `yourdomain.com` | 600 |

**Common service subdomains:**
- `search` → SearXNG
- `scrape` → Crawl4AI / Python scraper
- `db` → Supabase Studio
- `api` → LiteLLM / API gateway
- `admin` → Admin panel
- `www` → Main site

## Hostinger-Specific Notes

- Hostinger DNS propagates in **1-5 minutes**
- Let's Encrypt may take **5-10 minutes** after DNS propagation to issue certificates
- If SSL fails immediately after adding CNAME: **wait 5 minutes, restart Traefik**
- Hostinger control panel shows all records on one page — screenshot and verify

## Verification Commands

```bash
# Check DNS propagation
dig search.yourdomain.com +short
# Should return: <vps-ip>

# Check SSL certificate
curl -sI https://search.yourdomain.com | grep -i "strict-transport"
# Should show: Strict-Transport-Security

# Check from VPS itself
curl -s -o /dev/null -w "%{http_code}" https://search.yourdomain.com
# Should return: 200
```

## Session Reference

2026-05-10 — Verified 6 CNAME records in Hostinger: `www`, `admin`, `api`, `search`, `scrape`, `db` all pointing to `brainstormnodes.org`. All propagated and SSL-secured via Let's Encrypt within 10 minutes.
