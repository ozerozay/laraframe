import { Globe, Zap } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { shortRepo } from "@/lib/helpers";
import { t } from "@/lib/i18n";
import { EmptyState } from "./shared/EmptyState";
import type { ForgeSite } from "@/lib/tauri";

interface Props {
  sites: ForgeSite[];
  selectedId: string | null;
  onSelect: (site: ForgeSite) => void;
}

export function SiteList({ sites, selectedId, onSelect }: Props) {
  if (sites.length === 0) {
    return <EmptyState icon={Globe} title={t("forge.noSites")} />;
  }

  return (
    <div className="flex-1 overflow-auto">
      {sites.map((site) => {
        const active = site.id === selectedId;
        const isDeploying = site.deployment_status === "deploying" || site.deployment_status === "queued";
        return (
          <div
            key={site.id}
            className={`relative flex cursor-pointer items-center gap-2.5 px-3 py-2 transition-all border-b border-border/20 ${
              active
                ? "bg-primary/5"
                : "hover:bg-muted/20"
            }`}
            onClick={() => onSelect(site)}
          >
            {/* Active indicator — left accent bar */}
            {active && (
              <div className="absolute left-0 top-1/2 -translate-y-1/2 w-[2px] h-5 rounded-r-full bg-primary" />
            )}

            <div className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-md transition-colors ${
              active ? "bg-primary/10 text-primary" : "bg-muted/20 text-muted-foreground/50"
            }`}>
              <Globe className="h-3 w-3" />
            </div>

            <div className="flex-1 min-w-0">
              <p className={`text-sm font-medium truncate ${active ? "text-foreground" : "text-foreground/80"}`}>
                {site.name}
              </p>
              <p className="text-sm text-muted-foreground/50 truncate font-mono">
                {site.repository_url ? shortRepo(site.repository_url) : t("site.noRepository")}
              </p>
            </div>

            <div className="flex shrink-0 items-center gap-1">
              {isDeploying && (
                <Badge variant="outline" className="h-4 px-1 text-xs font-normal border-amber-500/30 text-amber-500 animate-pulse">
                  {site.deployment_status}
                </Badge>
              )}
              {site.quick_deploy && <Zap className="h-2.5 w-2.5 text-amber-500/50" />}
            </div>
          </div>
        );
      })}
    </div>
  );
}
