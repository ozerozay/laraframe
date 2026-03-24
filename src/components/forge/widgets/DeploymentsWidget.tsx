import { useState } from "react";
import {
  CheckCircle2, AlertCircle, Clock, User, GitBranch, GitCommit,
  Rocket, RefreshCw, ChevronDown, ChevronRight,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { timeAgo } from "@/lib/helpers";
import { t } from "@/lib/i18n";
import { EmptyState } from "../shared/EmptyState";
import { LogViewer } from "../shared/LogViewer";
import { cachedFetch, invalidateCache } from "@/lib/cache";
import { forgeGetDeploymentLog, type ForgeDeployment } from "@/lib/tauri";

interface Props {
  deployments: ForgeDeployment[];
  token: string;
  orgSlug: string;
  serverId: string;
  siteId: string;
  onRefresh: () => void;
}

export function DeploymentsWidget({ deployments, token, orgSlug, serverId, siteId, onRefresh }: Props) {
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [deployLog, setDeployLog] = useState("");
  const [logLoading, setLogLoading] = useState(false);

  const toggleLog = async (depId: string) => {
    if (expandedId === depId) {
      setExpandedId(null);
      return;
    }
    setExpandedId(depId);
    setLogLoading(true);
    setDeployLog("");
    try {
      const log = await cachedFetch(
        `deploy:${depId}:log`,
        () => forgeGetDeploymentLog(token, orgSlug, serverId, siteId, depId),
        300_000
      );
      setDeployLog(log);
    } catch {
      setDeployLog("Failed to load deployment log.");
    }
    setLogLoading(false);
  };

  const handleRefresh = () => {
    invalidateCache(`site:${siteId}:deployments`);
    onRefresh();
  };

  if (deployments.length === 0) {
    return <EmptyState icon={Rocket} title={t("site.noDeployments")} description={t("site.noDeploymentsDesc")} />;
  }

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-border/30 px-4 py-2">
        <span className="text-[11px] text-muted-foreground">
          {deployments.length} {t("site.deployments").toLowerCase()}
        </span>
        <Button size="sm" variant="ghost" className="h-6 gap-1 px-2 text-[10px]" onClick={handleRefresh}>
          <RefreshCw className="h-2.5 w-2.5" /> {t("app.refresh")}
        </Button>
      </div>

      {/* List - newest first */}
      <div className="flex-1 overflow-auto divide-y divide-border/30">
        {[...deployments].reverse().map((dep) => {
          const isExpanded = expandedId === dep.id;
          return (
            <div key={dep.id}>
              <div
                className="px-4 py-3 hover:bg-muted/20 transition-colors cursor-pointer"
                onClick={() => toggleLog(dep.id)}
              >
                <div className="flex items-start gap-2.5">
                  {/* Status icon */}
                  <div className="mt-0.5">
                    {dep.status === "finished" ? (
                      <CheckCircle2 className="h-4 w-4 text-emerald-500" />
                    ) : dep.status === "failed" ? (
                      <AlertCircle className="h-4 w-4 text-red-500" />
                    ) : (
                      <Clock className="h-4 w-4 text-amber-500 animate-pulse" />
                    )}
                  </div>

                  {/* Info */}
                  <div className="flex-1 min-w-0">
                    <p className="text-[13px] font-medium leading-snug truncate">
                      {dep.commit_message || dep.deploy_type || "Deployment"}
                    </p>
                    <div className="flex flex-wrap items-center gap-x-3 gap-y-1 mt-1 text-[10px] text-muted-foreground">
                      {dep.commit_author && (
                        <span className="flex items-center gap-1">
                          <User className="h-2.5 w-2.5" /> {dep.commit_author}
                        </span>
                      )}
                      {dep.commit_branch && (
                        <span className="flex items-center gap-1">
                          <GitBranch className="h-2.5 w-2.5" /> {dep.commit_branch}
                        </span>
                      )}
                      {dep.commit_hash && (
                        <span className="flex items-center gap-1 font-mono">
                          <GitCommit className="h-2.5 w-2.5" /> {dep.commit_hash.slice(0, 7)}
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Right side */}
                  <div className="flex shrink-0 items-center gap-2">
                    <div className="text-right">
                      <Badge
                        variant="outline"
                        className={`text-[9px] font-normal ${
                          dep.status === "finished"
                            ? "border-emerald-500/30 text-emerald-500"
                            : dep.status === "failed"
                              ? "border-red-500/30 text-red-500"
                              : "border-amber-500/30 text-amber-500"
                        }`}
                      >
                        {dep.deploy_type || "deploy"}
                      </Badge>
                      <p className="mt-1 text-[10px] text-muted-foreground">
                        {timeAgo(dep.created_at || dep.ended_at)}
                      </p>
                    </div>
                    {isExpanded ? (
                      <ChevronDown className="h-3.5 w-3.5 text-muted-foreground" />
                    ) : (
                      <ChevronRight className="h-3.5 w-3.5 text-muted-foreground" />
                    )}
                  </div>
                </div>
              </div>

              {/* Expanded deploy log */}
              {isExpanded && (
                <div className="bg-zinc-100 dark:bg-zinc-950 px-2 py-3 font-mono text-[11px] leading-5 max-h-[50vh] overflow-auto border-t border-border/20">
                  {logLoading ? (
                    <div className="flex items-center justify-center py-12">
                      <div className="flex items-center gap-2 text-muted-foreground">
                        <RefreshCw className="h-3.5 w-3.5 animate-spin" />
                        <span className="text-xs">{t("app.loading")}</span>
                      </div>
                    </div>
                  ) : !deployLog ? (
                    <div className="flex items-center justify-center py-12 text-muted-foreground/50">
                      <span className="text-xs">No output available</span>
                    </div>
                  ) : (
                    <LogViewer content={deployLog} />
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
