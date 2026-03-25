import { useState } from "react";
import { Terminal, RefreshCw, Play, ChevronRight, ChevronDown } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { timeAgo } from "@/lib/helpers";
import { cachedFetch, invalidateCache } from "@/lib/cache";
import { EmptyState } from "../shared/EmptyState";
import { LogViewer } from "../shared/LogViewer";
import { ConfirmDialog } from "../shared/ConfirmDialog";
import { forgeListCommands, forgeRunCommand, forgeGetCommandOutput, type ForgeCommand } from "@/lib/tauri";

interface Props {
  token: string;
  orgSlug: string;
  serverId: string;
  siteId: string;
}

export function CommandsWidget({ token, orgSlug, serverId, siteId }: Props) {
  const [commands, setCommands] = useState<ForgeCommand[]>([]);
  const [loaded, setLoaded] = useState(false);
  const [loading, setLoading] = useState(false);
  const [cmd, setCmd] = useState("");
  const [running, setRunning] = useState(false);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [output, setOutput] = useState("");
  const [outputLoading, setOutputLoading] = useState(false);
  const [showRunConfirm, setShowRunConfirm] = useState(false);
  const [pendingCmd, setPendingCmd] = useState("");

  const load = async (force = false) => {
    setLoading(true);
    if (force) invalidateCache(`site:${siteId}:commands`);
    try {
      const cmds = await cachedFetch(`site:${siteId}:commands`, () =>
        forgeListCommands(token, orgSlug, serverId, siteId)
      );
      setCommands(cmds);
      setLoaded(true);
    } catch (err) {
      console.error("Failed to load commands:", err);
      setLoaded(true);
    }
    setLoading(false);
  };

  if (!loaded && !loading) load();

  const run = async () => {
    if (!cmd.trim()) return;
    setRunning(true);
    try {
      await forgeRunCommand(token, orgSlug, serverId, siteId, cmd.trim());
      toast.success(`Command sent: ${cmd.trim()}`);
      setCmd("");
      load(true);
    } catch (err) {
      toast.error(`Failed: ${err}`);
    }
    setRunning(false);
  };

  const toggleOutput = async (cmdId: string) => {
    if (expandedId === cmdId) { setExpandedId(null); return; }
    setExpandedId(cmdId);
    setOutputLoading(true);
    setOutput("");
    try {
      const out = await cachedFetch(`cmd:${cmdId}:output`, () =>
        forgeGetCommandOutput(token, orgSlug, serverId, siteId, cmdId), 300_000
      );
      setOutput(out);
    } catch (err) { console.error("Failed to load command output:", err); setOutput("Failed to load output."); }
    setOutputLoading(false);
  };

  return (
    <div className="flex flex-col h-full">
      {/* Command input */}
      <div className="flex items-center gap-2 border-b border-border/30 px-4 py-2">
        <Terminal className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
        <Input
          value={cmd}
          onChange={(e) => setCmd(e.target.value)}
          placeholder="php artisan migrate --force"
          className="h-8 text-xs font-mono flex-1"
          onKeyDown={(e) => { if (e.key === "Enter" && cmd.trim()) { setPendingCmd(cmd.trim()); setShowRunConfirm(true); } }}
        />
        <Button size="sm" className="h-8 gap-1 text-xs" onClick={() => { if (cmd.trim()) { setPendingCmd(cmd.trim()); setShowRunConfirm(true); } }} disabled={running || !cmd.trim()}>
          {running ? <RefreshCw className="h-3 w-3 animate-spin" /> : <Play className="h-3 w-3" />}
          Run
        </Button>
        <Button size="sm" variant="ghost" className="h-8 text-xs" onClick={() => load(true)} aria-label="Refresh">
          <RefreshCw className="h-3 w-3" />
        </Button>
      </div>

      {/* Command history */}
      <div className="flex-1 overflow-auto">
        {loading && !loaded ? (
          <div className="flex h-32 items-center justify-center">
            <RefreshCw className="h-4 w-4 animate-spin text-muted-foreground" />
          </div>
        ) : commands.length === 0 ? (
          <EmptyState icon={Terminal} title="No commands" description="Run a command above to see history" />
        ) : (
          <div className="divide-y divide-border/30">
            {[...commands].reverse().map((c) => (
              <div key={c.id}>
                <div className="flex items-center gap-2 px-4 py-2.5 hover:bg-muted/20 cursor-pointer transition-colors" onClick={() => toggleOutput(c.id)}>
                  {expandedId === c.id ? <ChevronDown className="h-3 w-3 text-muted-foreground shrink-0" /> : <ChevronRight className="h-3 w-3 text-muted-foreground shrink-0" />}
                  <code className="text-sm font-mono flex-1 truncate">{c.command}</code>
                  <Badge variant="outline" className={`text-sm font-normal ${
                    c.status === "finished" ? "border-emerald-500/30 text-emerald-500"
                    : c.status === "failed" || c.status === "timeout" ? "border-red-500/30 text-red-500"
                    : "border-amber-500/30 text-amber-500"
                  }`}>
                    {c.status}
                  </Badge>
                  <span className="text-xs text-muted-foreground">{timeAgo(c.created_at)}</span>
                </div>
                {expandedId === c.id && (
                  <div className="bg-zinc-100 dark:bg-zinc-950 px-2 py-3 font-mono text-sm leading-5 max-h-[40vh] overflow-auto border-t border-border/20">
                    {outputLoading ? (
                      <div className="flex items-center justify-center py-8">
                        <RefreshCw className="h-3.5 w-3.5 animate-spin text-muted-foreground" />
                      </div>
                    ) : <LogViewer content={output} />}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
      <ConfirmDialog
        open={showRunConfirm}
        title="Run Command"
        description={`Execute "${pendingCmd}" on the server? This runs as the forge user in the site directory.`}
        variant="warning"
        confirmText="Run"
        loading={running}
        onConfirm={() => { setShowRunConfirm(false); run(); }}
        onCancel={() => setShowRunConfirm(false)}
      />
    </div>
  );
}
