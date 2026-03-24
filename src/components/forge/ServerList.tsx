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
    <div className="w-52 shrink-0 flex flex-col gap-1.5 overflow-auto">
      <span className="text-[10px] font-medium uppercase tracking-wider text-muted-foreground px-2 mb-1">
        {t("forge.servers")}
      </span>
      {servers.map((server) => {
        const active = server.id === selectedId;
        return (
          <div
            key={server.id}
            className={`flex cursor-pointer items-center gap-2.5 rounded-lg px-2.5 py-2 transition-all ${
              active ? "bg-muted/70" : "hover:bg-muted/30"
            }`}
            onClick={() => onSelect(server)}
          >
            <div className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-md ${
              active ? "bg-emerald-500/15" : "bg-muted/50"
            }`}>
              <Server className={`h-3.5 w-3.5 ${active ? "text-emerald-500" : "text-muted-foreground"}`} />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-[12px] font-medium truncate">{server.name}</p>
              <p className="text-[10px] text-muted-foreground font-mono truncate">
                {server.ip_address || "No IP"}
              </p>
            </div>
            <StatusDot active={server.is_ready} />
          </div>
        );
      })}
      {servers.length === 0 && (
        <p className="py-8 text-center text-[10px] text-muted-foreground">
          {t("forge.noServers")}
        </p>
      )}
    </div>
  );
}
