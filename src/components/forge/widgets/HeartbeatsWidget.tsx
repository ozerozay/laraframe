import { useState } from "react";
import { HeartPulse, Plus, Trash2, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import { t } from "@/lib/i18n";
import { timeAgo } from "@/lib/helpers";
import { cachedFetch, invalidateCache } from "@/lib/cache";
import { EmptyState } from "../shared/EmptyState";
import { ConfirmDialog } from "../shared/ConfirmDialog";
import { forgeListHeartbeats, forgeCreateHeartbeat, forgeDeleteHeartbeat, type ForgeHeartbeat } from "@/lib/tauri";

interface Props { token: string; orgSlug: string; serverId: string; siteId: string; }

export function HeartbeatsWidget({ token, orgSlug, serverId, siteId }: Props) {
  const [heartbeats, setHeartbeats] = useState<ForgeHeartbeat[]>([]);
  const [loaded, setLoaded] = useState(false);
  const [loading, setLoading] = useState(false);
  const [showCreate, setShowCreate] = useState(false);
  const [url, setUrl] = useState("");
  const [creating, setCreating] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<ForgeHeartbeat | null>(null);
  const [deleting, setDeleting] = useState(false);

  const load = async (force = false) => {
    setLoading(true);
    if (force) invalidateCache(`site:${siteId}:heartbeats`);
    try {
      const h = await cachedFetch(`site:${siteId}:heartbeats`, () => forgeListHeartbeats(token, orgSlug, serverId, siteId));
      setHeartbeats(h); setLoaded(true);
    } catch (err) { console.error("Failed to load heartbeats:", err); setLoaded(true); }
    setLoading(false);
  };

  if (!loaded && !loading) load();

  const create = async () => {
    if (!url.trim()) return;
    setCreating(true);
    try {
      await forgeCreateHeartbeat(token, orgSlug, serverId, siteId, url.trim());
      toast.success("Heartbeat created"); setUrl(""); setShowCreate(false); load(true);
    } catch (err) { toast.error(`Failed: ${err}`); }
    setCreating(false);
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      await forgeDeleteHeartbeat(token, orgSlug, serverId, siteId, deleteTarget.id);
      toast.success("Heartbeat deleted"); setDeleteTarget(null); load(true);
    } catch (err) { toast.error(`Failed: ${err}`); }
    setDeleting(false);
  };

  return (
    <div className="flex flex-col h-full">
      <div className="flex items-center justify-between border-b border-border/30 px-4 py-2">
        <span className="text-sm text-muted-foreground">Heartbeats ({heartbeats.length})</span>
        <div className="flex gap-1.5">
          <Button size="sm" variant="ghost" className="h-6 gap-1 px-2 text-xs" onClick={() => load(true)}><RefreshCw className="h-3 w-3" /> {t("app.refresh")}</Button>
          <Button size="sm" className="h-6 gap-1 px-2 text-xs" onClick={() => setShowCreate(true)}><Plus className="h-3 w-3" /> Add</Button>
        </div>
      </div>
      {showCreate && (
        <div className="border-b border-border/30 px-4 py-3 bg-muted/20 flex items-center gap-2">
          <Input value={url} onChange={(e) => setUrl(e.target.value)} placeholder="https://example.com/heartbeat" className="h-8 text-xs font-mono flex-1" autoFocus onKeyDown={(e) => e.key === "Enter" && create()} />
          <Button size="sm" className="h-8 text-xs" onClick={create} disabled={creating}>{creating ? <RefreshCw className="h-3 w-3 animate-spin" /> : t("app.create")}</Button>
          <Button size="sm" variant="ghost" className="h-8 text-xs" onClick={() => setShowCreate(false)}>{t("app.cancel")}</Button>
        </div>
      )}
      <div className="flex-1 overflow-auto">
        {loading && !loaded ? (
          <div className="flex h-32 items-center justify-center"><RefreshCw className="h-4 w-4 animate-spin text-muted-foreground" /></div>
        ) : heartbeats.length === 0 ? (
          <EmptyState icon={HeartPulse} title="No heartbeats" description="Monitor uptime with heartbeat checks" />
        ) : (
          <div className="divide-y divide-border/30">
            {heartbeats.map((hb) => (
              <div key={hb.id} className="flex items-center gap-3 px-4 py-3 group hover:bg-muted/20">
                <HeartPulse className="h-4 w-4 text-muted-foreground shrink-0" />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-mono truncate">{hb.url}</p>
                  <p className="text-xs text-muted-foreground">{timeAgo(hb.created_at)}</p>
                </div>
                <Button size="icon" variant="ghost" className="h-6 w-6 opacity-0 group-hover:opacity-100 text-muted-foreground hover:text-red-400" onClick={() => setDeleteTarget(hb)}>
                  <Trash2 className="h-3 w-3" />
                </Button>
              </div>
            ))}
          </div>
        )}
      </div>
      <ConfirmDialog open={!!deleteTarget} title="Delete Heartbeat" description={`Remove heartbeat "${deleteTarget?.url}"?`} variant="danger" loading={deleting} onConfirm={handleDelete} onCancel={() => setDeleteTarget(null)} />
    </div>
  );
}
