export interface HelpSection {
  id: string;
  icon: string;
  title: { en: string; tr: string };
  description: { en: string; tr: string };
  items: HelpItem[];
}

export interface HelpItem {
  title: { en: string; tr: string };
  content: { en: string; tr: string };
}

export const helpSections: HelpSection[] = [
  {
    id: "deployments",
    icon: "rocket",
    title: { en: "Deployments", tr: "Dağıtımlar" },
    description: {
      en: "Deploy your application and track deployment history",
      tr: "Uygulamanızı dağıtın ve dağıtım geçmişini takip edin",
    },
    items: [
      {
        title: { en: "How to deploy", tr: "Nasıl dağıtılır" },
        content: {
          en: "Click the Deploy button in the site header. The deployment will be queued and you'll see real-time status updates. Click on any deployment to view its full output log.",
          tr: "Site başlığındaki Deploy butonuna tıklayın. Dağıtım kuyruğa alınacak ve gerçek zamanlı durum güncellemelerini göreceksiniz. Tam çıktı logunu görmek için herhangi bir dağıtıma tıklayın.",
        },
      },
      {
        title: { en: "Deployment statuses", tr: "Dağıtım durumları" },
        content: {
          en: "Queued: waiting to start. Deploying: in progress. Finished: completed successfully (green check). Failed: something went wrong (red icon) - click to see the error log.",
          tr: "Queued: başlamayı bekliyor. Deploying: devam ediyor. Finished: başarıyla tamamlandı (yeşil tik). Failed: bir şeyler ters gitti (kırmızı ikon) - hata logunu görmek için tıklayın.",
        },
      },
    ],
  },
  {
    id: "deploy-script",
    icon: "file-code",
    title: { en: "Deploy Script", tr: "Dağıtım Scripti" },
    description: {
      en: "The bash script that runs during each deployment",
      tr: "Her dağıtımda çalışan bash scripti",
    },
    items: [
      {
        title: { en: "What is the deploy script?", tr: "Deploy scripti nedir?" },
        content: {
          en: "This is the shell script Forge runs on your server during deployment. It typically includes git pull, composer install, npm build, artisan commands, and PHP-FPM reload. You can customize it to fit your workflow.",
          tr: "Bu, Forge'un dağıtım sırasında sunucunuzda çalıştırdığı shell scriptidir. Genellikle git pull, composer install, npm build, artisan komutları ve PHP-FPM yeniden yükleme içerir. İş akışınıza uyacak şekilde özelleştirebilirsiniz.",
        },
      },
      {
        title: { en: "Available variables", tr: "Kullanılabilir değişkenler" },
        content: {
          en: "$FORGE_SITE_BRANCH - the git branch. $FORGE_COMPOSER - composer binary path. $FORGE_PHP - PHP binary path. $FORGE_PHP_FPM - PHP-FPM service name. $FORGE_RELEASE_DIRECTORY - release path (zero-downtime only).",
          tr: "$FORGE_SITE_BRANCH - git dalı. $FORGE_COMPOSER - composer binary yolu. $FORGE_PHP - PHP binary yolu. $FORGE_PHP_FPM - PHP-FPM servis adı. $FORGE_RELEASE_DIRECTORY - release yolu (sadece sıfır-kesinti).",
        },
      },
    ],
  },
  {
    id: "site-logs",
    icon: "terminal",
    title: { en: "Site Logs", tr: "Site Logları" },
    description: {
      en: "View application, Nginx access, and error logs",
      tr: "Uygulama, Nginx erişim ve hata loglarını görüntüleyin",
    },
    items: [
      {
        title: { en: "Log types", tr: "Log türleri" },
        content: {
          en: "Application: your Laravel/PHP application log (storage/logs). Nginx Access: all HTTP requests to your site. Nginx Error: Nginx error log for debugging server issues.",
          tr: "Application: Laravel/PHP uygulama logunuz (storage/logs). Nginx Access: sitenize yapılan tüm HTTP istekleri. Nginx Error: sunucu sorunlarını hata ayıklamak için Nginx hata logu.",
        },
      },
      {
        title: { en: "Color coding", tr: "Renk kodlaması" },
        content: {
          en: "Red lines indicate errors (error, exception, fatal). Yellow lines are warnings. Blue lines are info messages. This helps you quickly spot issues.",
          tr: "Kırmızı satırlar hataları gösterir (error, exception, fatal). Sarı satırlar uyarılardır. Mavi satırlar bilgi mesajlarıdır. Bu, sorunları hızlıca tespit etmenize yardımcı olur.",
        },
      },
    ],
  },
  {
    id: "env",
    icon: "file-code-2",
    title: { en: "Environment", tr: "Ortam Değişkenleri" },
    description: {
      en: "View and edit your .env file securely",
      tr: ".env dosyanızı güvenli bir şekilde görüntüleyin ve düzenleyin",
    },
    items: [
      {
        title: { en: "Syntax highlighting", tr: "Sözdizimi vurgulama" },
        content: {
          en: "Keys are cyan, string values green, numbers orange, booleans purple, variable references amber. Sensitive values (containing password, secret, key, token) are automatically masked.",
          tr: "Anahtarlar cyan, string değerler yeşil, sayılar turuncu, boolean'lar mor, değişken referansları amber. Hassas değerler (password, secret, key, token içerenler) otomatik olarak maskelenir.",
        },
      },
      {
        title: { en: "Editing safely", tr: "Güvenli düzenleme" },
        content: {
          en: "Click Edit to modify. Changes are sent to Forge and applied immediately. Always double-check before saving - there's no undo. A backup of your current .env is recommended before making changes.",
          tr: "Düzenlemek için Edit'e tıklayın. Değişiklikler Forge'a gönderilir ve hemen uygulanır. Kaydetmeden önce mutlaka kontrol edin - geri alma yoktur. Değişiklik yapmadan önce mevcut .env'inizin yedeğini almanız önerilir.",
        },
      },
    ],
  },
  {
    id: "nginx",
    icon: "file-code-2",
    title: { en: "Nginx Config", tr: "Nginx Yapılandırması" },
    description: {
      en: "View and edit the site-level Nginx configuration",
      tr: "Site seviyesi Nginx yapılandırmasını görüntüleyin ve düzenleyin",
    },
    items: [
      {
        title: { en: "What is this?", tr: "Bu nedir?" },
        content: {
          en: "This is the Nginx server block configuration for your site. It controls how Nginx handles requests, SSL, proxy settings, and more. Be careful editing - incorrect config can take your site offline.",
          tr: "Bu, siteniz için Nginx server block yapılandırmasıdır. Nginx'in istekleri, SSL'i, proxy ayarlarını ve daha fazlasını nasıl işlediğini kontrol eder. Düzenlerken dikkatli olun - yanlış yapılandırma sitenizi çevrimdışı yapabilir.",
        },
      },
    ],
  },
  {
    id: "domains",
    icon: "globe",
    title: { en: "Domains & SSL", tr: "Domainler ve SSL" },
    description: {
      en: "Manage domains, SSL certificates, and per-domain Nginx config",
      tr: "Domainleri, SSL sertifikalarını ve domain bazlı Nginx yapılandırmasını yönetin",
    },
    items: [
      {
        title: { en: "Adding a domain", tr: "Domain ekleme" },
        content: {
          en: "Add your domain name (e.g., example.com). Make sure your DNS A record points to your server's IP address before adding. Forge will configure Nginx automatically.",
          tr: "Domain adınızı ekleyin (ör. example.com). Eklemeden önce DNS A kaydınızın sunucunuzun IP adresine işaret ettiğinden emin olun. Forge, Nginx'i otomatik olarak yapılandıracaktır.",
        },
      },
      {
        title: { en: "SSL certificates", tr: "SSL sertifikaları" },
        content: {
          en: "Click 'Install Let's Encrypt' to get a free SSL certificate. Forge will automatically verify domain ownership and install the certificate. Certificates auto-renew before expiry.",
          tr: "Ücretsiz SSL sertifikası almak için 'Install Let's Encrypt'e tıklayın. Forge, domain sahipliğini otomatik olarak doğrulayacak ve sertifikayı kuracaktır. Sertifikalar sona ermeden önce otomatik yenilenir.",
        },
      },
    ],
  },
  {
    id: "integrations",
    icon: "puzzle",
    title: { en: "Integrations", tr: "Entegrasyonlar" },
    description: {
      en: "Toggle Laravel ecosystem integrations",
      tr: "Laravel ekosistem entegrasyonlarını açın/kapatın",
    },
    items: [
      {
        title: { en: "Available integrations", tr: "Mevcut entegrasyonlar" },
        content: {
          en: "Horizon: queue monitoring dashboard. Octane: high-performance server (Swoole/RoadRunner/FrankenPHP). Reverb: WebSocket server. Pulse: application monitoring. Inertia SSR: server-side rendering. Scheduler: Laravel task scheduling. Maintenance: maintenance mode toggle.",
          tr: "Horizon: kuyruk izleme paneli. Octane: yüksek performanslı sunucu (Swoole/RoadRunner/FrankenPHP). Reverb: WebSocket sunucusu. Pulse: uygulama izleme. Inertia SSR: sunucu tarafı render. Scheduler: Laravel görev zamanlama. Maintenance: bakım modu.",
        },
      },
      {
        title: { en: "Enabling/Disabling", tr: "Açma/Kapatma" },
        content: {
          en: "Click the power icon to toggle. Enabling creates the necessary daemon/worker on your server. Disabling removes it. Some integrations require configuration in your application first.",
          tr: "Açmak/kapatmak için güç ikonuna tıklayın. Etkinleştirme, sunucunuzda gerekli daemon/worker'ı oluşturur. Devre dışı bırakma onu kaldırır. Bazı entegrasyonlar önce uygulamanızda yapılandırma gerektirir.",
        },
      },
    ],
  },
  {
    id: "commands",
    icon: "terminal",
    title: { en: "Commands", tr: "Komutlar" },
    description: {
      en: "Execute commands on your server remotely",
      tr: "Sunucunuzda uzaktan komut çalıştırın",
    },
    items: [
      {
        title: { en: "Running commands", tr: "Komut çalıştırma" },
        content: {
          en: "Type a command (e.g., 'php artisan migrate --force') and click Run. The command executes in your site's directory as the 'forge' user. Click on a command in the history to see its output.",
          tr: "Bir komut yazın (ör. 'php artisan migrate --force') ve Run'a tıklayın. Komut, sitenizin dizininde 'forge' kullanıcısı olarak çalıştırılır. Çıktısını görmek için geçmişteki bir komuta tıklayın.",
        },
      },
      {
        title: { en: "Safety tips", tr: "Güvenlik ipuçları" },
        content: {
          en: "Commands run with forge user privileges. Avoid destructive commands without caution. Long-running commands may timeout. Use 'nohup' for background processes.",
          tr: "Komutlar forge kullanıcı yetkileriyle çalışır. Dikkatli olmadan yıkıcı komutlardan kaçının. Uzun süren komutlar zaman aşımına uğrayabilir. Arka plan süreçleri için 'nohup' kullanın.",
        },
      },
    ],
  },
  {
    id: "jobs",
    icon: "clock",
    title: { en: "Scheduled Jobs", tr: "Zamanlanmış Görevler" },
    description: {
      en: "Create and manage cron jobs for your site",
      tr: "Siteniz için cron görevleri oluşturun ve yönetin",
    },
    items: [
      {
        title: { en: "Creating a job", tr: "Görev oluşturma" },
        content: {
          en: "Enter the command, select the frequency (minutely, hourly, daily, etc.), and click Create. The job runs as the 'forge' user. Click on a job to see its last output.",
          tr: "Komutu girin, sıklığı seçin (dakikalık, saatlik, günlük vb.) ve Create'e tıklayın. Görev 'forge' kullanıcısı olarak çalışır. Son çıktısını görmek için bir göreve tıklayın.",
        },
      },
    ],
  },
  {
    id: "redirects",
    icon: "arrow-right",
    title: { en: "Redirect Rules", tr: "Yönlendirme Kuralları" },
    description: {
      en: "Set up URL redirects at the Nginx level",
      tr: "Nginx seviyesinde URL yönlendirmeleri kurun",
    },
    items: [
      {
        title: { en: "Redirect types", tr: "Yönlendirme türleri" },
        content: {
          en: "302 (Temporary): browser doesn't cache, good for testing. 301 (Permanent): browser caches, good for SEO when permanently moving a page. Choose carefully - browsers cache 301s aggressively.",
          tr: "302 (Geçici): tarayıcı önbelleğe almaz, test için iyidir. 301 (Kalıcı): tarayıcı önbelleğe alır, bir sayfayı kalıcı olarak taşırken SEO için iyidir. Dikkatli seçin - tarayıcılar 301'leri agresif şekilde önbelleğe alır.",
        },
      },
    ],
  },
  {
    id: "security",
    icon: "shield",
    title: { en: "Security Rules", tr: "Güvenlik Kuralları" },
    description: {
      en: "Protect paths with HTTP Basic Authentication",
      tr: "HTTP Basic Authentication ile yolları koruyun",
    },
    items: [
      {
        title: { en: "How it works", tr: "Nasıl çalışır" },
        content: {
          en: "Creates an HTTP Basic Auth prompt for the specified path. Visitors must enter the username and password to access that path. Useful for protecting staging sites, admin panels, or development areas.",
          tr: "Belirtilen yol için bir HTTP Basic Auth istemi oluşturur. Ziyaretçilerin o yola erişmek için kullanıcı adı ve şifre girmeleri gerekir. Staging sitelerini, admin panellerini veya geliştirme alanlarını korumak için kullanışlıdır.",
        },
      },
    ],
  },
  {
    id: "webhooks",
    icon: "webhook",
    title: { en: "Webhooks", tr: "Webhook'lar" },
    description: {
      en: "Get notified when deployments happen",
      tr: "Dağıtımlar gerçekleştiğinde bildirim alın",
    },
    items: [
      {
        title: { en: "What are webhooks?", tr: "Webhook'lar nedir?" },
        content: {
          en: "Webhooks send HTTP POST requests to your URL whenever a deployment occurs. Use them to notify Slack, Discord, or trigger custom workflows. The payload includes deployment status and details.",
          tr: "Webhook'lar, bir dağıtım gerçekleştiğinde URL'nize HTTP POST istekleri gönderir. Slack, Discord'a bildirim göndermek veya özel iş akışlarını tetiklemek için kullanın. Payload, dağıtım durumu ve ayrıntılarını içerir.",
        },
      },
    ],
  },
  {
    id: "heartbeats",
    icon: "heart-pulse",
    title: { en: "Heartbeats", tr: "Heartbeat'ler" },
    description: {
      en: "Monitor your site's uptime with heartbeat checks",
      tr: "Heartbeat kontrolleri ile sitenizin çalışma süresini izleyin",
    },
    items: [
      {
        title: { en: "How heartbeats work", tr: "Heartbeat'ler nasıl çalışır" },
        content: {
          en: "Heartbeats periodically ping a URL to verify your site is running. If the URL doesn't respond, you'll be notified. Great for monitoring cron jobs, queue workers, or critical endpoints.",
          tr: "Heartbeat'ler, sitenizin çalışıp çalışmadığını doğrulamak için periyodik olarak bir URL'ye ping atar. URL yanıt vermezse bildirim alırsınız. Cron job'ları, kuyruk worker'ları veya kritik endpoint'leri izlemek için harikadır.",
        },
      },
    ],
  },
  {
    id: "database",
    icon: "database",
    title: { en: "Database", tr: "Veritabanı" },
    description: {
      en: "Manage databases, users, and backups",
      tr: "Veritabanlarını, kullanıcıları ve yedeklemeleri yönetin",
    },
    items: [
      {
        title: { en: "Database management", tr: "Veritabanı yönetimi" },
        content: {
          en: "Create and delete MySQL/PostgreSQL databases. Each database is isolated. Deleting a database permanently removes all its data - this cannot be undone, so you must type the name to confirm.",
          tr: "MySQL/PostgreSQL veritabanları oluşturun ve silin. Her veritabanı izole edilmiştir. Bir veritabanını silmek tüm verilerini kalıcı olarak kaldırır - bu geri alınamaz, bu yüzden onaylamak için adı yazmanız gerekir.",
        },
      },
      {
        title: { en: "Database users", tr: "Veritabanı kullanıcıları" },
        content: {
          en: "Create users with specific database access. Each user has a username and password. You can grant access to specific databases when creating or updating a user.",
          tr: "Belirli veritabanı erişimine sahip kullanıcılar oluşturun. Her kullanıcının bir kullanıcı adı ve şifresi vardır. Bir kullanıcı oluştururken veya güncellerken belirli veritabanlarına erişim verebilirsiniz.",
        },
      },
      {
        title: { en: "Backups", tr: "Yedeklemeler" },
        content: {
          en: "View backup configurations and their instances. Run manual backups, delete old ones, or restore from a backup. Restoring overwrites current data - a confirmation is required.",
          tr: "Yedekleme yapılandırmalarını ve örneklerini görüntüleyin. Manuel yedekleme çalıştırın, eskileri silin veya bir yedekten geri yükleyin. Geri yükleme mevcut verilerin üzerine yazar - onay gereklidir.",
        },
      },
    ],
  },
];
