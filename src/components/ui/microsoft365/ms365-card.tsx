import React from 'react';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '@/lib/utils';

const ms365CardVariants = cva(
  // Base Microsoft Fluent card styles
  "bg-white border border-[#edebe9] rounded-md transition-all duration-200 ease-out hover:shadow-md hover:border-[#d2d0ce] relative overflow-hidden",
  {
    variants: {
      variant: {
        // Standard card with subtle shadow
        standard: "shadow-sm",
        
        // Compact card for dense layouts
        compact: "shadow-none border-[#d2d0ce]",
        
        // Outlined card with emphasis
        outlined: "border-2 border-[#8a8886] shadow-none",
        
        // Ghost card - minimal visual weight
        ghost: "bg-transparent border-transparent shadow-none hover:bg-[#f3f2f1] hover:border-[#edebe9]",
        
        // Elevated card with stronger shadow
        elevated: "shadow-lg border-[#d2d0ce]",
        
        // Interactive card - shows hover states
        interactive: "cursor-pointer hover:shadow-lg hover:scale-[1.02] active:scale-[0.98] transition-transform",
        
        // Document card - for file/document representations
        document: "shadow-sm hover:shadow-md border-[#d2d0ce] bg-gradient-to-b from-white to-[#faf9f8]",
        
        // Persona card - for user/profile representations
        persona: "shadow-sm border-[#d2d0ce] bg-white hover:shadow-md"
      },
      
      size: {
        small: "p-3",
        medium: "p-4", 
        large: "p-6",
        hero: "p-8"
      },
      
      // Microsoft-style states
      selected: {
        true: "border-[#0078d4] shadow-md ring-1 ring-[#0078d4]/20",
        false: ""
      },
      
      disabled: {
        true: "opacity-50 cursor-not-allowed hover:shadow-sm hover:scale-100",
        false: ""
      }
    },
    
    defaultVariants: {
      variant: "standard",
      size: "medium",
      selected: false,
      disabled: false
    }
  }
);

export interface MS365CardProps 
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof ms365CardVariants> {
  /** Card is in selected state */
  selected?: boolean;
  /** Card is disabled */
  disabled?: boolean;
  /** Custom className */
  className?: string;
  /** Click handler for interactive cards */
  onCardClick?: () => void;
  /** Header content */
  header?: React.ReactNode;
  /** Footer content */
  footer?: React.ReactNode;
  /** Card actions (buttons, etc.) */
  actions?: React.ReactNode;
  /** Show loading state */
  loading?: boolean;
}

const MS365CardHeader = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(
  ({ className, children, ...props }, ref) => (
    <div
      ref={ref}
      className={cn(
        "flex flex-col space-y-1.5 pb-3 border-b border-[#edebe9] mb-4",
        className
      )}
      {...props}
    >
      {children}
    </div>
  )
);
MS365CardHeader.displayName = "MS365CardHeader";

const MS365CardTitle = React.forwardRef<HTMLParagraphElement, React.HTMLAttributes<HTMLHeadingElement>>(
  ({ className, children, ...props }, ref) => (
    <h3
      ref={ref}
      className={cn(
        "text-base font-semibold leading-tight text-[#323130] tracking-tight",
        className
      )}
      {...props}
    >
      {children}
    </h3>
  )
);
MS365CardTitle.displayName = "MS365CardTitle";

const MS365CardDescription = React.forwardRef<HTMLParagraphElement, React.HTMLAttributes<HTMLParagraphElement>>(
  ({ className, children, ...props }, ref) => (
    <p
      ref={ref}
      className={cn("text-sm text-[#605e5c] leading-relaxed", className)}
      {...props}
    >
      {children}
    </p>
  )
);
MS365CardDescription.displayName = "MS365CardDescription";

const MS365CardContent = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(
  ({ className, children, ...props }, ref) => (
    <div ref={ref} className={cn("", className)} {...props}>
      {children}
    </div>
  )
);
MS365CardContent.displayName = "MS365CardContent";

const MS365CardFooter = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(
  ({ className, children, ...props }, ref) => (
    <div
      ref={ref}
      className={cn(
        "flex items-center justify-between pt-3 mt-4 border-t border-[#edebe9]",
        className
      )}
      {...props}
    >
      {children}
    </div>
  )
);
MS365CardFooter.displayName = "MS365CardFooter";

const MS365CardActions = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(
  ({ className, children, ...props }, ref) => (
    <div
      ref={ref}
      className={cn(
        "flex items-center gap-2 pt-3 mt-4",
        className
      )}
      {...props}
    >
      {children}
    </div>
  )
);
MS365CardActions.displayName = "MS365CardActions";

export const MS365Card = React.forwardRef<HTMLDivElement, MS365CardProps>(
  ({ 
    variant, 
    size, 
    selected, 
    disabled, 
    className, 
    children, 
    onCardClick,
    header,
    footer,
    actions,
    loading,
    ...props 
  }, ref) => {
    const cardContent = () => {
      if (loading) {
        return (
          <div className="flex items-center justify-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-2 border-[#0078d4] border-t-transparent" />
          </div>
        );
      }

      return (
        <>
          {header && <MS365CardHeader>{header}</MS365CardHeader>}
          <MS365CardContent>{children}</MS365CardContent>
          {actions && <MS365CardActions>{actions}</MS365CardActions>}
          {footer && <MS365CardFooter>{footer}</MS365CardFooter>}
        </>
      );
    };

    return (
      <div
        className={cn(ms365CardVariants({ variant, size, selected, disabled }), className)}
        ref={ref}
        onClick={onCardClick && !disabled ? onCardClick : undefined}
        role={onCardClick ? "button" : undefined}
        tabIndex={onCardClick && !disabled ? 0 : undefined}
        {...props}
      >
        {cardContent()}
      </div>
    );
  }
);

MS365Card.displayName = "MS365Card";

// Export sub-components
export { 
  MS365CardHeader, 
  MS365CardTitle, 
  MS365CardDescription, 
  MS365CardContent, 
  MS365CardFooter, 
  MS365CardActions 
};