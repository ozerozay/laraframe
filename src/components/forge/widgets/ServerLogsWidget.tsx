import { useState } from "react";
import { Terminal, AlertCircle, RefreshCw } from "lucide-react";
import { LogViewer } from "../shared/LogViewer";
import { cachedFetch } from "@/lib/cache";
import { forgeGetServerLog } from "@/lib/tauri";
import { t } from "@/lib/i18n";

interface Props {
  token: string;
  orgSlug: string;
  serverId: string;
  phpVersion: string | null;
}

export function ServerLogsWidget({ token, orgSlug, serverId, phpVersion }: Props) {
  const phpLogKey = phpVersion
    ? `php-${phpVersion.replace("php", "").replace(/(\d)(\d)/, "$1.$2")}`
    : null;

  const logTypes = ["nginx-access", "nginx-error", ...(phpLogKey ? [phpLogKey] : [])];

  const [logType, setLogType] = useState<string | null>(null);
  const [content, setContent] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const load = async (type: string) => {
    setLogType(type);
    setContent("");
    setLoading(true);
    setError(null);
    try {
      const log = await cachedFetch(
        `server:${serverId}:log:${type}`,
        () => forgeGetServerLog(token, orgSlug, serverId, type),
        120_000
      );
      setContent(log);
    } catch (err) {
      setError(String(err));
    }
    setLoading(false);
  };

  return (
    <div className="flex flex-col gap-3 mt-3">
      <div className="flex items-center gap-1.5">
        {logTypes.map((type) => (
          <button
            key={type}
            onClick={() => load(type)}
            className={`rounded-md px-3 py-1.5 text-xs font-medium transition-colors ${
              logType === type
                ? "bg-muted text-foreground"
                : "text-muted-foreground hover:text-foreground hover:bg-muted/50"
            }`}
          >
            {type}
          </button>
        ))}
      </div>
      <div className="overflow-auto rounded-lg bg-zinc-100 dark:bg-zinc-950 px-2 py-3 h-[calc(100vh-340px)] font-mono text-sm leading-5">
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
            <p className="text-sm text-red-400/80">{error}</p>
            <button onClick={() => load(logType)} className="text-xs text-muted-foreground hover:text-foreground underline">
              {t("app.retry")}
            </button>
          </div>
        ) : (
          <LogViewer content={content} />
        )}
      </div>
    </div>
  );
}
