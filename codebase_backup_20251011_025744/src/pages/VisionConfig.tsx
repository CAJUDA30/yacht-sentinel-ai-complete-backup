
import React, { useEffect } from 'react';
import VisionSettingsPanel from '@/components/vision/VisionSettingsPanel';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

const VisionConfigPage: React.FC = () => {
  useEffect(() => {
    const title = 'Google Vision Configuration | Superadmin';
    document.title = title;
    const desc = 'Configure Google Vision API, test connection, manage features, and SmartScan integration.';
    let meta = document.querySelector('meta[name="description"]') as HTMLMetaElement | null;
    if (!meta) {
      meta = document.createElement('meta');
      meta.name = 'description';
      document.head.appendChild(meta);
    }
    meta.content = desc;
    const canonicalHref = `${window.location.origin}/settings/vision`;
    let link = document.querySelector('link[rel="canonical"]') as HTMLLinkElement | null;
    if (!link) {
      link = document.createElement('link');
      link.rel = 'canonical';
      document.head.appendChild(link);
    }
    link.href = canonicalHref;
  }, []);

  return (
    <main className="container mx-auto p-4 md:p-6 space-y-6">
      <header>
        <h1 className="text-2xl md:text-3xl font-bold">Google Vision API Configuration</h1>
      </header>
      <Card>
        <CardHeader>
          <CardTitle>Superadmin: Google Vision Configuration</CardTitle>
        </CardHeader>
        <CardContent>
          <VisionSettingsPanel />
        </CardContent>
      </Card>
    </main>
  );
};

export default VisionConfigPage;
