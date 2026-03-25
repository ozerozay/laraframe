import { useState } from "react";
import {
  HelpCircle, ChevronDown, ChevronRight, X,
  Rocket, FileCode2, Terminal, Globe, Puzzle, Clock,
  ArrowRight, Shield, Webhook, HeartPulse, Database,
} from "lucide-react";
import { ScrollArea } from "@/components/ui/scroll-area";
import { getLanguage } from "@/lib/i18n";
import { helpSections } from "@/lib/help-content";

const iconMap: Record<string, typeof Rocket> = {
  rocket: Rocket,
  "file-code": FileCode2,
  "file-code-2": FileCode2,
  terminal: Terminal,
  globe: Globe,
  puzzle: Puzzle,
  clock: Clock,
  "arrow-right": ArrowRight,
  shield: Shield,
  webhook: Webhook,
  "heart-pulse": HeartPulse,
  database: Database,
};

interface HelpPanelProps {
  open: boolean;
  onClose: () => void;
  activeSection?: string | null;
}

export function HelpPanel({ open, onClose, activeSection }: HelpPanelProps) {
  const [expandedId, setExpandedId] = useState<string | null>(activeSection || null);
  const lang = getLanguage();

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex justify-end">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={onClose} />

      {/* Panel */}
      <div className="relative w-full max-w-md bg-card border-l border-border shadow-2xl flex flex-col animate-in slide-in-from-right duration-200">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-border/50">
          <div className="flex items-center gap-2.5">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/10">
              <HelpCircle className="h-4 w-4 text-primary" />
            </div>
            <div>
              <h2 className="text-sm font-semibold">
                {lang === "tr" ? "Yardım Merkezi" : "Help Center"}
              </h2>
              <p className="text-xs text-muted-foreground">
                {lang === "tr" ? "Forge yönetim rehberi" : "Forge management guide"}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="flex h-7 w-7 items-center justify-center rounded-md text-muted-foreground hover:text-foreground hover:bg-muted/50 transition-colors"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Content */}
        <ScrollArea className="flex-1">
          <div className="p-3 space-y-1">
            {helpSections.map((section) => {
              const Icon = iconMap[section.icon] || HelpCircle;
              const isExpanded = expandedId === section.id;

              return (
                <div key={section.id} className="rounded-lg overflow-hidden">
                  {/* Section header */}
                  <button
                    className={`w-full flex items-center gap-3 px-3 py-2.5 text-left transition-colors rounded-lg ${
                      isExpanded ? "bg-primary/5" : "hover:bg-muted/30"
                    }`}
                    onClick={() => setExpandedId(isExpanded ? null : section.id)}
                  >
                    <div className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-md ${
                      isExpanded ? "bg-primary/15 text-primary" : "bg-muted/30 text-muted-foreground"
                    }`}>
                      <Icon className="h-3.5 w-3.5" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className={`text-sm font-medium ${isExpanded ? "text-foreground" : "text-foreground/80"}`}>
                        {section.title[lang]}
                      </p>
                      <p className="text-xs text-muted-foreground truncate">
                        {section.description[lang]}
                      </p>
                    </div>
                    {isExpanded ? (
                      <ChevronDown className="h-4 w-4 text-muted-foreground shrink-0" />
                    ) : (
                      <ChevronRight className="h-4 w-4 text-muted-foreground shrink-0" />
                    )}
                  </button>

                  {/* Section items */}
                  {isExpanded && (
                    <div className="px-3 pb-3 space-y-2 mt-1">
                      {section.items.map((item, i) => (
                        <div key={i} className="rounded-md bg-muted/20 border border-border/30 p-3">
                          <h4 className="text-xs font-semibold text-foreground mb-1.5">
                            {item.title[lang]}
                          </h4>
                          <p className="text-xs text-muted-foreground leading-relaxed">
                            {item.content[lang]}
                          </p>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </ScrollArea>

        {/* Footer */}
        <div className="border-t border-border/50 px-5 py-3">
          <p className="text-xs text-muted-foreground/50 text-center">
            LaraFrame v0.1.0 · {lang === "tr" ? "Forge Yönetim Aracı" : "Forge Management Tool"}
          </p>
        </div>
      </div>
    </div>
  );
}

/** Small help button to embed in widget headers */
export function HelpButton({ sectionId, onOpen }: { sectionId: string; onOpen: (id: string) => void }) {
  return (
    <button
      onClick={(e) => { e.stopPropagation(); onOpen(sectionId); }}
      className="flex h-5 w-5 items-center justify-center rounded text-muted-foreground/40 hover:text-primary hover:bg-primary/5 transition-colors"
      title="Help"
    >
      <HelpCircle className="h-3.5 w-3.5" />
    </button>
  );
}
