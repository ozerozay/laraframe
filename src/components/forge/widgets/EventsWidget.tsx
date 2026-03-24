import { useState } from "react";
import { Clock, RefreshCw } from "lucide-react";
import { ScrollArea } from "@/components/ui/scroll-area";
import { timeAgo } from "@/lib/helpers";
import { t } from "@/lib/i18n";
import { EmptyState } from "../shared/EmptyState";
import { cachedFetch } from "@/lib/cache";
import { forgeGetEvents, type ForgeEvent } from "@/lib/tauri";

interface Props {
  token: string;
  orgSlug: string;
  serverId: string;
}

export function EventsWidget({ token, orgSlug, serverId }: Props) {
  const [events, setEvents] = useState<ForgeEvent[]>([]);
  const [loaded, setLoaded] = useState(false);
  const [loading, setLoading] = useState(false);

  if (!loaded && !loading) {
    setLoading(true);
    cachedFetch(`server:${serverId}:events`, () => forgeGetEvents(token, orgSlug, serverId))
      .then((e) => { setEvents(e); setLoaded(true); })
      .catch(() => setLoaded(true))
      .finally(() => setLoading(false));
  }

  if (loading) {
    return (
      <div className="flex h-32 items-center justify-center">
        <RefreshCw className="h-4 w-4 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (events.length === 0) {
    return <EmptyState icon={Clock} title={t("forge.noEvents")} description={t("forge.noEventsDesc")} />;
  }

  return (
    <ScrollArea className="h-[calc(100vh-300px)]">
      <div className="relative">
        <div className="absolute left-[19px] top-3 bottom-3 w-px bg-border/40" />
        <div className="space-y-0">
          {events.map((event, i) => (
            <div
              key={event.id || i}
              className="group relative flex items-start gap-3 px-1 py-2.5 hover:bg-muted/20 rounded-md transition-colors"
            >
              <div className="relative z-10 mt-1 flex h-[14px] w-[14px] shrink-0 items-center justify-center rounded-full border-2 border-background bg-muted-foreground/20 ml-[13px]">
                <div
                  className={`h-1.5 w-1.5 rounded-full ${
                    event.status === "finished" ? "bg-emerald-500"
                    : event.status === "failed" ? "bg-red-500"
                    : "bg-muted-foreground/50"
                  }`}
                />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-[13px] leading-snug">{event.description}</p>
                <p className="text-[10px] text-muted-foreground mt-0.5">{timeAgo(event.created_at)}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </ScrollArea>
  );
}
