import React from 'react';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '@/lib/utils';
import { Microsoft365Theme } from '@/lib/design-system/microsoft365-theme';

const ms365ButtonVariants = cva(
  // Base styles following Microsoft Fluent Design
  "inline-flex items-center justify-center font-medium transition-all duration-200 ease-out focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 border border-transparent relative overflow-hidden",
  {
    variants: {
      variant: {
        // Primary button - Microsoft Blue with depth
        primary: "bg-[#0078d4] text-white hover:bg-[#106ebe] active:bg-[#005a9e] shadow-sm hover:shadow-md focus-visible:ring-[#0078d4]/50",
        
        // Standard button - subtle with border
        standard: "bg-white text-[#323130] border-[#8a8886] hover:bg-[#f3f2f1] active:bg-[#edebe9] focus-visible:ring-[#0078d4]/50",
        
        // Compound button - with secondary text area
        compound: "bg-white text-[#323130] border-[#8a8886] hover:bg-[#f3f2f1] active:bg-[#edebe9] focus-visible:ring-[#0078d4]/50 flex-col items-start text-left min-h-[56px] px-4 py-2",
        
        // Action button - icon only, subtle
        action: "bg-transparent text-[#605e5c] hover:bg-[#f3f2f1] active:bg-[#edebe9] border-0 focus-visible:ring-[#0078d4]/50",
        
        // Command bar button - flat style for command bars
        command: "bg-transparent text-[#323130] hover:bg-[#f3f2f1] active:bg-[#edebe9] border-0 rounded-none focus-visible:ring-[#0078d4]/50",
        
        // Toggle button - can be pressed/unpressed
        toggle: "bg-white text-[#323130] border-[#8a8886] hover:bg-[#f3f2f1] active:bg-[#edebe9] focus-visible:ring-[#0078d4]/50 data-[pressed]:bg-[#deecf9] data-[pressed]:border-[#0078d4] data-[pressed]:text-[#005a9e]",
        
        // Hero button - large accent button
        hero: "bg-gradient-to-r from-[#0078d4] to-[#40e0d0] text-white hover:shadow-lg active:scale-[0.98] shadow-md focus-visible:ring-[#0078d4]/50 font-semibold",
        
        // Subtle button - minimal styling
        subtle: "bg-transparent text-[#605e5c] hover:bg-[#f3f2f1] hover:text-[#323130] active:bg-[#edebe9] border-0 focus-visible:ring-[#0078d4]/50"
      },
      
      size: {
        small: "h-6 px-2 text-xs rounded-sm min-w-[48px]",
        medium: "h-8 px-3 text-sm rounded-sm min-w-[80px]",
        large: "h-10 px-4 text-sm rounded-sm min-w-[96px]",
        hero: "h-12 px-6 text-base rounded-md min-w-[120px] font-semibold"
      },
      
      // Microsoft-style states
      pressed: {
        true: "",
        false: ""
      },
      
      disabled: {
        true: "opacity-50 cursor-not-allowed",
        false: ""
      },
      
      // Icon positioning
      iconPosition: {
        start: "flex-row",
        end: "flex-row-reverse", 
        top: "flex-col",
        bottom: "flex-col-reverse"
      }
    },
    
    defaultVariants: {
      variant: "standard",
      size: "medium",
      pressed: false,
      disabled: false,
      iconPosition: "start"
    }
  }
);

export interface MS365ButtonProps 
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof ms365ButtonVariants> {
  /** Primary text content */
  text?: string;
  /** Secondary text for compound buttons */
  secondaryText?: string;
  /** Icon element to display */
  icon?: React.ReactNode;
  /** Button is in pressed state (for toggle buttons) */
  pressed?: boolean;
  /** Show loading state */
  loading?: boolean;
  /** Fluent UI style href for link buttons */
  href?: string;
  /** Custom className */
  className?: string;
  /** Split button - shows dropdown arrow */
  split?: boolean;
  /** Menu items for dropdown functionality */
  menuItems?: Array<{
    key: string;
    text: string;
    icon?: React.ReactNode;
    onClick?: () => void;
  }>;
}

export const MS365Button = React.forwardRef<HTMLButtonElement, MS365ButtonProps>(
  ({ 
    variant, 
    size, 
    pressed, 
    disabled, 
    iconPosition, 
    text, 
    secondaryText, 
    icon, 
    loading, 
    className, 
    children, 
    split,
    ...props 
  }, ref) => {
    const buttonContent = () => {
      if (loading) {
        return (
          <>
            <div className="animate-spin rounded-full h-4 w-4 border-2 border-current border-t-transparent mr-2" />
            {text || children}
          </>
        );
      }

      if (variant === 'compound' && secondaryText) {
        return (
          <div className="flex flex-col items-start">
            <div className="flex items-center gap-2">
              {iconPosition === 'start' && icon}
              <span className="font-semibold">{text || children}</span>
              {iconPosition === 'end' && icon}
            </div>
            <span className="text-xs text-[#605e5c] mt-1">{secondaryText}</span>
          </div>
        );
      }

      return (
        <>
          {iconPosition === 'start' && icon && (
            <span className={cn("inline-flex", text || children ? "mr-2" : "")}>{icon}</span>
          )}
          {iconPosition === 'top' && icon && (
            <span className={cn("inline-flex", text || children ? "mb-1" : "")}>{icon}</span>
          )}
          
          {text || children}
          
          {iconPosition === 'end' && icon && (
            <span className={cn("inline-flex", text || children ? "ml-2" : "")}>{icon}</span>
          )}
          {iconPosition === 'bottom' && icon && (
            <span className={cn("inline-flex", text || children ? "mt-1" : "")}>{icon}</span>
          )}
          
          {split && (
            <span className="ml-2 h-4 w-4 flex items-center justify-center">
              <svg width="8" height="4" viewBox="0 0 8 4" fill="currentColor">
                <path d="M0 0 L4 4 L8 0 Z" />
              </svg>
            </span>
          )}
        </>
      );
    };

    return (
      <button
        className={cn(ms365ButtonVariants({ 
          variant, 
          size, 
          pressed, 
          disabled, 
          iconPosition 
        }), className)}
        ref={ref}
        disabled={disabled || loading}
        data-pressed={pressed}
        {...props}
      >
        {buttonContent()}
      </button>
    );
  }
);

MS365Button.displayName = "MS365Button";