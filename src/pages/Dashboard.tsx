import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Server, Cloud, Activity, Bot, ArrowRight } from "lucide-react";
import { hasApiKey, SERVICES } from "@/lib/tauri";

interface ServiceStatus {
  title: string;
  icon: typeof Server;
  path: string;
  service: string;
  connectedLabel: string;
  disconnectedLabel: string;
}

const services: ServiceStatus[] = [
  {
    title: "Laravel Forge",
    icon: Server,
    path: "/forge",
    service: SERVICES.FORGE,
    connectedLabel: "Connected",
    disconnectedLabel: "Not connected",
  },
  {
    title: "Laravel Cloud",
    icon: Cloud,
    path: "/cloud",
    service: SERVICES.CLOUD,
    connectedLabel: "Connected",
    disconnectedLabel: "Not connected",
  },
  {
    title: "Nightwatch",
    icon: Activity,
    path: "/nightwatch",
    service: SERVICES.NIGHTWATCH,
    connectedLabel: "Connected",
    disconnectedLabel: "Not connected",
  },
  {
    title: "AI Assistant",
    icon: Bot,
    path: "/ai",
    service: SERVICES.CLAUDE,
    connectedLabel: "Ready",
    disconnectedLabel: "No API key",
  },
];

export function Dashboard() {
  const navigate = useNavigate();
  const [statuses, setStatuses] = useState<Record<string, boolean>>({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function checkAll() {
      const results: Record<string, boolean> = {};
      for (const s of services) {
        try {
          results[s.service] = await hasApiKey(s.service);
        } catch {
          results[s.service] = false;
        }
      }
      setStatuses(results);
      setLoading(false);
    }
    checkAll();
  }, []);

  const connectedCount = Object.values(statuses).filter(Boolean).length;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Dashboard</h1>
        <p className="text-muted-foreground">
          Your Laravel ecosystem at a glance — {connectedCount}/4 services connected.
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {services.map((s) => {
          const connected = statuses[s.service];
          return (
            <Card
              key={s.title}
              className="cursor-pointer transition-colors hover:bg-muted/50"
              onClick={() => navigate(s.path)}
            >
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium">{s.title}</CardTitle>
                <s.icon className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="flex items-center justify-between">
                  <Badge
                    variant="outline"
                    className={
                      loading
                        ? "bg-muted text-muted-foreground"
                        : connected
                          ? "bg-emerald-500/15 text-emerald-600 dark:text-emerald-400"
                          : "bg-muted text-muted-foreground"
                    }
                  >
                    {loading
                      ? "Checking..."
                      : connected
                        ? s.connectedLabel
                        : s.disconnectedLabel}
                  </Badge>
                  <ArrowRight className="h-4 w-4 text-muted-foreground" />
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Getting Started</CardTitle>
            <CardDescription>Set up your connections</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {services.map((s) => (
              <div
                key={s.service}
                className="flex items-center justify-between rounded-lg border p-3"
              >
                <div className="flex items-center gap-3">
                  <s.icon className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm">{s.title}</span>
                </div>
                {statuses[s.service] ? (
                  <Badge
                    variant="outline"
                    className="bg-emerald-500/15 text-emerald-600 dark:text-emerald-400"
                  >
                    Done
                  </Badge>
                ) : (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => navigate("/settings")}
                  >
                    Connect
                  </Button>
                )}
              </div>
            ))}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Quick Actions</CardTitle>
            <CardDescription>Common tasks at your fingertips</CardDescription>
          </CardHeader>
          <CardContent className="space-y-2">
            <Button
              variant="outline"
              className="w-full justify-start"
              onClick={() => navigate("/forge")}
            >
              <Server className="mr-2 h-4 w-4" />
              View Forge Servers
            </Button>
            <Button
              variant="outline"
              className="w-full justify-start"
              onClick={() => navigate("/cloud")}
            >
              <Cloud className="mr-2 h-4 w-4" />
              View Cloud Apps
            </Button>
            <Button
              variant="outline"
              className="w-full justify-start"
              onClick={() => navigate("/ai")}
            >
              <Bot className="mr-2 h-4 w-4" />
              Ask AI Assistant
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
