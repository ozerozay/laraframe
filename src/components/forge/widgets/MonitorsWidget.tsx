import { useState } from "react";
import { Activity, Cpu, HardDrive, MemoryStick, RefreshCw } from "lucide-react";
import { StatusDot } from "../shared/StatusDot";
import { EmptyState } from "../shared/EmptyState";
import { t } from "@/lib/i18n";
import { cachedFetch } from "@/lib/cache";
import { forgeListMonitors, type ForgeMonitor } from "@/lib/tauri";

interface Props {
  token: string;
  orgSlug: string;
  serverId: string;
}

function MonitorIcon({ type }: { type: string }) {
  if (type.includes("cpu")) return <Cpu className="h-4 w-4" />;
  if (type.includes("memory") || type.includes("ram")) return <MemoryStick className="h-4 w-4" />;
  if (type.includes("disk")) return <HardDrive className="h-4 w-4" />;
  return <Activity className="h-4 w-4" />;
}

export function MonitorsWidget({ token, orgSlug, serverId }: Props) {
  const [monitors, setMonitors] = useState<ForgeMonitor[]>([]);
  const [loaded, setLoaded] = useState(false);
  const [loading, setLoading] = useState(false);

  if (!loaded && !loading) {
    setLoading(true);
    cachedFetch(`server:${serverId}:monitors`, () => forgeListMonitors(token, orgSlug, serverId))
      .then((m) => { setMonitors(m); setLoaded(true); })
      .catch(() => setLoaded(true))
      .finally(() => setLoading(false));
  }

  if (loading) {
    return (
      <div className="flex h-32 items-center justify-center">
        <RefreshCw className="h-4 w-4 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (monitors.length === 0) {
    return <EmptyState icon={Activity} title={t("forge.noMonitors")} description={t("forge.noMonitorsDesc")} />;
  }

  return (
    <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
      {monitors.map((m) => {
        const triggered = m.status === "triggered";
        const active = m.status === "active";
        return (
          <div
            key={m.id}
            className={`rounded-lg border p-4 ${
              triggered ? "border-red-500/30 bg-red-500/5"
              : active ? "border-emerald-500/20 bg-card/30"
              : "border-border/50 bg-card/30"
            }`}
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <MonitorIcon type={m.monitor_type} />
                <span className="text-sm font-medium capitalize">{m.monitor_type.replace(/_/g, " ")}</span>
              </div>
              <StatusDot active={active && !triggered} />
            </div>
            <div className="mt-3 flex items-baseline justify-between">
              <span className="text-2xl font-bold tabular-nums">
                {m.threshold}<span className="text-sm font-normal text-muted-foreground">%</span>
              </span>
              <span className="text-xs text-muted-foreground">
                {m.operator === "gte" ? t("monitor.above") : t("monitor.below")} {m.minutes}m
              </span>
            </div>
          </div>
        );
      })}
    </div>
  );
}
