import React from 'react';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '@/lib/utils';

const ms365LayoutVariants = cva(
  // Base Microsoft application layout
  "min-h-screen bg-[#faf9f8] text-[#323130] font-[system-ui,-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif]",
  {
    variants: {
      variant: {
        // Standard app layout with navigation
        application: "flex flex-col",
        
        // Full page layout without chrome
        fullPage: "w-full h-full",
        
        // Split pane layout
        splitPane: "flex h-screen",
        
        // Master-detail layout
        masterDetail: "flex h-screen bg-white",
        
        // Document layout for content-focused UIs
        document: "max-w-4xl mx-auto py-8 px-6 bg-white min-h-screen",
        
        // Dashboard layout with widgets
        dashboard: "p-6 space-y-6"
      }
    },
    
    defaultVariants: {
      variant: "application"
    }
  }
);

export interface MS365LayoutProps 
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof ms365LayoutVariants> {
  /** Layout variant */
  variant?: 'application' | 'fullPage' | 'splitPane' | 'masterDetail' | 'document' | 'dashboard';
  /** Navigation component */
  navigation?: React.ReactNode;
  /** Header/command bar component */
  header?: React.ReactNode;
  /** Sidebar component */
  sidebar?: React.ReactNode;
  /** Footer component */
  footer?: React.ReactNode;
  /** Whether navigation is collapsed */
  navCollapsed?: boolean;
  /** Custom className */
  className?: string;
}

const MS365LayoutHeader = React.forwardRef<HTMLElement, React.HTMLAttributes<HTMLElement>>(
  ({ className, children, ...props }, ref) => (
    <header
      ref={ref}
      className={cn(
        "h-12 bg-white border-b border-[#edebe9] flex items-center px-4 shadow-sm relative z-10",
        className
      )}
      {...props}
    >
      {children}
    </header>
  )
);
MS365LayoutHeader.displayName = "MS365LayoutHeader";

const MS365LayoutNavigation = React.forwardRef<HTMLElement, React.HTMLAttributes<HTMLElement> & { collapsed?: boolean }>(
  ({ className, children, collapsed, ...props }, ref) => (
    <nav
      ref={ref}
      className={cn(
        "bg-[#f3f2f1] border-r border-[#edebe9] transition-all duration-300 ease-out flex-shrink-0 relative z-20",
        collapsed ? "w-12" : "w-60",
        className
      )}
      {...props}
    >
      <div className="h-full overflow-y-auto">
        {children}
      </div>
    </nav>
  )
);
MS365LayoutNavigation.displayName = "MS365LayoutNavigation";

const MS365LayoutSidebar = React.forwardRef<HTMLElement, React.HTMLAttributes<HTMLElement>>(
  ({ className, children, ...props }, ref) => (
    <aside
      ref={ref}
      className={cn(
        "w-80 bg-white border-l border-[#edebe9] flex-shrink-0 overflow-y-auto",
        className
      )}
      {...props}
    >
      {children}
    </aside>
  )
);
MS365LayoutSidebar.displayName = "MS365LayoutSidebar";

const MS365LayoutMain = React.forwardRef<HTMLElement, React.HTMLAttributes<HTMLElement>>(
  ({ className, children, ...props }, ref) => (
    <main
      ref={ref}
      className={cn(
        "flex-1 overflow-y-auto bg-[#faf9f8] relative",
        className
      )}
      {...props}
    >
      {children}
    </main>
  )
);
MS365LayoutMain.displayName = "MS365LayoutMain";

const MS365LayoutFooter = React.forwardRef<HTMLElement, React.HTMLAttributes<HTMLElement>>(
  ({ className, children, ...props }, ref) => (
    <footer
      ref={ref}
      className={cn(
        "h-8 bg-[#605e5c] text-white text-xs flex items-center px-4 relative z-10",
        className
      )}
      {...props}
    >
      {children}
    </footer>
  )
);
MS365LayoutFooter.displayName = "MS365LayoutFooter";

const MS365LayoutContent = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(
  ({ className, children, ...props }, ref) => (
    <div
      ref={ref}
      className={cn(
        "p-6 space-y-6 max-w-7xl mx-auto",
        className
      )}
      {...props}
    >
      {children}
    </div>
  )
);
MS365LayoutContent.displayName = "MS365LayoutContent";

export const MS365Layout = React.forwardRef<HTMLDivElement, MS365LayoutProps>(
  ({ 
    variant, 
    navigation, 
    header, 
    sidebar, 
    footer, 
    navCollapsed, 
    className, 
    children, 
    ...props 
  }, ref) => {
    
    const renderLayout = () => {
      switch (variant) {
        case 'application':
          return (
            <>
              {header && <MS365LayoutHeader>{header}</MS365LayoutHeader>}
              <div className="flex flex-1 overflow-hidden">
                {navigation && (
                  <MS365LayoutNavigation collapsed={navCollapsed}>
                    {navigation}
                  </MS365LayoutNavigation>
                )}
                <MS365LayoutMain>
                  <MS365LayoutContent>{children}</MS365LayoutContent>
                </MS365LayoutMain>
                {sidebar && <MS365LayoutSidebar>{sidebar}</MS365LayoutSidebar>}
              </div>
              {footer && <MS365LayoutFooter>{footer}</MS365LayoutFooter>}
            </>
          );
          
        case 'splitPane':
          return (
            <div className="flex h-full">
              {navigation && (
                <MS365LayoutNavigation collapsed={navCollapsed}>
                  {navigation}
                </MS365LayoutNavigation>
              )}
              <MS365LayoutMain>{children}</MS365LayoutMain>
            </div>
          );
          
        case 'masterDetail':
          return (
            <div className="flex h-full">
              <div className="w-1/3 border-r border-[#edebe9] bg-[#f3f2f1]">
                {navigation}
              </div>
              <MS365LayoutMain className="bg-white">{children}</MS365LayoutMain>
            </div>
          );
          
        case 'document':
          return (
            <div className="max-w-4xl mx-auto py-8 px-6 bg-white min-h-screen">
              {children}
            </div>
          );
          
        case 'dashboard':
          return (
            <MS365LayoutContent className="p-6 space-y-6">
              {children}
            </MS365LayoutContent>
          );
          
        case 'fullPage':
        default:
          return children;
      }
    };

    return (
      <div
        className={cn(ms365LayoutVariants({ variant }), className)}
        ref={ref}
        {...props}
      >
        {renderLayout()}
      </div>
    );
  }
);

MS365Layout.displayName = "MS365Layout";

// Export sub-components
export { 
  MS365LayoutHeader, 
  MS365LayoutNavigation, 
  MS365LayoutSidebar, 
  MS365LayoutMain, 
  MS365LayoutFooter, 
  MS365LayoutContent 
};