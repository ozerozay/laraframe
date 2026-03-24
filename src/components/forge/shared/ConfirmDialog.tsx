import { useState } from "react";
import { AlertTriangle, Trash2, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { t } from "@/lib/i18n";

interface ConfirmDialogProps {
  open: boolean;
  title: string;
  description: string;
  confirmText?: string;
  /** If set, user must type this exact text to confirm (for dangerous actions) */
  typeToConfirm?: string;
  variant?: "danger" | "warning";
  loading?: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}

export function ConfirmDialog({
  open,
  title,
  description,
  confirmText,
  typeToConfirm,
  variant = "danger",
  loading = false,
  onConfirm,
  onCancel,
}: ConfirmDialogProps) {
  const [typed, setTyped] = useState("");

  if (!open) return null;

  const canConfirm = !typeToConfirm || typed === typeToConfirm;
  const isDanger = variant === "danger";

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onCancel} />

      {/* Dialog */}
      <div className="relative w-full max-w-md rounded-xl border border-border bg-card p-6 shadow-2xl mx-4">
        {/* Icon */}
        <div className={`mx-auto flex h-12 w-12 items-center justify-center rounded-full ${
          isDanger ? "bg-red-500/10" : "bg-amber-500/10"
        }`}>
          {isDanger ? (
            <Trash2 className="h-6 w-6 text-red-500" />
          ) : (
            <AlertTriangle className="h-6 w-6 text-amber-500" />
          )}
        </div>

        {/* Content */}
        <div className="mt-4 text-center">
          <h3 className="text-base font-semibold">{title}</h3>
          <p className="mt-2 text-sm text-muted-foreground leading-relaxed">{description}</p>
        </div>

        {/* Type to confirm */}
        {typeToConfirm && (
          <div className="mt-4">
            <p className="text-xs text-muted-foreground mb-2">
              Type <span className="font-mono font-semibold text-foreground">{typeToConfirm}</span> to confirm:
            </p>
            <Input
              value={typed}
              onChange={(e) => setTyped(e.target.value)}
              placeholder={typeToConfirm}
              className="h-9 text-sm font-mono"
              autoFocus
            />
          </div>
        )}

        {/* Actions */}
        <div className="mt-6 flex gap-3">
          <Button
            variant="outline"
            className="flex-1 h-9"
            onClick={() => { setTyped(""); onCancel(); }}
            disabled={loading}
          >
            {t("app.cancel")}
          </Button>
          <Button
            className={`flex-1 h-9 ${
              isDanger
                ? "bg-red-600 hover:bg-red-700 text-white"
                : "bg-amber-600 hover:bg-amber-700 text-white"
            }`}
            onClick={() => { setTyped(""); onConfirm(); }}
            disabled={!canConfirm || loading}
          >
            {loading ? (
              <RefreshCw className="h-4 w-4 animate-spin mr-2" />
            ) : isDanger ? (
              <Trash2 className="h-4 w-4 mr-2" />
            ) : null}
            {confirmText || t("app.delete")}
          </Button>
        </div>
      </div>
    </div>
  );
}
