import * as React from "react"
import * as TabsPrimitive from "@radix-ui/react-tabs"

import { cn } from "../../lib/utils"

const Tabs = TabsPrimitive.Root

/**
 * TabsList
 * Unchanged visually — the pill-shaped container.
 * The ::after underline indicator per-trigger is driven by index.css.
 */
const TabsList = React.forwardRef(({ className, ...props }, ref) => (
  <TabsPrimitive.List
    ref={ref}
    className={cn(
      "inline-flex min-h-11 items-center justify-center rounded-full bg-secondary/40 p-1 text-muted-foreground/70",
      className
    )}
    {...props}
  />
))
TabsList.displayName = TabsPrimitive.List.displayName

/**
 * TabsTrigger
 * — Pill highlight transitions with spring easing (index.css overrides timing)
 * — ::after underline draws in from center on active (index.css)
 * — Inactive tabs lift slightly on hover for extra affordance
 */
const TabsTrigger = React.forwardRef(({ className, ...props }, ref) => (
  <TabsPrimitive.Trigger
    ref={ref}
    className={cn(
      "inline-flex min-h-11 items-center justify-center whitespace-nowrap rounded-full px-4 py-2 text-base font-medium md:text-sm",
      // Transition handled via index.css (spring easing override)
      "transition-all duration-200",
      "focus-visible:outline-none",
      "disabled:pointer-events-none disabled:opacity-50",
      // Active state: background pill + full opacity
      "data-[state=active]:bg-background data-[state=active]:text-foreground data-[state=active]:shadow-sm",
      // Inactive hover: subtle lift
      "data-[state=inactive]:hover:text-foreground/80 data-[state=inactive]:hover:bg-background/40",
      className
    )}
    {...props}
  />
))
TabsTrigger.displayName = TabsPrimitive.Trigger.displayName

/**
 * TabsContent
 * — animate-tab-in: fade + 5 px rise (defined in tailwind.config keyframes)
 *   Runs each time the tab panel is mounted/switched.
 */
const TabsContent = React.forwardRef(({ className, ...props }, ref) => (
  <TabsPrimitive.Content
    ref={ref}
    className={cn(
      "mt-3 ring-offset-background",
      "focus-visible:outline-none",
      // Crossfade: fade in + slight translateY (tab-in keyframe in tailwind.config)
      "animate-tab-in",
      // Ensure inactive tabs are hidden even when flex/grid display classes are applied
      // (Tailwind's data variant has higher specificity than generic class selectors)
      "data-[state=inactive]:hidden",
      className
    )}
    {...props}
  />
))
TabsContent.displayName = TabsPrimitive.Content.displayName

export { Tabs, TabsList, TabsTrigger, TabsContent }
