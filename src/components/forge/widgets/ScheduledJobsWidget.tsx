import { useState } from "react";
import { Clock, Plus, Trash2, RefreshCw, ChevronRight, ChevronDown } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import { t } from "@/lib/i18n";
import { cachedFetch, invalidateCache } from "@/lib/cache";
import { EmptyState } from "../shared/EmptyState";
import { LogViewer } from "../shared/LogViewer";
import { ConfirmDialog } from "../shared/ConfirmDialog";
import { forgeListScheduledJobs, forgeCreateScheduledJob, forgeDeleteScheduledJob, forgeGetScheduledJobOutput, type ForgeScheduledJob } from "@/lib/tauri";

interface Props { token: string; orgSlug: string; serverId: string; siteId: string; }

export function ScheduledJobsWidget({ token, orgSlug, serverId, siteId }: Props) {
  const [jobs, setJobs] = useState<ForgeScheduledJob[]>([]);
  const [loaded, setLoaded] = useState(false);
  const [loading, setLoading] = useState(false);
  const [showCreate, setShowCreate] = useState(false);
  const [newCmd, setNewCmd] = useState("");
  const [newFreq, setNewFreq] = useState("daily");
  const [creating, setCreating] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<ForgeScheduledJob | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [output, setOutput] = useState("");
  const [outputLoading, setOutputLoading] = useState(false);

  const load = async (force = false) => {
    setLoading(true);
    if (force) invalidateCache(`site:${siteId}:jobs`);
    try {
      const j = await cachedFetch(`site:${siteId}:jobs`, () => forgeListScheduledJobs(token, orgSlug, serverId, siteId));
      setJobs(j); setLoaded(true);
    } catch { setLoaded(true); }
    setLoading(false);
  };

  if (!loaded && !loading) load();

  const create = async () => {
    if (!newCmd.trim()) return;
    setCreating(true);
    try {
      await forgeCreateScheduledJob(token, orgSlug, serverId, siteId, newCmd.trim(), newFreq, "forge");
      toast.success("Job created"); setNewCmd(""); setShowCreate(false); load(true);
    } catch (err) { toast.error(`Failed: ${err}`); }
    setCreating(false);
  };

  const remove = async () => {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      await forgeDeleteScheduledJob(token, orgSlug, serverId, siteId, deleteTarget.id);
      toast.success("Job deleted"); setDeleteTarget(null); load(true);
    } catch (err) { toast.error(`Failed: ${err}`); }
    setDeleting(false);
  };

  const toggleOutput = async (jobId: string) => {
    if (expandedId === jobId) { setExpandedId(null); return; }
    setExpandedId(jobId); setOutputLoading(true); setOutput("");
    try {
      const o = await cachedFetch(`job:${jobId}:output`, () => forgeGetScheduledJobOutput(token, orgSlug, serverId, siteId, jobId), 300_000);
      setOutput(o);
    } catch { setOutput("No output available."); }
    setOutputLoading(false);
  };

  return (
    <div className="flex flex-col h-full">
      <div className="flex items-center justify-between border-b border-border/30 px-4 py-2">
        <span className="text-sm text-muted-foreground">Scheduled Jobs ({jobs.length})</span>
        <div className="flex gap-1.5">
          <Button size="sm" variant="ghost" className="h-6 gap-1 px-2 text-xs" onClick={() => load(true)}>
            <RefreshCw className="h-2.5 w-2.5" /> {t("app.refresh")}
          </Button>
          <Button size="sm" className="h-6 gap-1 px-2 text-xs bg-emerald-600 hover:bg-emerald-700 text-white" onClick={() => setShowCreate(true)}>
            <Plus className="h-2.5 w-2.5" /> Add Job
          </Button>
        </div>
      </div>
      {showCreate && (
        <div className="border-b border-border/30 px-4 py-3 bg-muted/20 flex items-center gap-2">
          <Input value={newCmd} onChange={(e) => setNewCmd(e.target.value)} placeholder="php artisan schedule:run" className="h-8 text-xs font-mono flex-1" autoFocus />
          <select value={newFreq} onChange={(e) => setNewFreq(e.target.value)} className="h-8 rounded-md border bg-transparent px-2 text-xs">
            <option value="minutely">Every minute</option>
            <option value="hourly">Hourly</option>
            <option value="nightly">Nightly</option>
            <option value="daily">Daily</option>
            <option value="weekly">Weekly</option>
            <option value="monthly">Monthly</option>
          </select>
          <Button size="sm" className="h-8 text-xs" onClick={create} disabled={creating || !newCmd.trim()}>
            {creating ? <RefreshCw className="h-3 w-3 animate-spin" /> : t("app.create")}
          </Button>
          <Button size="sm" variant="ghost" className="h-8 text-xs" onClick={() => setShowCreate(false)}>{t("app.cancel")}</Button>
        </div>
      )}
      <div className="flex-1 overflow-auto">
        {loading && !loaded ? (
          <div className="flex h-32 items-center justify-center"><RefreshCw className="h-4 w-4 animate-spin text-muted-foreground" /></div>
        ) : jobs.length === 0 ? (
          <EmptyState icon={Clock} title="No scheduled jobs" description="Create a job to run commands on a schedule" />
        ) : (
          <div className="divide-y divide-border/30">
            {jobs.map((job) => (
              <div key={job.id}>
                <div className="flex items-center gap-2 px-4 py-2.5 group hover:bg-muted/20 cursor-pointer transition-colors" onClick={() => toggleOutput(job.id)}>
                  {expandedId === job.id ? <ChevronDown className="h-3 w-3 text-muted-foreground" /> : <ChevronRight className="h-3 w-3 text-muted-foreground" />}
                  <code className="text-sm font-mono flex-1 truncate">{job.command}</code>
                  <span className="text-xs text-muted-foreground">{job.frequency}</span>
                  <span className="text-xs text-muted-foreground">{job.user}</span>
                  <Button size="icon" variant="ghost" className="h-6 w-6 opacity-0 group-hover:opacity-100 text-muted-foreground hover:text-red-400" onClick={(e) => { e.stopPropagation(); setDeleteTarget(job); }}>
                    <Trash2 className="h-3 w-3" />
                  </Button>
                </div>
                {expandedId === job.id && (
                  <div className="bg-zinc-100 dark:bg-zinc-950 px-2 py-3 font-mono text-sm leading-5 max-h-48 overflow-auto border-t border-border/20">
                    {outputLoading ? <div className="flex items-center justify-center py-4"><RefreshCw className="h-3.5 w-3.5 animate-spin text-muted-foreground" /></div> : <LogViewer content={output} />}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
      <ConfirmDialog open={!!deleteTarget} title="Delete Job" description={`Delete scheduled job "${deleteTarget?.command}"?`} variant="danger" loading={deleting} onConfirm={remove} onCancel={() => setDeleteTarget(null)} />
    </div>
  );
}
