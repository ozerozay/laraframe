import { useState, useRef, useCallback } from "react";
import { Globe, RefreshCw } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "sonner";
import { t } from "@/lib/i18n";
import { cachedFetch, invalidateCache, setCache } from "@/lib/cache";
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
import { DeployScriptWidget } from "./widgets/DeployScriptWidget";
import { SiteLogsWidget } from "./widgets/SiteLogsWidget";
import { EnvWidget } from "./widgets/EnvWidget";
import { NginxConfigWidget } from "./widgets/NginxConfigWidget";
import { IntegrationsWidget } from "./widgets/IntegrationsWidget";
import { CommandsWidget } from "./widgets/CommandsWidget";
import { ScheduledJobsWidget } from "./widgets/ScheduledJobsWidget";
import { RedirectRulesWidget } from "./widgets/RedirectRulesWidget";
import { SecurityRulesWidget } from "./widgets/SecurityRulesWidget";
import { WebhooksWidget } from "./widgets/WebhooksWidget";
import { HeartbeatsWidget } from "./widgets/HeartbeatsWidget";
import { DomainsWidget } from "./widgets/DomainsWidget";
import { HealthcheckWidget } from "./widgets/HealthcheckWidget";
import { HelpPanel, HelpButton } from "./shared/HelpPanel";
import { EventsWidget } from "./widgets/EventsWidget";
import { MonitorsWidget } from "./widgets/MonitorsWidget";
import { ServerLogsWidget } from "./widgets/ServerLogsWidget";
import { DatabaseWidget } from "./widgets/DatabaseWidget";
import { SSHKeysWidget } from "./widgets/SSHKeysWidget";
import { FirewallWidget } from "./widgets/FirewallWidget";
import { DaemonsWidget } from "./widgets/DaemonsWidget";
import { ServiceActionsWidget } from "./widgets/ServiceActionsWidget";
import { PHPVersionsWidget } from "./widgets/PHPVersionsWidget";
import { RecipesWidget } from "./widgets/RecipesWidget";
import { SiteCreateDeleteWidget } from "./widgets/SiteCreateDeleteWidget";

const TAB_STYLE = "h-7 px-3 rounded-md text-xs font-medium text-muted-foreground data-[state=active]:bg-muted data-[state=active]:text-foreground data-[state=active]:shadow-sm hover:text-foreground transition-all whitespace-nowrap";

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
  const [helpOpen, setHelpOpen] = useState(false);
  const [helpSection, setHelpSection] = useState<string | null>(null);

  const openHelp = (sectionId: string) => {
    setHelpSection(sectionId);
    setHelpOpen(true);
  };

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

  // Use refs to avoid stale closures in polling
  const deploymentsRef = useRef(deployments);
  deploymentsRef.current = deployments;
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Clean up polling on unmount
  const stopPolling = useCallback(() => {
    if (pollRef.current) {
      clearInterval(pollRef.current);
      pollRef.current = null;
    }
  }, []);

  const refreshData = useCallback(async (siteId: string) => {
    invalidateCache(`site:${siteId}:deployments`);
    invalidateCache(`server:${server.id}:sites`);
    const [newDeps, newSites] = await Promise.all([
      forgeListDeployments(token, orgSlug, server.id, siteId),
      forgeListSites(token, orgSlug, server.id),
    ]);
    setCache(`site:${siteId}:deployments`, newDeps);
    setCache(`server:${server.id}:sites`, newSites);
    // Force React to update by using functional setState
    setDeployments(() => newDeps);
    setSites(() => newSites);
    const updated = newSites.find((s) => s.id === siteId);
    if (updated) setSelectedSite(() => updated);
    return { deps: newDeps, site: updated };
  }, [token, orgSlug, server.id]);

  const deploySite = async (site: ForgeSite) => {
    setDeployingId(site.id);
    const toastId = toast.loading(`Deploying ${site.name}...`);
    try {
      await forgeDeploySite(token, orgSlug, server.id, site.id);
      toast.success(`Deployment queued`, { id: toastId, description: site.name });

      // Wait then do initial refresh
      await new Promise((r) => setTimeout(r, 2000));
      await refreshData(site.id);

      // Start polling with setInterval (no closure issues)
      stopPolling();
      pollRef.current = setInterval(async () => {
        try {
          const { deps, site: current } = await refreshData(site.id);
          const status = current?.deployment_status;
          if (!status || !["deploying", "queued"].includes(status)) {
            stopPolling();
            setDeployingId(null);
            const latest = [...deps].pop();
            if (latest?.status === "failed") {
              toast.error(`Deployment failed: ${site.name}`, { description: latest.commit_message || undefined });
            } else {
              toast.success(`Deployed: ${site.name}`, { description: latest?.commit_message || undefined });
            }
          }
        } catch {
          stopPolling();
          setDeployingId(null);
        }
      }, 5000);

      // Safety timeout: stop polling after 5 minutes
      setTimeout(() => {
        if (pollRef.current) {
          stopPolling();
          setDeployingId(null);
        }
      }, 300_000);
    } catch (err) {
      toast.error(`Deploy failed: ${site.name}`, { id: toastId, description: String(err) });
      setDeployingId(null);
    }
  };

  if (sitesLoading) {
    return (
      <div className="flex h-full items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <RefreshCw className="h-4 w-4 animate-spin text-primary/60" />
          <span className="text-xs font-medium tracking-[0.15em] uppercase text-muted-foreground/40">{t("forge.loadingServer")}</span>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-full flex-col">
      <ServerInfoBar server={server} />

      <Tabs defaultValue="sites" className="flex-1 flex flex-col min-h-0">
        <div className="border-b border-border/30 px-3 py-1.5">
          <TabsList className="h-8 gap-1 bg-transparent p-0">
            {[
              { value: "sites", label: `${t("forge.sites")} (${sites.length})` },
              { value: "database", label: t("forge.database") },
              { value: "daemons", label: "Daemons" },
              { value: "ssh-keys", label: "SSH Keys" },
              { value: "firewall", label: "Firewall" },
              { value: "php", label: "PHP" },
              { value: "services", label: "Services" },
              { value: "recipes", label: "Recipes" },
              { value: "monitors", label: t("forge.monitors") },
              { value: "events", label: t("forge.events") },
              { value: "logs", label: t("forge.serverLogs") },
            ].map((tab) => (
              <TabsTrigger key={tab.value} value={tab.value} className={TAB_STYLE}>
                {tab.label}
              </TabsTrigger>
            ))}
          </TabsList>
        </div>

        {/* Sites */}
        <TabsContent value="sites" className="flex-1 min-h-0 m-0">
          <div className="flex h-full">
            <div className="w-64 shrink-0 flex flex-col border-r border-border/30">
              <div className="px-3 py-2 border-b border-border/20">
                <SiteCreateDeleteWidget
                  token={token}
                  orgSlug={orgSlug}
                  serverId={server.id}
                  onSiteCreated={() => { invalidateCache(`server:${server.id}:sites`); setSitesLoaded(false); }}
                  onSiteDeleted={() => { setSelectedSite(null); invalidateCache(`server:${server.id}:sites`); setSitesLoaded(false); }}
                  selectedSiteId={selectedSite?.id ?? null}
                  selectedSiteName={selectedSite?.name ?? null}
                />
              </div>
              <SiteList
              sites={sites}
              selectedId={selectedSite?.id ?? null}
              onSelect={selectSite}
            />
            </div>

            <div className="flex-1 min-w-0">
              {selectedSite && siteLoading ? (
                <div className="flex h-full items-center justify-center">
                  <div className="flex flex-col items-center gap-3">
                    <RefreshCw className="h-4 w-4 animate-spin text-primary/60" />
                    <p className="text-xs text-muted-foreground/40">{selectedSite.name}</p>
                  </div>
                </div>
              ) : selectedSite ? (
                <div className="flex h-full flex-col">
                  <SiteHeader
                    site={selectedSite}
                    deploying={deployingId === selectedSite.id}
                    onDeploy={() => deploySite(selectedSite)}
                  />

                  <Tabs defaultValue="deployments" className="flex-1 flex flex-col min-h-0">
                    <div className="border-b border-border/30 px-3 py-1.5 overflow-x-auto">
                      <TabsList className="h-8 gap-1 bg-transparent p-0 flex-nowrap">
                        {[
                          { value: "deployments", label: t("site.deployments"), helpId: "deployments" },
                          { value: "deploy-script", label: "Script", helpId: "deploy-script" },
                          { value: "site-logs", label: t("site.logs"), helpId: "site-logs" },
                          { value: "env", label: "Env", helpId: "env" },
                          { value: "nginx", label: "Nginx", helpId: "nginx" },
                          { value: "domains", label: "Domains", helpId: "domains" },
                          { value: "integrations", label: "Integrations", helpId: "integrations" },
                          { value: "commands", label: "Commands", helpId: "commands" },
                          { value: "jobs", label: "Jobs", helpId: "jobs" },
                          { value: "redirects", label: "Redirects", helpId: "redirects" },
                          { value: "security", label: "Security", helpId: "security" },
                          { value: "webhooks", label: "Webhooks", helpId: "webhooks" },
                          { value: "heartbeats", label: "Heartbeats", helpId: "heartbeats" },
                          { value: "healthcheck", label: "Health", helpId: "heartbeats" },
                        ].map((tab) => (
                          <TabsTrigger key={tab.value} value={tab.value} className={TAB_STYLE}>
                            {tab.label}
                          </TabsTrigger>
                        ))}
                        <HelpButton sectionId="deployments" onOpen={openHelp} />
                      </TabsList>
                    </div>

                    <TabsContent value="deployments" className="flex-1 m-0 overflow-auto">
                      <DeploymentsWidget
                        deployments={deployments}
                        token={token}
                        orgSlug={orgSlug}
                        serverId={server.id}
                        siteId={selectedSite.id}
                        onRefresh={() => refreshData(selectedSite.id)}
                      />
                    </TabsContent>

                    <TabsContent value="deploy-script" className="flex-1 m-0 flex flex-col min-h-0">
                      <DeployScriptWidget token={token} orgSlug={orgSlug} serverId={server.id} siteId={selectedSite.id} />
                    </TabsContent>

                    <TabsContent value="site-logs" className="flex-1 m-0 flex flex-col min-h-0">
                      <SiteLogsWidget token={token} orgSlug={orgSlug} serverId={server.id} siteId={selectedSite.id} />
                    </TabsContent>

                    <TabsContent value="env" className="flex-1 m-0 flex flex-col min-h-0">
                      <EnvWidget key={selectedSite.id} token={token} orgSlug={orgSlug} serverId={server.id} siteId={selectedSite.id} />
                    </TabsContent>

                    <TabsContent value="nginx" className="flex-1 m-0 flex flex-col min-h-0">
                      <NginxConfigWidget token={token} orgSlug={orgSlug} serverId={server.id} siteId={selectedSite.id} />
                    </TabsContent>

                    <TabsContent value="domains" className="flex-1 m-0 flex flex-col min-h-0">
                      <DomainsWidget token={token} orgSlug={orgSlug} serverId={server.id} siteId={selectedSite.id} />
                    </TabsContent>

                    <TabsContent value="integrations" className="flex-1 m-0 overflow-auto">
                      <IntegrationsWidget token={token} orgSlug={orgSlug} serverId={server.id} siteId={selectedSite.id} />
                    </TabsContent>

                    <TabsContent value="commands" className="flex-1 m-0 flex flex-col min-h-0">
                      <CommandsWidget token={token} orgSlug={orgSlug} serverId={server.id} siteId={selectedSite.id} />
                    </TabsContent>

                    <TabsContent value="jobs" className="flex-1 m-0 flex flex-col min-h-0">
                      <ScheduledJobsWidget token={token} orgSlug={orgSlug} serverId={server.id} siteId={selectedSite.id} />
                    </TabsContent>

                    <TabsContent value="redirects" className="flex-1 m-0 flex flex-col min-h-0">
                      <RedirectRulesWidget token={token} orgSlug={orgSlug} serverId={server.id} siteId={selectedSite.id} />
                    </TabsContent>

                    <TabsContent value="security" className="flex-1 m-0 flex flex-col min-h-0">
                      <SecurityRulesWidget token={token} orgSlug={orgSlug} serverId={server.id} siteId={selectedSite.id} />
                    </TabsContent>

                    <TabsContent value="webhooks" className="flex-1 m-0 flex flex-col min-h-0">
                      <WebhooksWidget token={token} orgSlug={orgSlug} serverId={server.id} siteId={selectedSite.id} />
                    </TabsContent>

                    <TabsContent value="heartbeats" className="flex-1 m-0 flex flex-col min-h-0">
                      <HeartbeatsWidget token={token} orgSlug={orgSlug} serverId={server.id} siteId={selectedSite.id} />
                    </TabsContent>

                    <TabsContent value="healthcheck" className="flex-1 m-0 overflow-auto">
                      <HealthcheckWidget token={token} orgSlug={orgSlug} serverId={server.id} siteId={selectedSite.id} />
                    </TabsContent>
                  </Tabs>
                </div>
              ) : (
                <div className="flex h-full items-center justify-center">
                  <div className="flex flex-col items-center gap-2 text-muted-foreground/20">
                    <Globe className="h-8 w-8" />
                    <p className="text-sm font-medium">{t("forge.selectSite")}</p>
                  </div>
                </div>
              )}
            </div>
          </div>
        </TabsContent>

        <TabsContent value="database" className="flex-1 min-h-0 m-0">
          <div className="h-full">
            <DatabaseWidget token={token} orgSlug={orgSlug} serverId={server.id} />
          </div>
        </TabsContent>

        <TabsContent value="daemons" className="flex-1 min-h-0 m-0">
          <DaemonsWidget token={token} orgSlug={orgSlug} serverId={server.id} />
        </TabsContent>

        <TabsContent value="ssh-keys" className="flex-1 min-h-0 m-0">
          <SSHKeysWidget token={token} orgSlug={orgSlug} serverId={server.id} />
        </TabsContent>

        <TabsContent value="firewall" className="flex-1 min-h-0 m-0">
          <FirewallWidget token={token} orgSlug={orgSlug} serverId={server.id} />
        </TabsContent>

        <TabsContent value="php" className="flex-1 min-h-0 m-0">
          <PHPVersionsWidget token={token} orgSlug={orgSlug} serverId={server.id} />
        </TabsContent>

        <TabsContent value="services" className="flex-1 m-0 overflow-auto">
          <ServiceActionsWidget token={token} orgSlug={orgSlug} serverId={server.id} />
        </TabsContent>

        <TabsContent value="recipes" className="flex-1 min-h-0 m-0">
          <RecipesWidget token={token} orgSlug={orgSlug} serverId={server.id} />
        </TabsContent>

        <TabsContent value="monitors" className="flex-1 m-0 p-4 overflow-auto">
          <MonitorsWidget token={token} orgSlug={orgSlug} serverId={server.id} />
        </TabsContent>

        <TabsContent value="events" className="flex-1 m-0 p-4 overflow-auto">
          <EventsWidget token={token} orgSlug={orgSlug} serverId={server.id} />
        </TabsContent>

        <TabsContent value="logs" className="flex-1 m-0">
          <ServerLogsWidget token={token} orgSlug={orgSlug} serverId={server.id} phpVersion={server.php_version} />
        </TabsContent>
      </Tabs>

      <HelpPanel
        open={helpOpen}
        onClose={() => setHelpOpen(false)}
        activeSection={helpSection}
      />
    </div>
  );
}
