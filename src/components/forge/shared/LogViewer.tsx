import { RefreshCw, Terminal } from "lucide-react";
import { stripAnsi } from "@/lib/helpers";

interface LogViewerProps {
  content: string;
  color?: "emerald" | "amber" | "blue";
  emptyText?: string;
}

export function LogViewer({ content, color = "emerald", emptyText = "No log content" }: LogViewerProps) {
  if (!content || content === "Loading...") {
    return (
      <div className="flex h-full min-h-32 items-center justify-center">
        {content === "Loading..." ? (
          <div className="flex items-center gap-2 text-muted-foreground">
            <RefreshCw className="h-3.5 w-3.5 animate-spin" />
            <span className="text-xs">Loading...</span>
          </div>
        ) : (
          <span className="text-xs text-muted-foreground/50">{emptyText}</span>
        )}
      </div>
    );
  }

  if (content.startsWith("Log not available") || content.startsWith("Error loading")) {
    return (
      <div className="flex h-full min-h-32 items-center justify-center">
        <div className="flex flex-col items-center gap-2 text-muted-foreground/50">
          <Terminal className="h-5 w-5" />
          <span className="text-xs">Log not available</span>
        </div>
      </div>
    );
  }

  const colorMap = {
    emerald: "text-emerald-700 dark:text-emerald-400/80",
    amber: "text-amber-700 dark:text-amber-300/80",
    blue: "text-blue-700 dark:text-blue-400/80",
  };
  const baseColor = colorMap[color];
  const lines = stripAnsi(content).split("\n");

  return (
    <div className="space-y-0">
      {lines.map((line, i) => {
        const trimmed = line.toLowerCase();
        const isError = /\berror\b|exception|fatal|critical/i.test(trimmed);
        const isWarning = /\bwarn(ing)?\b|deprecated/i.test(trimmed);
        const isInfo = /\binfo\b/i.test(trimmed);

        let lineColor = baseColor;
        if (isError) lineColor = "text-red-600 dark:text-red-400";
        else if (isWarning) lineColor = "text-amber-600 dark:text-amber-400";
        else if (isInfo) lineColor = "text-blue-600 dark:text-blue-400/70";

        return (
          <div key={i} className={`flex hover:bg-black/[0.03] dark:hover:bg-white/[0.02] group ${!line.trim() ? "h-3" : ""}`}>
            <span className="w-10 shrink-0 select-none text-right pr-3 text-xs text-muted-foreground/30 group-hover:text-muted-foreground/50 tabular-nums">
              {i + 1}
            </span>
            <span className={`flex-1 ${lineColor}`}>{line}</span>
          </div>
        );
      })}
    </div>
  );
}
