---
name: saas-gtm-marketing
description: "Complete SaaS go-to-market and marketing operations: product launches, content calendars, outreach campaigns, social automation, and growth tracking. Designed for indie hackers and small teams shipping fast."
version: 1.0.0
author: Hermes Agent
license: MIT
metadata:
  hermes:
    tags: [saas, marketing, gtm, product-launch, content, outreach, social-media, growth]
    related_skills: [xurl, plan, writing-plans]
---

# SaaS Go-to-Market & Marketing Operations

A battle-tested playbook for launching and growing SaaS products — from first landing page to Product Hunt #1 and beyond. Built for speed, not bureaucracy.

## When to Use This Skill

- User says "launch my SaaS", "market my product", "get users", "Product Hunt launch", "content strategy", "cold outreach", or any GTM request
- Building marketing assets (landing page copy, demo scripts, blog posts, social content)
- Setting up repeatable marketing workflows (social automation, email sequences, affiliate programs)
- Tracking growth metrics and iterating on channels

## Core Principle: Parallel Agent Execution

Marketing asset creation is embarrassingly parallel. Don't write everything sequentially — **spin up 3 agents at once** via `delegate_task` to produce:
- Agent A: Master strategy + positioning
- Agent B: Channel-specific assets (PH launch, blog posts)
- Agent C: Creative assets (demo script, social calendar, outreach templates)

This produces a complete marketing arsenal in ~5 minutes instead of 30.

## The 6-Pack Marketing Arsenal

Every SaaS launch should produce these 6 documents before going live:

1. **Master Marketing Plan** (`{project}-marketing-plan.md`) — positioning, personas, channel strategy, KPIs
2. **Product Hunt Launch Pack** (`{project}-producthunt-launch.md`) — tagline, description, gallery, timeline, maker comment
3. **SEO Blog Posts** (`{project}-blog-posts.md`) — 5 posts targeting buyer keywords
4. **Demo Video Script** (`{project}-demo-script.md`) — 60-sec script + landing page copy refresh
5. **Social Media Calendar** (`{project}-social-calendar.md`) — 30-day calendar with 60+ post templates
6. **Outreach Playbook** (`{project}-outreach-templates.md`) — cold email sequence, LinkedIn DMs, call script

## Execution Workflow

### Phase 1: Asset Creation (Day 1)

```
Step 1: Inspect the product (curl the landing page, read the JS bundle for features)
Step 2: Delegate 3 parallel tasks to produce the 6-pack
Step 3: Verify files exist with `ls -la` and `wc -l`
Step 4: Present summary table, ask user which to execute first
```

**Pitfall**: Don't try to write all 6 documents yourself in one turn. You'll hit context limits and produce thin content. Delegate.

### Phase 2: Active Execution (Day 2-30)

Priority order (adjust based on user's stage):

| Priority | Action | Why |
|----------|--------|-----|
| P0 | Start X/Twitter + LinkedIn posting | Builds audience pre-launch; compounds |
| P1 | Record 60-sec demo video | Highest-conversion asset on landing page |
| P2 | Product Hunt launch | Biggest single-day traffic spike |
| P3 | Cold outreach to 50 agency owners | Direct revenue; validates messaging |
| P4 | Publish blog posts | SEO takes 3-6 months to compound |
| P5 | Affiliate program | Scales after you have 10+ happy users |

### Phase 3: Iterate (Ongoing)

- Weekly: Review which posts got engagement, double down
- Bi-weekly: A/B test landing page headline
- Monthly: Review KPI dashboard, kill underperforming channels

## User-Specific Conventions

For user **ace** (Thiago/Tiago Cruz):
- **Delivery style**: Concise. Table summaries > paragraphs. One-line confirmations for direct commands. No verbose explanations unless asked.
- **Execution preference**: "just deploy" = docker run immediately. "don't worry about UI" = terminal only.
- **Satisfaction signals**: "beautiful", "lets test", "done" = STOP, give endpoints + credentials.
- **Domain**: agentme.app on Coolify VPS 195.35.20.80

## Channel-Specific Playbooks

### Product Hunt Launch

**Pre-launch (4 weeks before):**
- Week 1: Create PH account, join discussions, build karma
- Week 2: Prepare gallery images (5), write maker comment, record video
- Week 3: Line up hunter, schedule launch date, prep supporter outreach
- Week 4: Soft launch to beta list, collect testimonials

**Launch day (hour-by-hour):**
- 6:00 AM PT: Go live, post maker comment, share in 3 communities
- 7:00-10:00 AM: Respond to every comment within 5 minutes
- 10:00 AM: First milestone check (target: 100 upvotes)
- 12:00 PM: Second push — email list, LinkedIn, X
- 2:00 PM: Third push — Slack communities, Discord servers
- 4:00 PM: Final milestone check (target: 300 upvotes)
- 6:00 PM onwards: Respond to comments, thank supporters

**Target**: Top 5 of the day, 800+ upvotes for sustained traffic.

### X/Twitter Growth

- **Frequency**: 2 posts/day (8 AM + 1 PM)
- **Content mix**: 30% tips, 20% behind-the-scenes, 20% product demos, 15% social proof, 15% memes
- **Engagement**: Reply to 10 relevant posts daily. Quote-tweet with value-add.
- **Hashtags**: 2-3 max per post. Rotate sets to avoid looking automated.

### LinkedIn Growth

- **Frequency**: 1 post/day (9 AM, Mon-Fri)
- **Format rotation**: Mon = long-form story, Tue = carousel, Wed = product demo, Thu = testimonial, Fri = hot take
- **Tone**: Professional but personal. Share failures, not just wins.

### Cold Outreach

**4-touch email sequence:**
1. **Day 1 — Hook**: Personalized observation about their agency + soft mention of your tool
2. **Day 4 — Value Add**: Share a free resource (SOP template, ops audit) related to their pain
3. **Day 8 — Social Proof**: Brief case study from a similar agency + direct ask for 15-min call
4. **Day 14 — Breakup**: Friendly close, give them an easy out

**Rule**: Every email must have a personalization placeholder (agency name, niche, recent project). No mass-blast templates.

## KPI Framework

**North Star**: MRR (Monthly Recurring Revenue)

| Stage | Month 1 | Month 3 | Month 6 |
|-------|---------|---------|---------|
| Website visitors | 1,000 | 5,000 | 15,000 |
| Signups | 100 | 500 | 1,500 |
| Activation rate | 20% | 25% | 30% |
| Paid conversions | 5 | 30 | 100 |
| MRR | $100 | $600 | $2,000 |
| Churn | <10% | <8% | <5% |

**Weekly tracking**: Signups, activation, revenue, top traffic source, best-performing content

## Tools Stack

- **Social scheduling**: Typefully (X), Taplio (LinkedIn), or Buffer
- **Email outreach**: Instantly, Apollo, or Lemlist
- **Analytics**: Plausible (privacy-friendly) or Google Analytics 4
- **Landing page**: Next.js + Vercel, or keep existing React app
- **Blog**: MDX in Next.js, or Ghost/Substack for speed
- **Affiliate tracking**: Rewardful, FirstPromoter, or自建 with Stripe webhooks

## References

- `references/agent-me-launch-example.md` — Real example from this session (Agent Me: 2,628 lines of marketing assets produced via 6 parallel agents in 8 minutes)
- `templates/ph-launch-checklist.md` — Reusable Product Hunt launch checklist (4-week + launch day timeline)
- `templates/content-calendar-30day.md` — 30-day social media calendar template with 60+ post templates, hashtag sets, and automation setup
