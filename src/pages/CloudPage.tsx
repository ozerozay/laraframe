import { useState } from "react";
import { Cloud, RefreshCw, AlertCircle, Eye, EyeOff, Plus, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "sonner";
import { t } from "@/lib/i18n";
import { cachedFetch, invalidateCache } from "@/lib/cache";
import { ConfirmDialog } from "@/components/forge/shared/ConfirmDialog";
import {
  getApiKey, saveApiKey, SERVICES,
  cloudListApplications, cloudListEnvironments, cloudListDeployments,
  cloudCreateDeployment, cloudStartEnvironment, cloudStopEnvironment,
  cloudCreateApplication, cloudDeleteApplication,
  cloudCreateEnvironment, cloudDeleteEnvironment,
  cloudGetEnvironment,
  cloudListInstances,
  type CloudApplication, type CloudEnvironment, type CloudDeployment, type CloudInstance,
} from "@/lib/tauri";

import { AppList } from "@/components/cloud/AppList";
import { EnvList } from "@/components/cloud/EnvList";
import { EnvHeader } from "@/components/cloud/EnvHeader";
import { CloudDeploymentsWidget } from "@/components/cloud/widgets/DeploymentsWidget";
import { CloudCommandsWidget } from "@/components/cloud/widgets/CommandsWidget";
import { CloudInstancesWidget } from "@/components/cloud/widgets/InstancesWidget";
import { CloudDomainsWidget } from "@/components/cloud/widgets/DomainsWidget";
import { EnvVariablesWidget } from "@/components/cloud/widgets/EnvVariablesWidget";
import { CloudDatabasesWidget } from "@/components/cloud/widgets/DatabasesWidget";
import { CloudCachesWidget } from "@/components/cloud/widgets/CachesWidget";
import { CloudStorageWidget } from "@/components/cloud/widgets/StorageWidget";
import { CloudWebSocketsWidget } from "@/components/cloud/widgets/WebSocketsWidget";
import { CloudLogsWidget } from "@/components/cloud/widgets/LogsWidget";
import { BackgroundProcessesWidget } from "@/components/cloud/widgets/BackgroundProcessesWidget";
import { MetricsWidget } from "@/components/cloud/widgets/MetricsWidget";
import {
  cloudGetEnvironmentMetrics,
} from "@/lib/tauri";

const TAB_STYLE = "h-7 px-3 rounded-md text-xs font-medium text-muted-foreground data-[state=active]:bg-muted data-[state=active]:text-foreground data-[state=active]:shadow-sm hover:text-foreground transition-all whitespace-nowrap";

export function CloudPage() {
  const [token, setToken] = useState<string | null>(null);
  const [apps, setApps] = useState<CloudApplication[]>([]);
  const [selectedApp, setSelectedApp] = useState<CloudApplication | null>(null);
  const [envs, setEnvs] = useState<CloudEnvironment[]>([]);
  const [selectedEnv, setSelectedEnv] = useState<CloudEnvironment | null>(null);
  const [deployments, setDeployments] = useState<CloudDeployment[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [initialized, setInitialized] = useState(false);
  const [deploying, setDeploying] = useState(false);
  const [stopConfirm, setStopConfirm] = useState(false);
  const [stopping, setStopping] = useState(false);
  const [tokenInput, setTokenInput] = useState("");
  const [showToken, setShowToken] = useState(false);
  const [savingToken, setSavingToken] = useState(false);

  // App create/delete
  const [showCreateApp, setShowCreateApp] = useState(false);
  const [newAppName, setNewAppName] = useState("");
  const [newAppRegion, setNewAppRegion] = useState("eu-central-1");
  const [creatingApp, setCreatingApp] = useState(false);
  const [deleteAppConfirm, setDeleteAppConfirm] = useState(false);
  const [deletingApp, setDeletingApp] = useState(false);

  // Env create/delete
  const [showCreateEnv, setShowCreateEnv] = useState(false);
  const [newEnvName, setNewEnvName] = useState("");
  const [creatingEnv, setCreatingEnv] = useState(false);
  const [deleteEnvConfirm, setDeleteEnvConfirm] = useState(false);
  const [deletingEnv, setDeletingEnv] = useState(false);

  // Env variables (from detail endpoint)
  const [envVariables, setEnvVariables] = useState<Array<{ key: string; value: string }>>([]);
  // Instances for processes tab
  const [instances, setInstances] = useState<CloudInstance[]>([]);

  const init = async (force = false) => {
    setLoading(true);
    setError(null);
    if (force) invalidateCache("cloud:");
    try {
      const key = await getApiKey(SERVICES.CLOUD);
      setToken(key);
      if (key) {
        const a = await cachedFetch("cloud:apps", () => cloudListApplications(key), 120_000);
        setApps(a);
      }
    } catch (err) {
      setError(String(err));
    }
    setLoading(false);
  };

  if (!initialized) { setInitialized(true); init(); }

  const selectApp = async (app: CloudApplication) => {
    if (!token) return;
    setSelectedApp(app);
    setSelectedEnv(null);
    setDeployments([]);
    try {
      const e = await cachedFetch(`cloud:app:${app.id}:envs`, () => cloudListEnvironments(token, app.id));
      setEnvs(e);
    } catch (err) { console.error(err); }
  };

  const selectEnv = async (env: CloudEnvironment) => {
    if (!token) return;
    setSelectedEnv(env);
    setDeployments([]);
    setEnvVariables([]);
    try {
      const [d, detail] = await Promise.all([
        cachedFetch(`cloud:env:${env.id}:deployments`, () => cloudListDeployments(token, env.id)),
        cachedFetch(`cloud:env:${env.id}:detail`, () => cloudGetEnvironment(token, env.id)),
      ]);
      setDeployments(d);
      setEnvVariables(detail.environment_variables || []);
    } catch (err) { console.error(err); }
  };

  const deploy = async () => {
    if (!token || !selectedEnv) return;
    setDeploying(true);
    const toastId = toast.loading(`Deploying ${selectedEnv.name}...`);
    try {
      await cloudCreateDeployment(token, selectedEnv.id);
      toast.success("Deployment queued", { id: toastId });
      invalidateCache(`cloud:env:${selectedEnv.id}:deployments`);
      const d = await cloudListDeployments(token, selectedEnv.id);
      setDeployments(d);
    } catch (err) {
      toast.error(`Deploy failed`, { id: toastId, description: String(err) });
    }
    setDeploying(false);
  };

  const startEnv = async () => {
    if (!token || !selectedEnv) return;
    try {
      await cloudStartEnvironment(token, selectedEnv.id);
      toast.success(`${selectedEnv.name} starting`);
      invalidateCache(`cloud:app:${selectedApp?.id}:envs`);
      if (selectedApp) {
        const e = await cloudListEnvironments(token, selectedApp.id);
        setEnvs(e);
        const updated = e.find((x) => x.id === selectedEnv.id);
        if (updated) setSelectedEnv(updated);
      }
    } catch (err) { toast.error(`Failed: ${err}`); }
  };

  const stopEnv = async () => {
    if (!token || !selectedEnv) return;
    setStopping(true);
    try {
      await cloudStopEnvironment(token, selectedEnv.id);
      toast.success(`${selectedEnv.name} stopping`);
      setStopConfirm(false);
      invalidateCache(`cloud:app:${selectedApp?.id}:envs`);
      if (selectedApp) {
        const e = await cloudListEnvironments(token, selectedApp.id);
        setEnvs(e);
        const updated = e.find((x) => x.id === selectedEnv.id);
        if (updated) setSelectedEnv(updated);
      }
    } catch (err) { toast.error(`Failed: ${err}`); }
    setStopping(false);
  };

  const handleSaveToken = async () => {
    if (!tokenInput.trim()) return;
    setSavingToken(true);
    try {
      await saveApiKey(SERVICES.CLOUD, tokenInput.trim());
      setTokenInput("");
      toast.success("Cloud API token saved");
      init(true);
    } catch (err) {
      toast.error(`Failed to save token: ${err}`);
    }
    setSavingToken(false);
  };

  const createApp = async () => {
    if (!token || !newAppName.trim()) return;
    setCreatingApp(true);
    try {
      await cloudCreateApplication(token, newAppName.trim(), newAppRegion);
      toast.success(`Application "${newAppName.trim()}" created`);
      setNewAppName(""); setShowCreateApp(false);
      invalidateCache("cloud:apps");
      const a = await cloudListApplications(token);
      setApps(a);
    } catch (err) { toast.error(`Failed: ${err}`); }
    setCreatingApp(false);
  };

  const deleteApp = async () => {
    if (!token || !selectedApp) return;
    setDeletingApp(true);
    try {
      await cloudDeleteApplication(token, selectedApp.id);
      toast.success(`Application "${selectedApp.name}" deleted`);
      setDeleteAppConfirm(false);
      setSelectedApp(null); setSelectedEnv(null); setEnvs([]);
      invalidateCache("cloud:apps");
      const a = await cloudListApplications(token);
      setApps(a);
    } catch (err) { toast.error(`Failed: ${err}`); }
    setDeletingApp(false);
  };

  const createEnv = async () => {
    if (!token || !selectedApp || !newEnvName.trim()) return;
    setCreatingEnv(true);
    try {
      await cloudCreateEnvironment(token, selectedApp.id, newEnvName.trim());
      toast.success(`Environment "${newEnvName.trim()}" created`);
      setNewEnvName(""); setShowCreateEnv(false);
      invalidateCache(`cloud:app:${selectedApp.id}:envs`);
      const e = await cloudListEnvironments(token, selectedApp.id);
      setEnvs(e);
    } catch (err) { toast.error(`Failed: ${err}`); }
    setCreatingEnv(false);
  };

  const deleteEnv = async () => {
    if (!token || !selectedEnv || !selectedApp) return;
    setDeletingEnv(true);
    try {
      await cloudDeleteEnvironment(token, selectedEnv.id);
      toast.success(`Environment "${selectedEnv.name}" deleted`);
      setDeleteEnvConfirm(false); setSelectedEnv(null);
      invalidateCache(`cloud:app:${selectedApp.id}:envs`);
      const e = await cloudListEnvironments(token, selectedApp.id);
      setEnvs(e);
    } catch (err) { toast.error(`Failed: ${err}`); }
    setDeletingEnv(false);
  };

  const loadInstances = async () => {
    if (!token || !selectedEnv) return;
    try {
      const i = await cachedFetch(`cloud:env:${selectedEnv.id}:instances`, () => cloudListInstances(token, selectedEnv.id));
      setInstances(i);
    } catch { /* ignore */ }
  };

  /* States */
  if (!loading && !token) {
    return (
      <div className="flex h-full items-center justify-center">
        <div className="flex flex-col items-center gap-5 w-full max-w-sm">
          <div className="relative">
            <div className="absolute -inset-4 rounded-full bg-primary/5 blur-xl" />
            <div className="relative flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-primary/20 to-primary/5 border border-primary/10">
              <Cloud className="h-6 w-6 text-primary/70" />
            </div>
          </div>
          <div className="text-center space-y-1">
            <p className="text-sm font-medium">{t("cloud.notConnected")}</p>
            <p className="text-sm text-muted-foreground/70">{t("cloud.notConnectedDesc")}</p>
          </div>
          <div className="w-full space-y-3">
            <div className="relative">
              <Input
                type={showToken ? "text" : "password"}
                placeholder="Cloud API Token"
                value={tokenInput}
                onChange={(e) => setTokenInput(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleSaveToken()}
                className="pr-10"
              />
              <button
                type="button"
                onClick={() => setShowToken(!showToken)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
              >
                {showToken ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
            <Button className="w-full" onClick={handleSaveToken} disabled={savingToken || !tokenInput.trim()}>
              {savingToken ? <RefreshCw className="h-4 w-4 animate-spin mr-2" /> : null}
              Connect
            </Button>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex h-full items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <AlertCircle className="h-8 w-8 text-red-500" />
          <p className="text-sm text-red-400 max-w-sm text-center">{error}</p>
          <Button variant="outline" size="sm" onClick={() => init(true)}>{t("app.retry")}</Button>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="flex h-full items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <RefreshCw className="h-5 w-5 animate-spin text-primary" />
          <span className="text-xs font-medium tracking-[0.2em] uppercase text-muted-foreground/60">{t("cloud.connecting")}</span>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-[calc(100vh-3rem)] flex-col">
      {/* Header */}
      <div className="flex items-center justify-between shrink-0 pb-2">
        <h1 className="text-base font-semibold tracking-tight">{t("cloud.title")}</h1>
        <div className="flex items-center gap-1.5">
          <Button size="sm" variant="outline" className="h-7 gap-1 text-xs" onClick={() => setShowCreateApp(true)}>
            <Plus className="h-3 w-3" /> New App
          </Button>
          {selectedApp && (
            <Button size="sm" variant="outline" className="h-7 gap-1 text-xs text-red-500 hover:text-red-400" onClick={() => setDeleteAppConfirm(true)}>
              <Trash2 className="h-3 w-3" /> Delete App
            </Button>
          )}
          <button className="flex items-center gap-1.5 rounded-md px-2 py-1 text-xs text-muted-foreground/60 hover:text-muted-foreground transition-colors" onClick={() => init(true)}>
            <RefreshCw className="h-3 w-3" /> {t("app.refresh")}
          </button>
        </div>
      </div>

      {/* Create App Dialog */}
      {showCreateApp && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setShowCreateApp(false)} />
          <div className="relative w-full max-w-md rounded-xl border border-border bg-card p-6 shadow-2xl mx-4 space-y-4">
            <h3 className="text-base font-semibold">Create Application</h3>
            <div className="space-y-3">
              <Input value={newAppName} onChange={(e) => setNewAppName(e.target.value)} placeholder="Application name" className="h-9 text-sm" autoFocus
                onKeyDown={(e) => { if (e.key === "Enter" && newAppName.trim()) createApp(); }} />
              <select value={newAppRegion} onChange={(e) => setNewAppRegion(e.target.value)} className="h-9 w-full rounded-md border bg-transparent px-3 text-sm">
                <option value="eu-central-1">EU Central</option>
                <option value="us-east-1">US East 1</option>
                <option value="us-east-2">US East 2</option>
                <option value="ap-southeast-1">AP Southeast</option>
              </select>
            </div>
            <div className="flex gap-3">
              <Button variant="outline" className="flex-1 h-9" onClick={() => setShowCreateApp(false)}>Cancel</Button>
              <Button className="flex-1 h-9" onClick={createApp} disabled={creatingApp || !newAppName.trim()}>
                {creatingApp ? <RefreshCw className="h-4 w-4 animate-spin mr-2" /> : null} Create
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Layout */}
      <Tabs defaultValue="apps" className="flex-1 flex flex-col min-h-0">
        <div className="border-b border-border/30 px-3 py-1.5">
          <TabsList className="h-8 gap-1 bg-transparent p-0">
            {[
              { value: "apps", label: `${t("cloud.applications")} (${apps.length})` },
              { value: "databases", label: t("cloud.databases") },
              { value: "caches", label: t("cloud.caches") },
              { value: "storage", label: t("cloud.storage") },
              { value: "websockets", label: t("cloud.websockets") },
            ].map((tab) => (
              <TabsTrigger key={tab.value} value={tab.value} className={TAB_STYLE}>{tab.label}</TabsTrigger>
            ))}
          </TabsList>
        </div>

        <TabsContent value="apps" className="flex-1 min-h-0 m-0">
      <div className="flex h-full rounded-b-lg border-x border-b border-border/40 overflow-hidden">
        {/* App sidebar */}
        <div className="border-r border-border/40 bg-card/20">
          <AppList apps={apps} selectedId={selectedApp?.id ?? null} onSelect={selectApp} />
        </div>

        {/* Content */}
        <div className="flex-1 min-w-0 bg-background/50">
          {selectedApp ? (
            <div className="flex h-full">
              {/* Env list */}
              <div className="flex flex-col shrink-0">
                <div className="flex items-center justify-between px-3 py-1.5 border-b border-border/20">
                  <Button size="sm" variant="ghost" className="h-6 gap-1 px-1.5 text-xs" onClick={() => setShowCreateEnv(true)}>
                    <Plus className="h-3 w-3" /> New Env
                  </Button>
                  {selectedEnv && (
                    <Button size="sm" variant="ghost" className="h-6 px-1.5 text-xs text-red-500 hover:text-red-400" onClick={() => setDeleteEnvConfirm(true)}>
                      <Trash2 className="h-3 w-3" />
                    </Button>
                  )}
                </div>
                {showCreateEnv && (
                  <div className="border-b border-border/20 px-3 py-2 bg-muted/20 space-y-2">
                    <Input value={newEnvName} onChange={(e) => setNewEnvName(e.target.value)} placeholder="Environment name" className="h-7 text-xs" autoFocus
                      onKeyDown={(e) => { if (e.key === "Enter" && newEnvName.trim()) createEnv(); }} />
                    <div className="flex gap-1.5">
                      <Button size="sm" className="h-6 text-xs" onClick={createEnv} disabled={creatingEnv || !newEnvName.trim()}>
                        {creatingEnv ? <RefreshCw className="h-3 w-3 animate-spin" /> : "Create"}
                      </Button>
                      <Button size="sm" variant="ghost" className="h-6 text-xs" onClick={() => setShowCreateEnv(false)}>Cancel</Button>
                    </div>
                  </div>
                )}
                <EnvList envs={envs} selectedId={selectedEnv?.id ?? null} onSelect={selectEnv} />
              </div>

              {/* Env detail */}
              <div className="flex-1 min-w-0">
                {selectedEnv ? (
                  <div className="flex h-full flex-col">
                    <EnvHeader
                      env={selectedEnv}
                      deploying={deploying}
                      onDeploy={deploy}
                      onStart={startEnv}
                      onStop={() => setStopConfirm(true)}
                    />

                    <Tabs defaultValue="deployments" className="flex-1 flex flex-col min-h-0">
                      <div className="border-b border-border/30 px-3 py-1.5 overflow-x-auto">
                        <TabsList className="h-8 gap-1 bg-transparent p-0 flex-nowrap">
                          {[
                            { value: "deployments", label: t("cloud.deployments") },
                            { value: "commands", label: t("cloud.commands") },
                            { value: "instances", label: t("cloud.instances") },
                            { value: "domains", label: t("cloud.domains") },
                            { value: "variables", label: "Variables" },
                            { value: "logs", label: t("cloud.logs") },
                            { value: "processes", label: "Processes" },
                            { value: "metrics", label: t("cloud.metrics") },
                          ].map((tab) => (
                            <TabsTrigger key={tab.value} value={tab.value} className={TAB_STYLE}>{tab.label}</TabsTrigger>
                          ))}
                        </TabsList>
                      </div>

                      <TabsContent value="deployments" className="flex-1 m-0 overflow-auto">
                        <CloudDeploymentsWidget
                          deployments={deployments}
                          token={token!}
                          onRefresh={async () => {
                            invalidateCache(`cloud:env:${selectedEnv.id}:deployments`);
                            const d = await cloudListDeployments(token!, selectedEnv.id);
                            setDeployments(d);
                          }}
                        />
                      </TabsContent>

                      <TabsContent value="commands" className="flex-1 m-0 flex flex-col min-h-0">
                        <CloudCommandsWidget token={token!} envId={selectedEnv.id} />
                      </TabsContent>

                      <TabsContent value="instances" className="flex-1 m-0 flex flex-col min-h-0">
                        <CloudInstancesWidget token={token!} envId={selectedEnv.id} />
                      </TabsContent>

                      <TabsContent value="domains" className="flex-1 m-0 flex flex-col min-h-0">
                        <CloudDomainsWidget token={token!} envId={selectedEnv.id} />
                      </TabsContent>

                      <TabsContent value="variables" className="flex-1 m-0 flex flex-col min-h-0">
                        <EnvVariablesWidget
                          token={token!}
                          envId={selectedEnv.id}
                          variables={envVariables}
                          onRefresh={async () => {
                            invalidateCache(`cloud:env:${selectedEnv.id}:detail`);
                            const detail = await cloudGetEnvironment(token!, selectedEnv.id);
                            setEnvVariables(detail.environment_variables || []);
                          }}
                        />
                      </TabsContent>

                      <TabsContent value="logs" className="flex-1 m-0 flex flex-col min-h-0">
                        <CloudLogsWidget token={token!} envId={selectedEnv.id} />
                      </TabsContent>

                      <TabsContent value="processes" className="flex-1 m-0 flex flex-col min-h-0">
                        <div className="flex flex-col h-full">
                          {(() => {
                            // Load instances for this env when the tab is viewed
                            if (instances.length === 0) loadInstances();
                            return instances.length === 0 ? (
                              <div className="flex h-32 items-center justify-center">
                                <span className="text-xs text-muted-foreground">Select an environment with instances to view background processes.</span>
                              </div>
                            ) : (
                              <div className="flex-1 overflow-auto">
                                {instances.map((inst) => (
                                  <div key={inst.id} className="border-b border-border/30">
                                    <div className="px-4 py-2 bg-muted/20 text-xs font-medium text-muted-foreground">{inst.name} ({inst.instance_type})</div>
                                    <BackgroundProcessesWidget token={token!} instanceId={inst.id} />
                                  </div>
                                ))}
                              </div>
                            );
                          })()}
                        </div>
                      </TabsContent>

                      <TabsContent value="metrics" className="flex-1 m-0 overflow-auto">
                        <MetricsWidget
                          token={token!}
                          cacheKey={`cloud:env:${selectedEnv.id}:metrics`}
                          fetcher={() => cloudGetEnvironmentMetrics(token!, selectedEnv.id)}
                          title="Environment Metrics"
                        />
                      </TabsContent>
                    </Tabs>
                  </div>
                ) : (
                  <div className="flex h-full items-center justify-center">
                    <div className="flex flex-col items-center gap-2 text-muted-foreground/20">
                      <Cloud className="h-8 w-8" />
                      <p className="text-sm font-medium">{t("cloud.selectEnv")}</p>
                    </div>
                  </div>
                )}
              </div>
            </div>
          ) : (
            <div className="flex h-full items-center justify-center">
              <div className="flex flex-col items-center gap-3 text-muted-foreground/30">
                <Cloud className="h-8 w-8" />
                <p className="text-sm font-medium">{t("cloud.selectApp")}</p>
              </div>
            </div>
          )}
        </div>
      </div>
        </TabsContent>

        <TabsContent value="databases" className="flex-1 min-h-0 m-0 rounded-b-lg border-x border-b border-border/40 overflow-hidden">
          <CloudDatabasesWidget token={token!} />
        </TabsContent>

        <TabsContent value="caches" className="flex-1 min-h-0 m-0 rounded-b-lg border-x border-b border-border/40 overflow-hidden">
          <CloudCachesWidget token={token!} />
        </TabsContent>

        <TabsContent value="storage" className="flex-1 min-h-0 m-0 rounded-b-lg border-x border-b border-border/40 overflow-hidden">
          <CloudStorageWidget token={token!} />
        </TabsContent>

        <TabsContent value="websockets" className="flex-1 min-h-0 m-0 rounded-b-lg border-x border-b border-border/40 overflow-hidden">
          <CloudWebSocketsWidget token={token!} />
        </TabsContent>
      </Tabs>

      {/* Stop confirm */}
      <ConfirmDialog
        open={stopConfirm}
        title={t("cloud.stopEnv")}
        description={t("cloud.stopEnvDesc")}
        confirmText={t("cloud.stop")}
        variant="danger"
        loading={stopping}
        onConfirm={stopEnv}
        onCancel={() => setStopConfirm(false)}
      />

      {/* Delete App confirm */}
      <ConfirmDialog
        open={deleteAppConfirm}
        title="Delete Application"
        description={`Permanently delete "${selectedApp?.name}"? All environments and deployments will be lost.`}
        typeToConfirm={selectedApp?.name ?? undefined}
        variant="danger"
        loading={deletingApp}
        onConfirm={deleteApp}
        onCancel={() => setDeleteAppConfirm(false)}
      />

      {/* Delete Env confirm */}
      <ConfirmDialog
        open={deleteEnvConfirm}
        title="Delete Environment"
        description={`Permanently delete "${selectedEnv?.name}"? All instances and data will be lost.`}
        typeToConfirm={selectedEnv?.name ?? undefined}
        variant="danger"
        loading={deletingEnv}
        onConfirm={deleteEnv}
        onCancel={() => setDeleteEnvConfirm(false)}
      />
    </div>
  );
}
