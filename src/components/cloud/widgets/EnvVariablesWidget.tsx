import { useState } from "react";
import { Plus, Trash2, RefreshCw, Pencil, Save, X, Eye, EyeOff } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import { t } from "@/lib/i18n";
import { ConfirmDialog } from "@/components/forge/shared/ConfirmDialog";
import { cloudAddEnvVariables, cloudDeleteEnvVariables } from "@/lib/tauri";

interface Props {
  token: string;
  envId: string;
  variables: Array<{ key: string; value: string }>;
  onRefresh: () => void;
}

export function EnvVariablesWidget({ token, envId, variables, onRefresh }: Props) {
  const [showAdd, setShowAdd] = useState(false);
  const [key, setKey] = useState("");
  const [value, setValue] = useState("");
  const [adding, setAdding] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<string | null>(null);
  const [deleting, setDeleting] = useState(false);

  // Edit
  const [editKey, setEditKey] = useState<string | null>(null);
  const [editValue, setEditValue] = useState("");
  const [saving, setSaving] = useState(false);

  // Show/hide values
  const [revealedKeys, setRevealedKeys] = useState<Set<string>>(new Set());

  const add = async () => {
    if (!key.trim()) return;
    setAdding(true);
    try {
      await cloudAddEnvVariables(token, envId, { [key.trim()]: value });
      toast.success(`Variable "${key.trim()}" added`);
      setKey(""); setValue(""); setShowAdd(false); onRefresh();
    } catch (err) { toast.error(`Failed: ${err}`); }
    setAdding(false);
  };

  const saveEdit = async () => {
    if (!editKey) return;
    setSaving(true);
    try {
      await cloudAddEnvVariables(token, envId, { [editKey]: editValue });
      toast.success(`Variable "${editKey}" updated`);
      setEditKey(null); onRefresh();
    } catch (err) { toast.error(`Failed: ${err}`); }
    setSaving(false);
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      await cloudDeleteEnvVariables(token, envId, [deleteTarget]);
      toast.success(`Variable "${deleteTarget}" deleted`);
      setDeleteTarget(null); onRefresh();
    } catch (err) { toast.error(`Failed: ${err}`); }
    setDeleting(false);
  };

  const toggleReveal = (k: string) => {
    setRevealedKeys((prev) => {
      const next = new Set(prev);
      if (next.has(k)) next.delete(k); else next.add(k);
      return next;
    });
  };

  const isSensitive = (k: string) => /password|secret|key|token|private/i.test(k);

  return (
    <div className="flex flex-col h-full">
      <div className="flex items-center justify-between border-b border-border/30 px-4 py-2">
        <span className="text-sm text-muted-foreground">Variables ({variables.length})</span>
        <div className="flex gap-1.5">
          <Button size="sm" variant="ghost" className="h-6 gap-1 px-2 text-xs" onClick={onRefresh}><RefreshCw className="h-3 w-3" /> {t("app.refresh")}</Button>
          <Button size="sm" className="h-6 gap-1 px-2 text-xs" onClick={() => setShowAdd(true)}><Plus className="h-3 w-3" /> {t("app.add")}</Button>
        </div>
      </div>

      {showAdd && (
        <div className="border-b border-border/30 px-4 py-3 bg-muted/20 flex items-center gap-2">
          <Input value={key} onChange={(e) => setKey(e.target.value)} placeholder="KEY" className="h-8 text-xs font-mono flex-1" autoFocus />
          <Input value={value} onChange={(e) => setValue(e.target.value)} placeholder="value" className="h-8 text-xs font-mono flex-1" onKeyDown={(e) => e.key === "Enter" && add()} />
          <Button size="sm" className="h-8 text-xs" onClick={add} disabled={adding || !key.trim()}>
            {adding ? <RefreshCw className="h-3 w-3 animate-spin" /> : t("app.create")}
          </Button>
          <Button size="sm" variant="ghost" className="h-8 text-xs" onClick={() => setShowAdd(false)}>{t("app.cancel")}</Button>
        </div>
      )}

      <div className="flex-1 overflow-auto bg-zinc-100 dark:bg-zinc-950 font-mono text-xs">
        {variables.length === 0 ? (
          <div className="flex h-32 items-center justify-center text-muted-foreground/40">No variables configured</div>
        ) : (
          <div className="divide-y divide-border/20">
            {variables.map((v, i) => {
              const sensitive = isSensitive(v.key);
              const revealed = revealedKeys.has(v.key);
              const isEditing = editKey === v.key;

              if (isEditing) {
                return (
                  <div key={i} className="flex items-center gap-2 px-4 py-2 bg-primary/5">
                    <span className="text-cyan-700 dark:text-cyan-400 font-semibold shrink-0">{v.key}</span>
                    <span className="text-muted-foreground">=</span>
                    <Input
                      value={editValue}
                      onChange={(e) => setEditValue(e.target.value)}
                      className="h-7 text-xs font-mono flex-1"
                      autoFocus
                      onKeyDown={(e) => e.key === "Enter" && saveEdit()}
                    />
                    <Button size="icon" variant="ghost" className="h-6 w-6 text-emerald-500 hover:text-emerald-400" onClick={saveEdit} disabled={saving} aria-label="Save">
                      {saving ? <RefreshCw className="h-3 w-3 animate-spin" /> : <Save className="h-3 w-3" />}
                    </Button>
                    <Button size="icon" variant="ghost" className="h-6 w-6 text-muted-foreground" onClick={() => setEditKey(null)} aria-label="Close">
                      <X className="h-3 w-3" />
                    </Button>
                  </div>
                );
              }

              return (
                <div key={i} className="flex items-center gap-2 px-4 py-2 group hover:bg-black/[0.03] dark:hover:bg-white/[0.02]">
                  <span className="text-cyan-700 dark:text-cyan-400 font-semibold shrink-0">{v.key}</span>
                  <span className="text-muted-foreground">=</span>
                  <span className={`flex-1 truncate ${sensitive && !revealed ? "text-amber-600 dark:text-amber-400/70" : "text-foreground/80"}`}>
                    {sensitive && !revealed ? "•".repeat(Math.min((v.value || "").length, 20)) : v.value}
                  </span>
                  {sensitive && (
                    <Button size="icon" variant="ghost" className="h-5 w-5 opacity-0 group-hover:opacity-100 text-muted-foreground" onClick={() => toggleReveal(v.key)}>
                      {revealed ? <EyeOff className="h-3 w-3" /> : <Eye className="h-3 w-3" />}
                    </Button>
                  )}
                  <Button size="icon" variant="ghost" className="h-5 w-5 opacity-0 group-hover:opacity-100 text-muted-foreground hover:text-primary"
                    onClick={() => { setEditKey(v.key); setEditValue(v.value); }} aria-label="Edit">
                    <Pencil className="h-3 w-3" />
                  </Button>
                  <Button size="icon" variant="ghost" className="h-5 w-5 opacity-0 group-hover:opacity-100 text-muted-foreground hover:text-red-400"
                    onClick={() => setDeleteTarget(v.key)} aria-label="Delete">
                    <Trash2 className="h-3 w-3" />
                  </Button>
                </div>
              );
            })}
          </div>
        )}
      </div>

      <ConfirmDialog open={!!deleteTarget} title="Delete Variable" description={`Remove environment variable "${deleteTarget}"? This takes effect on the next deployment.`} variant="warning" confirmText="Delete" loading={deleting} onConfirm={handleDelete} onCancel={() => setDeleteTarget(null)} />
    </div>
  );
}
