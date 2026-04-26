import * as React from "react"
import { Slot } from "@radix-ui/react-slot"
import { cva } from "class-variance-authority";

import { cn } from "../../lib/utils"

const buttonVariants = cva(
  // ── Base ────────────────────────────────────────────────────────────────
  // transition-all covers transform + shadow + color together.
  // active:scale-95 gives a satisfying press-down feel on every variant.
  // disabled: pointer-events-none prevents hover/active from ever firing
  // on disabled buttons, so no extra disabled:transform-none needed.
  [
    "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md",
    "min-h-11 text-base font-medium md:text-sm",
    "transition-all duration-150 ease-out",
    "focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring",
    "disabled:pointer-events-none disabled:opacity-50",
    "active:scale-95 active:translate-y-0",
    "[&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0",
  ].join(" "),
  {
    variants: {
      variant: {
        // Solid variants: lift + deepen shadow on hover
        default:
          "bg-primary text-primary-foreground shadow " +
          "hover:bg-primary/90 hover:-translate-y-0.5 hover:shadow-hover",
        destructive:
          "bg-destructive text-destructive-foreground shadow-rest" +
          "hover:bg-destructive/90 hover:-translate-y-0.5 hover:shadow-hover",
        outline:
          "border border-input bg-background shadow-rest" +
          "hover:bg-accent hover:text-accent-foreground hover:-translate-y-0.5 hover:shadow-hover",
        secondary:
          "bg-secondary text-secondary-foreground shadow-rest" +
          "hover:bg-secondary/80 hover:-translate-y-0.5 hover:shadow-hover",
        // Subtle variants: no lift, no shadow
        ghost:
          "hover:bg-accent hover:text-accent-foreground",
        link:
          "text-primary underline-offset-4 hover:underline",
      },
      size: {
        default: "h-11 px-4 py-2",
        sm:      "h-11 rounded-md px-3 text-sm md:h-11 md:text-xs",
        lg:      "h-12 rounded-md px-8",

        // Icon-only: SVG children rotate + scale on hover; bounce on click
        icon: [
          "h-11 w-11",
          // SVG base transition (spring easing from tailwind.config)
          "[&>svg]:transition-transform [&>svg]:duration-200 [&>svg]:ease-spring",
          // Hover: scale + slight rotation
          "hover:[&>svg]:scale-110 hover:[&>svg]:rotate-[8deg]",
          // Active: snap back — CSS handles the spring release
          "active:[&>svg]:scale-90 active:[&>svg]:rotate-0",
        ].join(" "),
      },
    },
    defaultVariants: {
      variant: "default",
      size:    "default",
    },
  }
)

const Button = React.forwardRef(({ className, variant, size, asChild = false, ...props }, ref) => {
  const Comp = asChild ? Slot : "button"
  return (
    <Comp
      className={cn(buttonVariants({ variant, size, className }))}
      ref={ref}
      {...props}
    />
  )
})
Button.displayName = "Button"

export { Button, buttonVariants }
