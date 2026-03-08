

# Phase 5: Admin Panel & Operations Layer

## Current State
- `user_roles` table exists with `app_role` enum (`admin`, `user`)
- `has_role(_user_id, _role)` security definer function exists
- `usage_events` table tracks all AI requests with cost data
- `profiles` table has `user_id`, `display_name`, `avatar_url` but no `status` field
- Edge functions already log usage and enforce caps

## Database Migration

### 1. Add `status` to `profiles`
```sql
ALTER TABLE profiles ADD COLUMN status text NOT NULL DEFAULT 'active';
```

### 2. Create `error_logs` table
| Column | Type | Notes |
|--------|------|-------|
| id | uuid PK | gen_random_uuid() |
| user_id | uuid | nullable |
| provider | text | nullable |
| model | text | nullable |
| request_type | text | nullable |
| error_type | text | NOT NULL |
| message | text | NOT NULL |
| details_json | jsonb | nullable |
| severity | text | DEFAULT 'error' |
| resolved_at | timestamptz | nullable |
| created_at | timestamptz | DEFAULT now() |

RLS: admin-only SELECT via `has_role(auth.uid(), 'admin')`. INSERT via service role from edge functions.

### 3. Create `admin_audit_logs` table
| Column | Type | Notes |
|--------|------|-------|
| id | uuid PK | gen_random_uuid() |
| admin_user_id | uuid | NOT NULL |
| action_type | text | NOT NULL |
| target_type | text | nullable |
| target_id | text | nullable |
| details_json | jsonb | nullable |
| created_at | timestamptz | DEFAULT now() |

RLS: admin-only SELECT.

### 4. Create `system_config` table
| Column | Type | Notes |
|--------|------|-------|
| id | uuid PK | gen_random_uuid() |
| key | text | UNIQUE NOT NULL |
| value_json | jsonb | NOT NULL |
| description | text | nullable |
| updated_by | uuid | nullable |
| updated_at | timestamptz | DEFAULT now() |

RLS: admin-only ALL. Seeded with defaults for caps, limits, feature flags.

### 5. Create `provider_configs` table
| Column | Type | Notes |
|--------|------|-------|
| id | uuid PK | gen_random_uuid() |
| provider_name | text | UNIQUE NOT NULL |
| enabled | boolean | DEFAULT true |
| timeout_seconds | integer | DEFAULT 60 |
| retry_enabled | boolean | DEFAULT true |
| updated_at | timestamptz | DEFAULT now() |

RLS: admin-only for writes, authenticated SELECT (so edge functions can check).

### 6. Create `model_configs` table
| Column | Type | Notes |
|--------|------|-------|
| id | uuid PK | gen_random_uuid() |
| provider_name | text | NOT NULL |
| model_name | text | UNIQUE NOT NULL |
| enabled | boolean | DEFAULT true |
| cost_tier | text | DEFAULT 'standard' |
| max_output_tokens | integer | DEFAULT 4096 |
| timeout_seconds | integer | DEFAULT 60 |
| retry_enabled | boolean | DEFAULT true |
| premium_only | boolean | DEFAULT false |
| updated_at | timestamptz | DEFAULT now() |

RLS: admin-only writes, authenticated SELECT.

Seed both tables with current models from `AI_CONFIG`.

### Indexes
- `error_logs(created_at)`, `error_logs(user_id)`
- `admin_audit_logs(admin_user_id, created_at)`
- `system_config(key)` (unique already)

## Edge Function: `admin-api`

Single edge function handling all admin operations via an `action` field in the request body. Validates admin role server-side using service role client.

**Actions:**
- `get_metrics` — aggregate counts from projects, chats, messages, usage_events, profiles
- `list_users` — join profiles + user_roles + aggregated usage, with search/sort/pagination
- `get_user_detail` — single user's profile, usage summary, chat count, preferences
- `update_user_role` — add/remove admin role + audit log
- `suspend_user` — set profiles.status = 'suspended' + audit log
- `reactivate_user` — set profiles.status = 'active' + audit log
- `list_usage` — aggregated usage with filters (date range, provider, model, user)
- `list_error_logs` — paginated error logs with filters
- `resolve_error` — set resolved_at + audit log
- `get_provider_configs` / `update_provider_config` — CRUD provider settings + audit
- `get_model_configs` / `update_model_config` — CRUD model settings + audit
- `get_system_config` / `update_system_config` — CRUD system settings + audit
- `get_analytics` — aggregate usage_events by request_type over time

Auth check pattern:
```typescript
const sb = getServiceClient();
const { data: isAdmin } = await sb.rpc('has_role', { _user_id: userId, _role: 'admin' });
if (!isAdmin) return 403;
```

## Frontend: Admin Routes & Layout

### Routing (in App.tsx)
Add admin routes behind an `AdminRoute` guard that checks `has_role`:
- `/admin` → AdminDashboard
- `/admin/users` → AdminUsers
- `/admin/users/:id` → AdminUserDetail
- `/admin/usage` → AdminUsage
- `/admin/models` → AdminModels
- `/admin/settings` → AdminSettings
- `/admin/errors` → AdminErrors
- `/admin/audit` → AdminAudit

### `AdminRoute` component
Fetches user role via `supabase.rpc('has_role', ...)`. Redirects non-admins to `/dashboard`.

### `AdminLayout` component
- Left sidebar with admin nav items (Dashboard, Users, Usage, Models, Settings, Errors, Audit)
- Top bar with "Admin Panel" title + back to app link
- Content area

### Shared Admin Components
- `MetricCard` — icon, label, value, optional trend
- `AdminDataTable` — generic table with search, sort, pagination, loading/empty states
- `FilterBar` — date range, dropdowns for provider/model/type
- `StatusBadge` — colored badge for user status, error severity

## Frontend Pages

### AdminDashboard
- KPI cards row: total users, active 7d, projects, chats, AI requests, est. cost, errors
- Date filter (today / 7d / 30d / month)
- Recent errors list (5 items)
- Recent signups list (5 items)
- Top models bar chart (recharts)
- Cost trend line chart (recharts)

### AdminUsers
- DataTable: name, email, role, status, created, projects, chats, est. cost
- Search by email/name
- Filter by role, sort by newest/usage
- Click row → `/admin/users/:id`

### AdminUserDetail
- Profile card (name, email, role, status, created)
- Usage summary card (monthly cost, requests)
- Actions: toggle admin, suspend/reactivate
- Recent activity summary

### AdminUsage
- Date range filter + provider/model/type filters
- Daily request trend chart
- Daily cost trend chart
- Provider breakdown table
- Model breakdown table
- Top users by cost table

### AdminModels
- Provider cards with enable/disable toggle
- Model table per provider: name, enabled, cost tier, max tokens, timeout, retry, premium-only
- Inline edit controls for each model setting
- Save triggers `update_model_config` action

### AdminSettings
- Grouped cards:
  - **Cost Controls**: soft cap, hard cap
  - **Request Limits**: max models per request, prompt max length, rate limit
  - **File Limits**: max file size, extracted text limit
  - **Feature Flags**: export, share links, onboarding, templates
- Save button per group

### AdminErrors
- DataTable: timestamp, type, severity, provider, model, user, message, resolved
- Filters: date, severity, provider
- Click to view details_json in modal
- Resolve button

### AdminAudit
- DataTable: timestamp, admin email, action, target, details
- Filter by action type, date

## Sidebar Integration
- Add "Admin" nav item in AppSidebar, only visible when user has admin role
- Use `supabase.rpc('has_role', ...)` in AppLayout to check and pass `isAdmin` prop

## Edge Function Updates
- Update `multi-model-chat`, `enhance-prompt`, `synthesize` to insert into `error_logs` on failures (alongside existing usage_events logging)
- Check `model_configs.enabled` and `provider_configs.enabled` before processing (query with service role)

## Implementation Order

**Phase 5A** (this implementation):
1. Database migration (all new tables + seed data + RLS)
2. `admin-api` edge function
3. `AdminRoute` guard + `AdminLayout`
4. AdminDashboard page
5. AdminUsers + AdminUserDetail pages
6. AdminUsage page

**Phase 5B** (follow-up):
7. AdminModels page
8. AdminSettings page
9. AdminErrors page
10. AdminAudit page
11. Edge function updates for error_logs + config checks
12. Sidebar admin link

All phases will be built in this implementation pass.

