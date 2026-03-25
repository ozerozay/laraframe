import { useState } from "react";
import { Server, Plus, Trash2, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { t } from "@/lib/i18n";
import { cachedFetch, invalidateCache } from "@/lib/cache";
import { EmptyState } from "@/components/forge/shared/EmptyState";
import { ConfirmDialog } from "@/components/forge/shared/ConfirmDialog";
import { EditDialog, EditButton } from "./EditDialog";
import { cloudListInstances, cloudCreateInstance, cloudDeleteInstance, cloudUpdateInstance, type CloudInstance } from "@/lib/tauri";

interface Props { token: string; envId: string; }

export function CloudInstancesWidget({ token, envId }: Props) {
  const [instances, setInstances] = useState<CloudInstance[]>([]);
  const [loaded, setLoaded] = useState(false);
  const [loading, setLoading] = useState(false);
  const [showCreate, setShowCreate] = useState(false);
  const [name, setName] = useState("");
  const [instType, setInstType] = useState("app");
  const [size, setSize] = useState("flex.g-1vcpu-512mb");
  const [creating, setCreating] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<CloudInstance | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [editTarget, setEditTarget] = useState<CloudInstance | null>(null);

  const load = async (force = false) => {
    setLoading(true);
    if (force) invalidateCache(`cloud:env:${envId}:instances`);
    try {
      const i = await cachedFetch(`cloud:env:${envId}:instances`, () => cloudListInstances(token, envId));
      setInstances(i); setLoaded(true);
    } catch (err) { console.error("Failed to load instances:", err); setLoaded(true); }
    setLoading(false);
  };

  if (!loaded && !loading) load();

  const create = async () => {
    if (!name.trim()) return;
    setCreating(true);
    try {
      await cloudCreateInstance(token, envId, name.trim(), instType, size);
      toast.success(`Instance "${name.trim()}" created`);
      setName(""); setShowCreate(false); load(true);
    } catch (err) { toast.error(`Failed: ${err}`); }
    setCreating(false);
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      await cloudDeleteInstance(token, deleteTarget.id);
      toast.success(`Instance "${deleteTarget.name}" deleted`);
      setDeleteTarget(null); load(true);
    } catch (err) { toast.error(`Failed: ${err}`); }
    setDeleting(false);
  };

  return (
    <div className="flex flex-col h-full">
      <div className="flex items-center justify-between border-b border-border/30 px-4 py-2">
        <span className="text-sm text-muted-foreground">{t("cloud.instances")} ({instances.length})</span>
        <div className="flex gap-1.5">
          <Button size="sm" variant="ghost" className="h-6 gap-1 px-2 text-xs" onClick={() => load(true)}><RefreshCw className="h-3 w-3" /> {t("app.refresh")}</Button>
          <Button size="sm" className="h-6 gap-1 px-2 text-xs" onClick={() => setShowCreate(true)}><Plus className="h-3 w-3" /> {t("app.add")}</Button>
        </div>
      </div>
      {showCreate && (
        <div className="border-b border-border/30 px-4 py-3 bg-muted/20 space-y-2">
          <div className="flex gap-2">
            <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="Instance name" className="h-8 text-xs flex-1" autoFocus />
            <select value={instType} onChange={(e) => setInstType(e.target.value)} className="h-8 rounded-md border bg-transparent px-2 text-xs">
              <option value="app">App</option>
              <option value="service">Service</option>
              <option value="queue">Queue</option>
            </select>
            <select value={size} onChange={(e) => setSize(e.target.value)} className="h-8 rounded-md border bg-transparent px-2 text-xs">
              <option value="flex.g-1vcpu-512mb">Flex 1vCPU 512MB</option>
              <option value="flex.g-2vcpu-1gb">Flex 2vCPU 1GB</option>
              <option value="flex.g-4vcpu-2gb">Flex 4vCPU 2GB</option>
              <option value="pro.g-1vcpu-2gb">Pro 1vCPU 2GB</option>
              <option value="pro.g-2vcpu-4gb">Pro 2vCPU 4GB</option>
            </select>
          </div>
          <div className="flex gap-2">
            <Button size="sm" className="h-8 text-xs" onClick={create} disabled={creating || !name.trim()}>
              {creating ? <RefreshCw className="h-3 w-3 animate-spin mr-1" /> : null} {t("app.create")}
            </Button>
            <Button size="sm" variant="ghost" className="h-8 text-xs" onClick={() => setShowCreate(false)}>{t("app.cancel")}</Button>
          </div>
        </div>
      )}
      <div className="flex-1 overflow-auto">
        {loading && !loaded ? (
          <div className="flex h-32 items-center justify-center"><RefreshCw className="h-4 w-4 animate-spin text-muted-foreground" /></div>
        ) : instances.length === 0 ? (
          <EmptyState icon={Server} title="No instances" description="Add instances to run your application" />
        ) : (
          <div className="divide-y divide-border/30">
            {instances.map((inst) => (
              <div key={inst.id} className="flex items-center gap-3 px-4 py-3 group hover:bg-muted/20">
                <Server className="h-4 w-4 text-muted-foreground shrink-0" />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <p className="text-sm font-medium truncate">{inst.name}</p>
                    <Badge variant="outline" className="text-xs font-normal">{inst.instance_type}</Badge>
                  </div>
                  <div className="flex items-center gap-2 text-xs text-muted-foreground mt-0.5">
                    <span className="font-mono">{inst.size}</span>
                    <span>{inst.scaling_type} scaling</span>
                    {inst.min_replicas !== null && <span>{inst.min_replicas}-{inst.max_replicas} replicas</span>}
                  </div>
                </div>
                <EditButton onClick={() => setEditTarget(inst)} />
                <Button size="icon" variant="ghost" className="h-6 w-6 opacity-0 group-hover:opacity-100 text-muted-foreground hover:text-red-400"
                  onClick={() => setDeleteTarget(inst)} aria-label="Delete">
                  <Trash2 className="h-3 w-3" />
                </Button>
              </div>
            ))}
          </div>
        )}
      </div>
      <ConfirmDialog open={!!deleteTarget} title="Delete Instance" description={`Delete instance "${deleteTarget?.name}"? This will stop all running processes.`} variant="danger" loading={deleting} onConfirm={handleDelete} onCancel={() => setDeleteTarget(null)} />
      <EditDialog
        open={!!editTarget}
        title="Edit Instance"
        fields={[
          { key: "name", label: "Name", type: "text" },
          { key: "size", label: "Size", type: "select", options: [
            { value: "flex.g-1vcpu-512mb", label: "Flex 1vCPU 512MB" },
            { value: "flex.g-2vcpu-1gb", label: "Flex 2vCPU 1GB" },
            { value: "flex.g-4vcpu-2gb", label: "Flex 4vCPU 2GB" },
            { value: "pro.g-1vcpu-2gb", label: "Pro 1vCPU 2GB" },
            { value: "pro.g-2vcpu-4gb", label: "Pro 2vCPU 4GB" },
          ]},
          { key: "scaling_type", label: "Scaling Type", type: "select", options: [
            { value: "none", label: "None" },
            { value: "custom", label: "Custom" },
            { value: "auto", label: "Auto" },
          ]},
          { key: "min_replicas", label: "Min Replicas", type: "number" },
          { key: "max_replicas", label: "Max Replicas", type: "number" },
        ]}
        values={editTarget ? { name: editTarget.name, size: editTarget.size || "", scaling_type: editTarget.scaling_type || "none", min_replicas: editTarget.min_replicas ?? 1, max_replicas: editTarget.max_replicas ?? 1 } : {}}
        onSave={async (values) => { await cloudUpdateInstance(token, editTarget!.id, values); load(true); }}
        onCancel={() => setEditTarget(null)}
      />
    </div>
  );
}
