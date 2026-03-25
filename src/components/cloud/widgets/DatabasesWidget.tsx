import { useState } from "react";
import { Database, Plus, Trash2, RefreshCw, Archive, ArrowLeft, Table, Camera, RotateCcw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { timeAgo } from "@/lib/helpers";
import { t } from "@/lib/i18n";
import { cachedFetch, invalidateCache } from "@/lib/cache";
import { EmptyState } from "@/components/forge/shared/EmptyState";
import { ConfirmDialog } from "@/components/forge/shared/ConfirmDialog";
import {
  cloudListDatabaseClusters, cloudCreateDatabaseCluster, cloudDeleteDatabaseCluster,
  cloudListDatabaseSnapshots, cloudCreateDatabaseSnapshot, cloudDeleteDatabaseSnapshot,
  cloudRestoreDatabase,
  cloudListDatabases, cloudDeleteDatabase,
  cloudListClusterDatabases, cloudCreateClusterDatabase, cloudDeleteClusterDatabase,
  type CloudDatabaseCluster, type CloudDatabase, type CloudDatabaseSnapshot,
} from "@/lib/tauri";

interface Props { token: string; }

type Tab = "clusters" | "standalone";
type ClusterSubTab = "schemas" | "snapshots";

export function CloudDatabasesWidget({ token }: Props) {
  const [clusters, setClusters] = useState<CloudDatabaseCluster[]>([]);
  const [databases, setDatabases] = useState<CloudDatabase[]>([]);
  const [loaded, setLoaded] = useState(false);
  const [loading, setLoading] = useState(false);
  const [tab, setTab] = useState<Tab>("clusters");

  // Cluster detail
  const [selectedCluster, setSelectedCluster] = useState<CloudDatabaseCluster | null>(null);
  const [clusterSubTab, setClusterSubTab] = useState<ClusterSubTab>("schemas");

  // Cluster schemas
  const [schemas, setSchemas] = useState<CloudDatabase[]>([]);
  const [schemasLoading, setSchemasLoading] = useState(false);
  const [showCreateSchema, setShowCreateSchema] = useState(false);
  const [newSchemaName, setNewSchemaName] = useState("");
  const [creatingSchema, setCreatingSchema] = useState(false);

  // Cluster snapshots
  const [snapshots, setSnapshots] = useState<CloudDatabaseSnapshot[]>([]);
  const [snapshotsLoading, setSnapshotsLoading] = useState(false);
  const [creatingSnapshot, setCreatingSnapshot] = useState(false);

  // Create cluster
  const [showCreate, setShowCreate] = useState(false);
  const [newName, setNewName] = useState("");
  const [newType, setNewType] = useState("laravel_mysql_84");
  const [newRegion, setNewRegion] = useState("eu-central-1");
  const [creating, setCreating] = useState(false);

  // Delete/Restore
  const [deleteTarget, setDeleteTarget] = useState<{ type: string; id: string; name: string; clusterId?: string } | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [restoreTarget, setRestoreTarget] = useState<{ clusterId: string; snapshotId: string } | null>(null);
  const [restoring, setRestoring] = useState(false);

  const load = async (force = false) => {
    setLoading(true);
    if (force) { invalidateCache("cloud:db:"); }
    try {
      const [c, d] = await Promise.all([
        cachedFetch("cloud:db:clusters", () => cloudListDatabaseClusters(token)),
        cachedFetch("cloud:db:standalone", () => cloudListDatabases(token)),
      ]);
      setClusters(c); setDatabases(d); setLoaded(true);
    } catch (err) { console.error("Failed to load database clusters:", err); setLoaded(true); }
    setLoading(false);
  };

  if (!loaded && !loading) load();

  const selectCluster = async (cluster: CloudDatabaseCluster) => {
    setSelectedCluster(cluster);
    setClusterSubTab("schemas");
    loadSchemas(cluster);
  };

  const loadSchemas = async (cluster: CloudDatabaseCluster) => {
    setSchemasLoading(true);
    try {
      const s = await cachedFetch(`cloud:db:${cluster.id}:schemas`, () => cloudListClusterDatabases(token, cluster.id));
      setSchemas(s);
    } catch (err) { console.error("Failed to load schemas:", err); toast.error("Failed to load schemas"); }
    setSchemasLoading(false);
  };

  const loadSnapshots = async (cluster: CloudDatabaseCluster) => {
    setSnapshotsLoading(true);
    try {
      const s = await cachedFetch(`cloud:db:${cluster.id}:snapshots`, () => cloudListDatabaseSnapshots(token, cluster.id));
      setSnapshots(s);
    } catch (err) { console.error("Failed to load snapshots:", err); toast.error("Failed to load snapshots"); }
    setSnapshotsLoading(false);
  };

  const createCluster = async () => {
    if (!newName.trim()) return;
    setCreating(true);
    try {
      await cloudCreateDatabaseCluster(token, newName.trim(), newType, newRegion);
      toast.success(`Database cluster "${newName.trim()}" creating`);
      setNewName(""); setShowCreate(false); load(true);
    } catch (err) { toast.error(`Failed: ${err}`); }
    setCreating(false);
  };

  const createSchema = async () => {
    if (!newSchemaName.trim() || !selectedCluster) return;
    setCreatingSchema(true);
    try {
      await cloudCreateClusterDatabase(token, selectedCluster.id, newSchemaName.trim());
      toast.success(`Database "${newSchemaName.trim()}" created`);
      setNewSchemaName(""); setShowCreateSchema(false);
      invalidateCache(`cloud:db:${selectedCluster.id}:schemas`);
      loadSchemas(selectedCluster);
    } catch (err) { toast.error(`Failed: ${err}`); }
    setCreatingSchema(false);
  };

  const createSnapshot = async () => {
    if (!selectedCluster) return;
    setCreatingSnapshot(true);
    try {
      await cloudCreateDatabaseSnapshot(token, selectedCluster.id);
      toast.success("Snapshot creation started");
      invalidateCache(`cloud:db:${selectedCluster.id}:snapshots`);
      loadSnapshots(selectedCluster);
    } catch (err) { toast.error(`Failed: ${err}`); }
    setCreatingSnapshot(false);
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      if (deleteTarget.type === "cluster") {
        await cloudDeleteDatabaseCluster(token, deleteTarget.id);
        setSelectedCluster(null);
        load(true);
      } else if (deleteTarget.type === "database") {
        await cloudDeleteDatabase(token, deleteTarget.id);
        load(true);
      } else if (deleteTarget.type === "snapshot") {
        await cloudDeleteDatabaseSnapshot(token, deleteTarget.id);
        if (selectedCluster) { invalidateCache(`cloud:db:${selectedCluster.id}:snapshots`); loadSnapshots(selectedCluster); }
      } else if (deleteTarget.type === "schema" && deleteTarget.clusterId) {
        await cloudDeleteClusterDatabase(token, deleteTarget.clusterId, deleteTarget.name);
        if (selectedCluster) { invalidateCache(`cloud:db:${selectedCluster.id}:schemas`); loadSchemas(selectedCluster); }
      }
      toast.success(`${deleteTarget.name} deleted`);
      setDeleteTarget(null);
    } catch (err) { toast.error(`Failed: ${err}`); }
    setDeleting(false);
  };

  const handleRestore = async () => {
    if (!restoreTarget) return;
    setRestoring(true);
    try {
      await cloudRestoreDatabase(token, restoreTarget.clusterId, restoreTarget.snapshotId);
      toast.success("Database restore started");
      setRestoreTarget(null);
    } catch (err) { toast.error(`Failed: ${err}`); }
    setRestoring(false);
  };

  if (loading && !loaded) {
    return <div className="flex h-32 items-center justify-center"><RefreshCw className="h-4 w-4 animate-spin text-muted-foreground" /></div>;
  }

  // Cluster detail view
  if (selectedCluster) {
    return (
      <div className="flex flex-col h-full">
        <div className="flex items-center justify-between border-b border-border/30 px-4 py-2">
          <div className="flex items-center gap-2">
            <Button size="sm" variant="ghost" className="h-6 px-1.5" onClick={() => setSelectedCluster(null)}>
              <ArrowLeft className="h-3 w-3" />
            </Button>
            <Database className="h-3.5 w-3.5 text-blue-500" />
            <span className="text-sm font-medium">{selectedCluster.name}</span>
            <div className="flex items-center gap-1 ml-2">
              {(["schemas", "snapshots"] as ClusterSubTab[]).map((st) => (
                <button key={st} onClick={() => { setClusterSubTab(st); if (st === "snapshots") loadSnapshots(selectedCluster); }} className={`rounded-md px-2.5 py-1 text-xs font-medium transition-colors ${clusterSubTab === st ? "bg-muted text-foreground" : "text-muted-foreground hover:text-foreground"}`}>
                  {st === "schemas" ? "Schemas" : "Snapshots"}
                </button>
              ))}
            </div>
          </div>
          <div className="flex gap-1.5">
            {clusterSubTab === "schemas" && (
              <Button size="sm" className="h-6 gap-1 px-2 text-xs" onClick={() => setShowCreateSchema(true)}><Plus className="h-3 w-3" /> Add Schema</Button>
            )}
            {clusterSubTab === "snapshots" && (
              <Button size="sm" className="h-6 gap-1 px-2 text-xs" onClick={createSnapshot} disabled={creatingSnapshot}>
                {creatingSnapshot ? <RefreshCw className="h-3 w-3 animate-spin" /> : <Camera className="h-3 w-3" />} Take Snapshot
              </Button>
            )}
          </div>
        </div>

        {showCreateSchema && (
          <div className="border-b border-border/30 px-4 py-3 bg-muted/20 flex items-center gap-2">
            <Input value={newSchemaName} onChange={(e) => setNewSchemaName(e.target.value)} placeholder="Database name" className="h-8 text-xs flex-1" autoFocus
              onKeyDown={(e) => { if (e.key === "Enter" && newSchemaName.trim()) createSchema(); }} />
            <Button size="sm" className="h-8 text-xs" onClick={createSchema} disabled={creatingSchema || !newSchemaName.trim()}>
              {creatingSchema ? <RefreshCw className="h-3 w-3 animate-spin" /> : t("app.create")}
            </Button>
            <Button size="sm" variant="ghost" className="h-8 text-xs" onClick={() => setShowCreateSchema(false)}>{t("app.cancel")}</Button>
          </div>
        )}

        <div className="flex-1 overflow-auto">
          {clusterSubTab === "schemas" && (
            schemasLoading ? (
              <div className="flex h-32 items-center justify-center"><RefreshCw className="h-4 w-4 animate-spin text-muted-foreground" /></div>
            ) : schemas.length === 0 ? (
              <EmptyState icon={Table} title="No schemas" description="Create a database schema in this cluster" />
            ) : (
              <div className="divide-y divide-border/30">
                {schemas.map((s) => (
                  <div key={s.id} className="flex items-center gap-3 px-4 py-3 group hover:bg-muted/20">
                    <Table className="h-4 w-4 text-blue-400 shrink-0" />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate">{s.name}</p>
                      <div className="flex items-center gap-2 text-xs text-muted-foreground">
                        {s.db_type && <span>{s.db_type}</span>}
                        {s.created_at && <span>{timeAgo(s.created_at)}</span>}
                      </div>
                    </div>
                    {s.status && <Badge variant="outline" className={`text-xs font-normal ${s.status === "available" ? "border-emerald-500/30 text-emerald-500" : "border-amber-500/30 text-amber-500"}`}>{s.status}</Badge>}
                    <Button size="icon" variant="ghost" className="h-6 w-6 opacity-0 group-hover:opacity-100 text-muted-foreground hover:text-red-400"
                      onClick={() => setDeleteTarget({ type: "schema", id: s.id, name: s.name, clusterId: selectedCluster.id })} aria-label="Delete">
                      <Trash2 className="h-3 w-3" />
                    </Button>
                  </div>
                ))}
              </div>
            )
          )}

          {clusterSubTab === "snapshots" && (
            snapshotsLoading ? (
              <div className="flex h-32 items-center justify-center"><RefreshCw className="h-4 w-4 animate-spin text-muted-foreground" /></div>
            ) : snapshots.length === 0 ? (
              <EmptyState icon={Camera} title="No snapshots" description="Take a snapshot to backup this cluster" />
            ) : (
              <div className="divide-y divide-border/30">
                {snapshots.map((s) => (
                  <div key={s.id} className="flex items-center gap-3 px-4 py-3 group hover:bg-muted/20">
                    <Archive className="h-4 w-4 text-amber-500 shrink-0" />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate">{s.name || s.id}</p>
                      <div className="flex items-center gap-2 text-xs text-muted-foreground">
                        {s.snapshot_type && <span>{s.snapshot_type}</span>}
                        {s.storage_bytes !== null && <span>{(s.storage_bytes / 1024 / 1024).toFixed(1)} MB</span>}
                        {s.created_at && <span>{timeAgo(s.created_at)}</span>}
                      </div>
                    </div>
                    {s.status && <Badge variant="outline" className={`text-xs font-normal ${s.status === "available" ? "border-emerald-500/30 text-emerald-500" : "border-amber-500/30 text-amber-500"}`}>{s.status}</Badge>}
                    <Button size="sm" variant="ghost" className="h-6 text-xs opacity-0 group-hover:opacity-100" onClick={() => setRestoreTarget({ clusterId: selectedCluster.id, snapshotId: s.id })}>
                      <RotateCcw className="h-3 w-3 mr-1" /> Restore
                    </Button>
                    <Button size="icon" variant="ghost" className="h-6 w-6 opacity-0 group-hover:opacity-100 text-muted-foreground hover:text-red-400"
                      onClick={() => setDeleteTarget({ type: "snapshot", id: s.id, name: s.name || s.id })} aria-label="Delete">
                      <Trash2 className="h-3 w-3" />
                    </Button>
                  </div>
                ))}
              </div>
            )
          )}
        </div>

        <ConfirmDialog open={!!deleteTarget} title={`Delete ${deleteTarget?.type === "schema" ? "Database Schema" : "Snapshot"}`} description={`Permanently delete "${deleteTarget?.name}"? This action cannot be undone.`} typeToConfirm={deleteTarget?.name} variant="danger" loading={deleting} onConfirm={handleDelete} onCancel={() => setDeleteTarget(null)} />
        <ConfirmDialog open={!!restoreTarget} title="Restore Database" description="This will restore the database from this snapshot. Current data will be overwritten. This action cannot be undone." confirmText="Restore" variant="warning" loading={restoring} onConfirm={handleRestore} onCancel={() => setRestoreTarget(null)} />
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full">
      <div className="flex items-center justify-between border-b border-border/30 px-4 py-2">
        <div className="flex items-center gap-1.5">
          {(["clusters", "standalone"] as Tab[]).map((t) => (
            <button key={t} onClick={() => setTab(t)} className={`rounded-md px-2.5 py-1 text-xs font-medium transition-colors ${tab === t ? "bg-muted text-foreground" : "text-muted-foreground hover:text-foreground"}`}>
              {t === "clusters" ? `Clusters (${clusters.length})` : `Standalone (${databases.length})`}
            </button>
          ))}
        </div>
        <div className="flex gap-1.5">
          <Button size="sm" variant="ghost" className="h-6 gap-1 px-2 text-xs" onClick={() => load(true)}><RefreshCw className="h-3 w-3" /> {t("app.refresh")}</Button>
          <Button size="sm" className="h-6 gap-1 px-2 text-xs" onClick={() => setShowCreate(true)}><Plus className="h-3 w-3" /> {t("app.create")}</Button>
        </div>
      </div>

      {showCreate && (
        <div className="border-b border-border/30 px-4 py-3 bg-muted/20 space-y-2">
          <div className="flex gap-2">
            <Input value={newName} onChange={(e) => setNewName(e.target.value)} placeholder="Database name" className="h-8 text-xs flex-1" autoFocus />
            <select value={newType} onChange={(e) => setNewType(e.target.value)} className="h-8 rounded-md border bg-transparent px-2 text-xs">
              <option value="laravel_mysql_84">Laravel MySQL 8.4</option>
              <option value="laravel_mysql_8">Laravel MySQL 8</option>
              <option value="aws_rds_mysql_8">AWS RDS MySQL 8</option>
              <option value="aws_rds_postgres_18">AWS RDS Postgres 18</option>
              <option value="neon_serverless_postgres_18">Neon Postgres 18</option>
            </select>
            <select value={newRegion} onChange={(e) => setNewRegion(e.target.value)} className="h-8 rounded-md border bg-transparent px-2 text-xs">
              <option value="eu-central-1">EU Central</option>
              <option value="us-east-1">US East 1</option>
              <option value="us-east-2">US East 2</option>
              <option value="ap-southeast-1">AP Southeast</option>
            </select>
          </div>
          <div className="flex gap-2">
            <Button size="sm" className="h-8 text-xs" onClick={createCluster} disabled={creating || !newName.trim()}>
              {creating ? <RefreshCw className="h-3 w-3 animate-spin mr-1" /> : null} {t("app.create")}
            </Button>
            <Button size="sm" variant="ghost" className="h-8 text-xs" onClick={() => setShowCreate(false)}>{t("app.cancel")}</Button>
          </div>
        </div>
      )}

      <div className="flex-1 overflow-auto">
        {tab === "clusters" && (
          clusters.length === 0 ? <EmptyState icon={Database} title="No database clusters" description="Create a managed database cluster" /> : (
            <div className="divide-y divide-border/30">
              {clusters.map((c) => (
                <div key={c.id} className="flex items-center gap-3 px-4 py-3 group hover:bg-muted/20 cursor-pointer" onClick={() => selectCluster(c)}>
                  <Database className="h-4 w-4 text-blue-500 shrink-0" />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">{c.name}</p>
                    <div className="flex items-center gap-2 text-xs text-muted-foreground">
                      <span>{c.cluster_type}</span>
                      <span>{c.region}</span>
                      <span>{timeAgo(c.created_at)}</span>
                    </div>
                  </div>
                  <Badge variant="outline" className={`text-xs font-normal ${c.status === "available" ? "border-emerald-500/30 text-emerald-500" : "border-amber-500/30 text-amber-500"}`}>{c.status}</Badge>
                  <Button size="icon" variant="ghost" className="h-6 w-6 opacity-0 group-hover:opacity-100 text-muted-foreground hover:text-red-400" onClick={(e) => { e.stopPropagation(); setDeleteTarget({ type: "cluster", id: c.id, name: c.name }); }} aria-label="Delete">
                    <Trash2 className="h-3 w-3" />
                  </Button>
                </div>
              ))}
            </div>
          )
        )}

        {tab === "standalone" && (
          databases.length === 0 ? <EmptyState icon={Database} title="No standalone databases" /> : (
            <div className="divide-y divide-border/30">
              {databases.map((d) => (
                <div key={d.id} className="flex items-center gap-3 px-4 py-3 group hover:bg-muted/20">
                  <Database className="h-4 w-4 text-purple-500 shrink-0" />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">{d.name}</p>
                    <div className="flex items-center gap-2 text-xs text-muted-foreground">
                      <span>{d.db_type}</span><span>{d.region}</span>
                    </div>
                  </div>
                  <Badge variant="outline" className={`text-xs font-normal ${d.status === "available" ? "border-emerald-500/30 text-emerald-500" : "border-amber-500/30 text-amber-500"}`}>{d.status}</Badge>
                  <Button size="icon" variant="ghost" className="h-6 w-6 opacity-0 group-hover:opacity-100 text-muted-foreground hover:text-red-400" onClick={() => setDeleteTarget({ type: "database", id: d.id, name: d.name })} aria-label="Delete">
                    <Trash2 className="h-3 w-3" />
                  </Button>
                </div>
              ))}
            </div>
          )
        )}
      </div>

      <ConfirmDialog open={!!deleteTarget} title={`Delete ${deleteTarget?.type === "cluster" ? "Database Cluster" : "Database"}`} description={`Permanently delete "${deleteTarget?.name}"? All data will be lost.`} typeToConfirm={deleteTarget?.name} variant="danger" loading={deleting} onConfirm={handleDelete} onCancel={() => setDeleteTarget(null)} />
      <ConfirmDialog open={!!restoreTarget} title="Restore Database" description="This will restore the database from this snapshot. Current data will be overwritten." confirmText="Restore" variant="warning" loading={restoring} onConfirm={handleRestore} onCancel={() => setRestoreTarget(null)} />
    </div>
  );
}
