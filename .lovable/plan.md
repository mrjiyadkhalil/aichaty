

# Phase 3: Usage Tracking, Spend Controls, Config & Export Upgrade

## Database Changes

### New table: `usage_events`
Tracks every AI request (model_compare, prompt_enhance, synthesis, retry).

| Column | Type | Notes |
|--------|------|-------|
| id | uuid PK | default gen_random_uuid() |
| user_id | uuid | NOT NULL |
| project_id | uuid | nullable |
| chat_id | uuid | nullable |
| message_id | uuid | nullable |
| provider | text | e.g. "google", "openai" |
| model | text | full model id |
| request_type | text | prompt_enhance, model_compare, synthesis, retry |
| input_tokens | integer | nullable, from API response |
| output_tokens | integer | nullable, from API response |
| estimated_cost | numeric(10,6) | nullable, computed from token counts |
| latency_ms | integer | nullable |
| status | text | success, error, blocked |
| error_code | text | nullable |
| created_at | timestamptz | default now() |

RLS: users can SELECT their own rows only. INSERT via edge functions using service role.

### New table: `user_preferences`
Stores per-user settings (cost mode, default models, default layout).

| Column | Type | Notes |
|--------|------|-------|
| id | uuid PK | default gen_random_uuid() |
| user_id | uuid | UNIQUE, NOT NULL |
| cost_mode | text | 'low_cost', 'balanced', 'premium'. Default 'balanced' |
| default_models | text[] | nullable |
| default_layout | text | 'grid' or 'stacked'. Default 'grid' |
| created_at | timestamptz | default now() |
| updated_at | timestamptz | default now() |

RLS: users can CRUD their own row.

### Add index on `usage_events`
- `(user_id, created_at)` for monthly aggregation queries

## Central Config System

Create `src/lib/aiConfig.ts` — a single file holding all limits and model definitions. No database config table needed for MVP.

```typescript
export const AI_CONFIG = {
  costModes: {
    low_cost: {
      enabledModels: ["google/gemini-2.5-flash-lite", "google/gemini-2.5-flash", "openai/gpt-5-nano"],
      maxOutputTokens: 2048,
      timeoutMs: 30000,
      synthesisModel: "google/gemini-2.5-flash-lite",
      enhanceModel: "google/gemini-2.5-flash-lite",
      premiumAllowed: false,
    },
    balanced: {
      enabledModels: ["google/gemini-3-flash-preview", "google/gemini-2.5-flash", "google/gemini-2.5-pro", "openai/gpt-5-mini", "openai/gpt-5-nano"],
      maxOutputTokens: 4096,
      timeoutMs: 60000,
      synthesisModel: "google/gemini-2.5-flash",
      enhanceModel: "google/gemini-2.5-flash",
      premiumAllowed: false,
    },
    premium: {
      enabledModels: [/* all models */],
      maxOutputTokens: 8192,
      timeoutMs: 90000,
      synthesisModel: "openai/gpt-5",
      enhanceModel: "google/gemini-2.5-flash",
      premiumAllowed: true,
    },
  },
  limits: {
    maxModelsPerRequest: 6,
    maxPromptLength: 10000,
    maxFileContextLength: 50000,
    maxSynthesisInputLength: 30000,
    maxFileSizeMb: 10,
    softCapUsd: 5.0,
    hardCapUsd: 10.0,
    rateLimit: { maxRequests: 30, windowMinutes: 60 },
    maxRetries: 1,
  },
  // Cost estimation per 1K tokens
  costPer1kTokens: {
    "google/gemini-2.5-flash-lite": { input: 0.0001, output: 0.0004 },
    "google/gemini-2.5-flash": { input: 0.00015, output: 0.0006 },
    // ... etc for each model
  },
};
```

## Edge Function Changes

### Update `multi-model-chat`
- Accept `max_tokens` and `timeout_ms` from request body
- Return `usage` object (input_tokens, output_tokens) from the AI gateway response
- After each call, insert a row into `usage_events` via service role client
- Before processing, check rate limit: count user's `usage_events` in last 60 min; if >= limit, return 429

### Update `enhance-prompt`
- Log usage_event with request_type = "prompt_enhance"
- Return token counts

### Update `synthesize`
- Log usage_event with request_type = "synthesis"
- Return token counts

### New helper in edge functions: `checkUsageCap`
Shared logic (inline in each function, since edge functions can't share modules easily):
- Query `usage_events` for current month, sum `estimated_cost` for user
- If >= hard cap → return 403 with `{ error: "Monthly usage limit reached", code: "HARD_CAP" }`
- If >= soft cap → include `warning: "Approaching usage limit"` in response

## Frontend: Usage Check Hook

Create `src/hooks/useUsage.ts`:
- Fetches current month's aggregated usage from `usage_events` (sum estimated_cost, count requests)
- Returns `{ totalCost, requestCount, isNearCap, isAtCap, loading }`
- Used by ChatWorkspace to block sends when at cap, and by Settings to show usage card

## Frontend: ChatWorkspace Integration

- Before `handleSend`: check `isAtCap` → show toast error, block
- If `isNearCap` → show warning toast but proceed
- Pass `max_tokens` and `timeout_ms` from config based on cost mode to edge function calls
- On 429/403 responses from edge functions, show appropriate error messages
- Filter available models in PromptComposer based on cost mode's `enabledModels`

## Settings Page Upgrade

Add three new cards:

**A. Preferences Card**
- Cost mode selector (radio group: Low Cost / Balanced / Premium)
- Default layout toggle
- Default models checkboxes (filtered by cost mode)
- Save to `user_preferences` table

**B. Usage Card**
- Current month estimated spend (from useUsage hook)
- Progress bar showing spend vs soft cap vs hard cap
- Status badge: "Normal" / "Near Limit" / "Limit Reached"
- Request count this month

**C. Keep existing** Profile, Appearance, Logout cards

## Export Upgrade

Enhance `ExportMenu`'s `generateMarkdown()` to include:
- Chat title
- Enhanced prompt (if used)
- Timestamps on each prompt
- Model name headers with latency

Add enhanced prompt display in the existing export. The ExportMenu already exists and works — just enrich the data passed to it from ChatWorkspace (include `enhanced_content`, `created_at` from messages).

## Error Handling

All user-facing errors use toast notifications:
- Soft cap: warning toast
- Hard cap: error toast "Monthly usage limit reached"
- Rate limit: error toast "Too many requests, please wait"
- Export fail: error toast
- Usage tracking write failure: log to console, don't block user request

## Implementation Order

1. Database migration (usage_events, user_preferences tables + indexes + RLS)
2. Create `src/lib/aiConfig.ts` config file
3. Update 3 edge functions (usage logging + cap checks + rate limit)
4. Create `src/hooks/useUsage.ts`
5. Update ChatWorkspace (cap checks, cost mode filtering)
6. Upgrade Settings page (preferences, usage card, cost mode)
7. Enrich ExportMenu with enhanced prompt + timestamps

