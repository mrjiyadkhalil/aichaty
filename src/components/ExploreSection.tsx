import { ArrowRight, Bot, BrainCircuit } from "lucide-react";

const EXPLORE_CARDS = [
  {
    icon: Bot,
    title: "AI Code Reviewer",
    description: "Get instant code reviews from multiple AI models and compare their suggestions side by side.",
    gradient: "from-primary/20 to-primary/5",
  },
  {
    icon: BrainCircuit,
    title: "Research Assistant",
    description: "Ask complex research questions and synthesize the best answer from multiple AI perspectives.",
    gradient: "from-model-2/20 to-model-2/5",
  },
];

export function ExploreSection() {
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold font-['Space_Grotesk'] text-muted-foreground">
          Explore
        </h3>
        <button className="text-xs text-muted-foreground/60 hover:text-primary flex items-center gap-1 transition-colors">
          See more <ArrowRight className="h-3 w-3" />
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {EXPLORE_CARDS.map((card) => (
          <div
            key={card.title}
            className="glass-card p-5 flex items-start gap-4 cursor-pointer group transition-all duration-300 hover:-translate-y-0.5 hover:shadow-glow-sm"
          >
            <div className={`h-12 w-12 rounded-2xl bg-gradient-to-br ${card.gradient} flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform`}>
              <card.icon className="h-5 w-5 text-primary" />
            </div>
            <div className="space-y-1 min-w-0">
              <h4 className="text-sm font-semibold font-['Space_Grotesk'] group-hover:text-primary transition-colors">
                {card.title}
              </h4>
              <p className="text-xs text-muted-foreground leading-relaxed line-clamp-2">
                {card.description}
              </p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
