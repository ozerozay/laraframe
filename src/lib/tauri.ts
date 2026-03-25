import { invoke } from "@tauri-apps/api/core";

// Keychain
export const saveApiKey = (service: string, token: string) =>
  invoke("save_api_key", { service, token });

export const getApiKey = (service: string) =>
  invoke<string | null>("get_api_key", { service });

export const deleteApiKey = (service: string) =>
  invoke("delete_api_key", { service });

// System
export const getMcpServerPath = () =>
  invoke<string>("get_mcp_server_path");

export const buildMcpServer = () =>
  invoke<string>("build_mcp_server");

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

export interface ForgeSSHKey {
  id: string;
  name: string;
  status: string;
  created_at: string;
}

export interface ForgeFirewallRule {
  id: string;
  name: string;
  port: string;
  ip_address: string;
  rule_type: string;
  status: string;
  created_at: string;
}

export interface ForgeDaemon {
  id: string;
  command: string;
  user: string;
  directory: string;
  processes: number;
  status: string;
  created_at: string;
}

export interface ForgeRecipe {
  id: string;
  name: string;
  script: string;
  user: string;
  created_at: string;
}

export interface ForgePHPVersion {
  id: string;
  version: string;
  binary_name: string;
  status: string;
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

// SSH Keys
export const forgeListSSHKeys = (token: string, orgSlug: string, serverId: string) =>
  invoke<ForgeSSHKey[]>("forge_list_ssh_keys", { token, orgSlug, serverId });

export const forgeCreateSSHKey = (token: string, orgSlug: string, serverId: string, name: string, key: string) =>
  invoke("forge_create_ssh_key", { token, orgSlug, serverId, name, key });

export const forgeDeleteSSHKey = (token: string, orgSlug: string, serverId: string, keyId: string) =>
  invoke("forge_delete_ssh_key", { token, orgSlug, serverId, keyId });

// Firewall Rules
export const forgeListFirewallRules = (token: string, orgSlug: string, serverId: string) =>
  invoke<ForgeFirewallRule[]>("forge_list_firewall_rules", { token, orgSlug, serverId });

export const forgeCreateFirewallRule = (token: string, orgSlug: string, serverId: string, name: string, port: string, ipAddress: string, ruleType: string) =>
  invoke("forge_create_firewall_rule", { token, orgSlug, serverId, name, port, ipAddress, ruleType });

export const forgeDeleteFirewallRule = (token: string, orgSlug: string, serverId: string, ruleId: string) =>
  invoke("forge_delete_firewall_rule", { token, orgSlug, serverId, ruleId });

// Background Processes / Daemons
export const forgeListDaemons = (token: string, orgSlug: string, serverId: string) =>
  invoke<ForgeDaemon[]>("forge_list_daemons", { token, orgSlug, serverId });

export const forgeCreateDaemon = (token: string, orgSlug: string, serverId: string, command: string, user: string, directory: string, processes: number) =>
  invoke("forge_create_daemon", { token, orgSlug, serverId, command, user, directory, processes });

export const forgeDeleteDaemon = (token: string, orgSlug: string, serverId: string, daemonId: string) =>
  invoke("forge_delete_daemon", { token, orgSlug, serverId, daemonId });

export const forgeRestartDaemon = (token: string, orgSlug: string, serverId: string, daemonId: string) =>
  invoke("forge_restart_daemon", { token, orgSlug, serverId, daemonId });

export const forgeGetDaemonLog = (token: string, orgSlug: string, serverId: string, daemonId: string) =>
  invoke<string>("forge_get_daemon_log", { token, orgSlug, serverId, daemonId });

// PHP Versions
export const forgeListPHPVersions = (token: string, orgSlug: string, serverId: string) =>
  invoke<ForgePHPVersion[]>("forge_list_php_versions", { token, orgSlug, serverId });

export const forgeInstallPHPVersion = (token: string, orgSlug: string, serverId: string, version: string) =>
  invoke("forge_install_php_version", { token, orgSlug, serverId, version });

export const forgeDeletePHPVersion = (token: string, orgSlug: string, serverId: string, versionId: string) =>
  invoke("forge_delete_php_version", { token, orgSlug, serverId, versionId });

// Recipes
export const forgeListRecipes = (token: string, orgSlug: string) =>
  invoke<ForgeRecipe[]>("forge_list_recipes", { token, orgSlug });

export const forgeCreateRecipe = (token: string, orgSlug: string, name: string, script: string, user: string) =>
  invoke("forge_create_recipe", { token, orgSlug, name, script, user });

export const forgeUpdateRecipe = (token: string, orgSlug: string, recipeId: string, name: string, script: string, user: string) =>
  invoke("forge_update_recipe", { token, orgSlug, recipeId, name, script, user });

export const forgeDeleteRecipe = (token: string, orgSlug: string, recipeId: string) =>
  invoke("forge_delete_recipe", { token, orgSlug, recipeId });

export const forgeRunRecipe = (token: string, orgSlug: string, recipeId: string, servers: string[]) =>
  invoke("forge_run_recipe", { token, orgSlug, recipeId, servers });

// Site Create/Delete
export const forgeCreateSite = (token: string, orgSlug: string, serverId: string, domain: string, projectType: string, phpVersion: string) =>
  invoke("forge_create_site", { token, orgSlug, serverId, domain, projectType, phpVersion });

export const forgeDeleteSite = (token: string, orgSlug: string, serverId: string, siteId: string) =>
  invoke("forge_delete_site", { token, orgSlug, serverId, siteId });

// =====================================================
// Cloud Types
// =====================================================

export interface CloudOrganization {
  id: string;
  name: string;
}

export interface CloudApplication {
  id: string;
  name: string;
  slug: string | null;
  region: string | null;
  avatar_url: string | null;
  created_at: string | null;
}

export interface CloudEnvVar {
  key: string;
  value: string;
}

export interface CloudEnvironment {
  id: string;
  name: string;
  slug: string | null;
  status: string | null;
  vanity_domain: string | null;
  php_major_version: string | null;
  uses_octane: boolean;
  uses_hibernation: boolean;
  uses_push_to_deploy: boolean;
  environment_variables: CloudEnvVar[];
  created_at: string | null;
}

export interface CloudDeployment {
  id: string;
  status: string | null;
  branch_name: string | null;
  commit_hash: string | null;
  commit_message: string | null;
  commit_author: string | null;
  failure_reason: string | null;
  started_at: string | null;
  finished_at: string | null;
}

export interface CloudInstance {
  id: string;
  name: string;
  instance_type: string | null;
  size: string | null;
  scaling_type: string | null;
  min_replicas: number | null;
  max_replicas: number | null;
  uses_scheduler: boolean;
  created_at: string | null;
}

export interface CloudDomain {
  id: string;
  name: string;
  domain_type: string | null;
  hostname_status: string | null;
  ssl_status: string | null;
  created_at: string | null;
}

export interface CloudCommand {
  id: string;
  command: string | null;
  output: string | null;
  status: string | null;
  exit_code: number | null;
  failure_reason: string | null;
  started_at: string | null;
  finished_at: string | null;
  created_at: string | null;
}

export interface CloudDatabase {
  id: string;
  name: string;
  db_type: string | null;
  status: string | null;
  region: string | null;
  created_at: string | null;
}

export interface CloudDatabaseCluster {
  id: string;
  name: string;
  cluster_type: string | null;
  status: string | null;
  region: string | null;
  created_at: string | null;
}

export interface CloudCache {
  id: string;
  name: string;
  cache_type: string | null;
  status: string | null;
  region: string | null;
  size: string | null;
  created_at: string | null;
}

export interface CloudBucket {
  id: string;
  name: string;
  bucket_type: string | null;
  status: string | null;
  visibility: string | null;
  endpoint: string | null;
  url: string | null;
  created_at: string | null;
}

export interface CloudBucketKey {
  id: string;
  name: string;
  permission: string | null;
  access_key_id: string | null;
  access_key_secret: string | null;
  created_at: string | null;
}

export interface CloudWebsocketServer {
  id: string;
  name: string;
  ws_type: string | null;
  region: string | null;
  status: string | null;
  max_connections: number | null;
  hostname: string | null;
  created_at: string | null;
}

export interface CloudWebsocketApplication {
  id: string;
  name: string;
  app_id: string;
  key: string;
  secret: string;
  created_at: string;
}

export interface CloudBackgroundProcess {
  id: string;
  process_type: string | null;
  processes: number | null;
  command: string | null;
  created_at: string | null;
}

export interface CloudDatabaseSnapshot {
  id: string;
  name: string | null;
  description: string | null;
  snapshot_type: string | null;
  status: string | null;
  storage_bytes: number | null;
  created_at: string | null;
}

// =====================================================
// Cloud API Functions
// =====================================================

// Meta
export const cloudGetOrganization = (token: string) =>
  invoke<CloudOrganization>("cloud_get_organization", { token });

export const cloudListRegions = (token: string) =>
  invoke<unknown>("cloud_list_regions", { token });

// Applications
export const cloudListApplications = (token: string) =>
  invoke<CloudApplication[]>("cloud_list_applications", { token });

export const cloudCreateApplication = (token: string, name: string, region: string) =>
  invoke("cloud_create_application", { token, name, region });

export const cloudGetApplication = (token: string, appId: string) =>
  invoke<CloudApplication>("cloud_get_application", { token, appId });

export const cloudDeleteApplication = (token: string, appId: string) =>
  invoke("cloud_delete_application", { token, appId });

export const cloudUpdateApplication = (token: string, appId: string, data: Record<string, unknown>) =>
  invoke("cloud_update_application", { token, appId, data });

// Environments
export const cloudListEnvironments = (token: string, appId: string) =>
  invoke<CloudEnvironment[]>("cloud_list_environments", { token, appId });

export const cloudCreateEnvironment = (token: string, appId: string, name: string) =>
  invoke("cloud_create_environment", { token, appId, name });

export const cloudGetEnvironment = (token: string, envId: string) =>
  invoke<CloudEnvironment>("cloud_get_environment", { token, envId });

export const cloudUpdateEnvironment = (token: string, envId: string, data: Record<string, unknown>) =>
  invoke("cloud_update_environment", { token, envId, data });

export const cloudDeleteEnvironment = (token: string, envId: string) =>
  invoke("cloud_delete_environment", { token, envId });

export const cloudStartEnvironment = (token: string, envId: string) =>
  invoke("cloud_start_environment", { token, envId });

export const cloudStopEnvironment = (token: string, envId: string) =>
  invoke("cloud_stop_environment", { token, envId });

export const cloudAddEnvVariables = (token: string, envId: string, variables: Record<string, unknown>) =>
  invoke("cloud_add_env_variables", { token, envId, variables });

export const cloudDeleteEnvVariables = (token: string, envId: string, variables: string[]) =>
  invoke("cloud_delete_env_variables", { token, envId, variables });

export const cloudGetEnvironmentLogs = (token: string, envId: string, from: string, to: string) =>
  invoke<{ data: Array<{ message: string; level: string; type: string; logged_at: string; data?: Record<string, unknown> }> }>("cloud_get_environment_logs", { token, envId, from, to });

export const cloudGetEnvironmentMetrics = (token: string, envId: string) =>
  invoke<unknown>("cloud_get_environment_metrics", { token, envId });

// Deployments
export const cloudListDeployments = (token: string, envId: string) =>
  invoke<CloudDeployment[]>("cloud_list_deployments", { token, envId });

export const cloudCreateDeployment = (token: string, envId: string) =>
  invoke("cloud_create_deployment", { token, envId });

export const cloudGetDeployment = (token: string, deploymentId: string) =>
  invoke<CloudDeployment>("cloud_get_deployment", { token, deploymentId });

export const cloudGetDeploymentLogs = (token: string, deploymentId: string) =>
  invoke<string>("cloud_get_deployment_logs", { token, deploymentId });

// Commands
export const cloudListCommands = (token: string, envId: string) =>
  invoke<CloudCommand[]>("cloud_list_commands", { token, envId });

export const cloudRunCommand = (token: string, envId: string, command: string) =>
  invoke("cloud_run_command", { token, envId, command });

export const cloudGetCommand = (token: string, commandId: string) =>
  invoke<CloudCommand>("cloud_get_command", { token, commandId });

// Instances
export const cloudListInstances = (token: string, envId: string) =>
  invoke<CloudInstance[]>("cloud_list_instances", { token, envId });

export const cloudCreateInstance = (token: string, envId: string, name: string, instanceType: string, size: string) =>
  invoke("cloud_create_instance", { token, envId, name, instanceType, size });

export const cloudUpdateInstance = (token: string, instanceId: string, data: Record<string, unknown>) =>
  invoke("cloud_update_instance", { token, instanceId, data });

export const cloudDeleteInstance = (token: string, instanceId: string) =>
  invoke("cloud_delete_instance", { token, instanceId });

export const cloudListInstanceSizes = (token: string) =>
  invoke<unknown>("cloud_list_instance_sizes", { token });

// Domains
export const cloudListDomains = (token: string, envId: string) =>
  invoke<CloudDomain[]>("cloud_list_domains", { token, envId });

export const cloudCreateDomain = (token: string, envId: string, name: string) =>
  invoke("cloud_create_domain", { token, envId, name });

export const cloudDeleteDomain = (token: string, domainId: string) =>
  invoke("cloud_delete_domain", { token, domainId });

export const cloudVerifyDomain = (token: string, domainId: string) =>
  invoke("cloud_verify_domain", { token, domainId });

export const cloudUpdateDomain = (token: string, domainId: string, data: Record<string, unknown>) =>
  invoke("cloud_update_domain", { token, domainId, data });

// Database Clusters
export const cloudListDatabaseClusters = (token: string) =>
  invoke<CloudDatabaseCluster[]>("cloud_list_database_clusters", { token });

export const cloudCreateDatabaseCluster = (token: string, name: string, dbType: string, region: string) =>
  invoke("cloud_create_database_cluster", { token, name, dbType, region });

export const cloudDeleteDatabaseCluster = (token: string, clusterId: string) =>
  invoke("cloud_delete_database_cluster", { token, clusterId });

export const cloudUpdateDatabaseCluster = (token: string, clusterId: string, data: Record<string, unknown>) =>
  invoke("cloud_update_database_cluster", { token, clusterId, data });

export const cloudListClusterDatabases = (token: string, clusterId: string) =>
  invoke<CloudDatabase[]>("cloud_list_cluster_databases", { token, clusterId });

export const cloudCreateClusterDatabase = (token: string, clusterId: string, name: string) =>
  invoke("cloud_create_cluster_database", { token, clusterId, name });

export const cloudDeleteClusterDatabase = (token: string, clusterId: string, schema: string) =>
  invoke("cloud_delete_cluster_database", { token, clusterId, schema });

export const cloudListDatabaseSnapshots = (token: string, clusterId: string) =>
  invoke<CloudDatabaseSnapshot[]>("cloud_list_database_snapshots", { token, clusterId });

export const cloudCreateDatabaseSnapshot = (token: string, clusterId: string) =>
  invoke("cloud_create_database_snapshot", { token, clusterId });

export const cloudDeleteDatabaseSnapshot = (token: string, snapshotId: string) =>
  invoke("cloud_delete_database_snapshot", { token, snapshotId });

export const cloudRestoreDatabase = (token: string, clusterId: string, snapshotId: string) =>
  invoke("cloud_restore_database", { token, clusterId, snapshotId });

export const cloudGetDatabaseMetrics = (token: string, clusterId: string) =>
  invoke<unknown>("cloud_get_database_metrics", { token, clusterId });

// Standalone Databases
export const cloudListDatabases = (token: string) =>
  invoke<CloudDatabase[]>("cloud_list_databases", { token });

export const cloudCreateDatabase = (token: string, name: string, dbType: string, region: string) =>
  invoke("cloud_create_database", { token, name, dbType, region });

export const cloudDeleteDatabase = (token: string, databaseId: string) =>
  invoke("cloud_delete_database", { token, databaseId });

export const cloudUpdateDatabase = (token: string, databaseId: string, data: Record<string, unknown>) =>
  invoke("cloud_update_database", { token, databaseId, data });

// Caches
export const cloudListCaches = (token: string) =>
  invoke<CloudCache[]>("cloud_list_caches", { token });

export const cloudCreateCache = (token: string, name: string, cacheType: string, region: string, size: string) =>
  invoke("cloud_create_cache", { token, name, cacheType, region, size });

export const cloudDeleteCache = (token: string, cacheId: string) =>
  invoke("cloud_delete_cache", { token, cacheId });

export const cloudUpdateCache = (token: string, cacheId: string, data: Record<string, unknown>) =>
  invoke("cloud_update_cache", { token, cacheId, data });

export const cloudListCacheTypes = (token: string) =>
  invoke<unknown>("cloud_list_cache_types", { token });

export const cloudGetCacheMetrics = (token: string, cacheId: string) =>
  invoke<unknown>("cloud_get_cache_metrics", { token, cacheId });

// Object Storage
export const cloudListBuckets = (token: string) =>
  invoke<CloudBucket[]>("cloud_list_buckets", { token });

export const cloudCreateBucket = (token: string, name: string, visibility: string) =>
  invoke("cloud_create_bucket", { token, name, visibility });

export const cloudDeleteBucket = (token: string, bucketId: string) =>
  invoke("cloud_delete_bucket", { token, bucketId });

export const cloudUpdateBucket = (token: string, bucketId: string, data: Record<string, unknown>) =>
  invoke("cloud_update_bucket", { token, bucketId, data });

export const cloudListBucketKeys = (token: string, bucketId: string) =>
  invoke<CloudBucketKey[]>("cloud_list_bucket_keys", { token, bucketId });

export const cloudCreateBucketKey = (token: string, bucketId: string, name: string, permission: string) =>
  invoke("cloud_create_bucket_key", { token, bucketId, name, permission });

export const cloudDeleteBucketKey = (token: string, keyId: string) =>
  invoke("cloud_delete_bucket_key", { token, keyId });

// WebSocket
export const cloudListWebsocketServers = (token: string) =>
  invoke<CloudWebsocketServer[]>("cloud_list_websocket_servers", { token });

export const cloudCreateWebsocketServer = (token: string, name: string, region: string, maxConnections: number) =>
  invoke("cloud_create_websocket_server", { token, name, region, maxConnections });

export const cloudDeleteWebsocketServer = (token: string, serverId: string) =>
  invoke("cloud_delete_websocket_server", { token, serverId });

export const cloudUpdateWebsocketServer = (token: string, serverId: string, data: Record<string, unknown>) =>
  invoke("cloud_update_websocket_server", { token, serverId, data });

export const cloudGetWebsocketServerMetrics = (token: string, serverId: string) =>
  invoke<unknown>("cloud_get_websocket_server_metrics", { token, serverId });

// WebSocket Applications
export const cloudListWebsocketApplications = (token: string, serverId: string) =>
  invoke<CloudWebsocketApplication[]>("cloud_list_websocket_applications", { token, serverId });

export const cloudCreateWebsocketApplication = (token: string, serverId: string, name: string) =>
  invoke("cloud_create_websocket_application", { token, serverId, name });

export const cloudUpdateWebsocketApplication = (token: string, appId: string, data: Record<string, unknown>) =>
  invoke("cloud_update_websocket_application", { token, appId, data });

export const cloudDeleteWebsocketApplication = (token: string, appId: string) =>
  invoke("cloud_delete_websocket_application", { token, appId });

export const cloudGetWebsocketApplicationMetrics = (token: string, appId: string) =>
  invoke<unknown>("cloud_get_websocket_application_metrics", { token, appId });

// Background Processes
export const cloudListBackgroundProcesses = (token: string, instanceId: string) =>
  invoke<CloudBackgroundProcess[]>("cloud_list_background_processes", { token, instanceId });

export const cloudCreateBackgroundProcess = (token: string, instanceId: string, command: string, processes: number) =>
  invoke("cloud_create_background_process", { token, instanceId, command, processes });

export const cloudDeleteBackgroundProcess = (token: string, processId: string) =>
  invoke("cloud_delete_background_process", { token, processId });

export const cloudUpdateBackgroundProcess = (token: string, processId: string, data: Record<string, unknown>) =>
  invoke("cloud_update_background_process", { token, processId, data });

// Meta (additional)
export const cloudListDedicatedClusters = (token: string) =>
  invoke<unknown>("cloud_list_dedicated_clusters", { token });

export const cloudListIpAddresses = (token: string) =>
  invoke<unknown>("cloud_list_ip_addresses", { token });

export const cloudListDatabaseTypes = (token: string) =>
  invoke<unknown>("cloud_list_database_types", { token });

// Service keys
export const SERVICES = {
  FORGE: "forge_api_token",
  CLOUD: "cloud_api_token",
  NIGHTWATCH: "nightwatch_api_token",
} as const;
