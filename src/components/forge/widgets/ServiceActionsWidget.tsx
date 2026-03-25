import { useState } from "react";
import { RefreshCw, Power, RotateCcw, Square } from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { ConfirmDialog } from "../shared/ConfirmDialog";
import { forgeServiceAction, forgeServerAction } from "@/lib/tauri";

interface Props { token: string; orgSlug: string; serverId: string; }

const SERVICES = [
  { key: "nginx", label: "Nginx", desc: "Web server", actions: ["restart", "stop", "start"] },
  { key: "mysql", label: "MySQL", desc: "Database server", actions: ["restart", "stop", "start"] },
  { key: "php", label: "PHP-FPM", desc: "PHP processor", actions: ["restart"] },
  { key: "postgres", label: "PostgreSQL", desc: "Database server", actions: ["restart", "stop", "start"] },
  { key: "redis", label: "Redis", desc: "Cache & queue", actions: ["restart", "stop", "start"] },
  { key: "supervisor", label: "Supervisor", desc: "Process manager", actions: ["restart"] },
];

export function ServiceActionsWidget({ token, orgSlug, serverId }: Props) {
  const [acting, setActing] = useState<string | null>(null);
  const [confirmTarget, setConfirmTarget] = useState<{ service: string; action: string; label: string } | null>(null);
  const [rebootConfirm, setRebootConfirm] = useState(false);
  const [rebooting, setRebooting] = useState(false);

  const handleAction = async () => {
    if (!confirmTarget) return;
    const key = `${confirmTarget.service}:${confirmTarget.action}`;
    setActing(key);
    try {
      await forgeServiceAction(token, orgSlug, serverId, confirmTarget.service, confirmTarget.action);
      toast.success(`${confirmTarget.label} ${confirmTarget.action} initiated`);
    } catch (err) {
      toast.error(`Failed: ${err}`);
    }
    setActing(null);
    setConfirmTarget(null);
  };

  const handleReboot = async () => {
    setRebooting(true);
    try {
      await forgeServerAction(token, orgSlug, serverId, "reboot");
      toast.success("Server reboot initiated");
    } catch (err) {
      toast.error(`Failed: ${err}`);
    }
    setRebooting(false);
    setRebootConfirm(false);
  };

  return (
    <div className="p-4 space-y-4">
      {/* Services grid */}
      <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
        {SERVICES.map((svc) => (
          <div key={svc.key} className="rounded-lg border border-border/30 p-3">
            <div className="flex items-center justify-between mb-2">
              <div>
                <p className="text-sm font-medium">{svc.label}</p>
                <p className="text-xs text-muted-foreground">{svc.desc}</p>
              </div>
            </div>
            <div className="flex gap-1.5">
              {svc.actions.map((action) => {
                const key = `${svc.key}:${action}`;
                const isActing = acting === key;
                return (
                  <Button
                    key={action}
                    size="sm"
                    variant="outline"
                    className={`h-7 text-xs gap-1 ${
                      action === "stop" ? "hover:border-red-500/30 hover:text-red-500" :
                      action === "restart" ? "hover:border-amber-500/30 hover:text-amber-500" :
                      "hover:border-emerald-500/30 hover:text-emerald-500"
                    }`}
                    onClick={() => setConfirmTarget({ service: svc.key, action, label: svc.label })}
                    disabled={isActing}
                  >
                    {isActing ? <RefreshCw className="h-3 w-3 animate-spin" /> :
                      action === "restart" ? <RotateCcw className="h-3 w-3" /> :
                      action === "stop" ? <Square className="h-3 w-3" /> :
                      <Power className="h-3 w-3" />}
                    {action}
                  </Button>
                );
              })}
            </div>
          </div>
        ))}
      </div>

      {/* Server reboot */}
      <div className="rounded-lg border border-red-500/20 bg-red-500/5 p-4">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-red-500">Server Reboot</p>
            <p className="text-xs text-muted-foreground mt-0.5">Reboot the entire server. All services will restart.</p>
          </div>
          <Button
            size="sm"
            variant="outline"
            className="h-8 text-xs border-red-500/30 text-red-500 hover:bg-red-500/10"
            onClick={() => setRebootConfirm(true)}
          >
            <RotateCcw className="h-3 w-3 mr-1" /> Reboot Server
          </Button>
        </div>
      </div>

      {/* Service action confirm */}
      <ConfirmDialog
        open={!!confirmTarget}
        title={`${confirmTarget?.action === "stop" ? "Stop" : confirmTarget?.action === "restart" ? "Restart" : "Start"} ${confirmTarget?.label}`}
        description={`Are you sure you want to ${confirmTarget?.action} ${confirmTarget?.label}? ${confirmTarget?.action === "stop" ? "This may cause downtime." : "This will briefly interrupt the service."}`}
        confirmText={confirmTarget?.action || "Confirm"}
        variant={confirmTarget?.action === "stop" ? "danger" : "warning"}
        loading={acting !== null}
        onConfirm={handleAction}
        onCancel={() => setConfirmTarget(null)}
      />

      {/* Reboot confirm */}
      <ConfirmDialog
        open={rebootConfirm}
        title="Reboot Server"
        description="This will reboot the entire server. All running services and processes will be interrupted. The server will be unavailable for 1-3 minutes."
        confirmText="Reboot"
        typeToConfirm="REBOOT"
        variant="danger"
        loading={rebooting}
        onConfirm={handleReboot}
        onCancel={() => setRebootConfirm(false)}
      />
    </div>
  );
}
