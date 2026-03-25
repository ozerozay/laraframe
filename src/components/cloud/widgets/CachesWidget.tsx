import { useState } from "react";
import { Zap, Plus, Trash2, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { t } from "@/lib/i18n";
import { cachedFetch, invalidateCache } from "@/lib/cache";
import { EmptyState } from "@/components/forge/shared/EmptyState";
import { ConfirmDialog } from "@/components/forge/shared/ConfirmDialog";
import { EditDialog, EditButton } from "./EditDialog";
import { cloudListCaches, cloudCreateCache, cloudDeleteCache, cloudUpdateCache, type CloudCache } from "@/lib/tauri";

interface Props { token: string; }

export function CloudCachesWidget({ token }: Props) {
  const [caches, setCaches] = useState<CloudCache[]>([]);
  const [loaded, setLoaded] = useState(false);
  const [loading, setLoading] = useState(false);
  const [showCreate, setShowCreate] = useState(false);
  const [name, setName] = useState("");
  const [cacheType, setCacheType] = useState("laravel_valkey");
  const [region] = useState("eu-central-1");
  const [size, setSize] = useState("250mb");
  const [creating, setCreating] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<CloudCache | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [editTarget, setEditTarget] = useState<CloudCache | null>(null);

  const load = async (force = false) => {
    setLoading(true);
    if (force) invalidateCache("cloud:caches");
    try { const c = await cachedFetch("cloud:caches", () => cloudListCaches(token)); setCaches(c); setLoaded(true); } catch (err) { console.error("Failed to load caches:", err); setLoaded(true); }
    setLoading(false);
  };

  if (!loaded && !loading) load();

  const create = async () => {
    if (!name.trim()) return;
    setCreating(true);
    try { await cloudCreateCache(token, name.trim(), cacheType, region, size); toast.success(`Cache "${name.trim()}" creating`); setName(""); setShowCreate(false); load(true); } catch (err) { toast.error(`Failed: ${err}`); }
    setCreating(false);
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    setDeleting(true);
    try { await cloudDeleteCache(token, deleteTarget.id); toast.success(`Cache "${deleteTarget.name}" deleted`); setDeleteTarget(null); load(true); } catch (err) { toast.error(`Failed: ${err}`); }
    setDeleting(false);
  };

  return (
    <div className="flex flex-col h-full">
      <div className="flex items-center justify-between border-b border-border/30 px-4 py-2">
        <span className="text-sm text-muted-foreground">Caches ({caches.length})</span>
        <div className="flex gap-1.5">
          <Button size="sm" variant="ghost" className="h-6 gap-1 px-2 text-xs" onClick={() => load(true)}><RefreshCw className="h-3 w-3" /> {t("app.refresh")}</Button>
          <Button size="sm" className="h-6 gap-1 px-2 text-xs" onClick={() => setShowCreate(true)}><Plus className="h-3 w-3" /> {t("app.create")}</Button>
        </div>
      </div>
      {showCreate && (
        <div className="border-b border-border/30 px-4 py-3 bg-muted/20 flex items-center gap-2">
          <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="Cache name" className="h-8 text-xs flex-1" autoFocus />
          <select value={cacheType} onChange={(e) => setCacheType(e.target.value)} className="h-8 rounded-md border bg-transparent px-2 text-xs">
            <option value="laravel_valkey">Laravel Valkey</option>
            <option value="upstash_redis">Upstash Redis</option>
          </select>
          <select value={size} onChange={(e) => setSize(e.target.value)} className="h-8 rounded-md border bg-transparent px-2 text-xs">
            <option value="250mb">250MB</option><option value="1gb">1GB</option><option value="2.5gb">2.5GB</option><option value="5gb">5GB</option>
          </select>
          <Button size="sm" className="h-8 text-xs" onClick={create} disabled={creating || !name.trim()}>{creating ? <RefreshCw className="h-3 w-3 animate-spin" /> : t("app.create")}</Button>
          <Button size="sm" variant="ghost" className="h-8 text-xs" onClick={() => setShowCreate(false)}>{t("app.cancel")}</Button>
        </div>
      )}
      <div className="flex-1 overflow-auto">
        {caches.length === 0 ? <EmptyState icon={Zap} title="No caches" description="Create a Redis/Valkey cache" /> : (
          <div className="divide-y divide-border/30">
            {caches.map((c) => (
              <div key={c.id} className="flex items-center gap-3 px-4 py-3 group hover:bg-muted/20">
                <Zap className="h-4 w-4 text-amber-500 shrink-0" />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate">{c.name}</p>
                  <div className="flex items-center gap-2 text-xs text-muted-foreground"><span>{c.cache_type}</span><span>{c.region}</span><span>{c.size}</span></div>
                </div>
                <Badge variant="outline" className={`text-xs font-normal ${c.status === "available" ? "border-emerald-500/30 text-emerald-500" : "border-amber-500/30 text-amber-500"}`}>{c.status}</Badge>
                <EditButton onClick={() => setEditTarget(c)} />
                <Button size="icon" variant="ghost" className="h-6 w-6 opacity-0 group-hover:opacity-100 text-muted-foreground hover:text-red-400" onClick={() => setDeleteTarget(c)} aria-label="Delete"><Trash2 className="h-3 w-3" /></Button>
              </div>
            ))}
          </div>
        )}
      </div>
      <ConfirmDialog open={!!deleteTarget} title="Delete Cache" description={`Permanently delete cache "${deleteTarget?.name}"? All cached data will be lost.`} typeToConfirm={deleteTarget?.name} variant="danger" loading={deleting} onConfirm={handleDelete} onCancel={() => setDeleteTarget(null)} />
      <EditDialog
        open={!!editTarget}
        title="Edit Cache"
        fields={[
          { key: "name", label: "Name", type: "text" },
          { key: "size", label: "Size", type: "select", options: [
            { value: "250mb", label: "250MB" },
            { value: "1gb", label: "1GB" },
            { value: "2.5gb", label: "2.5GB" },
            { value: "5gb", label: "5GB" },
          ]},
        ]}
        values={editTarget ? { name: editTarget.name, size: editTarget.size || "" } : {}}
        onSave={async (values) => { await cloudUpdateCache(token, editTarget!.id, values); load(true); }}
        onCancel={() => setEditTarget(null)}
      />
    </div>
  );
}
