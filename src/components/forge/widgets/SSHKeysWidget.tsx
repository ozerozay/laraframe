import { useState } from "react";
import { Key, Plus, Trash2, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { t } from "@/lib/i18n";
import { timeAgo } from "@/lib/helpers";
import { cachedFetch, invalidateCache } from "@/lib/cache";
import { EmptyState } from "../shared/EmptyState";
import { ConfirmDialog } from "../shared/ConfirmDialog";
import { forgeListSSHKeys, forgeCreateSSHKey, forgeDeleteSSHKey, type ForgeSSHKey } from "@/lib/tauri";

interface Props { token: string; orgSlug: string; serverId: string; }

export function SSHKeysWidget({ token, orgSlug, serverId }: Props) {
  const [keys, setKeys] = useState<ForgeSSHKey[]>([]);
  const [loaded, setLoaded] = useState(false);
  const [loading, setLoading] = useState(false);
  const [showCreate, setShowCreate] = useState(false);
  const [name, setName] = useState("");
  const [keyValue, setKeyValue] = useState("");
  const [creating, setCreating] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<ForgeSSHKey | null>(null);
  const [deleting, setDeleting] = useState(false);

  const load = async (force = false) => {
    setLoading(true);
    if (force) invalidateCache(`server:${serverId}:sshkeys`);
    try {
      const k = await cachedFetch(`server:${serverId}:sshkeys`, () => forgeListSSHKeys(token, orgSlug, serverId));
      setKeys(k); setLoaded(true);
    } catch { setLoaded(true); }
    setLoading(false);
  };

  if (!loaded && !loading) load();

  const create = async () => {
    if (!name.trim() || !keyValue.trim()) return;
    setCreating(true);
    try {
      await forgeCreateSSHKey(token, orgSlug, serverId, name.trim(), keyValue.trim());
      toast.success(`SSH key "${name.trim()}" added`);
      setName(""); setKeyValue(""); setShowCreate(false); load(true);
    } catch (err) { toast.error(`Failed: ${err}`); }
    setCreating(false);
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      await forgeDeleteSSHKey(token, orgSlug, serverId, deleteTarget.id);
      toast.success(`SSH key "${deleteTarget.name}" deleted`);
      setDeleteTarget(null); load(true);
    } catch (err) { toast.error(`Failed: ${err}`); }
    setDeleting(false);
  };

  return (
    <div className="flex flex-col h-full">
      <div className="flex items-center justify-between border-b border-border/30 px-4 py-2">
        <span className="text-sm text-muted-foreground">SSH Keys ({keys.length})</span>
        <div className="flex gap-1.5">
          <Button size="sm" variant="ghost" className="h-6 gap-1 px-2 text-xs" onClick={() => load(true)}><RefreshCw className="h-3 w-3" /> {t("app.refresh")}</Button>
          <Button size="sm" className="h-6 gap-1 px-2 text-xs" onClick={() => setShowCreate(true)}><Plus className="h-3 w-3" /> Add Key</Button>
        </div>
      </div>
      {showCreate && (
        <div className="border-b border-border/30 px-4 py-3 bg-muted/20 space-y-2">
          <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="Key name (e.g. My Laptop)" className="h-8 text-xs" autoFocus />
          <textarea
            value={keyValue}
            onChange={(e) => setKeyValue(e.target.value)}
            placeholder="ssh-ed25519 AAAAC3... or ssh-rsa AAAAB3..."
            className="w-full h-20 rounded-md border bg-transparent px-3 py-2 text-xs font-mono resize-none focus:outline-none focus:ring-1 focus:ring-ring"
          />
          <div className="flex gap-2">
            <Button size="sm" className="h-8 text-xs" onClick={create} disabled={creating || !name.trim() || !keyValue.trim()}>
              {creating ? <RefreshCw className="h-3 w-3 animate-spin mr-1" /> : null} {t("app.create")}
            </Button>
            <Button size="sm" variant="ghost" className="h-8 text-xs" onClick={() => { setShowCreate(false); setName(""); setKeyValue(""); }}>{t("app.cancel")}</Button>
          </div>
        </div>
      )}
      <div className="flex-1 overflow-auto">
        {loading && !loaded ? (
          <div className="flex h-32 items-center justify-center"><RefreshCw className="h-4 w-4 animate-spin text-muted-foreground" /></div>
        ) : keys.length === 0 ? (
          <EmptyState icon={Key} title="No SSH keys" description="Add SSH keys to grant server access" />
        ) : (
          <div className="divide-y divide-border/30">
            {keys.map((k) => (
              <div key={k.id} className="flex items-center gap-3 px-4 py-3 group hover:bg-muted/20">
                <Key className="h-4 w-4 text-muted-foreground shrink-0" />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium">{k.name}</p>
                  <p className="text-xs text-muted-foreground">{timeAgo(k.created_at)}</p>
                </div>
                <Badge variant="outline" className={`text-xs font-normal ${k.status === "installed" ? "border-emerald-500/30 text-emerald-500" : "border-amber-500/30 text-amber-500"}`}>
                  {k.status}
                </Badge>
                <Button size="icon" variant="ghost" className="h-6 w-6 opacity-0 group-hover:opacity-100 text-muted-foreground hover:text-red-400"
                  onClick={() => setDeleteTarget(k)}>
                  <Trash2 className="h-3 w-3" />
                </Button>
              </div>
            ))}
          </div>
        )}
      </div>
      <ConfirmDialog open={!!deleteTarget} title="Delete SSH Key" description={`Remove SSH key "${deleteTarget?.name}" from this server?`} variant="danger" loading={deleting} onConfirm={handleDelete} onCancel={() => setDeleteTarget(null)} />
    </div>
  );
}
