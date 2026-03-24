import { useState } from "react";
import { Globe, RefreshCw } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "sonner";
import { t } from "@/lib/i18n";
import { cachedFetch, invalidateCache } from "@/lib/cache";
import {
  forgeListSites,
  forgeListDeployments,
  forgeDeploySite,
  type ForgeServer,
  type ForgeSite,
  type ForgeDeployment,
} from "@/lib/tauri";

import { ServerInfoBar } from "./ServerInfoBar";
import { SiteList } from "./SiteList";
import { SiteHeader } from "./SiteHeader";
import { DeploymentsWidget } from "./widgets/DeploymentsWidget";
import { SiteLogsWidget } from "./widgets/SiteLogsWidget";
import { EnvWidget } from "./widgets/EnvWidget";
import { EventsWidget } from "./widgets/EventsWidget";
import { MonitorsWidget } from "./widgets/MonitorsWidget";
import { ServerLogsWidget } from "./widgets/ServerLogsWidget";
import { DatabaseWidget } from "./widgets/DatabaseWidget";

interface Props {
  server: ForgeServer;
  token: string;
  orgSlug: string;
}

export function ServerDetail({ server, token, orgSlug }: Props) {
  const [sites, setSites] = useState<ForgeSite[]>([]);
  const [sitesLoaded, setSitesLoaded] = useState(false);
  const [sitesLoading, setSitesLoading] = useState(false);

  const [selectedSite, setSelectedSite] = useState<ForgeSite | null>(null);
  const [siteLoading, setSiteLoading] = useState(false);
  const [deployments, setDeployments] = useState<ForgeDeployment[]>([]);
  const [deployingId, setDeployingId] = useState<string | null>(null);

  // Load sites on first render (no useEffect)
  if (!sitesLoaded && !sitesLoading) {
    setSitesLoading(true);
    cachedFetch(`server:${server.id}:sites`, () => forgeListSites(token, orgSlug, server.id))
      .then((s) => { setSites(s); setSitesLoaded(true); })
      .catch(() => setSitesLoaded(true))
      .finally(() => setSitesLoading(false));
  }

  const selectSite = async (site: ForgeSite) => {
    if (selectedSite?.id === site.id) return;
    setSelectedSite(site);
    setSiteLoading(true);
    setDeployments([]);
    try {
      const deps = await cachedFetch(`site:${site.id}:deployments`, () =>
        forgeListDeployments(token, orgSlug, server.id, site.id)
      );
      setDeployments(deps);
    } catch (err) {
      console.error(err);
    }
    setSiteLoading(false);
  };


  const deploySite = async (site: ForgeSite) => {
    setDeployingId(site.id);
    const toastId = toast.loading(`Deploying ${site.name}...`);
    try {
      await forgeDeploySite(token, orgSlug, server.id, site.id);
      toast.success(`Deployment queued for ${site.name}`, { id: toastId });

      // Refresh immediately + start polling
      const refresh = async () => {
        invalidateCache(`site:${site.id}:deployments`);
        invalidateCache(`server:${server.id}:sites`);
        const [newDeps, newSites] = await Promise.all([
          forgeListDeployments(token, orgSlug, server.id, site.id),
          forgeListSites(token, orgSlug, server.id),
        ]);
        setDeployments(newDeps);
        setSites(newSites);
        const updated = newSites.find((s) => s.id === site.id);
        if (updated) setSelectedSite(updated);
        return updated;
      };

      await refresh();

      // Poll until deployment finishes
      const poll = setInterval(async () => {
        const current = await refresh();
        const status = current?.deployment_status;
        if (!status || !["deploying", "queued"].includes(status)) {
          clearInterval(poll);
          // Get final deployment result
          const finalDeps = await forgeListDeployments(token, orgSlug, server.id, site.id);
          setDeployments(finalDeps);
          const latest = [...finalDeps].pop();
          if (latest?.status === "failed") {
            toast.error(`Deployment failed: ${site.name}`, {
              description: latest.commit_message || undefined,
            });
          } else {
            toast.success(`Deployed: ${site.name}`, {
              description: latest?.commit_message || undefined,
            });
          }
        }
      }, 5000);
      setTimeout(() => clearInterval(poll), 300_000);
    } catch (err) {
      toast.error(`Deploy failed: ${site.name}`, {
        id: toastId,
        description: String(err),
      });
    }
    setDeployingId(null);
  };

  if (sitesLoading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <div className="flex flex-col items-center gap-3 text-muted-foreground">
          <RefreshCw className="h-5 w-5 animate-spin" />
          <span className="text-xs tracking-wide uppercase">{t("forge.loadingServer")}</span>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-full flex-col gap-3">
      <ServerInfoBar server={server} />

      <Tabs defaultValue="sites" className="flex-1 flex flex-col min-h-0">
        <TabsList className="shrink-0">
          <TabsTrigger value="sites">{t("forge.sites")} ({sites.length})</TabsTrigger>
          <TabsTrigger value="database">{t("forge.database")}</TabsTrigger>
          <TabsTrigger value="monitors">{t("forge.monitors")}</TabsTrigger>
          <TabsTrigger value="events">{t("forge.events")}</TabsTrigger>
          <TabsTrigger value="logs">{t("forge.serverLogs")}</TabsTrigger>
        </TabsList>

        {/* Sites */}
        <TabsContent value="sites" className="mt-3 flex-1 min-h-0">
          <div className="flex h-full gap-3">
            <SiteList
              sites={sites}
              selectedId={selectedSite?.id ?? null}
              onSelect={selectSite}
            />

            <div className="flex-1 min-w-0">
              {selectedSite && siteLoading ? (
                <div className="flex h-full items-center justify-center rounded-lg border border-border/50 bg-card/30">
                  <div className="flex flex-col items-center gap-3">
                    <RefreshCw className="h-5 w-5 animate-spin text-emerald-500" />
                    <div className="text-center">
                      <p className="text-xs font-medium">{selectedSite.name}</p>
                      <p className="text-[10px] text-muted-foreground mt-0.5">{t("forge.loadingSite")}</p>
                    </div>
                  </div>
                </div>
              ) : selectedSite ? (
                <div className="flex h-full flex-col rounded-lg border border-border/50 bg-card/30 overflow-hidden">
                  <SiteHeader
                    site={selectedSite}
                    deploying={deployingId === selectedSite.id}
                    onDeploy={() => deploySite(selectedSite)}
                  />

                  <Tabs defaultValue="deployments" className="flex-1 flex flex-col min-h-0">
                    <div className="border-b border-border/50 px-4">
                      <TabsList className="h-9 bg-transparent p-0 gap-4">
                        <TabsTrigger value="deployments" className="h-9 rounded-none border-b-2 border-transparent px-0 pb-2 pt-2 text-xs data-[state=active]:border-emerald-500 data-[state=active]:bg-transparent data-[state=active]:shadow-none">
                          {t("site.deployments")}
                        </TabsTrigger>
                        <TabsTrigger value="site-logs" className="h-9 rounded-none border-b-2 border-transparent px-0 pb-2 pt-2 text-xs data-[state=active]:border-emerald-500 data-[state=active]:bg-transparent data-[state=active]:shadow-none">
                          {t("site.logs")}
                        </TabsTrigger>
                        <TabsTrigger value="env" className="h-9 rounded-none border-b-2 border-transparent px-0 pb-2 pt-2 text-xs data-[state=active]:border-emerald-500 data-[state=active]:bg-transparent data-[state=active]:shadow-none">
                          {t("site.environment")}
                        </TabsTrigger>
                      </TabsList>
                    </div>

                    <TabsContent value="deployments" className="flex-1 m-0 overflow-auto">
                      <DeploymentsWidget
                        deployments={deployments}
                        token={token}
                        orgSlug={orgSlug}
                        serverId={server.id}
                        siteId={selectedSite.id}
                        onRefresh={async () => {
                          invalidateCache(`site:${selectedSite.id}:deployments`);
                          const deps = await forgeListDeployments(token, orgSlug, server.id, selectedSite.id);
                          setDeployments(deps);
                        }}
                      />
                    </TabsContent>

                    <TabsContent value="site-logs" className="flex-1 m-0 flex flex-col min-h-0">
                      <SiteLogsWidget
                        token={token}
                        orgSlug={orgSlug}
                        serverId={server.id}
                        siteId={selectedSite.id}
                      />
                    </TabsContent>

                    <TabsContent value="env" className="flex-1 m-0 flex flex-col min-h-0">
                      <EnvWidget
                        key={selectedSite.id}
                        token={token}
                        orgSlug={orgSlug}
                        serverId={server.id}
                        siteId={selectedSite.id}
                      />
                    </TabsContent>
                  </Tabs>
                </div>
              ) : (
                <div className="flex h-full items-center justify-center rounded-lg border border-dashed border-border/40">
                  <div className="flex flex-col items-center gap-2 text-muted-foreground">
                    <Globe className="h-6 w-6 opacity-30" />
                    <p className="text-xs">{t("forge.selectSite")}</p>
                  </div>
                </div>
              )}
            </div>
          </div>
        </TabsContent>

        {/* Database - lazy */}
        <TabsContent value="database" className="mt-3 flex-1 min-h-0">
          <div className="h-full rounded-lg border border-border/50 bg-card/30 overflow-hidden">
            <DatabaseWidget token={token} orgSlug={orgSlug} serverId={server.id} />
          </div>
        </TabsContent>

        {/* Monitors - lazy */}
        <TabsContent value="monitors" className="mt-3">
          <MonitorsWidget token={token} orgSlug={orgSlug} serverId={server.id} />
        </TabsContent>

        {/* Events - lazy */}
        <TabsContent value="events" className="mt-3">
          <EventsWidget token={token} orgSlug={orgSlug} serverId={server.id} />
        </TabsContent>

        {/* Server Logs - lazy */}
        <TabsContent value="logs">
          <ServerLogsWidget token={token} orgSlug={orgSlug} serverId={server.id} phpVersion={server.php_version} />
        </TabsContent>
      </Tabs>
    </div>
  );
}
