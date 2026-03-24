import { Server } from "lucide-react";
import { StatusDot } from "./shared/StatusDot";
import type { ForgeServer } from "@/lib/tauri";

interface Props {
  server: ForgeServer;
}

export function ServerInfoBar({ server }: Props) {
  return (
    <div className="flex items-center gap-3 rounded-lg border border-border/50 bg-card/50 px-4 py-3">
      <div className="flex h-9 w-9 items-center justify-center rounded-md bg-emerald-500/10">
        <Server className="h-4 w-4 text-emerald-500" />
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <h2 className="text-sm font-semibold truncate">{server.name}</h2>
          <StatusDot active={server.is_ready} />
        </div>
        <div className="flex items-center gap-1.5 text-[11px] text-muted-foreground">
          <span className="font-mono">{server.ip_address}</span>
          <span className="text-border">|</span>
          <span>{server.provider}</span>
          {server.ubuntu_version && (
            <>
              <span className="text-border">|</span>
              <span>Ubuntu {server.ubuntu_version}</span>
            </>
          )}
          {server.php_version && (
            <>
              <span className="text-border">|</span>
              <span className="text-emerald-500/80">{server.php_version.toUpperCase()}</span>
            </>
          )}
          {server.database_type && (
            <>
              <span className="text-border">|</span>
              <span>{server.database_type}</span>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
