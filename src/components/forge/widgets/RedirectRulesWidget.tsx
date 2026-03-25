import { useState } from "react";
import { ArrowRight, Plus, Trash2, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { t } from "@/lib/i18n";
import { cachedFetch, invalidateCache } from "@/lib/cache";
import { EmptyState } from "../shared/EmptyState";
import { ConfirmDialog } from "../shared/ConfirmDialog";
import { forgeListRedirectRules, forgeCreateRedirectRule, forgeDeleteRedirectRule, type ForgeRedirectRule } from "@/lib/tauri";

interface Props { token: string; orgSlug: string; serverId: string; siteId: string; }

export function RedirectRulesWidget({ token, orgSlug, serverId, siteId }: Props) {
  const [rules, setRules] = useState<ForgeRedirectRule[]>([]);
  const [loaded, setLoaded] = useState(false);
  const [loading, setLoading] = useState(false);
  const [showCreate, setShowCreate] = useState(false);
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");
  const [type, setType] = useState("redirect");
  const [creating, setCreating] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<ForgeRedirectRule | null>(null);
  const [deleting, setDeleting] = useState(false);

  const load = async (force = false) => {
    setLoading(true);
    if (force) invalidateCache(`site:${siteId}:redirects`);
    try {
      const r = await cachedFetch(`site:${siteId}:redirects`, () => forgeListRedirectRules(token, orgSlug, serverId, siteId));
      setRules(r); setLoaded(true);
    } catch { setLoaded(true); }
    setLoading(false);
  };

  if (!loaded && !loading) load();

  const create = async () => {
    if (!from.trim() || !to.trim()) return;
    setCreating(true);
    try {
      await forgeCreateRedirectRule(token, orgSlug, serverId, siteId, from.trim(), to.trim(), type);
      toast.success("Redirect created"); setFrom(""); setTo(""); setShowCreate(false); load(true);
    } catch (err) { toast.error(`Failed: ${err}`); }
    setCreating(false);
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      await forgeDeleteRedirectRule(token, orgSlug, serverId, siteId, deleteTarget.id);
      toast.success("Redirect deleted"); setDeleteTarget(null); load(true);
    } catch (err) { toast.error(`Failed: ${err}`); }
    setDeleting(false);
  };

  return (
    <div className="flex flex-col h-full">
      <div className="flex items-center justify-between border-b border-border/30 px-4 py-2">
        <span className="text-sm text-muted-foreground">Redirects ({rules.length})</span>
        <div className="flex gap-1.5">
          <Button size="sm" variant="ghost" className="h-6 gap-1 px-2 text-xs" onClick={() => load(true)}><RefreshCw className="h-2.5 w-2.5" /> {t("app.refresh")}</Button>
          <Button size="sm" className="h-6 gap-1 px-2 text-xs bg-emerald-600 hover:bg-emerald-700 text-white" onClick={() => setShowCreate(true)}><Plus className="h-2.5 w-2.5" /> Add</Button>
        </div>
      </div>
      {showCreate && (
        <div className="border-b border-border/30 px-4 py-3 bg-muted/20 flex items-center gap-2">
          <Input value={from} onChange={(e) => setFrom(e.target.value)} placeholder="/old-path" className="h-8 text-xs font-mono flex-1" autoFocus />
          <ArrowRight className="h-3 w-3 text-muted-foreground shrink-0" />
          <Input value={to} onChange={(e) => setTo(e.target.value)} placeholder="/new-path" className="h-8 text-xs font-mono flex-1" />
          <select value={type} onChange={(e) => setType(e.target.value)} className="h-8 rounded-md border bg-transparent px-2 text-xs">
            <option value="redirect">302</option>
            <option value="permanent">301</option>
          </select>
          <Button size="sm" className="h-8 text-xs" onClick={create} disabled={creating}>{creating ? <RefreshCw className="h-3 w-3 animate-spin" /> : t("app.create")}</Button>
          <Button size="sm" variant="ghost" className="h-8 text-xs" onClick={() => setShowCreate(false)}>{t("app.cancel")}</Button>
        </div>
      )}
      <div className="flex-1 overflow-auto">
        {rules.length === 0 ? (
          <EmptyState icon={ArrowRight} title="No redirects" description="Add redirect rules for this site" />
        ) : (
          <div className="divide-y divide-border/30">
            {rules.map((rule) => (
              <div key={rule.id} className="flex items-center gap-2 px-4 py-2.5 group hover:bg-muted/20">
                <code className="text-sm font-mono truncate">{rule.from}</code>
                <ArrowRight className="h-3 w-3 text-muted-foreground shrink-0" />
                <code className="text-sm font-mono truncate flex-1">{rule.to}</code>
                <Badge variant="outline" className="text-sm">{rule.redirect_type === "permanent" ? "301" : "302"}</Badge>
                <Button size="icon" variant="ghost" className="h-6 w-6 opacity-0 group-hover:opacity-100 text-muted-foreground hover:text-red-400" onClick={() => setDeleteTarget(rule)}>
                  <Trash2 className="h-3 w-3" />
                </Button>
              </div>
            ))}
          </div>
        )}
      </div>
      <ConfirmDialog open={!!deleteTarget} title="Delete Redirect Rule" description={`Delete redirect from "${deleteTarget?.from}" to "${deleteTarget?.to}"?`} variant="danger" loading={deleting} onConfirm={handleDelete} onCancel={() => setDeleteTarget(null)} />
    </div>
  );
}
