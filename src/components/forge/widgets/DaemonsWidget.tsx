import { useState } from "react";
import { Cog, Plus, Trash2, RefreshCw, RotateCcw, ChevronRight, ChevronDown } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { t } from "@/lib/i18n";
import { cachedFetch, invalidateCache } from "@/lib/cache";
import { EmptyState } from "../shared/EmptyState";
import { ConfirmDialog } from "../shared/ConfirmDialog";
import { LogViewer } from "../shared/LogViewer";
import { forgeListDaemons, forgeCreateDaemon, forgeDeleteDaemon, forgeRestartDaemon, forgeGetDaemonLog, type ForgeDaemon } from "@/lib/tauri";

interface Props { token: string; orgSlug: string; serverId: string; }

export function DaemonsWidget({ token, orgSlug, serverId }: Props) {
  const [daemons, setDaemons] = useState<ForgeDaemon[]>([]);
  const [loaded, setLoaded] = useState(false);
  const [loading, setLoading] = useState(false);
  const [showCreate, setShowCreate] = useState(false);
  const [command, setCommand] = useState("");
  const [user, setUser] = useState("forge");
  const [directory, setDirectory] = useState("");
  const [processes, setProcesses] = useState("1");
  const [creating, setCreating] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<ForgeDaemon | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [restartingId, setRestartingId] = useState<string | null>(null);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [daemonLog, setDaemonLog] = useState("");
  const [logLoading, setLogLoading] = useState(false);

  const load = async (force = false) => {
    setLoading(true);
    if (force) invalidateCache(`server:${serverId}:daemons`);
    try {
      const d = await cachedFetch(`server:${serverId}:daemons`, () => forgeListDaemons(token, orgSlug, serverId));
      setDaemons(d); setLoaded(true);
    } catch (err) { console.error("Failed to load daemons:", err); setLoaded(true); }
    setLoading(false);
  };

  if (!loaded && !loading) load();

  const create = async () => {
    if (!command.trim()) return;
    setCreating(true);
    try {
      await forgeCreateDaemon(token, orgSlug, serverId, command.trim(), user, directory.trim(), parseInt(processes) || 1);
      toast.success("Daemon created");
      setCommand(""); setDirectory(""); setShowCreate(false); load(true);
    } catch (err) { toast.error(`Failed: ${err}`); }
    setCreating(false);
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      await forgeDeleteDaemon(token, orgSlug, serverId, deleteTarget.id);
      toast.success("Daemon deleted"); setDeleteTarget(null); load(true);
    } catch (err) { toast.error(`Failed: ${err}`); }
    setDeleting(false);
  };

  const restart = async (id: string) => {
    setRestartingId(id);
    try {
      await forgeRestartDaemon(token, orgSlug, serverId, id);
      toast.success("Daemon restarting"); load(true);
    } catch (err) { toast.error(`Failed: ${err}`); }
    setRestartingId(null);
  };

  const toggleLog = async (id: string) => {
    if (expandedId === id) { setExpandedId(null); return; }
    setExpandedId(id);
    setLogLoading(true); setDaemonLog("");
    try {
      const log = await cachedFetch(`daemon:${id}:log`, () => forgeGetDaemonLog(token, orgSlug, serverId, id), 120_000);
      setDaemonLog(log);
    } catch (err) { console.error("Failed to load daemon log:", err); setDaemonLog("Failed to load log."); }
    setLogLoading(false);
  };

  return (
    <div className="flex flex-col h-full">
      <div className="flex items-center justify-between border-b border-border/30 px-4 py-2">
        <span className="text-sm text-muted-foreground">Daemons ({daemons.length})</span>
        <div className="flex gap-1.5">
          <Button size="sm" variant="ghost" className="h-6 gap-1 px-2 text-xs" onClick={() => load(true)}><RefreshCw className="h-3 w-3" /> {t("app.refresh")}</Button>
          <Button size="sm" className="h-6 gap-1 px-2 text-xs" onClick={() => setShowCreate(true)}><Plus className="h-3 w-3" /> {t("app.add")} Daemon</Button>
        </div>
      </div>
      {showCreate && (
        <div className="border-b border-border/30 px-4 py-3 bg-muted/20 space-y-2">
          <Input value={command} onChange={(e) => setCommand(e.target.value)} placeholder="Command (e.g. php artisan queue:work)" className="h-8 text-xs font-mono" autoFocus />
          <div className="flex items-center gap-2">
            <Input value={user} onChange={(e) => setUser(e.target.value)} placeholder="User" className="h-8 text-xs w-24" />
            <Input value={directory} onChange={(e) => setDirectory(e.target.value)} placeholder="Directory (optional)" className="h-8 text-xs flex-1 font-mono" />
            <Input type="number" value={processes} onChange={(e) => setProcesses(e.target.value)} placeholder="Processes" className="h-8 text-xs w-20" min="1" />
            <Button size="sm" className="h-8 text-xs" onClick={create} disabled={creating || !command.trim()}>
              {creating ? <RefreshCw className="h-3 w-3 animate-spin mr-1" /> : null} {t("app.create")}
            </Button>
            <Button size="sm" variant="ghost" className="h-8 text-xs" onClick={() => setShowCreate(false)}>{t("app.cancel")}</Button>
          </div>
        </div>
      )}
      <div className="flex-1 overflow-auto">
        {loading && !loaded ? (
          <div className="flex h-32 items-center justify-center"><RefreshCw className="h-4 w-4 animate-spin text-muted-foreground" /></div>
        ) : daemons.length === 0 ? (
          <EmptyState icon={Cog} title="No daemons" description="Create background processes like queue workers" />
        ) : (
          <div className="divide-y divide-border/30">
            {daemons.map((d) => (
              <div key={d.id}>
                <div className="flex items-center gap-3 px-4 py-3 group hover:bg-muted/20 cursor-pointer" onClick={() => toggleLog(d.id)}>
                  {expandedId === d.id ? <ChevronDown className="h-3 w-3 text-muted-foreground" /> : <ChevronRight className="h-3 w-3 text-muted-foreground" />}
                  <Cog className={`h-4 w-4 shrink-0 ${d.status === "installed" ? "text-emerald-500" : "text-amber-500"}`} />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-mono truncate">{d.command}</p>
                    <div className="flex items-center gap-2 text-xs text-muted-foreground">
                      <span>{d.user}</span>
                      {d.directory && <span className="font-mono truncate">{d.directory}</span>}
                      <span>{d.processes} process{d.processes !== 1 ? "es" : ""}</span>
                    </div>
                  </div>
                  <Badge variant="outline" className={`text-xs font-normal ${d.status === "installed" ? "border-emerald-500/30 text-emerald-500" : "border-amber-500/30 text-amber-500"}`}>
                    {d.status}
                  </Badge>
                  <Button size="icon" variant="ghost" className="h-6 w-6 opacity-0 group-hover:opacity-100 text-muted-foreground hover:text-blue-400"
                    onClick={(e) => { e.stopPropagation(); restart(d.id); }} disabled={restartingId === d.id} title="Restart" aria-label="Restart">
                    {restartingId === d.id ? <RefreshCw className="h-3 w-3 animate-spin" /> : <RotateCcw className="h-3 w-3" />}
                  </Button>
                  <Button size="icon" variant="ghost" className="h-6 w-6 opacity-0 group-hover:opacity-100 text-muted-foreground hover:text-red-400"
                    onClick={(e) => { e.stopPropagation(); setDeleteTarget(d); }} aria-label="Delete">
                    <Trash2 className="h-3 w-3" />
                  </Button>
                </div>
                {expandedId === d.id && (
                  <div className="bg-zinc-100 dark:bg-zinc-950 px-2 py-3 font-mono text-xs leading-5 max-h-[40vh] overflow-auto border-t border-border/20">
                    {logLoading ? (
                      <div className="flex items-center justify-center py-8"><RefreshCw className="h-3.5 w-3.5 animate-spin text-muted-foreground" /></div>
                    ) : <LogViewer content={daemonLog} />}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
      <ConfirmDialog open={!!deleteTarget} title="Delete Daemon" description={`Stop and remove daemon "${deleteTarget?.command}"?`} variant="danger" loading={deleting} onConfirm={handleDelete} onCancel={() => setDeleteTarget(null)} />
    </div>
  );
}
