import { NavLink } from "react-router-dom";
import {
  Server,
  Cloud,
  Activity,
  Bot,
  Settings,
  Sun,
  Moon,
  LayoutDashboard,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { useTheme } from "@/stores/theme";

const navItems = [
  { to: "/", icon: LayoutDashboard, label: "Dashboard" },
  { to: "/forge", icon: Server, label: "Forge" },
  { to: "/cloud", icon: Cloud, label: "Cloud" },
  { to: "/nightwatch", icon: Activity, label: "Nightwatch" },
  { to: "/ai", icon: Bot, label: "AI Assistant" },
];

export function Sidebar() {
  const { theme, toggleTheme } = useTheme();

  return (
    <aside className="flex h-screen w-16 flex-col items-center border-r border-border bg-sidebar py-4">
      <div className="mb-4 flex h-10 w-10 items-center justify-center rounded-lg bg-primary font-bold text-primary-foreground text-sm">
        LF
      </div>

      <Separator className="mb-4 w-8" />

      <nav className="flex flex-1 flex-col items-center gap-2">
        {navItems.map((item) => (
          <NavLink key={item.to} to={item.to} end={item.to === "/"}>
            {({ isActive }) => (
              <Tooltip>
                <TooltipTrigger
                  render={
                    <Button
                      variant={isActive ? "secondary" : "ghost"}
                      size="icon"
                      className="h-10 w-10"
                    >
                      <item.icon className="h-5 w-5" />
                    </Button>
                  }
                />
                <TooltipContent side="right">{item.label}</TooltipContent>
              </Tooltip>
            )}
          </NavLink>
        ))}
      </nav>

      <div className="flex flex-col items-center gap-2">
        <Tooltip>
          <TooltipTrigger
            render={
              <Button
                variant="ghost"
                size="icon"
                className="h-10 w-10"
                onClick={toggleTheme}
              >
                {theme === "dark" ? (
                  <Sun className="h-5 w-5" />
                ) : (
                  <Moon className="h-5 w-5" />
                )}
              </Button>
            }
          />
          <TooltipContent side="right">
            {theme === "dark" ? "Light mode" : "Dark mode"}
          </TooltipContent>
        </Tooltip>

        <NavLink to="/settings">
          {({ isActive }) => (
            <Tooltip>
              <TooltipTrigger
                render={
                  <Button
                    variant={isActive ? "secondary" : "ghost"}
                    size="icon"
                    className="h-10 w-10"
                  >
                    <Settings className="h-5 w-5" />
                  </Button>
                }
              />
              <TooltipContent side="right">Settings</TooltipContent>
            </Tooltip>
          )}
        </NavLink>
      </div>
    </aside>
  );
}
