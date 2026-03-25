import { Activity, ExternalLink, Webhook, Info, Copy, Check } from "lucide-react";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "sonner";
import { openUrl } from "@tauri-apps/plugin-opener";

function CopyButton({ text }: { text: string }) {
  const [copied, setCopied] = useState(false);
  const copy = () => {
    navigator.clipboard.writeText(text);
    toast.success("Copied to clipboard");
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };
  return (
    <Button size="sm" variant="outline" className="h-7 gap-1 text-xs shrink-0" onClick={copy}>
      {copied ? <Check className="h-3 w-3 text-emerald-500" /> : <Copy className="h-3 w-3" />}
      {copied ? "Copied" : "Copy"}
    </Button>
  );
}

function ExtLink({ url, children }: { url: string; children: React.ReactNode }) {
  return (
    <Button className="w-full gap-2" onClick={() => openUrl(url)}>
      <ExternalLink className="h-4 w-4" />
      {children}
    </Button>
  );
}

function ExtLinkOutline({ url, children }: { url: string; children: React.ReactNode }) {
  return (
    <Button variant="outline" className="w-full gap-2" onClick={() => openUrl(url)}>
      <ExternalLink className="h-4 w-4" />
      {children}
    </Button>
  );
}

const MCP_CONFIGS: Record<string, { name: string; command: string }> = {
  "claude-code": {
    name: "Claude Code",
    command: "claude mcp add --transport http nightwatch https://nightwatch.laravel.com/mcp",
  },
  "claude-desktop": {
    name: "Claude Desktop",
    command: `Add to ~/Library/Application Support/Claude/claude_desktop_config.json:
{
  "mcpServers": {
    "nightwatch": {
      "url": "https://nightwatch.laravel.com/mcp"
    }
  }
}`,
  },
  "cursor": {
    name: "Cursor",
    command: `Add to .cursor/mcp.json:
{
  "mcpServers": {
    "nightwatch": {
      "url": "https://nightwatch.laravel.com/mcp"
    }
  }
}`,
  },
  "windsurf": {
    name: "Windsurf",
    command: `Add to ~/.codeium/windsurf/mcp_config.json:
{
  "mcpServers": {
    "nightwatch": {
      "url": "https://nightwatch.laravel.com/mcp"
    }
  }
}`,
  },
};

export function Nightwatch() {
  const [selectedMcp, setSelectedMcp] = useState("claude-code");

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Nightwatch</h1>
        <p className="text-muted-foreground">Laravel application monitoring & observability</p>
      </div>

      {/* Info */}
      <div className="rounded-lg border border-primary/20 bg-primary/5 p-4 flex items-start gap-3">
        <Info className="h-5 w-5 text-primary shrink-0 mt-0.5" />
        <div>
          <p className="text-sm font-medium">Nightwatch doesn't have a REST API</p>
          <p className="text-sm text-muted-foreground mt-1">
            Use the web dashboard for monitoring, MCP server for AI-powered issue management, and webhooks for real-time notifications.
          </p>
        </div>
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        {/* Dashboard */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2"><Activity className="h-5 w-5" /> Dashboard</CardTitle>
            <CardDescription>View exceptions, performance, logs, queries, and more.</CardDescription>
          </CardHeader>
          <CardContent>
            <ExtLink url="https://nightwatch.laravel.com">Open Nightwatch Dashboard</ExtLink>
          </CardContent>
        </Card>

        {/* MCP */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2"><Activity className="h-5 w-5" /> MCP Server</CardTitle>
            <CardDescription>Connect AI tools to browse issues, view stack traces, and manage exceptions via OAuth.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex flex-wrap gap-1.5">
              {Object.entries(MCP_CONFIGS).map(([id, cfg]) => (
                <button
                  key={id}
                  onClick={() => setSelectedMcp(id)}
                  className={`rounded-md px-2.5 py-1 text-xs font-medium transition-colors ${
                    selectedMcp === id ? "bg-muted text-foreground" : "text-muted-foreground hover:text-foreground"
                  }`}
                >
                  {cfg.name}
                </button>
              ))}
            </div>
            <div className="flex items-start gap-2">
              <pre className="flex-1 rounded-lg bg-zinc-100 dark:bg-zinc-950 p-3 font-mono text-xs leading-relaxed overflow-auto max-h-32 text-emerald-700 dark:text-emerald-400 select-all">
                {MCP_CONFIGS[selectedMcp].command}
              </pre>
              <CopyButton text={MCP_CONFIGS[selectedMcp].command} />
            </div>
            <div className="text-xs text-muted-foreground space-y-0.5">
              <p><strong>Capabilities:</strong> List apps, browse issues, view stack traces, resolve/ignore issues, add comments</p>
            </div>
          </CardContent>
        </Card>

        {/* Webhooks */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2"><Webhook className="h-5 w-5" /> Webhooks</CardTitle>
            <CardDescription>Receive real-time push notifications for issue events.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="grid grid-cols-2 gap-1.5 text-xs">
              <div className="rounded border px-2 py-1.5">
                <span className="font-mono text-amber-600 dark:text-amber-400">issue.opened</span>
                <p className="mt-0.5 text-muted-foreground">New exception detected</p>
              </div>
              <div className="rounded border px-2 py-1.5">
                <span className="font-mono text-emerald-600 dark:text-emerald-400">issue.resolved</span>
                <p className="mt-0.5 text-muted-foreground">Issue marked resolved</p>
              </div>
              <div className="rounded border px-2 py-1.5">
                <span className="font-mono text-blue-600 dark:text-blue-400">issue.reopened</span>
                <p className="mt-0.5 text-muted-foreground">Resolved issue recurs</p>
              </div>
              <div className="rounded border px-2 py-1.5">
                <span className="font-mono text-zinc-500">issue.ignored</span>
                <p className="mt-0.5 text-muted-foreground">Issue marked ignored</p>
              </div>
            </div>
            <ExtLinkOutline url="https://nightwatch.laravel.com/docs/webhooks">Webhook Documentation</ExtLinkOutline>
          </CardContent>
        </Card>

        {/* Setup */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2"><Info className="h-5 w-5" /> Setup Guide</CardTitle>
            <CardDescription>Install the Nightwatch agent in your Laravel app.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <pre className="flex-1 rounded-lg bg-zinc-100 dark:bg-zinc-950 px-3 py-2 font-mono text-xs text-emerald-700 dark:text-emerald-400 select-all">
                  composer require laravel/nightwatch
                </pre>
                <CopyButton text="composer require laravel/nightwatch" />
              </div>
              <div className="rounded-lg bg-zinc-100 dark:bg-zinc-950 p-3 font-mono text-xs">
                <p className="text-muted-foreground"># Add to .env</p>
                <p className="text-cyan-700 dark:text-cyan-400 mt-1">NIGHTWATCH_TOKEN<span className="text-muted-foreground">=</span><span className="text-foreground/60">your-token</span></p>
                <p className="text-cyan-700 dark:text-cyan-400">NIGHTWATCH_INGEST_URI<span className="text-muted-foreground">=</span><span className="text-foreground/60">127.0.0.1:2407</span></p>
              </div>
            </div>
            <ExtLinkOutline url="https://nightwatch.laravel.com/docs/start-guide">Full Documentation</ExtLinkOutline>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
