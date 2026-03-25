import { ExternalLink, Rocket, Zap, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { t } from "@/lib/i18n";
import type { ForgeSite } from "@/lib/tauri";

interface Props {
  site: ForgeSite;
  deploying: boolean;
  onDeploy: () => void;
}

export function SiteHeader({ site, deploying, onDeploy }: Props) {
  return (
    <div className="flex items-center justify-between px-4 py-2.5 border-b border-border/30 bg-card/10">
      <div className="min-w-0 flex items-center gap-2.5">
        <div>
          <div className="flex items-center gap-1.5">
            <h3 className="text-sm font-semibold truncate">{site.name}</h3>
            {site.url && (
              <a
                className="text-muted-foreground/40 hover:text-primary transition-colors"
                href={site.url}
                target="_blank"
                rel="noopener noreferrer"
                onClick={(e) => e.stopPropagation()}
              >
                <ExternalLink className="h-3 w-3" />
              </a>
            )}
          </div>
          <div className="flex items-center gap-2 mt-0.5">
            <span className="rounded bg-muted/30 px-1.5 py-0 text-xs font-mono text-muted-foreground/50">
              {site.status || "unknown"}
            </span>
            {site.php_version && (
              <span className="text-sm text-muted-foreground/40">{site.php_version}</span>
            )}
            {site.quick_deploy && (
              <span className="flex items-center gap-0.5 text-sm text-amber-500/60">
                <Zap className="h-2 w-2" /> Quick Deploy
              </span>
            )}
          </div>
        </div>
      </div>
      <Button
        size="sm"
        className="h-7 gap-1.5 text-sm font-medium"
        onClick={onDeploy}
        disabled={deploying}
      >
        {deploying ? <RefreshCw className="h-3 w-3 animate-spin" /> : <Rocket className="h-3 w-3" />}
        {t("site.deploy")}
      </Button>
    </div>
  );
}
