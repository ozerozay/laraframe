import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Pencil, Save, X, RefreshCw } from "lucide-react";

interface ScriptEditorProps {
  content: string;
  onSave: (content: string) => Promise<void>;
  language?: "bash" | "nginx";
  title?: string;
  readonly?: boolean;
}

export function ScriptEditor({
  content,
  onSave,
  language = "bash",
  title = "Script",
  readonly = false,
}: ScriptEditorProps) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(content);
  const [saving, setSaving] = useState(false);

  const handleSave = async () => {
    setSaving(true);
    try {
      await onSave(draft);
      setEditing(false);
    } catch (err) {
      console.error("Failed to save:", err);
    }
    setSaving(false);
  };

  const handleCancel = () => {
    setDraft(content);
    setEditing(false);
  };

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-border/30 px-4 py-2">
        <span className="text-sm text-muted-foreground font-mono">{title}</span>
        {!readonly && (
          editing ? (
            <div className="flex gap-1.5">
              <Button
                size="sm"
                className="h-6 gap-1 px-2 text-xs bg-emerald-600 hover:bg-emerald-700 text-white"
                onClick={handleSave}
                disabled={saving}
              >
                {saving ? <RefreshCw className="h-2.5 w-2.5 animate-spin" /> : <Save className="h-2.5 w-2.5" />}
                {saving ? "Saving..." : "Save"}
              </Button>
              <Button size="sm" variant="ghost" className="h-6 gap-1 px-2 text-xs" onClick={handleCancel}>
                <X className="h-2.5 w-2.5" />
                Cancel
              </Button>
            </div>
          ) : (
            <Button size="sm" variant="ghost" className="h-6 gap-1 px-2 text-xs" onClick={() => { setDraft(content); setEditing(true); }}>
              <Pencil className="h-2.5 w-2.5" />
              Edit
            </Button>
          )
        )}
      </div>

      {/* Content */}
      {editing ? (
        <textarea
          className="flex-1 resize-none bg-zinc-100 dark:bg-zinc-950 px-2 py-3 pl-10 font-mono text-sm leading-5 text-foreground/80 focus:outline-none w-full"
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          spellCheck={false}
          autoCapitalize="off"
          autoCorrect="off"
        />
      ) : (
        <div className="flex-1 overflow-auto bg-zinc-100 dark:bg-zinc-950 px-2 py-3 font-mono text-sm leading-5">
          <ScriptHighlighted content={content} language={language} />
        </div>
      )}
    </div>
  );
}

function ScriptHighlighted({ content, language }: { content: string; language: "bash" | "nginx" }) {
  if (!content) {
    return <span className="text-muted-foreground/50 italic pl-10">Empty script</span>;
  }

  const lines = content.split("\n");

  return (
    <div className="space-y-0">
      {lines.map((line, i) => {
        const trimmed = line.trim();
        if (!trimmed) return <div key={i} className="h-4" />;

        return (
          <div key={i} className="flex hover:bg-white/[0.02] group">
            <span className="w-10 shrink-0 select-none text-right pr-3 text-xs text-muted-foreground/20 group-hover:text-muted-foreground/40 tabular-nums">
              {i + 1}
            </span>
            <span>{colorize(trimmed, line, language)}</span>
          </div>
        );
      })}
    </div>
  );
}

function colorize(trimmed: string, line: string, language: string) {
  // Comments
  if (trimmed.startsWith("#")) {
    return <span className="text-muted-foreground/50 italic">{line}</span>;
  }

  if (language === "bash") {
    // Variables $FORGE_*, ${...}
    const parts = line.split(/(\$\{[^}]+\}|\$[A-Z_][A-Z0-9_]*)/g);
    return (
      <span>
        {parts.map((part, j) => {
          if (part.startsWith("$")) {
            return <span key={j} className="text-cyan-400">{part}</span>;
          }
          // Keywords
          if (/^(if|then|fi|else|elif|for|do|done|while|case|esac|cd|echo|exit|sudo|touch|flock)\b/.test(part.trim())) {
            return <span key={j} className="text-purple-400">{part}</span>;
          }
          return <span key={j} className="text-foreground/70">{part}</span>;
        })}
      </span>
    );
  }

  // nginx
  if (language === "nginx") {
    if (trimmed.endsWith("{") || trimmed === "}") {
      return <span className="text-purple-400">{line}</span>;
    }
    if (trimmed.startsWith("listen") || trimmed.startsWith("server_name") || trimmed.startsWith("root") || trimmed.startsWith("index")) {
      const spaceIdx = trimmed.indexOf(" ");
      return (
        <span>
          <span className="text-cyan-400">{line.slice(0, line.indexOf(trimmed) + spaceIdx)}</span>
          <span className="text-foreground/70">{line.slice(line.indexOf(trimmed) + spaceIdx)}</span>
        </span>
      );
    }
    return <span className="text-foreground/70">{line}</span>;
  }

  return <span className="text-foreground/70">{line}</span>;
}
