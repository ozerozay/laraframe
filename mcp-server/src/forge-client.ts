/**
 * Forge API client - direct HTTP calls, no Tauri dependency.
 * Mirrors the Rust backend but in pure TypeScript for MCP server.
 */

const FORGE_API = "https://forge.laravel.com/api";

interface JsonApiOne<T> { data: { id: string; attributes: T } }
interface JsonApiMany<T> { data: Array<{ id: string; attributes: T }> }

async function request(token: string, method: string, path: string, body?: unknown): Promise<Response> {
  const resp = await fetch(`${FORGE_API}${path}`, {
    method,
    headers: {
      Authorization: `Bearer ${token}`,
      Accept: "application/json",
      "Content-Type": "application/json",
    },
    body: body ? JSON.stringify(body) : undefined,
  });
  if (!resp.ok) {
    const text = await resp.text();
    throw new Error(`Forge API ${resp.status}: ${text}`);
  }
  return resp;
}

async function getJson<T>(token: string, path: string): Promise<T> {
  const resp = await request(token, "GET", path);
  return resp.json();
}

async function getText(token: string, path: string): Promise<string> {
  const resp = await request(token, "GET", path);
  const json = await resp.json().catch(() => null);
  if (json?.data?.attributes?.content) return json.data.attributes.content;
  if (json?.data?.attributes?.output) return json.data.attributes.output;
  return JSON.stringify(json);
}

function mapMany<A, R>(data: JsonApiMany<A>, mapper: (id: string, attrs: A) => R): R[] {
  return data.data.map((item) => mapper(item.id, item.attributes));
}

function mapOne<A, R>(data: JsonApiOne<A>, mapper: (id: string, attrs: A) => R): R {
  return mapper(data.data.id, data.data.attributes);
}

// =====================================================
// Exported API functions
// =====================================================

export async function getUser(token: string) {
  const data = await getJson<JsonApiOne<{ name: string; email: string }>>(token, "/me");
  return { id: data.data.id, name: data.data.attributes.name, email: data.data.attributes.email };
}

export async function listOrgs(token: string) {
  const data = await getJson<JsonApiMany<{ name: string; slug: string }>>(token, "/orgs");
  return mapMany(data, (id, a) => ({ id, name: a.name, slug: a.slug }));
}

export async function listServers(token: string, orgSlug: string) {
  const data = await getJson<JsonApiMany<any>>(token, `/orgs/${orgSlug}/servers`);
  return mapMany(data, (id, a) => ({
    id, name: a.name, ip_address: a.ip_address, provider: a.provider,
    region: a.region, php_version: a.php_version, is_ready: a.is_ready,
    ubuntu_version: a.ubuntu_version, database_type: a.database_type,
  }));
}

export async function listSites(token: string, orgSlug: string, serverId: string) {
  const data = await getJson<JsonApiMany<any>>(token, `/orgs/${orgSlug}/servers/${serverId}/sites`);
  return mapMany(data, (id, a) => ({
    id, name: a.name, status: a.status, url: a.url,
    php_version: a.php_version, deployment_status: a.deployment_status,
    repository: a.repository?.url || null, branch: a.repository?.branch || null,
  }));
}

export async function deploySite(token: string, orgSlug: string, serverId: string, siteId: string) {
  await request(token, "POST", `/orgs/${orgSlug}/servers/${serverId}/sites/${siteId}/deployments`);
  return "Deployment queued";
}

export async function listDeployments(token: string, orgSlug: string, serverId: string, siteId: string) {
  const data = await getJson<JsonApiMany<any>>(token, `/orgs/${orgSlug}/servers/${serverId}/sites/${siteId}/deployments`);
  return mapMany(data, (id, a) => ({
    id, status: a.status, type: a.type,
    commit_message: a.commit?.message, commit_author: a.commit?.author,
    commit_hash: a.commit?.hash, commit_branch: a.commit?.branch,
    created_at: a.created_at,
  }));
}

export async function getDeploymentLog(token: string, orgSlug: string, serverId: string, siteId: string, deploymentId: string) {
  return getText(token, `/orgs/${orgSlug}/servers/${serverId}/sites/${siteId}/deployments/${deploymentId}/log`);
}

export async function getEnv(token: string, orgSlug: string, serverId: string, siteId: string) {
  return getText(token, `/orgs/${orgSlug}/servers/${serverId}/sites/${siteId}/environment`);
}

export async function updateEnv(token: string, orgSlug: string, serverId: string, siteId: string, content: string) {
  await request(token, "PUT", `/orgs/${orgSlug}/servers/${serverId}/sites/${siteId}/environment`, { environment: content });
  return "Environment updated";
}

export async function getDeployScript(token: string, orgSlug: string, serverId: string, siteId: string) {
  return getText(token, `/orgs/${orgSlug}/servers/${serverId}/sites/${siteId}/deployments/script`);
}

export async function updateDeployScript(token: string, orgSlug: string, serverId: string, siteId: string, content: string) {
  await request(token, "PUT", `/orgs/${orgSlug}/servers/${serverId}/sites/${siteId}/deployments/script`, { content });
  return "Deploy script updated";
}

export async function getNginxConfig(token: string, orgSlug: string, serverId: string, siteId: string) {
  return getText(token, `/orgs/${orgSlug}/servers/${serverId}/sites/${siteId}/nginx`);
}

export async function getSiteLog(token: string, orgSlug: string, serverId: string, siteId: string, logType: string) {
  return getText(token, `/orgs/${orgSlug}/servers/${serverId}/sites/${siteId}/logs/${logType}`);
}

export async function getServerLog(token: string, orgSlug: string, serverId: string, logType: string) {
  return getText(token, `/orgs/${orgSlug}/servers/${serverId}/logs/${logType}`);
}

export async function runCommand(token: string, orgSlug: string, serverId: string, siteId: string, command: string) {
  await request(token, "POST", `/orgs/${orgSlug}/servers/${serverId}/sites/${siteId}/commands`, { command });
  return `Command sent: ${command}`;
}

export async function listCommands(token: string, orgSlug: string, serverId: string, siteId: string) {
  const data = await getJson<JsonApiMany<any>>(token, `/orgs/${orgSlug}/servers/${serverId}/sites/${siteId}/commands`);
  return mapMany(data, (id, a) => ({ id, command: a.command, status: a.status, created_at: a.created_at }));
}

export async function listDatabases(token: string, orgSlug: string, serverId: string) {
  const data = await getJson<JsonApiMany<any>>(token, `/orgs/${orgSlug}/servers/${serverId}/database/schemas`);
  return mapMany(data, (id, a) => ({ id, name: a.name, status: a.status }));
}

export async function createDatabase(token: string, orgSlug: string, serverId: string, name: string) {
  await request(token, "POST", `/orgs/${orgSlug}/servers/${serverId}/database/schemas`, { name });
  return `Database "${name}" created`;
}

export async function deleteDatabase(token: string, orgSlug: string, serverId: string, dbId: string) {
  await request(token, "DELETE", `/orgs/${orgSlug}/servers/${serverId}/database/schemas/${dbId}`);
  return "Database deleted";
}

export async function listDomains(token: string, orgSlug: string, serverId: string, siteId: string) {
  const data = await getJson<JsonApiMany<any>>(token, `/orgs/${orgSlug}/servers/${serverId}/sites/${siteId}/domains`);
  return mapMany(data, (id, a) => ({ id, name: a.name, type: a.type, status: a.status }));
}

export async function serviceAction(token: string, orgSlug: string, serverId: string, service: string, action: string) {
  await request(token, "POST", `/orgs/${orgSlug}/servers/${serverId}/services/${service}/actions`, { action });
  return `${service} ${action} initiated`;
}

export async function serverReboot(token: string, orgSlug: string, serverId: string) {
  await request(token, "POST", `/orgs/${orgSlug}/servers/${serverId}/actions`, { action: "reboot" });
  return "Server reboot initiated";
}

export async function listSSHKeys(token: string, orgSlug: string, serverId: string) {
  const data = await getJson<JsonApiMany<any>>(token, `/orgs/${orgSlug}/servers/${serverId}/ssh-keys`);
  return mapMany(data, (id, a) => ({ id, name: a.name, status: a.status }));
}

export async function listFirewallRules(token: string, orgSlug: string, serverId: string) {
  const data = await getJson<JsonApiMany<any>>(token, `/orgs/${orgSlug}/servers/${serverId}/firewall-rules`);
  return mapMany(data, (id, a) => ({ id, name: a.name, port: a.port, type: a.type, ip_address: a.ip_address }));
}

export async function listDaemons(token: string, orgSlug: string, serverId: string) {
  const data = await getJson<JsonApiMany<any>>(token, `/orgs/${orgSlug}/servers/${serverId}/background-processes`);
  return mapMany(data, (id, a) => ({ id, command: a.command, user: a.user, status: a.status, processes: a.processes }));
}

export async function getEvents(token: string, orgSlug: string, serverId: string) {
  const data = await getJson<JsonApiMany<any>>(token, `/orgs/${orgSlug}/servers/${serverId}/events`);
  return mapMany(data, (id, a) => ({ id, description: a.description, created_at: a.created_at }));
}
