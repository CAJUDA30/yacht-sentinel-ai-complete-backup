import { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/components/ui/use-toast';

interface SecurityEvent {
  id: string;
  type: 'login' | 'data_access' | 'system_change' | 'anomaly' | 'breach_attempt';
  severity: 'low' | 'medium' | 'high' | 'critical';
  description: string;
  timestamp: string;
  source: string;
  user?: string;
  resolved: boolean;
}

interface SecurityMetrics {
  threatLevel: 'low' | 'medium' | 'high' | 'critical';
  activeThreats: number;
  securityScore: number;
  lastScan: string;
  vulnerabilities: number;
  complianceScore: number;
}

interface SecurityContextType {
  securityEvents: SecurityEvent[];
  securityMetrics: SecurityMetrics;
  isMonitoring: boolean;
  startMonitoring: () => void;
  stopMonitoring: () => void;
  acknowledgeEvent: (eventId: string) => void;
  runSecurityScan: () => Promise<void>;
  getSecurityReport: () => Promise<any>;
}

const SecurityContext = createContext<SecurityContextType | undefined>(undefined);

export const useSecurity = () => {
  const context = useContext(SecurityContext);
  if (!context) {
    throw new Error('useSecurity must be used within SecurityProvider');
  }
  return context;
};

export const SecurityProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [securityEvents, setSecurityEvents] = useState<SecurityEvent[]>([]);
  const [securityMetrics, setSecurityMetrics] = useState<SecurityMetrics>({
    threatLevel: 'low',
    activeThreats: 0,
    securityScore: 95,
    lastScan: new Date().toISOString(),
    vulnerabilities: 0,
    complianceScore: 98
  });
  const [isMonitoring, setIsMonitoring] = useState(false);
  const { toast } = useToast();

  // Initialize security monitoring
  useEffect(() => {
    startMonitoring();
    return () => stopMonitoring();
  }, []);

  const startMonitoring = useCallback(() => {
    setIsMonitoring(true);
    
    // Simulate real-time security monitoring
    const monitoringInterval = setInterval(() => {
      // Generate random security events for demonstration
      if (Math.random() < 0.1) { // 10% chance per interval
        generateSecurityEvent();
      }
      
      // Update security metrics
      updateSecurityMetrics();
    }, 30000); // Check every 30 seconds

    // Initial security scan
    runSecurityScan();

    return () => {
      clearInterval(monitoringInterval);
    };
  }, []);

  const stopMonitoring = useCallback(() => {
    setIsMonitoring(false);
  }, []);

  const generateSecurityEvent = useCallback(() => {
    const eventTypes = ['login', 'data_access', 'system_change', 'anomaly'] as const;
    const severities = ['low', 'medium', 'high'] as const;
    
    const event: SecurityEvent = {
      id: `sec-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      type: eventTypes[Math.floor(Math.random() * eventTypes.length)],
      severity: severities[Math.floor(Math.random() * severities.length)],
      description: getEventDescription(),
      timestamp: new Date().toISOString(),
      source: getRandomSource(),
      user: Math.random() > 0.5 ? 'crew_member_' + Math.floor(Math.random() * 10) : undefined,
      resolved: false
    };

    setSecurityEvents(prev => [event, ...prev.slice(0, 49)]); // Keep last 50 events

    // Show toast for high severity events
    if (event.severity === 'high') {
      toast({
        title: "Security Alert",
        description: event.description,
        variant: "destructive",
      });
    }
  }, [toast]);

  const getEventDescription = () => {
    const descriptions = [
      "Unusual login attempt detected",
      "Multiple failed authentication attempts",
      "Sensitive data accessed from new location",
      "System configuration change detected",
      "Anomalous network traffic pattern",
      "File integrity check passed",
      "Backup verification completed",
      "Security certificate renewed",
      "Access pattern deviation detected",
      "Firewall rule updated"
    ];
    return descriptions[Math.floor(Math.random() * descriptions.length)];
  };

  const getRandomSource = () => {
    const sources = [
      "Bridge Terminal",
      "Engine Room System",
      "Guest Network",
      "Crew Quarters",
      "Navigation System",
      "Communications Hub",
      "External API",
      "Mobile Device",
      "Satellite Connection"
    ];
    return sources[Math.floor(Math.random() * sources.length)];
  };

  const updateSecurityMetrics = useCallback(() => {
    setSecurityMetrics(prev => {
      const activeEvents = securityEvents.filter(e => !e.resolved);
      const highSeverityEvents = activeEvents.filter(e => e.severity === 'high' || e.severity === 'critical');
      
      let threatLevel: SecurityMetrics['threatLevel'] = 'low';
      if (highSeverityEvents.length > 0) threatLevel = 'high';
      else if (activeEvents.length > 3) threatLevel = 'medium';

      return {
        ...prev,
        threatLevel,
        activeThreats: activeEvents.length,
        securityScore: Math.max(70, 100 - (activeEvents.length * 2) - (highSeverityEvents.length * 5)),
        lastScan: new Date().toISOString()
      };
    });
  }, [securityEvents]);

  const acknowledgeEvent = useCallback((eventId: string) => {
    setSecurityEvents(prev => 
      prev.map(event => 
        event.id === eventId 
          ? { ...event, resolved: true }
          : event
      )
    );
    
    toast({
      title: "Event Acknowledged",
      description: "Security event has been marked as resolved",
    });
  }, [toast]);

  const runSecurityScan = useCallback(async () => {
    try {
      // Simulate security scan
      const scanResults = {
        vulnerabilities: Math.floor(Math.random() * 3),
        complianceScore: Math.floor(Math.random() * 10) + 90,
        recommendations: [
          "Update crew access permissions",
          "Rotate API keys",
          "Review firewall rules",
          "Update security certificates"
        ]
      };

      setSecurityMetrics(prev => ({
        ...prev,
        vulnerabilities: scanResults.vulnerabilities,
        complianceScore: scanResults.complianceScore,
        lastScan: new Date().toISOString()
      }));

      toast({
        title: "Security Scan Complete",
        description: `Found ${scanResults.vulnerabilities} vulnerabilities. Compliance score: ${scanResults.complianceScore}%`,
      });

    } catch (error) {
      console.error('Security scan failed:', error);
      toast({
        title: "Security Scan Failed",
        description: "Unable to complete security scan. Please try again.",
        variant: "destructive",
      });
    }
  }, [toast]);

  const getSecurityReport = useCallback(async () => {
    const report = {
      summary: {
        totalEvents: securityEvents.length,
        resolvedEvents: securityEvents.filter(e => e.resolved).length,
        securityScore: securityMetrics.securityScore,
        complianceScore: securityMetrics.complianceScore
      },
      events: securityEvents.slice(0, 20), // Last 20 events
      recommendations: [
        "Enable two-factor authentication for all crew members",
        "Regular security training for crew",
        "Implement network segmentation",
        "Regular penetration testing",
        "Automated threat detection"
      ],
      complianceStatus: {
        iso27001: securityMetrics.complianceScore > 95,
        gdpr: true,
        maritimeSecurity: securityMetrics.securityScore > 90
      }
    };

    return report;
  }, [securityEvents, securityMetrics]);

  // Update metrics when events change
  useEffect(() => {
    updateSecurityMetrics();
  }, [securityEvents, updateSecurityMetrics]);

  return (
    <SecurityContext.Provider value={{
      securityEvents,
      securityMetrics,
      isMonitoring,
      startMonitoring,
      stopMonitoring,
      acknowledgeEvent,
      runSecurityScan,
      getSecurityReport
    }}>
      {children}
    </SecurityContext.Provider>
  );
};