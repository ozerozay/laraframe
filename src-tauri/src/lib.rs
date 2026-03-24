use tauri::Manager;

mod api;
mod db;
mod keychain;

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
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
