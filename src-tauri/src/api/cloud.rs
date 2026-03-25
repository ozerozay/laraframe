use reqwest::Client;
use serde::{Deserialize, Serialize};
use serde_json::Value;

const CLOUD_API_URL: &str = "https://cloud.laravel.com/api";

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
    _resource_type: String,
    attributes: A,
}

// =====================================================
// Attribute Types (what lives inside "attributes")
// =====================================================

#[derive(Debug, Deserialize)]
struct OrganizationAttrs {
    name: String,
}

#[derive(Debug, Deserialize)]
struct ApplicationAttrs {
    name: String,
    #[serde(default)]
    slug: Option<String>,
    #[serde(default)]
    region: Option<String>,
    #[serde(default)]
    avatar_url: Option<String>,
    #[serde(default)]
    created_at: Option<String>,
}

#[derive(Debug, Deserialize, Clone)]
struct EnvVariable {
    #[serde(default)]
    key: String,
    #[serde(default)]
    value: String,
}

#[derive(Debug, Deserialize)]
struct EnvironmentAttrs {
    name: String,
    #[serde(default)]
    slug: Option<String>,
    #[serde(default)]
    status: Option<String>,
    #[serde(default)]
    vanity_domain: Option<String>,
    #[serde(default)]
    php_major_version: Option<String>,
    #[serde(default)]
    uses_octane: bool,
    #[serde(default)]
    uses_hibernation: bool,
    #[serde(default)]
    uses_push_to_deploy: bool,
    #[serde(default)]
    environment_variables: Vec<EnvVariable>,
    #[serde(default)]
    created_at: Option<String>,
}

#[derive(Debug, Deserialize)]
struct DeploymentAttrs {
    #[serde(default)]
    status: Option<String>,
    #[serde(default)]
    branch_name: Option<String>,
    #[serde(default)]
    commit_hash: Option<String>,
    #[serde(default)]
    commit_message: Option<String>,
    #[serde(default)]
    commit_author: Option<String>,
    #[serde(default)]
    failure_reason: Option<String>,
    #[serde(default)]
    started_at: Option<String>,
    #[serde(default)]
    finished_at: Option<String>,
}

#[derive(Debug, Deserialize)]
struct InstanceAttrs {
    name: String,
    #[serde(rename = "type", default)]
    instance_type: Option<String>,
    #[serde(default)]
    size: Option<String>,
    #[serde(default)]
    scaling_type: Option<String>,
    #[serde(default)]
    min_replicas: Option<i64>,
    #[serde(default)]
    max_replicas: Option<i64>,
    #[serde(default)]
    uses_scheduler: bool,
    #[serde(default)]
    created_at: Option<String>,
}

#[derive(Debug, Deserialize)]
struct DomainAttrs {
    name: String,
    #[serde(rename = "type", default)]
    domain_type: Option<String>,
    #[serde(default)]
    hostname_status: Option<String>,
    #[serde(default)]
    ssl_status: Option<String>,
    #[serde(default)]
    created_at: Option<String>,
}

#[derive(Debug, Deserialize)]
struct CommandAttrs {
    #[serde(default)]
    command: Option<String>,
    #[serde(default)]
    output: Option<String>,
    #[serde(default)]
    status: Option<String>,
    #[serde(default)]
    exit_code: Option<i64>,
    #[serde(default)]
    failure_reason: Option<String>,
    #[serde(default)]
    started_at: Option<String>,
    #[serde(default)]
    finished_at: Option<String>,
    #[serde(default)]
    created_at: Option<String>,
}

#[derive(Debug, Deserialize)]
struct DatabaseAttrs {
    name: String,
    #[serde(rename = "type", default)]
    db_type: Option<String>,
    #[serde(default)]
    status: Option<String>,
    #[serde(default)]
    region: Option<String>,
    #[serde(default)]
    created_at: Option<String>,
}

#[derive(Debug, Deserialize)]
struct DatabaseClusterAttrs {
    name: String,
    #[serde(rename = "type", default)]
    cluster_type: Option<String>,
    #[serde(default)]
    status: Option<String>,
    #[serde(default)]
    region: Option<String>,
    #[serde(default)]
    created_at: Option<String>,
}

#[derive(Debug, Deserialize)]
struct CacheAttrs {
    name: String,
    #[serde(rename = "type", default)]
    cache_type: Option<String>,
    #[serde(default)]
    status: Option<String>,
    #[serde(default)]
    region: Option<String>,
    #[serde(default)]
    size: Option<String>,
    #[serde(default)]
    created_at: Option<String>,
}

#[derive(Debug, Deserialize)]
struct BucketAttrs {
    name: String,
    #[serde(rename = "type", default)]
    bucket_type: Option<String>,
    #[serde(default)]
    status: Option<String>,
    #[serde(default)]
    visibility: Option<String>,
    #[serde(default)]
    endpoint: Option<String>,
    #[serde(default)]
    url: Option<String>,
    #[serde(default)]
    created_at: Option<String>,
}

#[derive(Debug, Deserialize)]
struct BucketKeyAttrs {
    name: String,
    #[serde(default)]
    permission: Option<String>,
    #[serde(default)]
    access_key_id: Option<String>,
    #[serde(default)]
    access_key_secret: Option<String>,
    #[serde(default)]
    created_at: Option<String>,
}

#[derive(Debug, Deserialize)]
struct WebsocketServerAttrs {
    name: String,
    #[serde(rename = "type", default)]
    ws_type: Option<String>,
    #[serde(default)]
    region: Option<String>,
    #[serde(default)]
    status: Option<String>,
    #[serde(default)]
    max_connections: Option<i64>,
    #[serde(default)]
    hostname: Option<String>,
    #[serde(default)]
    created_at: Option<String>,
}

#[derive(Debug, Deserialize)]
struct BackgroundProcessAttrs {
    #[serde(rename = "type", default)]
    process_type: Option<String>,
    #[serde(default)]
    processes: Option<i64>,
    #[serde(default)]
    command: Option<String>,
    #[serde(default)]
    created_at: Option<String>,
}

#[derive(Debug, Deserialize)]
struct WebsocketApplicationAttrs {
    #[serde(default)]
    name: String,
    #[serde(default)]
    app_id: String,
    #[serde(default)]
    key: String,
    #[serde(default)]
    secret: String,
    #[serde(default)]
    created_at: String,
}

#[derive(Debug, Deserialize)]
struct DatabaseSnapshotAttrs {
    #[serde(default)]
    name: Option<String>,
    #[serde(default)]
    description: Option<String>,
    #[serde(rename = "type", default)]
    snapshot_type: Option<String>,
    #[serde(default)]
    status: Option<String>,
    #[serde(default)]
    storage_bytes: Option<i64>,
    #[serde(default)]
    created_at: Option<String>,
}

// =====================================================
// Frontend-facing types (flat, easy to consume in TS)
// =====================================================

#[derive(Debug, Serialize, Clone)]
pub struct CloudOrganization {
    pub id: String,
    pub name: String,
}

#[derive(Debug, Serialize, Clone)]
pub struct CloudApplication {
    pub id: String,
    pub name: String,
    pub slug: Option<String>,
    pub region: Option<String>,
    pub avatar_url: Option<String>,
    pub created_at: Option<String>,
}

#[derive(Debug, Serialize, Clone)]
pub struct CloudEnvVar {
    pub key: String,
    pub value: String,
}

#[derive(Debug, Serialize, Clone)]
pub struct CloudEnvironment {
    pub id: String,
    pub name: String,
    pub slug: Option<String>,
    pub status: Option<String>,
    pub vanity_domain: Option<String>,
    pub php_major_version: Option<String>,
    pub uses_octane: bool,
    pub uses_hibernation: bool,
    pub uses_push_to_deploy: bool,
    pub environment_variables: Vec<CloudEnvVar>,
    pub created_at: Option<String>,
}

#[derive(Debug, Serialize, Clone)]
pub struct CloudDeployment {
    pub id: String,
    pub status: Option<String>,
    pub branch_name: Option<String>,
    pub commit_hash: Option<String>,
    pub commit_message: Option<String>,
    pub commit_author: Option<String>,
    pub failure_reason: Option<String>,
    pub started_at: Option<String>,
    pub finished_at: Option<String>,
}

#[derive(Debug, Serialize, Clone)]
pub struct CloudInstance {
    pub id: String,
    pub name: String,
    pub instance_type: Option<String>,
    pub size: Option<String>,
    pub scaling_type: Option<String>,
    pub min_replicas: Option<i64>,
    pub max_replicas: Option<i64>,
    pub uses_scheduler: bool,
    pub created_at: Option<String>,
}

#[derive(Debug, Serialize, Clone)]
pub struct CloudDomain {
    pub id: String,
    pub name: String,
    pub domain_type: Option<String>,
    pub hostname_status: Option<String>,
    pub ssl_status: Option<String>,
    pub created_at: Option<String>,
}

#[derive(Debug, Serialize, Clone)]
pub struct CloudCommand {
    pub id: String,
    pub command: Option<String>,
    pub output: Option<String>,
    pub status: Option<String>,
    pub exit_code: Option<i64>,
    pub failure_reason: Option<String>,
    pub started_at: Option<String>,
    pub finished_at: Option<String>,
    pub created_at: Option<String>,
}

#[derive(Debug, Serialize, Clone)]
pub struct CloudDatabase {
    pub id: String,
    pub name: String,
    pub db_type: Option<String>,
    pub status: Option<String>,
    pub region: Option<String>,
    pub created_at: Option<String>,
}

#[derive(Debug, Serialize, Clone)]
pub struct CloudDatabaseCluster {
    pub id: String,
    pub name: String,
    pub cluster_type: Option<String>,
    pub status: Option<String>,
    pub region: Option<String>,
    pub created_at: Option<String>,
}

#[derive(Debug, Serialize, Clone)]
pub struct CloudCache {
    pub id: String,
    pub name: String,
    pub cache_type: Option<String>,
    pub status: Option<String>,
    pub region: Option<String>,
    pub size: Option<String>,
    pub created_at: Option<String>,
}

#[derive(Debug, Serialize, Clone)]
pub struct CloudBucket {
    pub id: String,
    pub name: String,
    pub bucket_type: Option<String>,
    pub status: Option<String>,
    pub visibility: Option<String>,
    pub endpoint: Option<String>,
    pub url: Option<String>,
    pub created_at: Option<String>,
}

#[derive(Debug, Serialize, Clone)]
pub struct CloudBucketKey {
    pub id: String,
    pub name: String,
    pub permission: Option<String>,
    pub access_key_id: Option<String>,
    pub access_key_secret: Option<String>,
    pub created_at: Option<String>,
}

#[derive(Debug, Serialize, Clone)]
pub struct CloudWebsocketServer {
    pub id: String,
    pub name: String,
    pub ws_type: Option<String>,
    pub region: Option<String>,
    pub status: Option<String>,
    pub max_connections: Option<i64>,
    pub hostname: Option<String>,
    pub created_at: Option<String>,
}

#[derive(Debug, Serialize, Clone)]
pub struct CloudBackgroundProcess {
    pub id: String,
    pub process_type: Option<String>,
    pub processes: Option<i64>,
    pub command: Option<String>,
    pub created_at: Option<String>,
}

#[derive(Debug, Serialize, Clone)]
pub struct CloudWebsocketApplication {
    pub id: String,
    pub name: String,
    pub app_id: String,
    pub key: String,
    pub secret: String,
    pub created_at: String,
}

#[derive(Debug, Serialize, Clone)]
pub struct CloudDatabaseSnapshot {
    pub id: String,
    pub name: Option<String>,
    pub description: Option<String>,
    pub snapshot_type: Option<String>,
    pub status: Option<String>,
    pub storage_bytes: Option<i64>,
    pub created_at: Option<String>,
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
        return Err(format!("Cloud API error {}: {}", status, body));
    }
    resp.json::<T>().await.map_err(|e| e.to_string())
}

async fn api_get_text(client: &Client, url: &str) -> Result<String, String> {
    let resp = client.get(url).send().await.map_err(|e| e.to_string())?;
    if !resp.status().is_success() {
        return Err(format!("Cloud API error: {}", resp.status()));
    }
    let text = resp.text().await.map_err(|e| e.to_string())?;
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

async fn api_post(client: &Client, url: &str, body: Option<Value>) -> Result<(), String> {
    let mut req = client.post(url);
    if let Some(b) = body {
        req = req.json(&b);
    }
    let resp = req.send().await.map_err(|e| e.to_string())?;
    if !resp.status().is_success() {
        let status = resp.status();
        let body = resp.text().await.unwrap_or_default();
        return Err(format!("Cloud API error {}: {}", status, body));
    }
    Ok(())
}

async fn api_put(client: &Client, url: &str, body: Option<Value>) -> Result<(), String> {
    let mut req = client.put(url);
    if let Some(b) = body {
        req = req.json(&b);
    }
    let resp = req.send().await.map_err(|e| e.to_string())?;
    if !resp.status().is_success() {
        let status = resp.status();
        let body = resp.text().await.unwrap_or_default();
        return Err(format!("Cloud API error {}: {}", status, body));
    }
    Ok(())
}

async fn api_patch(client: &Client, url: &str, body: Option<Value>) -> Result<(), String> {
    let mut req = client.patch(url);
    if let Some(b) = body {
        req = req.json(&b);
    }
    let resp = req.send().await.map_err(|e| e.to_string())?;
    if !resp.status().is_success() {
        let status = resp.status();
        let body = resp.text().await.unwrap_or_default();
        return Err(format!("Cloud API error {}: {}", status, body));
    }
    Ok(())
}

async fn api_delete(client: &Client, url: &str) -> Result<(), String> {
    let resp = client.delete(url).send().await.map_err(|e| e.to_string())?;
    if !resp.status().is_success() {
        let status = resp.status();
        let body = resp.text().await.unwrap_or_default();
        return Err(format!("Cloud API error {}: {}", status, body));
    }
    Ok(())
}

async fn api_delete_with_body(client: &Client, url: &str, body: Value) -> Result<(), String> {
    let resp = client
        .delete(url)
        .json(&body)
        .send()
        .await
        .map_err(|e| e.to_string())?;
    if !resp.status().is_success() {
        let status = resp.status();
        let body = resp.text().await.unwrap_or_default();
        return Err(format!("Cloud API error {}: {}", status, body));
    }
    Ok(())
}

// =====================================================
// Commands — Meta
// =====================================================

#[tauri::command]
pub async fn cloud_get_organization(token: String) -> Result<CloudOrganization, String> {
    let client = build_client(&token)?;
    let resp: JsonApiOne<OrganizationAttrs> =
        api_get(&client, &format!("{}/organization", CLOUD_API_URL)).await?;
    Ok(CloudOrganization {
        id: resp.data.id,
        name: resp.data.attributes.name,
    })
}

#[tauri::command]
pub async fn cloud_list_regions(token: String) -> Result<Value, String> {
    let client = build_client(&token)?;
    api_get(&client, &format!("{}/regions", CLOUD_API_URL)).await
}

// =====================================================
// Commands — Applications
// =====================================================

#[tauri::command]
pub async fn cloud_list_applications(token: String) -> Result<Vec<CloudApplication>, String> {
    let client = build_client(&token)?;
    let resp: JsonApiMany<ApplicationAttrs> =
        api_get(&client, &format!("{}/applications", CLOUD_API_URL)).await?;
    Ok(resp.data.into_iter().map(|r| CloudApplication {
        id: r.id,
        name: r.attributes.name,
        slug: r.attributes.slug,
        region: r.attributes.region,
        avatar_url: r.attributes.avatar_url,
        created_at: r.attributes.created_at,
    }).collect())
}

#[tauri::command]
pub async fn cloud_create_application(token: String, name: String, region: String) -> Result<(), String> {
    let client = build_client(&token)?;
    api_post(&client, &format!("{}/applications", CLOUD_API_URL), Some(serde_json::json!({
        "name": name,
        "region": region,
    }))).await
}

#[tauri::command]
pub async fn cloud_get_application(token: String, app_id: String) -> Result<CloudApplication, String> {
    let client = build_client(&token)?;
    let resp: JsonApiOne<ApplicationAttrs> =
        api_get(&client, &format!("{}/applications/{}", CLOUD_API_URL, app_id)).await?;
    Ok(CloudApplication {
        id: resp.data.id,
        name: resp.data.attributes.name,
        slug: resp.data.attributes.slug,
        region: resp.data.attributes.region,
        avatar_url: resp.data.attributes.avatar_url,
        created_at: resp.data.attributes.created_at,
    })
}

#[tauri::command]
pub async fn cloud_delete_application(token: String, app_id: String) -> Result<(), String> {
    let client = build_client(&token)?;
    api_delete(&client, &format!("{}/applications/{}", CLOUD_API_URL, app_id)).await
}

#[tauri::command]
pub async fn cloud_update_application(token: String, app_id: String, data: Value) -> Result<(), String> {
    let client = build_client(&token)?;
    api_patch(&client, &format!("{}/applications/{}", CLOUD_API_URL, app_id), Some(data)).await
}

// =====================================================
// Commands — Environments
// =====================================================

fn map_environment(r: JsonApiResource<EnvironmentAttrs>) -> CloudEnvironment {
    CloudEnvironment {
        id: r.id,
        name: r.attributes.name,
        slug: r.attributes.slug,
        status: r.attributes.status,
        vanity_domain: r.attributes.vanity_domain,
        php_major_version: r.attributes.php_major_version,
        uses_octane: r.attributes.uses_octane,
        uses_hibernation: r.attributes.uses_hibernation,
        uses_push_to_deploy: r.attributes.uses_push_to_deploy,
        environment_variables: r.attributes.environment_variables.into_iter().map(|v| CloudEnvVar { key: v.key, value: v.value }).collect(),
        created_at: r.attributes.created_at,
    }
}

#[tauri::command]
pub async fn cloud_list_environments(token: String, app_id: String) -> Result<Vec<CloudEnvironment>, String> {
    let client = build_client(&token)?;
    let resp: JsonApiMany<EnvironmentAttrs> =
        api_get(&client, &format!("{}/applications/{}/environments", CLOUD_API_URL, app_id)).await?;
    Ok(resp.data.into_iter().map(map_environment).collect())
}

#[tauri::command]
pub async fn cloud_create_environment(token: String, app_id: String, name: String) -> Result<(), String> {
    let client = build_client(&token)?;
    api_post(&client, &format!("{}/applications/{}/environments", CLOUD_API_URL, app_id), Some(serde_json::json!({
        "name": name,
    }))).await
}

#[tauri::command]
pub async fn cloud_get_environment(token: String, env_id: String) -> Result<CloudEnvironment, String> {
    let client = build_client(&token)?;
    let resp: JsonApiOne<EnvironmentAttrs> =
        api_get(&client, &format!("{}/environments/{}", CLOUD_API_URL, env_id)).await?;
    Ok(map_environment(resp.data))
}

#[tauri::command]
pub async fn cloud_update_environment(token: String, env_id: String, data: Value) -> Result<(), String> {
    let client = build_client(&token)?;
    api_put(&client, &format!("{}/environments/{}", CLOUD_API_URL, env_id), Some(data)).await
}

#[tauri::command]
pub async fn cloud_delete_environment(token: String, env_id: String) -> Result<(), String> {
    let client = build_client(&token)?;
    api_delete(&client, &format!("{}/environments/{}", CLOUD_API_URL, env_id)).await
}

#[tauri::command]
pub async fn cloud_start_environment(token: String, env_id: String) -> Result<(), String> {
    let client = build_client(&token)?;
    api_post(&client, &format!("{}/environments/{}/start", CLOUD_API_URL, env_id), None).await
}

#[tauri::command]
pub async fn cloud_stop_environment(token: String, env_id: String) -> Result<(), String> {
    let client = build_client(&token)?;
    api_post(&client, &format!("{}/environments/{}/stop", CLOUD_API_URL, env_id), None).await
}

#[tauri::command]
pub async fn cloud_add_env_variables(token: String, env_id: String, variables: Value) -> Result<(), String> {
    let client = build_client(&token)?;
    api_post(&client, &format!("{}/environments/{}/variables", CLOUD_API_URL, env_id), Some(variables)).await
}

#[tauri::command]
pub async fn cloud_delete_env_variables(token: String, env_id: String, variables: Vec<String>) -> Result<(), String> {
    let client = build_client(&token)?;
    api_delete_with_body(&client, &format!("{}/environments/{}/variables", CLOUD_API_URL, env_id), serde_json::json!({
        "variables": variables,
    })).await
}

#[tauri::command]
pub async fn cloud_get_environment_logs(token: String, env_id: String, from: String, to: String) -> Result<Value, String> {
    let client = build_client(&token)?;
    let resp = client
        .get(format!("{}/environments/{}/logs?from={}&to={}", CLOUD_API_URL, env_id, from, to))
        .send()
        .await
        .map_err(|e| e.to_string())?;
    if !resp.status().is_success() {
        let status = resp.status();
        let body = resp.text().await.unwrap_or_default();
        return Err(format!("Cloud API error {}: {}", status, body));
    }
    resp.json::<Value>().await.map_err(|e| e.to_string())
}

#[tauri::command]
pub async fn cloud_get_environment_metrics(token: String, env_id: String) -> Result<Value, String> {
    let client = build_client(&token)?;
    api_get(&client, &format!("{}/environments/{}/metrics", CLOUD_API_URL, env_id)).await
}

// =====================================================
// Commands — Deployments
// =====================================================

fn map_deployment(r: JsonApiResource<DeploymentAttrs>) -> CloudDeployment {
    CloudDeployment {
        id: r.id,
        status: r.attributes.status,
        branch_name: r.attributes.branch_name,
        commit_hash: r.attributes.commit_hash,
        commit_message: r.attributes.commit_message,
        commit_author: r.attributes.commit_author,
        failure_reason: r.attributes.failure_reason,
        started_at: r.attributes.started_at,
        finished_at: r.attributes.finished_at,
    }
}

#[tauri::command]
pub async fn cloud_list_deployments(token: String, env_id: String) -> Result<Vec<CloudDeployment>, String> {
    let client = build_client(&token)?;
    let resp: JsonApiMany<DeploymentAttrs> =
        api_get(&client, &format!("{}/environments/{}/deployments", CLOUD_API_URL, env_id)).await?;
    Ok(resp.data.into_iter().map(map_deployment).collect())
}

#[tauri::command]
pub async fn cloud_create_deployment(token: String, env_id: String) -> Result<(), String> {
    let client = build_client(&token)?;
    api_post(&client, &format!("{}/environments/{}/deployments", CLOUD_API_URL, env_id), None).await
}

#[tauri::command]
pub async fn cloud_get_deployment(token: String, deployment_id: String) -> Result<CloudDeployment, String> {
    let client = build_client(&token)?;
    let resp: JsonApiOne<DeploymentAttrs> =
        api_get(&client, &format!("{}/deployments/{}", CLOUD_API_URL, deployment_id)).await?;
    Ok(map_deployment(resp.data))
}

#[tauri::command]
pub async fn cloud_get_deployment_logs(token: String, deployment_id: String) -> Result<String, String> {
    let client = build_client(&token)?;
    api_get_text(&client, &format!("{}/deployments/{}/logs", CLOUD_API_URL, deployment_id)).await
}

// =====================================================
// Commands — Commands
// =====================================================

fn map_command(r: JsonApiResource<CommandAttrs>) -> CloudCommand {
    CloudCommand {
        id: r.id,
        command: r.attributes.command,
        output: r.attributes.output,
        status: r.attributes.status,
        exit_code: r.attributes.exit_code,
        failure_reason: r.attributes.failure_reason,
        started_at: r.attributes.started_at,
        finished_at: r.attributes.finished_at,
        created_at: r.attributes.created_at,
    }
}

#[tauri::command]
pub async fn cloud_list_commands(token: String, env_id: String) -> Result<Vec<CloudCommand>, String> {
    let client = build_client(&token)?;
    let resp: JsonApiMany<CommandAttrs> =
        api_get(&client, &format!("{}/environments/{}/commands", CLOUD_API_URL, env_id)).await?;
    Ok(resp.data.into_iter().map(map_command).collect())
}

#[tauri::command]
pub async fn cloud_run_command(token: String, env_id: String, command: String) -> Result<(), String> {
    let client = build_client(&token)?;
    api_post(&client, &format!("{}/environments/{}/commands", CLOUD_API_URL, env_id), Some(serde_json::json!({
        "command": command,
    }))).await
}

#[tauri::command]
pub async fn cloud_get_command(token: String, command_id: String) -> Result<CloudCommand, String> {
    let client = build_client(&token)?;
    let resp: JsonApiOne<CommandAttrs> =
        api_get(&client, &format!("{}/commands/{}", CLOUD_API_URL, command_id)).await?;
    Ok(map_command(resp.data))
}

// =====================================================
// Commands — Instances
// =====================================================

fn map_instance(r: JsonApiResource<InstanceAttrs>) -> CloudInstance {
    CloudInstance {
        id: r.id,
        name: r.attributes.name,
        instance_type: r.attributes.instance_type,
        size: r.attributes.size,
        scaling_type: r.attributes.scaling_type,
        min_replicas: r.attributes.min_replicas,
        max_replicas: r.attributes.max_replicas,
        uses_scheduler: r.attributes.uses_scheduler,
        created_at: r.attributes.created_at,
    }
}

#[tauri::command]
pub async fn cloud_list_instances(token: String, env_id: String) -> Result<Vec<CloudInstance>, String> {
    let client = build_client(&token)?;
    let resp: JsonApiMany<InstanceAttrs> =
        api_get(&client, &format!("{}/environments/{}/instances", CLOUD_API_URL, env_id)).await?;
    Ok(resp.data.into_iter().map(map_instance).collect())
}

#[tauri::command]
pub async fn cloud_create_instance(token: String, env_id: String, name: String, instance_type: String, size: String) -> Result<(), String> {
    let client = build_client(&token)?;
    api_post(&client, &format!("{}/environments/{}/instances", CLOUD_API_URL, env_id), Some(serde_json::json!({
        "name": name,
        "type": instance_type,
        "size": size,
    }))).await
}

#[tauri::command]
pub async fn cloud_update_instance(token: String, instance_id: String, data: Value) -> Result<(), String> {
    let client = build_client(&token)?;
    api_put(&client, &format!("{}/instances/{}", CLOUD_API_URL, instance_id), Some(data)).await
}

#[tauri::command]
pub async fn cloud_delete_instance(token: String, instance_id: String) -> Result<(), String> {
    let client = build_client(&token)?;
    api_delete(&client, &format!("{}/instances/{}", CLOUD_API_URL, instance_id)).await
}

#[tauri::command]
pub async fn cloud_list_instance_sizes(token: String) -> Result<Value, String> {
    let client = build_client(&token)?;
    api_get(&client, &format!("{}/instance-sizes", CLOUD_API_URL)).await
}

// =====================================================
// Commands — Domains
// =====================================================

fn map_domain(r: JsonApiResource<DomainAttrs>) -> CloudDomain {
    CloudDomain {
        id: r.id,
        name: r.attributes.name,
        domain_type: r.attributes.domain_type,
        hostname_status: r.attributes.hostname_status,
        ssl_status: r.attributes.ssl_status,
        created_at: r.attributes.created_at,
    }
}

#[tauri::command]
pub async fn cloud_list_domains(token: String, env_id: String) -> Result<Vec<CloudDomain>, String> {
    let client = build_client(&token)?;
    let resp: JsonApiMany<DomainAttrs> =
        api_get(&client, &format!("{}/environments/{}/domains", CLOUD_API_URL, env_id)).await?;
    Ok(resp.data.into_iter().map(map_domain).collect())
}

#[tauri::command]
pub async fn cloud_create_domain(token: String, env_id: String, name: String) -> Result<(), String> {
    let client = build_client(&token)?;
    api_post(&client, &format!("{}/environments/{}/domains", CLOUD_API_URL, env_id), Some(serde_json::json!({
        "name": name,
    }))).await
}

#[tauri::command]
pub async fn cloud_delete_domain(token: String, domain_id: String) -> Result<(), String> {
    let client = build_client(&token)?;
    api_delete(&client, &format!("{}/domains/{}", CLOUD_API_URL, domain_id)).await
}

#[tauri::command]
pub async fn cloud_verify_domain(token: String, domain_id: String) -> Result<(), String> {
    let client = build_client(&token)?;
    api_post(&client, &format!("{}/domains/{}/verify", CLOUD_API_URL, domain_id), None).await
}

#[tauri::command]
pub async fn cloud_update_domain(token: String, domain_id: String, data: Value) -> Result<(), String> {
    let client = build_client(&token)?;
    api_patch(&client, &format!("{}/domains/{}", CLOUD_API_URL, domain_id), Some(data)).await
}

// =====================================================
// Commands — Database Clusters
// =====================================================

fn map_database_cluster(r: JsonApiResource<DatabaseClusterAttrs>) -> CloudDatabaseCluster {
    CloudDatabaseCluster {
        id: r.id,
        name: r.attributes.name,
        cluster_type: r.attributes.cluster_type,
        status: r.attributes.status,
        region: r.attributes.region,
        created_at: r.attributes.created_at,
    }
}

#[tauri::command]
pub async fn cloud_list_database_clusters(token: String) -> Result<Vec<CloudDatabaseCluster>, String> {
    let client = build_client(&token)?;
    let resp: JsonApiMany<DatabaseClusterAttrs> =
        api_get(&client, &format!("{}/databases/clusters", CLOUD_API_URL)).await?;
    Ok(resp.data.into_iter().map(map_database_cluster).collect())
}

#[tauri::command]
pub async fn cloud_create_database_cluster(token: String, name: String, db_type: String, region: String) -> Result<(), String> {
    let client = build_client(&token)?;
    api_post(&client, &format!("{}/databases/clusters", CLOUD_API_URL), Some(serde_json::json!({
        "name": name,
        "type": db_type,
        "region": region,
    }))).await
}

#[tauri::command]
pub async fn cloud_delete_database_cluster(token: String, cluster_id: String) -> Result<(), String> {
    let client = build_client(&token)?;
    api_delete(&client, &format!("{}/databases/clusters/{}", CLOUD_API_URL, cluster_id)).await
}

#[tauri::command]
pub async fn cloud_update_database_cluster(token: String, cluster_id: String, data: Value) -> Result<(), String> {
    let client = build_client(&token)?;
    api_patch(&client, &format!("{}/databases/clusters/{}", CLOUD_API_URL, cluster_id), Some(data)).await
}

fn map_database(r: JsonApiResource<DatabaseAttrs>) -> CloudDatabase {
    CloudDatabase {
        id: r.id,
        name: r.attributes.name,
        db_type: r.attributes.db_type,
        status: r.attributes.status,
        region: r.attributes.region,
        created_at: r.attributes.created_at,
    }
}

#[tauri::command]
pub async fn cloud_list_cluster_databases(token: String, cluster_id: String) -> Result<Vec<CloudDatabase>, String> {
    let client = build_client(&token)?;
    let resp: JsonApiMany<DatabaseAttrs> =
        api_get(&client, &format!("{}/databases/clusters/{}/databases", CLOUD_API_URL, cluster_id)).await?;
    Ok(resp.data.into_iter().map(map_database).collect())
}

#[tauri::command]
pub async fn cloud_create_cluster_database(token: String, cluster_id: String, name: String) -> Result<(), String> {
    let client = build_client(&token)?;
    api_post(&client, &format!("{}/databases/clusters/{}/databases", CLOUD_API_URL, cluster_id), Some(serde_json::json!({
        "name": name,
    }))).await
}

#[tauri::command]
pub async fn cloud_delete_cluster_database(token: String, cluster_id: String, schema: String) -> Result<(), String> {
    let client = build_client(&token)?;
    api_delete(&client, &format!("{}/databases/clusters/{}/databases/{}", CLOUD_API_URL, cluster_id, schema)).await
}

fn map_database_snapshot(r: JsonApiResource<DatabaseSnapshotAttrs>) -> CloudDatabaseSnapshot {
    CloudDatabaseSnapshot {
        id: r.id,
        name: r.attributes.name,
        description: r.attributes.description,
        snapshot_type: r.attributes.snapshot_type,
        status: r.attributes.status,
        storage_bytes: r.attributes.storage_bytes,
        created_at: r.attributes.created_at,
    }
}

#[tauri::command]
pub async fn cloud_list_database_snapshots(token: String, cluster_id: String) -> Result<Vec<CloudDatabaseSnapshot>, String> {
    let client = build_client(&token)?;
    let resp: JsonApiMany<DatabaseSnapshotAttrs> =
        api_get(&client, &format!("{}/databases/clusters/{}/snapshots", CLOUD_API_URL, cluster_id)).await?;
    Ok(resp.data.into_iter().map(map_database_snapshot).collect())
}

#[tauri::command]
pub async fn cloud_create_database_snapshot(token: String, cluster_id: String) -> Result<(), String> {
    let client = build_client(&token)?;
    api_post(&client, &format!("{}/databases/clusters/{}/snapshots", CLOUD_API_URL, cluster_id), None).await
}

#[tauri::command]
pub async fn cloud_delete_database_snapshot(token: String, snapshot_id: String) -> Result<(), String> {
    let client = build_client(&token)?;
    api_delete(&client, &format!("{}/database-snapshots/{}", CLOUD_API_URL, snapshot_id)).await
}

#[tauri::command]
pub async fn cloud_restore_database(token: String, cluster_id: String, snapshot_id: String) -> Result<(), String> {
    let client = build_client(&token)?;
    api_post(&client, &format!("{}/databases/clusters/{}/restore", CLOUD_API_URL, cluster_id), Some(serde_json::json!({
        "snapshot_id": snapshot_id,
    }))).await
}

#[tauri::command]
pub async fn cloud_get_database_metrics(token: String, cluster_id: String) -> Result<Value, String> {
    let client = build_client(&token)?;
    api_get(&client, &format!("{}/databases/clusters/{}/metrics", CLOUD_API_URL, cluster_id)).await
}

// =====================================================
// Commands — Standalone Databases
// =====================================================

#[tauri::command]
pub async fn cloud_list_databases(token: String) -> Result<Vec<CloudDatabase>, String> {
    let client = build_client(&token)?;
    let resp: JsonApiMany<DatabaseAttrs> =
        api_get(&client, &format!("{}/databases", CLOUD_API_URL)).await?;
    Ok(resp.data.into_iter().map(map_database).collect())
}

#[tauri::command]
pub async fn cloud_create_database(token: String, name: String, db_type: String, region: String) -> Result<(), String> {
    let client = build_client(&token)?;
    api_post(&client, &format!("{}/databases", CLOUD_API_URL), Some(serde_json::json!({
        "name": name,
        "type": db_type,
        "region": region,
    }))).await
}

#[tauri::command]
pub async fn cloud_delete_database(token: String, database_id: String) -> Result<(), String> {
    let client = build_client(&token)?;
    api_delete(&client, &format!("{}/databases/{}", CLOUD_API_URL, database_id)).await
}

#[tauri::command]
pub async fn cloud_update_database(token: String, database_id: String, data: Value) -> Result<(), String> {
    let client = build_client(&token)?;
    api_patch(&client, &format!("{}/databases/{}", CLOUD_API_URL, database_id), Some(data)).await
}

// =====================================================
// Commands — Caches
// =====================================================

fn map_cache(r: JsonApiResource<CacheAttrs>) -> CloudCache {
    CloudCache {
        id: r.id,
        name: r.attributes.name,
        cache_type: r.attributes.cache_type,
        status: r.attributes.status,
        region: r.attributes.region,
        size: r.attributes.size,
        created_at: r.attributes.created_at,
    }
}

#[tauri::command]
pub async fn cloud_list_caches(token: String) -> Result<Vec<CloudCache>, String> {
    let client = build_client(&token)?;
    let resp: JsonApiMany<CacheAttrs> =
        api_get(&client, &format!("{}/caches", CLOUD_API_URL)).await?;
    Ok(resp.data.into_iter().map(map_cache).collect())
}

#[tauri::command]
pub async fn cloud_create_cache(token: String, name: String, cache_type: String, region: String, size: String) -> Result<(), String> {
    let client = build_client(&token)?;
    api_post(&client, &format!("{}/caches", CLOUD_API_URL), Some(serde_json::json!({
        "name": name,
        "type": cache_type,
        "region": region,
        "size": size,
    }))).await
}

#[tauri::command]
pub async fn cloud_delete_cache(token: String, cache_id: String) -> Result<(), String> {
    let client = build_client(&token)?;
    api_delete(&client, &format!("{}/caches/{}", CLOUD_API_URL, cache_id)).await
}

#[tauri::command]
pub async fn cloud_update_cache(token: String, cache_id: String, data: Value) -> Result<(), String> {
    let client = build_client(&token)?;
    api_patch(&client, &format!("{}/caches/{}", CLOUD_API_URL, cache_id), Some(data)).await
}

#[tauri::command]
pub async fn cloud_list_cache_types(token: String) -> Result<Value, String> {
    let client = build_client(&token)?;
    api_get(&client, &format!("{}/caches/types", CLOUD_API_URL)).await
}

#[tauri::command]
pub async fn cloud_get_cache_metrics(token: String, cache_id: String) -> Result<Value, String> {
    let client = build_client(&token)?;
    api_get(&client, &format!("{}/caches/{}/metrics", CLOUD_API_URL, cache_id)).await
}

// =====================================================
// Commands — Object Storage (Buckets)
// =====================================================

fn map_bucket(r: JsonApiResource<BucketAttrs>) -> CloudBucket {
    CloudBucket {
        id: r.id,
        name: r.attributes.name,
        bucket_type: r.attributes.bucket_type,
        status: r.attributes.status,
        visibility: r.attributes.visibility,
        endpoint: r.attributes.endpoint,
        url: r.attributes.url,
        created_at: r.attributes.created_at,
    }
}

#[tauri::command]
pub async fn cloud_list_buckets(token: String) -> Result<Vec<CloudBucket>, String> {
    let client = build_client(&token)?;
    let resp: JsonApiMany<BucketAttrs> =
        api_get(&client, &format!("{}/buckets", CLOUD_API_URL)).await?;
    Ok(resp.data.into_iter().map(map_bucket).collect())
}

#[tauri::command]
pub async fn cloud_create_bucket(token: String, name: String, visibility: String) -> Result<(), String> {
    let client = build_client(&token)?;
    api_post(&client, &format!("{}/buckets", CLOUD_API_URL), Some(serde_json::json!({
        "name": name,
        "visibility": visibility,
    }))).await
}

#[tauri::command]
pub async fn cloud_delete_bucket(token: String, bucket_id: String) -> Result<(), String> {
    let client = build_client(&token)?;
    api_delete(&client, &format!("{}/buckets/{}", CLOUD_API_URL, bucket_id)).await
}

#[tauri::command]
pub async fn cloud_update_bucket(token: String, bucket_id: String, data: Value) -> Result<(), String> {
    let client = build_client(&token)?;
    api_patch(&client, &format!("{}/buckets/{}", CLOUD_API_URL, bucket_id), Some(data)).await
}

fn map_bucket_key(r: JsonApiResource<BucketKeyAttrs>) -> CloudBucketKey {
    CloudBucketKey {
        id: r.id,
        name: r.attributes.name,
        permission: r.attributes.permission,
        access_key_id: r.attributes.access_key_id,
        access_key_secret: r.attributes.access_key_secret,
        created_at: r.attributes.created_at,
    }
}

#[tauri::command]
pub async fn cloud_list_bucket_keys(token: String, bucket_id: String) -> Result<Vec<CloudBucketKey>, String> {
    let client = build_client(&token)?;
    let resp: JsonApiMany<BucketKeyAttrs> =
        api_get(&client, &format!("{}/buckets/{}/keys", CLOUD_API_URL, bucket_id)).await?;
    Ok(resp.data.into_iter().map(map_bucket_key).collect())
}

#[tauri::command]
pub async fn cloud_create_bucket_key(token: String, bucket_id: String, name: String, permission: String) -> Result<(), String> {
    let client = build_client(&token)?;
    api_post(&client, &format!("{}/buckets/{}/keys", CLOUD_API_URL, bucket_id), Some(serde_json::json!({
        "name": name,
        "permission": permission,
    }))).await
}

#[tauri::command]
pub async fn cloud_delete_bucket_key(token: String, key_id: String) -> Result<(), String> {
    let client = build_client(&token)?;
    api_delete(&client, &format!("{}/bucket-keys/{}", CLOUD_API_URL, key_id)).await
}

// =====================================================
// Commands — WebSocket Servers
// =====================================================

fn map_websocket_server(r: JsonApiResource<WebsocketServerAttrs>) -> CloudWebsocketServer {
    CloudWebsocketServer {
        id: r.id,
        name: r.attributes.name,
        ws_type: r.attributes.ws_type,
        region: r.attributes.region,
        status: r.attributes.status,
        max_connections: r.attributes.max_connections,
        hostname: r.attributes.hostname,
        created_at: r.attributes.created_at,
    }
}

#[tauri::command]
pub async fn cloud_list_websocket_servers(token: String) -> Result<Vec<CloudWebsocketServer>, String> {
    let client = build_client(&token)?;
    let resp: JsonApiMany<WebsocketServerAttrs> =
        api_get(&client, &format!("{}/websocket-servers", CLOUD_API_URL)).await?;
    Ok(resp.data.into_iter().map(map_websocket_server).collect())
}

#[tauri::command]
pub async fn cloud_create_websocket_server(token: String, name: String, region: String, max_connections: i64) -> Result<(), String> {
    let client = build_client(&token)?;
    api_post(&client, &format!("{}/websocket-servers", CLOUD_API_URL), Some(serde_json::json!({
        "name": name,
        "region": region,
        "max_connections": max_connections,
    }))).await
}

#[tauri::command]
pub async fn cloud_delete_websocket_server(token: String, server_id: String) -> Result<(), String> {
    let client = build_client(&token)?;
    api_delete(&client, &format!("{}/websocket-servers/{}", CLOUD_API_URL, server_id)).await
}

#[tauri::command]
pub async fn cloud_update_websocket_server(token: String, server_id: String, data: Value) -> Result<(), String> {
    let client = build_client(&token)?;
    api_patch(&client, &format!("{}/websocket-servers/{}", CLOUD_API_URL, server_id), Some(data)).await
}

#[tauri::command]
pub async fn cloud_get_websocket_server_metrics(token: String, server_id: String) -> Result<Value, String> {
    let client = build_client(&token)?;
    api_get(&client, &format!("{}/websocket-servers/{}/metrics", CLOUD_API_URL, server_id)).await
}

// =====================================================
// Commands — WebSocket Applications
// =====================================================

fn map_websocket_application(r: JsonApiResource<WebsocketApplicationAttrs>) -> CloudWebsocketApplication {
    CloudWebsocketApplication {
        id: r.id,
        name: r.attributes.name,
        app_id: r.attributes.app_id,
        key: r.attributes.key,
        secret: r.attributes.secret,
        created_at: r.attributes.created_at,
    }
}

#[tauri::command]
pub async fn cloud_list_websocket_applications(token: String, server_id: String) -> Result<Vec<CloudWebsocketApplication>, String> {
    let client = build_client(&token)?;
    let resp: JsonApiMany<WebsocketApplicationAttrs> =
        api_get(&client, &format!("{}/websocket-servers/{}/applications", CLOUD_API_URL, server_id)).await?;
    Ok(resp.data.into_iter().map(map_websocket_application).collect())
}

#[tauri::command]
pub async fn cloud_create_websocket_application(token: String, server_id: String, name: String) -> Result<(), String> {
    let client = build_client(&token)?;
    api_post(&client, &format!("{}/websocket-servers/{}/applications", CLOUD_API_URL, server_id), Some(serde_json::json!({
        "name": name,
    }))).await
}

#[tauri::command]
pub async fn cloud_update_websocket_application(token: String, app_id: String, data: Value) -> Result<(), String> {
    let client = build_client(&token)?;
    api_patch(&client, &format!("{}/websocket-applications/{}", CLOUD_API_URL, app_id), Some(data)).await
}

#[tauri::command]
pub async fn cloud_delete_websocket_application(token: String, app_id: String) -> Result<(), String> {
    let client = build_client(&token)?;
    api_delete(&client, &format!("{}/websocket-applications/{}", CLOUD_API_URL, app_id)).await
}

#[tauri::command]
pub async fn cloud_get_websocket_application_metrics(token: String, app_id: String) -> Result<Value, String> {
    let client = build_client(&token)?;
    api_get(&client, &format!("{}/websocket-applications/{}/metrics", CLOUD_API_URL, app_id)).await
}

// =====================================================
// Commands — Background Processes
// =====================================================

fn map_background_process(r: JsonApiResource<BackgroundProcessAttrs>) -> CloudBackgroundProcess {
    CloudBackgroundProcess {
        id: r.id,
        process_type: r.attributes.process_type,
        processes: r.attributes.processes,
        command: r.attributes.command,
        created_at: r.attributes.created_at,
    }
}

#[tauri::command]
pub async fn cloud_list_background_processes(token: String, instance_id: String) -> Result<Vec<CloudBackgroundProcess>, String> {
    let client = build_client(&token)?;
    let resp: JsonApiMany<BackgroundProcessAttrs> =
        api_get(&client, &format!("{}/instances/{}/background-processes", CLOUD_API_URL, instance_id)).await?;
    Ok(resp.data.into_iter().map(map_background_process).collect())
}

#[tauri::command]
pub async fn cloud_create_background_process(token: String, instance_id: String, command: String, processes: i64) -> Result<(), String> {
    let client = build_client(&token)?;
    api_post(&client, &format!("{}/instances/{}/background-processes", CLOUD_API_URL, instance_id), Some(serde_json::json!({
        "command": command,
        "processes": processes,
    }))).await
}

#[tauri::command]
pub async fn cloud_delete_background_process(token: String, process_id: String) -> Result<(), String> {
    let client = build_client(&token)?;
    api_delete(&client, &format!("{}/background-processes/{}", CLOUD_API_URL, process_id)).await
}

#[tauri::command]
pub async fn cloud_update_background_process(token: String, process_id: String, data: Value) -> Result<(), String> {
    let client = build_client(&token)?;
    api_patch(&client, &format!("{}/background-processes/{}", CLOUD_API_URL, process_id), Some(data)).await
}

// =====================================================
// Commands — Meta (additional)
// =====================================================

#[tauri::command]
pub async fn cloud_list_dedicated_clusters(token: String) -> Result<Value, String> {
    let client = build_client(&token)?;
    api_get(&client, &format!("{}/dedicated-clusters", CLOUD_API_URL)).await
}

#[tauri::command]
pub async fn cloud_list_ip_addresses(token: String) -> Result<Value, String> {
    let client = build_client(&token)?;
    api_get(&client, &format!("{}/ip", CLOUD_API_URL)).await
}

#[tauri::command]
pub async fn cloud_list_database_types(token: String) -> Result<Value, String> {
    let client = build_client(&token)?;
    api_get(&client, &format!("{}/databases/types", CLOUD_API_URL)).await
}
