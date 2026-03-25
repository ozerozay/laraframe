import { useState } from "react";
import { Server, RefreshCw, AlertCircle, Unplug, Eye, EyeOff } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import { t } from "@/lib/i18n";
import { cachedFetch, invalidateCache } from "@/lib/cache";
import {
  getApiKey,
  saveApiKey,
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
  const [tokenInput, setTokenInput] = useState("");
  const [showToken, setShowToken] = useState(false);
  const [savingToken, setSavingToken] = useState(false);

  const handleSaveToken = async () => {
    if (!tokenInput.trim()) return;
    setSavingToken(true);
    try {
      await saveApiKey(SERVICES.FORGE, tokenInput.trim());
      setTokenInput("");
      toast.success("Forge API token saved");
      init(true);
    } catch (err) {
      toast.error(`Failed: ${err}`);
    }
    setSavingToken(false);
  };

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

  /* ── Full-page states ── */

  if (!loading && !token) {
    return (
      <div className="flex h-full items-center justify-center">
        <div className="flex flex-col items-center gap-5 w-full max-w-sm">
          <div className="relative">
            <div className="absolute -inset-4 rounded-full bg-primary/5 blur-xl" />
            <div className="relative flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-primary/20 to-primary/5 border border-primary/10 shadow-lg shadow-primary/5">
              <Unplug className="h-6 w-6 text-primary/70" />
            </div>
          </div>
          <div className="text-center space-y-1">
            <p className="text-sm font-medium tracking-tight">{t("forge.notConnected")}</p>
            <p className="text-sm text-muted-foreground/70">{t("forge.notConnectedDesc")}</p>
          </div>
          <div className="w-full space-y-3">
            <div className="relative">
              <Input
                type={showToken ? "text" : "password"}
                placeholder="Forge API Token"
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
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-destructive/10 border border-destructive/20">
            <AlertCircle className="h-5 w-5 text-destructive" />
          </div>
          <p className="text-sm text-destructive/80 max-w-sm text-center leading-relaxed">{error}</p>
          <Button variant="outline" size="sm" className="h-7 text-sm" onClick={() => init(true)}>
            {t("app.retry")}
          </Button>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="flex h-full items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="relative">
            <div className="absolute inset-0 rounded-full bg-primary/10 animate-ping" />
            <RefreshCw className="relative h-5 w-5 animate-spin text-primary" />
          </div>
          <span className="text-xs font-medium tracking-[0.2em] uppercase text-muted-foreground/60">{t("forge.connecting")}</span>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-[calc(100vh-3rem)] flex-col">
      {/* Header — razor-thin, high density */}
      <div className="flex items-center justify-between shrink-0 pb-2">
        <div className="flex items-center gap-3">
          <h1 className="text-base font-semibold tracking-tight">{t("forge.title")}</h1>
          {user && (
            <span className="text-xs text-muted-foreground/50 font-mono">{user.name}</span>
          )}
          {orgs.length > 1 && (
            <div className="flex gap-0.5 ml-2 rounded-md bg-muted/30 p-0.5">
              {orgs.map((org) => (
                <button
                  key={org.id}
                  onClick={() => selectOrg(org)}
                  className={`rounded px-2 py-0.5 text-xs font-medium transition-all ${
                    selectedOrg?.id === org.id
                      ? "bg-background text-foreground shadow-sm"
                      : "text-muted-foreground hover:text-foreground"
                  }`}
                >
                  {org.name}
                </button>
              ))}
            </div>
          )}
        </div>
        <button
          className="flex items-center gap-1.5 rounded-md px-2 py-1 text-xs text-muted-foreground/60 hover:text-muted-foreground transition-colors"
          onClick={() => init(true)}
        >
          <RefreshCw className="h-3 w-3" />
          <span className="hidden sm:inline">{t("app.refresh")}</span>
        </button>
      </div>

      {/* Main layout */}
      <div className="flex flex-1 gap-0 min-h-0 rounded-lg border border-border/40 overflow-hidden">
        {/* Server sidebar — separated by subtle border */}
        <div className="border-r border-border/40 bg-card/20">
          <ServerList
            servers={servers}
            selectedId={selectedServer?.id ?? null}
            onSelect={setSelectedServer}
          />
        </div>

        {/* Content area */}
        <div className="flex-1 min-w-0 bg-background/50">
          {selectedServer ? (
            <ServerDetail
              key={selectedServer.id}
              server={selectedServer}
              token={token!}
              orgSlug={selectedOrg!.slug}
            />
          ) : (
            <div className="flex h-full items-center justify-center">
              <div className="flex flex-col items-center gap-3 text-muted-foreground/30">
                <Server className="h-8 w-8" />
                <p className="text-sm font-medium">{t("forge.selectServer")}</p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
