/**
 * Cloud API client - direct HTTP calls for MCP server.
 */

const CLOUD_API = "https://cloud.laravel.com/api";

async function request(token: string, method: string, path: string, body?: unknown): Promise<Response> {
  const resp = await fetch(`${CLOUD_API}${path}`, {
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
    throw new Error(`Cloud API ${resp.status}: ${text}`);
  }
  return resp;
}

async function getJson<T>(token: string, path: string): Promise<T> {
  const resp = await request(token, "GET", path);
  return resp.json();
}

function mapMany<A>(data: { data: Array<{ id: string; attributes: A }> }): Array<A & { id: string }> {
  return data.data.map((item) => ({ id: item.id, ...item.attributes }));
}

// Applications
export async function listApplications(token: string) {
  const data = await getJson<any>(token, "/applications");
  return mapMany(data);
}

// Environments
export async function listEnvironments(token: string, appId: string) {
  const data = await getJson<any>(token, `/applications/${appId}/environments`);
  return mapMany(data);
}

export async function getEnvironment(token: string, envId: string) {
  const data = await getJson<any>(token, `/environments/${envId}`);
  return { id: data.data.id, ...data.data.attributes };
}

export async function startEnvironment(token: string, envId: string) {
  await request(token, "POST", `/environments/${envId}/start`);
  return "Environment starting";
}

export async function stopEnvironment(token: string, envId: string) {
  await request(token, "POST", `/environments/${envId}/stop`);
  return "Environment stopping";
}

// Deployments
export async function listDeployments(token: string, envId: string) {
  const data = await getJson<any>(token, `/environments/${envId}/deployments`);
  return mapMany(data);
}

export async function createDeployment(token: string, envId: string) {
  await request(token, "POST", `/environments/${envId}/deployments`);
  return "Deployment queued";
}

export async function getDeploymentLogs(token: string, deploymentId: string) {
  const resp = await request(token, "GET", `/deployments/${deploymentId}/logs`);
  return resp.text();
}

// Commands
export async function runCommand(token: string, envId: string, command: string) {
  await request(token, "POST", `/environments/${envId}/commands`, { command });
  return `Command sent: ${command}`;
}

export async function listCommands(token: string, envId: string) {
  const data = await getJson<any>(token, `/environments/${envId}/commands`);
  return mapMany(data);
}

// Instances
export async function listInstances(token: string, envId: string) {
  const data = await getJson<any>(token, `/environments/${envId}/instances`);
  return mapMany(data);
}

// Domains
export async function listDomains(token: string, envId: string) {
  const data = await getJson<any>(token, `/environments/${envId}/domains`);
  return mapMany(data);
}

// Variables
export async function addVariables(token: string, envId: string, variables: Record<string, string>) {
  await request(token, "POST", `/environments/${envId}/variables`, { variables });
  return "Variables updated";
}

export async function deleteVariables(token: string, envId: string, keys: string[]) {
  await request(token, "POST", `/environments/${envId}/variables/delete`, { variables: keys });
  return "Variables deleted";
}

// Logs
export async function getEnvironmentLogs(token: string, envId: string, from: string, to: string) {
  const data = await getJson<any>(token, `/environments/${envId}/logs?from=${from}&to=${to}`);
  return data.data || [];
}

// Metrics
export async function getEnvironmentMetrics(token: string, envId: string) {
  return getJson<any>(token, `/environments/${envId}/metrics`);
}

// Databases
export async function listDatabaseClusters(token: string) {
  const data = await getJson<any>(token, "/databases/clusters");
  return mapMany(data);
}

export async function listDatabases(token: string) {
  const data = await getJson<any>(token, "/databases");
  return mapMany(data);
}

// Caches
export async function listCaches(token: string) {
  const data = await getJson<any>(token, "/caches");
  return mapMany(data);
}

// Buckets
export async function listBuckets(token: string) {
  const data = await getJson<any>(token, "/buckets");
  return mapMany(data);
}

// WebSocket Servers
export async function listWebsocketServers(token: string) {
  const data = await getJson<any>(token, "/websocket-servers");
  return mapMany(data);
}
