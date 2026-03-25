import { useState } from "react";
import { HardDrive, Plus, Trash2, RefreshCw, Key, ChevronRight, ChevronDown } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { cachedFetch, invalidateCache } from "@/lib/cache";
import { EmptyState } from "@/components/forge/shared/EmptyState";
import { ConfirmDialog } from "@/components/forge/shared/ConfirmDialog";
import { EditDialog, EditButton } from "./EditDialog";
import { cloudListBuckets, cloudCreateBucket, cloudDeleteBucket, cloudUpdateBucket, cloudListBucketKeys, cloudCreateBucketKey, cloudDeleteBucketKey, type CloudBucket, type CloudBucketKey } from "@/lib/tauri";

interface Props { token: string; }

export function CloudStorageWidget({ token }: Props) {
  const [buckets, setBuckets] = useState<CloudBucket[]>([]);
  const [loaded, setLoaded] = useState(false);
  const [loading, setLoading] = useState(false);
  const [showCreate, setShowCreate] = useState(false);
  const [name, setName] = useState("");
  const [visibility, setVisibility] = useState("private");
  const [creating, setCreating] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<{ type: string; id: string; name: string } | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [keys, setKeys] = useState<CloudBucketKey[]>([]);
  const [keysLoading, setKeysLoading] = useState(false);
  const [showCreateKey, setShowCreateKey] = useState(false);
  const [keyName, setKeyName] = useState("");
  const [keyPerm, setKeyPerm] = useState("read_write");
  const [creatingKey, setCreatingKey] = useState(false);
  const [editTarget, setEditTarget] = useState<CloudBucket | null>(null);

  const load = async (force = false) => {
    setLoading(true);
    if (force) invalidateCache("cloud:buckets");
    try { const b = await cachedFetch("cloud:buckets", () => cloudListBuckets(token)); setBuckets(b); setLoaded(true); } catch (err) { console.error("Failed to load buckets:", err); setLoaded(true); }
    setLoading(false);
  };

  if (!loaded && !loading) load();

  const expand = async (id: string) => {
    if (expandedId === id) { setExpandedId(null); return; }
    setExpandedId(id); setKeysLoading(true);
    try { const k = await cachedFetch(`cloud:bucket:${id}:keys`, () => cloudListBucketKeys(token, id)); setKeys(k); } catch (err) { console.error("Failed to load bucket keys:", err); setKeys([]); }
    setKeysLoading(false);
  };

  const create = async () => {
    if (!name.trim()) return;
    setCreating(true);
    try { await cloudCreateBucket(token, name.trim(), visibility); toast.success(`Bucket "${name.trim()}" creating`); setName(""); setShowCreate(false); load(true); } catch (err) { toast.error(`Failed: ${err}`); }
    setCreating(false);
  };

  const createKey = async (bucketId: string) => {
    if (!keyName.trim()) return;
    setCreatingKey(true);
    try { await cloudCreateBucketKey(token, bucketId, keyName.trim(), keyPerm); toast.success("Key created"); setKeyName(""); setShowCreateKey(false); invalidateCache(`cloud:bucket:${bucketId}:keys`); expand(bucketId); } catch (err) { toast.error(`Failed: ${err}`); }
    setCreatingKey(false);
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      if (deleteTarget.type === "bucket") await cloudDeleteBucket(token, deleteTarget.id);
      else await cloudDeleteBucketKey(token, deleteTarget.id);
      toast.success(`${deleteTarget.name} deleted`); setDeleteTarget(null); load(true);
    } catch (err) { toast.error(`Failed: ${err}`); }
    setDeleting(false);
  };

  return (
    <div className="flex flex-col h-full">
      <div className="flex items-center justify-between border-b border-border/30 px-4 py-2">
        <span className="text-sm text-muted-foreground">Object Storage ({buckets.length})</span>
        <div className="flex gap-1.5">
          <Button size="sm" variant="ghost" className="h-6 gap-1 px-2 text-xs" onClick={() => load(true)}><RefreshCw className="h-3 w-3" /> Refresh</Button>
          <Button size="sm" className="h-6 gap-1 px-2 text-xs" onClick={() => setShowCreate(true)}><Plus className="h-3 w-3" /> Create Bucket</Button>
        </div>
      </div>
      {showCreate && (
        <div className="border-b border-border/30 px-4 py-3 bg-muted/20 flex items-center gap-2">
          <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="Bucket name" className="h-8 text-xs flex-1" autoFocus />
          <select value={visibility} onChange={(e) => setVisibility(e.target.value)} className="h-8 rounded-md border bg-transparent px-2 text-xs">
            <option value="private">Private</option><option value="public">Public</option>
          </select>
          <Button size="sm" className="h-8 text-xs" onClick={create} disabled={creating || !name.trim()}>{creating ? <RefreshCw className="h-3 w-3 animate-spin" /> : "Create"}</Button>
          <Button size="sm" variant="ghost" className="h-8 text-xs" onClick={() => setShowCreate(false)}>Cancel</Button>
        </div>
      )}
      <div className="flex-1 overflow-auto">
        {buckets.length === 0 ? <EmptyState icon={HardDrive} title="No buckets" description="Create an R2 object storage bucket" /> : (
          <div className="divide-y divide-border/30">
            {buckets.map((b) => (
              <div key={b.id}>
                <div className="flex items-center gap-3 px-4 py-3 group hover:bg-muted/20 cursor-pointer" onClick={() => expand(b.id)}>
                  {expandedId === b.id ? <ChevronDown className="h-3 w-3 text-muted-foreground" /> : <ChevronRight className="h-3 w-3 text-muted-foreground" />}
                  <HardDrive className="h-4 w-4 text-blue-500 shrink-0" />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">{b.name}</p>
                    <div className="flex items-center gap-2 text-xs text-muted-foreground">
                      <span>{b.visibility}</span>
                      {b.endpoint && <span className="font-mono truncate">{b.endpoint}</span>}
                    </div>
                  </div>
                  <Badge variant="outline" className={`text-xs font-normal ${b.status === "available" ? "border-emerald-500/30 text-emerald-500" : "border-amber-500/30 text-amber-500"}`}>{b.status}</Badge>
                  <EditButton onClick={() => { setEditTarget(b); }} />
                  <Button size="icon" variant="ghost" className="h-6 w-6 opacity-0 group-hover:opacity-100 text-muted-foreground hover:text-red-400" onClick={(e) => { e.stopPropagation(); setDeleteTarget({ type: "bucket", id: b.id, name: b.name }); }}>
                    <Trash2 className="h-3 w-3" />
                  </Button>
                </div>
                {expandedId === b.id && (
                  <div className="border-t border-border/20 bg-muted/5 px-4 py-3">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-xs font-medium text-muted-foreground">Access Keys</span>
                      <Button size="sm" variant="ghost" className="h-6 gap-1 px-2 text-xs" onClick={() => setShowCreateKey(true)}><Plus className="h-3 w-3" /> Add Key</Button>
                    </div>
                    {showCreateKey && (
                      <div className="flex items-center gap-2 mb-2">
                        <Input value={keyName} onChange={(e) => setKeyName(e.target.value)} placeholder="Key name" className="h-7 text-xs flex-1" autoFocus />
                        <select value={keyPerm} onChange={(e) => setKeyPerm(e.target.value)} className="h-7 rounded-md border bg-transparent px-2 text-xs">
                          <option value="read_write">Read/Write</option><option value="read_only">Read Only</option>
                        </select>
                        <Button size="sm" className="h-7 text-xs" onClick={() => createKey(b.id)} disabled={creatingKey || !keyName.trim()}>Create</Button>
                        <Button size="sm" variant="ghost" className="h-7 text-xs" onClick={() => setShowCreateKey(false)}>Cancel</Button>
                      </div>
                    )}
                    {keysLoading ? <RefreshCw className="h-3 w-3 animate-spin text-muted-foreground" /> : keys.length === 0 ? (
                      <p className="text-xs text-muted-foreground/50">No keys</p>
                    ) : (
                      <div className="space-y-1">
                        {keys.map((k) => (
                          <div key={k.id} className="flex items-center gap-2 rounded border border-border/20 px-2 py-1.5 group">
                            <Key className="h-3 w-3 text-muted-foreground" />
                            <span className="text-xs font-medium flex-1">{k.name}</span>
                            <Badge variant="outline" className="text-xs h-4 px-1">{k.permission}</Badge>
                            <Button size="icon" variant="ghost" className="h-5 w-5 opacity-0 group-hover:opacity-100 text-muted-foreground hover:text-red-400" onClick={() => setDeleteTarget({ type: "key", id: k.id, name: k.name })}>
                              <Trash2 className="h-2.5 w-2.5" />
                            </Button>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
      <ConfirmDialog open={!!deleteTarget} title={`Delete ${deleteTarget?.type === "bucket" ? "Bucket" : "Key"}`} description={`Permanently delete "${deleteTarget?.name}"?`} typeToConfirm={deleteTarget?.type === "bucket" ? deleteTarget.name : undefined} variant="danger" loading={deleting} onConfirm={handleDelete} onCancel={() => setDeleteTarget(null)} />
      <EditDialog
        open={!!editTarget}
        title="Edit Bucket"
        fields={[
          { key: "name", label: "Name", type: "text" },
          { key: "visibility", label: "Visibility", type: "select", options: [
            { value: "private", label: "Private" },
            { value: "public", label: "Public" },
          ]},
        ]}
        values={editTarget ? { name: editTarget.name, visibility: editTarget.visibility || "private" } : {}}
        onSave={async (values) => { await cloudUpdateBucket(token, editTarget!.id, values); load(true); }}
        onCancel={() => setEditTarget(null)}
      />
    </div>
  );
}
