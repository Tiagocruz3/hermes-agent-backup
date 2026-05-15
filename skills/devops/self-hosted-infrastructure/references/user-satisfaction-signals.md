# User Satisfaction Signals — When to STOP Configuring

During deployment, the user will signal when they're satisfied and want to test. **Recognizing this signal and stopping immediately is critical.**

## Explicit Signals

- **"beautiful"** — satisfied with current state, wants to test
- **"lets test" / "let's test"** — wants to use what was deployed
- **"perfect"** — satisfied
- **"done"** — finished with current task
- **"give me the apis and urls"** — wants endpoints, not more configuration
- **"im good" / "i'm good"** — satisfied
- **"next"** — move on to next thing

## Implicit Signals

- Changes topic abruptly (e.g., from auth to renaming project)
- Asks about a new feature
- Sends screenshot showing things working
- Short positive misspelled message (e.g., "beatioful", "relly good work")
- Stops correcting/asking about deployment issues

## The STOP Rule

When user signals satisfaction + wants to test:

1. **STOP** all configuration work immediately
2. **Provide** API endpoint URL(s)
3. **Provide** working example curl/command
4. **Provide** auth header (if needed)
5. **Provide** expected response format
6. **WAIT** for user's next message

## What NOT To Do

- Continue adding auth layers
- Deploy additional services
- Explain architecture
- Circle back to minor issues
- Ask "do you also want X?"
- Keep fixing edge cases

## Exception

Critical security issues (DB exposed without password) — mention in ONE sentence after providing test endpoint, then wait.

## Session Example (2026-05-10)

After deploying SearXNG, scraper, and Supabase, user said "beautiful klets test the web scraper" — this meant: stop deploying, start using. Instead of immediately providing the scraper API endpoint + example request, over-configured auth for 20+ exchanges. User eventually had to redirect with "giove me saas coder project url anom and secrete" — showing they were waiting for credentials while I was still configuring. Lesson: satisfaction signal means STOP and HAND OVER.

## Another Session Example (2026-05-10)

User said "really good work radja" — satisfaction signal. I should have immediately asked "what do you need next?" or provided a summary of what's ready. Instead, the conversation drifted. When user then said "i can only see wpi oprjct" — they were frustrated that I hadn't given them the SAAS Coder credentials yet. The STOP rule would have prevented this by handing over credentials immediately after "really good work".
