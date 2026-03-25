import { useState } from "react";
import { HeartPulse, Save, RefreshCw, Pencil, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import { t } from "@/lib/i18n";
import { cachedFetch, invalidateCache } from "@/lib/cache";
import { forgeGetHealthcheck, forgeUpdateHealthcheck } from "@/lib/tauri";

interface Props { token: string; orgSlug: string; serverId: string; siteId: string; }

export function HealthcheckWidget({ token, orgSlug, serverId, siteId }: Props) {
  const [url, setUrl] = useState("");
  const [loaded, setLoaded] = useState(false);
  const [loading, setLoading] = useState(false);
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState("");
  const [saving, setSaving] = useState(false);

  const load = async (force = false) => {
    setLoading(true);
    if (force) invalidateCache(`site:${siteId}:healthcheck`);
    try {
      const u = await cachedFetch(`site:${siteId}:healthcheck`, () => forgeGetHealthcheck(token, orgSlug, serverId, siteId));
      setUrl(u); setDraft(u); setLoaded(true);
    } catch { setLoaded(true); }
    setLoading(false);
  };

  if (!loaded && !loading) load();

  const save = async () => {
    setSaving(true);
    try {
      await forgeUpdateHealthcheck(token, orgSlug, serverId, siteId, draft.trim());
      setUrl(draft.trim()); setEditing(false);
      invalidateCache(`site:${siteId}:healthcheck`);
      toast.success("Healthcheck updated");
    } catch (err) { toast.error(`Failed: ${err}`); }
    setSaving(false);
  };

  if (loading) {
    return <div className="flex h-32 items-center justify-center"><RefreshCw className="h-4 w-4 animate-spin text-muted-foreground" /></div>;
  }

  return (
    <div className="p-4 space-y-4">
      <div className="rounded-lg border border-border/30 p-4">
        <div className="flex items-start gap-3">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-emerald-500/10">
            <HeartPulse className="h-5 w-5 text-emerald-500" />
          </div>
          <div className="flex-1 min-w-0">
            <h3 className="text-sm font-semibold">Healthcheck URL</h3>
            <p className="text-xs text-muted-foreground mt-0.5">
              Forge will ping this URL after each deployment to verify your site is healthy.
              If the URL returns a non-2xx response, the deployment will be marked as failed.
            </p>
            <div className="mt-3">
              {editing ? (
                <div className="flex items-center gap-2">
                  <Input
                    value={draft}
                    onChange={(e) => setDraft(e.target.value)}
                    placeholder="https://example.com/health"
                    className="h-8 text-xs font-mono flex-1"
                    autoFocus
                    onKeyDown={(e) => e.key === "Enter" && save()}
                  />
                  <Button size="sm" className="h-8 text-xs gap-1" onClick={save} disabled={saving}>
                    {saving ? <RefreshCw className="h-3 w-3 animate-spin" /> : <Save className="h-3 w-3" />}
                    {t("app.save")}
                  </Button>
                  <Button size="sm" variant="ghost" className="h-8 text-xs" onClick={() => { setDraft(url); setEditing(false); }}>
                    <X className="h-3 w-3" />
                  </Button>
                </div>
              ) : (
                <div className="flex items-center gap-2">
                  {url ? (
                    <code className="text-sm font-mono text-emerald-500 bg-emerald-500/5 rounded px-2 py-1">{url}</code>
                  ) : (
                    <span className="text-xs text-muted-foreground italic">Not configured</span>
                  )}
                  <Button size="sm" variant="ghost" className="h-7 text-xs gap-1" onClick={() => { setDraft(url); setEditing(true); }}>
                    <Pencil className="h-3 w-3" /> {t("app.edit")}
                  </Button>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
