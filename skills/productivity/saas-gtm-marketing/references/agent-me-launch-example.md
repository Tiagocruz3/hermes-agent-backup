# Agent Me Launch — Real Session Example

## Context
- Product: Agent Me (agentme.app) — AI workspace for marketing agencies
- Features: content generation, lead scraping, deep research, ad copy, white-label reports, X posting, image generation
- Pricing: Free (50 credits) → Freelancer A$15 → Studio A$29 → Agency A$89
- Stack: React SPA, Coolify VPS, self-hosted

## What Was Produced (6-Pack Arsenal)

| File | Lines | Purpose |
|------|-------|---------|
| agentme-marketing-plan.md | 639 | Master strategy, positioning, PH timeline, SEO calendar, affiliate program, KPIs |
| agentme-producthunt-launch.md | 139 | PH tagline, description, maker comment, gallery captions, hour-by-hour timeline |
| agentme-blog-posts.md | 510 | 5 full SEO blog posts (800-1200 words each) with meta titles and keywords |
| agentme-demo-script.md | 125 | 60-sec video script + new hero copy + 3 testimonial placeholders |
| agentme-social-calendar.md | 961 | 30-day calendar, 60 post templates, X + LinkedIn schedules, hashtags |
| agentme-outreach-templates.md | 254 | 4-touch email, LinkedIn DM sequence, cold call script, referral template |

**Total: 2,628 lines across 6 documents, produced in ~8 minutes via 6 parallel agents.**

## Key Techniques Used

1. **Landing page inspection via curl**: The site is a React SPA, so `curl` only gets the HTML shell. To understand features, we:
   - Fetched the main JS bundle and grepped for string literals
   - Fetched the CSS to understand theming system (10+ themes: ChatGPT, Ubuntu, X-Twitter, Claude, etc.)
   - Fetched route-specific chunks (LandingPage, Pricing) to extract copy and pricing tiers

2. **Parallel agent delegation**: Used `delegate_task` with 3 concurrent agents × 2 batches to produce all 6 documents. First batch: master plan + PH + blogs. Second batch: demo script + social + outreach.

3. **Concise delivery**: User prefers tables over paragraphs. Final summary was a 6-row table + 3-phase execution roadmap + question.

## PH Launch Assets (Extracted)

**Tagline**: "AI workspace for agencies — content, leads, ads, reports in one chat."
**Description**: "Agent Me is the AI workspace built for marketing agencies. Generate content, scrape leads, run deep research, write ad copy, and deliver white-label client reports — all from one chat interface."
**Maker comment**: Personal story about building it after watching agency friends drown in tool subscriptions.

## Pricing Tiers (Extracted from JS Bundle)

| Plan | Price | Credits | Key Limitation |
|------|-------|---------|----------------|
| Free | $0 | 50/mo | No X posting, no lead scraper, no deep research |
| Freelancer | A$15 | 500/mo | No CSV export, no automation agents |
| Studio | A$29 | 2,000/mo | No white-label, no team seats |
| Agency | A$89 | 10,000/mo | Everything + 5 team seats + white-label PDF |

## Social Content Pillars

1. Growth Tips (30%) — pricing, scope creep, automation stacks
2. Behind-the-Scenes (20%) — origin story, cut features, team rituals
3. Product Demos (20%) — auto-reporting, lead scraping, onboarding
4. Social Proof (15%) — beta wins, before/after, skeptic stories
5. Memes/Culture (15%) — relatable agency humor, hot takes

## Outreach Sequence

Touch 1 (Day 1): Personalized observation + soft mention
Touch 2 (Day 4): Free resource (SOP template, ops audit guide)
Touch 3 (Day 8): Case study from similar agency + direct ask
Touch 4 (Day 14): Friendly breakup, easy out

## KPI Targets

| Metric | Month 1 | Month 3 | Month 6 |
|--------|---------|---------|---------|
| Visitors | 1,000 | 5,000 | 15,000 |
| Signups | 100 | 500 | 1,500 |
| Paid | 5 | 30 | 100 |
| MRR | ~$100 | ~$600 | ~$2,000 |
