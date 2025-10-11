import React from 'react';
import TwoFactorSetup from '@/components/auth/TwoFactorSetup';
import { useNavigate } from 'react-router-dom';

const TwoFactorAuthPage: React.FC = () => {
  const navigate = useNavigate();

  const handleSetupComplete = (enabled: boolean) => {
    if (enabled) {
      navigate('/settings?tab=security');
    }
  };

  return (
    <main className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-cyan-50 dark:from-slate-900 dark:via-blue-900 dark:to-cyan-900">
        <div className="container mx-auto px-4 py-12">
          <div className="max-w-4xl mx-auto">
            <header className="text-center mb-8">
              <h1 className="text-3xl font-bold text-foreground mb-2">
                Two-Factor Authentication
              </h1>
              <p className="text-muted-foreground">
                Enhance your account security with an additional layer of protection
              </p>
            </header>
            
            <TwoFactorSetup onSetupComplete={handleSetupComplete} />
          </div>
        </div>
      </main>
    );
};

export default TwoFactorAuthPage;