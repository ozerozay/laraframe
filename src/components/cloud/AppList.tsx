import { Box } from "lucide-react";
import { t } from "@/lib/i18n";
import type { CloudApplication } from "@/lib/tauri";

interface Props {
  apps: CloudApplication[];
  selectedId: string | null;
  onSelect: (app: CloudApplication) => void;
}

export function AppList({ apps, selectedId, onSelect }: Props) {
  return (
    <div className="w-56 shrink-0 flex flex-col overflow-auto">
      <div className="px-3 py-2.5">
        <span className="text-xs font-semibold tracking-[0.15em] uppercase text-muted-foreground/40">
          {t("cloud.applications")}
        </span>
      </div>
      <div className="flex-1 px-1.5 space-y-0.5">
        {apps.map((app) => {
          const active = app.id === selectedId;
          return (
            <button
              key={app.id}
              className={`w-full flex items-center gap-2 rounded-md px-2 py-1.5 text-left transition-all ${
                active ? "bg-primary/8 text-foreground" : "text-muted-foreground hover:bg-muted/40 hover:text-foreground"
              }`}
              onClick={() => onSelect(app)}
            >
              {app.avatar_url ? (
                <img src={app.avatar_url} className="h-6 w-6 shrink-0 rounded" alt="" />
              ) : (
                <div className={`flex h-6 w-6 shrink-0 items-center justify-center rounded ${
                  active ? "bg-primary/15 text-primary" : "bg-muted/30"
                }`}>
                  <Box className="h-3 w-3" />
                </div>
              )}
              <div className="flex-1 min-w-0">
                <p className={`text-sm font-medium truncate ${active ? "text-foreground" : ""}`}>{app.name}</p>
                <p className="text-xs text-muted-foreground/60 truncate">{app.region}</p>
              </div>
            </button>
          );
        })}
      </div>
      {apps.length === 0 && (
        <div className="flex-1 flex items-center justify-center">
          <p className="text-xs text-muted-foreground/40">{t("cloud.noApps")}</p>
        </div>
      )}
    </div>
  );
}
