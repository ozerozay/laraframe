import { Server } from "lucide-react";
import { StatusDot } from "./shared/StatusDot";
import { t } from "@/lib/i18n";
import type { ForgeServer } from "@/lib/tauri";

interface Props {
  servers: ForgeServer[];
  selectedId: string | null;
  onSelect: (server: ForgeServer) => void;
}

export function ServerList({ servers, selectedId, onSelect }: Props) {
  return (
    <div className="w-56 shrink-0 flex flex-col overflow-auto">
      <div className="px-3 py-2.5">
        <span className="text-sm font-semibold tracking-[0.15em] uppercase text-muted-foreground/40">
          {t("forge.servers")}
        </span>
      </div>
      <div className="flex-1 px-1.5 space-y-0.5">
        {servers.map((server) => {
          const active = server.id === selectedId;
          return (
            <button
              key={server.id}
              className={`w-full flex items-center gap-2 rounded-md px-2 py-1.5 text-left transition-all ${
                active
                  ? "bg-primary/8 text-foreground"
                  : "text-muted-foreground hover:bg-muted/40 hover:text-foreground"
              }`}
              onClick={() => onSelect(server)}
            >
              <div className={`flex h-6 w-6 shrink-0 items-center justify-center rounded ${
                active ? "bg-primary/15 text-primary" : "bg-muted/30"
              }`}>
                <Server className="h-3 w-3" />
              </div>
              <div className="flex-1 min-w-0">
                <p className={`text-sm font-medium truncate ${active ? "text-foreground" : ""}`}>{server.name}</p>
                <p className="text-sm text-muted-foreground/60 font-mono truncate">{server.ip_address || "—"}</p>
              </div>
              <StatusDot active={server.is_ready} />
            </button>
          );
        })}
      </div>
      {servers.length === 0 && (
        <div className="flex-1 flex items-center justify-center">
          <p className="text-xs text-muted-foreground/40">{t("forge.noServers")}</p>
        </div>
      )}
    </div>
  );
}
