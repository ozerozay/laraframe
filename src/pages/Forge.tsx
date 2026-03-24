import { useState } from "react";
import { Server, RefreshCw, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { t } from "@/lib/i18n";
import { cachedFetch, invalidateCache } from "@/lib/cache";
import {
  getApiKey,
  forgeGetUser,
  forgeListOrgs,
  forgeListServers,
  SERVICES,
  type ForgeUser,
  type ForgeOrganization,
  type ForgeServer,
} from "@/lib/tauri";

import { ServerList } from "@/components/forge/ServerList";
import { ServerDetail } from "@/components/forge/ServerDetail";

export function Forge() {
  const [token, setToken] = useState<string | null>(null);
  const [user, setUser] = useState<ForgeUser | null>(null);
  const [orgs, setOrgs] = useState<ForgeOrganization[]>([]);
  const [selectedOrg, setSelectedOrg] = useState<ForgeOrganization | null>(null);
  const [servers, setServers] = useState<ForgeServer[]>([]);
  const [selectedServer, setSelectedServer] = useState<ForgeServer | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [initialized, setInitialized] = useState(false);

  const init = async (force = false) => {
    setLoading(true);
    setError(null);
    if (force) invalidateCache("forge:");
    try {
      const key = await getApiKey(SERVICES.FORGE);
      setToken(key);
      if (key) {
        const [u, o] = await Promise.all([
          cachedFetch("forge:user", () => forgeGetUser(key), 300_000),
          cachedFetch("forge:orgs", () => forgeListOrgs(key), 300_000),
        ]);
        setUser(u);
        setOrgs(o);
        if (o.length > 0) {
          setSelectedOrg(o[0]);
          const s = await cachedFetch(`forge:servers:${o[0].slug}`, () =>
            forgeListServers(key, o[0].slug)
          );
          setServers(s);
        }
      }
    } catch (err) {
      setError(String(err));
    }
    setLoading(false);
  };

  // Init once, no useEffect
  if (!initialized) {
    setInitialized(true);
    init();
  }

  const selectOrg = async (org: ForgeOrganization) => {
    if (!token) return;
    setSelectedOrg(org);
    setSelectedServer(null);
    setServers([]);
    try {
      const s = await cachedFetch(`forge:servers:${org.slug}`, () =>
        forgeListServers(token, org.slug)
      );
      setServers(s);
    } catch (err) {
      setError(String(err));
    }
  };

  /* ── States ── */

  if (!loading && !token) {
    return (
      <div className="flex h-full items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-muted/30 border border-border/50">
            <Server className="h-7 w-7 text-muted-foreground" />
          </div>
          <div className="text-center">
            <p className="text-sm font-medium">{t("forge.notConnected")}</p>
            <p className="mt-1 text-xs text-muted-foreground">{t("forge.notConnectedDesc")}</p>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex h-full items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <AlertCircle className="h-8 w-8 text-red-500" />
          <p className="text-xs text-red-400 max-w-sm text-center">{error}</p>
          <Button variant="outline" size="sm" className="mt-2" onClick={() => init(true)}>
            {t("app.retry")}
          </Button>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="flex h-full items-center justify-center">
        <div className="flex flex-col items-center gap-3 text-muted-foreground">
          <RefreshCw className="h-5 w-5 animate-spin" />
          <span className="text-xs tracking-wide uppercase">{t("forge.connecting")}</span>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-[calc(100vh-3rem)] flex-col gap-3">
      {/* Header */}
      <div className="flex items-center justify-between shrink-0">
        <div className="flex items-center gap-3">
          <div>
            <h1 className="text-lg font-semibold tracking-tight">{t("forge.title")}</h1>
            {user && <p className="text-[11px] text-muted-foreground">{user.name}</p>}
          </div>
          {orgs.length > 1 && (
            <div className="flex gap-1 ml-4">
              {orgs.map((org) => (
                <button
                  key={org.id}
                  onClick={() => selectOrg(org)}
                  className={`rounded-md px-2.5 py-1 text-xs font-medium transition-colors ${
                    selectedOrg?.id === org.id
                      ? "bg-muted text-foreground"
                      : "text-muted-foreground hover:text-foreground"
                  }`}
                >
                  {org.name}
                </button>
              ))}
            </div>
          )}
        </div>
        <Button
          variant="ghost"
          size="sm"
          className="h-7 gap-1.5 text-xs text-muted-foreground hover:text-foreground"
          onClick={() => init(true)}
        >
          <RefreshCw className="h-3 w-3" />
          {t("app.refresh")}
        </Button>
      </div>

      {/* Layout */}
      <div className="flex flex-1 gap-3 min-h-0">
        <ServerList
          servers={servers}
          selectedId={selectedServer?.id ?? null}
          onSelect={setSelectedServer}
        />

        <div className="flex-1 min-w-0">
          {selectedServer ? (
            <ServerDetail
              key={selectedServer.id}
              server={selectedServer}
              token={token!}
              orgSlug={selectedOrg!.slug}
            />
          ) : (
            <div className="flex h-full items-center justify-center rounded-lg border border-dashed border-border/40">
              <div className="flex flex-col items-center gap-2 text-muted-foreground">
                <Server className="h-6 w-6 opacity-30" />
                <p className="text-xs">{t("forge.selectServer")}</p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
