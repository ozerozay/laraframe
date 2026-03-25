import { useEffect, useState } from "react";
import { useSearchParams } from "react-router-dom";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Server, Cloud, Trash2, Eye, EyeOff, Globe, Check } from "lucide-react";
import { saveApiKey, deleteApiKey, hasApiKey, SERVICES } from "@/lib/tauri";
import { useTranslation, setLanguage } from "@/lib/i18n";
import { MCPSetup } from "@/components/settings/MCPSetup";

interface ApiKeyFieldProps {
  service: string;
  label: string;
  description: string;
  icon: React.ReactNode;
  placeholder: string;
}

function ApiKeyField({ service, label, description, icon, placeholder }: ApiKeyFieldProps) {
  const { t } = useTranslation();
  const [token, setToken] = useState("");
  const [connected, setConnected] = useState(false);
  const [loading, setLoading] = useState(true);
  const [showToken, setShowToken] = useState(false);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    hasApiKey(service).then((has) => {
      setConnected(has);
      setLoading(false);
    });
  }, [service]);

  const handleSave = async () => {
    if (!token.trim()) return;
    setSaving(true);
    try {
      await saveApiKey(service, token.trim());
      setConnected(true);
      setToken("");
    } catch (err) {
      console.error("Failed to save API key:", err);
    }
    setSaving(false);
  };

  const handleDelete = async () => {
    try {
      await deleteApiKey(service);
      setConnected(false);
    } catch (err) {
      console.error("Failed to delete API key:", err);
    }
  };

  if (loading) return null;

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            {icon}
            {label}
          </CardTitle>
          <Badge
            variant="outline"
            className={
              connected
                ? "bg-emerald-500/15 text-emerald-600 dark:text-emerald-400"
                : "bg-muted text-muted-foreground"
            }
          >
            {connected ? t("app.connected") : t("app.disconnected")}
          </Badge>
        </div>
        <CardDescription>{description}</CardDescription>
      </CardHeader>
      <CardContent>
        {connected ? (
          <div className="flex items-center gap-3">
            <p className="text-sm text-muted-foreground">{t("settings.keySaved")}</p>
            <Button variant="destructive" size="sm" onClick={handleDelete}>
              <Trash2 className="mr-2 h-4 w-4" />
              {t("settings.remove")}
            </Button>
          </div>
        ) : (
          <div className="flex gap-3">
            <div className="relative max-w-md flex-1">
              <Input
                type={showToken ? "text" : "password"}
                placeholder={placeholder}
                value={token}
                onChange={(e) => setToken(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleSave()}
              />
              <button
                type="button"
                onClick={() => setShowToken(!showToken)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
              >
                {showToken ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
            <Button onClick={handleSave} disabled={saving || !token.trim()}>
              {saving ? t("app.saving") : t("app.connected").split(" ")[0] || "Connect"}
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

const LANGUAGES = [
  { code: "en" as const, label: "English", flag: "🇺🇸" },
  { code: "tr" as const, label: "Turkce", flag: "🇹🇷" },
];

export function SettingsPage() {
  const { t, lang } = useTranslation();
  const [searchParams] = useSearchParams();
  const defaultTab = searchParams.get("tab") || "connections";

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">{t("settings.title")}</h1>
        <p className="text-muted-foreground">{t("settings.subtitle")}</p>
      </div>

      <Tabs defaultValue={defaultTab}>
        <TabsList>
          <TabsTrigger value="connections">{t("settings.apiConnections")}</TabsTrigger>
          <TabsTrigger value="mcp">MCP Setup</TabsTrigger>
          <TabsTrigger value="general">{t("settings.general")}</TabsTrigger>
        </TabsList>

        <TabsContent value="connections" className="mt-4 space-y-4">
          <ApiKeyField
            service={SERVICES.FORGE}
            label="Laravel Forge"
            description={t("settings.connectForge")}
            icon={<Server className="h-5 w-5" />}
            placeholder="Forge API Token"
          />
          <ApiKeyField
            service={SERVICES.CLOUD}
            label="Laravel Cloud"
            description={t("settings.connectCloud")}
            icon={<Cloud className="h-5 w-5" />}
            placeholder="Cloud API Token"
          />
          {/* Nightwatch has no REST API - removed */}
        </TabsContent>

        <TabsContent value="mcp" className="mt-4">
          <MCPSetup />
        </TabsContent>

        <TabsContent value="general" className="mt-4 space-y-4">
          {/* Language */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Globe className="h-5 w-5" />
                {t("settings.language")}
              </CardTitle>
              <CardDescription>
                {lang === "tr" ? "Uygulama dilini secin" : "Choose your preferred language"}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex gap-2">
                {LANGUAGES.map((l) => (
                  <button
                    key={l.code}
                    onClick={() => setLanguage(l.code)}
                    className={`flex items-center gap-2.5 rounded-lg border px-4 py-3 transition-all ${
                      lang === l.code
                        ? "border-primary bg-primary/5 text-foreground"
                        : "border-border hover:border-border/80 hover:bg-muted/30 text-muted-foreground"
                    }`}
                  >
                    <span className="text-lg">{l.flag}</span>
                    <span className="text-sm font-medium">{l.label}</span>
                    {lang === l.code && <Check className="h-4 w-4 text-primary ml-1" />}
                  </button>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* About */}
          <Card>
            <CardHeader>
              <CardTitle>{t("settings.about")}</CardTitle>
              <CardDescription>LaraFrame v0.1.0</CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">{t("settings.aboutDesc")}</p>
              <Separator className="my-4" />
              <p className="text-xs text-muted-foreground">{t("settings.builtWith")}</p>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
