import { useState } from "react";
import { BarChart3, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cachedFetch, invalidateCache } from "@/lib/cache";

interface Props {
  token: string;
  cacheKey: string;
  fetcher: () => Promise<unknown>;
  title?: string;
}

interface MetricSeries {
  average: number[];
  data: Array<{ x: string; y: number[] }>;
}

export function MetricsWidget({ token: _token, cacheKey, fetcher, title = "Metrics" }: Props) {
  const [data, setData] = useState<unknown>(null);
  const [loaded, setLoaded] = useState(false);
  const [loading, setLoading] = useState(false);

  const load = async (force = false) => {
    setLoading(true);
    if (force) invalidateCache(cacheKey);
    try {
      const d = await cachedFetch(cacheKey, fetcher, 60_000);
      setData(d);
      setLoaded(true);
    } catch { setLoaded(true); }
    setLoading(false);
  };

  if (!loaded && !loading) load();

  // Parse metrics data into displayable format
  const renderMetrics = (raw: unknown) => {
    if (!raw || typeof raw !== "object") return <p className="text-xs text-muted-foreground/40">No data</p>;

    const obj = raw as Record<string, unknown>;
    const metricsData = (obj.data || obj) as Record<string, MetricSeries>;

    // Format value based on metric type
    const formatValue = (metricName: string, v: number): string => {
      if (metricName.includes("cpu") || metricName.includes("usage_percent")) {
        return `${(v * 100).toFixed(1)}%`;
      }
      if (metricName.includes("memory")) {
        if (v > 1e9) return `${(v / 1e9).toFixed(1)} GB`;
        if (v > 1e6) return `${(v / 1e6).toFixed(0)} MB`;
        if (v > 1e3) return `${(v / 1e3).toFixed(0)} KB`;
        return `${v.toFixed(0)} B`;
      }
      if (v >= 1e6) return `${(v / 1e6).toFixed(1)}M`;
      if (v >= 1e3) return `${(v / 1e3).toFixed(1)}K`;
      if (Number.isInteger(v)) return String(v);
      return v.toFixed(2);
    };

    return (
      <div className="space-y-6">
        {Object.entries(metricsData).map(([metricName, series]) => {
          if (!series || typeof series !== "object") return null;
          const s = series as MetricSeries;
          const avg = s.average;
          const points = s.data || [];

          return (
            <div key={metricName} className="space-y-2">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-semibold capitalize">{metricName.replace(/_/g, " ")}</h3>
                {avg && avg.length > 0 && (
                  <div className="flex items-center gap-3">
                    {avg.map((v, i) => (
                      <span key={i} className="text-xs font-mono">
                        <span className="text-muted-foreground">avg{avg.length > 1 ? `[${i}]` : ""}: </span>
                        <span className="text-primary font-semibold">{formatValue(metricName, v)}</span>
                      </span>
                    ))}
                  </div>
                )}
              </div>

              {/* Mini bar chart */}
              {points.length > 0 && (
                <div className="rounded-lg border border-border/30 overflow-hidden">
                  <div className="flex items-end h-24 gap-px bg-muted/10 px-2 py-2">
                    {points.slice(-30).map((p, i) => {
                      const maxVal = Math.max(...points.slice(-30).flatMap(pp => pp.y || []), 0.01);
                      const val = p.y?.[0] || 0;
                      const height = Math.max((val / maxVal) * 100, 2);
                      return (
                        <div
                          key={i}
                          className="flex-1 rounded-t bg-primary/60 hover:bg-primary transition-colors cursor-default"
                          style={{ height: `${height}%` }}
                          title={`${new Date(p.x).toLocaleTimeString()} — ${formatValue(metricName, val)}`}
                        />
                      );
                    })}
                  </div>
                  <div className="flex justify-between px-2 py-1 text-xs text-muted-foreground/40 border-t border-border/20">
                    {points.length > 0 && (
                      <>
                        <span>{new Date(points[Math.max(0, points.length - 30)].x).toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit" })}</span>
                        <span>{formatValue(metricName, points[0].y?.[0] || 0)} → {formatValue(metricName, points[points.length-1].y?.[0] || 0)}</span>
                        <span>{new Date(points[points.length - 1].x).toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit" })}</span>
                      </>
                    )}
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>
    );
  };

  return (
    <div className="flex flex-col h-full">
      <div className="flex items-center justify-between border-b border-border/30 px-4 py-2">
        <div className="flex items-center gap-2">
          <BarChart3 className="h-4 w-4 text-muted-foreground" />
          <span className="text-sm text-muted-foreground">{title}</span>
        </div>
        <Button size="sm" variant="ghost" className="h-6 gap-1 px-2 text-xs" onClick={() => load(true)}>
          <RefreshCw className="h-3 w-3" /> Refresh
        </Button>
      </div>
      <div className="flex-1 overflow-auto p-4">
        {loading && !loaded ? (
          <div className="flex h-32 items-center justify-center"><RefreshCw className="h-4 w-4 animate-spin text-muted-foreground" /></div>
        ) : !data ? (
          <div className="flex h-32 items-center justify-center text-xs text-muted-foreground/40">No metrics available</div>
        ) : (
          renderMetrics(data)
        )}
      </div>
    </div>
  );
}
