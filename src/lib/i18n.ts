import { useState, useCallback } from "react";

type Lang = "en" | "tr";

const translations = {
  // General
  "app.refresh": { en: "Refresh", tr: "Yenile" },
  "app.save": { en: "Save", tr: "Kaydet" },
  "app.cancel": { en: "Cancel", tr: "İptal" },
  "app.edit": { en: "Edit", tr: "Düzenle" },
  "app.delete": { en: "Delete", tr: "Sil" },
  "app.add": { en: "Add", tr: "Ekle" },
  "app.create": { en: "Create", tr: "Oluştur" },
  "app.close": { en: "Close", tr: "Kapat" },
  "app.retry": { en: "Retry", tr: "Tekrar Dene" },
  "app.loading": { en: "Loading...", tr: "Yükleniyor..." },
  "app.saving": { en: "Saving...", tr: "Kaydediliyor..." },
  "app.connected": { en: "Connected", tr: "Bağlı" },
  "app.disconnected": { en: "Disconnected", tr: "Bağlı Değil" },
  "app.active": { en: "Active", tr: "Aktif" },
  "app.settings": { en: "Settings", tr: "Ayarlar" },
  "app.search": { en: "Search", tr: "Ara" },
  "app.noData": { en: "No data", tr: "Veri yok" },
  "app.error": { en: "Error", tr: "Hata" },

  // Navigation
  "nav.dashboard": { en: "Dashboard", tr: "Panel" },
  "nav.forge": { en: "Forge", tr: "Forge" },
  "nav.cloud": { en: "Cloud", tr: "Cloud" },
  "nav.nightwatch": { en: "Nightwatch", tr: "Nightwatch" },
  "nav.ai": { en: "AI Assistant", tr: "AI Asistan" },
  "nav.settings": { en: "Settings", tr: "Ayarlar" },
  "nav.lightMode": { en: "Light mode", tr: "Açık tema" },
  "nav.darkMode": { en: "Dark mode", tr: "Koyu tema" },

  // Dashboard
  "dashboard.title": { en: "Dashboard", tr: "Panel" },
  "dashboard.subtitle": { en: "Your Laravel ecosystem at a glance", tr: "Laravel ekosistemine genel bakış" },
  "dashboard.servicesConnected": { en: "services connected", tr: "servis bağlı" },
  "dashboard.gettingStarted": { en: "Getting Started", tr: "Başlangıç" },
  "dashboard.quickActions": { en: "Quick Actions", tr: "Hızlı İşlemler" },
  "dashboard.connect": { en: "Connect", tr: "Bağla" },
  "dashboard.done": { en: "Done", tr: "Tamam" },
  "dashboard.notConnected": { en: "Not connected", tr: "Bağlı değil" },
  "dashboard.noApiKey": { en: "No API key", tr: "API anahtarı yok" },
  "dashboard.ready": { en: "Ready", tr: "Hazır" },
  "dashboard.checking": { en: "Checking...", tr: "Kontrol ediliyor..." },
  "dashboard.viewForgeServers": { en: "View Forge Servers", tr: "Forge Sunucularını Gör" },
  "dashboard.viewCloudApps": { en: "View Cloud Apps", tr: "Cloud Uygulamalarını Gör" },
  "dashboard.askAi": { en: "Ask AI Assistant", tr: "AI Asistana Sor" },

  // Forge
  "forge.title": { en: "Forge", tr: "Forge" },
  "forge.servers": { en: "Servers", tr: "Sunucular" },
  "forge.sites": { en: "Sites", tr: "Siteler" },
  "forge.events": { en: "Events", tr: "Olaylar" },
  "forge.monitors": { en: "Monitors", tr: "İzleyiciler" },
  "forge.serverLogs": { en: "Server Logs", tr: "Sunucu Logları" },
  "forge.selectServer": { en: "Select a server", tr: "Bir sunucu seçin" },
  "forge.selectSite": { en: "Select a site to inspect", tr: "İncelemek için bir site seçin" },
  "forge.notConnected": { en: "Forge not connected", tr: "Forge bağlı değil" },
  "forge.notConnectedDesc": { en: "Add your API token in Settings to get started", tr: "Başlamak için Ayarlar'dan API token'ınızı ekleyin" },
  "forge.connecting": { en: "Connecting to Forge", tr: "Forge'a bağlanılıyor" },
  "forge.noServers": { en: "No servers found", tr: "Sunucu bulunamadı" },
  "forge.noSites": { en: "No sites on this server", tr: "Bu sunucuda site yok" },
  "forge.noEvents": { en: "No recent events", tr: "Son olay yok" },
  "forge.noEventsDesc": { en: "Server events will appear here", tr: "Sunucu olayları burada görünecek" },
  "forge.noMonitors": { en: "No monitors configured", tr: "İzleyici yapılandırılmamış" },
  "forge.noMonitorsDesc": { en: "Set up monitors in Forge to track CPU, memory, and disk usage", tr: "CPU, bellek ve disk kullanımını izlemek için Forge'da izleyici kurun" },
  "forge.loadingServer": { en: "Loading server data", tr: "Sunucu verileri yükleniyor" },
  "forge.loadingSite": { en: "Loading site data...", tr: "Site verileri yükleniyor..." },
  "forge.database": { en: "Database", tr: "Veritabanı" },
  "forge.databases": { en: "Databases", tr: "Veritabanları" },
  "forge.dbUsers": { en: "Users", tr: "Kullanıcılar" },
  "forge.noDatabases": { en: "No databases", tr: "Veritabanı yok" },
  "forge.noDatabasesDesc": { en: "Create a database to get started", tr: "Başlamak için bir veritabanı oluşturun" },
  "forge.noDbUsers": { en: "No database users", tr: "Veritabanı kullanıcısı yok" },
  "forge.noDbUsersDesc": { en: "Create a user to manage database access", tr: "Veritabanı erişimini yönetmek için bir kullanıcı oluşturun" },
  "forge.createDatabase": { en: "Create Database", tr: "Veritabanı Oluştur" },
  "forge.createDbUser": { en: "Create User", tr: "Kullanıcı Oluştur" },
  "forge.deleteDatabase": { en: "Delete Database", tr: "Veritabanını Sil" },
  "forge.deleteDatabaseDesc": { en: "This will permanently delete the database and all its data. This action cannot be undone.", tr: "Bu, veritabanını ve tüm verilerini kalıcı olarak silecektir. Bu işlem geri alınamaz." },
  "forge.deleteDbUser": { en: "Delete User", tr: "Kullanıcıyı Sil" },
  "forge.deleteDbUserDesc": { en: "This will remove the database user and revoke all access.", tr: "Bu, veritabanı kullanıcısını kaldıracak ve tüm erişimi iptal edecektir." },
  "forge.dbName": { en: "Database name", tr: "Veritabanı adı" },
  "forge.dbUsername": { en: "Username", tr: "Kullanıcı adı" },
  "forge.dbPassword": { en: "Password", tr: "Şifre" },
  "forge.dbSelectDatabases": { en: "Select databases", tr: "Veritabanlarını seçin" },

  // Site Detail
  "site.deploy": { en: "Deploy", tr: "Dağıt" },
  "site.deploying": { en: "Deploying...", tr: "Dağıtılıyor..." },
  "site.deployments": { en: "Deployments", tr: "Dağıtımlar" },
  "site.logs": { en: "Logs", tr: "Loglar" },
  "site.environment": { en: "Environment", tr: "Ortam Değişkenleri" },
  "site.noDeployments": { en: "No deployments yet", tr: "Henüz dağıtım yok" },
  "site.noDeploymentsDesc": { en: "Deploy this site to see history here", tr: "Geçmişi görmek için bu siteyi dağıtın" },
  "site.quickDeploy": { en: "Quick Deploy", tr: "Hızlı Dağıtım" },
  "site.noRepository": { en: "No repository", tr: "Depo yok" },
  "site.logEmpty": { en: "Log is empty", tr: "Log boş" },
  "site.selectLogType": { en: "Select a log type above", tr: "Yukarıdan bir log türü seçin" },
  "site.logNotAvailable": { en: "Log not available", tr: "Log mevcut değil" },
  "site.loadingLog": { en: "Loading log...", tr: "Log yükleniyor..." },
  "site.envNoFile": { en: "No environment file.", tr: "Ortam dosyası yok." },
  "site.envLoading": { en: "Loading environment...", tr: "Ortam değişkenleri yükleniyor..." },
  "site.envSensitive": { en: "Contains sensitive data", tr: "Hassas veri içerir" },

  // Settings
  "settings.title": { en: "Settings", tr: "Ayarlar" },
  "settings.subtitle": { en: "Configure your API connections and preferences.", tr: "API bağlantılarınızı ve tercihlerinizi yapılandırın." },
  "settings.apiConnections": { en: "API Connections", tr: "API Bağlantıları" },
  "settings.aiSettings": { en: "AI Settings", tr: "AI Ayarları" },
  "settings.general": { en: "General", tr: "Genel" },
  "settings.language": { en: "Language", tr: "Dil" },
  "settings.connectForge": { en: "Connect your Forge account to manage servers and sites.", tr: "Sunucuları ve siteleri yönetmek için Forge hesabınızı bağlayın." },
  "settings.connectCloud": { en: "Connect your Cloud account to manage applications.", tr: "Uygulamaları yönetmek için Cloud hesabınızı bağlayın." },
  "settings.connectNightwatch": { en: "Connect your Nightwatch account for monitoring.", tr: "İzleme için Nightwatch hesabınızı bağlayın." },
  "settings.connectClaude": { en: "Add your Anthropic API key to enable the AI assistant.", tr: "AI asistanı etkinleştirmek için Anthropic API anahtarınızı ekleyin." },
  "settings.keySaved": { en: "API key saved securely in your system keychain.", tr: "API anahtarı sistem anahtar zincirinize güvenle kaydedildi." },
  "settings.remove": { en: "Remove", tr: "Kaldır" },
  "settings.about": { en: "About", tr: "Hakkında" },
  "settings.aboutDesc": { en: "A unified desktop client for Laravel Cloud, Forge, and Nightwatch.", tr: "Laravel Cloud, Forge ve Nightwatch için birleşik masaüstü istemcisi." },
  "settings.builtWith": { en: "Built with Tauri, React, and Rust. API keys are stored securely in your OS keychain.", tr: "Tauri, React ve Rust ile yapılmıştır. API anahtarları işletim sisteminizin anahtar zincirinde güvenle saklanır." },

  // AI
  "ai.title": { en: "AI Assistant", tr: "AI Asistan" },
  "ai.subtitle": { en: "Chat with AI to manage your Laravel infrastructure.", tr: "Laravel altyapınızı yönetmek için AI ile sohbet edin." },
  "ai.placeholder": { en: "Ask about your servers, deployments...", tr: "Sunucularınız, dağıtımlarınız hakkında sorun..." },
  "ai.notConfigured": { en: "AI integration is not configured yet. Add your Claude API key in Settings to enable AI features.", tr: "AI entegrasyonu henüz yapılandırılmadı. AI özelliklerini etkinleştirmek için Ayarlar'dan Claude API anahtarınızı ekleyin." },
  "ai.greeting": { en: "Hi! I'm your LaraFrame AI assistant. I can help you manage your Laravel infrastructure. Ask me anything about your servers, deployments, or monitoring.", tr: "Merhaba! LaraFrame AI asistanınızım. Laravel altyapınızı yönetmenize yardımcı olabilirim. Sunucularınız, dağıtımlarınız veya izleme hakkında her şeyi sorabilirsiniz." },

  // Monitor types
  "monitor.above": { en: "above", tr: "üstünde" },
  "monitor.below": { en: "below", tr: "altında" },

  // Cloud
  "cloud.title": { en: "Cloud", tr: "Cloud" },
  "cloud.notConnected": { en: "Cloud not connected", tr: "Cloud bağlı değil" },
  "cloud.notConnectedDesc": { en: "Add your Cloud API token in Settings to get started", tr: "Başlamak için Ayarlar'dan Cloud API token'ınızı ekleyin" },
  "cloud.connecting": { en: "Connecting to Cloud", tr: "Cloud'a bağlanılıyor" },
  "cloud.applications": { en: "Applications", tr: "Uygulamalar" },
  "cloud.environments": { en: "Environments", tr: "Ortamlar" },
  "cloud.deployments": { en: "Deployments", tr: "Dağıtımlar" },
  "cloud.instances": { en: "Instances", tr: "Instance'lar" },
  "cloud.domains": { en: "Domains", tr: "Domainler" },
  "cloud.databases": { en: "Databases", tr: "Veritabanları" },
  "cloud.caches": { en: "Caches", tr: "Önbellekler" },
  "cloud.storage": { en: "Storage", tr: "Depolama" },
  "cloud.websockets": { en: "WebSockets", tr: "WebSocket'ler" },
  "cloud.commands": { en: "Commands", tr: "Komutlar" },
  "cloud.logs": { en: "Logs", tr: "Loglar" },
  "cloud.metrics": { en: "Metrics", tr: "Metrikler" },
  "cloud.noApps": { en: "No applications", tr: "Uygulama yok" },
  "cloud.noAppsDesc": { en: "Create an application to get started", tr: "Başlamak için bir uygulama oluşturun" },
  "cloud.noEnvs": { en: "No environments", tr: "Ortam yok" },
  "cloud.selectApp": { en: "Select an application", tr: "Bir uygulama seçin" },
  "cloud.selectEnv": { en: "Select an environment", tr: "Bir ortam seçin" },
  "cloud.deploy": { en: "Deploy", tr: "Dağıt" },
  "cloud.start": { en: "Start", tr: "Başlat" },
  "cloud.stop": { en: "Stop", tr: "Durdur" },
  "cloud.running": { en: "Running", tr: "Çalışıyor" },
  "cloud.stopped": { en: "Stopped", tr: "Durduruldu" },
  "cloud.hibernating": { en: "Hibernating", tr: "Uyku modunda" },
  "cloud.deploying": { en: "Deploying", tr: "Dağıtılıyor" },
  "cloud.deleteApp": { en: "Delete Application", tr: "Uygulamayı Sil" },
  "cloud.deleteAppDesc": { en: "This will permanently delete the application and all its environments, deployments, and data. This action cannot be undone.", tr: "Bu, uygulamayı ve tüm ortamlarını, dağıtımlarını ve verilerini kalıcı olarak silecektir. Bu işlem geri alınamaz." },
  "cloud.deleteEnv": { en: "Delete Environment", tr: "Ortamı Sil" },
  "cloud.deleteEnvDesc": { en: "This will permanently delete the environment and stop all running instances.", tr: "Bu, ortamı kalıcı olarak silecek ve çalışan tüm instance'ları durduracaktır." },
  "cloud.stopEnv": { en: "Stop Environment", tr: "Ortamı Durdur" },
  "cloud.stopEnvDesc": { en: "This will stop all running instances in this environment. Your application will be offline.", tr: "Bu, bu ortamdaki tüm çalışan instance'ları durduracaktır. Uygulamanız çevrimdışı olacaktır." },
} as const;

type TranslationKey = keyof typeof translations;

let currentLang: Lang = (localStorage.getItem("laraframe-lang") as Lang) || "en";
const listeners = new Set<() => void>();

function notify() {
  listeners.forEach((fn) => fn());
}

export function setLanguage(lang: Lang) {
  currentLang = lang;
  localStorage.setItem("laraframe-lang", lang);
  notify();
}

export function getLanguage(): Lang {
  return currentLang;
}

export function t(key: TranslationKey): string {
  const entry = translations[key];
  if (!entry) return key;
  return entry[currentLang] || entry.en;
}

export function useTranslation() {
  const [, setTick] = useState(0);

  const forceUpdate = useCallback(() => setTick((t) => t + 1), []);

  // Subscribe on first render, unsubscribe on unmount
  useState(() => {
    listeners.add(forceUpdate);
    return () => listeners.delete(forceUpdate);
  });

  return { t, lang: currentLang, setLanguage };
}
