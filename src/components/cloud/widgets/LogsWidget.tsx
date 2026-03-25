import { useState } from "react";
import { RefreshCw, AlertCircle, Clock, Info, AlertTriangle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { cloudGetEnvironmentLogs } from "@/lib/tauri";

interface Props { token: string; envId: string; }

interface LogEntry {
  message: string;
  level: string;
  type: string;
  logged_at: string;
  data?: Record<string, unknown>;
}

const levelColors: Record<string, string> = {
  error: "text-red-500",
  warning: "text-amber-500",
  info: "text-blue-400",
  debug: "text-muted-foreground",
};

const levelIcons: Record<string, typeof AlertCircle> = {
  error: AlertCircle,
  warning: AlertTriangle,
  info: Info,
  debug: Clock,
};

function formatTime(iso: string): string {
  try {
    return new Date(iso).toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit", second: "2-digit" });
  } catch (err) { console.error("Failed to format time:", err); return iso; }
}

export function CloudLogsWidget({ token, envId }: Props) {
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [loaded, setLoaded] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [timeRange, setTimeRange] = useState("1h");

  const load = async (range?: string) => {
    const r = range || timeRange;
    setLoading(true);
    setError(null);
    try {
      const now = new Date();
      const from = new Date(now);
      if (r === "15m") from.setMinutes(from.getMinutes() - 15);
      else if (r === "1h") from.setHours(from.getHours() - 1);
      else if (r === "6h") from.setHours(from.getHours() - 6);
      else if (r === "24h") from.setHours(from.getHours() - 24);

      const result = await cloudGetEnvironmentLogs(
        token, envId,
        from.toISOString().replace(/\.\d+Z/, "Z"),
        now.toISOString().replace(/\.\d+Z/, "Z")
      );
      setLogs(result.data || []);
      setLoaded(true);
    } catch (err) {
      setError(String(err));
      setLoaded(true);
    }
    setLoading(false);
  };

  if (!loaded && !loading) load();

  return (
    <div className="flex flex-col h-full">
      <div className="flex items-center justify-between border-b border-border/30 px-4 py-2">
        <div className="flex items-center gap-1.5">
          {["15m", "1h", "6h", "24h"].map((r) => (
            <button
              key={r}
              onClick={() => { setTimeRange(r); load(r); }}
              className={`rounded-md px-2.5 py-1 text-xs font-medium transition-colors ${
                timeRange === r ? "bg-muted text-foreground" : "text-muted-foreground hover:text-foreground"
              }`}
            >
              {r}
            </button>
          ))}
        </div>
        <div className="flex items-center gap-2">
          <span className="text-xs text-muted-foreground">{logs.length} entries</span>
          <Button size="sm" variant="ghost" className="h-6 gap-1 px-2 text-xs" onClick={() => load()}>
            <RefreshCw className="h-3 w-3" /> Refresh
          </Button>
        </div>
      </div>

      <div className="flex-1 overflow-auto">
        {loading && !loaded ? (
          <div className="flex h-32 items-center justify-center"><RefreshCw className="h-4 w-4 animate-spin text-muted-foreground" /></div>
        ) : error ? (
          <div className="flex h-32 flex-col items-center justify-center gap-2">
            <AlertCircle className="h-5 w-5 text-red-400" />
            <p className="text-xs text-red-400 max-w-sm text-center">{error}</p>
          </div>
        ) : logs.length === 0 ? (
          <div className="flex h-32 items-center justify-center text-xs text-muted-foreground/40">No logs in this time range</div>
        ) : (
          <div className="divide-y divide-border/10">
            {logs.map((log, i) => {
              const Icon = levelIcons[log.level] || Info;
              const color = levelColors[log.level] || "text-muted-foreground";
              return (
                <div key={i} className="flex items-start gap-2.5 px-4 py-2 hover:bg-muted/10">
                  <Icon className={`h-3.5 w-3.5 mt-0.5 shrink-0 ${color}`} />
                  <div className="flex-1 min-w-0">
                    <p className={`text-sm font-mono leading-snug ${color}`}>{log.message}</p>
                    {log.data && (
                      <div className="flex flex-wrap items-center gap-x-3 mt-0.5 text-xs text-muted-foreground/60">
                        {log.data.method ? <span className="font-mono">{String(log.data.method)}</span> : null}
                        {log.data.path ? <span className="font-mono">{String(log.data.path)}</span> : null}
                        {log.data.status != null ? <span>status: {String(log.data.status)}</span> : null}
                        {log.data.duration_ms ? <span>{String(log.data.duration_ms)}ms</span> : null}
                      </div>
                    )}
                  </div>
                  <Badge variant="outline" className={`text-xs font-normal h-4 px-1 shrink-0 ${color}`}>{log.type}</Badge>
                  <span className="text-xs text-muted-foreground/40 font-mono tabular-nums shrink-0">{formatTime(log.logged_at)}</span>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
