import { useState } from "react";
import { Radio, Plus, Trash2, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { cachedFetch, invalidateCache } from "@/lib/cache";
import { EmptyState } from "@/components/forge/shared/EmptyState";
import { ConfirmDialog } from "@/components/forge/shared/ConfirmDialog";
import { EditDialog, EditButton } from "./EditDialog";
import { cloudListWebsocketServers, cloudCreateWebsocketServer, cloudDeleteWebsocketServer, cloudUpdateWebsocketServer, type CloudWebsocketServer } from "@/lib/tauri";

interface Props { token: string; }

export function CloudWebSocketsWidget({ token }: Props) {
  const [servers, setServers] = useState<CloudWebsocketServer[]>([]);
  const [loaded, setLoaded] = useState(false);
  const [loading, setLoading] = useState(false);
  const [showCreate, setShowCreate] = useState(false);
  const [name, setName] = useState("");
  const [region, setRegion] = useState("eu-central-1");
  const [maxConn, setMaxConn] = useState("100");
  const [creating, setCreating] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<CloudWebsocketServer | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [editTarget, setEditTarget] = useState<CloudWebsocketServer | null>(null);

  const load = async (force = false) => {
    setLoading(true);
    if (force) invalidateCache("cloud:ws");
    try { const s = await cachedFetch("cloud:ws", () => cloudListWebsocketServers(token)); setServers(s); setLoaded(true); } catch { setLoaded(true); }
    setLoading(false);
  };

  if (!loaded && !loading) load();

  const create = async () => {
    if (!name.trim()) return;
    setCreating(true);
    try { await cloudCreateWebsocketServer(token, name.trim(), region, parseInt(maxConn)); toast.success(`WebSocket server "${name.trim()}" creating`); setName(""); setShowCreate(false); load(true); } catch (err) { toast.error(`Failed: ${err}`); }
    setCreating(false);
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    setDeleting(true);
    try { await cloudDeleteWebsocketServer(token, deleteTarget.id); toast.success(`WebSocket server deleted`); setDeleteTarget(null); load(true); } catch (err) { toast.error(`Failed: ${err}`); }
    setDeleting(false);
  };

  return (
    <div className="flex flex-col h-full">
      <div className="flex items-center justify-between border-b border-border/30 px-4 py-2">
        <span className="text-sm text-muted-foreground">WebSocket Servers ({servers.length})</span>
        <div className="flex gap-1.5">
          <Button size="sm" variant="ghost" className="h-6 gap-1 px-2 text-xs" onClick={() => load(true)}><RefreshCw className="h-3 w-3" /> Refresh</Button>
          <Button size="sm" className="h-6 gap-1 px-2 text-xs" onClick={() => setShowCreate(true)}><Plus className="h-3 w-3" /> Create</Button>
        </div>
      </div>
      {showCreate && (
        <div className="border-b border-border/30 px-4 py-3 bg-muted/20 flex items-center gap-2">
          <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="Server name" className="h-8 text-xs flex-1" autoFocus />
          <select value={region} onChange={(e) => setRegion(e.target.value)} className="h-8 rounded-md border bg-transparent px-2 text-xs">
            <option value="eu-central-1">EU Central</option><option value="us-east-1">US East</option>
          </select>
          <select value={maxConn} onChange={(e) => setMaxConn(e.target.value)} className="h-8 rounded-md border bg-transparent px-2 text-xs">
            <option value="100">100</option><option value="200">200</option><option value="500">500</option><option value="2000">2000</option><option value="5000">5000</option>
          </select>
          <Button size="sm" className="h-8 text-xs" onClick={create} disabled={creating || !name.trim()}>{creating ? <RefreshCw className="h-3 w-3 animate-spin" /> : "Create"}</Button>
          <Button size="sm" variant="ghost" className="h-8 text-xs" onClick={() => setShowCreate(false)}>Cancel</Button>
        </div>
      )}
      <div className="flex-1 overflow-auto">
        {servers.length === 0 ? <EmptyState icon={Radio} title="No WebSocket servers" description="Create a Reverb WebSocket cluster" /> : (
          <div className="divide-y divide-border/30">
            {servers.map((s) => (
              <div key={s.id} className="flex items-center gap-3 px-4 py-3 group hover:bg-muted/20">
                <Radio className="h-4 w-4 text-purple-500 shrink-0" />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate">{s.name}</p>
                  <div className="flex items-center gap-2 text-xs text-muted-foreground">
                    <span>{s.region}</span><span>{s.max_connections} max conn</span>
                    {s.hostname && <span className="font-mono truncate">{s.hostname}</span>}
                  </div>
                </div>
                <Badge variant="outline" className={`text-xs font-normal ${s.status === "available" ? "border-emerald-500/30 text-emerald-500" : "border-amber-500/30 text-amber-500"}`}>{s.status}</Badge>
                <EditButton onClick={() => setEditTarget(s)} />
                <Button size="icon" variant="ghost" className="h-6 w-6 opacity-0 group-hover:opacity-100 text-muted-foreground hover:text-red-400" onClick={() => setDeleteTarget(s)}><Trash2 className="h-3 w-3" /></Button>
              </div>
            ))}
          </div>
        )}
      </div>
      <ConfirmDialog open={!!deleteTarget} title="Delete WebSocket Server" description={`Permanently delete "${deleteTarget?.name}"? All connected clients will be disconnected.`} typeToConfirm={deleteTarget?.name} variant="danger" loading={deleting} onConfirm={handleDelete} onCancel={() => setDeleteTarget(null)} />
      <EditDialog
        open={!!editTarget}
        title="Edit WebSocket Server"
        fields={[
          { key: "name", label: "Name", type: "text" },
          { key: "max_connections", label: "Max Connections", type: "select", options: [
            { value: "100", label: "100" },
            { value: "200", label: "200" },
            { value: "500", label: "500" },
            { value: "2000", label: "2,000" },
            { value: "5000", label: "5,000" },
            { value: "10000", label: "10,000" },
          ]},
        ]}
        values={editTarget ? { name: editTarget.name, max_connections: String(editTarget.max_connections) } : {}}
        onSave={async (values) => { await cloudUpdateWebsocketServer(token, editTarget!.id, values); load(true); }}
        onCancel={() => setEditTarget(null)}
      />
    </div>
  );
}
