import { useState } from "react";
import {
  Database, UserPlus, Plus, Trash2, RefreshCw, Shield,
  Archive, RotateCcw, RefreshCcw, Pencil, Save, X, KeyRound,
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
  forgeUpdateDatabaseUser, forgeUpdateDatabasePassword,
  forgeSyncDatabases,
  forgeListBackupConfigs, forgeListBackups, forgeCreateBackup,
  forgeDeleteBackup, forgeRestoreBackup,
  type ForgeDatabaseSchema, type ForgeDatabaseUser,
  type ForgeBackupConfig, type ForgeBackupInstance,
} from "@/lib/tauri";

interface Props {
  token: string;
  orgSlug: string;
  serverId: string;
}

type Tab = "schemas" | "users" | "backups";

export function DatabaseWidget({ token, orgSlug, serverId }: Props) {
  const [databases, setDatabases] = useState<ForgeDatabaseSchema[]>([]);
  const [users, setUsers] = useState<ForgeDatabaseUser[]>([]);
  const [backupConfigs, setBackupConfigs] = useState<ForgeBackupConfig[]>([]);
  const [loaded, setLoaded] = useState(false);
  const [loading, setLoading] = useState(false);

  const [activeTab, setActiveTab] = useState<Tab>("schemas");

  // Create forms
  const [showCreateDb, setShowCreateDb] = useState(false);
  const [showCreateUser, setShowCreateUser] = useState(false);
  const [newDbName, setNewDbName] = useState("");
  const [newUserName, setNewUserName] = useState("");
  const [newUserPass, setNewUserPass] = useState("");
  const [creating, setCreating] = useState(false);

  // Backup state
  const [selectedBackupConfig, setSelectedBackupConfig] = useState<ForgeBackupConfig | null>(null);
  const [backupInstances, setBackupInstances] = useState<ForgeBackupInstance[]>([]);
  const [backupsLoading, setBackupsLoading] = useState(false);

  // Edit user databases
  const [editUserTarget, setEditUserTarget] = useState<ForgeDatabaseUser | null>(null);
  const [selectedDatabases, setSelectedDatabases] = useState<string[]>([]);
  const [editUserSaving, setEditUserSaving] = useState(false);

  // Change password
  const [showChangePassword, setShowChangePassword] = useState(false);
  const [newPassword, setNewPassword] = useState("");
  const [changingPassword, setChangingPassword] = useState(false);

  // Confirm dialog
  const [deleteTarget, setDeleteTarget] = useState<{
    type: "db" | "user" | "backup";
    id: string;
    name: string;
    configId?: string;
  } | null>(null);
  const [restoreTarget, setRestoreTarget] = useState<{
    configId: string;
    backupId: string;
    name: string;
  } | null>(null);
  const [actionLoading, setActionLoading] = useState(false);

  // Load
  const load = async (force = false) => {
    setLoading(true);
    if (force) {
      invalidateCache(`server:${serverId}:databases`);
      invalidateCache(`server:${serverId}:dbusers`);
      invalidateCache(`server:${serverId}:backupconfigs`);
    }
    try {
      const [dbs, usrs, bkps] = await Promise.all([
        cachedFetch(`server:${serverId}:databases`, () => forgeListDatabases(token, orgSlug, serverId)),
        cachedFetch(`server:${serverId}:dbusers`, () => forgeListDatabaseUsers(token, orgSlug, serverId)),
        cachedFetch(`server:${serverId}:backupconfigs`, () => forgeListBackupConfigs(token, orgSlug, serverId)),
      ]);
      setDatabases(dbs);
      setUsers(usrs);
      setBackupConfigs(bkps);
      setLoaded(true);
    } catch {
      toast.error("Failed to load databases");
      setLoaded(true);
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
      toast.error(`Failed: ${err}`);
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
      toast.error(`Failed: ${err}`);
    }
    setCreating(false);
  };

  // Sync databases
  const handleSync = async () => {
    try {
      await forgeSyncDatabases(token, orgSlug, serverId);
      toast.success("Database sync started");
      load(true);
    } catch (err) {
      toast.error(`Sync failed: ${err}`);
    }
  };

  // Update user databases
  const handleUpdateUserDatabases = async () => {
    if (!editUserTarget) return;
    setEditUserSaving(true);
    try {
      await forgeUpdateDatabaseUser(token, orgSlug, serverId, editUserTarget.id, selectedDatabases);
      toast.success(`User "${editUserTarget.name}" updated`);
      setEditUserTarget(null);
      load(true);
    } catch (err) {
      toast.error(`Failed: ${err}`);
    }
    setEditUserSaving(false);
  };

  // Change database password
  const handleChangePassword = async () => {
    if (!newPassword.trim()) return;
    setChangingPassword(true);
    try {
      await forgeUpdateDatabasePassword(token, orgSlug, serverId, newPassword.trim());
      toast.success("Database password changed");
      setNewPassword("");
      setShowChangePassword(false);
    } catch (err) {
      toast.error(`Failed: ${err}`);
    }
    setChangingPassword(false);
  };

  // Load backup instances
  const loadBackupInstances = async (config: ForgeBackupConfig) => {
    setSelectedBackupConfig(config);
    setBackupsLoading(true);
    try {
      const instances = await cachedFetch(
        `server:${serverId}:backups:${config.id}`,
        () => forgeListBackups(token, orgSlug, serverId, config.id),
        120_000
      );
      setBackupInstances(instances);
    } catch {
      toast.error("Failed to load backups");
    }
    setBackupsLoading(false);
  };

  // Create backup
  const handleCreateBackup = async (configId: string) => {
    try {
      await forgeCreateBackup(token, orgSlug, serverId, configId);
      toast.success("Backup started");
      invalidateCache(`server:${serverId}:backups:${configId}`);
      if (selectedBackupConfig?.id === configId) {
        loadBackupInstances(selectedBackupConfig);
      }
    } catch (err) {
      toast.error(`Backup failed: ${err}`);
    }
  };

  // Delete
  const handleDelete = async () => {
    if (!deleteTarget) return;
    setActionLoading(true);
    try {
      if (deleteTarget.type === "db") {
        await forgeDeleteDatabase(token, orgSlug, serverId, deleteTarget.id);
        toast.success(`Database "${deleteTarget.name}" deleted`);
      } else if (deleteTarget.type === "user") {
        await forgeDeleteDatabaseUser(token, orgSlug, serverId, deleteTarget.id);
        toast.success(`User "${deleteTarget.name}" deleted`);
      } else if (deleteTarget.type === "backup" && deleteTarget.configId) {
        await forgeDeleteBackup(token, orgSlug, serverId, deleteTarget.configId, deleteTarget.id);
        toast.success("Backup deleted");
        invalidateCache(`server:${serverId}:backups:${deleteTarget.configId}`);
        if (selectedBackupConfig?.id === deleteTarget.configId) {
          loadBackupInstances(selectedBackupConfig);
        }
      }
      setDeleteTarget(null);
      load(true);
    } catch (err) {
      toast.error(`Delete failed: ${err}`);
    }
    setActionLoading(false);
  };

  // Restore
  const handleRestore = async () => {
    if (!restoreTarget) return;
    setActionLoading(true);
    try {
      await forgeRestoreBackup(token, orgSlug, serverId, restoreTarget.configId, restoreTarget.backupId);
      toast.success("Restore started");
      setRestoreTarget(null);
    } catch (err) {
      toast.error(`Restore failed: ${err}`);
    }
    setActionLoading(false);
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
      {/* Header */}
      <div className="flex items-center justify-between border-b border-border/30 px-4 py-2">
        <div className="flex items-center gap-1.5">
          {(["schemas", "users", "backups"] as Tab[]).map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`rounded-md px-2.5 py-1 text-sm font-medium transition-colors ${
                activeTab === tab ? "bg-muted text-foreground" : "text-muted-foreground hover:text-foreground"
              }`}
            >
              {tab === "schemas" ? `${t("forge.databases")} (${databases.length})`
                : tab === "users" ? `${t("forge.dbUsers")} (${users.length})`
                : `Backups (${backupConfigs.length})`}
            </button>
          ))}
        </div>
        <div className="flex items-center gap-1.5">
          {activeTab === "schemas" && (
            <Button size="sm" variant="ghost" className="h-6 gap-1 px-2 text-xs" onClick={handleSync}>
              <RefreshCcw className="h-2.5 w-2.5" /> Sync
            </Button>
          )}
          <Button size="sm" variant="ghost" className="h-6 gap-1 px-2 text-xs" onClick={() => load(true)}>
            <RefreshCw className="h-2.5 w-2.5" /> {t("app.refresh")}
          </Button>
          {activeTab === "schemas" && (
            <Button size="sm" className="h-6 gap-1 px-2 text-xs bg-emerald-600 hover:bg-emerald-700 text-white" onClick={() => setShowCreateDb(true)}>
              <Plus className="h-2.5 w-2.5" /> {t("forge.createDatabase")}
            </Button>
          )}
          {activeTab === "users" && (
            <>
              <Button size="sm" variant="ghost" className="h-6 gap-1 px-2 text-xs" onClick={() => setShowChangePassword(true)}>
                <KeyRound className="h-2.5 w-2.5" /> Password
              </Button>
              <Button size="sm" className="h-6 gap-1 px-2 text-xs bg-emerald-600 hover:bg-emerald-700 text-white" onClick={() => setShowCreateUser(true)}>
                <UserPlus className="h-2.5 w-2.5" /> {t("forge.createDbUser")}
              </Button>
            </>
          )}
        </div>
      </div>

      {/* Create forms */}
      {showCreateDb && (
        <div className="border-b border-border/30 px-4 py-3 bg-muted/20">
          <div className="flex items-center gap-2">
            <Input value={newDbName} onChange={(e) => setNewDbName(e.target.value)} placeholder={t("forge.dbName")} className="h-8 text-xs flex-1 max-w-xs" autoFocus onKeyDown={(e) => e.key === "Enter" && handleCreateDb()} />
            <Button size="sm" className="h-8 text-xs" onClick={handleCreateDb} disabled={creating || !newDbName.trim()}>
              {creating ? <RefreshCw className="h-3 w-3 animate-spin" /> : t("app.create")}
            </Button>
            <Button size="sm" variant="ghost" className="h-8 text-xs" onClick={() => { setShowCreateDb(false); setNewDbName(""); }}>{t("app.cancel")}</Button>
          </div>
        </div>
      )}
      {showCreateUser && (
        <div className="border-b border-border/30 px-4 py-3 bg-muted/20">
          <div className="flex items-center gap-2">
            <Input value={newUserName} onChange={(e) => setNewUserName(e.target.value)} placeholder={t("forge.dbUsername")} className="h-8 text-xs flex-1 max-w-xs" autoFocus />
            <Input type="password" value={newUserPass} onChange={(e) => setNewUserPass(e.target.value)} placeholder={t("forge.dbPassword")} className="h-8 text-xs flex-1 max-w-xs" onKeyDown={(e) => e.key === "Enter" && handleCreateUser()} />
            <Button size="sm" className="h-8 text-xs" onClick={handleCreateUser} disabled={creating || !newUserName.trim() || !newUserPass.trim()}>
              {creating ? <RefreshCw className="h-3 w-3 animate-spin" /> : t("app.create")}
            </Button>
            <Button size="sm" variant="ghost" className="h-8 text-xs" onClick={() => { setShowCreateUser(false); setNewUserName(""); setNewUserPass(""); }}>{t("app.cancel")}</Button>
          </div>
        </div>
      )}

      {/* Content */}
      <div className="flex-1 overflow-auto">
        {/* Databases tab */}
        {activeTab === "schemas" && (
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
                    <p className="text-sm font-medium font-mono">{db.name}</p>
                    <p className="text-xs text-muted-foreground">{timeAgo(db.created_at)}</p>
                  </div>
                  <Badge variant="outline" className={`text-sm font-normal ${db.status === "installed" ? "border-emerald-500/30 text-emerald-500" : "border-amber-500/30 text-amber-500"}`}>
                    {db.status || "unknown"}
                  </Badge>
                  <Button size="icon" variant="ghost" className="h-7 w-7 shrink-0 opacity-0 group-hover:opacity-100 transition-opacity text-muted-foreground hover:text-red-400" onClick={() => setDeleteTarget({ type: "db", id: db.id, name: db.name })}>
                    <Trash2 className="h-3.5 w-3.5" />
                  </Button>
                </div>
              ))}
            </div>
          )
        )}

        {/* Users tab */}
        {activeTab === "users" && (
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
                    <p className="text-sm font-medium font-mono">{user.name}</p>
                    <p className="text-xs text-muted-foreground">{timeAgo(user.created_at)}</p>
                  </div>
                  <Badge variant="outline" className={`text-sm font-normal ${user.status === "installed" ? "border-emerald-500/30 text-emerald-500" : "border-amber-500/30 text-amber-500"}`}>
                    {user.status || "unknown"}
                  </Badge>
                  <Button size="icon" variant="ghost" className="h-7 w-7 shrink-0 opacity-0 group-hover:opacity-100 transition-opacity text-muted-foreground hover:text-primary" onClick={() => { setEditUserTarget(user); setSelectedDatabases([]); }}>
                    <Pencil className="h-3.5 w-3.5" />
                  </Button>
                  <Button size="icon" variant="ghost" className="h-7 w-7 shrink-0 opacity-0 group-hover:opacity-100 transition-opacity text-muted-foreground hover:text-red-400" onClick={() => setDeleteTarget({ type: "user", id: user.id, name: user.name })}>
                    <Trash2 className="h-3.5 w-3.5" />
                  </Button>
                </div>
              ))}
            </div>
          )
        )}

        {/* Backups tab */}
        {activeTab === "backups" && (
          <div className="flex h-full">
            {/* Backup configs list */}
            <div className="w-64 shrink-0 border-r border-border/30 overflow-auto">
              {backupConfigs.length === 0 ? (
                <div className="p-4 text-center text-xs text-muted-foreground">No backup configs</div>
              ) : (
                backupConfigs.map((config) => (
                  <div
                    key={config.id}
                    className={`flex items-center gap-2 px-3 py-2.5 cursor-pointer transition-colors ${
                      selectedBackupConfig?.id === config.id ? "bg-muted/50" : "hover:bg-muted/20"
                    }`}
                    onClick={() => loadBackupInstances(config)}
                  >
                    <Archive className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate">{config.provider}</p>
                      <p className="text-xs text-muted-foreground">{config.frequency} · keep {config.retention}</p>
                    </div>
                    <Button
                      size="icon"
                      variant="ghost"
                      className="h-6 w-6 shrink-0"
                      onClick={(e) => { e.stopPropagation(); handleCreateBackup(config.id); }}
                      title="Run backup now"
                    >
                      <Plus className="h-3 w-3" />
                    </Button>
                  </div>
                ))
              )}
            </div>

            {/* Backup instances */}
            <div className="flex-1 overflow-auto">
              {!selectedBackupConfig ? (
                <div className="flex h-full items-center justify-center text-xs text-muted-foreground">
                  Select a backup config
                </div>
              ) : backupsLoading ? (
                <div className="flex h-32 items-center justify-center">
                  <RefreshCw className="h-4 w-4 animate-spin text-muted-foreground" />
                </div>
              ) : backupInstances.length === 0 ? (
                <EmptyState icon={Archive} title="No backups" description="Run a backup to see instances here" />
              ) : (
                <div className="divide-y divide-border/30">
                  {[...backupInstances].reverse().map((backup) => (
                    <div key={backup.id} className="flex items-center gap-3 px-4 py-3 group hover:bg-muted/20 transition-colors">
                      <Archive className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium">{timeAgo(backup.created_at)}</p>
                        <p className="text-xs text-muted-foreground">
                          {backup.size ? `${(backup.size / 1024 / 1024).toFixed(1)} MB` : "—"}
                        </p>
                      </div>
                      <Badge variant="outline" className={`text-sm font-normal ${backup.status === "finished" ? "border-emerald-500/30 text-emerald-500" : "border-amber-500/30 text-amber-500"}`}>
                        {backup.status}
                      </Badge>
                      <Button
                        size="icon"
                        variant="ghost"
                        className="h-7 w-7 shrink-0 opacity-0 group-hover:opacity-100 transition-opacity text-muted-foreground hover:text-blue-400"
                        onClick={() => setRestoreTarget({ configId: selectedBackupConfig.id, backupId: backup.id, name: timeAgo(backup.created_at) || backup.id })}
                        title="Restore this backup"
                      >
                        <RotateCcw className="h-3.5 w-3.5" />
                      </Button>
                      <Button
                        size="icon"
                        variant="ghost"
                        className="h-7 w-7 shrink-0 opacity-0 group-hover:opacity-100 transition-opacity text-muted-foreground hover:text-red-400"
                        onClick={() => setDeleteTarget({ type: "backup", id: backup.id, name: timeAgo(backup.created_at) || backup.id, configId: selectedBackupConfig.id })}
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </Button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Delete confirmation */}
      <ConfirmDialog
        open={!!deleteTarget}
        title={deleteTarget?.type === "db" ? t("forge.deleteDatabase") : deleteTarget?.type === "user" ? t("forge.deleteDbUser") : "Delete Backup"}
        description={deleteTarget?.type === "db" ? t("forge.deleteDatabaseDesc") : deleteTarget?.type === "user" ? t("forge.deleteDbUserDesc") : "This backup will be permanently deleted."}
        typeToConfirm={deleteTarget?.type === "db" ? deleteTarget.name : undefined}
        variant="danger"
        loading={actionLoading}
        onConfirm={handleDelete}
        onCancel={() => setDeleteTarget(null)}
      />

      {/* Restore confirmation */}
      <ConfirmDialog
        open={!!restoreTarget}
        title="Restore Backup"
        description="This will restore your database from this backup. Current data will be overwritten. This action cannot be undone."
        confirmText="Restore"
        variant="warning"
        loading={actionLoading}
        onConfirm={handleRestore}
        onCancel={() => setRestoreTarget(null)}
      />

      {/* Edit user databases dialog */}
      {editUserTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setEditUserTarget(null)} />
          <div className="relative w-full max-w-md rounded-xl border border-border bg-card p-6 shadow-2xl mx-4 space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-base font-semibold">Edit User: {editUserTarget.name}</h3>
              <button onClick={() => setEditUserTarget(null)} className="text-muted-foreground hover:text-foreground"><X className="h-4 w-4" /></button>
            </div>
            <div>
              <label className="text-xs font-medium text-muted-foreground mb-2 block">Accessible Databases</label>
              {databases.length === 0 ? (
                <p className="text-xs text-muted-foreground/50">No databases available</p>
              ) : (
                <div className="space-y-1.5 max-h-48 overflow-auto">
                  {databases.map((db) => (
                    <label key={db.id} className="flex items-center gap-2 px-2 py-1.5 rounded hover:bg-muted/20 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={selectedDatabases.includes(db.id)}
                        onChange={(e) => {
                          if (e.target.checked) setSelectedDatabases([...selectedDatabases, db.id]);
                          else setSelectedDatabases(selectedDatabases.filter((id) => id !== db.id));
                        }}
                        className="rounded"
                      />
                      <span className="text-sm font-mono">{db.name}</span>
                    </label>
                  ))}
                </div>
              )}
            </div>
            <div className="flex gap-3">
              <Button variant="outline" className="flex-1 h-9" onClick={() => setEditUserTarget(null)}>Cancel</Button>
              <Button className="flex-1 h-9" onClick={handleUpdateUserDatabases} disabled={editUserSaving}>
                {editUserSaving ? <RefreshCw className="h-4 w-4 animate-spin mr-2" /> : <Save className="h-4 w-4 mr-2" />}
                Save
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Change password dialog */}
      {showChangePassword && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setShowChangePassword(false)} />
          <div className="relative w-full max-w-md rounded-xl border border-border bg-card p-6 shadow-2xl mx-4 space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-base font-semibold">Change Database Password</h3>
              <button onClick={() => setShowChangePassword(false)} className="text-muted-foreground hover:text-foreground"><X className="h-4 w-4" /></button>
            </div>
            <div>
              <label className="text-xs font-medium text-muted-foreground mb-1 block">New Password</label>
              <Input
                type="password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                placeholder="Enter new password"
                className="h-9 text-sm"
                autoFocus
                onKeyDown={(e) => e.key === "Enter" && handleChangePassword()}
              />
            </div>
            <div className="flex gap-3">
              <Button variant="outline" className="flex-1 h-9" onClick={() => { setShowChangePassword(false); setNewPassword(""); }}>Cancel</Button>
              <Button className="flex-1 h-9" onClick={handleChangePassword} disabled={changingPassword || !newPassword.trim()}>
                {changingPassword ? <RefreshCw className="h-4 w-4 animate-spin mr-2" /> : <KeyRound className="h-4 w-4 mr-2" />}
                Change Password
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
