import { useState } from "react";
import { Globe, Plus, Trash2, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import { t } from "@/lib/i18n";
import { invalidateCache } from "@/lib/cache";
import { ConfirmDialog } from "../shared/ConfirmDialog";
import { forgeCreateSite, forgeDeleteSite } from "@/lib/tauri";

interface Props {
  token: string;
  orgSlug: string;
  serverId: string;
  onSiteCreated: () => void;
  onSiteDeleted: () => void;
  selectedSiteId: string | null;
  selectedSiteName: string | null;
}

export function SiteCreateDeleteWidget({ token, orgSlug, serverId, onSiteCreated, onSiteDeleted, selectedSiteId, selectedSiteName }: Props) {
  const [showCreate, setShowCreate] = useState(false);
  const [domain, setDomain] = useState("");
  const [projectType, setProjectType] = useState("php");
  const [phpVersion, setPhpVersion] = useState("php84");
  const [creating, setCreating] = useState(false);
  const [showDelete, setShowDelete] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const create = async () => {
    if (!domain.trim()) return;
    setCreating(true);
    try {
      await forgeCreateSite(token, orgSlug, serverId, domain.trim(), projectType, phpVersion);
      toast.success(`Site "${domain.trim()}" created`);
      setDomain(""); setShowCreate(false);
      invalidateCache(`server:${serverId}:sites`);
      onSiteCreated();
    } catch (err) { toast.error(`Failed: ${err}`); }
    setCreating(false);
  };

  const handleDelete = async () => {
    if (!selectedSiteId) return;
    setDeleting(true);
    try {
      await forgeDeleteSite(token, orgSlug, serverId, selectedSiteId);
      toast.success(`Site "${selectedSiteName}" deleted`);
      setShowDelete(false);
      invalidateCache(`server:${serverId}:sites`);
      onSiteDeleted();
    } catch (err) { toast.error(`Failed: ${err}`); }
    setDeleting(false);
  };

  return (
    <>
      {/* Create button */}
      <div className="flex items-center gap-1.5">
        <Button size="sm" variant="outline" className="h-7 gap-1 text-xs" onClick={() => setShowCreate(true)}>
          <Plus className="h-3 w-3" /> New Site
        </Button>
        {selectedSiteId && (
          <Button size="sm" variant="outline" className="h-7 gap-1 text-xs text-red-500 hover:text-red-400 hover:border-red-500/30" onClick={() => setShowDelete(true)}>
            <Trash2 className="h-3 w-3" /> Delete Site
          </Button>
        )}
      </div>

      {/* Create dialog */}
      {showCreate && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setShowCreate(false)} />
          <div className="relative w-full max-w-md rounded-xl border border-border bg-card p-6 shadow-2xl mx-4 space-y-4">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10">
                <Globe className="h-5 w-5 text-primary" />
              </div>
              <div>
                <h3 className="text-base font-semibold">Create Site</h3>
                <p className="text-xs text-muted-foreground">Add a new site to this server</p>
              </div>
            </div>
            <div className="space-y-3">
              <Input value={domain} onChange={(e) => setDomain(e.target.value)} placeholder="example.com" className="h-9 text-sm font-mono" autoFocus />
              <div className="flex gap-2">
                <select value={projectType} onChange={(e) => setProjectType(e.target.value)} className="h-9 flex-1 rounded-md border bg-transparent px-3 text-sm">
                  <option value="php">PHP</option>
                  <option value="laravel">Laravel</option>
                  <option value="symfony">Symfony</option>
                  <option value="statamic">Statamic</option>
                  <option value="wordpress">WordPress</option>
                  <option value="static-html">Static HTML</option>
                </select>
                <select value={phpVersion} onChange={(e) => setPhpVersion(e.target.value)} className="h-9 flex-1 rounded-md border bg-transparent px-3 text-sm">
                  <option value="php84">PHP 8.4</option>
                  <option value="php83">PHP 8.3</option>
                  <option value="php82">PHP 8.2</option>
                  <option value="php81">PHP 8.1</option>
                </select>
              </div>
            </div>
            <div className="flex gap-3">
              <Button variant="outline" className="flex-1 h-9" onClick={() => setShowCreate(false)}>{t("app.cancel")}</Button>
              <Button className="flex-1 h-9" onClick={create} disabled={creating || !domain.trim()}>
                {creating ? <RefreshCw className="h-4 w-4 animate-spin mr-2" /> : null}
                {t("app.create")}
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Delete confirm */}
      <ConfirmDialog
        open={showDelete}
        title="Delete Site"
        description={`This will permanently delete "${selectedSiteName}" and all its configuration, deployments, and data. This action cannot be undone.`}
        typeToConfirm={selectedSiteName || undefined}
        variant="danger"
        loading={deleting}
        onConfirm={handleDelete}
        onCancel={() => setShowDelete(false)}
      />
    </>
  );
}
