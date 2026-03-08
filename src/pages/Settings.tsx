import { useState, useEffect } from "react";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { toast } from "sonner";
import { Save, User } from "lucide-react";

const AVAILABLE_MODELS = [
  { id: "google/gemini-3-flash-preview", short: "G3F" },
  { id: "google/gemini-2.5-flash", short: "G2.5F" },
  { id: "google/gemini-2.5-pro", short: "G2.5P" },
  { id: "openai/gpt-5", short: "GPT5" },
  { id: "openai/gpt-5-mini", short: "GPT5m" },
  { id: "openai/gpt-5-nano", short: "GPT5n" },
];

export default function Settings() {
  const { user, signOut } = useAuth();
  const [displayName, setDisplayName] = useState("");
  const [saving, setSaving] = useState(false);
  const [isDark, setIsDark] = useState(document.documentElement.classList.contains("dark"));

  useEffect(() => {
    if (!user) return;
    supabase.from("profiles").select("display_name").eq("user_id", user.id).single().then(({ data }) => {
      if (data?.display_name) setDisplayName(data.display_name);
    });
  }, [user]);

  const handleSave = async () => {
    if (!user) return;
    setSaving(true);
    const { error } = await supabase.from("profiles").update({ display_name: displayName }).eq("user_id", user.id);
    if (error) toast.error(error.message);
    else toast.success("Settings saved");
    setSaving(false);
  };

  const toggleTheme = (dark: boolean) => {
    setIsDark(dark);
    document.documentElement.classList.toggle("dark", dark);
  };

  return (
    <div className="max-w-2xl mx-auto p-6 space-y-6">
      <h1 className="text-2xl font-bold font-['Space_Grotesk']">Settings</h1>

      <Card>
        <CardHeader><CardTitle className="text-base flex items-center gap-2"><User className="h-4 w-4" /> Profile</CardTitle></CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label>Email</Label>
            <Input value={user?.email || ""} disabled />
          </div>
          <div className="space-y-2">
            <Label>Display Name</Label>
            <Input value={displayName} onChange={(e) => setDisplayName(e.target.value)} />
          </div>
          <Button onClick={handleSave} disabled={saving} className="gap-1.5">
            <Save className="h-3.5 w-3.5" /> Save
          </Button>
        </CardContent>
      </Card>

      <Card>
        <CardHeader><CardTitle className="text-base">Appearance</CardTitle></CardHeader>
        <CardContent>
          <div className="flex items-center justify-between">
            <Label>Dark Mode</Label>
            <Switch checked={isDark} onCheckedChange={toggleTheme} />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="p-6">
          <Button variant="outline" onClick={signOut} className="gap-1.5">Logout</Button>
        </CardContent>
      </Card>
    </div>
  );
}
