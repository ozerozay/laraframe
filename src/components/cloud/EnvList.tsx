import { Layers } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { t } from "@/lib/i18n";
import type { CloudEnvironment } from "@/lib/tauri";

interface Props {
  envs: CloudEnvironment[];
  selectedId: string | null;
  onSelect: (env: CloudEnvironment) => void;
}

const statusConfig: Record<string, { color: string; label: string }> = {
  running: { color: "border-emerald-500/30 text-emerald-500", label: "running" },
  deploying: { color: "border-amber-500/30 text-amber-500 animate-pulse", label: "deploying" },
  stopped: { color: "border-zinc-500/30 text-zinc-500", label: "stopped" },
  hibernating: { color: "border-blue-500/30 text-blue-500", label: "hibernating" },
};

export function EnvList({ envs, selectedId, onSelect }: Props) {
  if (envs.length === 0) {
    return (
      <div className="flex h-32 items-center justify-center text-xs text-muted-foreground/40">
        {t("cloud.noEnvs")}
      </div>
    );
  }

  return (
    <div className="w-56 shrink-0 overflow-auto border-r border-border/30">
      {envs.map((env) => {
        const active = env.id === selectedId;
        const status = statusConfig[env.status || ""] || { color: "border-border text-muted-foreground", label: env.status };
        return (
          <div
            key={env.id}
            className={`relative flex cursor-pointer items-center gap-2.5 px-3 py-2.5 transition-all border-b border-border/20 ${
              active ? "bg-primary/5" : "hover:bg-muted/20"
            }`}
            onClick={() => onSelect(env)}
          >
            {active && <div className="absolute left-0 top-1/2 -translate-y-1/2 w-[2px] h-5 rounded-r-full bg-primary" />}
            <div className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-md ${
              active ? "bg-primary/10 text-primary" : "bg-muted/20 text-muted-foreground/50"
            }`}>
              <Layers className="h-3 w-3" />
            </div>
            <div className="flex-1 min-w-0">
              <p className={`text-sm font-medium truncate ${active ? "text-foreground" : "text-foreground/80"}`}>
                {env.name}
              </p>
              <div className="flex items-center gap-1.5 mt-0.5">
                <Badge variant="outline" className={`h-4 px-1 text-xs font-normal ${status.color}`}>
                  {status.label}
                </Badge>
                {env.php_major_version && (
                  <span className="text-xs text-muted-foreground/50">PHP {env.php_major_version}</span>
                )}
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}
