import { useEffect } from "react";
import { check } from "@tauri-apps/plugin-updater";
import { relaunch } from "@tauri-apps/plugin-process";
import { toast } from "sonner";

export function useAutoUpdate() {
  useEffect(() => {
    const checkUpdate = async () => {
      try {
        const update = await check();
        if (update) {
          toast(`Update ${update.version} available`, {
            description: "A new version of LaraFrame is available.",
            duration: 15000,
            action: {
              label: "Update Now",
              onClick: async () => {
                const toastId = toast.loading("Downloading update...");
                try {
                  await update.downloadAndInstall();
                  toast.success("Update installed! Restarting...", { id: toastId });
                  await relaunch();
                } catch (err) {
                  toast.error(`Update failed: ${err}`, { id: toastId });
                }
              },
            },
          });
        }
      } catch {
        // Silently fail - dev mode or no internet
      }
    };

    // Check after 5 seconds (don't block startup)
    const timer = setTimeout(checkUpdate, 5000);
    return () => clearTimeout(timer);
  }, []);
}
