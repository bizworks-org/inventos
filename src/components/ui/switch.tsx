"use client";

import * as React from "react";
import * as SwitchPrimitive from "@radix-ui/react-switch@1.1.3";

import { cn } from "./utils";

function Switch({
  className,
  ...props
}: React.ComponentProps<typeof SwitchPrimitive.Root>) {
  return (
    <SwitchPrimitive.Root
      data-slot="switch"
      className={cn(
        "group bg-switch-background group-[data-state=checked]:bg-[#34C759] focus-visible:border-ring focus-visible:ring-ring/50 dark:group-[data-state=unchecked]:bg-input/80 relative inline-flex h-7 w-12 shrink-0 items-center rounded-full border border-transparent p-1 shadow-sm transition-colors outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-primary/30 disabled:cursor-not-allowed disabled:opacity-50",
        className,
      )}
      {...props}
    >
      <SwitchPrimitive.Thumb
        data-slot="switch-thumb"
        className={cn(
          "absolute top-1/2 left-1 -translate-y-1/2 bg-white dark:bg-card-foreground pointer-events-none h-5 w-5 rounded-full ring-0 transition-all duration-200 shadow-sm border border-gray-200 dark:border-transparent translate-x-0 group-[data-state=checked]:left-auto group-[data-state=checked]:right-1 data-[state=checked]:left-auto data-[state=checked]:right-1",
        )}
      />
    </SwitchPrimitive.Root>
  );
}

export { Switch };
