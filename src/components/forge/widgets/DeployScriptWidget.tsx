import { useState } from "react";
import { FileCode2, Save, Pencil, X, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { t } from "@/lib/i18n";
import { cachedFetch, invalidateCache } from "@/lib/cache";
import { LogViewer } from "../shared/LogViewer";
import { forgeGetDeployScript, forgeUpdateDeployScript } from "@/lib/tauri";
import { ConfirmDialog } from "../shared/ConfirmDialog";

interface Props {
  token: string;
  orgSlug: string;
  serverId: string;
  siteId: string;
}

export function DeployScriptWidget({ token, orgSlug, serverId, siteId }: Props) {
  const [content, setContent] = useState("");
  const [loaded, setLoaded] = useState(false);
  const [loading, setLoading] = useState(false);
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState("");
  const [saving, setSaving] = useState(false);
  const [showSaveConfirm, setShowSaveConfirm] = useState(false);

  const load = async (force = false) => {
    setLoading(true);
    if (force) invalidateCache(`site:${siteId}:deployscript`);
    try {
      const script = await cachedFetch(`site:${siteId}:deployscript`, () =>
        forgeGetDeployScript(token, orgSlug, serverId, siteId)
      );
      setContent(script);
      setDraft(script);
      setLoaded(true);
    } catch {
      toast.error("Failed to load deploy script");
      setLoaded(true);
    }
    setLoading(false);
  };

  if (!loaded && !loading) load();

  const save = async () => {
    setSaving(true);
    try {
      await forgeUpdateDeployScript(token, orgSlug, serverId, siteId, draft);
      setContent(draft);
      setEditing(false);
      invalidateCache(`site:${siteId}:deployscript`);
      toast.success("Deploy script updated");
    } catch (err) {
      toast.error(`Failed: ${err}`);
    }
    setSaving(false);
  };

  return (
    <div className="flex flex-col h-full">
      <div className="flex items-center justify-between border-b border-border/30 px-4 py-2">
        <span className="text-sm text-muted-foreground font-mono">deploy.sh</span>
        <div className="flex items-center gap-1.5">
          {editing ? (
            <>
              <Button size="sm" className="h-6 gap-1 px-2 text-xs bg-emerald-600 hover:bg-emerald-700 text-white" onClick={() => setShowSaveConfirm(true)} disabled={saving}>
                {saving ? <RefreshCw className="h-2.5 w-2.5 animate-spin" /> : <Save className="h-2.5 w-2.5" />}
                {saving ? t("app.saving") : t("app.save")}
              </Button>
              <Button size="sm" variant="ghost" className="h-6 gap-1 px-2 text-xs" onClick={() => { setDraft(content); setEditing(false); }}>
                <X className="h-2.5 w-2.5" /> {t("app.cancel")}
              </Button>
            </>
          ) : (
            <>
              <Button size="sm" variant="ghost" className="h-6 gap-1 px-2 text-xs" onClick={() => load(true)}>
                <RefreshCw className="h-2.5 w-2.5" /> {t("app.refresh")}
              </Button>
              <Button size="sm" variant="ghost" className="h-6 gap-1 px-2 text-xs" onClick={() => { setDraft(content); setEditing(true); }}>
                <Pencil className="h-2.5 w-2.5" /> {t("app.edit")}
              </Button>
            </>
          )}
        </div>
      </div>
      {loading ? (
        <div className="flex flex-1 items-center justify-center bg-zinc-100 dark:bg-zinc-950">
          <RefreshCw className="h-4 w-4 animate-spin text-muted-foreground" />
        </div>
      ) : editing ? (
        <textarea
          className="flex-1 resize-none bg-zinc-100 dark:bg-zinc-950 px-2 py-3 pl-10 font-mono text-sm leading-5 text-foreground/80 focus:outline-none w-full"
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          spellCheck={false}
        />
      ) : (
        <div className="flex-1 overflow-auto bg-zinc-100 dark:bg-zinc-950 px-2 py-3 font-mono text-sm leading-5">
          {content ? <LogViewer content={content} color="amber" /> : (
            <div className="flex h-full items-center justify-center text-muted-foreground/40">
              <FileCode2 className="h-5 w-5 mr-2" />
              <span className="text-xs">No deploy script</span>
            </div>
          )}
        </div>
      )}
      <ConfirmDialog
        open={showSaveConfirm}
        title="Update Deploy Script"
        description="This script runs during every deployment. An incorrect script could cause deploy failures."
        variant="warning"
        confirmText="Update"
        loading={saving}
        onConfirm={() => { setShowSaveConfirm(false); save(); }}
        onCancel={() => setShowSaveConfirm(false)}
      />
    </div>
  );
}
