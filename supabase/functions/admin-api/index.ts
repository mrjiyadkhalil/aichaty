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

  // Verify user
  const userClient = createClient(supabaseUrl, anonKey, {
    global: { headers: { Authorization: authHeader } },
  });
  const { data: { user }, error: userErr } = await userClient.auth.getUser();
  if (userErr || !user) return json({ error: "Unauthorized" }, 401);
  const userId = user.id;

  // Check admin role
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
      case "list_usage": return await listUsage(sb, body);
      case "list_error_logs": return await listErrorLogs(sb, body);
      case "resolve_error": return await resolveError(sb, userId, body);
      case "get_provider_configs": return await getProviderConfigs(sb);
      case "update_provider_config": return await updateProviderConfig(sb, userId, body);
      case "get_model_configs": return await getModelConfigs(sb);
      case "update_model_config": return await updateModelConfig(sb, userId, body);
      case "get_system_config": return await getSystemConfig(sb);
      case "update_system_config": return await updateSystemConfig(sb, userId, body);
      case "list_audit_logs": return await listAuditLogs(sb, body);
      default: return json({ error: `Unknown action: ${action}` }, 400);
    }
  } catch (e: any) {
    console.error("Admin API error:", e);
    return json({ error: e.message || "Internal error" }, 500);
  }
});

async function getMetrics(sb: any, body: any) {
  const { period = "7d" } = body;
  const now = new Date();
  let since: Date;
  if (period === "today") since = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  else if (period === "30d") since = new Date(now.getTime() - 30 * 86400000);
  else if (period === "month") since = new Date(now.getFullYear(), now.getMonth(), 1);
  else since = new Date(now.getTime() - 7 * 86400000);
  const sinceStr = since.toISOString();

  const [users, projects, chats, usage, errors, recentSignups] = await Promise.all([
    sb.from("profiles").select("id", { count: "exact", head: true }),
    sb.from("projects").select("id", { count: "exact", head: true }),
    sb.from("chats").select("id", { count: "exact", head: true }),
    sb.from("usage_events").select("id, estimated_cost, status").gte("created_at", sinceStr),
    sb.from("error_logs").select("id", { count: "exact", head: true }).gte("created_at", sinceStr),
    sb.from("profiles").select("user_id, display_name, created_at").order("created_at", { ascending: false }).limit(5),
  ]);

  const activeUsers = await sb.from("usage_events").select("user_id").gte("created_at", new Date(now.getTime() - 7 * 86400000).toISOString());
  const activeUserIds = new Set((activeUsers.data || []).map((r: any) => r.user_id));

  const usageData = usage.data || [];
  const totalCost = usageData.reduce((s: number, r: any) => s + (Number(r.estimated_cost) || 0), 0);
  const failedCount = usageData.filter((r: any) => r.status === "error").length;

  return json({
    totalUsers: users.count || 0,
    activeUsers7d: activeUserIds.size,
    totalProjects: projects.count || 0,
    totalChats: chats.count || 0,
    totalRequests: usageData.length,
    totalCost: Math.round(totalCost * 10000) / 10000,
    failedRequests: failedCount,
    totalErrors: errors.count || 0,
    recentSignups: (recentSignups.data || []).map((p: any) => ({
      user_id: p.user_id, display_name: p.display_name, created_at: p.created_at,
    })),
  });
}

async function listUsers(sb: any, body: any) {
  const { search = "", sort = "newest", page = 0, limit = 20 } = body;
  let query = sb.from("profiles").select("*");
  if (search) query = query.or(`display_name.ilike.%${search}%`);
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

  return json({ users: enriched });
}

async function getUserDetail(sb: any, body: any) {
  const { target_user_id } = body;
  if (!target_user_id) throw new Error("target_user_id required");

  const { data: profile } = await sb.from("profiles").select("*").eq("user_id", target_user_id).single();
  const { data: roles } = await sb.from("user_roles").select("role").eq("user_id", target_user_id);
  const { count: projectCount } = await sb.from("projects").select("id", { count: "exact", head: true }).eq("user_id", target_user_id);
  const { count: chatCount } = await sb.from("chats").select("id", { count: "exact", head: true }).eq("user_id", target_user_id);
  const { data: costData } = await sb.from("usage_events").select("estimated_cost, created_at, model, request_type, status").eq("user_id", target_user_id).order("created_at", { ascending: false }).limit(100);
  const { data: prefs } = await sb.from("user_preferences").select("*").eq("user_id", target_user_id).maybeSingle();

  const totalCost = (costData || []).reduce((s: number, r: any) => s + (Number(r.estimated_cost) || 0), 0);

  return json({
    profile,
    roles: (roles || []).map((r: any) => r.role),
    project_count: projectCount || 0,
    chat_count: chatCount || 0,
    total_cost: Math.round(totalCost * 10000) / 10000,
    recent_usage: (costData || []).slice(0, 20),
    preferences: prefs,
  });
}

async function updateUserRole(sb: any, adminId: string, body: any) {
  const { target_user_id, role, action: _action, grant } = body;
  if (!target_user_id || !role) throw new Error("target_user_id and role required");

  if (grant) {
    await sb.from("user_roles").upsert({ user_id: target_user_id, role }, { onConflict: "user_id,role" });
  } else {
    await sb.from("user_roles").delete().eq("user_id", target_user_id).eq("role", role);
  }

  await sb.from("admin_audit_logs").insert({
    admin_user_id: adminId, action_type: grant ? "grant_role" : "revoke_role",
    target_type: "user", target_id: target_user_id,
    details_json: { role, grant },
  });

  return json({ success: true });
}

async function suspendUser(sb: any, adminId: string, body: any) {
  const { target_user_id } = body;
  if (!target_user_id) throw new Error("target_user_id required");
  await sb.from("profiles").update({ status: "suspended" }).eq("user_id", target_user_id);
  await sb.from("admin_audit_logs").insert({
    admin_user_id: adminId, action_type: "suspend_user",
    target_type: "user", target_id: target_user_id,
  });
  return json({ success: true });
}

async function reactivateUser(sb: any, adminId: string, body: any) {
  const { target_user_id } = body;
  if (!target_user_id) throw new Error("target_user_id required");
  await sb.from("profiles").update({ status: "active" }).eq("user_id", target_user_id);
  await sb.from("admin_audit_logs").insert({
    admin_user_id: adminId, action_type: "reactivate_user",
    target_type: "user", target_id: target_user_id,
  });
  return json({ success: true });
}

async function listUsage(sb: any, body: any) {
  const { days = 30, provider, model, request_type } = body;
  const since = new Date(Date.now() - days * 86400000).toISOString();
  let query = sb.from("usage_events").select("*").gte("created_at", since).order("created_at", { ascending: false }).limit(1000);
  if (provider) query = query.eq("provider", provider);
  if (model) query = query.eq("model", model);
  if (request_type) query = query.eq("request_type", request_type);
  const { data, error } = await query;
  if (error) throw error;
  return json({ usage: data || [] });
}

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
    admin_user_id: adminId, action_type: "resolve_error",
    target_type: "error_log", target_id: error_id,
  });
  return json({ success: true });
}

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

async function listAuditLogs(sb: any, body: any) {
  const { page = 0, limit = 20, action_type } = body;
  let query = sb.from("admin_audit_logs").select("*").order("created_at", { ascending: false }).range(page * limit, (page + 1) * limit - 1);
  if (action_type) query = query.eq("action_type", action_type);
  const { data, error } = await query;
  if (error) throw error;
  return json({ logs: data || [] });
}
