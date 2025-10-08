import { ReactNode, useState } from "react";
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { Separator } from "@/components/ui/separator";
import { Button } from "@/components/ui/button";
import { Menu, X, LogOut } from "lucide-react";
import { cn } from "@/lib/utils";
import AppSidebar from "@/components/AppSidebar";
import YachtHeader from "@/components/YachtHeader";
import MobileNavigation from "@/components/MobileNavigation";
import VoiceControl from "@/components/VoiceControl";
import SystemStatusIndicator from "@/components/SystemStatusIndicator";
import { useIsMobile } from "@/hooks/use-mobile";
import { useNavigate } from "react-router-dom";
import { useSupabaseAuth } from "@/hooks/useSupabaseAuth";
import SmartScanOnboardingBanner from "@/components/smartscan/SmartScanOnboardingBanner";

interface LayoutProps {
  children: ReactNode;
}

export default function Layout({ children }: LayoutProps) {
  const [isVoiceControlOpen, setIsVoiceControlOpen] = useState(false);
  const isMobile = useIsMobile();
  const navigate = useNavigate();
  const { isAuthenticated, user, signOut } = useSupabaseAuth();

  const handleSignOut = async () => {
    await signOut();
    navigate('/auth');
  };

  const handleStartScan = () => {
    navigate('/yacht/onboarding');
  };

  const handleLearnMore = () => {
    // Could navigate to a help page or documentation
    window.open('/docs/smartscan', '_blank');
  };

  return (
    <SidebarProvider>
      <AppSidebar />
      <div className="flex flex-col flex-1 w-full min-h-screen bg-background">
        <YachtHeader />
        <Separator />
        <div className="flex flex-1">
          <main className="flex-1 p-4 md:p-6 overflow-auto">
            {children}
            {/* SmartScan Onboarding Banner - only show when authenticated */}
            {isAuthenticated && (
              <SmartScanOnboardingBanner
                onStartScan={handleStartScan}
                onLearnMore={handleLearnMore}
                autoHide={true}
                hideDuration={5000}
              />
            )}
          </main>
        </div>
        <MobileNavigation onVoiceControl={() => setIsVoiceControlOpen(true)} />
      </div>
      <VoiceControl
        isOpen={isVoiceControlOpen}
        onClose={() => setIsVoiceControlOpen(false)}
      />
    </SidebarProvider>
  );
}