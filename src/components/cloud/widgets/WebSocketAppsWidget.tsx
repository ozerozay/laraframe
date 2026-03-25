import { useState } from "react";
import { Wifi, Plus, Trash2, RefreshCw, Eye, EyeOff } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import { timeAgo } from "@/lib/helpers";
import { cachedFetch, invalidateCache } from "@/lib/cache";
import { EmptyState } from "@/components/forge/shared/EmptyState";
import { ConfirmDialog } from "@/components/forge/shared/ConfirmDialog";
import { cloudListWebsocketApplications, cloudCreateWebsocketApplication, cloudDeleteWebsocketApplication, type CloudWebsocketApplication } from "@/lib/tauri";

interface Props { token: string; serverId: string; }

export function WebSocketAppsWidget({ token, serverId }: Props) {
  const [apps, setApps] = useState<CloudWebsocketApplication[]>([]);
  const [loaded, setLoaded] = useState(false);
  const [loading, setLoading] = useState(false);
  const [showCreate, setShowCreate] = useState(false);
  const [name, setName] = useState("");
  const [creating, setCreating] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<CloudWebsocketApplication | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [visibleSecrets, setVisibleSecrets] = useState<Set<string>>(new Set());

  const load = async (force = false) => {
    setLoading(true);
    if (force) invalidateCache(`cloud:ws:${serverId}:apps`);
    try {
      const a = await cachedFetch(`cloud:ws:${serverId}:apps`, () => cloudListWebsocketApplications(token, serverId));
      setApps(a); setLoaded(true);
    } catch (err) { console.error("Failed to load WebSocket apps:", err); setLoaded(true); }
    setLoading(false);
  };

  if (!loaded && !loading) load();

  const create = async () => {
    if (!name.trim()) return;
    setCreating(true);
    try {
      await cloudCreateWebsocketApplication(token, serverId, name.trim());
      toast.success(`WebSocket app "${name.trim()}" created`);
      setName(""); setShowCreate(false); load(true);
    } catch (err) { toast.error(`Failed: ${err}`); }
    setCreating(false);
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      await cloudDeleteWebsocketApplication(token, deleteTarget.id);
      toast.success("WebSocket application deleted");
      setDeleteTarget(null); load(true);
    } catch (err) { toast.error(`Failed: ${err}`); }
    setDeleting(false);
  };

  const toggleSecret = (id: string) => {
    setVisibleSecrets((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id); else next.add(id);
      return next;
    });
  };

  const mask = (value: string) => value.slice(0, 4) + "..." + value.slice(-4);

  return (
    <div className="flex flex-col h-full">
      <div className="flex items-center justify-between border-b border-border/30 px-4 py-2">
        <span className="text-sm text-muted-foreground">WebSocket Applications ({apps.length})</span>
        <div className="flex gap-1.5">
          <Button size="sm" variant="ghost" className="h-6 gap-1 px-2 text-xs" onClick={() => load(true)}><RefreshCw className="h-3 w-3" /> Refresh</Button>
          <Button size="sm" className="h-6 gap-1 px-2 text-xs" onClick={() => setShowCreate(true)}><Plus className="h-3 w-3" /> Add</Button>
        </div>
      </div>
      {showCreate && (
        <div className="border-b border-border/30 px-4 py-3 bg-muted/20 flex items-center gap-2">
          <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="Application name" className="h-8 text-xs flex-1" autoFocus
            onKeyDown={(e) => { if (e.key === "Enter" && name.trim()) create(); }} />
          <Button size="sm" className="h-8 text-xs" onClick={create} disabled={creating || !name.trim()}>
            {creating ? <RefreshCw className="h-3 w-3 animate-spin" /> : "Create"}
          </Button>
          <Button size="sm" variant="ghost" className="h-8 text-xs" onClick={() => setShowCreate(false)}>Cancel</Button>
        </div>
      )}
      <div className="flex-1 overflow-auto">
        {loading && !loaded ? (
          <div className="flex h-32 items-center justify-center"><RefreshCw className="h-4 w-4 animate-spin text-muted-foreground" /></div>
        ) : apps.length === 0 ? (
          <EmptyState icon={Wifi} title="No WebSocket applications" description="Create a WebSocket application for this server" />
        ) : (
          <div className="divide-y divide-border/30">
            {apps.map((app) => {
              const showSecret = visibleSecrets.has(app.id);
              return (
                <div key={app.id} className="px-4 py-3 group hover:bg-muted/20">
                  <div className="flex items-center gap-3">
                    <Wifi className="h-4 w-4 text-purple-500 shrink-0" />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate">{app.name}</p>
                      <span className="text-xs text-muted-foreground">{timeAgo(app.created_at)}</span>
                    </div>
                    <button className="text-muted-foreground hover:text-foreground transition-colors" onClick={() => toggleSecret(app.id)}>
                      {showSecret ? <EyeOff className="h-3.5 w-3.5" /> : <Eye className="h-3.5 w-3.5" />}
                    </button>
                    <Button size="icon" variant="ghost" className="h-6 w-6 opacity-0 group-hover:opacity-100 text-muted-foreground hover:text-red-400"
                      onClick={() => setDeleteTarget(app)}>
                      <Trash2 className="h-3 w-3" />
                    </Button>
                  </div>
                  <div className="mt-2 ml-7 grid grid-cols-3 gap-2 text-xs">
                    <div>
                      <span className="text-muted-foreground/60">App ID</span>
                      <p className="font-mono truncate">{app.app_id}</p>
                    </div>
                    <div>
                      <span className="text-muted-foreground/60">Key</span>
                      <p className="font-mono truncate">{showSecret ? app.key : mask(app.key)}</p>
                    </div>
                    <div>
                      <span className="text-muted-foreground/60">Secret</span>
                      <p className="font-mono truncate">{showSecret ? app.secret : mask(app.secret)}</p>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
      <ConfirmDialog open={!!deleteTarget} title="Delete WebSocket Application" description={`Permanently delete "${deleteTarget?.name}"? All connected clients using this app will be disconnected.`} typeToConfirm={deleteTarget?.name} variant="danger" loading={deleting} onConfirm={handleDelete} onCancel={() => setDeleteTarget(null)} />
    </div>
  );
}
