import React from 'react';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '@/lib/utils';
import { MS365Button } from './ms365-button';

export interface CommandBarItem {
  key: string;
  text: string;
  icon?: React.ReactNode;
  onClick?: () => void;
  disabled?: boolean;
  split?: boolean;
  primary?: boolean;
  subMenuItems?: CommandBarItem[];
}

const ms365CommandBarVariants = cva(
  // Base Microsoft Command Bar styles
  "flex items-center justify-between bg-white border-b border-[#edebe9] px-4 py-2 min-h-[44px] shadow-sm",
  {
    variants: {
      variant: {
        // Standard command bar
        standard: "",
        
        // Compact command bar for dense UIs
        compact: "min-h-[36px] py-1",
        
        // Large command bar with more padding
        large: "min-h-[52px] py-3",
        
        // Floating command bar
        floating: "rounded-md border border-[#d2d0ce] shadow-md mx-4 my-2",
        
        // Contextual command bar with accent
        contextual: "bg-[#deecf9] border-[#0078d4]"
      },
      
      position: {
        top: "",
        bottom: "border-t border-b-0",
        floating: "absolute top-4 left-4 right-4 z-50"
      }
    },
    
    defaultVariants: {
      variant: "standard",
      position: "top"
    }
  }
);

export interface MS365CommandBarProps 
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof ms365CommandBarVariants> {
  /** Primary command items (left side) */
  items?: CommandBarItem[];
  /** Far command items (right side) */
  farItems?: CommandBarItem[];
  /** Search box component */
  searchBox?: React.ReactNode;
  /** Custom className */
  className?: string;
  /** Show overflow menu for items that don't fit */
  overflowItems?: CommandBarItem[];
}

const CommandBarButton = ({ item }: { item: CommandBarItem }) => (
  <MS365Button
    key={item.key}
    variant={item.primary ? "primary" : "command"}
    size="medium"
    text={item.text}
    icon={item.icon}
    disabled={item.disabled}
    split={item.split}
    onClick={item.onClick}
    className="mx-1"
  />
);

const CommandBarOverflow = ({ items }: { items: CommandBarItem[] }) => {
  const [isOpen, setIsOpen] = React.useState(false);

  if (!items.length) return null;

  return (
    <div className="relative">
      <MS365Button
        variant="command"
        size="medium"
        icon={
          <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor">
            <path d="M3 6.5C3 5.67 3.67 5 4.5 5S6 5.67 6 6.5 5.33 8 4.5 8 3 7.33 3 6.5zM7 6.5C7 5.67 7.67 5 8.5 5S10 5.67 10 6.5 9.33 8 8.5 8 7 7.33 7 6.5zM11 6.5C11 5.67 11.67 5 12.5 5S14 5.67 14 6.5 13.33 8 12.5 8 11 7.33 11 6.5z"/>
          </svg>
        }
        onClick={() => setIsOpen(!isOpen)}
        className="mx-1"
      />
      
      {isOpen && (
        <div className="absolute top-full right-0 mt-1 w-48 bg-white border border-[#d2d0ce] rounded-md shadow-lg z-50">
          {items.map(item => (
            <button
              key={item.key}
              className="w-full px-3 py-2 text-left text-sm hover:bg-[#f3f2f1] flex items-center gap-2 disabled:opacity-50"
              onClick={() => {
                item.onClick?.();
                setIsOpen(false);
              }}
              disabled={item.disabled}
            >
              {item.icon && <span className="w-4 h-4">{item.icon}</span>}
              {item.text}
            </button>
          ))}
        </div>
      )}
    </div>
  );
};

export const MS365CommandBar = React.forwardRef<HTMLDivElement, MS365CommandBarProps>(
  ({ 
    variant, 
    position, 
    items = [], 
    farItems = [], 
    searchBox,
    overflowItems = [],
    className, 
    children,
    ...props 
  }, ref) => {
    return (
      <div
        className={cn(ms365CommandBarVariants({ variant, position }), className)}
        ref={ref}
        role="toolbar"
        {...props}
      >
        {/* Primary Commands */}
        <div className="flex items-center flex-1">
          {items.map(item => (
            <CommandBarButton key={item.key} item={item} />
          ))}
          {children}
        </div>

        {/* Search Box */}
        {searchBox && (
          <div className="flex-1 max-w-sm mx-4">
            {searchBox}
          </div>
        )}

        {/* Far Commands */}
        <div className="flex items-center">
          {farItems.map(item => (
            <CommandBarButton key={item.key} item={item} />
          ))}
          <CommandBarOverflow items={overflowItems} />
        </div>
      </div>
    );
  }
);

MS365CommandBar.displayName = "MS365CommandBar";