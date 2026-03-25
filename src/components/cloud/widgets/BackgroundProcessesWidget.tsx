import { useState } from "react";
import { Activity, Plus, Trash2, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { timeAgo } from "@/lib/helpers";
import { t } from "@/lib/i18n";
import { cachedFetch, invalidateCache } from "@/lib/cache";
import { EmptyState } from "@/components/forge/shared/EmptyState";
import { ConfirmDialog } from "@/components/forge/shared/ConfirmDialog";
import { cloudListBackgroundProcesses, cloudCreateBackgroundProcess, cloudDeleteBackgroundProcess, type CloudBackgroundProcess } from "@/lib/tauri";

interface Props { token: string; instanceId: string; }

export function BackgroundProcessesWidget({ token, instanceId }: Props) {
  const [processes, setProcesses] = useState<CloudBackgroundProcess[]>([]);
  const [loaded, setLoaded] = useState(false);
  const [loading, setLoading] = useState(false);
  const [showCreate, setShowCreate] = useState(false);
  const [cmd, setCmd] = useState("");
  const [count, setCount] = useState("1");
  const [creating, setCreating] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<CloudBackgroundProcess | null>(null);
  const [deleting, setDeleting] = useState(false);

  const load = async (force = false) => {
    setLoading(true);
    if (force) invalidateCache(`cloud:instance:${instanceId}:bgprocesses`);
    try {
      const p = await cachedFetch(`cloud:instance:${instanceId}:bgprocesses`, () => cloudListBackgroundProcesses(token, instanceId));
      setProcesses(p); setLoaded(true);
    } catch (err) { console.error("Failed to load background processes:", err); setLoaded(true); }
    setLoading(false);
  };

  if (!loaded && !loading) load();

  const create = async () => {
    if (!cmd.trim()) return;
    setCreating(true);
    try {
      await cloudCreateBackgroundProcess(token, instanceId, cmd.trim(), parseInt(count) || 1);
      toast.success(`Background process created`);
      setCmd(""); setCount("1"); setShowCreate(false); load(true);
    } catch (err) { toast.error(`Failed: ${err}`); }
    setCreating(false);
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      await cloudDeleteBackgroundProcess(token, deleteTarget.id);
      toast.success("Background process deleted");
      setDeleteTarget(null); load(true);
    } catch (err) { toast.error(`Failed: ${err}`); }
    setDeleting(false);
  };

  return (
    <div className="flex flex-col h-full">
      <div className="flex items-center justify-between border-b border-border/30 px-4 py-2">
        <span className="text-sm text-muted-foreground">Background Processes ({processes.length})</span>
        <div className="flex gap-1.5">
          <Button size="sm" variant="ghost" className="h-6 gap-1 px-2 text-xs" onClick={() => load(true)}><RefreshCw className="h-3 w-3" /> {t("app.refresh")}</Button>
          <Button size="sm" className="h-6 gap-1 px-2 text-xs" onClick={() => setShowCreate(true)}><Plus className="h-3 w-3" /> {t("app.add")}</Button>
        </div>
      </div>
      {showCreate && (
        <div className="border-b border-border/30 px-4 py-3 bg-muted/20 space-y-2">
          <div className="flex gap-2">
            <Input value={cmd} onChange={(e) => setCmd(e.target.value)} placeholder="php artisan queue:work" className="h-8 text-xs font-mono flex-1" autoFocus />
            <Input value={count} onChange={(e) => setCount(e.target.value)} placeholder="Processes" className="h-8 text-xs w-24" type="number" min="1" max="10" />
          </div>
          <div className="flex gap-2">
            <Button size="sm" className="h-8 text-xs" onClick={create} disabled={creating || !cmd.trim()}>
              {creating ? <RefreshCw className="h-3 w-3 animate-spin mr-1" /> : null} {t("app.create")}
            </Button>
            <Button size="sm" variant="ghost" className="h-8 text-xs" onClick={() => setShowCreate(false)}>{t("app.cancel")}</Button>
          </div>
        </div>
      )}
      <div className="flex-1 overflow-auto">
        {loading && !loaded ? (
          <div className="flex h-32 items-center justify-center"><RefreshCw className="h-4 w-4 animate-spin text-muted-foreground" /></div>
        ) : processes.length === 0 ? (
          <EmptyState icon={Activity} title="No background processes" description="Add a background process to this instance" />
        ) : (
          <div className="divide-y divide-border/30">
            {processes.map((p) => (
              <div key={p.id} className="flex items-center gap-3 px-4 py-3 group hover:bg-muted/20">
                <Activity className="h-4 w-4 text-muted-foreground shrink-0" />
                <div className="flex-1 min-w-0">
                  <code className="text-sm font-mono truncate block">{p.command}</code>
                  <div className="flex items-center gap-2 text-xs text-muted-foreground mt-0.5">
                    {p.process_type && <span>{p.process_type}</span>}
                    {p.processes !== null && <span>{p.processes} process{p.processes !== 1 ? "es" : ""}</span>}
                    {p.created_at && <span>{timeAgo(p.created_at)}</span>}
                  </div>
                </div>
                <Badge variant="outline" className="text-xs font-normal">{p.process_type || "worker"}</Badge>
                <Button size="icon" variant="ghost" className="h-6 w-6 opacity-0 group-hover:opacity-100 text-muted-foreground hover:text-red-400"
                  onClick={() => setDeleteTarget(p)} aria-label="Delete">
                  <Trash2 className="h-3 w-3" />
                </Button>
              </div>
            ))}
          </div>
        )}
      </div>
      <ConfirmDialog open={!!deleteTarget} title="Delete Background Process" description={`Delete this background process? The command "${deleteTarget?.command}" will be stopped.`} variant="danger" loading={deleting} onConfirm={handleDelete} onCancel={() => setDeleteTarget(null)} />
    </div>
  );
}
