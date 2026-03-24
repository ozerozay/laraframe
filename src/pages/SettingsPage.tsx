import { useEffect, useState } from "react";
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
import { Server, Cloud, Activity, Bot, Trash2, Eye, EyeOff } from "lucide-react";
import { saveApiKey, deleteApiKey, hasApiKey, SERVICES } from "@/lib/tauri";

interface ApiKeyFieldProps {
  service: string;
  label: string;
  description: string;
  icon: React.ReactNode;
  placeholder: string;
}

function ApiKeyField({ service, label, description, icon, placeholder }: ApiKeyFieldProps) {
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
            {connected ? "Connected" : "Disconnected"}
          </Badge>
        </div>
        <CardDescription>{description}</CardDescription>
      </CardHeader>
      <CardContent>
        {connected ? (
          <div className="flex items-center gap-3">
            <p className="text-sm text-muted-foreground">API key saved securely in your system keychain.</p>
            <Button variant="destructive" size="sm" onClick={handleDelete}>
              <Trash2 className="mr-2 h-4 w-4" />
              Remove
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
              {saving ? "Saving..." : "Connect"}
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

export function SettingsPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Settings</h1>
        <p className="text-muted-foreground">
          Configure your API connections and preferences.
        </p>
      </div>

      <Tabs defaultValue="connections">
        <TabsList>
          <TabsTrigger value="connections">API Connections</TabsTrigger>
          <TabsTrigger value="ai">AI Settings</TabsTrigger>
          <TabsTrigger value="general">General</TabsTrigger>
        </TabsList>

        <TabsContent value="connections" className="mt-4 space-y-4">
          <ApiKeyField
            service={SERVICES.FORGE}
            label="Laravel Forge"
            description="Connect your Forge account to manage servers and sites."
            icon={<Server className="h-5 w-5" />}
            placeholder="Forge API Token"
          />
          <ApiKeyField
            service={SERVICES.CLOUD}
            label="Laravel Cloud"
            description="Connect your Cloud account to manage applications."
            icon={<Cloud className="h-5 w-5" />}
            placeholder="Cloud API Token"
          />
          <ApiKeyField
            service={SERVICES.NIGHTWATCH}
            label="Nightwatch"
            description="Connect your Nightwatch account for monitoring."
            icon={<Activity className="h-5 w-5" />}
            placeholder="Nightwatch API Token"
          />
        </TabsContent>

        <TabsContent value="ai" className="mt-4 space-y-4">
          <ApiKeyField
            service={SERVICES.CLAUDE}
            label="Claude AI"
            description="Add your Anthropic API key to enable the AI assistant."
            icon={<Bot className="h-5 w-5" />}
            placeholder="sk-ant-..."
          />
        </TabsContent>

        <TabsContent value="general" className="mt-4 space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>About</CardTitle>
              <CardDescription>LaraFrame v0.1.0</CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">
                A unified desktop client for Laravel Cloud, Forge, and Nightwatch.
              </p>
              <Separator className="my-4" />
              <p className="text-xs text-muted-foreground">
                Built with Tauri, React, and Rust. API keys are stored securely in your OS keychain.
              </p>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
