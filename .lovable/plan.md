

# Admin Panel Upgrade Plan

## What Exists Today
- **DB tables**: `profiles`, `user_roles`, `usage_events`, `error_logs`, `admin_audit_logs`, `system_config`, `provider_configs`, `model_configs`
- **Edge function** (`admin-api`): 14 actions (metrics, users CRUD, usage, errors, providers, models, system config, audit logs)
- **Pages**: Dashboard, Users, UserDetail, Usage, Models, Settings, Errors, Audit — all functional but basic
- **Admin sidebar**: 7 nav items (Dashboard, Users, Usage, Models, Settings, Errors, Audit)

## What's New — Organized by Build Priority

### Step 1: Database Migrations

**New tables:**

1. **`feature_flags`** — key, description, enabled, updated_by, updated_at. RLS: admin-only ALL.

2. **`announcements`** — title, message, type (info/warning/update), placement (dashboard/chat/global), active, start_at, end_at, created_by, created_at, updated_at. RLS: admin ALL, authenticated SELECT (active only).

3. **`system_templates`** — title, category, description, prompt_body, active, featured, sort_order, created_by, created_at, updated_at. RLS: admin ALL, authenticated SELECT (active only).

4. **`share_links`** — chat_id, user_id, token, status (active/revoked), created_at, last_accessed_at, revoked_at, revoked_by. RLS: owner can CRUD own, admin can SELECT/UPDATE all.

**Profile additions:**
- Add `ai_access_enabled boolean default true` and `last_active_at timestamptz` to `profiles`.

### Step 2: Edge Function — Expand `admin-api`

Add these new actions to the existing switch:

- **Feature flags**: `list_feature_flags`, `update_feature_flag`
- **Announcements**: `list_announcements`, `create_announcement`, `update_announcement`, `delete_announcement`
- **Templates**: `list_templates`, `create_template`, `update_template`, `delete_template`
- **Share links**: `list_share_links`, `revoke_share_link`
- **User actions**: `disable_ai_access`, `enable_ai_access`
- **System health**: `get_system_health` (aggregates from usage_events + error_logs — success rates, avg latency, provider health)
- **Enhanced metrics**: add suspended user count, share link count, top heavy users, top models, provider breakdown, cost trend data to `get_metrics`

All mutations will insert audit log entries. All actions validate admin role (already handled by existing middleware).

### Step 3: New Frontend Pages

**5 new pages + updates to 4 existing pages:**

1. **`AdminFeatureFlags.tsx`** — Toggle grid showing all flags with switch + description + last updated. Simple and scannable.

2. **`AdminTemplates.tsx`** — Table of system templates with create/edit/delete modals. Fields: title, category, description, prompt body, active, featured.

3. **`AdminShareLinks.tsx`** — Table of share links with filters (status, user), revoke action, metadata display.

4. **`AdminAnnouncements.tsx`** — List + create/edit modal. Fields: title, message, type, placement, active, start/end dates.

5. **`AdminSystemHealth.tsx`** — Cards showing provider health (success rate, avg latency, timeout rate), synthesis/enhancement success rates, recent error spikes. Computed from usage_events + error_logs.

**Existing page upgrades:**

6. **`AdminDashboard`** — Add: suspended users count, active share links, top heavy users table, top models chart, provider breakdown chart, cost trend chart, success vs failure pie.

7. **`AdminUsers`** — Add: filter by role dropdown, filter by status dropdown, sort options (newest/last active/highest usage).

8. **`AdminUserDetail`** — Add: AI access toggle (disable/enable), last active display, error count, email display from profile.

9. **`AdminUsage`** — Add: request type filter, status filter, top expensive users table, success rate display.

### Step 4: Admin Sidebar Update

Update `AdminLayout.tsx` sidebar nav to include new sections:
- Dashboard, Users, Usage & Cost, Models, Settings, Feature Flags, Templates, Share Links, Announcements, Errors, Audit Log, System Health

### Step 5: Routing

Add new routes in `App.tsx`:
- `/admin/feature-flags` → AdminFeatureFlags
- `/admin/templates` → AdminTemplates  
- `/admin/share-links` → AdminShareLinks
- `/admin/announcements` → AdminAnnouncements
- `/admin/health` → AdminSystemHealth

### Security
- All new tables use admin-only RLS (except authenticated SELECT for announcements/templates)
- All mutations go through the existing admin-api edge function which validates admin role server-side
- All mutations are audit-logged
- No secrets exposed in UI

### Files to Create/Modify
- **Migration SQL**: 1 migration with 4 new tables + profile column additions
- **Edge function**: `supabase/functions/admin-api/index.ts` — add ~15 new action handlers
- **New pages**: 5 files in `src/pages/admin/`
- **Modified pages**: 4 existing admin pages
- **AdminLayout.tsx**: expanded sidebar nav
- **App.tsx**: 5 new admin routes

