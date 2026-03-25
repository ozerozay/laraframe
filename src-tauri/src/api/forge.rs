use reqwest::Client;
use serde::{Deserialize, Serialize};
use serde_json::Value;

const FORGE_API_URL: &str = "https://forge.laravel.com/api";

// =====================================================
// JSON:API Response Types
// =====================================================

#[derive(Debug, Deserialize)]
struct JsonApiOne<A> {
    data: JsonApiResource<A>,
}

#[derive(Debug, Deserialize)]
struct JsonApiMany<A> {
    data: Vec<JsonApiResource<A>>,
}

#[derive(Debug, Deserialize)]
struct JsonApiResource<A> {
    id: String,
    #[serde(rename = "type")]
    resource_type: String,
    attributes: A,
}

// =====================================================
// Attribute Types (what lives inside "attributes")
// =====================================================

#[derive(Debug, Deserialize)]
struct UserAttrs {
    name: String,
    email: String,
}

#[derive(Debug, Deserialize)]
struct OrgAttrs {
    name: String,
    slug: String,
}

#[derive(Debug, Deserialize)]
struct ServerAttrs {
    name: String,
    #[serde(default)]
    provider: Option<String>,
    #[serde(default)]
    region: Option<String>,
    #[serde(default)]
    ip_address: Option<String>,
    #[serde(default)]
    private_ip_address: Option<String>,
    #[serde(default)]
    php_version: Option<String>,
    #[serde(default)]
    ubuntu_version: Option<String>,
    #[serde(default)]
    is_ready: bool,
    #[serde(default)]
    revoked: bool,
    #[serde(default)]
    connection_status: Option<String>,
    #[serde(default)]
    database_type: Option<String>,
}

#[derive(Debug, Deserialize)]
struct SiteRepository {
    #[serde(default)]
    provider: Option<String>,
    #[serde(default)]
    url: Option<String>,
    #[serde(default)]
    branch: Option<String>,
}

#[derive(Debug, Deserialize)]
struct SiteAttrs {
    name: String,
    #[serde(default)]
    status: Option<String>,
    #[serde(default)]
    url: Option<String>,
    #[serde(default)]
    php_version: Option<String>,
    #[serde(default)]
    repository: Option<SiteRepository>,
    #[serde(default)]
    deployment_status: Option<String>,
    #[serde(default)]
    quick_deploy: bool,
    #[serde(default)]
    app_type: Option<String>,
}

#[derive(Debug, Deserialize)]
struct EventAttrs {
    description: String,
    created_at: String,
    #[serde(default)]
    status: Option<String>,
}

#[derive(Debug, Deserialize)]
struct MonitorAttrs {
    status: String,
    #[serde(rename = "type")]
    monitor_type: String,
    #[serde(default)]
    operator: Option<String>,
    #[serde(default)]
    threshold: Option<i64>,
    #[serde(default)]
    minutes: Option<i64>,
    #[serde(default)]
    state: Option<String>,
}

#[derive(Debug, Deserialize)]
struct DeploymentCommit {
    #[serde(default)]
    hash: Option<String>,
    #[serde(default)]
    author: Option<String>,
    #[serde(default)]
    message: Option<String>,
    #[serde(default)]
    branch: Option<String>,
}

#[derive(Debug, Deserialize)]
struct DeploymentAttrs {
    #[serde(default)]
    commit: Option<DeploymentCommit>,
    #[serde(rename = "type", default)]
    deploy_type: Option<String>,
    #[serde(default)]
    status: Option<String>,
    #[serde(default)]
    started_at: Option<String>,
    #[serde(default)]
    ended_at: Option<String>,
    #[serde(default)]
    created_at: Option<String>,
}

#[derive(Debug, Deserialize)]
struct EnvAttrs {
    content: String,
}

#[derive(Debug, Deserialize)]
struct CommandAttrs {
    #[serde(default)]
    command: Option<String>,
    #[serde(default)]
    status: Option<String>,
    #[serde(default)]
    duration: Option<i64>,
    #[serde(default)]
    created_at: Option<String>,
}

#[derive(Debug, Deserialize)]
struct CommandOutputAttrs {
    #[serde(default)]
    output: Option<String>,
}

#[derive(Debug, Deserialize)]
struct DeploymentLogAttrs {
    #[serde(default)]
    output: Option<String>,
}

#[derive(Debug, Deserialize)]
struct DomainAttrs {
    name: String,
    #[serde(rename = "type", default)]
    domain_type: Option<String>,
    #[serde(default)]
    status: Option<String>,
    #[serde(default)]
    www_redirect_type: Option<String>,
    #[serde(default)]
    allow_wildcard_subdomains: bool,
    #[serde(default)]
    created_at: Option<String>,
}

#[derive(Debug, Deserialize)]
struct CertificateAttrs {
    #[serde(rename = "type", default)]
    cert_type: Option<String>,
    #[serde(default)]
    status: Option<String>,
    #[serde(default)]
    request_status: Option<String>,
    #[serde(default)]
    created_at: Option<String>,
}

#[derive(Debug, Deserialize)]
struct RedirectRuleAttrs {
    #[serde(default)]
    from: Option<String>,
    #[serde(default)]
    to: Option<String>,
    #[serde(rename = "type", default)]
    redirect_type: Option<String>,
    #[serde(default)]
    created_at: Option<String>,
}

#[derive(Debug, Deserialize)]
struct SecurityRuleAttrs {
    #[serde(default)]
    name: Option<String>,
    #[serde(default)]
    path: Option<String>,
    #[serde(default)]
    created_at: Option<String>,
}

#[derive(Debug, Deserialize)]
struct ScheduledJobAttrs {
    #[serde(default)]
    command: Option<String>,
    #[serde(default)]
    frequency: Option<String>,
    #[serde(default)]
    user: Option<String>,
    #[serde(default)]
    created_at: Option<String>,
}

#[derive(Debug, Deserialize)]
struct ScheduledJobOutputAttrs {
    #[serde(default)]
    output: Option<String>,
}

#[derive(Debug, Deserialize)]
struct WebhookAttrs {
    #[serde(default)]
    url: Option<String>,
    #[serde(default)]
    created_at: Option<String>,
}

#[derive(Debug, Deserialize)]
struct HeartbeatAttrs {
    #[serde(default)]
    url: Option<String>,
    #[serde(default)]
    created_at: Option<String>,
}

#[derive(Debug, Deserialize)]
struct DatabaseSchemaAttrs {
    name: String,
    #[serde(default)]
    status: Option<String>,
    #[serde(default)]
    created_at: Option<String>,
}

#[derive(Debug, Deserialize)]
struct DatabaseUserAttrs {
    name: String,
    #[serde(default)]
    status: Option<String>,
    #[serde(default)]
    created_at: Option<String>,
}

#[derive(Debug, Deserialize)]
struct HealthcheckAttrs {
    #[serde(default)]
    url: Option<String>,
}

#[derive(Debug, Deserialize)]
struct BackupConfigAttrs {
    #[serde(default)]
    provider: String,
    #[serde(default)]
    databases: serde_json::Value,
    #[serde(default)]
    frequency: String,
    #[serde(default)]
    retention: i64,
    #[serde(default)]
    status: String,
    #[serde(default)]
    created_at: String,
}

#[derive(Debug, Deserialize)]
struct BackupInstanceAttrs {
    #[serde(default)]
    status: String,
    #[serde(default)]
    size: i64,
    #[serde(default)]
    created_at: String,
}

#[derive(Debug, Deserialize)]
struct SSHKeyAttrs {
    #[serde(default)]
    name: String,
    #[serde(default)]
    status: String,
    #[serde(default)]
    created_at: String,
}

#[derive(Debug, Deserialize)]
struct FirewallRuleAttrs {
    #[serde(default)]
    name: String,
    #[serde(default)]
    port: String,
    #[serde(default)]
    ip_address: String,
    #[serde(rename = "type", default)]
    rule_type: String,
    #[serde(default)]
    status: String,
    #[serde(default)]
    created_at: String,
}

#[derive(Debug, Deserialize)]
struct DaemonAttrs {
    #[serde(default)]
    command: String,
    #[serde(default)]
    user: String,
    #[serde(default)]
    directory: String,
    #[serde(default)]
    processes: i64,
    #[serde(default)]
    status: String,
    #[serde(default)]
    created_at: String,
}

#[derive(Debug, Deserialize)]
struct DaemonLogAttrs {
    #[serde(default)]
    output: Option<String>,
}

#[derive(Debug, Deserialize)]
struct RecipeAttrs {
    #[serde(default)]
    name: String,
    #[serde(default)]
    script: String,
    #[serde(default)]
    user: String,
    #[serde(default)]
    created_at: String,
}

#[derive(Debug, Deserialize)]
struct PHPVersionAttrs {
    #[serde(default)]
    version: String,
    #[serde(default)]
    binary_name: String,
    #[serde(default)]
    status: String,
    #[serde(default)]
    created_at: String,
}

// =====================================================
// Frontend-facing types (flat, easy to consume in TS)
// =====================================================

#[derive(Debug, Serialize, Clone)]
pub struct ForgeUser {
    pub id: String,
    pub name: String,
    pub email: String,
}

#[derive(Debug, Serialize, Clone)]
pub struct ForgeOrganization {
    pub id: String,
    pub name: String,
    pub slug: String,
}

#[derive(Debug, Serialize, Clone)]
pub struct ForgeServer {
    pub id: String,
    pub name: String,
    pub ip_address: Option<String>,
    pub provider: Option<String>,
    pub region: Option<String>,
    pub php_version: Option<String>,
    pub ubuntu_version: Option<String>,
    pub is_ready: bool,
    pub revoked: bool,
    pub connection_status: Option<String>,
    pub database_type: Option<String>,
}

#[derive(Debug, Serialize, Clone)]
pub struct ForgeSite {
    pub id: String,
    pub name: String,
    pub status: Option<String>,
    pub url: Option<String>,
    pub php_version: Option<String>,
    pub repository_url: Option<String>,
    pub repository_branch: Option<String>,
    pub deployment_status: Option<String>,
    pub quick_deploy: bool,
    pub app_type: Option<String>,
}

#[derive(Debug, Serialize, Clone)]
pub struct ForgeEvent {
    pub id: String,
    pub description: String,
    pub created_at: String,
    pub status: Option<String>,
}

#[derive(Debug, Serialize, Clone)]
pub struct ForgeMonitor {
    pub id: String,
    pub status: String,
    pub monitor_type: String,
    pub operator: Option<String>,
    pub threshold: Option<i64>,
    pub minutes: Option<i64>,
    pub state: Option<String>,
}

#[derive(Debug, Serialize, Clone)]
pub struct ForgeDeployment {
    pub id: String,
    pub status: Option<String>,
    pub deploy_type: Option<String>,
    pub commit_hash: Option<String>,
    pub commit_author: Option<String>,
    pub commit_message: Option<String>,
    pub commit_branch: Option<String>,
    pub started_at: Option<String>,
    pub ended_at: Option<String>,
    pub created_at: Option<String>,
}

#[derive(Debug, Serialize, Clone)]
pub struct ForgeCommand {
    pub id: String,
    pub command: Option<String>,
    pub status: Option<String>,
    pub duration: Option<i64>,
    pub created_at: Option<String>,
}

#[derive(Debug, Serialize, Clone)]
pub struct ForgeDomain {
    pub id: String,
    pub name: String,
    pub domain_type: Option<String>,
    pub status: Option<String>,
    pub www_redirect_type: Option<String>,
    pub allow_wildcard_subdomains: bool,
    pub created_at: Option<String>,
}

#[derive(Debug, Serialize, Clone)]
pub struct ForgeCertificate {
    pub id: String,
    pub cert_type: Option<String>,
    pub status: Option<String>,
    pub request_status: Option<String>,
    pub created_at: Option<String>,
}

#[derive(Debug, Serialize, Clone)]
pub struct ForgeRedirectRule {
    pub id: String,
    pub from: Option<String>,
    pub to: Option<String>,
    pub redirect_type: Option<String>,
    pub created_at: Option<String>,
}

#[derive(Debug, Serialize, Clone)]
pub struct ForgeSecurityRule {
    pub id: String,
    pub name: Option<String>,
    pub path: Option<String>,
    pub created_at: Option<String>,
}

#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct SecurityCredential {
    pub username: String,
    pub password: String,
}

#[derive(Debug, Serialize, Clone)]
pub struct ForgeScheduledJob {
    pub id: String,
    pub command: Option<String>,
    pub frequency: Option<String>,
    pub user: Option<String>,
    pub created_at: Option<String>,
}

#[derive(Debug, Serialize, Clone)]
pub struct ForgeWebhook {
    pub id: String,
    pub url: Option<String>,
    pub created_at: Option<String>,
}

#[derive(Debug, Serialize, Clone)]
pub struct ForgeHeartbeat {
    pub id: String,
    pub url: Option<String>,
    pub created_at: Option<String>,
}

#[derive(Debug, Serialize, Clone)]
pub struct ForgeDatabaseSchema {
    pub id: String,
    pub name: String,
    pub status: Option<String>,
    pub created_at: Option<String>,
}

#[derive(Debug, Serialize, Clone)]
pub struct ForgeDatabaseUser {
    pub id: String,
    pub name: String,
    pub status: Option<String>,
    pub created_at: Option<String>,
}

#[derive(Debug, Serialize, Clone)]
pub struct ForgeBackupConfig {
    pub id: String,
    pub provider: String,
    pub frequency: String,
    pub retention: i64,
    pub status: String,
    pub created_at: String,
}

#[derive(Debug, Serialize, Clone)]
pub struct ForgeBackupInstance {
    pub id: String,
    pub status: String,
    pub size: i64,
    pub created_at: String,
}

#[derive(Debug, Serialize, Clone)]
pub struct ForgeSSHKey {
    pub id: String,
    pub name: String,
    pub status: String,
    pub created_at: String,
}

#[derive(Debug, Serialize, Clone)]
pub struct ForgeFirewallRule {
    pub id: String,
    pub name: String,
    pub port: String,
    pub ip_address: String,
    pub rule_type: String,
    pub status: String,
    pub created_at: String,
}

#[derive(Debug, Serialize, Clone)]
pub struct ForgeDaemon {
    pub id: String,
    pub command: String,
    pub user: String,
    pub directory: String,
    pub processes: i64,
    pub status: String,
    pub created_at: String,
}

#[derive(Debug, Serialize, Clone)]
pub struct ForgeRecipe {
    pub id: String,
    pub name: String,
    pub script: String,
    pub user: String,
    pub created_at: String,
}

#[derive(Debug, Serialize, Clone)]
pub struct ForgePHPVersion {
    pub id: String,
    pub version: String,
    pub binary_name: String,
    pub status: String,
    pub created_at: String,
}

// =====================================================
// HTTP Client
// =====================================================

fn build_client(token: &str) -> Result<Client, String> {
    Client::builder()
        .default_headers({
            let mut headers = reqwest::header::HeaderMap::new();
            headers.insert(
                "Authorization",
                format!("Bearer {}", token)
                    .parse()
                    .map_err(|e: reqwest::header::InvalidHeaderValue| e.to_string())?,
            );
            headers.insert("Accept", "application/json".parse().unwrap());
            headers.insert("Content-Type", "application/json".parse().unwrap());
            headers
        })
        .build()
        .map_err(|e| e.to_string())
}

async fn api_get<T: serde::de::DeserializeOwned>(client: &Client, url: &str) -> Result<T, String> {
    let resp = client.get(url).send().await.map_err(|e| e.to_string())?;
    if !resp.status().is_success() {
        let status = resp.status();
        let body = resp.text().await.unwrap_or_default();
        return Err(format!("Forge API error {}: {}", status, body));
    }
    resp.json::<T>().await.map_err(|e| e.to_string())
}

async fn api_get_text(client: &Client, url: &str) -> Result<String, String> {
    let resp = client.get(url).send().await.map_err(|e| e.to_string())?;
    if !resp.status().is_success() {
        return Err(format!("Forge API error: {}", resp.status()));
    }
    // The log endpoints may return JSON with a "content" field or plain text
    let text = resp.text().await.map_err(|e| e.to_string())?;
    // Try to extract "content" from JSON
    if let Ok(val) = serde_json::from_str::<Value>(&text) {
        if let Some(content) = val.get("content").and_then(|c| c.as_str()) {
            return Ok(content.to_string());
        }
        if let Some(data) = val.get("data") {
            if let Some(attrs) = data.get("attributes") {
                if let Some(content) = attrs.get("content").and_then(|c| c.as_str()) {
                    return Ok(content.to_string());
                }
            }
        }
    }
    Ok(text)
}

async fn api_post(client: &Client, url: &str, body: Option<serde_json::Value>) -> Result<(), String> {
    let mut req = client.post(url);
    if let Some(b) = body {
        req = req.json(&b);
    }
    let resp = req.send().await.map_err(|e| e.to_string())?;
    if !resp.status().is_success() {
        let status = resp.status();
        let body = resp.text().await.unwrap_or_default();
        return Err(format!("Forge API error {}: {}", status, body));
    }
    Ok(())
}

async fn api_put(client: &Client, url: &str, body: Option<serde_json::Value>) -> Result<(), String> {
    let mut req = client.put(url);
    if let Some(b) = body {
        req = req.json(&b);
    }
    let resp = req.send().await.map_err(|e| e.to_string())?;
    if !resp.status().is_success() {
        let status = resp.status();
        let body = resp.text().await.unwrap_or_default();
        return Err(format!("Forge API error {}: {}", status, body));
    }
    Ok(())
}

async fn api_put_text(client: &Client, url: &str, content: &str) -> Result<(), String> {
    let resp = client
        .put(url)
        .json(&serde_json::json!({ "content": content }))
        .send()
        .await
        .map_err(|e| e.to_string())?;
    if !resp.status().is_success() {
        let status = resp.status();
        let body = resp.text().await.unwrap_or_default();
        return Err(format!("Forge API error {}: {}", status, body));
    }
    Ok(())
}

async fn api_delete(client: &Client, url: &str) -> Result<(), String> {
    let resp = client.delete(url).send().await.map_err(|e| e.to_string())?;
    if !resp.status().is_success() {
        let status = resp.status();
        let body = resp.text().await.unwrap_or_default();
        return Err(format!("Forge API error {}: {}", status, body));
    }
    Ok(())
}

// =====================================================
// Commands
// =====================================================

#[tauri::command]
pub async fn forge_get_user(token: String) -> Result<ForgeUser, String> {
    let client = build_client(&token)?;
    let resp: JsonApiOne<UserAttrs> = api_get(&client, &format!("{}/me", FORGE_API_URL)).await?;
    Ok(ForgeUser {
        id: resp.data.id,
        name: resp.data.attributes.name,
        email: resp.data.attributes.email,
    })
}

#[tauri::command]
pub async fn forge_list_orgs(token: String) -> Result<Vec<ForgeOrganization>, String> {
    let client = build_client(&token)?;
    let resp: JsonApiMany<OrgAttrs> = api_get(&client, &format!("{}/orgs", FORGE_API_URL)).await?;
    Ok(resp
        .data
        .into_iter()
        .map(|r| ForgeOrganization {
            id: r.id,
            name: r.attributes.name,
            slug: r.attributes.slug,
        })
        .collect())
}

#[tauri::command]
pub async fn forge_list_servers(token: String, org_slug: String) -> Result<Vec<ForgeServer>, String> {
    let client = build_client(&token)?;
    let resp: JsonApiMany<ServerAttrs> =
        api_get(&client, &format!("{}/orgs/{}/servers", FORGE_API_URL, org_slug)).await?;
    Ok(resp
        .data
        .into_iter()
        .map(|r| ForgeServer {
            id: r.id,
            name: r.attributes.name,
            ip_address: r.attributes.ip_address,
            provider: r.attributes.provider,
            region: r.attributes.region,
            php_version: r.attributes.php_version,
            ubuntu_version: r.attributes.ubuntu_version,
            is_ready: r.attributes.is_ready,
            revoked: r.attributes.revoked,
            connection_status: r.attributes.connection_status,
            database_type: r.attributes.database_type,
        })
        .collect())
}

#[tauri::command]
pub async fn forge_list_sites(token: String, org_slug: String, server_id: String) -> Result<Vec<ForgeSite>, String> {
    let client = build_client(&token)?;
    let resp: JsonApiMany<SiteAttrs> = api_get(
        &client,
        &format!("{}/orgs/{}/servers/{}/sites", FORGE_API_URL, org_slug, server_id),
    )
    .await?;
    Ok(resp
        .data
        .into_iter()
        .map(|r| {
            let (repo_url, repo_branch) = match r.attributes.repository {
                Some(repo) => (repo.url, repo.branch),
                None => (None, None),
            };
            ForgeSite {
                id: r.id,
                name: r.attributes.name,
                status: r.attributes.status,
                url: r.attributes.url,
                php_version: r.attributes.php_version,
                repository_url: repo_url,
                repository_branch: repo_branch,
                deployment_status: r.attributes.deployment_status,
                quick_deploy: r.attributes.quick_deploy,
                app_type: r.attributes.app_type,
            }
        })
        .collect())
}

#[tauri::command]
pub async fn forge_get_events(token: String, org_slug: String, server_id: String) -> Result<Vec<ForgeEvent>, String> {
    let client = build_client(&token)?;
    let resp: JsonApiMany<EventAttrs> = api_get(
        &client,
        &format!("{}/orgs/{}/servers/{}/events", FORGE_API_URL, org_slug, server_id),
    )
    .await?;
    Ok(resp
        .data
        .into_iter()
        .map(|r| ForgeEvent {
            id: r.id,
            description: r.attributes.description,
            created_at: r.attributes.created_at,
            status: r.attributes.status,
        })
        .collect())
}

#[tauri::command]
pub async fn forge_get_server_log(
    token: String,
    org_slug: String,
    server_id: String,
    log_type: String,
) -> Result<String, String> {
    let client = build_client(&token)?;
    api_get_text(
        &client,
        &format!(
            "{}/orgs/{}/servers/{}/logs/{}",
            FORGE_API_URL, org_slug, server_id, log_type
        ),
    )
    .await
}

#[tauri::command]
pub async fn forge_get_site_log(
    token: String,
    org_slug: String,
    server_id: String,
    site_id: String,
    log_type: String,
) -> Result<String, String> {
    let client = build_client(&token)?;
    api_get_text(
        &client,
        &format!(
            "{}/orgs/{}/servers/{}/sites/{}/logs/{}",
            FORGE_API_URL, org_slug, server_id, site_id, log_type
        ),
    )
    .await
}

#[tauri::command]
pub async fn forge_list_monitors(token: String, org_slug: String, server_id: String) -> Result<Vec<ForgeMonitor>, String> {
    let client = build_client(&token)?;
    let resp: JsonApiMany<MonitorAttrs> = api_get(
        &client,
        &format!("{}/orgs/{}/servers/{}/monitors", FORGE_API_URL, org_slug, server_id),
    )
    .await?;
    Ok(resp
        .data
        .into_iter()
        .map(|r| ForgeMonitor {
            id: r.id,
            status: r.attributes.status,
            monitor_type: r.attributes.monitor_type,
            operator: r.attributes.operator,
            threshold: r.attributes.threshold,
            minutes: r.attributes.minutes,
            state: r.attributes.state,
        })
        .collect())
}

#[tauri::command]
pub async fn forge_list_deployments(
    token: String,
    org_slug: String,
    server_id: String,
    site_id: String,
) -> Result<Vec<ForgeDeployment>, String> {
    let client = build_client(&token)?;
    let resp: JsonApiMany<DeploymentAttrs> = api_get(
        &client,
        &format!(
            "{}/orgs/{}/servers/{}/sites/{}/deployments",
            FORGE_API_URL, org_slug, server_id, site_id
        ),
    )
    .await?;
    Ok(resp
        .data
        .into_iter()
        .map(|r| {
            let (hash, author, message, branch) = match r.attributes.commit {
                Some(c) => (c.hash, c.author, c.message, c.branch),
                None => (None, None, None, None),
            };
            ForgeDeployment {
                id: r.id,
                status: r.attributes.status,
                deploy_type: r.attributes.deploy_type,
                commit_hash: hash,
                commit_author: author,
                commit_message: message,
                commit_branch: branch,
                started_at: r.attributes.started_at,
                ended_at: r.attributes.ended_at,
                created_at: r.attributes.created_at,
            }
        })
        .collect())
}

#[tauri::command]
pub async fn forge_deploy_site(
    token: String,
    org_slug: String,
    server_id: String,
    site_id: String,
) -> Result<(), String> {
    let client = build_client(&token)?;
    api_post(
        &client,
        &format!(
            "{}/orgs/{}/servers/{}/sites/{}/deployments",
            FORGE_API_URL, org_slug, server_id, site_id
        ),
        None,
    )
    .await
}

#[tauri::command]
pub async fn forge_server_action(
    token: String,
    org_slug: String,
    server_id: String,
    action: String,
) -> Result<(), String> {
    let client = build_client(&token)?;
    api_post(
        &client,
        &format!(
            "{}/orgs/{}/servers/{}/actions",
            FORGE_API_URL, org_slug, server_id
        ),
        Some(serde_json::json!({ "action": action })),
    )
    .await
}

#[tauri::command]
pub async fn forge_service_action(
    token: String,
    org_slug: String,
    server_id: String,
    service: String,
    action: String,
) -> Result<(), String> {
    let client = build_client(&token)?;
    api_post(
        &client,
        &format!(
            "{}/orgs/{}/servers/{}/services/{}/actions",
            FORGE_API_URL, org_slug, server_id, service
        ),
        Some(serde_json::json!({ "action": action })),
    )
    .await
}

// --- Site Environment ---

#[tauri::command]
pub async fn forge_get_env(
    token: String,
    org_slug: String,
    server_id: String,
    site_id: String,
) -> Result<String, String> {
    let client = build_client(&token)?;
    let resp: JsonApiOne<EnvAttrs> = api_get(
        &client,
        &format!(
            "{}/orgs/{}/servers/{}/sites/{}/environment",
            FORGE_API_URL, org_slug, server_id, site_id
        ),
    )
    .await?;
    Ok(resp.data.attributes.content)
}

#[tauri::command]
pub async fn forge_update_env(
    token: String,
    org_slug: String,
    server_id: String,
    site_id: String,
    content: String,
) -> Result<(), String> {
    let client = build_client(&token)?;
    api_put(
        &client,
        &format!(
            "{}/orgs/{}/servers/{}/sites/{}/environment",
            FORGE_API_URL, org_slug, server_id, site_id
        ),
        Some(serde_json::json!({ "environment": content })),
    )
    .await
}

// --- Deployment Enhancements ---

#[tauri::command]
pub async fn forge_get_deploy_script(
    token: String,
    org_slug: String,
    server_id: String,
    site_id: String,
) -> Result<String, String> {
    let client = build_client(&token)?;
    api_get_text(
        &client,
        &format!(
            "{}/orgs/{}/servers/{}/sites/{}/deployments/script",
            FORGE_API_URL, org_slug, server_id, site_id
        ),
    )
    .await
}

#[tauri::command]
pub async fn forge_update_deploy_script(
    token: String,
    org_slug: String,
    server_id: String,
    site_id: String,
    content: String,
) -> Result<(), String> {
    let client = build_client(&token)?;
    api_put_text(
        &client,
        &format!(
            "{}/orgs/{}/servers/{}/sites/{}/deployments/script",
            FORGE_API_URL, org_slug, server_id, site_id
        ),
        &content,
    )
    .await
}

#[tauri::command]
pub async fn forge_get_deployment_log(
    token: String,
    org_slug: String,
    server_id: String,
    site_id: String,
    deployment_id: String,
) -> Result<String, String> {
    let client = build_client(&token)?;
    let resp: JsonApiOne<DeploymentLogAttrs> = api_get(
        &client,
        &format!(
            "{}/orgs/{}/servers/{}/sites/{}/deployments/{}/log",
            FORGE_API_URL, org_slug, server_id, site_id, deployment_id
        ),
    )
    .await?;
    Ok(resp.data.attributes.output.unwrap_or_default())
}

// --- Commands ---

#[tauri::command]
pub async fn forge_list_commands(
    token: String,
    org_slug: String,
    server_id: String,
    site_id: String,
) -> Result<Vec<ForgeCommand>, String> {
    let client = build_client(&token)?;
    let resp: JsonApiMany<CommandAttrs> = api_get(
        &client,
        &format!(
            "{}/orgs/{}/servers/{}/sites/{}/commands",
            FORGE_API_URL, org_slug, server_id, site_id
        ),
    )
    .await?;
    Ok(resp
        .data
        .into_iter()
        .map(|r| ForgeCommand {
            id: r.id,
            command: r.attributes.command,
            status: r.attributes.status,
            duration: r.attributes.duration,
            created_at: r.attributes.created_at,
        })
        .collect())
}

#[tauri::command]
pub async fn forge_run_command(
    token: String,
    org_slug: String,
    server_id: String,
    site_id: String,
    command: String,
) -> Result<(), String> {
    let client = build_client(&token)?;
    api_post(
        &client,
        &format!(
            "{}/orgs/{}/servers/{}/sites/{}/commands",
            FORGE_API_URL, org_slug, server_id, site_id
        ),
        Some(serde_json::json!({ "command": command })),
    )
    .await
}

#[tauri::command]
pub async fn forge_get_command_output(
    token: String,
    org_slug: String,
    server_id: String,
    site_id: String,
    command_id: String,
) -> Result<String, String> {
    let client = build_client(&token)?;
    let resp: JsonApiOne<CommandOutputAttrs> = api_get(
        &client,
        &format!(
            "{}/orgs/{}/servers/{}/sites/{}/commands/{}",
            FORGE_API_URL, org_slug, server_id, site_id, command_id
        ),
    )
    .await?;
    Ok(resp.data.attributes.output.unwrap_or_default())
}

// --- Domains ---

#[tauri::command]
pub async fn forge_list_domains(
    token: String,
    org_slug: String,
    server_id: String,
    site_id: String,
) -> Result<Vec<ForgeDomain>, String> {
    let client = build_client(&token)?;
    let resp: JsonApiMany<DomainAttrs> = api_get(
        &client,
        &format!(
            "{}/orgs/{}/servers/{}/sites/{}/domains",
            FORGE_API_URL, org_slug, server_id, site_id
        ),
    )
    .await?;
    Ok(resp
        .data
        .into_iter()
        .map(|r| ForgeDomain {
            id: r.id,
            name: r.attributes.name,
            domain_type: r.attributes.domain_type,
            status: r.attributes.status,
            www_redirect_type: r.attributes.www_redirect_type,
            allow_wildcard_subdomains: r.attributes.allow_wildcard_subdomains,
            created_at: r.attributes.created_at,
        })
        .collect())
}

#[tauri::command]
pub async fn forge_create_domain(
    token: String,
    org_slug: String,
    server_id: String,
    site_id: String,
    name: String,
) -> Result<(), String> {
    let client = build_client(&token)?;
    api_post(
        &client,
        &format!(
            "{}/orgs/{}/servers/{}/sites/{}/domains",
            FORGE_API_URL, org_slug, server_id, site_id
        ),
        Some(serde_json::json!({ "name": name })),
    )
    .await
}

#[tauri::command]
pub async fn forge_delete_domain(
    token: String,
    org_slug: String,
    server_id: String,
    site_id: String,
    domain_id: String,
) -> Result<(), String> {
    let client = build_client(&token)?;
    api_delete(
        &client,
        &format!(
            "{}/orgs/{}/servers/{}/sites/{}/domains/{}",
            FORGE_API_URL, org_slug, server_id, site_id, domain_id
        ),
    )
    .await
}

#[tauri::command]
pub async fn forge_get_domain_nginx(
    token: String,
    org_slug: String,
    server_id: String,
    site_id: String,
    domain_id: String,
) -> Result<String, String> {
    let client = build_client(&token)?;
    api_get_text(
        &client,
        &format!(
            "{}/orgs/{}/servers/{}/sites/{}/domains/{}/nginx",
            FORGE_API_URL, org_slug, server_id, site_id, domain_id
        ),
    )
    .await
}

#[tauri::command]
pub async fn forge_update_domain_nginx(
    token: String,
    org_slug: String,
    server_id: String,
    site_id: String,
    domain_id: String,
    content: String,
) -> Result<(), String> {
    let client = build_client(&token)?;
    api_put_text(
        &client,
        &format!(
            "{}/orgs/{}/servers/{}/sites/{}/domains/{}/nginx",
            FORGE_API_URL, org_slug, server_id, site_id, domain_id
        ),
        &content,
    )
    .await
}

// --- Domain Certificates ---

#[tauri::command]
pub async fn forge_get_domain_certificate(
    token: String,
    org_slug: String,
    server_id: String,
    site_id: String,
    domain_id: String,
) -> Result<Option<ForgeCertificate>, String> {
    let client = build_client(&token)?;
    let url = format!(
        "{}/orgs/{}/servers/{}/sites/{}/domains/{}/certificate",
        FORGE_API_URL, org_slug, server_id, site_id, domain_id
    );
    let resp = client.get(&url).send().await.map_err(|e| e.to_string())?;
    if resp.status() == reqwest::StatusCode::NOT_FOUND {
        return Ok(None);
    }
    if !resp.status().is_success() {
        let status = resp.status();
        let body = resp.text().await.unwrap_or_default();
        return Err(format!("Forge API error {}: {}", status, body));
    }
    let data: JsonApiOne<CertificateAttrs> = resp.json().await.map_err(|e| e.to_string())?;
    Ok(Some(ForgeCertificate {
        id: data.data.id,
        cert_type: data.data.attributes.cert_type,
        status: data.data.attributes.status,
        request_status: data.data.attributes.request_status,
        created_at: data.data.attributes.created_at,
    }))
}

#[tauri::command]
pub async fn forge_create_letsencrypt_cert(
    token: String,
    org_slug: String,
    server_id: String,
    site_id: String,
    domain_id: String,
) -> Result<(), String> {
    let client = build_client(&token)?;
    api_post(
        &client,
        &format!(
            "{}/orgs/{}/servers/{}/sites/{}/domains/{}/certificate",
            FORGE_API_URL, org_slug, server_id, site_id, domain_id
        ),
        Some(serde_json::json!({ "type": "letsencrypt" })),
    )
    .await
}

// --- Integrations ---

#[tauri::command]
pub async fn forge_get_integration(
    token: String,
    org_slug: String,
    server_id: String,
    site_id: String,
    integration: String,
) -> Result<serde_json::Value, String> {
    let client = build_client(&token)?;
    api_get(
        &client,
        &format!(
            "{}/orgs/{}/servers/{}/sites/{}/integrations/{}",
            FORGE_API_URL, org_slug, server_id, site_id, integration
        ),
    )
    .await
}

#[tauri::command]
pub async fn forge_enable_integration(
    token: String,
    org_slug: String,
    server_id: String,
    site_id: String,
    integration: String,
) -> Result<(), String> {
    let client = build_client(&token)?;
    api_post(
        &client,
        &format!(
            "{}/orgs/{}/servers/{}/sites/{}/integrations/{}",
            FORGE_API_URL, org_slug, server_id, site_id, integration
        ),
        None,
    )
    .await
}

#[tauri::command]
pub async fn forge_disable_integration(
    token: String,
    org_slug: String,
    server_id: String,
    site_id: String,
    integration: String,
) -> Result<(), String> {
    let client = build_client(&token)?;
    api_delete(
        &client,
        &format!(
            "{}/orgs/{}/servers/{}/sites/{}/integrations/{}",
            FORGE_API_URL, org_slug, server_id, site_id, integration
        ),
    )
    .await
}

// --- Redirect Rules ---

#[tauri::command]
pub async fn forge_list_redirect_rules(
    token: String,
    org_slug: String,
    server_id: String,
    site_id: String,
) -> Result<Vec<ForgeRedirectRule>, String> {
    let client = build_client(&token)?;
    let resp: JsonApiMany<RedirectRuleAttrs> = api_get(
        &client,
        &format!(
            "{}/orgs/{}/servers/{}/sites/{}/redirect-rules",
            FORGE_API_URL, org_slug, server_id, site_id
        ),
    )
    .await?;
    Ok(resp
        .data
        .into_iter()
        .map(|r| ForgeRedirectRule {
            id: r.id,
            from: r.attributes.from,
            to: r.attributes.to,
            redirect_type: r.attributes.redirect_type,
            created_at: r.attributes.created_at,
        })
        .collect())
}

#[tauri::command]
pub async fn forge_create_redirect_rule(
    token: String,
    org_slug: String,
    server_id: String,
    site_id: String,
    from: String,
    to: String,
    redirect_type: String,
) -> Result<(), String> {
    let client = build_client(&token)?;
    api_post(
        &client,
        &format!(
            "{}/orgs/{}/servers/{}/sites/{}/redirect-rules",
            FORGE_API_URL, org_slug, server_id, site_id
        ),
        Some(serde_json::json!({ "from": from, "to": to, "type": redirect_type })),
    )
    .await
}

#[tauri::command]
pub async fn forge_delete_redirect_rule(
    token: String,
    org_slug: String,
    server_id: String,
    site_id: String,
    rule_id: String,
) -> Result<(), String> {
    let client = build_client(&token)?;
    api_delete(
        &client,
        &format!(
            "{}/orgs/{}/servers/{}/sites/{}/redirect-rules/{}",
            FORGE_API_URL, org_slug, server_id, site_id, rule_id
        ),
    )
    .await
}

// --- Security Rules ---

#[tauri::command]
pub async fn forge_list_security_rules(
    token: String,
    org_slug: String,
    server_id: String,
    site_id: String,
) -> Result<Vec<ForgeSecurityRule>, String> {
    let client = build_client(&token)?;
    let resp: JsonApiMany<SecurityRuleAttrs> = api_get(
        &client,
        &format!(
            "{}/orgs/{}/servers/{}/sites/{}/security-rules",
            FORGE_API_URL, org_slug, server_id, site_id
        ),
    )
    .await?;
    Ok(resp
        .data
        .into_iter()
        .map(|r| ForgeSecurityRule {
            id: r.id,
            name: r.attributes.name,
            path: r.attributes.path,
            created_at: r.attributes.created_at,
        })
        .collect())
}

#[tauri::command]
pub async fn forge_create_security_rule(
    token: String,
    org_slug: String,
    server_id: String,
    site_id: String,
    name: String,
    path: String,
    credentials: Vec<SecurityCredential>,
) -> Result<(), String> {
    let client = build_client(&token)?;
    api_post(
        &client,
        &format!(
            "{}/orgs/{}/servers/{}/sites/{}/security-rules",
            FORGE_API_URL, org_slug, server_id, site_id
        ),
        Some(serde_json::json!({ "name": name, "path": path, "credentials": credentials })),
    )
    .await
}

#[tauri::command]
pub async fn forge_delete_security_rule(
    token: String,
    org_slug: String,
    server_id: String,
    site_id: String,
    rule_id: String,
) -> Result<(), String> {
    let client = build_client(&token)?;
    api_delete(
        &client,
        &format!(
            "{}/orgs/{}/servers/{}/sites/{}/security-rules/{}",
            FORGE_API_URL, org_slug, server_id, site_id, rule_id
        ),
    )
    .await
}

// --- Scheduled Jobs ---

#[tauri::command]
pub async fn forge_list_scheduled_jobs(
    token: String,
    org_slug: String,
    server_id: String,
    site_id: String,
) -> Result<Vec<ForgeScheduledJob>, String> {
    let client = build_client(&token)?;
    let resp: JsonApiMany<ScheduledJobAttrs> = api_get(
        &client,
        &format!(
            "{}/orgs/{}/servers/{}/sites/{}/scheduled-jobs",
            FORGE_API_URL, org_slug, server_id, site_id
        ),
    )
    .await?;
    Ok(resp
        .data
        .into_iter()
        .map(|r| ForgeScheduledJob {
            id: r.id,
            command: r.attributes.command,
            frequency: r.attributes.frequency,
            user: r.attributes.user,
            created_at: r.attributes.created_at,
        })
        .collect())
}

#[tauri::command]
pub async fn forge_create_scheduled_job(
    token: String,
    org_slug: String,
    server_id: String,
    site_id: String,
    command: String,
    frequency: String,
    user: String,
) -> Result<(), String> {
    let client = build_client(&token)?;
    api_post(
        &client,
        &format!(
            "{}/orgs/{}/servers/{}/sites/{}/scheduled-jobs",
            FORGE_API_URL, org_slug, server_id, site_id
        ),
        Some(serde_json::json!({ "command": command, "frequency": frequency, "user": user })),
    )
    .await
}

#[tauri::command]
pub async fn forge_delete_scheduled_job(
    token: String,
    org_slug: String,
    server_id: String,
    site_id: String,
    job_id: String,
) -> Result<(), String> {
    let client = build_client(&token)?;
    api_delete(
        &client,
        &format!(
            "{}/orgs/{}/servers/{}/sites/{}/scheduled-jobs/{}",
            FORGE_API_URL, org_slug, server_id, site_id, job_id
        ),
    )
    .await
}

#[tauri::command]
pub async fn forge_get_scheduled_job_output(
    token: String,
    org_slug: String,
    server_id: String,
    site_id: String,
    job_id: String,
) -> Result<String, String> {
    let client = build_client(&token)?;
    let resp: JsonApiOne<ScheduledJobOutputAttrs> = api_get(
        &client,
        &format!(
            "{}/orgs/{}/servers/{}/sites/{}/scheduled-jobs/{}",
            FORGE_API_URL, org_slug, server_id, site_id, job_id
        ),
    )
    .await?;
    Ok(resp.data.attributes.output.unwrap_or_default())
}

// --- Webhooks ---

#[tauri::command]
pub async fn forge_list_webhooks(
    token: String,
    org_slug: String,
    server_id: String,
    site_id: String,
) -> Result<Vec<ForgeWebhook>, String> {
    let client = build_client(&token)?;
    let resp: JsonApiMany<WebhookAttrs> = api_get(
        &client,
        &format!(
            "{}/orgs/{}/servers/{}/sites/{}/webhooks",
            FORGE_API_URL, org_slug, server_id, site_id
        ),
    )
    .await?;
    Ok(resp
        .data
        .into_iter()
        .map(|r| ForgeWebhook {
            id: r.id,
            url: r.attributes.url,
            created_at: r.attributes.created_at,
        })
        .collect())
}

#[tauri::command]
pub async fn forge_create_webhook(
    token: String,
    org_slug: String,
    server_id: String,
    site_id: String,
    url: String,
) -> Result<(), String> {
    let client = build_client(&token)?;
    api_post(
        &client,
        &format!(
            "{}/orgs/{}/servers/{}/sites/{}/webhooks",
            FORGE_API_URL, org_slug, server_id, site_id
        ),
        Some(serde_json::json!({ "url": url })),
    )
    .await
}

#[tauri::command]
pub async fn forge_delete_webhook(
    token: String,
    org_slug: String,
    server_id: String,
    site_id: String,
    webhook_id: String,
) -> Result<(), String> {
    let client = build_client(&token)?;
    api_delete(
        &client,
        &format!(
            "{}/orgs/{}/servers/{}/sites/{}/webhooks/{}",
            FORGE_API_URL, org_slug, server_id, site_id, webhook_id
        ),
    )
    .await
}

// --- Heartbeats ---

#[tauri::command]
pub async fn forge_list_heartbeats(
    token: String,
    org_slug: String,
    server_id: String,
    site_id: String,
) -> Result<Vec<ForgeHeartbeat>, String> {
    let client = build_client(&token)?;
    let resp: JsonApiMany<HeartbeatAttrs> = api_get(
        &client,
        &format!(
            "{}/orgs/{}/servers/{}/sites/{}/heartbeats",
            FORGE_API_URL, org_slug, server_id, site_id
        ),
    )
    .await?;
    Ok(resp
        .data
        .into_iter()
        .map(|r| ForgeHeartbeat {
            id: r.id,
            url: r.attributes.url,
            created_at: r.attributes.created_at,
        })
        .collect())
}

#[tauri::command]
pub async fn forge_create_heartbeat(
    token: String,
    org_slug: String,
    server_id: String,
    site_id: String,
    url: String,
) -> Result<(), String> {
    let client = build_client(&token)?;
    api_post(
        &client,
        &format!(
            "{}/orgs/{}/servers/{}/sites/{}/heartbeats",
            FORGE_API_URL, org_slug, server_id, site_id
        ),
        Some(serde_json::json!({ "url": url })),
    )
    .await
}

#[tauri::command]
pub async fn forge_delete_heartbeat(
    token: String,
    org_slug: String,
    server_id: String,
    site_id: String,
    heartbeat_id: String,
) -> Result<(), String> {
    let client = build_client(&token)?;
    api_delete(
        &client,
        &format!(
            "{}/orgs/{}/servers/{}/sites/{}/heartbeats/{}",
            FORGE_API_URL, org_slug, server_id, site_id, heartbeat_id
        ),
    )
    .await
}

// --- Healthcheck ---

#[tauri::command]
pub async fn forge_get_healthcheck(
    token: String,
    org_slug: String,
    server_id: String,
    site_id: String,
) -> Result<String, String> {
    let client = build_client(&token)?;
    let resp: JsonApiOne<HealthcheckAttrs> = api_get(
        &client,
        &format!(
            "{}/orgs/{}/servers/{}/sites/{}/healthcheck",
            FORGE_API_URL, org_slug, server_id, site_id
        ),
    )
    .await?;
    Ok(resp.data.attributes.url.unwrap_or_default())
}

#[tauri::command]
pub async fn forge_update_healthcheck(
    token: String,
    org_slug: String,
    server_id: String,
    site_id: String,
    url: String,
) -> Result<(), String> {
    let client = build_client(&token)?;
    api_put(
        &client,
        &format!(
            "{}/orgs/{}/servers/{}/sites/{}/healthcheck",
            FORGE_API_URL, org_slug, server_id, site_id
        ),
        Some(serde_json::json!({ "url": url })),
    )
    .await
}

// --- Nginx Config (site-level) ---

#[tauri::command]
pub async fn forge_get_nginx_config(
    token: String,
    org_slug: String,
    server_id: String,
    site_id: String,
) -> Result<String, String> {
    let client = build_client(&token)?;
    api_get_text(
        &client,
        &format!(
            "{}/orgs/{}/servers/{}/sites/{}/nginx",
            FORGE_API_URL, org_slug, server_id, site_id
        ),
    )
    .await
}

#[tauri::command]
pub async fn forge_update_nginx_config(
    token: String,
    org_slug: String,
    server_id: String,
    site_id: String,
    content: String,
) -> Result<(), String> {
    let client = build_client(&token)?;
    api_put_text(
        &client,
        &format!(
            "{}/orgs/{}/servers/{}/sites/{}/nginx",
            FORGE_API_URL, org_slug, server_id, site_id
        ),
        &content,
    )
    .await
}

// --- Database Management ---

#[tauri::command]
pub async fn forge_list_databases(
    token: String,
    org_slug: String,
    server_id: String,
) -> Result<Vec<ForgeDatabaseSchema>, String> {
    let client = build_client(&token)?;
    let resp: JsonApiMany<DatabaseSchemaAttrs> = api_get(
        &client,
        &format!(
            "{}/orgs/{}/servers/{}/database/schemas",
            FORGE_API_URL, org_slug, server_id
        ),
    )
    .await?;
    Ok(resp
        .data
        .into_iter()
        .map(|r| ForgeDatabaseSchema {
            id: r.id,
            name: r.attributes.name,
            status: r.attributes.status,
            created_at: r.attributes.created_at,
        })
        .collect())
}

#[tauri::command]
pub async fn forge_create_database(
    token: String,
    org_slug: String,
    server_id: String,
    name: String,
) -> Result<(), String> {
    let client = build_client(&token)?;
    api_post(
        &client,
        &format!(
            "{}/orgs/{}/servers/{}/database/schemas",
            FORGE_API_URL, org_slug, server_id
        ),
        Some(serde_json::json!({ "name": name })),
    )
    .await
}

#[tauri::command]
pub async fn forge_delete_database(
    token: String,
    org_slug: String,
    server_id: String,
    database_id: String,
) -> Result<(), String> {
    let client = build_client(&token)?;
    api_delete(
        &client,
        &format!(
            "{}/orgs/{}/servers/{}/database/schemas/{}",
            FORGE_API_URL, org_slug, server_id, database_id
        ),
    )
    .await
}

#[tauri::command]
pub async fn forge_list_database_users(
    token: String,
    org_slug: String,
    server_id: String,
) -> Result<Vec<ForgeDatabaseUser>, String> {
    let client = build_client(&token)?;
    let resp: JsonApiMany<DatabaseUserAttrs> = api_get(
        &client,
        &format!(
            "{}/orgs/{}/servers/{}/database/users",
            FORGE_API_URL, org_slug, server_id
        ),
    )
    .await?;
    Ok(resp
        .data
        .into_iter()
        .map(|r| ForgeDatabaseUser {
            id: r.id,
            name: r.attributes.name,
            status: r.attributes.status,
            created_at: r.attributes.created_at,
        })
        .collect())
}

#[tauri::command]
pub async fn forge_create_database_user(
    token: String,
    org_slug: String,
    server_id: String,
    name: String,
    password: String,
    databases: Vec<String>,
) -> Result<(), String> {
    let client = build_client(&token)?;
    api_post(
        &client,
        &format!(
            "{}/orgs/{}/servers/{}/database/users",
            FORGE_API_URL, org_slug, server_id
        ),
        Some(serde_json::json!({ "name": name, "password": password, "databases": databases })),
    )
    .await
}

#[tauri::command]
pub async fn forge_delete_database_user(
    token: String,
    org_slug: String,
    server_id: String,
    user_id: String,
) -> Result<(), String> {
    let client = build_client(&token)?;
    api_delete(
        &client,
        &format!(
            "{}/orgs/{}/servers/{}/database/users/{}",
            FORGE_API_URL, org_slug, server_id, user_id
        ),
    )
    .await
}

#[tauri::command]
pub async fn forge_update_database_user(
    token: String,
    org_slug: String,
    server_id: String,
    user_id: String,
    databases: Vec<String>,
) -> Result<(), String> {
    let client = build_client(&token)?;
    api_put(
        &client,
        &format!(
            "{}/orgs/{}/servers/{}/database/users/{}",
            FORGE_API_URL, org_slug, server_id, user_id
        ),
        Some(serde_json::json!({ "databases": databases })),
    )
    .await
}

#[tauri::command]
pub async fn forge_update_database_password(
    token: String,
    org_slug: String,
    server_id: String,
    password: String,
) -> Result<(), String> {
    let client = build_client(&token)?;
    api_put(
        &client,
        &format!(
            "{}/orgs/{}/servers/{}/database/password",
            FORGE_API_URL, org_slug, server_id
        ),
        Some(serde_json::json!({ "password": password })),
    )
    .await
}

#[tauri::command]
pub async fn forge_sync_databases(
    token: String,
    org_slug: String,
    server_id: String,
) -> Result<(), String> {
    let client = build_client(&token)?;
    api_post(
        &client,
        &format!(
            "{}/orgs/{}/servers/{}/database/schemas/synchronizations",
            FORGE_API_URL, org_slug, server_id
        ),
        None,
    )
    .await
}

#[tauri::command]
pub async fn forge_list_backup_configs(
    token: String,
    org_slug: String,
    server_id: String,
) -> Result<Vec<ForgeBackupConfig>, String> {
    let client = build_client(&token)?;
    let resp: JsonApiMany<BackupConfigAttrs> = api_get(
        &client,
        &format!(
            "{}/orgs/{}/servers/{}/database/backups",
            FORGE_API_URL, org_slug, server_id
        ),
    )
    .await?;
    Ok(resp
        .data
        .into_iter()
        .map(|r| ForgeBackupConfig {
            id: r.id,
            provider: r.attributes.provider,
            frequency: r.attributes.frequency,
            retention: r.attributes.retention,
            status: r.attributes.status,
            created_at: r.attributes.created_at,
        })
        .collect())
}

#[tauri::command]
pub async fn forge_create_backup_config(
    token: String,
    org_slug: String,
    server_id: String,
    provider: String,
    databases: serde_json::Value,
    frequency: String,
    retention: i64,
) -> Result<(), String> {
    let client = build_client(&token)?;
    api_post(
        &client,
        &format!(
            "{}/orgs/{}/servers/{}/database/backups",
            FORGE_API_URL, org_slug, server_id
        ),
        Some(serde_json::json!({
            "provider": provider,
            "databases": databases,
            "frequency": frequency,
            "retention": retention
        })),
    )
    .await
}

#[tauri::command]
pub async fn forge_delete_backup_config(
    token: String,
    org_slug: String,
    server_id: String,
    config_id: String,
) -> Result<(), String> {
    let client = build_client(&token)?;
    api_delete(
        &client,
        &format!(
            "{}/orgs/{}/servers/{}/database/backups/{}",
            FORGE_API_URL, org_slug, server_id, config_id
        ),
    )
    .await
}

#[tauri::command]
pub async fn forge_list_backups(
    token: String,
    org_slug: String,
    server_id: String,
    config_id: String,
) -> Result<Vec<ForgeBackupInstance>, String> {
    let client = build_client(&token)?;
    let resp: JsonApiMany<BackupInstanceAttrs> = api_get(
        &client,
        &format!(
            "{}/orgs/{}/servers/{}/database/backups/{}/instances",
            FORGE_API_URL, org_slug, server_id, config_id
        ),
    )
    .await?;
    Ok(resp
        .data
        .into_iter()
        .map(|r| ForgeBackupInstance {
            id: r.id,
            status: r.attributes.status,
            size: r.attributes.size,
            created_at: r.attributes.created_at,
        })
        .collect())
}

#[tauri::command]
pub async fn forge_create_backup(
    token: String,
    org_slug: String,
    server_id: String,
    config_id: String,
) -> Result<(), String> {
    let client = build_client(&token)?;
    api_post(
        &client,
        &format!(
            "{}/orgs/{}/servers/{}/database/backups/{}/instances",
            FORGE_API_URL, org_slug, server_id, config_id
        ),
        None,
    )
    .await
}

#[tauri::command]
pub async fn forge_delete_backup(
    token: String,
    org_slug: String,
    server_id: String,
    config_id: String,
    backup_id: String,
) -> Result<(), String> {
    let client = build_client(&token)?;
    api_delete(
        &client,
        &format!(
            "{}/orgs/{}/servers/{}/database/backups/{}/instances/{}",
            FORGE_API_URL, org_slug, server_id, config_id, backup_id
        ),
    )
    .await
}

#[tauri::command]
pub async fn forge_restore_backup(
    token: String,
    org_slug: String,
    server_id: String,
    config_id: String,
    backup_id: String,
) -> Result<(), String> {
    let client = build_client(&token)?;
    api_post(
        &client,
        &format!(
            "{}/orgs/{}/servers/{}/database/backups/{}/instances/{}/restores",
            FORGE_API_URL, org_slug, server_id, config_id, backup_id
        ),
        None,
    )
    .await
}

// --- SSH Keys ---

#[tauri::command]
pub async fn forge_list_ssh_keys(
    token: String,
    org_slug: String,
    server_id: String,
) -> Result<Vec<ForgeSSHKey>, String> {
    let client = build_client(&token)?;
    let resp: JsonApiMany<SSHKeyAttrs> = api_get(
        &client,
        &format!(
            "{}/orgs/{}/servers/{}/ssh-keys",
            FORGE_API_URL, org_slug, server_id
        ),
    )
    .await?;
    Ok(resp
        .data
        .into_iter()
        .map(|r| ForgeSSHKey {
            id: r.id,
            name: r.attributes.name,
            status: r.attributes.status,
            created_at: r.attributes.created_at,
        })
        .collect())
}

#[tauri::command]
pub async fn forge_create_ssh_key(
    token: String,
    org_slug: String,
    server_id: String,
    name: String,
    key: String,
) -> Result<(), String> {
    let client = build_client(&token)?;
    api_post(
        &client,
        &format!(
            "{}/orgs/{}/servers/{}/ssh-keys",
            FORGE_API_URL, org_slug, server_id
        ),
        Some(serde_json::json!({ "name": name, "key": key })),
    )
    .await
}

#[tauri::command]
pub async fn forge_delete_ssh_key(
    token: String,
    org_slug: String,
    server_id: String,
    key_id: String,
) -> Result<(), String> {
    let client = build_client(&token)?;
    api_delete(
        &client,
        &format!(
            "{}/orgs/{}/servers/{}/ssh-keys/{}",
            FORGE_API_URL, org_slug, server_id, key_id
        ),
    )
    .await
}

// --- Firewall Rules ---

#[tauri::command]
pub async fn forge_list_firewall_rules(
    token: String,
    org_slug: String,
    server_id: String,
) -> Result<Vec<ForgeFirewallRule>, String> {
    let client = build_client(&token)?;
    let resp: JsonApiMany<FirewallRuleAttrs> = api_get(
        &client,
        &format!(
            "{}/orgs/{}/servers/{}/firewall-rules",
            FORGE_API_URL, org_slug, server_id
        ),
    )
    .await?;
    Ok(resp
        .data
        .into_iter()
        .map(|r| ForgeFirewallRule {
            id: r.id,
            name: r.attributes.name,
            port: r.attributes.port,
            ip_address: r.attributes.ip_address,
            rule_type: r.attributes.rule_type,
            status: r.attributes.status,
            created_at: r.attributes.created_at,
        })
        .collect())
}

#[tauri::command]
pub async fn forge_create_firewall_rule(
    token: String,
    org_slug: String,
    server_id: String,
    name: String,
    port: String,
    ip_address: String,
    rule_type: String,
) -> Result<(), String> {
    let client = build_client(&token)?;
    api_post(
        &client,
        &format!(
            "{}/orgs/{}/servers/{}/firewall-rules",
            FORGE_API_URL, org_slug, server_id
        ),
        Some(serde_json::json!({ "name": name, "port": port, "ip_address": ip_address, "type": rule_type })),
    )
    .await
}

#[tauri::command]
pub async fn forge_delete_firewall_rule(
    token: String,
    org_slug: String,
    server_id: String,
    rule_id: String,
) -> Result<(), String> {
    let client = build_client(&token)?;
    api_delete(
        &client,
        &format!(
            "{}/orgs/{}/servers/{}/firewall-rules/{}",
            FORGE_API_URL, org_slug, server_id, rule_id
        ),
    )
    .await
}

// --- Background Processes / Daemons ---

#[tauri::command]
pub async fn forge_list_daemons(
    token: String,
    org_slug: String,
    server_id: String,
) -> Result<Vec<ForgeDaemon>, String> {
    let client = build_client(&token)?;
    let resp: JsonApiMany<DaemonAttrs> = api_get(
        &client,
        &format!(
            "{}/orgs/{}/servers/{}/background-processes",
            FORGE_API_URL, org_slug, server_id
        ),
    )
    .await?;
    Ok(resp
        .data
        .into_iter()
        .map(|r| ForgeDaemon {
            id: r.id,
            command: r.attributes.command,
            user: r.attributes.user,
            directory: r.attributes.directory,
            processes: r.attributes.processes,
            status: r.attributes.status,
            created_at: r.attributes.created_at,
        })
        .collect())
}

#[tauri::command]
pub async fn forge_create_daemon(
    token: String,
    org_slug: String,
    server_id: String,
    command: String,
    user: String,
    directory: String,
    processes: i64,
) -> Result<(), String> {
    let client = build_client(&token)?;
    api_post(
        &client,
        &format!(
            "{}/orgs/{}/servers/{}/background-processes",
            FORGE_API_URL, org_slug, server_id
        ),
        Some(serde_json::json!({ "command": command, "user": user, "directory": directory, "processes": processes })),
    )
    .await
}

#[tauri::command]
pub async fn forge_delete_daemon(
    token: String,
    org_slug: String,
    server_id: String,
    daemon_id: String,
) -> Result<(), String> {
    let client = build_client(&token)?;
    api_delete(
        &client,
        &format!(
            "{}/orgs/{}/servers/{}/background-processes/{}",
            FORGE_API_URL, org_slug, server_id, daemon_id
        ),
    )
    .await
}

#[tauri::command]
pub async fn forge_restart_daemon(
    token: String,
    org_slug: String,
    server_id: String,
    daemon_id: String,
) -> Result<(), String> {
    let client = build_client(&token)?;
    api_post(
        &client,
        &format!(
            "{}/orgs/{}/servers/{}/background-processes/{}/actions",
            FORGE_API_URL, org_slug, server_id, daemon_id
        ),
        Some(serde_json::json!({ "action": "restart" })),
    )
    .await
}

#[tauri::command]
pub async fn forge_get_daemon_log(
    token: String,
    org_slug: String,
    server_id: String,
    daemon_id: String,
) -> Result<String, String> {
    let client = build_client(&token)?;
    api_get_text(
        &client,
        &format!(
            "{}/orgs/{}/servers/{}/background-processes/{}/log",
            FORGE_API_URL, org_slug, server_id, daemon_id
        ),
    )
    .await
}

// --- PHP Versions ---

#[tauri::command]
pub async fn forge_list_php_versions(
    token: String,
    org_slug: String,
    server_id: String,
) -> Result<Vec<ForgePHPVersion>, String> {
    let client = build_client(&token)?;
    let resp: JsonApiMany<PHPVersionAttrs> = api_get(
        &client,
        &format!(
            "{}/orgs/{}/servers/{}/php/versions",
            FORGE_API_URL, org_slug, server_id
        ),
    )
    .await?;
    Ok(resp
        .data
        .into_iter()
        .map(|r| ForgePHPVersion {
            id: r.id,
            version: r.attributes.version,
            binary_name: r.attributes.binary_name,
            status: r.attributes.status,
            created_at: r.attributes.created_at,
        })
        .collect())
}

#[tauri::command]
pub async fn forge_install_php_version(
    token: String,
    org_slug: String,
    server_id: String,
    version: String,
) -> Result<(), String> {
    let client = build_client(&token)?;
    api_post(
        &client,
        &format!(
            "{}/orgs/{}/servers/{}/php/versions",
            FORGE_API_URL, org_slug, server_id
        ),
        Some(serde_json::json!({ "version": version })),
    )
    .await
}

#[tauri::command]
pub async fn forge_delete_php_version(
    token: String,
    org_slug: String,
    server_id: String,
    version_id: String,
) -> Result<(), String> {
    let client = build_client(&token)?;
    api_delete(
        &client,
        &format!(
            "{}/orgs/{}/servers/{}/php/versions/{}",
            FORGE_API_URL, org_slug, server_id, version_id
        ),
    )
    .await
}

// --- Site Create/Delete ---

#[tauri::command]
pub async fn forge_create_site(
    token: String,
    org_slug: String,
    server_id: String,
    domain: String,
    project_type: String,
    php_version: String,
) -> Result<(), String> {
    let client = build_client(&token)?;
    api_post(
        &client,
        &format!(
            "{}/orgs/{}/servers/{}/sites",
            FORGE_API_URL, org_slug, server_id
        ),
        Some(serde_json::json!({ "domain": domain, "project_type": project_type, "php_version": php_version })),
    )
    .await
}

#[tauri::command]
pub async fn forge_delete_site(
    token: String,
    org_slug: String,
    server_id: String,
    site_id: String,
) -> Result<(), String> {
    let client = build_client(&token)?;
    api_delete(
        &client,
        &format!(
            "{}/orgs/{}/servers/{}/sites/{}",
            FORGE_API_URL, org_slug, server_id, site_id
        ),
    )
    .await
}

// --- Recipes ---

#[tauri::command]
pub async fn forge_list_recipes(
    token: String,
    org_slug: String,
) -> Result<Vec<ForgeRecipe>, String> {
    let client = build_client(&token)?;
    let resp: JsonApiMany<RecipeAttrs> = api_get(
        &client,
        &format!("{}/orgs/{}/recipes", FORGE_API_URL, org_slug),
    )
    .await?;
    Ok(resp
        .data
        .into_iter()
        .map(|r| ForgeRecipe {
            id: r.id,
            name: r.attributes.name,
            script: r.attributes.script,
            user: r.attributes.user,
            created_at: r.attributes.created_at,
        })
        .collect())
}

#[tauri::command]
pub async fn forge_create_recipe(
    token: String,
    org_slug: String,
    name: String,
    script: String,
    user: String,
) -> Result<(), String> {
    let client = build_client(&token)?;
    api_post(
        &client,
        &format!("{}/orgs/{}/recipes", FORGE_API_URL, org_slug),
        Some(serde_json::json!({ "name": name, "script": script, "user": user })),
    )
    .await
}

#[tauri::command]
pub async fn forge_update_recipe(
    token: String,
    org_slug: String,
    recipe_id: String,
    name: String,
    script: String,
    user: String,
) -> Result<(), String> {
    let client = build_client(&token)?;
    api_put(
        &client,
        &format!(
            "{}/orgs/{}/recipes/{}",
            FORGE_API_URL, org_slug, recipe_id
        ),
        Some(serde_json::json!({ "name": name, "script": script, "user": user })),
    )
    .await
}

#[tauri::command]
pub async fn forge_delete_recipe(
    token: String,
    org_slug: String,
    recipe_id: String,
) -> Result<(), String> {
    let client = build_client(&token)?;
    api_delete(
        &client,
        &format!(
            "{}/orgs/{}/recipes/{}",
            FORGE_API_URL, org_slug, recipe_id
        ),
    )
    .await
}

#[tauri::command]
pub async fn forge_run_recipe(
    token: String,
    org_slug: String,
    recipe_id: String,
    servers: Vec<String>,
) -> Result<(), String> {
    let client = build_client(&token)?;
    api_post(
        &client,
        &format!(
            "{}/orgs/{}/recipes/{}/runs",
            FORGE_API_URL, org_slug, recipe_id
        ),
        Some(serde_json::json!({ "servers": servers })),
    )
    .await
}
