interface EnvHighlightedProps {
  content: string;
}

export function EnvHighlighted({ content }: EnvHighlightedProps) {
  if (!content) {
    return <span className="text-muted-foreground/50 italic">No environment file.</span>;
  }

  const lines = content.split("\n");

  return (
    <div className="space-y-0">
      {lines.map((line, i) => {
        const trimmed = line.trim();

        if (!trimmed) return <div key={i} className="h-4" />;

        if (trimmed.startsWith("#")) {
          return (
            <div key={i} className="flex hover:bg-black/[0.03] dark:hover:bg-white/[0.02] group">
              <LineNumber n={i + 1} />
              <span className="text-zinc-400 dark:text-muted-foreground/50 italic">{line}</span>
            </div>
          );
        }

        const eqIdx = line.indexOf("=");
        if (eqIdx > 0) {
          const key = line.slice(0, eqIdx);
          const value = line.slice(eqIdx + 1);
          const isSensitive = /password|secret|key|token/i.test(key) && value.length > 0;

          return (
            <div key={i} className="flex hover:bg-black/[0.03] dark:hover:bg-white/[0.02] group">
              <LineNumber n={i + 1} />
              <span>
                <span className="text-cyan-700 dark:text-cyan-400">{key}</span>
                <span className="text-zinc-400 dark:text-muted-foreground">=</span>
                <ValueSpan value={value} sensitive={isSensitive} />
              </span>
            </div>
          );
        }

        return (
          <div key={i} className="flex hover:bg-black/[0.03] dark:hover:bg-white/[0.02] group">
            <LineNumber n={i + 1} />
            <span className="text-zinc-600 dark:text-foreground/60">{line}</span>
          </div>
        );
      })}
    </div>
  );
}

function LineNumber({ n }: { n: number }) {
  return (
    <span className="w-10 shrink-0 select-none text-right pr-3 text-[10px] text-muted-foreground/30 group-hover:text-muted-foreground/50 tabular-nums">
      {n}
    </span>
  );
}

function ValueSpan({ value, sensitive }: { value: string; sensitive: boolean }) {
  if (sensitive) {
    return <span className="text-amber-600 dark:text-amber-400/70">{"*".repeat(Math.min(value.length, 16))}</span>;
  }
  if (value.startsWith('"') && value.endsWith('"')) {
    return <span className="text-emerald-700 dark:text-emerald-400">{value}</span>;
  }
  if (/^(true|false|null)$/i.test(value)) {
    return <span className="text-purple-700 dark:text-purple-400">{value}</span>;
  }
  if (/^\d+$/.test(value)) {
    return <span className="text-orange-600 dark:text-orange-400">{value}</span>;
  }
  if (value.includes("${")) {
    return <span className="text-amber-600 dark:text-amber-300">{value}</span>;
  }
  return <span className="text-zinc-700 dark:text-foreground/80">{value}</span>;
}
