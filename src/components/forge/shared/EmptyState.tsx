import type { LucideIcon } from "lucide-react";

interface EmptyStateProps {
  icon: LucideIcon;
  title: string;
  description?: string;
  action?: React.ReactNode;
}

export function EmptyState({ icon: Icon, title, description, action }: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center gap-3 py-16 text-muted-foreground">
      <div className="flex h-12 w-12 items-center justify-center rounded-full bg-muted/20">
        <Icon className="h-5 w-5 opacity-40" />
      </div>
      <div className="text-center">
        <p className="text-xs font-medium">{title}</p>
        {description && (
          <p className="mt-0.5 text-xs text-muted-foreground/60 max-w-xs">{description}</p>
        )}
      </div>
      {action && <div className="mt-2">{action}</div>}
    </div>
  );
}
