import { useState, useEffect, useCallback } from "react";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { X, ChevronRight, ChevronLeft, Sparkles } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

const STEPS = [
  {
    title: "Welcome to Fiesta AI! 🎉",
    description: "Compare responses from multiple AI models side-by-side. Let's take a quick tour.",
    position: "center" as const,
  },
  {
    title: "Start a Chat",
    description: "Click 'New Chat' in the sidebar or press Ctrl+K to start asking questions instantly.",
    position: "center" as const,
  },
  {
    title: "Choose Your Mode",
    description: "Super Fiesta auto-picks the best model. Multi-Chat lets you compare multiple models at once.",
    position: "center" as const,
  },
  {
    title: "Synthesize Answers",
    description: "In Multi-Chat mode, combine the best parts of each response into one final answer with the Synthesize button.",
    position: "center" as const,
  },
  {
    title: "Organize with Projects",
    description: "Create projects to group chats, add custom instructions, and attach reference files.",
    position: "center" as const,
  },
  {
    title: "You're All Set!",
    description: "Explore settings for themes, keyboard shortcuts (Ctrl+/), and more. Happy chatting!",
    position: "center" as const,
  },
];

export function OnboardingTour() {
  const { user } = useAuth();
  const [show, setShow] = useState(false);
  const [step, setStep] = useState(0);

  useEffect(() => {
    if (!user) return;
    supabase
      .from("user_preferences")
      .select("onboarding_completed")
      .eq("user_id", user.id)
      .maybeSingle()
      .then(({ data }) => {
        if (!data) {
          // No preferences row yet — show tour
          setShow(true);
        } else if (!(data as any).onboarding_completed) {
          setShow(true);
        }
      });
  }, [user]);

  const dismiss = useCallback(async () => {
    setShow(false);
    if (!user) return;
    await supabase
      .from("user_preferences")
      .upsert({ user_id: user.id, onboarding_completed: true } as any, { onConflict: "user_id" });
  }, [user]);

  if (!show) return null;

  const current = STEPS[step];

  return (
    <AnimatePresence>
      <motion.div
        key="onboarding-overlay"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-[100] flex items-center justify-center bg-background/80 backdrop-blur-sm"
      >
        <motion.div
          key={step}
          initial={{ opacity: 0, scale: 0.95, y: 10 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: -10 }}
          transition={{ duration: 0.2 }}
          className="glass-card glow-border p-6 max-w-md mx-4 space-y-4"
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Sparkles className="h-5 w-5 text-primary" />
              <h3 className="font-semibold font-['Space_Grotesk'] text-lg">{current.title}</h3>
            </div>
            <Button variant="ghost" size="icon" className="h-7 w-7 text-muted-foreground hover:text-foreground" onClick={dismiss}>
              <X className="h-4 w-4" />
            </Button>
          </div>
          <p className="text-sm text-muted-foreground leading-relaxed">{current.description}</p>
          <div className="flex items-center justify-between pt-2">
            <div className="flex gap-1">
              {STEPS.map((_, i) => (
                <div key={i} className={`h-1.5 rounded-full transition-all ${i === step ? "w-6 bg-primary" : "w-1.5 bg-muted"}`} />
              ))}
            </div>
            <div className="flex items-center gap-2">
              {step > 0 && (
                <Button variant="ghost" size="sm" onClick={() => setStep(step - 1)} className="gap-1 text-xs">
                  <ChevronLeft className="h-3.5 w-3.5" /> Back
                </Button>
              )}
              {step < STEPS.length - 1 ? (
                <Button size="sm" onClick={() => setStep(step + 1)} className="gap-1 text-xs shadow-glow-sm">
                  Next <ChevronRight className="h-3.5 w-3.5" />
                </Button>
              ) : (
                <Button size="sm" onClick={dismiss} className="gap-1 text-xs shadow-glow-sm">
                  Get Started <Sparkles className="h-3.5 w-3.5" />
                </Button>
              )}
            </div>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
