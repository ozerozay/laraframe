import { useState } from "react";
import { Code, Plus, Trash2, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { t } from "@/lib/i18n";
import { timeAgo } from "@/lib/helpers";
import { cachedFetch, invalidateCache } from "@/lib/cache";
import { EmptyState } from "../shared/EmptyState";
import { ConfirmDialog } from "../shared/ConfirmDialog";
import { forgeListPHPVersions, forgeInstallPHPVersion, forgeDeletePHPVersion, type ForgePHPVersion } from "@/lib/tauri";

interface Props { token: string; orgSlug: string; serverId: string; }

const AVAILABLE_VERSIONS = ["8.4", "8.3", "8.2", "8.1", "8.0"];

export function PHPVersionsWidget({ token, orgSlug, serverId }: Props) {
  const [versions, setVersions] = useState<ForgePHPVersion[]>([]);
  const [loaded, setLoaded] = useState(false);
  const [loading, setLoading] = useState(false);
  const [installing, setInstalling] = useState<string | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<ForgePHPVersion | null>(null);
  const [deleting, setDeleting] = useState(false);

  const load = async (force = false) => {
    setLoading(true);
    if (force) invalidateCache(`server:${serverId}:php`);
    try {
      const v = await cachedFetch(`server:${serverId}:php`, () => forgeListPHPVersions(token, orgSlug, serverId));
      setVersions(v); setLoaded(true);
    } catch (err) { console.error("Failed to load PHP versions:", err); setLoaded(true); }
    setLoading(false);
  };

  if (!loaded && !loading) load();

  const install = async (version: string) => {
    setInstalling(version);
    try {
      await forgeInstallPHPVersion(token, orgSlug, serverId, version);
      toast.success(`PHP ${version} installation started`);
      load(true);
    } catch (err) { toast.error(`Failed: ${err}`); }
    setInstalling(null);
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      await forgeDeletePHPVersion(token, orgSlug, serverId, deleteTarget.id);
      toast.success(`PHP ${deleteTarget.version} removed`);
      setDeleteTarget(null); load(true);
    } catch (err) { toast.error(`Failed: ${err}`); }
    setDeleting(false);
  };

  const installedVersions = versions.map((v) => v.version);

  return (
    <div className="flex flex-col h-full">
      <div className="flex items-center justify-between border-b border-border/30 px-4 py-2">
        <span className="text-sm text-muted-foreground">PHP Versions ({versions.length})</span>
        <Button size="sm" variant="ghost" className="h-6 gap-1 px-2 text-xs" onClick={() => load(true)}>
          <RefreshCw className="h-3 w-3" /> {t("app.refresh")}
        </Button>
      </div>

      <div className="flex-1 overflow-auto">
        {loading && !loaded ? (
          <div className="flex h-32 items-center justify-center"><RefreshCw className="h-4 w-4 animate-spin text-muted-foreground" /></div>
        ) : (
          <div className="p-4 space-y-4">
            {/* Installed */}
            <div>
              <h3 className="text-xs font-semibold text-muted-foreground mb-2 uppercase tracking-wider">Installed</h3>
              {versions.length === 0 ? (
                <EmptyState icon={Code} title="No PHP versions" description="Install a PHP version to get started" />
              ) : (
                <div className="space-y-2">
                  {versions.map((v) => (
                    <div key={v.id} className="flex items-center gap-3 rounded-lg border border-border/30 p-3 group">
                      <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-md bg-blue-500/10">
                        <Code className="h-3.5 w-3.5 text-blue-500" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <p className="text-sm font-semibold">PHP {v.version}</p>
                          <code className="text-xs text-muted-foreground font-mono">{v.binary_name}</code>
                        </div>
                        <p className="text-xs text-muted-foreground">{timeAgo(v.created_at)}</p>
                      </div>
                      <Badge variant="outline" className={`text-xs font-normal ${v.status === "installed" ? "border-emerald-500/30 text-emerald-500" : "border-amber-500/30 text-amber-500"}`}>
                        {v.status}
                      </Badge>
                      {versions.length > 1 && (
                        <Button size="icon" variant="ghost" className="h-6 w-6 opacity-0 group-hover:opacity-100 text-muted-foreground hover:text-red-400"
                          onClick={() => setDeleteTarget(v)}>
                          <Trash2 className="h-3 w-3" />
                        </Button>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Available to install */}
            {AVAILABLE_VERSIONS.filter((v) => !installedVersions.includes(v)).length > 0 && (
              <div>
                <h3 className="text-xs font-semibold text-muted-foreground mb-2 uppercase tracking-wider">Available</h3>
                <div className="flex flex-wrap gap-2">
                  {AVAILABLE_VERSIONS.filter((v) => !installedVersions.includes(v)).map((v) => (
                    <Button
                      key={v}
                      size="sm"
                      variant="outline"
                      className="h-8 gap-1.5 text-xs"
                      onClick={() => install(v)}
                      disabled={installing === v}
                    >
                      {installing === v ? <RefreshCw className="h-3 w-3 animate-spin" /> : <Plus className="h-3 w-3" />}
                      PHP {v}
                    </Button>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      <ConfirmDialog
        open={!!deleteTarget}
        title={`Remove PHP ${deleteTarget?.version}`}
        description="This will uninstall this PHP version from your server. Sites using this version will need to be updated first."
        variant="danger"
        loading={deleting}
        onConfirm={handleDelete}
        onCancel={() => setDeleteTarget(null)}
      />
    </div>
  );
}
