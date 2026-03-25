import { useState } from "react";
import { ScrollText, Plus, Trash2, RefreshCw, Play, Pencil, X, Save, ChevronRight, ChevronDown } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { t } from "@/lib/i18n";
import { timeAgo } from "@/lib/helpers";
import { cachedFetch, invalidateCache } from "@/lib/cache";
import { EmptyState } from "../shared/EmptyState";
import { ConfirmDialog } from "../shared/ConfirmDialog";
import { LogViewer } from "../shared/LogViewer";
import { forgeListRecipes, forgeCreateRecipe, forgeUpdateRecipe, forgeDeleteRecipe, forgeRunRecipe, type ForgeRecipe } from "@/lib/tauri";

interface Props { token: string; orgSlug: string; serverId: string; }

export function RecipesWidget({ token, orgSlug, serverId }: Props) {
  const [recipes, setRecipes] = useState<ForgeRecipe[]>([]);
  const [loaded, setLoaded] = useState(false);
  const [loading, setLoading] = useState(false);

  // Create
  const [showCreate, setShowCreate] = useState(false);
  const [newName, setNewName] = useState("");
  const [newScript, setNewScript] = useState("");
  const [newUser, setNewUser] = useState("root");
  const [creating, setCreating] = useState(false);

  // Expand / Edit
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editName, setEditName] = useState("");
  const [editScript, setEditScript] = useState("");
  const [editUser, setEditUser] = useState("");
  const [saving, setSaving] = useState(false);

  // Run / Delete
  const [runningId, setRunningId] = useState<string | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<ForgeRecipe | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [runTarget, setRunTarget] = useState<ForgeRecipe | null>(null);

  const load = async (force = false) => {
    setLoading(true);
    if (force) invalidateCache(`org:${orgSlug}:recipes`);
    try {
      const r = await cachedFetch(`org:${orgSlug}:recipes`, () => forgeListRecipes(token, orgSlug));
      setRecipes(r); setLoaded(true);
    } catch (err) { console.error("Failed to load recipes:", err); setLoaded(true); }
    setLoading(false);
  };

  if (!loaded && !loading) load();

  const create = async () => {
    if (!newName.trim() || !newScript.trim()) return;
    setCreating(true);
    try {
      await forgeCreateRecipe(token, orgSlug, newName.trim(), newScript.trim(), newUser);
      toast.success(`Recipe "${newName.trim()}" created`);
      setNewName(""); setNewScript(""); setShowCreate(false); load(true);
    } catch (err) { toast.error(`Failed: ${err}`); }
    setCreating(false);
  };

  const update = async (id: string) => {
    setSaving(true);
    try {
      await forgeUpdateRecipe(token, orgSlug, id, editName, editScript, editUser);
      toast.success("Recipe updated");
      setEditingId(null); load(true);
    } catch (err) { toast.error(`Failed: ${err}`); }
    setSaving(false);
  };

  const run = async (id: string) => {
    setRunningId(id);
    try {
      await forgeRunRecipe(token, orgSlug, id, [serverId]);
      toast.success("Recipe running on server");
    } catch (err) { toast.error(`Failed: ${err}`); }
    setRunningId(null);
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      await forgeDeleteRecipe(token, orgSlug, deleteTarget.id);
      toast.success(`Recipe "${deleteTarget.name}" deleted`);
      setDeleteTarget(null); load(true);
    } catch (err) { toast.error(`Failed: ${err}`); }
    setDeleting(false);
  };

  const expand = (recipe: ForgeRecipe) => {
    if (expandedId === recipe.id) { setExpandedId(null); setEditingId(null); return; }
    setExpandedId(recipe.id);
    setEditingId(null);
    setEditName(recipe.name); setEditScript(recipe.script); setEditUser(recipe.user);
  };

  return (
    <div className="flex flex-col h-full">
      <div className="flex items-center justify-between border-b border-border/30 px-4 py-2">
        <span className="text-sm text-muted-foreground">Recipes ({recipes.length})</span>
        <div className="flex gap-1.5">
          <Button size="sm" variant="ghost" className="h-6 gap-1 px-2 text-xs" onClick={() => load(true)}>
            <RefreshCw className="h-3 w-3" /> {t("app.refresh")}
          </Button>
          <Button size="sm" className="h-6 gap-1 px-2 text-xs" onClick={() => setShowCreate(true)}>
            <Plus className="h-3 w-3" /> {t("app.create")} Recipe
          </Button>
        </div>
      </div>

      {/* Create form */}
      {showCreate && (
        <div className="border-b border-border/30 px-4 py-3 bg-muted/20 space-y-2">
          <div className="flex gap-2">
            <Input value={newName} onChange={(e) => setNewName(e.target.value)} placeholder="Recipe name" className="h-8 text-xs flex-1" autoFocus />
            <select value={newUser} onChange={(e) => setNewUser(e.target.value)} className="h-8 rounded-md border bg-transparent px-2 text-xs">
              <option value="root">root</option>
              <option value="forge">forge</option>
            </select>
          </div>
          <textarea value={newScript} onChange={(e) => setNewScript(e.target.value)} placeholder="#!/bin/bash&#10;echo 'Hello from recipe'" className="w-full h-24 rounded-md border bg-transparent px-3 py-2 text-xs font-mono resize-none focus:outline-none focus:ring-1 focus:ring-ring" />
          <div className="flex gap-2">
            <Button size="sm" className="h-8 text-xs" onClick={create} disabled={creating || !newName.trim() || !newScript.trim()}>
              {creating ? <RefreshCw className="h-3 w-3 animate-spin mr-1" /> : null} {t("app.create")}
            </Button>
            <Button size="sm" variant="ghost" className="h-8 text-xs" onClick={() => setShowCreate(false)}>{t("app.cancel")}</Button>
          </div>
        </div>
      )}

      {/* List */}
      <div className="flex-1 overflow-auto">
        {loading && !loaded ? (
          <div className="flex h-32 items-center justify-center"><RefreshCw className="h-4 w-4 animate-spin text-muted-foreground" /></div>
        ) : recipes.length === 0 ? (
          <EmptyState icon={ScrollText} title="No recipes" description="Create reusable scripts to run on your servers" />
        ) : (
          <div className="divide-y divide-border/30">
            {recipes.map((recipe) => {
              const isExpanded = expandedId === recipe.id;
              const isEditing = editingId === recipe.id;
              return (
                <div key={recipe.id}>
                  <div className="flex items-center gap-3 px-4 py-3 group hover:bg-muted/20 cursor-pointer" onClick={() => expand(recipe)}>
                    {isExpanded ? <ChevronDown className="h-3 w-3 text-muted-foreground" /> : <ChevronRight className="h-3 w-3 text-muted-foreground" />}
                    <ScrollText className="h-4 w-4 text-muted-foreground shrink-0" />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate">{recipe.name}</p>
                      <p className="text-xs text-muted-foreground">as {recipe.user} · {timeAgo(recipe.created_at)}</p>
                    </div>
                    <Button size="sm" variant="outline" className="h-6 gap-1 px-2 text-xs opacity-0 group-hover:opacity-100"
                      onClick={(e) => { e.stopPropagation(); setRunTarget(recipe); }} disabled={runningId === recipe.id}>
                      {runningId === recipe.id ? <RefreshCw className="h-3 w-3 animate-spin" /> : <Play className="h-3 w-3" />}
                      Run
                    </Button>
                    <Button size="icon" variant="ghost" className="h-6 w-6 opacity-0 group-hover:opacity-100 text-muted-foreground hover:text-red-400"
                      onClick={(e) => { e.stopPropagation(); setDeleteTarget(recipe); }} aria-label="Delete">
                      <Trash2 className="h-3 w-3" />
                    </Button>
                  </div>

                  {isExpanded && (
                    <div className="border-t border-border/20 bg-muted/5 p-4">
                      {isEditing ? (
                        <div className="space-y-2">
                          <div className="flex gap-2">
                            <Input value={editName} onChange={(e) => setEditName(e.target.value)} className="h-8 text-xs flex-1" />
                            <select value={editUser} onChange={(e) => setEditUser(e.target.value)} className="h-8 rounded-md border bg-transparent px-2 text-xs">
                              <option value="root">root</option>
                              <option value="forge">forge</option>
                            </select>
                          </div>
                          <textarea value={editScript} onChange={(e) => setEditScript(e.target.value)} className="w-full h-32 rounded-md border bg-zinc-100 dark:bg-zinc-950 px-3 py-2 text-xs font-mono resize-none focus:outline-none focus:ring-1 focus:ring-ring" />
                          <div className="flex gap-2">
                            <Button size="sm" className="h-7 gap-1 text-xs" onClick={() => update(recipe.id)} disabled={saving}>
                              {saving ? <RefreshCw className="h-3 w-3 animate-spin" /> : <Save className="h-3 w-3" />} {t("app.save")}
                            </Button>
                            <Button size="sm" variant="ghost" className="h-7 text-xs" onClick={() => setEditingId(null)}>
                              <X className="h-3 w-3 mr-1" /> {t("app.cancel")}
                            </Button>
                          </div>
                        </div>
                      ) : (
                        <div>
                          <div className="flex items-center justify-between mb-2">
                            <Badge variant="outline" className="text-xs">as {recipe.user}</Badge>
                            <Button size="sm" variant="ghost" className="h-6 gap-1 px-2 text-xs" onClick={() => setEditingId(recipe.id)}>
                              <Pencil className="h-3 w-3" /> {t("app.edit")}
                            </Button>
                          </div>
                          <div className="rounded-md bg-zinc-100 dark:bg-zinc-950 px-2 py-3 font-mono text-xs leading-5 max-h-48 overflow-auto">
                            <LogViewer content={recipe.script} color="amber" />
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>

      <ConfirmDialog open={!!deleteTarget} title="Delete Recipe" description={`Delete recipe "${deleteTarget?.name}"? This cannot be undone.`} variant="danger" loading={deleting} onConfirm={handleDelete} onCancel={() => setDeleteTarget(null)} />
      <ConfirmDialog open={!!runTarget} title="Run Recipe" description={`Run recipe "${runTarget?.name}" on this server as ${runTarget?.user}?`} variant="warning" confirmText="Run" loading={runningId === runTarget?.id} onConfirm={() => { if (runTarget) { run(runTarget.id); setRunTarget(null); } }} onCancel={() => setRunTarget(null)} />
    </div>
  );
}
