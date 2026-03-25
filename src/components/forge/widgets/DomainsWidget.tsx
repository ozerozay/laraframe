import { useState } from "react";
import {
  Globe, Plus, Trash2, RefreshCw, Shield, ShieldCheck, ShieldAlert,
  ChevronRight, ChevronDown, FileCode2, Lock,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { t } from "@/lib/i18n";
import { timeAgo } from "@/lib/helpers";
import { cachedFetch, invalidateCache } from "@/lib/cache";
import { EmptyState } from "../shared/EmptyState";
import { ConfirmDialog } from "../shared/ConfirmDialog";
import { LogViewer } from "../shared/LogViewer";
import {
  forgeListDomains, forgeCreateDomain, forgeDeleteDomain,
  forgeGetDomainNginx, forgeUpdateDomainNginx,
  forgeGetDomainCertificate, forgeCreateLetsencryptCert,
  type ForgeDomain, type ForgeCertificate,
} from "@/lib/tauri";

interface Props {
  token: string;
  orgSlug: string;
  serverId: string;
  siteId: string;
}

export function DomainsWidget({ token, orgSlug, serverId, siteId }: Props) {
  const [domains, setDomains] = useState<ForgeDomain[]>([]);
  const [loaded, setLoaded] = useState(false);
  const [loading, setLoading] = useState(false);

  // Create
  const [showCreate, setShowCreate] = useState(false);
  const [newDomain, setNewDomain] = useState("");
  const [creating, setCreating] = useState(false);

  // Delete
  const [deleteTarget, setDeleteTarget] = useState<ForgeDomain | null>(null);
  const [deleting, setDeleting] = useState(false);

  // Expanded domain detail
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [domainTab, setDomainTab] = useState<"ssl" | "nginx">("ssl");

  // SSL
  const [cert, setCert] = useState<ForgeCertificate | null>(null);
  const [certLoading, setCertLoading] = useState(false);
  const [certCreating, setCertCreating] = useState(false);

  // Nginx
  const [nginx, setNginx] = useState("");
  const [nginxLoading, setNginxLoading] = useState(false);
  const [nginxEditing, setNginxEditing] = useState(false);
  const [nginxDraft, setNginxDraft] = useState("");
  const [nginxSaving, setNginxSaving] = useState(false);

  const load = async (force = false) => {
    setLoading(true);
    if (force) invalidateCache(`site:${siteId}:domains`);
    try {
      const d = await cachedFetch(`site:${siteId}:domains`, () =>
        forgeListDomains(token, orgSlug, serverId, siteId)
      );
      setDomains(d);
      setLoaded(true);
    } catch (err) {
      console.error("Failed to load domains:", err);
      toast.error("Failed to load domains");
      setLoaded(true);
    }
    setLoading(false);
  };

  if (!loaded && !loading) load();

  const create = async () => {
    if (!newDomain.trim()) return;
    setCreating(true);
    try {
      await forgeCreateDomain(token, orgSlug, serverId, siteId, newDomain.trim());
      toast.success(`Domain "${newDomain.trim()}" added`);
      setNewDomain("");
      setShowCreate(false);
      load(true);
    } catch (err) {
      toast.error(`Failed: ${err}`);
    }
    setCreating(false);
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      await forgeDeleteDomain(token, orgSlug, serverId, siteId, deleteTarget.id);
      toast.success(`Domain "${deleteTarget.name}" deleted`);
      setDeleteTarget(null);
      if (expandedId === deleteTarget.id) setExpandedId(null);
      load(true);
    } catch (err) {
      toast.error(`Failed: ${err}`);
    }
    setDeleting(false);
  };

  const expand = async (domain: ForgeDomain) => {
    if (expandedId === domain.id) {
      setExpandedId(null);
      return;
    }
    setExpandedId(domain.id);
    setDomainTab("ssl");
    setCert(null);
    setNginx("");
    setNginxEditing(false);

    // Load SSL cert
    setCertLoading(true);
    try {
      const c = await cachedFetch(`domain:${domain.id}:cert`, () =>
        forgeGetDomainCertificate(token, orgSlug, serverId, siteId, domain.id),
        120_000
      );
      setCert(c);
    } catch (err) {
      console.error("Failed to load domain certificate:", err);
      setCert(null);
    }
    setCertLoading(false);
  };

  const loadNginx = async (domainId: string) => {
    setNginxLoading(true);
    try {
      const cfg = await cachedFetch(`domain:${domainId}:nginx`, () =>
        forgeGetDomainNginx(token, orgSlug, serverId, siteId, domainId),
        120_000
      );
      setNginx(cfg);
      setNginxDraft(cfg);
    } catch (err) {
      console.error("Failed to load domain nginx config:", err);
      setNginx("Failed to load nginx config");
    }
    setNginxLoading(false);
  };

  const saveNginx = async (domainId: string) => {
    setNginxSaving(true);
    try {
      await forgeUpdateDomainNginx(token, orgSlug, serverId, siteId, domainId, nginxDraft);
      setNginx(nginxDraft);
      setNginxEditing(false);
      invalidateCache(`domain:${domainId}:nginx`);
      toast.success("Nginx config updated");
    } catch (err) {
      toast.error(`Failed: ${err}`);
    }
    setNginxSaving(false);
  };

  const createCert = async (domainId: string) => {
    setCertCreating(true);
    try {
      await forgeCreateLetsencryptCert(token, orgSlug, serverId, siteId, domainId);
      toast.success("Let's Encrypt certificate requested");
      invalidateCache(`domain:${domainId}:cert`);
      // Reload cert
      const c = await forgeGetDomainCertificate(token, orgSlug, serverId, siteId, domainId);
      setCert(c);
    } catch (err) {
      toast.error(`Failed: ${err}`);
    }
    setCertCreating(false);
  };

  const statusColor = (status: string | null) => {
    if (!status) return "text-muted-foreground";
    if (status === "enabled" || status === "installed") return "text-emerald-500";
    if (status === "pending" || status === "connecting" || status === "securing" || status === "verifying" || status === "creating") return "text-amber-500";
    if (status === "disabled" || status === "removing") return "text-red-500";
    return "text-muted-foreground";
  };

  if (loading && !loaded) {
    return (
      <div className="flex h-32 items-center justify-center">
        <RefreshCw className="h-4 w-4 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-border/30 px-4 py-2">
        <span className="text-sm text-muted-foreground">Domains ({domains.length})</span>
        <div className="flex gap-1.5">
          <Button size="sm" variant="ghost" className="h-6 gap-1 px-2 text-xs" onClick={() => load(true)}>
            <RefreshCw className="h-3 w-3" /> {t("app.refresh")}
          </Button>
          <Button size="sm" className="h-6 gap-1 px-2 text-xs" onClick={() => setShowCreate(true)}>
            <Plus className="h-3 w-3" /> Add Domain
          </Button>
        </div>
      </div>

      {/* Create form */}
      {showCreate && (
        <div className="border-b border-border/30 px-4 py-3 bg-muted/20 flex items-center gap-2">
          <Input
            value={newDomain}
            onChange={(e) => setNewDomain(e.target.value)}
            placeholder="example.com"
            className="h-8 text-xs font-mono flex-1"
            autoFocus
            onKeyDown={(e) => e.key === "Enter" && create()}
          />
          <Button size="sm" className="h-8 text-xs" onClick={create} disabled={creating}>
            {creating ? <RefreshCw className="h-3 w-3 animate-spin" /> : t("app.create")}
          </Button>
          <Button size="sm" variant="ghost" className="h-8 text-xs" onClick={() => setShowCreate(false)}>
            {t("app.cancel")}
          </Button>
        </div>
      )}

      {/* Domain list */}
      <div className="flex-1 overflow-auto">
        {domains.length === 0 ? (
          <EmptyState icon={Globe} title="No domains" description="Add a domain to manage DNS, SSL, and Nginx config" />
        ) : (
          <div className="divide-y divide-border/30">
            {domains.map((domain) => {
              const isExpanded = expandedId === domain.id;
              return (
                <div key={domain.id}>
                  {/* Domain row */}
                  <div
                    className="flex items-center gap-3 px-4 py-3 group hover:bg-muted/20 cursor-pointer transition-colors"
                    onClick={() => expand(domain)}
                  >
                    <Globe className={`h-4 w-4 shrink-0 ${statusColor(domain.status)}`} />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <p className="text-sm font-medium truncate">{domain.name}</p>
                        {domain.domain_type === "primary" && (
                          <Badge variant="outline" className="text-xs h-4 px-1.5 font-normal border-primary/30 text-primary">
                            primary
                          </Badge>
                        )}
                      </div>
                      <div className="flex items-center gap-2 mt-0.5">
                        <Badge variant="outline" className={`text-xs h-4 px-1.5 font-normal ${statusColor(domain.status)}`}>
                          {domain.status || "unknown"}
                        </Badge>
                        {domain.www_redirect_type && domain.www_redirect_type !== "none" && (
                          <span className="text-xs text-muted-foreground">{domain.www_redirect_type}</span>
                        )}
                        <span className="text-xs text-muted-foreground">{timeAgo(domain.created_at)}</span>
                      </div>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <Button
                        size="icon"
                        variant="ghost"
                        className="h-6 w-6 opacity-0 group-hover:opacity-100 text-muted-foreground hover:text-red-400"
                        onClick={(e) => { e.stopPropagation(); setDeleteTarget(domain); }}
                        aria-label="Delete"
                      >
                        <Trash2 className="h-3 w-3" />
                      </Button>
                      {isExpanded ? <ChevronDown className="h-4 w-4 text-muted-foreground" /> : <ChevronRight className="h-4 w-4 text-muted-foreground" />}
                    </div>
                  </div>

                  {/* Expanded detail */}
                  {isExpanded && (
                    <div className="border-t border-border/20 bg-muted/5">
                      {/* Sub-tabs */}
                      <div className="flex items-center gap-1 px-4 py-2 border-b border-border/20">
                        <button
                          onClick={() => setDomainTab("ssl")}
                          className={`rounded-md px-2.5 py-1 text-xs font-medium transition-colors ${
                            domainTab === "ssl" ? "bg-muted text-foreground" : "text-muted-foreground hover:text-foreground"
                          }`}
                        >
                          <Lock className="h-3 w-3 inline mr-1" />SSL
                        </button>
                        <button
                          onClick={() => { setDomainTab("nginx"); if (!nginx) loadNginx(domain.id); }}
                          className={`rounded-md px-2.5 py-1 text-xs font-medium transition-colors ${
                            domainTab === "nginx" ? "bg-muted text-foreground" : "text-muted-foreground hover:text-foreground"
                          }`}
                        >
                          <FileCode2 className="h-3 w-3 inline mr-1" />Nginx
                        </button>
                      </div>

                      {/* SSL Tab */}
                      {domainTab === "ssl" && (
                        <div className="px-4 py-4">
                          {certLoading ? (
                            <div className="flex items-center gap-2 text-muted-foreground">
                              <RefreshCw className="h-3.5 w-3.5 animate-spin" />
                              <span className="text-xs">Loading certificate...</span>
                            </div>
                          ) : cert ? (
                            <div className="space-y-3">
                              <div className="flex items-center gap-3 rounded-lg border border-border/30 p-3">
                                {cert.status === "installed" ? (
                                  <ShieldCheck className="h-5 w-5 text-emerald-500 shrink-0" />
                                ) : (
                                  <ShieldAlert className="h-5 w-5 text-amber-500 shrink-0" />
                                )}
                                <div className="flex-1">
                                  <p className="text-sm font-medium">
                                    {cert.cert_type === "letsencrypt" ? "Let's Encrypt" : cert.cert_type || "Certificate"}
                                  </p>
                                  <div className="flex items-center gap-2 mt-0.5">
                                    <Badge variant="outline" className={`text-xs h-4 px-1.5 font-normal ${statusColor(cert.status)}`}>
                                      {cert.status}
                                    </Badge>
                                    {cert.request_status && (
                                      <Badge variant="outline" className={`text-xs h-4 px-1.5 font-normal ${statusColor(cert.request_status)}`}>
                                        {cert.request_status}
                                      </Badge>
                                    )}
                                    <span className="text-xs text-muted-foreground">{timeAgo(cert.created_at)}</span>
                                  </div>
                                </div>
                              </div>
                            </div>
                          ) : (
                            <div className="space-y-3">
                              <div className="flex items-center gap-3 rounded-lg border border-dashed border-border/40 p-4">
                                <Shield className="h-5 w-5 text-muted-foreground/30 shrink-0" />
                                <div className="flex-1">
                                  <p className="text-sm font-medium text-muted-foreground">No SSL certificate</p>
                                  <p className="text-xs text-muted-foreground/60 mt-0.5">Secure this domain with a free Let's Encrypt certificate</p>
                                </div>
                                <Button
                                  size="sm"
                                  className="h-7 gap-1.5 text-xs"
                                  onClick={() => createCert(domain.id)}
                                  disabled={certCreating}
                                >
                                  {certCreating ? <RefreshCw className="h-3 w-3 animate-spin" /> : <Lock className="h-3 w-3" />}
                                  Install Let's Encrypt
                                </Button>
                              </div>
                            </div>
                          )}
                        </div>
                      )}

                      {/* Nginx Tab */}
                      {domainTab === "nginx" && (
                        <div className="flex flex-col">
                          <div className="flex items-center justify-between px-4 py-2 border-b border-border/20">
                            <span className="text-xs text-muted-foreground font-mono">nginx.conf</span>
                            <div className="flex gap-1.5">
                              {nginxEditing ? (
                                <>
                                  <Button size="sm" className="h-6 gap-1 px-2 text-xs" onClick={() => saveNginx(domain.id)} disabled={nginxSaving}>
                                    {nginxSaving ? <RefreshCw className="h-3 w-3 animate-spin" /> : t("app.save")}
                                  </Button>
                                  <Button size="sm" variant="ghost" className="h-6 px-2 text-xs" onClick={() => { setNginxDraft(nginx); setNginxEditing(false); }}>
                                    {t("app.cancel")}
                                  </Button>
                                </>
                              ) : (
                                <Button size="sm" variant="ghost" className="h-6 gap-1 px-2 text-xs" onClick={() => { setNginxDraft(nginx); setNginxEditing(true); }}>
                                  {t("app.edit")}
                                </Button>
                              )}
                            </div>
                          </div>
                          {nginxLoading ? (
                            <div className="flex items-center justify-center py-8">
                              <RefreshCw className="h-4 w-4 animate-spin text-muted-foreground" />
                            </div>
                          ) : nginxEditing ? (
                            <textarea
                              className="h-64 resize-none bg-zinc-100 dark:bg-zinc-950 px-2 py-3 pl-10 font-mono text-xs leading-5 text-foreground/80 focus:outline-none w-full"
                              value={nginxDraft}
                              onChange={(e) => setNginxDraft(e.target.value)}
                              spellCheck={false}
                            />
                          ) : (
                            <div className="h-64 overflow-auto bg-zinc-100 dark:bg-zinc-950 px-2 py-3 font-mono text-xs leading-5">
                              <LogViewer content={nginx} color="blue" />
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Delete confirmation */}
      <ConfirmDialog
        open={!!deleteTarget}
        title="Delete Domain"
        description={`This will remove "${deleteTarget?.name}" and its SSL certificate. This action cannot be undone.`}
        typeToConfirm={deleteTarget?.name}
        variant="danger"
        loading={deleting}
        onConfirm={handleDelete}
        onCancel={() => setDeleteTarget(null)}
      />
    </div>
  );
}
