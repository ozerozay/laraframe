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
    <div className="w-80 shrink-0 space-y-1.5 overflow-auto">
      {sites.map((site) => {
        const active = site.id === selectedId;
        return (
          <div
            key={site.id}
            className={`group flex cursor-pointer items-center gap-3 rounded-lg border px-3 py-2.5 transition-all ${
              active
                ? "border-emerald-500/30 bg-emerald-500/5"
                : "border-transparent hover:border-border/50 hover:bg-card/50"
            }`}
            onClick={() => onSelect(site)}
          >
            <div className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-md ${
              active ? "bg-emerald-500/15" : "bg-muted/50"
            }`}>
              <Globe className={`h-3.5 w-3.5 ${active ? "text-emerald-500" : "text-muted-foreground"}`} />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-[13px] font-medium truncate">{site.name}</p>
              <div className="flex items-center gap-1.5 text-[10px] text-muted-foreground">
                <span className="truncate">
                  {site.repository_url ? shortRepo(site.repository_url) : t("site.noRepository")}
                </span>
              </div>
            </div>
            <div className="flex shrink-0 items-center gap-1.5">
              {site.deployment_status && (
                <Badge
                  variant="outline"
                  className={`text-[9px] h-4 px-1 font-normal ${
                    site.deployment_status === "deploying" || site.deployment_status === "queued"
                      ? "border-amber-500/30 text-amber-500 animate-pulse"
                      : site.deployment_status === "failed"
                        ? "border-red-500/30 text-red-500"
                        : "border-emerald-500/30 text-emerald-500"
                  }`}
                >
                  {site.deployment_status}
                </Badge>
              )}
              {site.quick_deploy && <Zap className="h-3 w-3 text-amber-500/70" />}
            </div>
          </div>
        );
      })}
    </div>
  );
}
