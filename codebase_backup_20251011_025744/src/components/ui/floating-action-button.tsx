import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"
import { cn } from "@/lib/utils"

const fabVariants = cva(
  "fixed inline-flex items-center justify-center rounded-full text-sm font-medium transition-all duration-300 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 shadow-elegant hover:shadow-glow z-50",
  {
    variants: {
      variant: {
        default: "bg-primary text-primary-foreground hover:bg-primary/90 hover:scale-110 active:scale-100",
        secondary: "bg-secondary text-secondary-foreground hover:bg-secondary/80 hover:scale-110 active:scale-100",
        success: "bg-green-600 text-white hover:bg-green-700 hover:scale-110 active:scale-100",
        warning: "bg-yellow-600 text-white hover:bg-yellow-700 hover:scale-110 active:scale-100",
        destructive: "bg-destructive text-destructive-foreground hover:bg-destructive/90 hover:scale-110 active:scale-100",
        glass: "bg-background/20 backdrop-blur-md border border-white/10 text-foreground hover:bg-background/30 hover:scale-110 active:scale-100",
        gradient: "bg-gradient-wave text-primary-foreground hover:opacity-90 hover:scale-110 active:scale-100",
      },
      size: {
        default: "h-14 w-14",
        sm: "h-12 w-12",
        lg: "h-16 w-16",
        xl: "h-20 w-20",
      },
      position: {
        "bottom-right": "bottom-6 right-6",
        "bottom-left": "bottom-6 left-6",
        "top-right": "top-6 right-6",
        "top-left": "top-6 left-6",
        "bottom-center": "bottom-6 left-1/2 transform -translate-x-1/2",
        "top-center": "top-6 left-1/2 transform -translate-x-1/2",
      },
      animation: {
        none: "",
        pulse: "animate-pulse",
        bounce: "animate-bounce",
        float: "animate-float",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
      position: "bottom-right",
      animation: "none",
    },
  }
)

export interface FloatingActionButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof fabVariants> {
  badge?: string | number
  tooltip?: string
}

const FloatingActionButton = React.forwardRef<HTMLButtonElement, FloatingActionButtonProps>(
  ({ className, variant, size, position, animation, badge, tooltip, children, ...props }, ref) => {
    return (
      <div className="relative">
        <button
          className={cn(fabVariants({ variant, size, position, animation, className }))}
          ref={ref}
          title={tooltip}
          {...props}
        >
          {children}
          {badge && (
            <span className="absolute -top-2 -right-2 inline-flex items-center justify-center px-2 py-1 text-xs font-bold leading-none text-white bg-red-600 rounded-full min-w-[1.25rem] h-5">
              {badge}
            </span>
          )}
        </button>
      </div>
    )
  }
)

FloatingActionButton.displayName = "FloatingActionButton"

export { FloatingActionButton, fabVariants }