import { useState } from "react";
import { Pencil, Save, X, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";

interface Field {
  key: string;
  label: string;
  type?: "text" | "number" | "select";
  options?: { value: string; label: string }[];
  placeholder?: string;
}

interface EditDialogProps {
  open: boolean;
  title: string;
  fields: Field[];
  values: Record<string, string | number>;
  onSave: (values: Record<string, unknown>) => Promise<void>;
  onCancel: () => void;
}

export function EditDialog({ open, title, fields, values: initialValues, onSave, onCancel }: EditDialogProps) {
  const [values, setValues] = useState<Record<string, string | number>>(initialValues);
  const [saving, setSaving] = useState(false);
  const [lastValues, setLastValues] = useState(initialValues);

  // Sync values when dialog opens with new data
  if (open && JSON.stringify(initialValues) !== JSON.stringify(lastValues)) {
    setValues(initialValues);
    setLastValues(initialValues);
  }

  if (!open) return null;

  const handleSave = async () => {
    setSaving(true);
    try {
      await onSave(values);
      toast.success(`${title} updated`);
      onCancel();
    } catch (err) {
      toast.error(`Failed: ${err}`);
    }
    setSaving(false);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onCancel} />
      <div className="relative w-full max-w-md rounded-xl border border-border bg-card p-6 shadow-2xl mx-4 space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-base font-semibold">{title}</h3>
          <button onClick={onCancel} className="text-muted-foreground hover:text-foreground">
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="space-y-3">
          {fields.map((field) => (
            <div key={field.key}>
              <label className="text-xs font-medium text-muted-foreground mb-1 block">{field.label}</label>
              {field.type === "select" && field.options ? (
                <select
                  value={values[field.key] || ""}
                  onChange={(e) => setValues({ ...values, [field.key]: e.target.value })}
                  className="h-9 w-full rounded-md border bg-transparent px-3 text-sm"
                >
                  {field.options.map((opt) => (
                    <option key={opt.value} value={opt.value}>{opt.label}</option>
                  ))}
                </select>
              ) : (
                <Input
                  type={field.type === "number" ? "number" : "text"}
                  value={values[field.key] || ""}
                  onChange={(e) => setValues({ ...values, [field.key]: field.type === "number" ? Number(e.target.value) : e.target.value })}
                  placeholder={field.placeholder}
                  className="h-9 text-sm"
                />
              )}
            </div>
          ))}
        </div>

        <div className="flex gap-3">
          <Button variant="outline" className="flex-1 h-9" onClick={onCancel}>Cancel</Button>
          <Button className="flex-1 h-9" onClick={handleSave} disabled={saving}>
            {saving ? <RefreshCw className="h-4 w-4 animate-spin mr-2" /> : <Save className="h-4 w-4 mr-2" />}
            Save
          </Button>
        </div>
      </div>
    </div>
  );
}

/** Small edit button to trigger EditDialog */
export function EditButton({ onClick }: { onClick: () => void }) {
  return (
    <Button size="icon" variant="ghost" className="h-6 w-6 opacity-0 group-hover:opacity-100 text-muted-foreground hover:text-primary" onClick={onClick}>
      <Pencil className="h-3 w-3" />
    </Button>
  );
}
