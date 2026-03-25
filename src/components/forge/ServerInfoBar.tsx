import { StatusDot } from "./shared/StatusDot";
import type { ForgeServer } from "@/lib/tauri";

interface Props {
  server: ForgeServer;
}

export function ServerInfoBar({ server }: Props) {
  const pills = [
    server.ip_address,
    server.provider,
    server.ubuntu_version && `Ubuntu ${server.ubuntu_version}`,
    server.php_version?.toUpperCase(),
    server.database_type,
  ].filter(Boolean);

  return (
    <div className="flex items-center gap-2.5 px-4 py-2 border-b border-border/30 bg-card/20">
      <div className="flex items-center gap-2 min-w-0">
        <StatusDot active={server.is_ready} size="md" />
        <h2 className="text-sm font-semibold truncate">{server.name}</h2>
      </div>
      <div className="flex items-center gap-1 flex-wrap">
        {pills.map((pill, i) => (
          <span key={i} className="rounded bg-muted/30 px-1.5 py-0.5 text-xs font-mono text-muted-foreground/60">
            {pill}
          </span>
        ))}
      </div>
    </div>
  );
}
