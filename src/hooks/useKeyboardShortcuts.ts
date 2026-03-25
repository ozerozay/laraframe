import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { invalidateCache } from "@/lib/cache";

export function useKeyboardShortcuts() {
  const navigate = useNavigate();

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      const meta = e.metaKey || e.ctrlKey;

      if (meta && e.key === "1") { e.preventDefault(); navigate("/"); }
      if (meta && e.key === "2") { e.preventDefault(); navigate("/forge"); }
      if (meta && e.key === "3") { e.preventDefault(); navigate("/cloud"); }
      if (meta && e.key === "4") { e.preventDefault(); navigate("/nightwatch"); }
      if (meta && e.key === "5") { e.preventDefault(); navigate("/settings"); }
      if (meta && e.key === "r") { e.preventDefault(); invalidateCache(); window.location.reload(); }
    };

    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [navigate]);
}
