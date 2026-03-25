use tauri::Manager;

mod api;
mod db;
mod keychain;

#[tauri::command]
fn build_mcp_server() -> Result<String, String> {
    let cwd = std::env::current_dir().map_err(|e| e.to_string())?;
    let mcp_dir = cwd.join("mcp-server");
    if !mcp_dir.exists() {
        return Err("mcp-server directory not found".to_string());
    }

    // Detect package manager: pnpm > yarn > npm (npm always available with Node.js)
    let pm = if std::process::Command::new("pnpm").arg("--version").output().map(|o| o.status.success()).unwrap_or(false) {
        "pnpm"
    } else if std::process::Command::new("yarn").arg("--version").output().map(|o| o.status.success()).unwrap_or(false) {
        "yarn"
    } else {
        "npm"
    };

    // Install dependencies
    let output = std::process::Command::new(pm)
        .args(["install"])
        .current_dir(&mcp_dir)
        .output()
        .map_err(|e| format!("Failed to run {} install: {}", pm, e))?;
    if !output.status.success() {
        return Err(format!("{} install failed: {}", pm, String::from_utf8_lossy(&output.stderr)));
    }

    // Build (TypeScript compile)
    let build_args = if pm == "npm" { vec!["run", "build"] } else { vec!["build"] };
    let output = std::process::Command::new(pm)
        .args(&build_args)
        .current_dir(&mcp_dir)
        .output()
        .map_err(|e| format!("Failed to run {} build: {}", pm, e))?;
    if !output.status.success() {
        return Err(format!("{} build failed: {}", pm, String::from_utf8_lossy(&output.stderr)));
    }

    Ok(format!("MCP server built successfully (using {})", pm))
}

#[tauri::command]
fn get_mcp_server_path() -> Result<String, String> {
    // Try to find mcp-server/dist/index.js relative to the executable or CWD
    let cwd = std::env::current_dir().map_err(|e| e.to_string())?;
    let mcp_path = cwd.join("mcp-server").join("dist").join("index.js");
    if mcp_path.exists() {
        return Ok(mcp_path.to_string_lossy().to_string());
    }
    // Fallback: try parent directories
    if let Some(parent) = cwd.parent() {
        let mcp_path = parent.join("mcp-server").join("dist").join("index.js");
        if mcp_path.exists() {
            return Ok(mcp_path.to_string_lossy().to_string());
        }
    }
    Err("MCP server not found. Build it with: cd mcp-server && pnpm build".to_string())
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_opener::init())
        .setup(|app| {
            let database = db::init(app.handle());
            app.manage(database);
            Ok(())
        })
        .invoke_handler(tauri::generate_handler![
            // Keychain
            keychain::save_api_key,
            keychain::get_api_key,
            keychain::delete_api_key,
            keychain::has_api_key,
            get_mcp_server_path,
            build_mcp_server,
            // Database settings
            db::get_setting,
            db::set_setting,
            // Forge - Auth & Org
            api::forge::forge_get_user,
            api::forge::forge_list_orgs,
            // Forge - Servers
            api::forge::forge_list_servers,
            api::forge::forge_server_action,
            api::forge::forge_service_action,
            // Forge - Sites
            api::forge::forge_list_sites,
            api::forge::forge_deploy_site,
            // Forge - Monitoring & Logs
            api::forge::forge_get_events,
            api::forge::forge_get_server_log,
            api::forge::forge_get_site_log,
            api::forge::forge_list_monitors,
            api::forge::forge_list_deployments,
            api::forge::forge_get_env,
            api::forge::forge_update_env,
            // Forge - Deployment Enhancements
            api::forge::forge_get_deploy_script,
            api::forge::forge_update_deploy_script,
            api::forge::forge_get_deployment_log,
            // Forge - Commands
            api::forge::forge_list_commands,
            api::forge::forge_run_command,
            api::forge::forge_get_command_output,
            // Forge - Domains
            api::forge::forge_list_domains,
            api::forge::forge_create_domain,
            api::forge::forge_delete_domain,
            api::forge::forge_get_domain_nginx,
            api::forge::forge_update_domain_nginx,
            // Forge - Domain Certificates
            api::forge::forge_get_domain_certificate,
            api::forge::forge_create_letsencrypt_cert,
            // Forge - Integrations
            api::forge::forge_get_integration,
            api::forge::forge_enable_integration,
            api::forge::forge_disable_integration,
            // Forge - Redirect Rules
            api::forge::forge_list_redirect_rules,
            api::forge::forge_create_redirect_rule,
            api::forge::forge_delete_redirect_rule,
            // Forge - Security Rules
            api::forge::forge_list_security_rules,
            api::forge::forge_create_security_rule,
            api::forge::forge_delete_security_rule,
            // Forge - Scheduled Jobs
            api::forge::forge_list_scheduled_jobs,
            api::forge::forge_create_scheduled_job,
            api::forge::forge_delete_scheduled_job,
            api::forge::forge_get_scheduled_job_output,
            // Forge - Webhooks
            api::forge::forge_list_webhooks,
            api::forge::forge_create_webhook,
            api::forge::forge_delete_webhook,
            // Forge - Heartbeats
            api::forge::forge_list_heartbeats,
            api::forge::forge_create_heartbeat,
            api::forge::forge_delete_heartbeat,
            // Forge - Healthcheck
            api::forge::forge_get_healthcheck,
            api::forge::forge_update_healthcheck,
            // Forge - Nginx Config
            api::forge::forge_get_nginx_config,
            api::forge::forge_update_nginx_config,
            // Forge - Database Management
            api::forge::forge_list_databases,
            api::forge::forge_create_database,
            api::forge::forge_delete_database,
            api::forge::forge_list_database_users,
            api::forge::forge_create_database_user,
            api::forge::forge_delete_database_user,
            api::forge::forge_update_database_user,
            api::forge::forge_update_database_password,
            api::forge::forge_sync_databases,
            // Forge - Database Backups
            api::forge::forge_list_backup_configs,
            api::forge::forge_create_backup_config,
            api::forge::forge_delete_backup_config,
            api::forge::forge_list_backups,
            api::forge::forge_create_backup,
            api::forge::forge_delete_backup,
            api::forge::forge_restore_backup,
            // Forge - SSH Keys
            api::forge::forge_list_ssh_keys,
            api::forge::forge_create_ssh_key,
            api::forge::forge_delete_ssh_key,
            // Forge - Firewall Rules
            api::forge::forge_list_firewall_rules,
            api::forge::forge_create_firewall_rule,
            api::forge::forge_delete_firewall_rule,
            // Forge - Background Processes / Daemons
            api::forge::forge_list_daemons,
            api::forge::forge_create_daemon,
            api::forge::forge_delete_daemon,
            api::forge::forge_restart_daemon,
            api::forge::forge_get_daemon_log,
            // Forge - PHP Versions
            api::forge::forge_list_php_versions,
            api::forge::forge_install_php_version,
            api::forge::forge_delete_php_version,
            // Forge - Site Create/Delete
            api::forge::forge_create_site,
            api::forge::forge_delete_site,
            // Forge - Recipes
            api::forge::forge_list_recipes,
            api::forge::forge_create_recipe,
            api::forge::forge_update_recipe,
            api::forge::forge_delete_recipe,
            api::forge::forge_run_recipe,
            // Cloud - Meta
            api::cloud::cloud_get_organization,
            api::cloud::cloud_list_regions,
            // Cloud - Applications
            api::cloud::cloud_list_applications,
            api::cloud::cloud_create_application,
            api::cloud::cloud_get_application,
            api::cloud::cloud_delete_application,
            api::cloud::cloud_update_application,
            // Cloud - Environments
            api::cloud::cloud_list_environments,
            api::cloud::cloud_create_environment,
            api::cloud::cloud_get_environment,
            api::cloud::cloud_update_environment,
            api::cloud::cloud_delete_environment,
            api::cloud::cloud_start_environment,
            api::cloud::cloud_stop_environment,
            api::cloud::cloud_add_env_variables,
            api::cloud::cloud_delete_env_variables,
            api::cloud::cloud_get_environment_logs,
            api::cloud::cloud_get_environment_metrics,
            // Cloud - Deployments
            api::cloud::cloud_list_deployments,
            api::cloud::cloud_create_deployment,
            api::cloud::cloud_get_deployment,
            api::cloud::cloud_get_deployment_logs,
            // Cloud - Commands
            api::cloud::cloud_list_commands,
            api::cloud::cloud_run_command,
            api::cloud::cloud_get_command,
            // Cloud - Instances
            api::cloud::cloud_list_instances,
            api::cloud::cloud_create_instance,
            api::cloud::cloud_update_instance,
            api::cloud::cloud_delete_instance,
            api::cloud::cloud_list_instance_sizes,
            // Cloud - Domains
            api::cloud::cloud_list_domains,
            api::cloud::cloud_create_domain,
            api::cloud::cloud_delete_domain,
            api::cloud::cloud_verify_domain,
            api::cloud::cloud_update_domain,
            // Cloud - Database Clusters
            api::cloud::cloud_list_database_clusters,
            api::cloud::cloud_create_database_cluster,
            api::cloud::cloud_delete_database_cluster,
            api::cloud::cloud_update_database_cluster,
            api::cloud::cloud_list_cluster_databases,
            api::cloud::cloud_create_cluster_database,
            api::cloud::cloud_delete_cluster_database,
            api::cloud::cloud_list_database_snapshots,
            api::cloud::cloud_create_database_snapshot,
            api::cloud::cloud_delete_database_snapshot,
            api::cloud::cloud_restore_database,
            api::cloud::cloud_get_database_metrics,
            // Cloud - Standalone Databases
            api::cloud::cloud_list_databases,
            api::cloud::cloud_create_database,
            api::cloud::cloud_delete_database,
            api::cloud::cloud_update_database,
            // Cloud - Caches
            api::cloud::cloud_list_caches,
            api::cloud::cloud_create_cache,
            api::cloud::cloud_delete_cache,
            api::cloud::cloud_update_cache,
            api::cloud::cloud_list_cache_types,
            api::cloud::cloud_get_cache_metrics,
            // Cloud - Object Storage
            api::cloud::cloud_list_buckets,
            api::cloud::cloud_create_bucket,
            api::cloud::cloud_delete_bucket,
            api::cloud::cloud_update_bucket,
            api::cloud::cloud_list_bucket_keys,
            api::cloud::cloud_create_bucket_key,
            api::cloud::cloud_delete_bucket_key,
            // Cloud - WebSocket
            api::cloud::cloud_list_websocket_servers,
            api::cloud::cloud_create_websocket_server,
            api::cloud::cloud_delete_websocket_server,
            api::cloud::cloud_update_websocket_server,
            api::cloud::cloud_get_websocket_server_metrics,
            // Cloud - WebSocket Applications
            api::cloud::cloud_list_websocket_applications,
            api::cloud::cloud_create_websocket_application,
            api::cloud::cloud_update_websocket_application,
            api::cloud::cloud_delete_websocket_application,
            api::cloud::cloud_get_websocket_application_metrics,
            // Cloud - Background Processes
            api::cloud::cloud_list_background_processes,
            api::cloud::cloud_create_background_process,
            api::cloud::cloud_delete_background_process,
            api::cloud::cloud_update_background_process,
            // Cloud - Meta (additional)
            api::cloud::cloud_list_dedicated_clusters,
            api::cloud::cloud_list_ip_addresses,
            api::cloud::cloud_list_database_types,
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
