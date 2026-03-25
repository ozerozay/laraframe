import { useState } from "react";
import { ShieldCheck, Plus, Trash2, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { t } from "@/lib/i18n";

import { cachedFetch, invalidateCache } from "@/lib/cache";
import { EmptyState } from "../shared/EmptyState";
import { ConfirmDialog } from "../shared/ConfirmDialog";
import { forgeListFirewallRules, forgeCreateFirewallRule, forgeDeleteFirewallRule, type ForgeFirewallRule } from "@/lib/tauri";

interface Props { token: string; orgSlug: string; serverId: string; }

export function FirewallWidget({ token, orgSlug, serverId }: Props) {
  const [rules, setRules] = useState<ForgeFirewallRule[]>([]);
  const [loaded, setLoaded] = useState(false);
  const [loading, setLoading] = useState(false);
  const [showCreate, setShowCreate] = useState(false);
  const [name, setName] = useState("");
  const [port, setPort] = useState("");
  const [ip, setIp] = useState("");
  const [ruleType, setRuleType] = useState("allow");
  const [creating, setCreating] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<ForgeFirewallRule | null>(null);
  const [deleting, setDeleting] = useState(false);

  const load = async (force = false) => {
    setLoading(true);
    if (force) invalidateCache(`server:${serverId}:firewall`);
    try {
      const r = await cachedFetch(`server:${serverId}:firewall`, () => forgeListFirewallRules(token, orgSlug, serverId));
      setRules(r); setLoaded(true);
    } catch (err) { console.error("Failed to load firewall rules:", err); setLoaded(true); }
    setLoading(false);
  };

  if (!loaded && !loading) load();

  const create = async () => {
    if (!name.trim() || !port.trim()) return;
    setCreating(true);
    try {
      await forgeCreateFirewallRule(token, orgSlug, serverId, name.trim(), port.trim(), ip.trim() || "0.0.0.0/0", ruleType);
      toast.success("Firewall rule created");
      setName(""); setPort(""); setIp(""); setShowCreate(false); load(true);
    } catch (err) { toast.error(`Failed: ${err}`); }
    setCreating(false);
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      await forgeDeleteFirewallRule(token, orgSlug, serverId, deleteTarget.id);
      toast.success("Firewall rule deleted"); setDeleteTarget(null); load(true);
    } catch (err) { toast.error(`Failed: ${err}`); }
    setDeleting(false);
  };

  return (
    <div className="flex flex-col h-full">
      <div className="flex items-center justify-between border-b border-border/30 px-4 py-2">
        <span className="text-sm text-muted-foreground">Firewall Rules ({rules.length})</span>
        <div className="flex gap-1.5">
          <Button size="sm" variant="ghost" className="h-6 gap-1 px-2 text-xs" onClick={() => load(true)}><RefreshCw className="h-3 w-3" /> {t("app.refresh")}</Button>
          <Button size="sm" className="h-6 gap-1 px-2 text-xs" onClick={() => setShowCreate(true)}><Plus className="h-3 w-3" /> {t("app.add")} Rule</Button>
        </div>
      </div>
      {showCreate && (
        <div className="border-b border-border/30 px-4 py-3 bg-muted/20 space-y-2">
          <div className="flex items-center gap-2">
            <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="Rule name" className="h-8 text-xs flex-1" autoFocus />
            <Input value={port} onChange={(e) => setPort(e.target.value)} placeholder="Port (e.g. 443)" className="h-8 text-xs w-24 font-mono" />
            <Input value={ip} onChange={(e) => setIp(e.target.value)} placeholder="IP (optional)" className="h-8 text-xs w-36 font-mono" />
            <select value={ruleType} onChange={(e) => setRuleType(e.target.value)} className="h-8 rounded-md border bg-transparent px-2 text-xs">
              <option value="allow">Allow</option>
              <option value="deny">Deny</option>
            </select>
          </div>
          <div className="flex gap-2">
            <Button size="sm" className="h-8 text-xs" onClick={create} disabled={creating || !name.trim() || !port.trim()}>
              {creating ? <RefreshCw className="h-3 w-3 animate-spin mr-1" /> : null} {t("app.create")}
            </Button>
            <Button size="sm" variant="ghost" className="h-8 text-xs" onClick={() => setShowCreate(false)}>{t("app.cancel")}</Button>
          </div>
        </div>
      )}
      <div className="flex-1 overflow-auto">
        {loading && !loaded ? (
          <div className="flex h-32 items-center justify-center"><RefreshCw className="h-4 w-4 animate-spin text-muted-foreground" /></div>
        ) : rules.length === 0 ? (
          <EmptyState icon={ShieldCheck} title="No firewall rules" description="Add rules to control inbound traffic" />
        ) : (
          <div className="divide-y divide-border/30">
            {rules.map((rule) => (
              <div key={rule.id} className="flex items-center gap-3 px-4 py-3 group hover:bg-muted/20">
                <ShieldCheck className={`h-4 w-4 shrink-0 ${rule.rule_type === "allow" ? "text-emerald-500" : "text-red-500"}`} />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium">{rule.name}</p>
                  <div className="flex items-center gap-2 text-xs text-muted-foreground">
                    <span className="font-mono">:{rule.port}</span>
                    {rule.ip_address && <span className="font-mono">{rule.ip_address}</span>}
                  </div>
                </div>
                <Badge variant="outline" className={`text-xs font-normal ${rule.rule_type === "allow" ? "border-emerald-500/30 text-emerald-500" : "border-red-500/30 text-red-500"}`}>
                  {rule.rule_type}
                </Badge>
                <Badge variant="outline" className={`text-xs font-normal ${rule.status === "installed" ? "border-emerald-500/30 text-emerald-500" : "border-amber-500/30 text-amber-500"}`}>
                  {rule.status}
                </Badge>
                <Button size="icon" variant="ghost" className="h-6 w-6 opacity-0 group-hover:opacity-100 text-muted-foreground hover:text-red-400" onClick={() => setDeleteTarget(rule)} aria-label="Delete">
                  <Trash2 className="h-3 w-3" />
                </Button>
              </div>
            ))}
          </div>
        )}
      </div>
      <ConfirmDialog open={!!deleteTarget} title="Delete Firewall Rule" description={`Remove firewall rule "${deleteTarget?.name}" (port ${deleteTarget?.port})?`} variant="danger" loading={deleting} onConfirm={handleDelete} onCancel={() => setDeleteTarget(null)} />
    </div>
  );
}
