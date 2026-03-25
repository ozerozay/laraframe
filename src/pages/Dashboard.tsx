import { useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  Card, CardContent, CardDescription, CardHeader, CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Server, Cloud, Activity, ArrowRight, RefreshCw, Globe,
  CheckCircle2, Database, Zap,
  Layers, Terminal,
} from "lucide-react";
import { t } from "@/lib/i18n";
import { cachedFetch, invalidateCache } from "@/lib/cache";
import {
  hasApiKey, getApiKey, SERVICES,
  forgeGetUser, forgeListOrgs, forgeListServers, forgeListSites,
  cloudListApplications, cloudListEnvironments, cloudListDatabaseClusters, cloudListCaches,
  getMcpServerPath,
  type ForgeServer, type ForgeSite, type CloudApplication, type CloudEnvironment,
} from "@/lib/tauri";

interface DashboardData {
  forgeConnected: boolean;
  cloudConnected: boolean;
  nightwatchConnected: boolean;
  forgeUser: string | null;
  forgeServers: ForgeServer[];
  forgeSites: ForgeSite[];
  cloudApps: CloudApplication[];
  cloudEnvs: CloudEnvironment[];
  cloudDbCount: number;
  cloudCacheCount: number;
  mcpReady: boolean;
  mcpPath: string | null;
}

export function Dashboard() {
  const navigate = useNavigate();
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(false);
  const [initialized, setInitialized] = useState(false);

  const load = async (force = false) => {
    setLoading(true);
    if (force) invalidateCache("dashboard:");

    const result: DashboardData = {
      forgeConnected: false, cloudConnected: false, nightwatchConnected: false,
      forgeUser: null, forgeServers: [], forgeSites: [],
      cloudApps: [], cloudEnvs: [], cloudDbCount: 0, cloudCacheCount: 0,
      mcpReady: false, mcpPath: null,
    };

    try {
      // Check connections
      const [forgeKey, cloudKey, nwKey] = await Promise.all([
        getApiKey(SERVICES.FORGE).catch(() => null),
        getApiKey(SERVICES.CLOUD).catch(() => null),
        hasApiKey(SERVICES.NIGHTWATCH).catch(() => false),
      ]);

      result.forgeConnected = !!forgeKey;
      result.cloudConnected = !!cloudKey;
      result.nightwatchConnected = !!nwKey;

      // MCP
      try {
        const path = await getMcpServerPath();
        result.mcpReady = true;
        result.mcpPath = path;
      } catch { /* not built */ }

      // Forge data
      if (forgeKey) {
        try {
          const [user, orgs] = await Promise.all([
            cachedFetch("dashboard:forge:user", () => forgeGetUser(forgeKey), 300_000),
            cachedFetch("dashboard:forge:orgs", () => forgeListOrgs(forgeKey), 300_000),
          ]);
          result.forgeUser = user.name;
          if (orgs.length > 0) {
            const servers = await cachedFetch("dashboard:forge:servers", () => forgeListServers(forgeKey, orgs[0].slug), 120_000);
            result.forgeServers = servers;
            // Load sites for first server
            if (servers.length > 0) {
              const sites = await cachedFetch(`dashboard:forge:sites:${servers[0].id}`, () => forgeListSites(forgeKey, orgs[0].slug, servers[0].id), 120_000);
              result.forgeSites = sites;
            }
          }
        } catch { /* ignore */ }
      }

      // Cloud data
      if (cloudKey) {
        try {
          const apps = await cachedFetch("dashboard:cloud:apps", () => cloudListApplications(cloudKey), 120_000);
          result.cloudApps = apps;
          if (apps.length > 0) {
            const envs = await cachedFetch(`dashboard:cloud:envs:${apps[0].id}`, () => cloudListEnvironments(cloudKey, apps[0].id), 120_000);
            result.cloudEnvs = envs;
          }
          const [dbs, caches] = await Promise.all([
            cachedFetch("dashboard:cloud:dbs", () => cloudListDatabaseClusters(cloudKey), 120_000).catch(() => []),
            cachedFetch("dashboard:cloud:caches", () => cloudListCaches(cloudKey), 120_000).catch(() => []),
          ]);
          result.cloudDbCount = (dbs as unknown[]).length;
          result.cloudCacheCount = (caches as unknown[]).length;
        } catch { /* ignore */ }
      }
    } catch { /* ignore */ }

    setData(result);
    setLoading(false);
  };

  if (!initialized) { setInitialized(true); load(); }

  const connectedCount = [data?.forgeConnected, data?.cloudConnected, data?.nightwatchConnected].filter(Boolean).length;

  // Full page loading on first load
  if (!data && loading) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">{t("nav.dashboard")}</h1>
          <p className="text-muted-foreground">{t("dashboard.subtitle")}</p>
        </div>
        <div className="grid gap-4 sm:grid-cols-3">
          {[1, 2, 3].map((i) => (
            <Card key={i} className="animate-pulse">
              <CardHeader className="pb-2"><div className="h-4 w-24 rounded bg-muted" /></CardHeader>
              <CardContent><div className="h-6 w-32 rounded bg-muted" /><div className="h-3 w-48 rounded bg-muted mt-2" /></CardContent>
            </Card>
          ))}
        </div>
        <div className="grid gap-4 lg:grid-cols-2">
          {[1, 2].map((i) => (
            <Card key={i} className="animate-pulse">
              <CardHeader className="pb-3"><div className="h-4 w-32 rounded bg-muted" /></CardHeader>
              <CardContent className="space-y-3">
                {[1, 2, 3].map((j) => (<div key={j} className="h-12 rounded-lg bg-muted" />))}
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">{t("nav.dashboard")}</h1>
          <p className="text-muted-foreground">
            {t("dashboard.subtitle")} — {connectedCount}/3 {t("dashboard.servicesConnected")}.
          </p>
        </div>
        <Button variant="ghost" size="sm" className="gap-1.5 text-xs" onClick={() => load(true)} disabled={loading}>
          <RefreshCw className={`h-3 w-3 ${loading ? "animate-spin" : ""}`} />
          {t("app.refresh")}
        </Button>
      </div>

      {/* Service Cards */}
      <div className="grid gap-4 sm:grid-cols-3">
        {/* Forge */}
        <Card className="cursor-pointer hover:bg-muted/30 transition-colors" onClick={() => navigate("/forge")}>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Laravel Forge</CardTitle>
            <Server className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            {loading && !data ? (
              <div className="space-y-2 animate-pulse"><div className="h-5 w-20 rounded bg-muted" /><div className="h-3 w-32 rounded bg-muted" /></div>
            ) : data?.forgeConnected ? (
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Badge variant="outline" className="bg-emerald-500/15 text-emerald-600 dark:text-emerald-400">
                    {t("app.connected")}
                  </Badge>
                  {data.forgeUser && <span className="text-xs text-muted-foreground">{data.forgeUser}</span>}
                </div>
                <div className="flex items-center gap-4 text-xs text-muted-foreground">
                  <span className="flex items-center gap-1"><Server className="h-3 w-3" /> {data.forgeServers.length} servers</span>
                  <span className="flex items-center gap-1"><Globe className="h-3 w-3" /> {data.forgeSites.length} sites</span>
                </div>
              </div>
            ) : (
              <Badge variant="outline" className="bg-muted text-muted-foreground">{t("app.disconnected")}</Badge>
            )}
          </CardContent>
        </Card>

        {/* Cloud */}
        <Card className="cursor-pointer hover:bg-muted/30 transition-colors" onClick={() => navigate("/cloud")}>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Laravel Cloud</CardTitle>
            <Cloud className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            {loading && !data ? (
              <div className="space-y-2 animate-pulse"><div className="h-5 w-20 rounded bg-muted" /><div className="h-3 w-32 rounded bg-muted" /></div>
            ) : data?.cloudConnected ? (
              <div className="space-y-2">
                <Badge variant="outline" className="bg-emerald-500/15 text-emerald-600 dark:text-emerald-400">
                  {t("app.connected")}
                </Badge>
                <div className="flex items-center gap-4 text-xs text-muted-foreground">
                  <span className="flex items-center gap-1"><Layers className="h-3 w-3" /> {data.cloudApps.length} apps</span>
                  <span className="flex items-center gap-1"><Database className="h-3 w-3" /> {data.cloudDbCount} dbs</span>
                  <span className="flex items-center gap-1"><Zap className="h-3 w-3" /> {data.cloudCacheCount} caches</span>
                </div>
              </div>
            ) : (
              <Badge variant="outline" className="bg-muted text-muted-foreground">{t("app.disconnected")}</Badge>
            )}
          </CardContent>
        </Card>

        {/* Nightwatch */}
        <Card className="cursor-pointer hover:bg-muted/30 transition-colors" onClick={() => navigate("/nightwatch")}>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Nightwatch</CardTitle>
            <Activity className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <Badge variant="outline" className="bg-muted text-muted-foreground">
              MCP Only
            </Badge>
            <p className="text-xs text-muted-foreground mt-2">No REST API — use MCP or Nightwatch dashboard</p>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        {/* Loading skeletons for detail cards */}
        {loading && !data && (
          <>
            <Card className="animate-pulse">
              <CardHeader className="pb-3"><div className="h-4 w-28 rounded bg-muted" /></CardHeader>
              <CardContent className="space-y-2">
                {[1,2].map((i) => <div key={i} className="h-14 rounded-lg bg-muted" />)}
              </CardContent>
            </Card>
            <Card className="animate-pulse">
              <CardHeader className="pb-3"><div className="h-4 w-28 rounded bg-muted" /></CardHeader>
              <CardContent className="space-y-2">
                {[1,2].map((i) => <div key={i} className="h-14 rounded-lg bg-muted" />)}
              </CardContent>
            </Card>
          </>
        )}

        {/* Forge Servers */}
        {data?.forgeConnected && data.forgeServers.length > 0 && (
          <Card>
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-sm">Forge Servers</CardTitle>
                <Button variant="ghost" size="sm" className="h-6 text-xs" onClick={() => navigate("/forge")}>
                  View all <ArrowRight className="h-3 w-3 ml-1" />
                </Button>
              </div>
            </CardHeader>
            <CardContent className="space-y-2">
              {data.forgeServers.map((server) => (
                <div key={server.id} className="flex items-center gap-3 rounded-lg border p-3 cursor-pointer hover:bg-muted/30" onClick={() => navigate("/forge")}>
                  <div className={`h-2 w-2 rounded-full ${server.is_ready ? "bg-emerald-500" : "bg-amber-500"}`} />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">{server.name}</p>
                    <p className="text-xs text-muted-foreground font-mono">{server.ip_address}</p>
                  </div>
                  <div className="flex items-center gap-2 text-xs text-muted-foreground">
                    {server.php_version && <span>{server.php_version.toUpperCase()}</span>}
                    <span>{server.provider}</span>
                  </div>
                </div>
              ))}
              {/* Sites summary */}
              {data.forgeSites.length > 0 && (
                <div className="pt-2 border-t">
                  <p className="text-xs text-muted-foreground mb-2">{data.forgeSites.length} sites on {data.forgeServers[0]?.name}</p>
                  <div className="flex flex-wrap gap-1.5">
                    {data.forgeSites.slice(0, 6).map((site) => (
                      <Badge key={site.id} variant="outline" className="text-xs font-normal font-mono">
                        {site.name}
                      </Badge>
                    ))}
                    {data.forgeSites.length > 6 && (
                      <Badge variant="outline" className="text-xs font-normal">+{data.forgeSites.length - 6} more</Badge>
                    )}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        )}

        {/* Cloud Environments */}
        {data?.cloudConnected && data.cloudApps.length > 0 && (
          <Card>
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-sm">Cloud Environments</CardTitle>
                <Button variant="ghost" size="sm" className="h-6 text-xs" onClick={() => navigate("/cloud")}>
                  View all <ArrowRight className="h-3 w-3 ml-1" />
                </Button>
              </div>
            </CardHeader>
            <CardContent className="space-y-2">
              {data.cloudApps.map((app) => (
                <div key={app.id} className="rounded-lg border p-3 cursor-pointer hover:bg-muted/30" onClick={() => navigate("/cloud")}>
                  <div className="flex items-center gap-2 mb-2">
                    <Cloud className="h-3.5 w-3.5 text-muted-foreground" />
                    <p className="text-sm font-medium">{app.name}</p>
                    <span className="text-xs text-muted-foreground">{app.region}</span>
                  </div>
                  {data.cloudEnvs.filter(() => true).map((env) => (
                    <div key={env.id} className="flex items-center gap-2 ml-5 py-1">
                      <div className={`h-2 w-2 rounded-full ${
                        env.status === "running" ? "bg-emerald-500" :
                        env.status === "stopped" ? "bg-zinc-500" :
                        env.status === "deploying" ? "bg-amber-500 animate-pulse" :
                        "bg-blue-500"
                      }`} />
                      <span className="text-sm">{env.name}</span>
                      <Badge variant="outline" className={`text-xs font-normal ${
                        env.status === "running" ? "border-emerald-500/30 text-emerald-500" :
                        env.status === "stopped" ? "border-zinc-500/30 text-zinc-500" :
                        "border-amber-500/30 text-amber-500"
                      }`}>{env.status}</Badge>
                      {env.php_major_version && <span className="text-xs text-muted-foreground">PHP {env.php_major_version}</span>}
                    </div>
                  ))}
                </div>
              ))}
            </CardContent>
          </Card>
        )}

        {/* MCP Status */}
        {data && (
          <Card>
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-sm flex items-center gap-2">
                  <Terminal className="h-4 w-4" /> MCP Server
                </CardTitle>
                <Badge variant="outline" className={data.mcpReady ? "border-emerald-500/30 text-emerald-500" : "border-amber-500/30 text-amber-500"}>
                  {data.mcpReady ? `${(data.forgeConnected ? 27 : 0) + (data.cloudConnected ? 20 : 0)} tools` : "Not built"}
                </Badge>
              </div>
              <CardDescription className="text-xs">Connect AI tools to manage your infrastructure</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              {data.mcpReady ? (
                <>
                  <div className="flex items-center gap-2 text-xs text-muted-foreground">
                    <CheckCircle2 className="h-3.5 w-3.5 text-emerald-500" />
                    <span className="font-mono truncate">{data.mcpPath}</span>
                  </div>
                  <div className="flex items-center gap-2 text-xs">
                    {data.forgeConnected && <Badge variant="outline" className="text-xs border-emerald-500/20 text-emerald-500">Forge: 27 tools</Badge>}
                    {data.cloudConnected && <Badge variant="outline" className="text-xs border-blue-500/20 text-blue-500">Cloud: 20 tools</Badge>}
                  </div>
                  <Button variant="outline" size="sm" className="w-full h-8 text-xs" onClick={() => navigate("/settings?tab=mcp")}>
                    Setup AI Tools →
                  </Button>
                </>
              ) : (
                <>
                  <p className="text-xs text-muted-foreground">MCP server needs to be built to enable AI integrations.</p>
                  <Button variant="outline" size="sm" className="w-full h-8 text-xs" onClick={() => navigate("/settings?tab=mcp")}>
                    Setup MCP Server →
                  </Button>
                </>
              )}
            </CardContent>
          </Card>
        )}

        {/* Quick Actions */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm">{t("dashboard.quickActions")}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <Button variant="outline" className="w-full justify-start h-9 text-sm" onClick={() => navigate("/forge")}>
              <Server className="mr-2 h-4 w-4" /> {t("dashboard.viewForgeServers")}
            </Button>
            <Button variant="outline" className="w-full justify-start h-9 text-sm" onClick={() => navigate("/cloud")}>
              <Cloud className="mr-2 h-4 w-4" /> {t("dashboard.viewCloudApps")}
            </Button>
            <Button variant="outline" className="w-full justify-start h-9 text-sm" onClick={() => navigate("/settings")}>
              <Activity className="mr-2 h-4 w-4" /> {t("nav.settings")}
            </Button>
          </CardContent>
        </Card>

        {/* Getting Started (only if not all connected) */}
        {connectedCount < 2 && (
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm">{t("dashboard.gettingStarted")}</CardTitle>
              <CardDescription>Connect your services to get started</CardDescription>
            </CardHeader>
            <CardContent className="space-y-2">
              {[
                { name: "Forge", connected: data?.forgeConnected, path: "/forge" },
                { name: "Cloud", connected: data?.cloudConnected, path: "/cloud" },
              ].map((s) => (
                <div key={s.name} className="flex items-center justify-between rounded-lg border p-3">
                  <span className="text-sm">{s.name}</span>
                  {s.connected ? (
                    <CheckCircle2 className="h-4 w-4 text-emerald-500" />
                  ) : (
                    <Button variant="outline" size="sm" className="h-7 text-xs" onClick={() => navigate(s.path)}>
                      {t("dashboard.connect")}
                    </Button>
                  )}
                </div>
              ))}
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
