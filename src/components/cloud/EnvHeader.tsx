import { ExternalLink, Rocket, Play, Square, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { t } from "@/lib/i18n";
import type { CloudEnvironment } from "@/lib/tauri";

interface Props {
  env: CloudEnvironment;
  deploying: boolean;
  onDeploy: () => void;
  onStart: () => void;
  onStop: () => void;
}

export function EnvHeader({ env, deploying, onDeploy, onStart, onStop }: Props) {
  const isRunning = env.status === "running";
  const isStopped = env.status === "stopped";

  return (
    <div className="flex items-center justify-between px-4 py-2.5 border-b border-border/30 bg-card/10">
      <div className="min-w-0">
        <div className="flex items-center gap-1.5">
          <h3 className="text-sm font-semibold truncate">{env.name}</h3>
          {env.vanity_domain && (
            <a className="text-muted-foreground/40 hover:text-primary transition-colors" href={`https://${env.vanity_domain}`} target="_blank" rel="noopener noreferrer">
              <ExternalLink className="h-3 w-3" />
            </a>
          )}
        </div>
        <div className="flex items-center gap-2 mt-0.5">
          <Badge variant="outline" className={`h-4 rounded-sm px-1.5 text-xs font-normal ${
            isRunning ? "border-emerald-500/30 text-emerald-500" :
            isStopped ? "border-zinc-500/30 text-zinc-500" :
            "border-amber-500/30 text-amber-500"
          }`}>
            {env.status}
          </Badge>
          {env.php_major_version && <span className="text-xs text-muted-foreground/40">PHP {env.php_major_version}</span>}
          {env.uses_octane && <span className="text-xs text-muted-foreground/40">Octane</span>}
        </div>
      </div>
      <div className="flex items-center gap-1.5">
        {isStopped ? (
          <Button size="sm" variant="outline" className="h-7 gap-1.5 text-xs text-emerald-500 hover:text-emerald-400" onClick={onStart}>
            <Play className="h-3 w-3" /> {t("cloud.start")}
          </Button>
        ) : isRunning ? (
          <Button size="sm" variant="outline" className="h-7 gap-1.5 text-xs text-red-500 hover:text-red-400" onClick={onStop}>
            <Square className="h-3 w-3" /> {t("cloud.stop")}
          </Button>
        ) : null}
        <Button size="sm" className="h-7 gap-1.5 text-xs font-medium" onClick={onDeploy} disabled={deploying}>
          {deploying ? <RefreshCw className="h-3 w-3 animate-spin" /> : <Rocket className="h-3 w-3" />}
          {t("cloud.deploy")}
        </Button>
      </div>
    </div>
  );
}
