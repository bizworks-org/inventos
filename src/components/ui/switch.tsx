"use client";

import * as React from "react";
import * as SwitchPrimitive from "@radix-ui/react-switch";

import { cn } from "./utils";

function Switch({ className, ...props }: React.ComponentProps<typeof SwitchPrimitive.Root>) {
  // Pull out checked and onCheckedChange so we can provide a click fallback
  const { checked, onCheckedChange, ...rest } = props as any;

  const handleClick = (e: React.MouseEvent) => {
    // If a handler is provided, call it with the toggled value as a fallback
    try {
      if (typeof onCheckedChange === 'function') {
        // Log so developers can see fallback invocation in console when testing
        // eslint-disable-next-line no-console
        console.log('[Switch] fallback onClick -> onCheckedChange', { checked, toggled: !checked });
        onCheckedChange(!!(!checked));
      }
    } catch { }
    // allow event to continue to Radix
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    try {
      if (e.key === ' ' || e.key === 'Spacebar' || e.key === 'Enter') {
        if (typeof onCheckedChange === 'function') {
          // eslint-disable-next-line no-console
          console.log('[Switch] fallback onKeyDown -> onCheckedChange', { checked, toggled: !checked, key: e.key });
          onCheckedChange(!!(!checked));
        }
        // prevent default scrolling when space pressed
        e.preventDefault();
      }
    } catch { }
  };

  return (
    <SwitchPrimitive.Root
      data-slot="switch"
      className={cn(
        "group bg-switch-background group-[data-state=checked]:bg-[#34C759] focus-visible:border-ring focus-visible:ring-ring/50 dark:group-[data-state=unchecked]:bg-input/80 relative inline-flex h-7 w-12 shrink-0 items-center rounded-full border border-transparent p-1 shadow-sm transition-colors outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-primary/30 disabled:cursor-not-allowed disabled:opacity-50",
        className,
      )}
  onClick={handleClick}
  onKeyDown={handleKeyDown}
  {...(rest as any)}
      // keep passing the original handler so Radix still receives it
      onCheckedChange={onCheckedChange}
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
