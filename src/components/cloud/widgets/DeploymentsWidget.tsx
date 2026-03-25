import { useState } from "react";
import { CheckCircle2, AlertCircle, Clock, Rocket, RefreshCw, ChevronRight, ChevronDown, User, GitBranch, GitCommit } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { timeAgo } from "@/lib/helpers";
import { t } from "@/lib/i18n";
import { EmptyState } from "@/components/forge/shared/EmptyState";
import { LogViewer } from "@/components/forge/shared/LogViewer";
import { cachedFetch, invalidateCache } from "@/lib/cache";
import { cloudGetDeploymentLogs, type CloudDeployment } from "@/lib/tauri";

interface Props {
  deployments: CloudDeployment[];
  token: string;
  onRefresh: () => void;
}

const isSuccess = (s: string | null) => s?.includes("succeeded");
const isFailed = (s: string | null) => s?.includes("failed");

export function CloudDeploymentsWidget({ deployments, token, onRefresh }: Props) {
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [deployLog, setDeployLog] = useState("");
  const [logLoading, setLogLoading] = useState(false);

  const toggleLog = async (depId: string) => {
    if (expandedId === depId) { setExpandedId(null); return; }
    setExpandedId(depId);
    setLogLoading(true);
    setDeployLog("");
    try {
      const log = await cachedFetch(`cloud:deploy:${depId}:log`, () => cloudGetDeploymentLogs(token, depId), 300_000);
      setDeployLog(log);
    } catch (err) { console.error("Failed to load deployment log:", err); setDeployLog("Failed to load deployment log."); }
    setLogLoading(false);
  };

  if (deployments.length === 0) {
    return <EmptyState icon={Rocket} title={t("site.noDeployments")} description={t("site.noDeploymentsDesc")} />;
  }

  return (
    <div className="flex flex-col h-full">
      <div className="flex items-center justify-between border-b border-border/30 px-4 py-2">
        <span className="text-sm text-muted-foreground">{deployments.length} {t("cloud.deployments").toLowerCase()}</span>
        <Button size="sm" variant="ghost" className="h-6 gap-1 px-2 text-xs" onClick={() => { invalidateCache("cloud:"); onRefresh(); }}>
          <RefreshCw className="h-3 w-3" /> {t("app.refresh")}
        </Button>
      </div>
      <div className="flex-1 overflow-auto divide-y divide-border/30">
        {[...deployments].reverse().map((dep) => {
          const expanded = expandedId === dep.id;
          return (
            <div key={dep.id}>
              <div className="px-4 py-3 hover:bg-muted/20 transition-colors cursor-pointer" onClick={() => toggleLog(dep.id)}>
                <div className="flex items-start gap-2.5">
                  <div className="mt-0.5">
                    {isSuccess(dep.status) ? <CheckCircle2 className="h-4 w-4 text-emerald-500" /> :
                     isFailed(dep.status) ? <AlertCircle className="h-4 w-4 text-red-500" /> :
                     <Clock className="h-4 w-4 text-amber-500 animate-pulse" />}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium leading-snug truncate">
                      {dep.commit_message || dep.status || "Deployment"}
                    </p>
                    <div className="flex flex-wrap items-center gap-x-3 gap-y-1 mt-1 text-xs text-muted-foreground">
                      {dep.commit_author && <span className="flex items-center gap-1"><User className="h-2.5 w-2.5" /> {dep.commit_author}</span>}
                      {dep.branch_name && <span className="flex items-center gap-1"><GitBranch className="h-2.5 w-2.5" /> {dep.branch_name}</span>}
                      {dep.commit_hash && <span className="flex items-center gap-1 font-mono"><GitCommit className="h-2.5 w-2.5" /> {dep.commit_hash.slice(0, 7)}</span>}
                    </div>
                  </div>
                  <div className="flex shrink-0 items-center gap-2">
                    <div className="text-right">
                      <Badge variant="outline" className={`text-xs font-normal ${
                        isSuccess(dep.status) ? "border-emerald-500/30 text-emerald-500" :
                        isFailed(dep.status) ? "border-red-500/30 text-red-500" :
                        "border-amber-500/30 text-amber-500"
                      }`}>{dep.status}</Badge>
                      <p className="mt-1 text-xs text-muted-foreground">{timeAgo(dep.started_at || dep.finished_at)}</p>
                    </div>
                    {expanded ? <ChevronDown className="h-3.5 w-3.5 text-muted-foreground" /> : <ChevronRight className="h-3.5 w-3.5 text-muted-foreground" />}
                  </div>
                </div>
              </div>
              {expanded && (
                <div className="bg-zinc-100 dark:bg-zinc-950 px-2 py-3 font-mono text-xs leading-5 max-h-[50vh] overflow-auto border-t border-border/20">
                  {logLoading ? (
                    <div className="flex items-center justify-center py-12"><RefreshCw className="h-3.5 w-3.5 animate-spin text-muted-foreground" /></div>
                  ) : <LogViewer content={deployLog} />}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
