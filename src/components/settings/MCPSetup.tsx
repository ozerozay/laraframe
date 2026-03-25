import { useState } from "react";
import { Copy, Check, ExternalLink, Info, CheckCircle2, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { getApiKey, getMcpServerPath, buildMcpServer, SERVICES } from "@/lib/tauri";

interface Tool {
  id: string;
  name: string;
  icon: string;
  configPath: string;
  description: string;
  docsUrl?: string;
}

const AI_TOOLS: Tool[] = [
  { id: "claude-code", name: "Claude Code", icon: "CC", configPath: ".mcp.json (project root)", description: "Auto-detected from project directory", docsUrl: "https://docs.anthropic.com/en/docs/claude-code" },
  { id: "claude-desktop", name: "Claude Desktop", icon: "CD", configPath: "~/Library/Application Support/Claude/claude_desktop_config.json", description: "macOS Claude Desktop app config" },
  { id: "cursor", name: "Cursor", icon: "Cu", configPath: ".cursor/mcp.json", description: "Project-level MCP config", docsUrl: "https://docs.cursor.com" },
  { id: "windsurf", name: "Windsurf", icon: "WS", configPath: "~/.codeium/windsurf/mcp_config.json", description: "Windsurf global config" },
  { id: "vscode", name: "VS Code", icon: "VS", configPath: ".vscode/mcp.json", description: "VS Code + GitHub Copilot" },
];

export function MCPSetup() {
  const [selectedTool, setSelectedTool] = useState<string>("claude-code");
  const [copied, setCopied] = useState<string | null>(null);
  const [forgeToken, setForgeToken] = useState<string | null>(null);
  const [cloudToken, setCloudToken] = useState<string | null>(null);
  const [mcpPath, setMcpPath] = useState<string | null>(null);
  const [mcpError, setMcpError] = useState<string | null>(null);
  const [building, setBuilding] = useState(false);
  const [loaded, setLoaded] = useState(false);

  if (!loaded) {
    setLoaded(true);
    getApiKey(SERVICES.FORGE).then(setForgeToken).catch(() => {});
    getApiKey(SERVICES.CLOUD).then(setCloudToken).catch(() => {});
    getMcpServerPath().then(setMcpPath).catch((e) => setMcpError(String(e)));
  }

  const tool = AI_TOOLS.find((t) => t.id === selectedTool)!;

  const generateConfig = () => {
    const path = mcpPath || "/path/to/LaraFrame/mcp-server/dist/index.js";
    const env: Record<string, string> = {};
    if (forgeToken) env.FORGE_API_TOKEN = forgeToken;
    if (cloudToken) env.CLOUD_API_TOKEN = cloudToken;

    if (selectedTool === "vscode") {
      return JSON.stringify({ servers: { laraframe: { type: "stdio", command: "node", args: [path], env } } }, null, 2);
    }
    return JSON.stringify({ mcpServers: { laraframe: { command: "node", args: [path], env } } }, null, 2);
  };

  const copyConfig = (id: string, text: string) => {
    navigator.clipboard.writeText(text);
    setCopied(id);
    toast.success("Copied to clipboard");
    setTimeout(() => setCopied(null), 2000);
  };

  const allReady = mcpPath && (forgeToken || cloudToken);

  return (
    <div className="space-y-4">
      {/* Status */}
      <div className="flex items-center gap-4 rounded-lg border p-3">
        <div className="flex items-center gap-2">
          {mcpPath ? <CheckCircle2 className="h-4 w-4 text-emerald-500" /> : <AlertCircle className="h-4 w-4 text-amber-500" />}
          <span className="text-sm">MCP Server</span>
          {mcpPath ? <Badge variant="outline" className="text-xs border-emerald-500/30 text-emerald-500">Ready</Badge> : <Badge variant="outline" className="text-xs border-amber-500/30 text-amber-500">Not found</Badge>}
        </div>
        <div className="flex items-center gap-2">
          {forgeToken ? <CheckCircle2 className="h-4 w-4 text-emerald-500" /> : <AlertCircle className="h-4 w-4 text-muted-foreground/30" />}
          <span className="text-sm">Forge</span>
        </div>
        <div className="flex items-center gap-2">
          {cloudToken ? <CheckCircle2 className="h-4 w-4 text-emerald-500" /> : <AlertCircle className="h-4 w-4 text-muted-foreground/30" />}
          <span className="text-sm">Cloud</span>
        </div>
        <span className="text-xs text-muted-foreground ml-auto">
          {allReady ? "Ready to connect" : "Connect at least one service first"}
        </span>
      </div>

      {mcpError && (
        <div className="rounded-lg border border-amber-500/20 bg-amber-500/5 p-3 flex items-center justify-between">
          <span className="text-xs text-amber-600 dark:text-amber-400">MCP server needs to be built before use.</span>
          <Button size="sm" className="h-7 text-xs gap-1" onClick={async () => {
            setBuilding(true);
            try {
              await buildMcpServer();
              toast.success("MCP server built successfully!");
              setMcpError(null);
              getMcpServerPath().then(setMcpPath).catch(() => {});
            } catch (err) {
              toast.error(`Build failed: ${err}`);
            }
            setBuilding(false);
          }} disabled={building}>
            {building ? <><span className="h-3 w-3 border-2 border-white/30 border-t-white rounded-full animate-spin" /> Building...</> : "Build Now"}
          </Button>
        </div>
      )}

      {/* Tool selector */}
      <div className="flex flex-wrap gap-2">
        {AI_TOOLS.map((t) => (
          <button
            key={t.id}
            onClick={() => setSelectedTool(t.id)}
            className={`flex items-center gap-2 rounded-lg border px-3 py-2 text-sm transition-all ${
              selectedTool === t.id
                ? "border-primary bg-primary/5 text-foreground"
                : "border-border hover:border-border/80 hover:bg-muted/30 text-muted-foreground"
            }`}
          >
            <span className="flex h-6 w-6 items-center justify-center rounded bg-muted text-xs font-bold">{t.icon}</span>
            {t.name}
          </button>
        ))}
      </div>

      {/* Config card */}
      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-sm">{tool.name}</CardTitle>
              <CardDescription className="text-xs">{tool.description}</CardDescription>
            </div>
            <div className="flex items-center gap-1.5">
              {tool.docsUrl && (
                <Button variant="ghost" size="sm" className="h-7 gap-1 text-xs" onClick={() => window.open(tool.docsUrl, "_blank")}>
                  <ExternalLink className="h-3 w-3" /> Docs
                </Button>
              )}
              <Button size="sm" className="h-7 gap-1 text-xs" onClick={() => copyConfig("main", generateConfig())}>
                {copied === "main" ? <Check className="h-3 w-3 text-emerald-500" /> : <Copy className="h-3 w-3" />}
                {copied === "main" ? "Copied!" : "Copy Config"}
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="text-xs text-muted-foreground">
            Paste into: <code className="rounded bg-muted px-1.5 py-0.5 font-mono">{tool.configPath}</code>
          </div>
          <pre className="rounded-lg bg-zinc-100 dark:bg-zinc-950 p-4 font-mono text-xs leading-relaxed overflow-auto max-h-64 text-foreground/80">
            {generateConfig()}
          </pre>
        </CardContent>
      </Card>

      {/* Nightwatch */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm flex items-center gap-2">
            <Info className="h-4 w-4" /> Nightwatch MCP
          </CardTitle>
          <CardDescription className="text-xs">Separate OAuth-based connection (no token needed)</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-2">
            <code className="flex-1 rounded-lg bg-zinc-100 dark:bg-zinc-950 px-3 py-2 font-mono text-xs select-all">
              claude mcp add --transport http nightwatch https://nightwatch.laravel.com/mcp
            </code>
            <Button size="sm" variant="outline" className="h-8 shrink-0" onClick={() => copyConfig("nw", "claude mcp add --transport http nightwatch https://nightwatch.laravel.com/mcp")}>
              {copied === "nw" ? <Check className="h-3 w-3" /> : <Copy className="h-3 w-3" />}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Tool list */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm">Available Tools ({(forgeToken ? 27 : 0) + (cloudToken ? 20 : 0)})</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-1.5 text-xs">
            {forgeToken && ["forge_list_servers", "forge_deploy", "forge_get_env", "forge_run_command", "forge_service_action", "forge_list_databases"].map((t) => (
              <code key={t} className="rounded bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 px-1.5 py-0.5 font-mono truncate">{t}</code>
            ))}
            {cloudToken && ["cloud_list_apps", "cloud_deploy", "cloud_run_command", "cloud_environment_logs", "cloud_add_variables", "cloud_list_databases"].map((t) => (
              <code key={t} className="rounded bg-blue-500/10 text-blue-700 dark:text-blue-400 px-1.5 py-0.5 font-mono truncate">{t}</code>
            ))}
            <span className="text-muted-foreground col-span-full">...and {(forgeToken ? 21 : 0) + (cloudToken ? 14 : 0)} more</span>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
