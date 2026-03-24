import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Trash2, Plus, RefreshCw, AlertCircle } from "lucide-react";
import { EmptyState } from "./EmptyState";
import type { LucideIcon } from "lucide-react";

interface CrudListProps<T> {
  items: T[];
  loading?: boolean;
  emptyIcon: LucideIcon;
  emptyTitle: string;
  emptyDescription?: string;
  renderItem: (item: T) => React.ReactNode;
  getItemId: (item: T) => string;
  onDelete?: (id: string) => Promise<void>;
  onCreate?: (values: Record<string, string>) => Promise<void>;
  createFields?: { key: string; placeholder: string; type?: string }[];
  createLabel?: string;
}

export function CrudList<T>({
  items,
  loading,
  emptyIcon,
  emptyTitle,
  emptyDescription,
  renderItem,
  getItemId,
  onDelete,
  onCreate,
  createFields = [],
  createLabel = "Add",
}: CrudListProps<T>) {
  const [showCreate, setShowCreate] = useState(false);
  const [creating, setCreating] = useState(false);
  const [deleting, setDeleting] = useState<string | null>(null);
  const [formValues, setFormValues] = useState<Record<string, string>>({});
  const [error, setError] = useState<string | null>(null);

  const handleCreate = async () => {
    if (!onCreate) return;
    setCreating(true);
    setError(null);
    try {
      await onCreate(formValues);
      setFormValues({});
      setShowCreate(false);
    } catch (err) {
      setError(String(err));
    }
    setCreating(false);
  };

  const handleDelete = async (id: string) => {
    if (!onDelete) return;
    setDeleting(id);
    setError(null);
    try {
      await onDelete(id);
    } catch (err) {
      setError(String(err));
    }
    setDeleting(null);
  };

  if (loading) {
    return (
      <div className="flex h-32 items-center justify-center">
        <RefreshCw className="h-4 w-4 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="space-y-2">
      {/* Error */}
      {error && (
        <div className="flex items-center gap-2 rounded-md border border-red-500/20 bg-red-500/5 px-3 py-2 text-xs text-red-400">
          <AlertCircle className="h-3.5 w-3.5 shrink-0" />
          <span className="truncate">{error}</span>
          <button onClick={() => setError(null)} className="ml-auto text-red-400/50 hover:text-red-400">x</button>
        </div>
      )}

      {/* Create form */}
      {onCreate && (
        <div>
          {showCreate ? (
            <div className="rounded-lg border border-border/50 bg-card/30 p-3 space-y-2">
              {createFields.map((field) => (
                <Input
                  key={field.key}
                  type={field.type || "text"}
                  placeholder={field.placeholder}
                  className="h-8 text-xs bg-transparent"
                  value={formValues[field.key] || ""}
                  onChange={(e) => setFormValues({ ...formValues, [field.key]: e.target.value })}
                />
              ))}
              <div className="flex gap-2">
                <Button
                  size="sm"
                  className="h-7 text-xs bg-emerald-600 hover:bg-emerald-700 text-white"
                  onClick={handleCreate}
                  disabled={creating}
                >
                  {creating ? <RefreshCw className="h-3 w-3 animate-spin mr-1" /> : <Plus className="h-3 w-3 mr-1" />}
                  {createLabel}
                </Button>
                <Button size="sm" variant="ghost" className="h-7 text-xs" onClick={() => { setShowCreate(false); setFormValues({}); }}>
                  Cancel
                </Button>
              </div>
            </div>
          ) : (
            <Button
              size="sm"
              variant="ghost"
              className="h-7 gap-1 text-xs text-muted-foreground hover:text-foreground"
              onClick={() => setShowCreate(true)}
            >
              <Plus className="h-3 w-3" />
              {createLabel}
            </Button>
          )}
        </div>
      )}

      {/* Items */}
      {items.length === 0 && !showCreate ? (
        <EmptyState icon={emptyIcon} title={emptyTitle} description={emptyDescription} />
      ) : (
        <div className="divide-y divide-border/30">
          {items.map((item) => {
            const id = getItemId(item);
            return (
              <div key={id} className="flex items-center gap-2 py-2 group">
                <div className="flex-1 min-w-0">{renderItem(item)}</div>
                {onDelete && (
                  <Button
                    size="icon"
                    variant="ghost"
                    className="h-6 w-6 shrink-0 opacity-0 group-hover:opacity-100 transition-opacity text-muted-foreground hover:text-red-400"
                    onClick={() => handleDelete(id)}
                    disabled={deleting === id}
                  >
                    {deleting === id ? (
                      <RefreshCw className="h-3 w-3 animate-spin" />
                    ) : (
                      <Trash2 className="h-3 w-3" />
                    )}
                  </Button>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
