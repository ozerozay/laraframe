import { useState } from "react";
import { Globe, Plus, Trash2, RefreshCw, CheckCircle2, AlertCircle, Clock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { t } from "@/lib/i18n";
import { cachedFetch, invalidateCache } from "@/lib/cache";
import { EmptyState } from "@/components/forge/shared/EmptyState";
import { ConfirmDialog } from "@/components/forge/shared/ConfirmDialog";
import { EditDialog, EditButton } from "./EditDialog";
import { cloudListDomains, cloudCreateDomain, cloudDeleteDomain, cloudVerifyDomain, cloudUpdateDomain, type CloudDomain } from "@/lib/tauri";

interface Props { token: string; envId: string; }

export function CloudDomainsWidget({ token, envId }: Props) {
  const [domains, setDomains] = useState<CloudDomain[]>([]);
  const [loaded, setLoaded] = useState(false);
  const [loading, setLoading] = useState(false);
  const [showCreate, setShowCreate] = useState(false);
  const [name, setName] = useState("");
  const [creating, setCreating] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<CloudDomain | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [verifyingId, setVerifyingId] = useState<string | null>(null);
  const [editTarget, setEditTarget] = useState<CloudDomain | null>(null);

  const load = async (force = false) => {
    setLoading(true);
    if (force) invalidateCache(`cloud:env:${envId}:domains`);
    try {
      const d = await cachedFetch(`cloud:env:${envId}:domains`, () => cloudListDomains(token, envId));
      setDomains(d); setLoaded(true);
    } catch (err) { console.error("Failed to load cloud domains:", err); setLoaded(true); }
    setLoading(false);
  };

  if (!loaded && !loading) load();

  const create = async () => {
    if (!name.trim()) return;
    setCreating(true);
    try {
      await cloudCreateDomain(token, envId, name.trim());
      toast.success(`Domain "${name.trim()}" added`);
      setName(""); setShowCreate(false); load(true);
    } catch (err) { toast.error(`Failed: ${err}`); }
    setCreating(false);
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      await cloudDeleteDomain(token, deleteTarget.id);
      toast.success(`Domain "${deleteTarget.name}" deleted`);
      setDeleteTarget(null); load(true);
    } catch (err) { toast.error(`Failed: ${err}`); }
    setDeleting(false);
  };

  const verify = async (id: string) => {
    setVerifyingId(id);
    try {
      await cloudVerifyDomain(token, id);
      toast.success("Verification started"); load(true);
    } catch (err) { toast.error(`Failed: ${err}`); }
    setVerifyingId(null);
  };

  const statusIcon = (s: string | null) => {
    if (s === "verified") return <CheckCircle2 className="h-3 w-3 text-emerald-500" />;
    if (s === "failed") return <AlertCircle className="h-3 w-3 text-red-500" />;
    return <Clock className="h-3 w-3 text-amber-500" />;
  };

  return (
    <div className="flex flex-col h-full">
      <div className="flex items-center justify-between border-b border-border/30 px-4 py-2">
        <span className="text-sm text-muted-foreground">{t("cloud.domains")} ({domains.length})</span>
        <div className="flex gap-1.5">
          <Button size="sm" variant="ghost" className="h-6 gap-1 px-2 text-xs" onClick={() => load(true)}><RefreshCw className="h-3 w-3" /> {t("app.refresh")}</Button>
          <Button size="sm" className="h-6 gap-1 px-2 text-xs" onClick={() => setShowCreate(true)}><Plus className="h-3 w-3" /> Add Domain</Button>
        </div>
      </div>
      {showCreate && (
        <div className="border-b border-border/30 px-4 py-3 bg-muted/20 flex items-center gap-2">
          <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="example.com" className="h-8 text-xs font-mono flex-1" autoFocus onKeyDown={(e) => e.key === "Enter" && create()} />
          <Button size="sm" className="h-8 text-xs" onClick={create} disabled={creating}>{creating ? <RefreshCw className="h-3 w-3 animate-spin" /> : t("app.create")}</Button>
          <Button size="sm" variant="ghost" className="h-8 text-xs" onClick={() => setShowCreate(false)}>{t("app.cancel")}</Button>
        </div>
      )}
      <div className="flex-1 overflow-auto">
        {loading && !loaded ? (
          <div className="flex h-32 items-center justify-center"><RefreshCw className="h-4 w-4 animate-spin text-muted-foreground" /></div>
        ) : domains.length === 0 ? (
          <EmptyState icon={Globe} title="No domains" description="Add a custom domain to your environment" />
        ) : (
          <div className="divide-y divide-border/30">
            {domains.map((domain) => (
              <div key={domain.id} className="flex items-center gap-3 px-4 py-3 group hover:bg-muted/20">
                <Globe className="h-4 w-4 text-muted-foreground shrink-0" />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium font-mono truncate">{domain.name}</p>
                  <div className="flex items-center gap-3 mt-0.5 text-xs text-muted-foreground">
                    <span className="flex items-center gap-1">{statusIcon(domain.hostname_status)} DNS</span>
                    <span className="flex items-center gap-1">{statusIcon(domain.ssl_status)} SSL</span>
                    <Badge variant="outline" className="text-xs font-normal h-4 px-1">{domain.domain_type}</Badge>
                  </div>
                </div>
                {domain.hostname_status !== "verified" && (
                  <Button size="sm" variant="outline" className="h-6 text-xs opacity-0 group-hover:opacity-100"
                    onClick={() => verify(domain.id)} disabled={verifyingId === domain.id}>
                    {verifyingId === domain.id ? <RefreshCw className="h-3 w-3 animate-spin" /> : "Verify"}
                  </Button>
                )}
                <EditButton onClick={() => setEditTarget(domain)} />
                <Button size="icon" variant="ghost" className="h-6 w-6 opacity-0 group-hover:opacity-100 text-muted-foreground hover:text-red-400"
                  onClick={() => setDeleteTarget(domain)} aria-label="Delete">
                  <Trash2 className="h-3 w-3" />
                </Button>
              </div>
            ))}
          </div>
        )}
      </div>
      <ConfirmDialog open={!!deleteTarget} title="Delete Domain" description={`Remove domain "${deleteTarget?.name}"?`} typeToConfirm={deleteTarget?.name} variant="danger" loading={deleting} onConfirm={handleDelete} onCancel={() => setDeleteTarget(null)} />
      <EditDialog
        open={!!editTarget}
        title="Edit Domain"
        fields={[
          { key: "wildcard_enabled", label: "Wildcard Enabled", type: "select", options: [
            { value: "true", label: "Yes" },
            { value: "false", label: "No" },
          ]},
        ]}
        values={editTarget ? { wildcard_enabled: String((editTarget as unknown as Record<string, unknown>).wildcard_enabled ?? false) } : {}}
        onSave={async (values) => { await cloudUpdateDomain(token, editTarget!.id, values); load(true); }}
        onCancel={() => setEditTarget(null)}
      />
    </div>
  );
}
