import { useState } from "react";
import { Terminal, AlertCircle, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { LogViewer } from "../shared/LogViewer";
import { cachedFetch, invalidateCache } from "@/lib/cache";
import { forgeGetSiteLog } from "@/lib/tauri";
import { t } from "@/lib/i18n";

interface Props {
  token: string;
  orgSlug: string;
  serverId: string;
  siteId: string;
}

const LOG_TYPES = ["application", "nginx-access", "nginx-error"] as const;

export function SiteLogsWidget({ token, orgSlug, serverId, siteId }: Props) {
  const [logType, setLogType] = useState<string | null>(null);
  const [content, setContent] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const load = async (type: string, force = false) => {
    setLogType(type);
    setLoading(true);
    setError(null);
    setContent("");
    if (force) invalidateCache(`site:${siteId}:log:${type}`);
    try {
      const log = await cachedFetch(
        `site:${siteId}:log:${type}`,
        () => forgeGetSiteLog(token, orgSlug, serverId, siteId, type),
        120_000
      );
      setContent(log);
    } catch (err) {
      setError(String(err));
    }
    setLoading(false);
  };

  return (
    <div className="flex flex-1 flex-col min-h-0">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-border/30 px-4 py-2">
        <div className="flex items-center gap-1.5">
          {LOG_TYPES.map((type) => (
            <button
              key={type}
              onClick={() => load(type)}
              className={`rounded-md px-2.5 py-1 text-sm font-medium transition-colors ${
                logType === type
                  ? "bg-muted text-foreground"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              {type}
            </button>
          ))}
        </div>
        {logType && (
          <Button size="sm" variant="ghost" className="h-6 gap-1 px-2 text-xs" onClick={() => load(logType, true)}>
            <RefreshCw className="h-2.5 w-2.5" /> {t("app.refresh")}
          </Button>
        )}
      </div>

      {/* Content */}
      <div className="flex-1 overflow-auto bg-zinc-100 dark:bg-zinc-950 px-2 py-3 font-mono text-sm leading-5">
        {!logType ? (
          <div className="flex h-full min-h-32 flex-col items-center justify-center gap-2 text-muted-foreground/40">
            <Terminal className="h-5 w-5" />
            <span className="text-sm">{t("site.selectLogType")}</span>
          </div>
        ) : loading ? (
          <div className="flex h-full min-h-32 items-center justify-center">
            <div className="flex items-center gap-2 text-muted-foreground">
              <RefreshCw className="h-3.5 w-3.5 animate-spin" />
              <span className="text-xs">{t("site.loadingLog")}</span>
            </div>
          </div>
        ) : error ? (
          <div className="flex h-full min-h-32 flex-col items-center justify-center gap-2">
            <AlertCircle className="h-5 w-5 text-red-400/60" />
            <p className="text-sm text-red-400/80 max-w-xs text-center">{error}</p>
            <button onClick={() => load(logType)} className="text-xs text-muted-foreground hover:text-foreground underline">
              {t("app.retry")}
            </button>
          </div>
        ) : !content || content === "No log available" ? (
          <div className="flex h-full min-h-32 flex-col items-center justify-center gap-2 text-muted-foreground/40">
            <Terminal className="h-5 w-5" />
            <span className="text-sm">{t("site.logEmpty")}</span>
          </div>
        ) : (
          <LogViewer content={content} />
        )}
      </div>
    </div>
  );
}
