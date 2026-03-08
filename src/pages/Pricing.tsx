import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { useSubscription, PlanName } from "@/hooks/useSubscription";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Check, X, Zap, Crown, Building2, ArrowLeft } from "lucide-react";
import { toast } from "sonner";

const PLAN_META: Record<string, { icon: any; label: string; description: string; color: string }> = {
  free: { icon: Zap, label: "Free", description: "Get started with AI model comparison", color: "text-muted-foreground" },
  pro: { icon: Crown, label: "Pro", description: "For power users who need more", color: "text-primary" },
  enterprise: { icon: Building2, label: "Enterprise", description: "Full access for teams and professionals", color: "text-amber-400" },
};

const FEATURE_ROWS: { label: string; key: string; type: "boolean" | "value" | "models" }[] = [
  { label: "Messages per day", key: "messages_per_day", type: "value" },
  { label: "Max output tokens", key: "max_output_tokens", type: "value" },
  { label: "AI Models", key: "models", type: "models" },
  { label: "File uploads", key: "file_uploads", type: "boolean" },
  { label: "Projects & Instructions", key: "projects", type: "boolean" },
  { label: "Multi-Chat mode", key: "multi_chat", type: "boolean" },
  { label: "Synthesis", key: "synthesis", type: "boolean" },
  { label: "Prompt Library", key: "prompt_library", type: "boolean" },
  { label: "Bookmarks", key: "bookmarks", type: "boolean" },
  { label: "Chat Export", key: "export", type: "boolean" },
  { label: "Custom System Prompt", key: "custom_system_prompt", type: "boolean" },
  { label: "Priority Speed", key: "priority_speed", type: "boolean" },
];

export default function Pricing() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { plan: currentPlan, plans } = useSubscription();
  const [yearly, setYearly] = useState(false);

  const orderedPlans = ["free", "pro", "enterprise"];
  const sortedPlans = orderedPlans
    .map((name) => plans.find((p) => p.plan_name === name))
    .filter(Boolean) as typeof plans;

  const getCellValue = (features: any, key: string, type: string) => {
    const val = features?.[key];
    if (type === "boolean") {
      return val ? <Check className="h-4 w-4 text-primary mx-auto" /> : <X className="h-4 w-4 text-muted-foreground/40 mx-auto" />;
    }
    if (type === "models") {
      if (val === "all") return <span className="text-xs font-medium text-primary">All Models</span>;
      if (Array.isArray(val)) return <span className="text-xs text-muted-foreground">{val.length} models</span>;
      return "—";
    }
    if (typeof val === "number") {
      if (val === -1) return <span className="text-xs font-medium text-primary">Unlimited</span>;
      return <span className="text-xs">{val.toLocaleString()}</span>;
    }
    return "—";
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Nav */}
      <nav className="sticky top-0 z-50 border-b border-border/50 bg-background/80 backdrop-blur-xl">
        <div className="max-w-7xl mx-auto flex items-center justify-between px-4 sm:px-6 h-14">
          <Button variant="ghost" size="sm" onClick={() => navigate(user ? "/chat" : "/")} className="gap-1.5 min-h-[44px]">
            <ArrowLeft className="h-4 w-4" /> <span className="hidden sm:inline">Back</span>
          </Button>
          <div className="flex items-center gap-2.5">
            <div className="h-8 w-8 rounded-xl bg-primary flex items-center justify-center">
              <Zap className="h-4 w-4 text-primary-foreground" />
            </div>
            <span className="font-bold text-lg font-['Space_Grotesk']">Fiesta AI</span>
          </div>
          <div className="w-16 sm:w-20" />
        </div>
      </nav>

      <div className="max-w-5xl mx-auto px-4 sm:px-6 py-8 sm:py-16 space-y-8 sm:space-y-12">
        {/* Header */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="text-center space-y-3 sm:space-y-4">
          <h1 className="text-2xl sm:text-4xl lg:text-5xl font-bold font-['Space_Grotesk']">
            Choose Your <span className="text-primary">Plan</span>
          </h1>
          <p className="text-sm sm:text-lg text-muted-foreground max-w-xl mx-auto">
            Start free, upgrade when you need more power.
          </p>
          <div className="flex items-center justify-center gap-3">
            <span className={`text-sm ${!yearly ? "text-foreground font-medium" : "text-muted-foreground"}`}>Monthly</span>
            <Switch checked={yearly} onCheckedChange={setYearly} />
            <span className={`text-sm ${yearly ? "text-foreground font-medium" : "text-muted-foreground"}`}>Yearly</span>
            {yearly && <Badge variant="secondary" className="text-xs">Save up to 32%</Badge>}
          </div>
        </motion.div>

        {/* Plan Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 sm:gap-6">
          {sortedPlans.map((p, i) => {
            const meta = PLAN_META[p.plan_name];
            const Icon = meta.icon;
            const isCurrent = currentPlan === p.plan_name;
            const isPro = p.plan_name === "pro";
            const price = yearly ? p.price_yearly : p.price_monthly;
            const perMonth = yearly ? Math.round((p.price_yearly / 12) * 100) / 100 : p.price_monthly;

            return (
              <motion.div
                key={p.plan_name}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.1 }}
                className={`relative glass-card p-5 sm:p-6 space-y-4 sm:space-y-5 ${isPro ? "ring-2 ring-primary glow-border" : ""}`}
              >
                {isPro && (
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                    <Badge className="bg-primary text-primary-foreground shadow-glow-sm">Most Popular</Badge>
                  </div>
                )}
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <Icon className={`h-5 w-5 ${meta.color}`} />
                    <h3 className="text-lg sm:text-xl font-bold font-['Space_Grotesk']">{meta.label}</h3>
                  </div>
                  <p className="text-sm text-muted-foreground">{meta.description}</p>
                </div>

                <div className="space-y-1">
                  {p.plan_name === "free" ? (
                    <p className="text-2xl sm:text-3xl font-bold font-['Space_Grotesk']">$0</p>
                  ) : (
                    <>
                      <p className="text-2xl sm:text-3xl font-bold font-['Space_Grotesk']">
                        ${perMonth}<span className="text-base font-normal text-muted-foreground">/mo</span>
                      </p>
                      {yearly && (
                        <p className="text-xs text-muted-foreground">${price}/year billed annually</p>
                      )}
                    </>
                  )}
                </div>

                <Button
                  className={`w-full min-h-[44px] ${isPro ? "shadow-glow-sm" : ""}`}
                  variant={isCurrent ? "outline" : isPro ? "default" : "secondary"}
                  disabled={isCurrent}
                  onClick={() => {
                    if (!user) navigate("/auth");
                    else toast.info("Payment integration coming soon. Contact admin for manual upgrade.");
                  }}
                >
                  {isCurrent ? "Current Plan" : p.plan_name === "free" ? "Get Started" : "Upgrade"}
                </Button>
              </motion.div>
            );
          })}
        </div>

        {/* Comparison - Table on desktop, Cards on mobile */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }} className="glass-card overflow-hidden">
          <div className="p-4 sm:p-6 border-b border-border/30">
            <h2 className="text-lg font-bold font-['Space_Grotesk']">Feature Comparison</h2>
          </div>
          
          {/* Desktop table */}
          <div className="hidden md:block overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-border/30">
                  <th className="text-left text-sm font-medium text-muted-foreground py-3 px-6">Feature</th>
                  {sortedPlans.map((p) => (
                    <th key={p.plan_name} className="text-center text-sm font-semibold py-3 px-4 capitalize">{p.plan_name}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {FEATURE_ROWS.map((row) => (
                  <tr key={row.key} className="border-b border-border/10 hover:bg-muted/20">
                    <td className="text-sm py-3 px-6 text-muted-foreground">{row.label}</td>
                    {sortedPlans.map((p) => (
                      <td key={p.plan_name} className="text-center py-3 px-4">
                        {getCellValue(p.features, row.key, row.type)}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Mobile: card-based comparison */}
          <div className="md:hidden p-4 space-y-3">
            {FEATURE_ROWS.map((row) => (
              <div key={row.key} className="space-y-1.5">
                <p className="text-xs font-medium text-muted-foreground">{row.label}</p>
                <div className="grid grid-cols-3 gap-2">
                  {sortedPlans.map((p) => (
                    <div key={p.plan_name} className="text-center p-2 rounded-lg bg-muted/30">
                      <p className="text-[10px] text-muted-foreground/60 mb-0.5 capitalize">{p.plan_name}</p>
                      {getCellValue(p.features, row.key, row.type)}
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </motion.div>
      </div>
    </div>
  );
}
