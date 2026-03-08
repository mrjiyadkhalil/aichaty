import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { Zap, ArrowRight, GitCompare, Sparkles, Layers, Brain, BarChart3, Shield } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function Landing() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-background text-foreground overflow-hidden">
      {/* Nav */}
      <nav className="fixed top-0 inset-x-0 z-50 border-b border-border/50 bg-background/80 backdrop-blur-xl">
        <div className="max-w-7xl mx-auto flex items-center justify-between px-6 h-16">
          <div className="flex items-center gap-2.5">
            <div className="h-9 w-9 rounded-xl bg-primary flex items-center justify-center shadow-glow">
              <Zap className="h-5 w-5 text-primary-foreground" />
            </div>
            <span className="font-bold text-xl tracking-tight font-['Space_Grotesk']">Fiesta AI</span>
          </div>
          <div className="flex items-center gap-3">
            <Button variant="ghost" onClick={() => navigate("/auth")} className="text-muted-foreground hover:text-foreground">
              Sign In
            </Button>
            <Button onClick={() => navigate("/auth")} className="gap-2 shadow-glow">
              Get Started <ArrowRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </nav>

      {/* Hero */}
      <section className="relative pt-32 pb-20 px-6">
        <div className="absolute inset-0 grid-bg opacity-40" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] rounded-full bg-primary/5 blur-[120px]" />
        
        <div className="relative max-w-7xl mx-auto grid lg:grid-cols-2 gap-16 items-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="space-y-8"
          >
            <h1 className="text-5xl lg:text-6xl xl:text-7xl font-bold leading-[1.05] tracking-tight font-['Space_Grotesk']">
              Compare AI Models.
              <br />
              <span className="text-primary">Get Better Answers.</span>
            </h1>
            <p className="text-lg text-muted-foreground max-w-lg leading-relaxed">
              Send one prompt to multiple AI models simultaneously. Compare responses side by side. 
              Synthesize the best final answer — all in one premium workspace.
            </p>
            <div className="flex items-center gap-4">
              <Button size="lg" onClick={() => navigate("/auth")} className="gap-2 h-12 px-8 text-base shadow-glow-lg hover:shadow-glow transition-shadow">
                Start Comparing <ArrowRight className="h-5 w-5" />
              </Button>
              <Button size="lg" variant="outline" className="h-12 px-8 text-base border-border/50 hover:bg-secondary">
                Learn More
              </Button>
            </div>
          </motion.div>

          {/* App Mockup */}
          <motion.div
            initial={{ opacity: 0, x: 40 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.7, delay: 0.2 }}
            className="hidden lg:block"
          >
            <div className="glass-card glow-border p-6 space-y-4">
              <div className="flex items-center gap-2 text-sm text-muted-foreground mb-4">
                <div className="h-3 w-3 rounded-full bg-destructive/60" />
                <div className="h-3 w-3 rounded-full bg-model-3/60" />
                <div className="h-3 w-3 rounded-full bg-primary/60" />
                <span className="ml-2 text-xs">Multi-Model Workspace</span>
              </div>
              {/* Mock prompt */}
              <div className="rounded-lg bg-background/60 border border-border/30 p-3">
                <p className="text-sm text-muted-foreground italic">"Explain quantum computing in simple terms..."</p>
              </div>
              {/* Mock response cards */}
              <div className="grid grid-cols-2 gap-3">
                {[
                  { name: "GPT-5", color: "border-model-2" },
                  { name: "Gemini Pro", color: "border-primary" },
                ].map((m) => (
                  <div key={m.name} className={`rounded-lg bg-background/40 border-t-2 ${m.color} border border-border/20 p-3 space-y-2`}>
                    <div className="flex items-center gap-2">
                      <div className={`h-2 w-2 rounded-full ${m.color.replace("border-", "bg-")}`} />
                      <span className="text-xs font-medium">{m.name}</span>
                      <span className="text-[10px] text-muted-foreground ml-auto">1.2s</span>
                    </div>
                    <div className="space-y-1.5">
                      <div className="h-2 rounded bg-muted/60 w-full" />
                      <div className="h-2 rounded bg-muted/60 w-4/5" />
                      <div className="h-2 rounded bg-muted/60 w-3/5" />
                    </div>
                  </div>
                ))}
              </div>
              {/* Mock synthesis */}
              <div className="rounded-lg border border-primary/30 bg-primary/5 p-3 space-y-2">
                <div className="flex items-center gap-2">
                  <Sparkles className="h-3.5 w-3.5 text-primary" />
                  <span className="text-xs font-semibold text-primary">Best Final Answer</span>
                </div>
                <div className="space-y-1.5">
                  <div className="h-2 rounded bg-primary/20 w-full" />
                  <div className="h-2 rounded bg-primary/20 w-5/6" />
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Trust Strip */}
      <section className="border-y border-border/30 bg-card/30 py-6">
        <div className="max-w-7xl mx-auto px-6 flex items-center justify-center gap-8 text-muted-foreground text-sm">
          <span className="text-xs uppercase tracking-widest">Powered by</span>
          <span className="font-medium text-foreground/70">GPT-5</span>
          <span className="text-border">•</span>
          <span className="font-medium text-foreground/70">Gemini 2.5 & 3</span>
          <span className="text-border">•</span>
          <span className="font-medium text-foreground/70">And more</span>
        </div>
      </section>

      {/* Features */}
      <section className="py-24 px-6">
        <div className="max-w-7xl mx-auto space-y-16">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5 }}
            className="text-center space-y-4"
          >
            <h2 className="text-3xl lg:text-4xl font-bold font-['Space_Grotesk']">
              One Prompt. Multiple Models. Best Answer.
            </h2>
            <p className="text-muted-foreground max-w-2xl mx-auto text-lg">
              Stop switching between AI tools. Compare them all in one place.
            </p>
          </motion.div>

          <div className="grid md:grid-cols-3 gap-6">
            {[
              { icon: GitCompare, title: "Compare Side by Side", desc: "Send your prompt to GPT-5, Gemini, and more. See all responses in a clean grid layout." },
              { icon: Sparkles, title: "AI Prompt Enhancement", desc: "Automatically enhance your prompts with AI before sending to get better, more detailed responses." },
              { icon: Layers, title: "Synthesize Best Answer", desc: "AI combines the best parts of every model's response into one optimal final answer." },
            ].map((feature, i) => (
              <motion.div
                key={feature.title}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: i * 0.1 }}
                className="glass-card p-8 space-y-4 hover:glow-border transition-all duration-300 group"
              >
                <div className="h-12 w-12 rounded-xl bg-primary/10 flex items-center justify-center group-hover:bg-primary/20 transition-colors">
                  <feature.icon className="h-6 w-6 text-primary" />
                </div>
                <h3 className="text-xl font-semibold font-['Space_Grotesk']">{feature.title}</h3>
                <p className="text-muted-foreground leading-relaxed">{feature.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* More Features */}
      <section className="py-20 px-6 border-t border-border/30">
        <div className="max-w-7xl mx-auto">
          <div className="grid md:grid-cols-3 gap-6">
            {[
              { icon: Brain, title: "Project Workspaces", desc: "Organize prompts and chats into projects with custom instructions and file context." },
              { icon: BarChart3, title: "Usage Analytics", desc: "Track token usage, costs, and model performance across all your projects." },
              { icon: Shield, title: "Secure & Private", desc: "Your data stays yours. Enterprise-grade security with full access controls." },
            ].map((feature, i) => (
              <motion.div
                key={feature.title}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: i * 0.1 }}
                className="glass-card p-8 space-y-4 hover:glow-border transition-all duration-300 group"
              >
                <div className="h-12 w-12 rounded-xl bg-primary/10 flex items-center justify-center group-hover:bg-primary/20 transition-colors">
                  <feature.icon className="h-6 w-6 text-primary" />
                </div>
                <h3 className="text-xl font-semibold font-['Space_Grotesk']">{feature.title}</h3>
                <p className="text-muted-foreground leading-relaxed">{feature.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Final CTA */}
      <section className="py-24 px-6 relative">
        <div className="absolute inset-0 grid-bg opacity-20" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[400px] h-[400px] rounded-full bg-primary/5 blur-[100px]" />
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
          className="relative max-w-2xl mx-auto text-center space-y-8"
        >
          <h2 className="text-3xl lg:text-4xl font-bold font-['Space_Grotesk']">
            Ready to get better AI answers?
          </h2>
          <p className="text-muted-foreground text-lg">
            Join the next generation of AI power users. Start comparing models today.
          </p>
          <Button size="lg" onClick={() => navigate("/auth")} className="gap-2 h-12 px-10 text-base shadow-glow-lg hover:shadow-glow transition-shadow">
            Get Started Free <ArrowRight className="h-5 w-5" />
          </Button>
        </motion.div>
      </section>

      {/* Footer */}
      <footer className="border-t border-border/30 py-8 px-6">
        <div className="max-w-7xl mx-auto flex items-center justify-between text-sm text-muted-foreground">
          <div className="flex items-center gap-2">
            <Zap className="h-4 w-4 text-primary" />
            <span className="font-medium font-['Space_Grotesk']">Fiesta AI</span>
          </div>
          <p>© {new Date().getFullYear()} Fiesta AI. All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
}
