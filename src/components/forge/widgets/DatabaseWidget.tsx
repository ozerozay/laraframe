import { useState } from "react";
import {
  Database, UserPlus, Plus, Trash2, RefreshCw, Shield,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { t } from "@/lib/i18n";
import { timeAgo } from "@/lib/helpers";
import { cachedFetch, invalidateCache } from "@/lib/cache";
import { EmptyState } from "../shared/EmptyState";
import { ConfirmDialog } from "../shared/ConfirmDialog";
import {
  forgeListDatabases, forgeCreateDatabase, forgeDeleteDatabase,
  forgeListDatabaseUsers, forgeCreateDatabaseUser, forgeDeleteDatabaseUser,
  type ForgeDatabaseSchema, type ForgeDatabaseUser,
} from "@/lib/tauri";

interface Props {
  token: string;
  orgSlug: string;
  serverId: string;
}

export function DatabaseWidget({ token, orgSlug, serverId }: Props) {
  // Data
  const [databases, setDatabases] = useState<ForgeDatabaseSchema[]>([]);
  const [users, setUsers] = useState<ForgeDatabaseUser[]>([]);
  const [loaded, setLoaded] = useState(false);
  const [loading, setLoading] = useState(false);

  // UI state
  const [activeTab, setActiveTab] = useState<"schemas" | "users">("schemas");
  const [showCreateDb, setShowCreateDb] = useState(false);
  const [showCreateUser, setShowCreateUser] = useState(false);
  const [newDbName, setNewDbName] = useState("");
  const [newUserName, setNewUserName] = useState("");
  const [newUserPass, setNewUserPass] = useState("");
  const [creating, setCreating] = useState(false);

  // Delete confirmation
  const [deleteTarget, setDeleteTarget] = useState<{ type: "db" | "user"; id: string; name: string } | null>(null);
  const [deleting, setDeleting] = useState(false);

  // Load
  const load = async (force = false) => {
    setLoading(true);
    if (force) {
      invalidateCache(`server:${serverId}:databases`);
      invalidateCache(`server:${serverId}:dbusers`);
    }
    try {
      const [dbs, usrs] = await Promise.all([
        cachedFetch(`server:${serverId}:databases`, () => forgeListDatabases(token, orgSlug, serverId)),
        cachedFetch(`server:${serverId}:dbusers`, () => forgeListDatabaseUsers(token, orgSlug, serverId)),
      ]);
      setDatabases(dbs);
      setUsers(usrs);
      setLoaded(true);
    } catch (err) {
      toast.error("Failed to load databases");
    }
    setLoading(false);
  };

  if (!loaded && !loading) load();

  // Create database
  const handleCreateDb = async () => {
    if (!newDbName.trim()) return;
    setCreating(true);
    try {
      await forgeCreateDatabase(token, orgSlug, serverId, newDbName.trim());
      toast.success(`Database "${newDbName.trim()}" created`);
      setNewDbName("");
      setShowCreateDb(false);
      load(true);
    } catch (err) {
      toast.error(`Failed to create database: ${err}`);
    }
    setCreating(false);
  };

  // Create user
  const handleCreateUser = async () => {
    if (!newUserName.trim() || !newUserPass.trim()) return;
    setCreating(true);
    try {
      await forgeCreateDatabaseUser(token, orgSlug, serverId, newUserName.trim(), newUserPass.trim(), []);
      toast.success(`User "${newUserName.trim()}" created`);
      setNewUserName("");
      setNewUserPass("");
      setShowCreateUser(false);
      load(true);
    } catch (err) {
      toast.error(`Failed to create user: ${err}`);
    }
    setCreating(false);
  };

  // Delete
  const handleDelete = async () => {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      if (deleteTarget.type === "db") {
        await forgeDeleteDatabase(token, orgSlug, serverId, deleteTarget.id);
        toast.success(`Database "${deleteTarget.name}" deleted`);
      } else {
        await forgeDeleteDatabaseUser(token, orgSlug, serverId, deleteTarget.id);
        toast.success(`User "${deleteTarget.name}" deleted`);
      }
      setDeleteTarget(null);
      load(true);
    } catch (err) {
      toast.error(`Delete failed: ${err}`);
    }
    setDeleting(false);
  };

  if (loading && !loaded) {
    return (
      <div className="flex h-32 items-center justify-center">
        <RefreshCw className="h-4 w-4 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full">
      {/* Header with tabs */}
      <div className="flex items-center justify-between border-b border-border/30 px-4 py-2">
        <div className="flex items-center gap-1.5">
          <button
            onClick={() => setActiveTab("schemas")}
            className={`rounded-md px-2.5 py-1 text-[11px] font-medium transition-colors ${
              activeTab === "schemas" ? "bg-muted text-foreground" : "text-muted-foreground hover:text-foreground"
            }`}
          >
            {t("forge.databases")} ({databases.length})
          </button>
          <button
            onClick={() => setActiveTab("users")}
            className={`rounded-md px-2.5 py-1 text-[11px] font-medium transition-colors ${
              activeTab === "users" ? "bg-muted text-foreground" : "text-muted-foreground hover:text-foreground"
            }`}
          >
            {t("forge.dbUsers")} ({users.length})
          </button>
        </div>
        <div className="flex items-center gap-1.5">
          <Button size="sm" variant="ghost" className="h-6 gap-1 px-2 text-[10px]" onClick={() => load(true)}>
            <RefreshCw className="h-2.5 w-2.5" /> {t("app.refresh")}
          </Button>
          {activeTab === "schemas" ? (
            <Button
              size="sm"
              className="h-6 gap-1 px-2 text-[10px] bg-emerald-600 hover:bg-emerald-700 text-white"
              onClick={() => setShowCreateDb(true)}
            >
              <Plus className="h-2.5 w-2.5" /> {t("forge.createDatabase")}
            </Button>
          ) : (
            <Button
              size="sm"
              className="h-6 gap-1 px-2 text-[10px] bg-emerald-600 hover:bg-emerald-700 text-white"
              onClick={() => setShowCreateUser(true)}
            >
              <UserPlus className="h-2.5 w-2.5" /> {t("forge.createDbUser")}
            </Button>
          )}
        </div>
      </div>

      {/* Create forms */}
      {showCreateDb && (
        <div className="border-b border-border/30 px-4 py-3 bg-muted/20">
          <div className="flex items-center gap-2">
            <Input
              value={newDbName}
              onChange={(e) => setNewDbName(e.target.value)}
              placeholder={t("forge.dbName")}
              className="h-8 text-xs flex-1 max-w-xs"
              autoFocus
              onKeyDown={(e) => e.key === "Enter" && handleCreateDb()}
            />
            <Button size="sm" className="h-8 text-xs" onClick={handleCreateDb} disabled={creating || !newDbName.trim()}>
              {creating ? <RefreshCw className="h-3 w-3 animate-spin" /> : t("app.create")}
            </Button>
            <Button size="sm" variant="ghost" className="h-8 text-xs" onClick={() => { setShowCreateDb(false); setNewDbName(""); }}>
              {t("app.cancel")}
            </Button>
          </div>
        </div>
      )}

      {showCreateUser && (
        <div className="border-b border-border/30 px-4 py-3 bg-muted/20 space-y-2">
          <div className="flex items-center gap-2">
            <Input
              value={newUserName}
              onChange={(e) => setNewUserName(e.target.value)}
              placeholder={t("forge.dbUsername")}
              className="h-8 text-xs flex-1 max-w-xs"
              autoFocus
            />
            <Input
              type="password"
              value={newUserPass}
              onChange={(e) => setNewUserPass(e.target.value)}
              placeholder={t("forge.dbPassword")}
              className="h-8 text-xs flex-1 max-w-xs"
              onKeyDown={(e) => e.key === "Enter" && handleCreateUser()}
            />
            <Button size="sm" className="h-8 text-xs" onClick={handleCreateUser} disabled={creating || !newUserName.trim() || !newUserPass.trim()}>
              {creating ? <RefreshCw className="h-3 w-3 animate-spin" /> : t("app.create")}
            </Button>
            <Button size="sm" variant="ghost" className="h-8 text-xs" onClick={() => { setShowCreateUser(false); setNewUserName(""); setNewUserPass(""); }}>
              {t("app.cancel")}
            </Button>
          </div>
        </div>
      )}

      {/* Content */}
      <div className="flex-1 overflow-auto">
        {activeTab === "schemas" ? (
          databases.length === 0 ? (
            <EmptyState icon={Database} title={t("forge.noDatabases")} description={t("forge.noDatabasesDesc")} />
          ) : (
            <div className="divide-y divide-border/30">
              {databases.map((db) => (
                <div key={db.id} className="flex items-center gap-3 px-4 py-3 group hover:bg-muted/20 transition-colors">
                  <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-md bg-blue-500/10">
                    <Database className="h-3.5 w-3.5 text-blue-500" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-[13px] font-medium font-mono">{db.name}</p>
                    <p className="text-[10px] text-muted-foreground">{timeAgo(db.created_at)}</p>
                  </div>
                  <Badge
                    variant="outline"
                    className={`text-[9px] font-normal ${
                      db.status === "installed"
                        ? "border-emerald-500/30 text-emerald-500"
                        : "border-amber-500/30 text-amber-500"
                    }`}
                  >
                    {db.status || "unknown"}
                  </Badge>
                  <Button
                    size="icon"
                    variant="ghost"
                    className="h-7 w-7 shrink-0 opacity-0 group-hover:opacity-100 transition-opacity text-muted-foreground hover:text-red-400"
                    onClick={() => setDeleteTarget({ type: "db", id: db.id, name: db.name })}
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </Button>
                </div>
              ))}
            </div>
          )
        ) : (
          users.length === 0 ? (
            <EmptyState icon={Shield} title={t("forge.noDbUsers")} description={t("forge.noDbUsersDesc")} />
          ) : (
            <div className="divide-y divide-border/30">
              {users.map((user) => (
                <div key={user.id} className="flex items-center gap-3 px-4 py-3 group hover:bg-muted/20 transition-colors">
                  <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-md bg-purple-500/10">
                    <Shield className="h-3.5 w-3.5 text-purple-500" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-[13px] font-medium font-mono">{user.name}</p>
                    <p className="text-[10px] text-muted-foreground">{timeAgo(user.created_at)}</p>
                  </div>
                  <Badge
                    variant="outline"
                    className={`text-[9px] font-normal ${
                      user.status === "installed"
                        ? "border-emerald-500/30 text-emerald-500"
                        : "border-amber-500/30 text-amber-500"
                    }`}
                  >
                    {user.status || "unknown"}
                  </Badge>
                  <Button
                    size="icon"
                    variant="ghost"
                    className="h-7 w-7 shrink-0 opacity-0 group-hover:opacity-100 transition-opacity text-muted-foreground hover:text-red-400"
                    onClick={() => setDeleteTarget({ type: "user", id: user.id, name: user.name })}
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </Button>
                </div>
              ))}
            </div>
          )
        )}
      </div>

      {/* Delete confirmation */}
      <ConfirmDialog
        open={!!deleteTarget}
        title={deleteTarget?.type === "db" ? t("forge.deleteDatabase") : t("forge.deleteDbUser")}
        description={deleteTarget?.type === "db" ? t("forge.deleteDatabaseDesc") : t("forge.deleteDbUserDesc")}
        typeToConfirm={deleteTarget?.type === "db" ? deleteTarget.name : undefined}
        variant="danger"
        loading={deleting}
        onConfirm={handleDelete}
        onCancel={() => setDeleteTarget(null)}
      />
    </div>
  );
}
