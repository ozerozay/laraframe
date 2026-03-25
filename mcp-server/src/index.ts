#!/usr/bin/env node

import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { z } from "zod";
import * as forge from "./forge-client.js";
import * as cloud from "./cloud-client.js";

// Read tokens from env
const FORGE_TOKEN = process.env.FORGE_API_TOKEN || "";
const FORGE_ORG = process.env.FORGE_ORG_SLUG || "";
const CLOUD_TOKEN = process.env.CLOUD_API_TOKEN || "";

if (!FORGE_TOKEN && !CLOUD_TOKEN) {
  console.error("At least one of FORGE_API_TOKEN or CLOUD_API_TOKEN is required");
  process.exit(1);
}

const server = new McpServer({
  name: "laraframe",
  version: "0.1.0",
});

// Helper: auto-resolve org slug
async function getOrg(): Promise<string> {
  if (FORGE_ORG) return FORGE_ORG;
  const orgs = await forge.listOrgs(FORGE_TOKEN);
  if (orgs.length === 0) throw new Error("No organizations found");
  return orgs[0].slug;
}

// =====================================================
// Tools
// =====================================================

// --- Info ---

server.tool("forge_whoami", "Get current Forge user info", {}, async () => {
  const user = await forge.getUser(FORGE_TOKEN);
  return { content: [{ type: "text", text: JSON.stringify(user, null, 2) }] };
});

server.tool("forge_list_orgs", "List Forge organizations", {}, async () => {
  const orgs = await forge.listOrgs(FORGE_TOKEN);
  return { content: [{ type: "text", text: JSON.stringify(orgs, null, 2) }] };
});

// --- Servers ---

server.tool("forge_list_servers", "List all servers", {}, async () => {
  const org = await getOrg();
  const servers = await forge.listServers(FORGE_TOKEN, org);
  return { content: [{ type: "text", text: JSON.stringify(servers, null, 2) }] };
});

// --- Sites ---

server.tool("forge_list_sites", "List sites on a server", {
  server_id: z.string().describe("Server ID"),
}, async ({ server_id }) => {
  const org = await getOrg();
  const sites = await forge.listSites(FORGE_TOKEN, org, server_id);
  return { content: [{ type: "text", text: JSON.stringify(sites, null, 2) }] };
});

// --- Deploy ---

server.tool("forge_deploy", "Deploy a site", {
  server_id: z.string().describe("Server ID"),
  site_id: z.string().describe("Site ID"),
}, async ({ server_id, site_id }) => {
  const org = await getOrg();
  const result = await forge.deploySite(FORGE_TOKEN, org, server_id, site_id);
  return { content: [{ type: "text", text: result }] };
});

server.tool("forge_list_deployments", "List recent deployments for a site", {
  server_id: z.string().describe("Server ID"),
  site_id: z.string().describe("Site ID"),
}, async ({ server_id, site_id }) => {
  const org = await getOrg();
  const deps = await forge.listDeployments(FORGE_TOKEN, org, server_id, site_id);
  return { content: [{ type: "text", text: JSON.stringify(deps, null, 2) }] };
});

server.tool("forge_deployment_log", "Get deployment output log", {
  server_id: z.string().describe("Server ID"),
  site_id: z.string().describe("Site ID"),
  deployment_id: z.string().describe("Deployment ID"),
}, async ({ server_id, site_id, deployment_id }) => {
  const org = await getOrg();
  const log = await forge.getDeploymentLog(FORGE_TOKEN, org, server_id, site_id, deployment_id);
  return { content: [{ type: "text", text: log }] };
});

// --- Environment ---

server.tool("forge_get_env", "Get site .env file", {
  server_id: z.string().describe("Server ID"),
  site_id: z.string().describe("Site ID"),
}, async ({ server_id, site_id }) => {
  const org = await getOrg();
  const env = await forge.getEnv(FORGE_TOKEN, org, server_id, site_id);
  return { content: [{ type: "text", text: env }] };
});

server.tool("forge_update_env", "Update site .env file", {
  server_id: z.string().describe("Server ID"),
  site_id: z.string().describe("Site ID"),
  content: z.string().describe("Full .env content"),
}, async ({ server_id, site_id, content }) => {
  const org = await getOrg();
  const result = await forge.updateEnv(FORGE_TOKEN, org, server_id, site_id, content);
  return { content: [{ type: "text", text: result }] };
});

// --- Deploy Script ---

server.tool("forge_get_deploy_script", "Get site deploy script", {
  server_id: z.string().describe("Server ID"),
  site_id: z.string().describe("Site ID"),
}, async ({ server_id, site_id }) => {
  const org = await getOrg();
  const script = await forge.getDeployScript(FORGE_TOKEN, org, server_id, site_id);
  return { content: [{ type: "text", text: script }] };
});

server.tool("forge_update_deploy_script", "Update site deploy script", {
  server_id: z.string().describe("Server ID"),
  site_id: z.string().describe("Site ID"),
  content: z.string().describe("Full deploy script content"),
}, async ({ server_id, site_id, content }) => {
  const org = await getOrg();
  const result = await forge.updateDeployScript(FORGE_TOKEN, org, server_id, site_id, content);
  return { content: [{ type: "text", text: result }] };
});

// --- Nginx ---

server.tool("forge_get_nginx", "Get site Nginx configuration", {
  server_id: z.string().describe("Server ID"),
  site_id: z.string().describe("Site ID"),
}, async ({ server_id, site_id }) => {
  const org = await getOrg();
  const config = await forge.getNginxConfig(FORGE_TOKEN, org, server_id, site_id);
  return { content: [{ type: "text", text: config }] };
});

// --- Logs ---

server.tool("forge_site_log", "Get site log (application, nginx-access, nginx-error)", {
  server_id: z.string().describe("Server ID"),
  site_id: z.string().describe("Site ID"),
  log_type: z.enum(["application", "nginx-access", "nginx-error"]).describe("Log type"),
}, async ({ server_id, site_id, log_type }) => {
  const org = await getOrg();
  const log = await forge.getSiteLog(FORGE_TOKEN, org, server_id, site_id, log_type);
  return { content: [{ type: "text", text: log }] };
});

server.tool("forge_server_log", "Get server log (nginx-access, nginx-error, php-X.X)", {
  server_id: z.string().describe("Server ID"),
  log_type: z.string().describe("Log type (nginx-access, nginx-error, php-8.4, etc.)"),
}, async ({ server_id, log_type }) => {
  const org = await getOrg();
  const log = await forge.getServerLog(FORGE_TOKEN, org, server_id, log_type);
  return { content: [{ type: "text", text: log }] };
});

// --- Commands ---

server.tool("forge_run_command", "Execute a command on the server for a site", {
  server_id: z.string().describe("Server ID"),
  site_id: z.string().describe("Site ID"),
  command: z.string().describe("Shell command to run"),
}, async ({ server_id, site_id, command }) => {
  const org = await getOrg();
  const result = await forge.runCommand(FORGE_TOKEN, org, server_id, site_id, command);
  return { content: [{ type: "text", text: result }] };
});

server.tool("forge_list_commands", "List command history for a site", {
  server_id: z.string().describe("Server ID"),
  site_id: z.string().describe("Site ID"),
}, async ({ server_id, site_id }) => {
  const org = await getOrg();
  const cmds = await forge.listCommands(FORGE_TOKEN, org, server_id, site_id);
  return { content: [{ type: "text", text: JSON.stringify(cmds, null, 2) }] };
});

// --- Database ---

server.tool("forge_list_databases", "List databases on a server", {
  server_id: z.string().describe("Server ID"),
}, async ({ server_id }) => {
  const org = await getOrg();
  const dbs = await forge.listDatabases(FORGE_TOKEN, org, server_id);
  return { content: [{ type: "text", text: JSON.stringify(dbs, null, 2) }] };
});

server.tool("forge_create_database", "Create a new database", {
  server_id: z.string().describe("Server ID"),
  name: z.string().describe("Database name"),
}, async ({ server_id, name }) => {
  const org = await getOrg();
  const result = await forge.createDatabase(FORGE_TOKEN, org, server_id, name);
  return { content: [{ type: "text", text: result }] };
});

server.tool("forge_delete_database", "Delete a database (DESTRUCTIVE)", {
  server_id: z.string().describe("Server ID"),
  database_id: z.string().describe("Database ID"),
}, async ({ server_id, database_id }) => {
  const org = await getOrg();
  const result = await forge.deleteDatabase(FORGE_TOKEN, org, server_id, database_id);
  return { content: [{ type: "text", text: result }] };
});

// --- Domains ---

server.tool("forge_list_domains", "List domains for a site", {
  server_id: z.string().describe("Server ID"),
  site_id: z.string().describe("Site ID"),
}, async ({ server_id, site_id }) => {
  const org = await getOrg();
  const domains = await forge.listDomains(FORGE_TOKEN, org, server_id, site_id);
  return { content: [{ type: "text", text: JSON.stringify(domains, null, 2) }] };
});

// --- Services ---

server.tool("forge_service_action", "Restart/stop/start a service (nginx, mysql, php, redis, postgres)", {
  server_id: z.string().describe("Server ID"),
  service: z.enum(["nginx", "mysql", "php", "postgres", "redis", "supervisor"]).describe("Service name"),
  action: z.enum(["restart", "stop", "start"]).describe("Action"),
}, async ({ server_id, service, action }) => {
  const org = await getOrg();
  const result = await forge.serviceAction(FORGE_TOKEN, org, server_id, service, action);
  return { content: [{ type: "text", text: result }] };
});

server.tool("forge_reboot_server", "Reboot the entire server (DANGEROUS)", {
  server_id: z.string().describe("Server ID"),
}, async ({ server_id }) => {
  const org = await getOrg();
  const result = await forge.serverReboot(FORGE_TOKEN, org, server_id);
  return { content: [{ type: "text", text: result }] };
});

// --- SSH Keys ---

server.tool("forge_list_ssh_keys", "List SSH keys on a server", {
  server_id: z.string().describe("Server ID"),
}, async ({ server_id }) => {
  const org = await getOrg();
  const keys = await forge.listSSHKeys(FORGE_TOKEN, org, server_id);
  return { content: [{ type: "text", text: JSON.stringify(keys, null, 2) }] };
});

// --- Firewall ---

server.tool("forge_list_firewall_rules", "List firewall rules", {
  server_id: z.string().describe("Server ID"),
}, async ({ server_id }) => {
  const org = await getOrg();
  const rules = await forge.listFirewallRules(FORGE_TOKEN, org, server_id);
  return { content: [{ type: "text", text: JSON.stringify(rules, null, 2) }] };
});

// --- Daemons ---

server.tool("forge_list_daemons", "List background processes/daemons", {
  server_id: z.string().describe("Server ID"),
}, async ({ server_id }) => {
  const org = await getOrg();
  const daemons = await forge.listDaemons(FORGE_TOKEN, org, server_id);
  return { content: [{ type: "text", text: JSON.stringify(daemons, null, 2) }] };
});

// --- Events ---

server.tool("forge_list_events", "List recent server events", {
  server_id: z.string().describe("Server ID"),
}, async ({ server_id }) => {
  const org = await getOrg();
  const events = await forge.getEvents(FORGE_TOKEN, org, server_id);
  return { content: [{ type: "text", text: JSON.stringify(events, null, 2) }] };
});

// =====================================================
// Cloud Tools
// =====================================================

if (CLOUD_TOKEN) {

server.tool("cloud_list_apps", "List Cloud applications", {}, async () => {
  const apps = await cloud.listApplications(CLOUD_TOKEN);
  return { content: [{ type: "text", text: JSON.stringify(apps, null, 2) }] };
});

server.tool("cloud_list_environments", "List environments for a Cloud application", {
  app_id: z.string().describe("Application ID"),
}, async ({ app_id }) => {
  const envs = await cloud.listEnvironments(CLOUD_TOKEN, app_id);
  return { content: [{ type: "text", text: JSON.stringify(envs, null, 2) }] };
});

server.tool("cloud_get_environment", "Get environment details including variables", {
  env_id: z.string().describe("Environment ID"),
}, async ({ env_id }) => {
  const env = await cloud.getEnvironment(CLOUD_TOKEN, env_id);
  return { content: [{ type: "text", text: JSON.stringify(env, null, 2) }] };
});

server.tool("cloud_deploy", "Deploy a Cloud environment", {
  env_id: z.string().describe("Environment ID"),
}, async ({ env_id }) => {
  const result = await cloud.createDeployment(CLOUD_TOKEN, env_id);
  return { content: [{ type: "text", text: result }] };
});

server.tool("cloud_list_deployments", "List deployments for a Cloud environment", {
  env_id: z.string().describe("Environment ID"),
}, async ({ env_id }) => {
  const deps = await cloud.listDeployments(CLOUD_TOKEN, env_id);
  return { content: [{ type: "text", text: JSON.stringify(deps, null, 2) }] };
});

server.tool("cloud_deployment_logs", "Get Cloud deployment logs", {
  deployment_id: z.string().describe("Deployment ID"),
}, async ({ deployment_id }) => {
  const logs = await cloud.getDeploymentLogs(CLOUD_TOKEN, deployment_id);
  return { content: [{ type: "text", text: logs }] };
});

server.tool("cloud_start_environment", "Start a Cloud environment", {
  env_id: z.string().describe("Environment ID"),
}, async ({ env_id }) => {
  const result = await cloud.startEnvironment(CLOUD_TOKEN, env_id);
  return { content: [{ type: "text", text: result }] };
});

server.tool("cloud_stop_environment", "Stop a Cloud environment (CAUTION: causes downtime)", {
  env_id: z.string().describe("Environment ID"),
}, async ({ env_id }) => {
  const result = await cloud.stopEnvironment(CLOUD_TOKEN, env_id);
  return { content: [{ type: "text", text: result }] };
});

server.tool("cloud_run_command", "Run a command on a Cloud environment", {
  env_id: z.string().describe("Environment ID"),
  command: z.string().describe("Command to execute"),
}, async ({ env_id, command }) => {
  const result = await cloud.runCommand(CLOUD_TOKEN, env_id, command);
  return { content: [{ type: "text", text: result }] };
});

server.tool("cloud_list_commands", "List command history for a Cloud environment", {
  env_id: z.string().describe("Environment ID"),
}, async ({ env_id }) => {
  const cmds = await cloud.listCommands(CLOUD_TOKEN, env_id);
  return { content: [{ type: "text", text: JSON.stringify(cmds, null, 2) }] };
});

server.tool("cloud_list_instances", "List instances for a Cloud environment", {
  env_id: z.string().describe("Environment ID"),
}, async ({ env_id }) => {
  const instances = await cloud.listInstances(CLOUD_TOKEN, env_id);
  return { content: [{ type: "text", text: JSON.stringify(instances, null, 2) }] };
});

server.tool("cloud_list_domains", "List domains for a Cloud environment", {
  env_id: z.string().describe("Environment ID"),
}, async ({ env_id }) => {
  const domains = await cloud.listDomains(CLOUD_TOKEN, env_id);
  return { content: [{ type: "text", text: JSON.stringify(domains, null, 2) }] };
});

server.tool("cloud_add_variables", "Add/update environment variables", {
  env_id: z.string().describe("Environment ID"),
  variables: z.record(z.string(), z.string()).describe("Key-value pairs to add/update"),
}, async ({ env_id, variables }) => {
  const result = await cloud.addVariables(CLOUD_TOKEN, env_id, variables as Record<string, string>);
  return { content: [{ type: "text", text: result }] };
});

server.tool("cloud_delete_variables", "Delete environment variables", {
  env_id: z.string().describe("Environment ID"),
  keys: z.array(z.string()).describe("Variable keys to delete"),
}, async ({ env_id, keys }) => {
  const result = await cloud.deleteVariables(CLOUD_TOKEN, env_id, keys);
  return { content: [{ type: "text", text: result }] };
});

server.tool("cloud_environment_logs", "Get Cloud environment logs", {
  env_id: z.string().describe("Environment ID"),
  minutes: z.number().optional().describe("Minutes of history (default 60)"),
}, async ({ env_id, minutes }) => {
  const now = new Date();
  const from = new Date(now.getTime() - (minutes || 60) * 60000);
  const logs = await cloud.getEnvironmentLogs(CLOUD_TOKEN, env_id, from.toISOString(), now.toISOString());
  return { content: [{ type: "text", text: JSON.stringify(logs.slice(0, 50), null, 2) }] };
});

server.tool("cloud_environment_metrics", "Get Cloud environment metrics (CPU, memory, etc.)", {
  env_id: z.string().describe("Environment ID"),
}, async ({ env_id }) => {
  const metrics = await cloud.getEnvironmentMetrics(CLOUD_TOKEN, env_id);
  return { content: [{ type: "text", text: JSON.stringify(metrics, null, 2) }] };
});

server.tool("cloud_list_databases", "List Cloud database clusters", {}, async () => {
  const dbs = await cloud.listDatabaseClusters(CLOUD_TOKEN);
  return { content: [{ type: "text", text: JSON.stringify(dbs, null, 2) }] };
});

server.tool("cloud_list_caches", "List Cloud caches", {}, async () => {
  const caches = await cloud.listCaches(CLOUD_TOKEN);
  return { content: [{ type: "text", text: JSON.stringify(caches, null, 2) }] };
});

server.tool("cloud_list_buckets", "List Cloud storage buckets", {}, async () => {
  const buckets = await cloud.listBuckets(CLOUD_TOKEN);
  return { content: [{ type: "text", text: JSON.stringify(buckets, null, 2) }] };
});

server.tool("cloud_list_websocket_servers", "List Cloud WebSocket servers", {}, async () => {
  const servers = await cloud.listWebsocketServers(CLOUD_TOKEN);
  return { content: [{ type: "text", text: JSON.stringify(servers, null, 2) }] };
});

} // end if (CLOUD_TOKEN)

// =====================================================
// Resources - provide context to AI
// =====================================================

server.resource("forge://servers", "forge://servers", async (uri) => {
  const org = await getOrg();
  const servers = await forge.listServers(FORGE_TOKEN, org);
  return {
    contents: [{
      uri: uri.href,
      text: JSON.stringify(servers, null, 2),
      mimeType: "application/json",
    }],
  };
});

// =====================================================
// Start server
// =====================================================

const transport = new StdioServerTransport();
await server.connect(transport);
