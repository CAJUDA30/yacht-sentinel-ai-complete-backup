import * as React from "react"
import { Slot } from "@radix-ui/react-slot"
import { cva, type VariantProps } from "class-variance-authority"

import { cn } from "@/lib/utils"

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md text-sm font-medium ring-offset-background transition-all duration-300 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0",
  {
    variants: {
      variant: {
        default: "bg-primary text-primary-foreground shadow-neumorphic hover:shadow-glow transform hover:-translate-y-0.5",
        destructive:
          "bg-destructive text-destructive-foreground shadow-neumorphic hover:bg-destructive/90 hover:shadow-glow",
        outline:
          "border-2 border-primary/20 bg-background/50 backdrop-blur-sm shadow-neumorphic hover:bg-primary/10 hover:border-primary/40 hover:shadow-glow",
        secondary:
          "bg-secondary text-secondary-foreground shadow-neumorphic hover:bg-secondary/80 hover:shadow-lg",
        ghost: "hover:bg-accent/50 hover:text-accent-foreground backdrop-blur-sm",
        link: "text-primary underline-offset-4 hover:underline hover:text-primary-glow",
        ocean: "bg-gradient-ocean text-primary-foreground shadow-glow hover:shadow-xl transform hover:-translate-y-1 hover:scale-105",
        wave: "bg-gradient-wave text-foreground shadow-neumorphic hover:shadow-lg border border-border/50",
        captain: "bg-primary-glow text-primary-foreground shadow-glow hover:bg-primary hover:shadow-xl border border-primary/30",
        emergency: "bg-destructive text-destructive-foreground shadow-glow animate-pulse hover:animate-none hover:shadow-xl",
      },
      size: {
        default: "h-11 px-6 py-2",
        sm: "h-9 rounded-md px-4 text-xs",
        lg: "h-12 rounded-lg px-8 text-base",
        xl: "h-14 rounded-lg px-10 text-lg",
        icon: "h-11 w-11",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
)

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild = false, ...props }, ref) => {
    const Comp = asChild ? Slot : "button"
    return (
      <Comp
        className={cn(buttonVariants({ variant, size, className }))}
        ref={ref}
        {...props}
      />
    )
  }
)
Button.displayName = "Button"

export { Button, buttonVariants }
