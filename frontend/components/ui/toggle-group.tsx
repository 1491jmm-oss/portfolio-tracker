import { cn } from "@/lib/utils";

export function ToggleGroup<T extends string>({
  items,
  value,
  onChange,
  labels,
}: {
  items: T[];
  value: T;
  onChange: (value: T) => void;
  labels?: Partial<Record<T, string>>;
}) {
  return (
    <div className="inline-flex rounded-md border border-border bg-muted/60 p-0.5">
      {items.map((item) => (
        <button
          key={item}
          type="button"
          onClick={() => onChange(item)}
          className={cn(
            "h-7 rounded-sm px-2.5 text-xs font-medium text-muted-foreground transition-colors",
            value === item && "bg-primary text-primary-foreground shadow-sm",
          )}
        >
          {labels?.[item] ?? item}
        </button>
      ))}
    </div>
  );
}
