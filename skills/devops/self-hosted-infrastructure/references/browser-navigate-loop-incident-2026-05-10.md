# Browser Navigate Loop Incident — 2026-05-10

## Incident Summary
Agent got stuck in a 50+ iteration loop calling `browser_navigate` with identical arguments after the first failure. The URL `https://functions.brainstormnodes.org` consistently returned "Blocked: URL targets a private or internal address" but the agent kept retrying instead of switching to `terminal` + `curl`.

## Root Cause
The browser tool has restrictions on accessing certain URLs (internal IPs, some subdomains, or URLs triggering security policies). Once blocked, the same URL will ALWAYS be blocked — retries are futile.

## Impact
- 50+ wasted tool calls
- Session context window consumed
- User had to wait unnecessarily
- No progress on the actual task (checking if edge functions were deployed)

## Correct Behavior
1. **First failure:** Note the error type
2. **If "Blocked" or "private/internal address":** Switch to `terminal` with `curl` immediately
3. **If "Interrupted":** Try once more, then switch to terminal
4. **Never retry the same `browser_navigate` more than 3 times total**

## What Should Have Happened
```bash
# After first browser_navigate failure:
terminal: curl -s https://functions.brainstormnodes.org/ | head -20
# Returns empty → endpoint is down or misconfigured
# Move on to checking containers: docker ps | grep functions
```

## Lesson
**Browser tool failures are permanent for a given URL.** The tool does not recover on retry. Switch to terminal-based HTTP checks (`curl`, `wget`) immediately.

## Related
- `self-hosted-infrastructure/SKILL.md` → "Tool Calling Anti-Patterns" section
- `supabase-migration/SKILL.md` → "Tool Calling: Browser vs Terminal for Endpoint Checks" section
