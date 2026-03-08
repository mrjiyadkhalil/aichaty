import { ArrowRight, Bot, BrainCircuit } from "lucide-react";

const EXPLORE_CARDS = [
  {
    icon: Bot,
    title: "AI Code Reviewer",
    description: "Get instant code reviews from multiple AI models and compare their suggestions.",
  },
  {
    icon: BrainCircuit,
    title: "Research Assistant",
    description: "Ask complex research questions and synthesize the best answer from multiple perspectives.",
  },
];

export function ExploreSection() {
  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <h3 className="text-[11px] uppercase tracking-wider text-muted-foreground/50 font-medium">
          Explore
        </h3>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        {EXPLORE_CARDS.map((card) => (
          <div
            key={card.title}
            className="bg-card border border-border rounded-xl p-4 flex items-start gap-3 cursor-pointer group transition-all duration-150 hover:bg-muted/30"
          >
            <div className="h-9 w-9 rounded-lg bg-muted flex items-center justify-center shrink-0">
              <card.icon className="h-4 w-4 text-muted-foreground" />
            </div>
            <div className="space-y-1 min-w-0">
              <h4 className="text-[13px] font-medium group-hover:text-foreground transition-colors duration-150">
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
