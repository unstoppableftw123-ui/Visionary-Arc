import * as React from "react"
import { cn } from "../../lib/utils"

/**
 * Input
 *
 * Focus: brand-colour ring glow (box-shadow from index.css picks up the rest)
 * Valid:    green border + ring  — set data-valid="true" or class "input-valid"
 * Invalid:  red border + ring   — set aria-invalid="true" (ARIA standard)
 *           Shake:              — add class "field-shake" via JS on failed submit
 */
const Input = React.forwardRef(({ className, type, ...props }, ref) => {
  return (
    <input
      type={type}
      className={cn(
        // Layout
        "flex min-h-11 w-full rounded-md border bg-transparent px-3 py-2",
        "text-base md:text-sm shadow-sm",
        // Colour tokens
        "border-input placeholder:text-muted-foreground",
        // Smooth all transitions (border, shadow, ring)
        "transition-all duration-200 ease-out",
        // Focus — ring expands with brand colour; box-shadow from index.css
        "focus-visible:outline-none",
        "focus-visible:border-ring focus-visible:ring-1 focus-visible:ring-ring/60",
        // Valid state (data-valid="true")
        "data-[valid=true]:border-emerald-500",
        "data-[valid=true]:focus-visible:ring-emerald-500/50",
        // Invalid state (aria-invalid="true")
        "aria-[invalid=true]:border-destructive",
        "aria-[invalid=true]:focus-visible:ring-destructive/40",
        // Disabled
        "file:border-0 file:bg-transparent file:text-sm file:font-medium file:text-foreground",
        "disabled:cursor-not-allowed disabled:opacity-50",
        className
      )}
      ref={ref}
      {...props}
    />
  )
})
Input.displayName = "Input"

export { Input }
