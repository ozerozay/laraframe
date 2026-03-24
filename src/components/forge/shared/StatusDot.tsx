interface StatusDotProps {
  active: boolean;
  className?: string;
  size?: "sm" | "md";
}

export function StatusDot({ active, className = "", size = "sm" }: StatusDotProps) {
  const s = size === "sm" ? "h-2 w-2" : "h-2.5 w-2.5";
  return (
    <span className={`relative flex ${s} ${className}`}>
      {active && (
        <span className={`absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75`} />
      )}
      <span
        className={`relative inline-flex ${s} rounded-full ${
          active ? "bg-emerald-500" : "bg-zinc-500"
        }`}
      />
    </span>
  );
}
