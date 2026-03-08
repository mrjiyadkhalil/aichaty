import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.1";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

function json(data: unknown, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  const authHeader = req.headers.get("Authorization");
  if (!authHeader?.startsWith("Bearer ")) return json({ error: "Unauthorized" }, 401);

  const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
  const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
  const anonKey = Deno.env.get("SUPABASE_ANON_KEY")!;

  const userClient = createClient(supabaseUrl, anonKey, {
    global: { headers: { Authorization: authHeader } },
  });
  const { data: { user }, error: userErr } = await userClient.auth.getUser();
  if (userErr || !user) return json({ error: "Unauthorized" }, 401);
  const userId = user.id;

  const sb = createClient(supabaseUrl, serviceKey);
  const { data: isAdmin } = await sb.rpc("has_role", { _user_id: userId, _role: "admin" });
  if (!isAdmin) return json({ error: "Forbidden" }, 403);

  const body = await req.json();
  const { action } = body;

  try {
    switch (action) {
      case "get_metrics": return await getMetrics(sb, body);
      case "list_users": return await listUsers(sb, body);
      case "get_user_detail": return await getUserDetail(sb, body);
      case "update_user_role": return await updateUserRole(sb, userId, body);
      case "suspend_user": return await suspendUser(sb, userId, body);
      case "reactivate_user": return await reactivateUser(sb, userId, body);
      case "ban_user": return await banUser(sb, userId, body);
      case "unban_user": return await unbanUser(sb, userId, body);
      case "disable_ai_access": return await disableAiAccess(sb, userId, body);
      case "enable_ai_access": return await enableAiAccess(sb, userId, body);
      case "list_usage": return await listUsage(sb, body);
      case "list_error_logs": return await listErrorLogs(sb, body);
      case "resolve_error": return await resolveError(sb, userId, body);
      case "get_provider_configs": return await getProviderConfigs(sb);
      case "update_provider_config": return await updateProviderConfig(sb, userId, body);
      case "get_model_configs": return await getModelConfigs(sb);
      case "update_model_config": return await updateModelConfig(sb, userId, body);
      case "create_model_config": return await createModelConfig(sb, userId, body);
      case "get_model_performance": return await getModelPerformance(sb);
      case "test_custom_model": return await testCustomModel(body);
      case "get_revenue_data": return await getRevenueData(sb);
      case "get_system_config": return await getSystemConfig(sb);
      case "update_system_config": return await updateSystemConfig(sb, userId, body);
      case "list_audit_logs": return await listAuditLogs(sb, body);
      case "list_feature_flags": return await listFeatureFlags(sb);
      case "update_feature_flag": return await updateFeatureFlag(sb, userId, body);
      case "list_announcements": return await listAnnouncements(sb);
      case "create_announcement": return await createAnnouncement(sb, userId, body);
      case "update_announcement": return await updateAnnouncement(sb, userId, body);
      case "delete_announcement": return await deleteAnnouncement(sb, userId, body);
      case "list_templates": return await listTemplates(sb);
      case "create_template": return await createTemplate(sb, userId, body);
      case "update_template": return await updateTemplate(sb, userId, body);
      case "delete_template": return await deleteTemplate(sb, userId, body);
      case "list_share_links": return await listShareLinks(sb, body);
      case "revoke_share_link": return await revokeShareLink(sb, userId, body);
      case "get_system_health": return await getSystemHealth(sb);
      // New admin features
      case "send_broadcast": return await sendBroadcast(sb, userId, body);
      case "list_broadcasts": return await listBroadcasts(sb);
      case "update_user_quota": return await updateUserQuota(sb, userId, body);
      case "list_all_roles": return await listAllRoles(sb);
      case "create_custom_role": return await createCustomRole(sb, userId, body);
      case "delete_custom_role": return await deleteCustomRole(sb, userId, body);
      case "get_api_keys": return await getApiKeys(sb);
      case "update_api_key": return await updateApiKey(sb, userId, body);
      case "init_default_api_keys": return await initDefaultApiKeys(sb, userId);
      default: return json({ error: `Unknown action: ${action}` }, 400);
    }
  } catch (e: any) {
    console.error("Admin API error:", e);
    return json({ error: e.message || "Internal error" }, 500);
  }
});

// ==================== METRICS ====================

async function getMetrics(sb: any, body: any) {
  const { period = "7d" } = body;
  const now = new Date();
  let since: Date;
  if (period === "today") since = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  else if (period === "30d") since = new Date(now.getTime() - 30 * 86400000);
  else if (period === "month") since = new Date(now.getFullYear(), now.getMonth(), 1);
  else since = new Date(now.getTime() - 7 * 86400000);
  const sinceStr = since.toISOString();

  const [users, projects, chats, usage, errors, recentSignups, suspended, shareLinks] = await Promise.all([
    sb.from("profiles").select("id", { count: "exact", head: true }),
    sb.from("projects").select("id", { count: "exact", head: true }),
    sb.from("chats").select("id", { count: "exact", head: true }),
    sb.from("usage_events").select("id, estimated_cost, status, model, provider, user_id, created_at").gte("created_at", sinceStr),
    sb.from("error_logs").select("id", { count: "exact", head: true }).gte("created_at", sinceStr),
    sb.from("profiles").select("user_id, display_name, created_at").order("created_at", { ascending: false }).limit(5),
    sb.from("profiles").select("id", { count: "exact", head: true }).eq("status", "suspended"),
    sb.from("share_links").select("id", { count: "exact", head: true }).eq("status", "active"),
  ]);

  const activeUsers = await sb.from("usage_events").select("user_id").gte("created_at", new Date(now.getTime() - 7 * 86400000).toISOString());
  const activeUserIds = new Set((activeUsers.data || []).map((r: any) => r.user_id));

  const usageData = usage.data || [];
  const totalCost = usageData.reduce((s: number, r: any) => s + (Number(r.estimated_cost) || 0), 0);
  const failedCount = usageData.filter((r: any) => r.status === "error").length;
  const successCount = usageData.length - failedCount;

  const userCostMap: Record<string, number> = {};
  usageData.forEach((u: any) => { userCostMap[u.user_id] = (userCostMap[u.user_id] || 0) + (Number(u.estimated_cost) || 0); });
  const topUsers = Object.entries(userCostMap).sort((a, b) => b[1] - a[1]).slice(0, 5).map(([uid, cost]) => ({ user_id: uid, cost: Math.round(cost * 10000) / 10000 }));

  const modelCountMap: Record<string, number> = {};
  usageData.forEach((u: any) => { modelCountMap[u.model] = (modelCountMap[u.model] || 0) + 1; });
  const topModels = Object.entries(modelCountMap).sort((a, b) => b[1] - a[1]).slice(0, 5).map(([model, count]) => ({ model, count }));

  const providerMap: Record<string, { count: number; cost: number }> = {};
  usageData.forEach((u: any) => {
    const p = u.provider || "unknown";
    if (!providerMap[p]) providerMap[p] = { count: 0, cost: 0 };
    providerMap[p].count++;
    providerMap[p].cost += Number(u.estimated_cost) || 0;
  });
  const providerBreakdown = Object.entries(providerMap).map(([provider, d]) => ({ provider, ...d }));

  const costTrend: Record<string, { date: string; cost: number; requests: number }> = {};
  usageData.forEach((u: any) => {
    const day = u.created_at?.slice(0, 10);
    if (!day) return;
    if (!costTrend[day]) costTrend[day] = { date: day, cost: 0, requests: 0 };
    costTrend[day].cost += Number(u.estimated_cost) || 0;
    costTrend[day].requests++;
  });
  const costTrendData = Object.values(costTrend).sort((a, b) => a.date.localeCompare(b.date));

  return json({
    totalUsers: users.count || 0,
    activeUsers7d: activeUserIds.size,
    totalProjects: projects.count || 0,
    totalChats: chats.count || 0,
    totalRequests: usageData.length,
    totalCost: Math.round(totalCost * 10000) / 10000,
    failedRequests: failedCount,
    successRequests: successCount,
    totalErrors: errors.count || 0,
    suspendedUsers: suspended.count || 0,
    activeShareLinks: shareLinks.count || 0,
    topUsers,
    topModels,
    providerBreakdown,
    costTrend: costTrendData,
    recentSignups: (recentSignups.data || []).map((p: any) => ({
      user_id: p.user_id, display_name: p.display_name, created_at: p.created_at,
    })),
  });
}

// ==================== USERS ====================

async function listUsers(sb: any, body: any) {
  const { search = "", sort = "newest", role, status, page = 0, limit = 20 } = body;
  let query = sb.from("profiles").select("*");
  if (search) query = query.or(`display_name.ilike.%${search}%`);
  if (status) query = query.eq("status", status);
  if (sort === "newest") query = query.order("created_at", { ascending: false });
  else query = query.order("created_at", { ascending: true });
  query = query.range(page * limit, (page + 1) * limit - 1);
  const { data: profiles, error } = await query;
  if (error) throw error;

  const enriched = await Promise.all((profiles || []).map(async (p: any) => {
    const { data: roles } = await sb.from("user_roles").select("role").eq("user_id", p.user_id);
    const { count: projectCount } = await sb.from("projects").select("id", { count: "exact", head: true }).eq("user_id", p.user_id);
    const { count: chatCount } = await sb.from("chats").select("id", { count: "exact", head: true }).eq("user_id", p.user_id);
    const { data: costData } = await sb.from("usage_events").select("estimated_cost").eq("user_id", p.user_id);
    const totalCost = (costData || []).reduce((s: number, r: any) => s + (Number(r.estimated_cost) || 0), 0);
    return {
      ...p,
      roles: (roles || []).map((r: any) => r.role),
      project_count: projectCount || 0,
      chat_count: chatCount || 0,
      estimated_cost: Math.round(totalCost * 10000) / 10000,
    };
  }));

  let result = enriched;
  if (role) result = result.filter((u: any) => u.roles.includes(role));

  return json({ users: result });
}

async function getUserDetail(sb: any, body: any) {
  const { target_user_id } = body;
  if (!target_user_id) throw new Error("target_user_id required");

  const [profileRes, rolesRes, projectsRes, chatsRes, costRes, prefsRes, errorsRes] = await Promise.all([
    sb.from("profiles").select("*").eq("user_id", target_user_id).single(),
    sb.from("user_roles").select("role").eq("user_id", target_user_id),
    sb.from("projects").select("id", { count: "exact", head: true }).eq("user_id", target_user_id),
    sb.from("chats").select("id", { count: "exact", head: true }).eq("user_id", target_user_id),
    sb.from("usage_events").select("estimated_cost, created_at, model, request_type, status").eq("user_id", target_user_id).order("created_at", { ascending: false }).limit(100),
    sb.from("user_preferences").select("*").eq("user_id", target_user_id).maybeSingle(),
    sb.from("error_logs").select("id", { count: "exact", head: true }).eq("user_id", target_user_id),
  ]);

  const totalCost = (costRes.data || []).reduce((s: number, r: any) => s + (Number(r.estimated_cost) || 0), 0);

  return json({
    profile: profileRes.data,
    roles: (rolesRes.data || []).map((r: any) => r.role),
    project_count: projectsRes.count || 0,
    chat_count: chatsRes.count || 0,
    total_cost: Math.round(totalCost * 10000) / 10000,
    recent_usage: (costRes.data || []).slice(0, 20),
    preferences: prefsRes.data,
    error_count: errorsRes.count || 0,
  });
}

async function updateUserRole(sb: any, adminId: string, body: any) {
  const { target_user_id, role, grant } = body;
  if (!target_user_id || !role) throw new Error("target_user_id and role required");
  if (grant) {
    await sb.from("user_roles").upsert({ user_id: target_user_id, role }, { onConflict: "user_id,role" });
  } else {
    await sb.from("user_roles").delete().eq("user_id", target_user_id).eq("role", role);
  }
  await sb.from("admin_audit_logs").insert({
    admin_user_id: adminId, action_type: grant ? "grant_role" : "revoke_role",
    target_type: "user", target_id: target_user_id, details_json: { role, grant },
  });
  return json({ success: true });
}

async function suspendUser(sb: any, adminId: string, body: any) {
  const { target_user_id, duration = "7d", reason = "" } = body;
  if (!target_user_id) throw new Error("target_user_id required");
  const durationMs: Record<string, number> = { "1d": 86400000, "7d": 7 * 86400000, "30d": 30 * 86400000 };
  const suspendedUntil = new Date(Date.now() + (durationMs[duration] || 7 * 86400000)).toISOString();
  await sb.from("profiles").update({ 
    status: "suspended", 
    suspended_until: suspendedUntil,
    ban_reason: reason || null,
  }).eq("user_id", target_user_id);
  await sb.from("admin_audit_logs").insert({
    admin_user_id: adminId, action_type: "suspend_user", target_type: "user", target_id: target_user_id,
    details_json: { duration, reason, suspended_until: suspendedUntil },
  });
  return json({ success: true });
}

async function reactivateUser(sb: any, adminId: string, body: any) {
  const { target_user_id } = body;
  if (!target_user_id) throw new Error("target_user_id required");
  await sb.from("profiles").update({ 
    status: "active", 
    ban_reason: null, 
    banned_at: null, 
    banned_by: null, 
    suspended_until: null,
  }).eq("user_id", target_user_id);
  await sb.from("admin_audit_logs").insert({
    admin_user_id: adminId, action_type: "reactivate_user", target_type: "user", target_id: target_user_id,
  });
  return json({ success: true });
}

async function banUser(sb: any, adminId: string, body: any) {
  const { target_user_id, reason = "" } = body;
  if (!target_user_id) throw new Error("target_user_id required");
  await sb.from("profiles").update({ 
    status: "banned",
    ban_reason: reason || null,
    banned_at: new Date().toISOString(),
    banned_by: adminId,
    suspended_until: null,
  }).eq("user_id", target_user_id);
  await sb.from("admin_audit_logs").insert({
    admin_user_id: adminId, action_type: "ban_user", target_type: "user", target_id: target_user_id,
    details_json: { reason },
  });
  return json({ success: true });
}

async function unbanUser(sb: any, adminId: string, body: any) {
  const { target_user_id } = body;
  if (!target_user_id) throw new Error("target_user_id required");
  await sb.from("profiles").update({ 
    status: "active",
    ban_reason: null,
    banned_at: null,
    banned_by: null,
  }).eq("user_id", target_user_id);
  await sb.from("admin_audit_logs").insert({
    admin_user_id: adminId, action_type: "unban_user", target_type: "user", target_id: target_user_id,
  });
  return json({ success: true });
}

async function disableAiAccess(sb: any, adminId: string, body: any) {
  const { target_user_id } = body;
  if (!target_user_id) throw new Error("target_user_id required");
  await sb.from("profiles").update({ ai_access_enabled: false }).eq("user_id", target_user_id);
  await sb.from("admin_audit_logs").insert({
    admin_user_id: adminId, action_type: "disable_ai_access", target_type: "user", target_id: target_user_id,
  });
  return json({ success: true });
}

async function enableAiAccess(sb: any, adminId: string, body: any) {
  const { target_user_id } = body;
  if (!target_user_id) throw new Error("target_user_id required");
  await sb.from("profiles").update({ ai_access_enabled: true }).eq("user_id", target_user_id);
  await sb.from("admin_audit_logs").insert({
    admin_user_id: adminId, action_type: "enable_ai_access", target_type: "user", target_id: target_user_id,
  });
  return json({ success: true });
}

// ==================== USAGE ====================

async function listUsage(sb: any, body: any) {
  const { days = 30, provider, model, request_type, status } = body;
  const since = new Date(Date.now() - days * 86400000).toISOString();
  let query = sb.from("usage_events").select("*").gte("created_at", since).order("created_at", { ascending: false }).limit(1000);
  if (provider) query = query.eq("provider", provider);
  if (model) query = query.eq("model", model);
  if (request_type) query = query.eq("request_type", request_type);
  if (status) query = query.eq("status", status);
  const { data, error } = await query;
  if (error) throw error;
  return json({ usage: data || [] });
}

// ==================== ERROR LOGS ====================

async function listErrorLogs(sb: any, body: any) {
  const { page = 0, limit = 20, severity, provider } = body;
  let query = sb.from("error_logs").select("*").order("created_at", { ascending: false }).range(page * limit, (page + 1) * limit - 1);
  if (severity) query = query.eq("severity", severity);
  if (provider) query = query.eq("provider", provider);
  const { data, error } = await query;
  if (error) throw error;
  return json({ errors: data || [] });
}

async function resolveError(sb: any, adminId: string, body: any) {
  const { error_id } = body;
  if (!error_id) throw new Error("error_id required");
  await sb.from("error_logs").update({ resolved_at: new Date().toISOString() }).eq("id", error_id);
  await sb.from("admin_audit_logs").insert({
    admin_user_id: adminId, action_type: "resolve_error", target_type: "error_log", target_id: error_id,
  });
  return json({ success: true });
}

// ==================== PROVIDERS & MODELS ====================

async function getProviderConfigs(sb: any) {
  const { data } = await sb.from("provider_configs").select("*").order("provider_name");
  return json({ providers: data || [] });
}

async function updateProviderConfig(sb: any, adminId: string, body: any) {
  const { id, updates } = body;
  if (!id || !updates) throw new Error("id and updates required");
  await sb.from("provider_configs").update({ ...updates, updated_at: new Date().toISOString() }).eq("id", id);
  await sb.from("admin_audit_logs").insert({
    admin_user_id: adminId, action_type: "update_provider_config",
    target_type: "provider_config", target_id: id, details_json: updates,
  });
  return json({ success: true });
}

async function getModelConfigs(sb: any) {
  const { data } = await sb.from("model_configs").select("*").order("provider_name, model_name");
  return json({ models: data || [] });
}

async function updateModelConfig(sb: any, adminId: string, body: any) {
  const { id, updates } = body;
  if (!id || !updates) throw new Error("id and updates required");
  await sb.from("model_configs").update({ ...updates, updated_at: new Date().toISOString() }).eq("id", id);
  await sb.from("admin_audit_logs").insert({
    admin_user_id: adminId, action_type: "update_model_config",
    target_type: "model_config", target_id: id, details_json: updates,
  });
  return json({ success: true });
}

async function createModelConfig(sb: any, adminId: string, body: any) {
  const { model_name, short_label, provider_name, provider_url, api_key_env, cost_tier, max_output_tokens, timeout_seconds, request_format, is_custom, premium_only, retry_enabled } = body;
  if (!model_name || !provider_name) throw new Error("model_name and provider_name required");
  const { data, error } = await sb.from("model_configs").insert({
    model_name, short_label, provider_name, provider_url, api_key_env,
    cost_tier: cost_tier || "standard",
    max_output_tokens: max_output_tokens || 4096,
    timeout_seconds: timeout_seconds || 60,
    request_format: request_format || null,
    is_custom: is_custom ?? false,
    premium_only: premium_only ?? false,
    retry_enabled: retry_enabled ?? true,
    enabled: true,
  }).select().single();
  if (error) throw error;
  await sb.from("admin_audit_logs").insert({
    admin_user_id: adminId, action_type: "create_model_config",
    target_type: "model_config", target_id: data.id, details_json: { model_name, provider_name, is_custom },
  });
  return json({ model: data });
}

// ==================== MODEL PERFORMANCE ====================

async function getModelPerformance(sb: any) {
  const { data, error } = await sb.from("model_performance").select("*");
  if (error) throw error;
  return json({ stats: data || [] });
}

// ==================== TEST CUSTOM MODEL ====================

async function testCustomModel(body: any) {
  const { provider_url, api_key_env, model_name, request_format } = body;
  if (!provider_url) throw new Error("provider_url required");
  
  const apiKey = api_key_env ? Deno.env.get(api_key_env) : null;
  const headers: Record<string, string> = { "Content-Type": "application/json" };
  if (apiKey) headers["Authorization"] = `Bearer ${apiKey}`;
  
  let requestBody: string;
  if (request_format) {
    try {
      const parsed = typeof request_format === "string" ? JSON.parse(request_format) : request_format;
      requestBody = JSON.stringify(parsed)
        .replace(/\{\{model\}\}/g, model_name)
        .replace(/\{\{prompt\}\}/g, "Hello, this is a test message. Reply with 'OK'.");
    } catch {
      requestBody = JSON.stringify({
        model: model_name,
        messages: [{ role: "user", content: "Hello, this is a test. Reply with 'OK'." }],
        stream: false, max_tokens: 10,
      });
    }
  } else {
    requestBody = JSON.stringify({
      model: model_name,
      messages: [{ role: "user", content: "Hello, this is a test. Reply with 'OK'." }],
      stream: false, max_tokens: 10,
    });
  }

  const start = Date.now();
  try {
    const res = await fetch(provider_url, { method: "POST", headers, body: requestBody });
    const latency = Date.now() - start;
    if (!res.ok) {
      const errText = await res.text();
      return json({ success: false, error: `HTTP ${res.status}: ${errText.slice(0, 200)}`, latency_ms: latency });
    }
    return json({ success: true, latency_ms: latency });
  } catch (e: any) {
    return json({ success: false, error: e.message, latency_ms: Date.now() - start });
  }
}

// ==================== REVENUE ====================

async function getRevenueData(sb: any) {
  const now = new Date();
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1).toISOString();
  const last30d = new Date(now.getTime() - 30 * 86400000).toISOString();

  // All-time usage
  const { data: allUsage } = await sb.from("usage_events").select("user_id, estimated_cost, model, provider, created_at, status").eq("status", "success");
  const usage = allUsage || [];

  const revenueAllTime = usage.reduce((s: number, r: any) => s + (Number(r.estimated_cost) || 0), 0);
  const revenueThisMonth = usage.filter((r: any) => r.created_at >= startOfMonth).reduce((s: number, r: any) => s + (Number(r.estimated_cost) || 0), 0);

  // Unique users
  const uniqueUsers = new Set(usage.map((r: any) => r.user_id));
  const avgRevenuePerUser = uniqueUsers.size > 0 ? revenueAllTime / uniqueUsers.size : 0;

  // Users near cap ($5)
  const userCosts: Record<string, number> = {};
  usage.filter((r: any) => r.created_at >= startOfMonth).forEach((r: any) => {
    userCosts[r.user_id] = (userCosts[r.user_id] || 0) + (Number(r.estimated_cost) || 0);
  });
  const usersNearCap = Object.values(userCosts).filter((c) => c >= 4).length;

  // Daily revenue (last 30 days)
  const dailyMap: Record<string, number> = {};
  usage.filter((r: any) => r.created_at >= last30d).forEach((r: any) => {
    const day = r.created_at?.slice(0, 10);
    if (day) dailyMap[day] = (dailyMap[day] || 0) + (Number(r.estimated_cost) || 0);
  });
  const dailyRevenue = Object.entries(dailyMap).sort().map(([day, revenue]) => ({ day, revenue }));

  // Revenue by model
  const modelMap: Record<string, number> = {};
  usage.forEach((r: any) => { modelMap[r.model] = (modelMap[r.model] || 0) + (Number(r.estimated_cost) || 0); });
  const revenueByModel = Object.entries(modelMap).map(([model, revenue]) => ({ model, revenue })).sort((a, b) => b.revenue - a.revenue);

  // Revenue by provider
  const provMap: Record<string, number> = {};
  usage.forEach((r: any) => { provMap[r.provider] = (provMap[r.provider] || 0) + (Number(r.estimated_cost) || 0); });
  const revenueByProvider = Object.entries(provMap).map(([provider, revenue]) => ({ provider, revenue })).sort((a, b) => b.revenue - a.revenue);

  // Top spending users
  const userTotals: Record<string, { total_cost: number; request_count: number }> = {};
  usage.forEach((r: any) => {
    if (!userTotals[r.user_id]) userTotals[r.user_id] = { total_cost: 0, request_count: 0 };
    userTotals[r.user_id].total_cost += Number(r.estimated_cost) || 0;
    userTotals[r.user_id].request_count++;
  });
  const topUserIds = Object.entries(userTotals).sort((a, b) => b[1].total_cost - a[1].total_cost).slice(0, 20);
  
  // Get display names for top users
  const topUserProfiles = await Promise.all(
    topUserIds.map(async ([uid, data]) => {
      const { data: profile } = await sb.from("profiles").select("display_name").eq("user_id", uid).maybeSingle();
      return { user_id: uid, display_name: profile?.display_name || null, ...data };
    })
  );

  return json({
    revenueThisMonth: Math.round(revenueThisMonth * 10000) / 10000,
    revenueAllTime: Math.round(revenueAllTime * 10000) / 10000,
    avgRevenuePerUser: Math.round(avgRevenuePerUser * 10000) / 10000,
    usersNearCap,
    dailyRevenue,
    revenueByModel,
    revenueByProvider,
    topUsers: topUserProfiles,
  });
}

// ==================== SYSTEM CONFIG ====================

async function getSystemConfig(sb: any) {
  const { data } = await sb.from("system_config").select("*").order("key");
  return json({ config: data || [] });
}

async function updateSystemConfig(sb: any, adminId: string, body: any) {
  const { key, value_json } = body;
  if (!key) throw new Error("key required");
  await sb.from("system_config").update({ value_json, updated_by: adminId, updated_at: new Date().toISOString() }).eq("key", key);
  await sb.from("admin_audit_logs").insert({
    admin_user_id: adminId, action_type: "update_system_config",
    target_type: "system_config", target_id: key, details_json: { value_json },
  });
  return json({ success: true });
}

// ==================== AUDIT LOGS ====================

async function listAuditLogs(sb: any, body: any) {
  const { page = 0, limit = 20, action_type } = body;
  let query = sb.from("admin_audit_logs").select("*").order("created_at", { ascending: false }).range(page * limit, (page + 1) * limit - 1);
  if (action_type) query = query.eq("action_type", action_type);
  const { data, error } = await query;
  if (error) throw error;
  return json({ logs: data || [] });
}

// ==================== FEATURE FLAGS ====================

async function listFeatureFlags(sb: any) {
  const { data } = await sb.from("feature_flags").select("*").order("key");
  return json({ flags: data || [] });
}

async function updateFeatureFlag(sb: any, adminId: string, body: any) {
  const { id, enabled } = body;
  if (!id) throw new Error("id required");
  await sb.from("feature_flags").update({ enabled, updated_by: adminId, updated_at: new Date().toISOString() }).eq("id", id);
  await sb.from("admin_audit_logs").insert({
    admin_user_id: adminId, action_type: "update_feature_flag",
    target_type: "feature_flag", target_id: id, details_json: { enabled },
  });
  return json({ success: true });
}

// ==================== ANNOUNCEMENTS ====================

async function listAnnouncements(sb: any) {
  const { data } = await sb.from("announcements").select("*").order("created_at", { ascending: false });
  return json({ announcements: data || [] });
}

async function createAnnouncement(sb: any, adminId: string, body: any) {
  const { title, message, type = "info", placement = "dashboard", active = true, start_at, end_at } = body;
  if (!title || !message) throw new Error("title and message required");
  const { data, error } = await sb.from("announcements").insert({
    title, message, type, placement, active, start_at, end_at, created_by: adminId,
  }).select().single();
  if (error) throw error;
  await sb.from("admin_audit_logs").insert({
    admin_user_id: adminId, action_type: "create_announcement",
    target_type: "announcement", target_id: data.id, details_json: { title },
  });
  return json({ announcement: data });
}

async function updateAnnouncement(sb: any, adminId: string, body: any) {
  const { id, updates } = body;
  if (!id || !updates) throw new Error("id and updates required");
  const { updated_at: _, created_by: __, created_at: ___, ...safe } = updates;
  await sb.from("announcements").update({ ...safe, updated_at: new Date().toISOString() }).eq("id", id);
  await sb.from("admin_audit_logs").insert({
    admin_user_id: adminId, action_type: "update_announcement",
    target_type: "announcement", target_id: id, details_json: safe,
  });
  return json({ success: true });
}

async function deleteAnnouncement(sb: any, adminId: string, body: any) {
  const { id } = body;
  if (!id) throw new Error("id required");
  await sb.from("announcements").delete().eq("id", id);
  await sb.from("admin_audit_logs").insert({
    admin_user_id: adminId, action_type: "delete_announcement",
    target_type: "announcement", target_id: id,
  });
  return json({ success: true });
}

// ==================== TEMPLATES ====================

async function listTemplates(sb: any) {
  const { data } = await sb.from("system_templates").select("*").order("sort_order, title");
  return json({ templates: data || [] });
}

async function createTemplate(sb: any, adminId: string, body: any) {
  const { title, category = "General", description, prompt_body, active = true, featured = false } = body;
  if (!title || !prompt_body) throw new Error("title and prompt_body required");
  const { data, error } = await sb.from("system_templates").insert({
    title, category, description, prompt_body, active, featured, created_by: adminId,
  }).select().single();
  if (error) throw error;
  await sb.from("admin_audit_logs").insert({
    admin_user_id: adminId, action_type: "create_template",
    target_type: "system_template", target_id: data.id, details_json: { title },
  });
  return json({ template: data });
}

async function updateTemplate(sb: any, adminId: string, body: any) {
  const { id, updates } = body;
  if (!id || !updates) throw new Error("id and updates required");
  const { created_by: _, created_at: __, ...safe } = updates;
  await sb.from("system_templates").update({ ...safe, updated_at: new Date().toISOString() }).eq("id", id);
  await sb.from("admin_audit_logs").insert({
    admin_user_id: adminId, action_type: "update_template",
    target_type: "system_template", target_id: id, details_json: safe,
  });
  return json({ success: true });
}

async function deleteTemplate(sb: any, adminId: string, body: any) {
  const { id } = body;
  if (!id) throw new Error("id required");
  await sb.from("system_templates").delete().eq("id", id);
  await sb.from("admin_audit_logs").insert({
    admin_user_id: adminId, action_type: "delete_template",
    target_type: "system_template", target_id: id,
  });
  return json({ success: true });
}

// ==================== SHARE LINKS ====================

async function listShareLinks(sb: any, body: any) {
  const { status, page = 0, limit = 20 } = body;
  let query = sb.from("share_links").select("*").order("created_at", { ascending: false }).range(page * limit, (page + 1) * limit - 1);
  if (status) query = query.eq("status", status);
  const { data, error } = await query;
  if (error) throw error;
  return json({ links: data || [] });
}

async function revokeShareLink(sb: any, adminId: string, body: any) {
  const { id } = body;
  if (!id) throw new Error("id required");
  await sb.from("share_links").update({
    status: "revoked", revoked_at: new Date().toISOString(), revoked_by: adminId,
  }).eq("id", id);
  await sb.from("admin_audit_logs").insert({
    admin_user_id: adminId, action_type: "revoke_share_link",
    target_type: "share_link", target_id: id,
  });
  return json({ success: true });
}

// ==================== SYSTEM HEALTH ====================

async function getSystemHealth(sb: any) {
  const since24h = new Date(Date.now() - 24 * 3600000).toISOString();
  const since7d = new Date(Date.now() - 7 * 86400000).toISOString();

  const [usage24h, errors24h, usage7d] = await Promise.all([
    sb.from("usage_events").select("provider, model, status, latency_ms, request_type, estimated_cost").gte("created_at", since24h),
    sb.from("error_logs").select("provider, error_type, severity").gte("created_at", since24h),
    sb.from("usage_events").select("provider, status, created_at").gte("created_at", since7d),
  ]);

  const data24h = usage24h.data || [];
  const total24h = data24h.length;
  const success24h = data24h.filter((u: any) => u.status === "success").length;
  const avgLatency = total24h > 0 ? Math.round(data24h.reduce((s: number, u: any) => s + (u.latency_ms || 0), 0) / total24h) : 0;

  const providerHealth: Record<string, { total: number; success: number; totalLatency: number }> = {};
  data24h.forEach((u: any) => {
    const p = u.provider || "unknown";
    if (!providerHealth[p]) providerHealth[p] = { total: 0, success: 0, totalLatency: 0 };
    providerHealth[p].total++;
    if (u.status === "success") providerHealth[p].success++;
    providerHealth[p].totalLatency += u.latency_ms || 0;
  });
  const providers = Object.entries(providerHealth).map(([provider, d]) => ({
    provider,
    total: d.total,
    successRate: d.total > 0 ? Math.round((d.success / d.total) * 100) : 0,
    avgLatency: d.total > 0 ? Math.round(d.totalLatency / d.total) : 0,
  }));

  const typeHealth: Record<string, { total: number; success: number }> = {};
  data24h.forEach((u: any) => {
    const t = u.request_type || "unknown";
    if (!typeHealth[t]) typeHealth[t] = { total: 0, success: 0 };
    typeHealth[t].total++;
    if (u.status === "success") typeHealth[t].success++;
  });
  const requestTypes = Object.entries(typeHealth).map(([type, d]) => ({
    type,
    total: d.total,
    successRate: d.total > 0 ? Math.round((d.success / d.total) * 100) : 0,
  }));

  return json({
    total24h,
    successRate24h: total24h > 0 ? Math.round((success24h / total24h) * 100) : 100,
    avgLatency,
    errorCount24h: (errors24h.data || []).length,
    providers,
    requestTypes,
  });
}

// ==================== BROADCAST ====================

async function sendBroadcast(sb: any, adminId: string, body: any) {
  const { title, body: msgBody, type = "info", target = "all" } = body;
  if (!title || !msgBody) throw new Error("title and body required");
  const { data, error } = await sb.from("broadcast_messages").insert({
    title, body: msgBody, type, target, sent_by: adminId,
  }).select().single();
  if (error) throw error;
  await sb.from("admin_audit_logs").insert({
    admin_user_id: adminId, action_type: "send_broadcast",
    target_type: "broadcast", target_id: data.id, details_json: { title, type, target },
  });
  return json({ broadcast: data });
}

async function listBroadcasts(sb: any) {
  const { data } = await sb.from("broadcast_messages").select("*").order("created_at", { ascending: false }).limit(50);
  return json({ broadcasts: data || [] });
}

// ==================== USER QUOTA ====================

async function updateUserQuota(sb: any, adminId: string, body: any) {
  const { target_user_id, custom_soft_cap, custom_hard_cap } = body;
  if (!target_user_id) throw new Error("target_user_id required");
  await sb.from("profiles").update({
    custom_soft_cap: custom_soft_cap ?? null,
    custom_hard_cap: custom_hard_cap ?? null,
  }).eq("user_id", target_user_id);
  await sb.from("admin_audit_logs").insert({
    admin_user_id: adminId, action_type: "update_user_quota",
    target_type: "user", target_id: target_user_id,
    details_json: { custom_soft_cap, custom_hard_cap },
  });
  return json({ success: true });
}

// ==================== ROLES ====================

async function listAllRoles(sb: any) {
  // Get system roles (admin, user) and count users
  const { data: userRoles } = await sb.from("user_roles").select("role, user_id");
  const roleCounts: Record<string, number> = {};
  (userRoles || []).forEach((r: any) => { roleCounts[r.role] = (roleCounts[r.role] || 0) + 1; });
  
  const systemRoles = ["admin", "user"];
  const roles = systemRoles.map(r => ({
    role: r, description: r === "admin" ? "Full admin access" : "Standard user", 
    is_system: true, user_count: roleCounts[r] || 0,
  }));

  // Check for custom roles stored in feature_flags as role markers
  const { data: customRoles } = await sb.from("feature_flags").select("*").like("key", "role_%");
  (customRoles || []).forEach((cr: any) => {
    const roleName = cr.key.replace("role_", "");
    roles.push({
      role: roleName, description: cr.description || "",
      is_system: false, user_count: roleCounts[roleName] || 0,
    });
  });

  return json({ roles });
}

async function createCustomRole(sb: any, adminId: string, body: any) {
  const { name, description } = body;
  if (!name) throw new Error("name required");
  // Store custom role as a feature_flag with role_ prefix
  const { error } = await sb.from("feature_flags").insert({
    key: `role_${name}`, description: description || `Custom role: ${name}`,
    enabled: true, updated_by: adminId,
  });
  if (error) throw error;
  await sb.from("admin_audit_logs").insert({
    admin_user_id: adminId, action_type: "create_custom_role",
    target_type: "role", target_id: name, details_json: { description },
  });
  return json({ success: true });
}

async function deleteCustomRole(sb: any, adminId: string, body: any) {
  const { role_name } = body;
  if (!role_name) throw new Error("role_name required");
  await sb.from("feature_flags").delete().eq("key", `role_${role_name}`);
  await sb.from("admin_audit_logs").insert({
    admin_user_id: adminId, action_type: "delete_custom_role",
    target_type: "role", target_id: role_name,
  });
  return json({ success: true });
}

// ==================== API KEYS ====================

async function getApiKeys(sb: any) {
  const { data } = await sb.from("provider_api_keys").select("*").order("provider_name");
  // Check which env vars are actually set
  const enriched = (data || []).map((k: any) => ({
    ...k,
    is_set: !!Deno.env.get(k.env_key_name),
  }));
  return json({ keys: enriched });
}

async function updateApiKey(sb: any, adminId: string, body: any) {
  const { id, env_key_name } = body;
  if (!id || !env_key_name) throw new Error("id and env_key_name required");
  await sb.from("provider_api_keys").update({
    env_key_name, updated_at: new Date().toISOString(), updated_by: adminId,
  }).eq("id", id);
  await sb.from("admin_audit_logs").insert({
    admin_user_id: adminId, action_type: "update_api_key",
    target_type: "provider_api_key", target_id: id, details_json: { env_key_name },
  });
  return json({ success: true });
}

async function initDefaultApiKeys(sb: any, adminId: string) {
  const defaults = [
    { provider_name: "google", env_key_name: "GOOGLE_API_KEY", label: "Google AI" },
    { provider_name: "openai", env_key_name: "OPENAI_API_KEY", label: "OpenAI" },
    { provider_name: "anthropic", env_key_name: "ANTHROPIC_API_KEY", label: "Anthropic" },
    { provider_name: "lovable", env_key_name: "LOVABLE_API_KEY", label: "Lovable AI Gateway" },
  ];
  for (const d of defaults) {
    const { data: existing } = await sb.from("provider_api_keys").select("id").eq("provider_name", d.provider_name).maybeSingle();
    if (!existing) {
      await sb.from("provider_api_keys").insert({ ...d, updated_by: adminId });
    }
  }
  await sb.from("admin_audit_logs").insert({
    admin_user_id: adminId, action_type: "init_default_api_keys",
    target_type: "system", target_id: "api_keys",
  });
  return json({ success: true });
}
