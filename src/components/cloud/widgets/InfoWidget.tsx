import { useState } from "react";
import { Info, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { t } from "@/lib/i18n";
import { cachedFetch, invalidateCache } from "@/lib/cache";

interface Props {
  token: string;
  cacheKey: string;
  fetcher: () => Promise<unknown>;
  title: string;
}

export function InfoWidget({ token: _token, cacheKey, fetcher, title }: Props) {
  const [data, setData] = useState<unknown>(null);
  const [loaded, setLoaded] = useState(false);
  const [loading, setLoading] = useState(false);

  const load = async (force = false) => {
    setLoading(true);
    if (force) invalidateCache(cacheKey);
    try {
      const d = await cachedFetch(cacheKey, fetcher, 300_000);
      setData(d);
      setLoaded(true);
    } catch (err) { console.error("Failed to load info:", err); setLoaded(true); }
    setLoading(false);
  };

  if (!loaded && !loading) load();

  return (
    <div className="flex flex-col h-full">
      <div className="flex items-center justify-between border-b border-border/30 px-4 py-2">
        <div className="flex items-center gap-2">
          <Info className="h-4 w-4 text-muted-foreground" />
          <span className="text-sm text-muted-foreground">{title}</span>
        </div>
        <Button size="sm" variant="ghost" className="h-6 gap-1 px-2 text-xs" onClick={() => load(true)}>
          <RefreshCw className="h-3 w-3" /> {t("app.refresh")}
        </Button>
      </div>
      <div className="flex-1 overflow-auto p-4">
        {loading && !loaded ? (
          <RefreshCw className="h-4 w-4 animate-spin text-muted-foreground" />
        ) : !data ? (
          <p className="text-xs text-muted-foreground/40">No data</p>
        ) : (
          <pre className="text-xs font-mono whitespace-pre-wrap text-foreground/80">
            {typeof data === "string" ? data : JSON.stringify(data, null, 2)}
          </pre>
        )}
      </div>
    </div>
  );
}
