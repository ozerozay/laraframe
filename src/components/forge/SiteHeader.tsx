import { ExternalLink, Rocket, Zap, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { t } from "@/lib/i18n";
import type { ForgeSite } from "@/lib/tauri";

interface Props {
  site: ForgeSite;
  deploying: boolean;
  onDeploy: () => void;
}

export function SiteHeader({ site, deploying, onDeploy }: Props) {
  return (
    <div className="flex items-center justify-between border-b border-border/50 px-4 py-3">
      <div className="min-w-0">
        <div className="flex items-center gap-2">
          <h3 className="text-sm font-semibold truncate">{site.name}</h3>
          {site.url && (
            <a
              className="text-muted-foreground hover:text-foreground transition-colors"
              href={site.url}
              target="_blank"
              rel="noopener noreferrer"
              onClick={(e) => e.stopPropagation()}
            >
              <ExternalLink className="h-3 w-3" />
            </a>
          )}
        </div>
        <div className="flex items-center gap-2 mt-0.5 text-[10px] text-muted-foreground">
          <Badge variant="outline" className="h-4 rounded-sm px-1 text-[9px] font-normal">
            {site.status || "unknown"}
          </Badge>
          {site.php_version && <span>{site.php_version}</span>}
          {site.quick_deploy && (
            <span className="flex items-center gap-0.5 text-amber-500">
              <Zap className="h-2.5 w-2.5" /> {t("site.quickDeploy")}
            </span>
          )}
        </div>
      </div>
      <Button
        size="sm"
        className="h-7 gap-1.5 text-xs bg-emerald-600 hover:bg-emerald-700 text-white"
        onClick={onDeploy}
        disabled={deploying}
      >
        {deploying ? <RefreshCw className="h-3 w-3 animate-spin" /> : <Rocket className="h-3 w-3" />}
        {t("site.deploy")}
      </Button>
    </div>
  );
}
