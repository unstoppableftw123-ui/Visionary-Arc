import * as React from "react"
import { cn } from "../../lib/utils"

/**
 * Textarea — same focus / valid / invalid treatment as Input.
 */
const Textarea = React.forwardRef(({ className, ...props }, ref) => {
  return (
    <textarea
      className={cn(
        "flex min-h-[88px] w-full rounded-md border bg-transparent px-3 py-2.5",
        "text-base md:text-sm shadow-sm",
        "border-input placeholder:text-muted-foreground",
        "transition-all duration-200 ease-out",
        "focus-visible:outline-none",
        "focus-visible:border-ring focus-visible:ring-1 focus-visible:ring-ring/60",
        "data-[valid=true]:border-emerald-500",
        "data-[valid=true]:focus-visible:ring-emerald-500/50",
        "aria-[invalid=true]:border-destructive",
        "aria-[invalid=true]:focus-visible:ring-destructive/40",
        "disabled:cursor-not-allowed disabled:opacity-50",
        className
      )}
      ref={ref}
      {...props}
    />
  )
})
Textarea.displayName = "Textarea"

export { Textarea }
