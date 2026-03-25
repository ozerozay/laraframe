import { useState } from "react";
import { FileCode2, Pencil, Save, X, RefreshCw, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { EnvHighlighted } from "../shared/EnvHighlighted";
import { toast } from "sonner";
import { cachedFetch, invalidateCache } from "@/lib/cache";
import { forgeGetEnv, forgeUpdateEnv } from "@/lib/tauri";
import { t } from "@/lib/i18n";
import { ConfirmDialog } from "../shared/ConfirmDialog";

interface Props {
  token: string;
  orgSlug: string;
  serverId: string;
  siteId: string;
}

export function EnvWidget({ token, orgSlug, serverId, siteId }: Props) {
  const [content, setContent] = useState("");
  const [loaded, setLoaded] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState("");
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [showSaveConfirm, setShowSaveConfirm] = useState(false);

  const load = async (force = false) => {
    setLoading(true);
    setError(null);
    if (force) invalidateCache(`site:${siteId}:env`);
    try {
      const env = await cachedFetch(`site:${siteId}:env`, () =>
        forgeGetEnv(token, orgSlug, serverId, siteId)
      );
      setContent(env);
      setDraft(env);
      setLoaded(true);
    } catch (err) {
      setError(String(err));
    }
    setLoading(false);
  };

  // Load on first render
  if (!loaded && !loading && !error) {
    load();
  }

  const save = async () => {
    setSaving(true);
    setSaveError(null);
    try {
      await forgeUpdateEnv(token, orgSlug, serverId, siteId, draft);
      setContent(draft);
      setEditing(false);
      invalidateCache(`site:${siteId}:env`);
      toast.success("Environment updated");
    } catch (err) {
      setSaveError(String(err));
      toast.error("Failed to update environment");
    }
    setSaving(false);
  };

  return (
    <div className="flex flex-1 flex-col min-h-0">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-border/30 px-4 py-2">
        <span className="text-sm text-muted-foreground font-mono">.env</span>
        <div className="flex items-center gap-1.5">
          {loaded && !loading && !error && (
            editing ? (
              <>
                <Button
                  size="sm"
                  className="h-6 gap-1 px-2 text-xs bg-emerald-600 hover:bg-emerald-700 text-white"
                  onClick={() => setShowSaveConfirm(true)}
                  disabled={saving}
                >
                  {saving ? <RefreshCw className="h-2.5 w-2.5 animate-spin" /> : <Save className="h-2.5 w-2.5" />}
                  {saving ? t("app.saving") : t("app.save")}
                </Button>
                <Button
                  size="sm"
                  variant="ghost"
                  className="h-6 gap-1 px-2 text-xs"
                  onClick={() => { setDraft(content); setEditing(false); setSaveError(null); }}
                >
                  <X className="h-2.5 w-2.5" /> {t("app.cancel")}
                </Button>
              </>
            ) : (
              <>
                <Button size="sm" variant="ghost" className="h-6 gap-1 px-2 text-xs" onClick={() => load(true)}>
                  <RefreshCw className="h-2.5 w-2.5" /> {t("app.refresh")}
                </Button>
                <Button
                  size="sm"
                  variant="ghost"
                  className="h-6 gap-1 px-2 text-xs"
                  onClick={() => { setDraft(content); setEditing(true); }}
                >
                  <Pencil className="h-2.5 w-2.5" /> {t("app.edit")}
                </Button>
              </>
            )
          )}
        </div>
      </div>

      {/* Save error */}
      {saveError && (
        <div className="flex items-center gap-2 border-b border-red-500/20 bg-red-500/5 px-4 py-2 text-xs text-red-400">
          <AlertCircle className="h-3 w-3 shrink-0" />
          <span className="truncate">{saveError}</span>
          <button onClick={() => setSaveError(null)} className="ml-auto text-red-400/50 hover:text-red-400">x</button>
        </div>
      )}

      {/* Content */}
      {loading ? (
        <div className="flex flex-1 items-center justify-center bg-zinc-100 dark:bg-zinc-950">
          <div className="flex items-center gap-2 text-muted-foreground">
            <RefreshCw className="h-3.5 w-3.5 animate-spin" />
            <span className="text-xs">{t("site.envLoading")}</span>
          </div>
        </div>
      ) : error ? (
        <div className="flex flex-1 flex-col items-center justify-center gap-2 bg-zinc-100 dark:bg-zinc-950">
          <AlertCircle className="h-5 w-5 text-red-400/60" />
          <p className="text-sm text-red-400/80 max-w-xs text-center">{error}</p>
          <button
            onClick={() => { setError(null); setLoaded(false); }}
            className="text-xs text-muted-foreground hover:text-foreground underline"
          >
            {t("app.retry")}
          </button>
        </div>
      ) : editing ? (
        <textarea
          className="flex-1 resize-none bg-zinc-100 dark:bg-zinc-950 px-2 py-3 pl-10 font-mono text-sm leading-5 text-amber-700 dark:text-amber-300/80 focus:outline-none w-full"
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          spellCheck={false}
          autoCapitalize="off"
          autoCorrect="off"
        />
      ) : (
        <div className="flex-1 overflow-auto bg-zinc-100 dark:bg-zinc-950 px-2 py-3 font-mono text-sm leading-5">
          {!content ? (
            <div className="flex h-full min-h-32 flex-col items-center justify-center gap-2 text-muted-foreground/40">
              <FileCode2 className="h-5 w-5" />
              <span className="text-sm">{t("site.envNoFile")}</span>
            </div>
          ) : (
            <EnvHighlighted content={content} />
          )}
        </div>
      )}
      <ConfirmDialog
        open={showSaveConfirm}
        title="Update Environment"
        description="This will update the .env file on your production server. Changes take effect immediately. Are you sure?"
        variant="warning"
        confirmText="Update"
        loading={saving}
        onConfirm={() => { setShowSaveConfirm(false); save(); }}
        onCancel={() => setShowSaveConfirm(false)}
      />
    </div>
  );
}
