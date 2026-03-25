import { useState } from "react";
import { Shield, Plus, Trash2, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import { t } from "@/lib/i18n";
import { cachedFetch, invalidateCache } from "@/lib/cache";
import { EmptyState } from "../shared/EmptyState";
import { ConfirmDialog } from "../shared/ConfirmDialog";
import { forgeListSecurityRules, forgeCreateSecurityRule, forgeDeleteSecurityRule, type ForgeSecurityRule } from "@/lib/tauri";

interface Props { token: string; orgSlug: string; serverId: string; siteId: string; }

export function SecurityRulesWidget({ token, orgSlug, serverId, siteId }: Props) {
  const [rules, setRules] = useState<ForgeSecurityRule[]>([]);
  const [loaded, setLoaded] = useState(false);
  const [loading, setLoading] = useState(false);
  const [showCreate, setShowCreate] = useState(false);
  const [name, setName] = useState("");
  const [path, setPath] = useState("/");
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [creating, setCreating] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<ForgeSecurityRule | null>(null);
  const [deleting, setDeleting] = useState(false);

  const load = async (force = false) => {
    setLoading(true);
    if (force) invalidateCache(`site:${siteId}:security`);
    try {
      const r = await cachedFetch(`site:${siteId}:security`, () => forgeListSecurityRules(token, orgSlug, serverId, siteId));
      setRules(r); setLoaded(true);
    } catch (err) { console.error("Failed to load security rules:", err); setLoaded(true); }
    setLoading(false);
  };

  if (!loaded && !loading) load();

  const create = async () => {
    if (!name.trim() || !username.trim() || !password.trim()) return;
    setCreating(true);
    try {
      await forgeCreateSecurityRule(token, orgSlug, serverId, siteId, name.trim(), path.trim(), [{ username: username.trim(), password: password.trim() }]);
      toast.success("Security rule created");
      setName(""); setPath("/"); setUsername(""); setPassword(""); setShowCreate(false);
      load(true);
    } catch (err) { toast.error(`Failed: ${err}`); }
    setCreating(false);
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      await forgeDeleteSecurityRule(token, orgSlug, serverId, siteId, deleteTarget.id);
      toast.success("Security rule deleted"); setDeleteTarget(null); load(true);
    } catch (err) { toast.error(`Failed: ${err}`); }
    setDeleting(false);
  };

  return (
    <div className="flex flex-col h-full">
      <div className="flex items-center justify-between border-b border-border/30 px-4 py-2">
        <span className="text-sm text-muted-foreground">Security Rules ({rules.length})</span>
        <div className="flex gap-1.5">
          <Button size="sm" variant="ghost" className="h-6 gap-1 px-2 text-xs" onClick={() => load(true)}><RefreshCw className="h-3 w-3" /> {t("app.refresh")}</Button>
          <Button size="sm" className="h-6 gap-1 px-2 text-xs" onClick={() => setShowCreate(true)}><Plus className="h-3 w-3" /> Add Rule</Button>
        </div>
      </div>
      {showCreate && (
        <div className="border-b border-border/30 px-4 py-3 bg-muted/20 space-y-2">
          <div className="flex items-center gap-2">
            <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="Rule name" className="h-8 text-xs flex-1" autoFocus />
            <Input value={path} onChange={(e) => setPath(e.target.value)} placeholder="Path (e.g. /admin)" className="h-8 text-xs flex-1 font-mono" />
          </div>
          <div className="flex items-center gap-2">
            <Input value={username} onChange={(e) => setUsername(e.target.value)} placeholder="Username" className="h-8 text-xs flex-1" />
            <Input type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="Password" className="h-8 text-xs flex-1" />
            <Button size="sm" className="h-8 text-xs" onClick={create} disabled={creating}>{creating ? <RefreshCw className="h-3 w-3 animate-spin" /> : t("app.create")}</Button>
            <Button size="sm" variant="ghost" className="h-8 text-xs" onClick={() => setShowCreate(false)}>{t("app.cancel")}</Button>
          </div>
        </div>
      )}
      <div className="flex-1 overflow-auto">
        {loading && !loaded ? (
          <div className="flex h-32 items-center justify-center"><RefreshCw className="h-4 w-4 animate-spin text-muted-foreground" /></div>
        ) : rules.length === 0 ? (
          <EmptyState icon={Shield} title="No security rules" description="Protect paths with HTTP Basic Auth" />
        ) : (
          <div className="divide-y divide-border/30">
            {rules.map((rule) => (
              <div key={rule.id} className="flex items-center gap-3 px-4 py-3 group hover:bg-muted/20">
                <Shield className="h-4 w-4 text-muted-foreground shrink-0" />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium">{rule.name}</p>
                  <p className="text-xs text-muted-foreground font-mono">{rule.path}</p>
                </div>
                <Button size="icon" variant="ghost" className="h-6 w-6 opacity-0 group-hover:opacity-100 text-muted-foreground hover:text-red-400" onClick={() => setDeleteTarget(rule)} aria-label="Delete">
                  <Trash2 className="h-3 w-3" />
                </Button>
              </div>
            ))}
          </div>
        )}
      </div>
      <ConfirmDialog open={!!deleteTarget} title="Delete Security Rule" description={`Remove security rule "${deleteTarget?.name}" for path "${deleteTarget?.path}"?`} variant="danger" loading={deleting} onConfirm={handleDelete} onCancel={() => setDeleteTarget(null)} />
    </div>
  );
}
