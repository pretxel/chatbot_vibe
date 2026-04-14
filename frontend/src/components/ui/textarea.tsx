import { cn } from "@/lib/utils";
import type * as React from "react";

function Textarea({ className, ...props }: React.ComponentProps<"textarea">) {
  return (
    <textarea
      data-slot="textarea"
      className={cn(
        "flex w-full rounded-lg border border-input bg-transparent px-3 py-2 text-sm",
        "placeholder:text-muted-foreground transition-colors outline-none",
        "focus-visible:border-ring focus-visible:ring-2 focus-visible:ring-ring/30",
        "disabled:cursor-not-allowed disabled:opacity-50",
        className,
      )}
      {...props}
    />
  );
}

export { Textarea };
