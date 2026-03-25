import { useState } from "react";
import { RefreshCw, Power, PowerOff } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { cachedFetch, invalidateCache } from "@/lib/cache";
import { forgeGetIntegration, forgeEnableIntegration, forgeDisableIntegration } from "@/lib/tauri";
import { ConfirmDialog } from "../shared/ConfirmDialog";

interface Props {
  token: string;
  orgSlug: string;
  serverId: string;
  siteId: string;
}

const INTEGRATIONS = [
  { key: "horizon", label: "Horizon", desc: "Queue monitoring dashboard" },
  { key: "octane", label: "Octane", desc: "High-performance server" },
  { key: "reverb", label: "Reverb", desc: "WebSocket server" },
  { key: "pulse", label: "Pulse", desc: "Application monitoring" },
  { key: "inertia", label: "Inertia SSR", desc: "Server-side rendering" },
  { key: "laravel-scheduler", label: "Scheduler", desc: "Task scheduling" },
  { key: "laravel-maintenance", label: "Maintenance", desc: "Maintenance mode" },
] as const;

interface IntegrationState {
  loaded: boolean;
  enabled: boolean;
  data: unknown;
  toggling: boolean;
}

export function IntegrationsWidget({ token, orgSlug, serverId, siteId }: Props) {
  const [states, setStates] = useState<Record<string, IntegrationState>>({});
  const [loaded, setLoaded] = useState(false);
  const [loading, setLoading] = useState(false);
  const [confirmTarget, setConfirmTarget] = useState<{ key: string; label: string; currentlyEnabled: boolean } | null>(null);

  const load = async () => {
    setLoading(true);
    const newStates: Record<string, IntegrationState> = {};
    for (const integration of INTEGRATIONS) {
      try {
        const data = await cachedFetch(
          `site:${siteId}:integration:${integration.key}`,
          () => forgeGetIntegration(token, orgSlug, serverId, siteId, integration.key),
          120_000
        );
        const hasData = data && typeof data === "object" && Object.keys(data as object).length > 0;
        newStates[integration.key] = { loaded: true, enabled: !!hasData, data, toggling: false };
      } catch (err) {
        console.error(`Failed to load integration ${integration.key}:`, err);
        newStates[integration.key] = { loaded: true, enabled: false, data: null, toggling: false };
      }
    }
    setStates(newStates);
    setLoaded(true);
    setLoading(false);
  };

  if (!loaded && !loading) load();

  const toggle = async (key: string, currentlyEnabled: boolean) => {
    setStates((s) => ({ ...s, [key]: { ...s[key], toggling: true } }));
    try {
      if (currentlyEnabled) {
        await forgeDisableIntegration(token, orgSlug, serverId, siteId, key);
        toast.success(`${key} disabled`);
      } else {
        await forgeEnableIntegration(token, orgSlug, serverId, siteId, key);
        toast.success(`${key} enabled`);
      }
      invalidateCache(`site:${siteId}:integration:${key}`);
      setStates((s) => ({
        ...s,
        [key]: { ...s[key], enabled: !currentlyEnabled, toggling: false },
      }));
    } catch (err) {
      toast.error(`Failed: ${err}`);
      setStates((s) => ({ ...s, [key]: { ...s[key], toggling: false } }));
    }
  };

  if (loading) {
    return (
      <div className="flex h-32 items-center justify-center">
        <RefreshCw className="h-4 w-4 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="grid gap-2 sm:grid-cols-2 p-4">
      {INTEGRATIONS.map((integration) => {
        const state = states[integration.key];
        const enabled = state?.enabled ?? false;
        const toggling = state?.toggling ?? false;
        return (
          <div
            key={integration.key}
            className={`flex items-center justify-between rounded-lg border p-3 transition-colors ${
              enabled ? "border-emerald-500/20 bg-emerald-500/5" : "border-border/50 bg-card/30"
            }`}
          >
            <div>
              <div className="flex items-center gap-2">
                <p className="text-sm font-medium">{integration.label}</p>
                <Badge variant="outline" className={`text-sm font-normal ${enabled ? "border-emerald-500/30 text-emerald-500" : "border-border text-muted-foreground"}`}>
                  {enabled ? "active" : "off"}
                </Badge>
              </div>
              <p className="text-xs text-muted-foreground mt-0.5">{integration.desc}</p>
            </div>
            <Button
              size="icon"
              variant="ghost"
              className={`h-8 w-8 ${enabled ? "text-emerald-500 hover:text-red-400" : "text-muted-foreground hover:text-emerald-500"}`}
              onClick={() => setConfirmTarget({ key: integration.key, label: integration.label, currentlyEnabled: enabled })}
              disabled={toggling}
              aria-label={enabled ? "Disable" : "Enable"}
            >
              {toggling ? (
                <RefreshCw className="h-4 w-4 animate-spin" />
              ) : enabled ? (
                <Power className="h-4 w-4" />
              ) : (
                <PowerOff className="h-4 w-4" />
              )}
            </Button>
          </div>
        );
      })}
      <ConfirmDialog
        open={!!confirmTarget}
        title={confirmTarget ? `${confirmTarget.currentlyEnabled ? "Disable" : "Enable"} ${confirmTarget.label}` : ""}
        description={confirmTarget?.currentlyEnabled ? "This will stop the daemon/worker." : "This will create a daemon/worker on your server."}
        variant={confirmTarget?.currentlyEnabled ? "danger" : "warning"}
        confirmText={confirmTarget?.currentlyEnabled ? "Disable" : "Enable"}
        onConfirm={() => { if (confirmTarget) { toggle(confirmTarget.key, confirmTarget.currentlyEnabled); setConfirmTarget(null); } }}
        onCancel={() => setConfirmTarget(null)}
      />
    </div>
  );
}
