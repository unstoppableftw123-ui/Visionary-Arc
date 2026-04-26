import { useTheme } from "next-themes"
import { Toaster as Sonner } from "sonner"

/**
 * Toaster
 *
 * Configuration:
 *   position      — top-right (slide in from top-right corner)
 *   duration      — 3 000 ms auto-dismiss
 *   richColors    — success=green, error=red, info=blue, warning=amber
 *   closeButton   — small × to manually dismiss
 *   swipeToDismiss — (Sonner default: enabled) swipe right to dismiss
 *   gap           — 8 px between stacked toasts
 *
 * Style tokens match the app's design system via CSS custom properties.
 */
const Toaster = ({ ...props }) => {
  const { theme = "system" } = useTheme()

  return (
    <Sonner
      theme={theme}
      position="top-right"
      duration={3000}
      richColors
      closeButton
      gap={8}
      className="toaster group"
      toastOptions={{
        classNames: {
          // Base toast card
          toast: [
            "group toast",
            "group-[.toaster]:bg-background",
            "group-[.toaster]:text-foreground",
            "group-[.toaster]:border-border",
            "group-[.toaster]:shadow-lg",
            // Smooth enter from right
            "group-[.toaster]:rounded-xl",
          ].join(" "),
          description: "group-[.toast]:text-muted-foreground group-[.toast]:text-sm",
          actionButton:
            "group-[.toast]:bg-primary group-[.toast]:text-primary-foreground group-[.toast]:rounded-md",
          cancelButton:
            "group-[.toast]:bg-muted group-[.toast]:text-muted-foreground group-[.toast]:rounded-md",
          // Close button
          closeButton: [
            "group-[.toaster]:border-border",
            "group-[.toaster]:bg-background",
            "group-[.toaster]:hover:bg-accent",
            "group-[.toaster]:transition-colors",
          ].join(" "),
        },
      }}
      {...props}
    />
  )
}

export { Toaster }
