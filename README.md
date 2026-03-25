# LaraFrame

<p align="center">
  <strong>A unified desktop client for the Laravel ecosystem</strong><br>
  Manage Laravel Forge, Cloud, and Nightwatch from one application.
</p>

<p align="center">
  <img src="https://img.shields.io/badge/Tauri-v2-blue" alt="Tauri v2" />
  <img src="https://img.shields.io/badge/React-19-61DAFB" alt="React 19" />
  <img src="https://img.shields.io/badge/Rust-2024-orange" alt="Rust" />
  <img src="https://img.shields.io/badge/MCP-47_tools-green" alt="MCP Tools" />
  <img src="https://img.shields.io/badge/License-MIT-yellow" alt="MIT" />
</p>

---

## Why LaraFrame?

Instead of switching between Forge dashboard, Cloud dashboard, and Nightwatch — manage everything from one desktop app. Deploy sites, manage databases, view logs, run commands, monitor metrics — all without opening a browser.

> **No account, no login, no server, no tracking.** LaraFrame runs 100% locally on your machine. Your API tokens are stored in your OS Keychain (macOS Keychain / Windows Credential Manager) — never sent anywhere except directly to Laravel's APIs. There is no LaraFrame backend, no analytics, no telemetry. Your data stays on your computer.

Plus, AI tools like Claude Code, Cursor, and Windsurf can control your infrastructure through the built-in MCP server.

## Features

### Laravel Forge (Complete API Coverage)

**Server Management**
- Server list with status indicators
- Database management (schemas, users, backups, restore)
- Background processes / daemons (CRUD + restart + logs)
- SSH key management
- Firewall rules (allow/deny)
- PHP version management (install/remove)
- Service control (Nginx, MySQL, PHP, Redis, Postgres restart/stop/start)
- Server reboot (with type-to-confirm safety)
- Recipes (create, edit, run across servers)
- Server monitors, events timeline, server logs

**Site Management (14 tabs)**
| Tab | Features |
|-----|----------|
| Deployments | Deploy, deployment history with inline logs, commit details |
| Script | View/edit deploy script with bash syntax highlighting |
| Logs | Application, Nginx access/error logs with color-coded lines |
| Environment | .env editor with syntax highlighting (keys, values, comments, sensitive masking) |
| Nginx | View/edit Nginx configuration |
| Domains & SSL | Domain CRUD, per-domain Nginx config, Let's Encrypt SSL (one click) |
| Integrations | Toggle Horizon, Octane, Reverb, Pulse, Inertia SSR, Scheduler, Maintenance Mode |
| Commands | Run server commands, view output history |
| Scheduled Jobs | Cron job management with output viewer |
| Redirects | 301/302 redirect rules |
| Security | HTTP Basic Auth rules |
| Webhooks | Deployment webhook URLs |
| Heartbeats | Uptime monitoring heartbeats |
| Health | Healthcheck URL configuration |

### Laravel Cloud (Full API Coverage)

**Global Resources**
- Applications (create, delete, manage)
- Database clusters & standalone databases (CRUD + snapshots + restore)
- Caches — Redis/Valkey (CRUD + metrics)
- Object Storage — R2 buckets + access keys
- WebSocket servers — Reverb clusters

**Environment Management (8 tabs)**
| Tab | Features |
|-----|----------|
| Deployments | Deploy, history with logs, commit info |
| Commands | Run commands with confirmation, output history |
| Instances | App/Queue/Service instances, scaling config, size management |
| Domains | Custom domains with DNS/SSL verification status |
| Variables | Environment variables with syntax highlighting, sensitive masking, inline edit |
| Logs | Real-time logs with time range selector (15m/1h/6h/24h), color-coded levels |
| Processes | Background processes per instance |
| Metrics | CPU, memory, HTTP response count, replica count — bar charts |

### Nightwatch

Nightwatch doesn't have a REST API, so LaraFrame provides:
- **Dashboard link** — Open Nightwatch in browser
- **MCP setup guide** — Connect AI tools to Nightwatch (Claude Code, Claude Desktop, Cursor, Windsurf)
- **Webhook reference** — Event types and payload documentation
- **Setup guide** — Installation instructions for Laravel apps

### MCP Server (AI Integration)

LaraFrame includes a built-in MCP (Model Context Protocol) server with **47 tools** that any AI assistant can use to manage your infrastructure.

**Forge Tools (27)**
```
forge_list_servers    forge_list_sites      forge_deploy
forge_get_env         forge_update_env      forge_run_command
forge_site_log        forge_server_log      forge_service_action
forge_reboot_server   forge_list_databases  forge_list_domains
forge_list_ssh_keys   forge_list_firewall   forge_list_daemons
forge_list_events     forge_deployment_log  forge_get_nginx
forge_get_deploy_script                     ...and more
```

**Cloud Tools (20)**
```
cloud_list_apps           cloud_deploy              cloud_run_command
cloud_list_environments   cloud_start_environment   cloud_stop_environment
cloud_environment_logs    cloud_environment_metrics  cloud_list_instances
cloud_list_domains        cloud_add_variables       cloud_delete_variables
cloud_list_databases      cloud_list_caches         cloud_list_buckets
cloud_list_websocket_servers                        ...and more
```

**Supported AI Tools**
| Tool | Config Location |
|------|----------------|
| Claude Code | `.mcp.json` (project root) |
| Claude Desktop | `~/Library/Application Support/Claude/claude_desktop_config.json` |
| Cursor | `.cursor/mcp.json` |
| Windsurf | `~/.codeium/windsurf/mcp_config.json` |
| VS Code | `.vscode/mcp.json` |

**Setup:** Go to **Settings > MCP Setup** in the app — select your AI tool, click **Copy Config**, paste into the config file. MCP server path and API tokens are auto-detected.

### Security

- All API tokens stored in **OS Keychain** (macOS Keychain, Windows Credential Manager)
- **Confirmation dialogs** on all destructive operations (delete, stop, reboot)
- **Type-to-confirm** on critical operations (database delete, site delete, server reboot, domain delete)
- **Sensitive value masking** in .env viewer (passwords, secrets, tokens, keys)
- **Rate limit protection** — API responses cached (60 req/min Forge limit respected)
- No tokens stored in config files or local storage

### UX

- **Multi-language** — English & Turkish (extensible)
- **Dark & Light mode** with theme persistence
- **Help Center** — Context-sensitive help panel (slide-out, per-tab documentation)
- **Toast notifications** — Deploy status, save confirmations, error messages
- **Keyboard shortcuts** — `Cmd+1-5` page navigation, `Cmd+R` refresh
- **Lazy loading** — Pages load on demand, API calls only when needed
- **Cache system** — Prevents redundant API calls, manual refresh available
- **Error boundaries** — Graceful error handling with recovery

## Tech Stack

| Layer | Technology |
|-------|------------|
| Desktop Runtime | [Tauri v2](https://tauri.app) |
| Frontend | React 19, TypeScript, [Tailwind CSS v4](https://tailwindcss.com), [shadcn/ui](https://ui.shadcn.com) |
| Backend | Rust |
| API Client | reqwest (Rust) — Forge & Cloud API |
| Storage | OS Keychain (secrets), SQLite (local cache) |
| MCP Server | Node.js, [@modelcontextprotocol/sdk](https://github.com/modelcontextprotocol/sdk) |
| Icons | [Lucide](https://lucide.dev) |
| Notifications | [Sonner](https://sonner.emilkowal.dev) |

## Getting Started

### Prerequisites

- [Node.js](https://nodejs.org) v20+
- [Rust](https://rustup.rs)
- Package manager: pnpm, npm, or yarn

### Development

```bash
# Clone the repo
git clone https://github.com/ozerozay/laraframe.git
cd laraframe

# Install dependencies
pnpm install

# Run in development mode
pnpm tauri dev

# Build for production
pnpm tauri build
```

### MCP Server

The MCP server can be built from within the app (**Settings > MCP Setup > Build Now**) or manually:

```bash
cd mcp-server
pnpm install
pnpm build
```

## Project Structure

```
laraframe/
├── src/                          # React frontend
│   ├── components/
│   │   ├── forge/                # Forge components
│   │   │   ├── widgets/          # 30+ widget components
│   │   │   └── shared/           # Reusable (LogViewer, EnvHighlighted, etc.)
│   │   ├── cloud/                # Cloud components
│   │   │   └── widgets/          # 15+ widget components
│   │   ├── settings/             # Settings components (MCP Setup)
│   │   ├── layout/               # App layout, sidebar
│   │   └── ui/                   # shadcn/ui components
│   ├── pages/                    # Route pages
│   ├── lib/                      # Utilities (tauri API, cache, i18n, helpers)
│   └── hooks/                    # React hooks
├── src-tauri/                    # Rust backend
│   └── src/
│       ├── api/
│       │   ├── forge.rs          # 90+ Forge API endpoints
│       │   └── cloud.rs          # 85+ Cloud API endpoints
│       ├── db/                   # SQLite database
│       └── keychain/             # OS Keychain integration
├── mcp-server/                   # MCP server (Node.js)
│   └── src/
│       ├── index.ts              # 47 MCP tools
│       ├── forge-client.ts       # Forge API client
│       └── cloud-client.ts       # Cloud API client
└── README.md
```

## Keyboard Shortcuts

| Shortcut | Action |
|----------|--------|
| `Cmd/Ctrl + 1` | Dashboard |
| `Cmd/Ctrl + 2` | Forge |
| `Cmd/Ctrl + 3` | Cloud |
| `Cmd/Ctrl + 4` | Nightwatch |
| `Cmd/Ctrl + 5` | Settings |
| `Cmd/Ctrl + R` | Refresh & clear cache |

## API Coverage

| Service | Rust Endpoints | UI Widgets | MCP Tools |
|---------|---------------|------------|-----------|
| Laravel Forge | 90+ | 30+ | 27 |
| Laravel Cloud | 85+ | 15+ | 20 |
| Nightwatch | — | MCP guide | — |
| **Total** | **175+** | **45+** | **47** |

## Contributing

Contributions are welcome! Please open an issue or pull request.

## License

[MIT](LICENSE)

## Disclaimer

LaraFrame is not affiliated with or endorsed by Laravel LLC. "Laravel" is a registered trademark of Taylor Otwell.
