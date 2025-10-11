import * as React from "react"
import { Slot } from "@radix-ui/react-slot"
import { cva, type VariantProps } from "class-variance-authority"
import { cn } from "@/lib/utils"

const enhancedButtonVariants = cva(
  "inline-flex items-center justify-center whitespace-nowrap rounded-lg text-sm font-medium transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50",
  {
    variants: {
      variant: {
        default: "bg-primary text-primary-foreground hover:bg-primary/90 hover:scale-105 active:scale-100 shadow-soft hover:shadow-elegant",
        destructive: "bg-destructive text-destructive-foreground hover:bg-destructive/90 hover:scale-105 active:scale-100 shadow-soft hover:shadow-elegant",
        outline: "border border-input bg-background hover:bg-accent hover:text-accent-foreground hover:scale-105 active:scale-100 shadow-soft hover:shadow-elegant",
        secondary: "bg-secondary text-secondary-foreground hover:bg-secondary/80 hover:scale-105 active:scale-100 shadow-soft hover:shadow-elegant",
        ghost: "hover:bg-accent hover:text-accent-foreground hover:scale-105 active:scale-95",
        link: "text-primary underline-offset-4 hover:underline hover:scale-105 active:scale-100",
        glass: "bg-background/10 backdrop-blur-md border border-white/10 text-foreground hover:bg-background/20 hover:scale-105 active:scale-100 shadow-soft hover:shadow-elegant",
        premium: "bg-gradient-wave text-primary-foreground hover:opacity-90 hover:scale-105 active:scale-100 shadow-elegant hover:shadow-glow",
        floating: "bg-gradient-card backdrop-blur-md border border-border/20 shadow-elegant hover:shadow-glow hover:scale-105 active:scale-100 hover:-translate-y-1",
        success: "bg-green-600 text-white hover:bg-green-700 hover:scale-105 active:scale-100 shadow-soft hover:shadow-elegant",
        warning: "bg-yellow-600 text-white hover:bg-yellow-700 hover:scale-105 active:scale-100 shadow-soft hover:shadow-elegant",
        info: "bg-blue-600 text-white hover:bg-blue-700 hover:scale-105 active:scale-100 shadow-soft hover:shadow-elegant",
      },
      size: {
        default: "h-10 px-4 py-2",
        sm: "h-9 rounded-md px-3",
        lg: "h-11 rounded-md px-8",
        xl: "h-12 rounded-lg px-10 text-base",
        icon: "h-10 w-10",
        "icon-sm": "h-8 w-8",
        "icon-lg": "h-12 w-12",
      },
      animation: {
        none: "",
        bounce: "hover:animate-bounce",
        pulse: "hover:animate-pulse",
        float: "animate-float-subtle",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
      animation: "none",
    },
  }
)

export interface EnhancedButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof enhancedButtonVariants> {
  asChild?: boolean
  loading?: boolean
  loadingText?: string
}

const EnhancedButton = React.forwardRef<HTMLButtonElement, EnhancedButtonProps>(
  ({ 
    className, 
    variant, 
    size, 
    animation,
    asChild = false, 
    loading = false,
    loadingText = "Loading...",
    children,
    disabled,
    ...props 
  }, ref) => {
    const Comp = asChild ? Slot : "button"

    if (loading) {
      return (
        <Comp
          className={cn(
            enhancedButtonVariants({ variant, size, animation, className }),
            "cursor-not-allowed opacity-70"
          )}
          ref={ref}
          disabled={true}
          {...props}
        >
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
            {loadingText}
          </div>
        </Comp>
      )
    }

    return (
      <Comp
        className={cn(enhancedButtonVariants({ variant, size, animation, className }))}
        ref={ref}
        disabled={disabled || loading}
        {...props}
      >
        {children}
      </Comp>
    )
  }
)
EnhancedButton.displayName = "EnhancedButton"

export { EnhancedButton, enhancedButtonVariants }