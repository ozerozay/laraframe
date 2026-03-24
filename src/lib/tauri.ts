import { invoke } from "@tauri-apps/api/core";

// Keychain
export const saveApiKey = (service: string, token: string) =>
  invoke("save_api_key", { service, token });

export const getApiKey = (service: string) =>
  invoke<string | null>("get_api_key", { service });

export const deleteApiKey = (service: string) =>
  invoke("delete_api_key", { service });

export const hasApiKey = (service: string) =>
  invoke<boolean>("has_api_key", { service });

// Settings
export const getSetting = (key: string) =>
  invoke<string | null>("get_setting", { key });

export const setSetting = (key: string, value: string) =>
  invoke("set_setting", { key, value });

// =====================================================
// Forge Types
// =====================================================

export interface ForgeUser {
  id: string;
  name: string;
  email: string;
}

export interface ForgeOrganization {
  id: string;
  name: string;
  slug: string;
}

export interface ForgeServer {
  id: string;
  name: string;
  ip_address: string | null;
  provider: string | null;
  region: string | null;
  php_version: string | null;
  ubuntu_version: string | null;
  is_ready: boolean;
  revoked: boolean;
  connection_status: string | null;
  database_type: string | null;
}

export interface ForgeSite {
  id: string;
  name: string;
  status: string | null;
  url: string | null;
  php_version: string | null;
  repository_url: string | null;
  repository_branch: string | null;
  deployment_status: string | null;
  quick_deploy: boolean;
  app_type: string | null;
}

export interface ForgeEvent {
  id: string;
  description: string;
  created_at: string;
  status: string | null;
}

export interface ForgeMonitor {
  id: string;
  status: string;
  monitor_type: string;
  operator: string | null;
  threshold: number | null;
  minutes: number | null;
  state: string | null;
}

export interface ForgeDeployment {
  id: string;
  status: string | null;
  deploy_type: string | null;
  commit_hash: string | null;
  commit_author: string | null;
  commit_message: string | null;
  commit_branch: string | null;
  started_at: string | null;
  ended_at: string | null;
  created_at: string | null;
}

export interface ForgeCommand {
  id: string;
  command: string | null;
  status: string | null;
  duration: number | null;
  created_at: string | null;
}

export interface ForgeDomain {
  id: string;
  name: string;
  domain_type: string | null;
  status: string | null;
  www_redirect_type: string | null;
  allow_wildcard_subdomains: boolean;
  created_at: string | null;
}

export interface ForgeCertificate {
  id: string;
  cert_type: string | null;
  status: string | null;
  request_status: string | null;
  created_at: string | null;
}

export interface ForgeRedirectRule {
  id: string;
  from: string | null;
  to: string | null;
  redirect_type: string | null;
  created_at: string | null;
}

export interface ForgeSecurityRule {
  id: string;
  name: string | null;
  path: string | null;
  created_at: string | null;
}

export interface SecurityCredential {
  username: string;
  password: string;
}

export interface ForgeScheduledJob {
  id: string;
  command: string | null;
  frequency: string | null;
  user: string | null;
  created_at: string | null;
}

export interface ForgeWebhook {
  id: string;
  url: string | null;
  created_at: string | null;
}

export interface ForgeHeartbeat {
  id: string;
  url: string | null;
  created_at: string | null;
}

export interface ForgeDatabaseSchema {
  id: string;
  name: string;
  status: string | null;
  created_at: string | null;
}

export interface ForgeDatabaseUser {
  id: string;
  name: string;
  status: string | null;
  created_at: string | null;
}

export interface ForgeBackupConfig {
  id: string;
  provider: string;
  frequency: string;
  retention: number;
  status: string;
  created_at: string;
}

export interface ForgeBackupInstance {
  id: string;
  status: string;
  size: number;
  created_at: string;
}

// =====================================================
// Forge API Functions (uses org slug, not numeric ID)
// =====================================================

export const forgeGetUser = (token: string) =>
  invoke<ForgeUser>("forge_get_user", { token });

export const forgeListOrgs = (token: string) =>
  invoke<ForgeOrganization[]>("forge_list_orgs", { token });

export const forgeListServers = (token: string, orgSlug: string) =>
  invoke<ForgeServer[]>("forge_list_servers", { token, orgSlug });

export const forgeListSites = (token: string, orgSlug: string, serverId: string) =>
  invoke<ForgeSite[]>("forge_list_sites", { token, orgSlug, serverId });

export const forgeDeploySite = (token: string, orgSlug: string, serverId: string, siteId: string) =>
  invoke("forge_deploy_site", { token, orgSlug, serverId, siteId });

export const forgeGetEvents = (token: string, orgSlug: string, serverId: string) =>
  invoke<ForgeEvent[]>("forge_get_events", { token, orgSlug, serverId });

export const forgeGetServerLog = (token: string, orgSlug: string, serverId: string, logType: string) =>
  invoke<string>("forge_get_server_log", { token, orgSlug, serverId, logType });

export const forgeGetSiteLog = (token: string, orgSlug: string, serverId: string, siteId: string, logType: string) =>
  invoke<string>("forge_get_site_log", { token, orgSlug, serverId, siteId, logType });

export const forgeListMonitors = (token: string, orgSlug: string, serverId: string) =>
  invoke<ForgeMonitor[]>("forge_list_monitors", { token, orgSlug, serverId });

export const forgeListDeployments = (token: string, orgSlug: string, serverId: string, siteId: string) =>
  invoke<ForgeDeployment[]>("forge_list_deployments", { token, orgSlug, serverId, siteId });

// Env
export const forgeGetEnv = (token: string, orgSlug: string, serverId: string, siteId: string) =>
  invoke<string>("forge_get_env", { token, orgSlug, serverId, siteId });

export const forgeUpdateEnv = (token: string, orgSlug: string, serverId: string, siteId: string, content: string) =>
  invoke("forge_update_env", { token, orgSlug, serverId, siteId, content });

export const forgeServerAction = (token: string, orgSlug: string, serverId: string, action: string) =>
  invoke("forge_server_action", { token, orgSlug, serverId, action });

export const forgeServiceAction = (token: string, orgSlug: string, serverId: string, service: string, action: string) =>
  invoke("forge_service_action", { token, orgSlug, serverId, service, action });

// Deployment Enhancements
export const forgeGetDeployScript = (token: string, orgSlug: string, serverId: string, siteId: string) =>
  invoke<string>("forge_get_deploy_script", { token, orgSlug, serverId, siteId });

export const forgeUpdateDeployScript = (token: string, orgSlug: string, serverId: string, siteId: string, content: string) =>
  invoke("forge_update_deploy_script", { token, orgSlug, serverId, siteId, content });

export const forgeGetDeploymentLog = (token: string, orgSlug: string, serverId: string, siteId: string, deploymentId: string) =>
  invoke<string>("forge_get_deployment_log", { token, orgSlug, serverId, siteId, deploymentId });

// Commands
export const forgeListCommands = (token: string, orgSlug: string, serverId: string, siteId: string) =>
  invoke<ForgeCommand[]>("forge_list_commands", { token, orgSlug, serverId, siteId });

export const forgeRunCommand = (token: string, orgSlug: string, serverId: string, siteId: string, command: string) =>
  invoke("forge_run_command", { token, orgSlug, serverId, siteId, command });

export const forgeGetCommandOutput = (token: string, orgSlug: string, serverId: string, siteId: string, commandId: string) =>
  invoke<string>("forge_get_command_output", { token, orgSlug, serverId, siteId, commandId });

// Domains
export const forgeListDomains = (token: string, orgSlug: string, serverId: string, siteId: string) =>
  invoke<ForgeDomain[]>("forge_list_domains", { token, orgSlug, serverId, siteId });

export const forgeCreateDomain = (token: string, orgSlug: string, serverId: string, siteId: string, name: string) =>
  invoke("forge_create_domain", { token, orgSlug, serverId, siteId, name });

export const forgeDeleteDomain = (token: string, orgSlug: string, serverId: string, siteId: string, domainId: string) =>
  invoke("forge_delete_domain", { token, orgSlug, serverId, siteId, domainId });

export const forgeGetDomainNginx = (token: string, orgSlug: string, serverId: string, siteId: string, domainId: string) =>
  invoke<string>("forge_get_domain_nginx", { token, orgSlug, serverId, siteId, domainId });

export const forgeUpdateDomainNginx = (token: string, orgSlug: string, serverId: string, siteId: string, domainId: string, content: string) =>
  invoke("forge_update_domain_nginx", { token, orgSlug, serverId, siteId, domainId, content });

// Domain Certificates
export const forgeGetDomainCertificate = (token: string, orgSlug: string, serverId: string, siteId: string, domainId: string) =>
  invoke<ForgeCertificate | null>("forge_get_domain_certificate", { token, orgSlug, serverId, siteId, domainId });

export const forgeCreateLetsencryptCert = (token: string, orgSlug: string, serverId: string, siteId: string, domainId: string) =>
  invoke("forge_create_letsencrypt_cert", { token, orgSlug, serverId, siteId, domainId });

// Integrations
export const forgeGetIntegration = (token: string, orgSlug: string, serverId: string, siteId: string, integration: string) =>
  invoke<unknown>("forge_get_integration", { token, orgSlug, serverId, siteId, integration });

export const forgeEnableIntegration = (token: string, orgSlug: string, serverId: string, siteId: string, integration: string) =>
  invoke("forge_enable_integration", { token, orgSlug, serverId, siteId, integration });

export const forgeDisableIntegration = (token: string, orgSlug: string, serverId: string, siteId: string, integration: string) =>
  invoke("forge_disable_integration", { token, orgSlug, serverId, siteId, integration });

// Redirect Rules
export const forgeListRedirectRules = (token: string, orgSlug: string, serverId: string, siteId: string) =>
  invoke<ForgeRedirectRule[]>("forge_list_redirect_rules", { token, orgSlug, serverId, siteId });

export const forgeCreateRedirectRule = (token: string, orgSlug: string, serverId: string, siteId: string, from: string, to: string, redirectType: string) =>
  invoke("forge_create_redirect_rule", { token, orgSlug, serverId, siteId, from, to, redirectType });

export const forgeDeleteRedirectRule = (token: string, orgSlug: string, serverId: string, siteId: string, ruleId: string) =>
  invoke("forge_delete_redirect_rule", { token, orgSlug, serverId, siteId, ruleId });

// Security Rules
export const forgeListSecurityRules = (token: string, orgSlug: string, serverId: string, siteId: string) =>
  invoke<ForgeSecurityRule[]>("forge_list_security_rules", { token, orgSlug, serverId, siteId });

export const forgeCreateSecurityRule = (token: string, orgSlug: string, serverId: string, siteId: string, name: string, path: string, credentials: SecurityCredential[]) =>
  invoke("forge_create_security_rule", { token, orgSlug, serverId, siteId, name, path, credentials });

export const forgeDeleteSecurityRule = (token: string, orgSlug: string, serverId: string, siteId: string, ruleId: string) =>
  invoke("forge_delete_security_rule", { token, orgSlug, serverId, siteId, ruleId });

// Scheduled Jobs
export const forgeListScheduledJobs = (token: string, orgSlug: string, serverId: string, siteId: string) =>
  invoke<ForgeScheduledJob[]>("forge_list_scheduled_jobs", { token, orgSlug, serverId, siteId });

export const forgeCreateScheduledJob = (token: string, orgSlug: string, serverId: string, siteId: string, command: string, frequency: string, user: string) =>
  invoke("forge_create_scheduled_job", { token, orgSlug, serverId, siteId, command, frequency, user });

export const forgeDeleteScheduledJob = (token: string, orgSlug: string, serverId: string, siteId: string, jobId: string) =>
  invoke("forge_delete_scheduled_job", { token, orgSlug, serverId, siteId, jobId });

export const forgeGetScheduledJobOutput = (token: string, orgSlug: string, serverId: string, siteId: string, jobId: string) =>
  invoke<string>("forge_get_scheduled_job_output", { token, orgSlug, serverId, siteId, jobId });

// Webhooks
export const forgeListWebhooks = (token: string, orgSlug: string, serverId: string, siteId: string) =>
  invoke<ForgeWebhook[]>("forge_list_webhooks", { token, orgSlug, serverId, siteId });

export const forgeCreateWebhook = (token: string, orgSlug: string, serverId: string, siteId: string, url: string) =>
  invoke("forge_create_webhook", { token, orgSlug, serverId, siteId, url });

export const forgeDeleteWebhook = (token: string, orgSlug: string, serverId: string, siteId: string, webhookId: string) =>
  invoke("forge_delete_webhook", { token, orgSlug, serverId, siteId, webhookId });

// Heartbeats
export const forgeListHeartbeats = (token: string, orgSlug: string, serverId: string, siteId: string) =>
  invoke<ForgeHeartbeat[]>("forge_list_heartbeats", { token, orgSlug, serverId, siteId });

export const forgeCreateHeartbeat = (token: string, orgSlug: string, serverId: string, siteId: string, url: string) =>
  invoke("forge_create_heartbeat", { token, orgSlug, serverId, siteId, url });

export const forgeDeleteHeartbeat = (token: string, orgSlug: string, serverId: string, siteId: string, heartbeatId: string) =>
  invoke("forge_delete_heartbeat", { token, orgSlug, serverId, siteId, heartbeatId });

// Healthcheck
export const forgeGetHealthcheck = (token: string, orgSlug: string, serverId: string, siteId: string) =>
  invoke<string>("forge_get_healthcheck", { token, orgSlug, serverId, siteId });

export const forgeUpdateHealthcheck = (token: string, orgSlug: string, serverId: string, siteId: string, url: string) =>
  invoke("forge_update_healthcheck", { token, orgSlug, serverId, siteId, url });

// Nginx Config (site-level)
export const forgeGetNginxConfig = (token: string, orgSlug: string, serverId: string, siteId: string) =>
  invoke<string>("forge_get_nginx_config", { token, orgSlug, serverId, siteId });

export const forgeUpdateNginxConfig = (token: string, orgSlug: string, serverId: string, siteId: string, content: string) =>
  invoke("forge_update_nginx_config", { token, orgSlug, serverId, siteId, content });

// Database Management
export const forgeListDatabases = (token: string, orgSlug: string, serverId: string) =>
  invoke<ForgeDatabaseSchema[]>("forge_list_databases", { token, orgSlug, serverId });

export const forgeCreateDatabase = (token: string, orgSlug: string, serverId: string, name: string) =>
  invoke("forge_create_database", { token, orgSlug, serverId, name });

export const forgeDeleteDatabase = (token: string, orgSlug: string, serverId: string, databaseId: string) =>
  invoke("forge_delete_database", { token, orgSlug, serverId, databaseId });

export const forgeListDatabaseUsers = (token: string, orgSlug: string, serverId: string) =>
  invoke<ForgeDatabaseUser[]>("forge_list_database_users", { token, orgSlug, serverId });

export const forgeCreateDatabaseUser = (token: string, orgSlug: string, serverId: string, name: string, password: string, databases: string[]) =>
  invoke("forge_create_database_user", { token, orgSlug, serverId, name, password, databases });

export const forgeDeleteDatabaseUser = (token: string, orgSlug: string, serverId: string, userId: string) =>
  invoke("forge_delete_database_user", { token, orgSlug, serverId, userId });

export const forgeUpdateDatabaseUser = (token: string, orgSlug: string, serverId: string, userId: string, databases: string[]) =>
  invoke("forge_update_database_user", { token, orgSlug, serverId, userId, databases });

export const forgeUpdateDatabasePassword = (token: string, orgSlug: string, serverId: string, password: string) =>
  invoke("forge_update_database_password", { token, orgSlug, serverId, password });

export const forgeSyncDatabases = (token: string, orgSlug: string, serverId: string) =>
  invoke("forge_sync_databases", { token, orgSlug, serverId });

// Database Backups
export const forgeListBackupConfigs = (token: string, orgSlug: string, serverId: string) =>
  invoke<ForgeBackupConfig[]>("forge_list_backup_configs", { token, orgSlug, serverId });

export const forgeCreateBackupConfig = (token: string, orgSlug: string, serverId: string, provider: string, databases: Record<string, unknown>, frequency: string, retention: number) =>
  invoke("forge_create_backup_config", { token, orgSlug, serverId, provider, databases, frequency, retention });

export const forgeDeleteBackupConfig = (token: string, orgSlug: string, serverId: string, configId: string) =>
  invoke("forge_delete_backup_config", { token, orgSlug, serverId, configId });

export const forgeListBackups = (token: string, orgSlug: string, serverId: string, configId: string) =>
  invoke<ForgeBackupInstance[]>("forge_list_backups", { token, orgSlug, serverId, configId });

export const forgeCreateBackup = (token: string, orgSlug: string, serverId: string, configId: string) =>
  invoke("forge_create_backup", { token, orgSlug, serverId, configId });

export const forgeDeleteBackup = (token: string, orgSlug: string, serverId: string, configId: string, backupId: string) =>
  invoke("forge_delete_backup", { token, orgSlug, serverId, configId, backupId });

export const forgeRestoreBackup = (token: string, orgSlug: string, serverId: string, configId: string, backupId: string) =>
  invoke("forge_restore_backup", { token, orgSlug, serverId, configId, backupId });

// Service keys
export const SERVICES = {
  FORGE: "forge_api_token",
  CLOUD: "cloud_api_token",
  NIGHTWATCH: "nightwatch_api_token",
  CLAUDE: "claude_api_key",
} as const;
