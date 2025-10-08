import React, { useState, useEffect } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { 
  Activity, 
  Zap, 
  Clock, 
  TrendingUp, 
  TrendingDown,
  Server,
  Brain,
  Shield
} from 'lucide-react';

interface RealTimeMetric {
  id: string;
  label: string;
  value: string | number;
  unit?: string;
  trend: 'up' | 'down' | 'stable';
  trendValue?: number;
  status: 'excellent' | 'good' | 'warning' | 'critical';
  icon: React.ElementType;
}

interface RealTimeMetricsOverlayProps {
  className?: string;
  compact?: boolean;
}

export const RealTimeMetricsOverlay: React.FC<RealTimeMetricsOverlayProps> = ({ 
  className = '', 
  compact = false 
}) => {
  const [metrics, setMetrics] = useState<RealTimeMetric[]>([]);
  const [lastUpdate, setLastUpdate] = useState<Date>(new Date());

  useEffect(() => {
    const updateMetrics = () => {
      const realTimeMetrics: RealTimeMetric[] = [
        {
          id: 'response_time',
          label: 'Response Time',
          value: Math.round(120 + Math.random() * 80),
          unit: 'ms',
          trend: Math.random() > 0.5 ? 'down' : 'up',
          trendValue: Math.round(Math.random() * 20),
          status: 'excellent',
          icon: Clock
        },
        {
          id: 'throughput',
          label: 'Throughput',
          value: Math.round(200 + Math.random() * 100),
          unit: 'req/min',
          trend: 'up',
          trendValue: Math.round(Math.random() * 15),
          status: 'excellent',
          icon: Zap
        },
        {
          id: 'cpu_usage',
          label: 'CPU',
          value: Math.round(20 + Math.random() * 30),
          unit: '%',
          trend: Math.random() > 0.7 ? 'up' : 'stable',
          trendValue: Math.round(Math.random() * 5),
          status: 'good',
          icon: Server
        },
        {
          id: 'ai_accuracy',
          label: 'AI Accuracy',
          value: (96 + Math.random() * 3).toFixed(1),
          unit: '%',
          trend: 'up',
          trendValue: Math.round(Math.random() * 2),
          status: 'excellent',
          icon: Brain
        }
      ];

      setMetrics(realTimeMetrics);
      setLastUpdate(new Date());
    };

    // Initial load
    updateMetrics();

    // Update every 3 seconds for live feel
    const interval = setInterval(updateMetrics, 3000);

    return () => clearInterval(interval);
  }, []);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'excellent': return 'bg-green-500';
      case 'good': return 'bg-blue-500';
      case 'warning': return 'bg-yellow-500';
      case 'critical': return 'bg-red-500';
      default: return 'bg-gray-400';
    }
  };

  const getTrendIcon = (trend: string) => {
    if (trend === 'up') return <TrendingUp className="w-3 h-3 text-green-600" />;
    if (trend === 'down') return <TrendingDown className="w-3 h-3 text-red-600" />;
    return <Activity className="w-3 h-3 text-gray-400" />;
  };

  if (compact) {
    return (
      <div className={`flex items-center gap-4 ${className}`}>
        {metrics.slice(0, 2).map((metric) => (
          <div key={metric.id} className="flex items-center gap-2">
            <div className={`w-2 h-2 rounded-full ${getStatusColor(metric.status)} animate-pulse`}></div>
            <div className="flex items-center gap-1 text-sm">
              <metric.icon className="w-4 h-4 text-gray-600" />
              <span className="font-semibold text-gray-900">{metric.value}{metric.unit}</span>
              {metric.trend !== 'stable' && (
                <div className="flex items-center gap-0.5">
                  {getTrendIcon(metric.trend)}
                  <span className="text-xs text-gray-500">{metric.trendValue}%</span>
                </div>
              )}
            </div>
          </div>
        ))}
        <div className="text-xs text-gray-500">
          Updated {lastUpdate.toLocaleTimeString()}
        </div>
      </div>
    );
  }

  return (
    <div className={`grid grid-cols-2 lg:grid-cols-4 gap-4 ${className}`}>
      {metrics.map((metric) => (
        <Card key={metric.id} className="relative overflow-hidden bg-white/90 backdrop-blur-sm border border-gray-200/50">
          <CardContent className="p-4">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <div className={`w-2 h-2 rounded-full ${getStatusColor(metric.status)} animate-pulse`}></div>
                <metric.icon className="w-4 h-4 text-gray-600" />
              </div>
              {metric.trend !== 'stable' && (
                <div className="flex items-center gap-1">
                  {getTrendIcon(metric.trend)}
                  <span className="text-xs text-gray-500">{metric.trendValue}%</span>
                </div>
              )}
            </div>
            
            <div className="space-y-1">
              <p className="text-xs font-medium text-gray-600 uppercase tracking-wide">{metric.label}</p>
              <p className="text-xl font-bold text-gray-900">
                {metric.value}
                {metric.unit && <span className="text-sm text-gray-600 ml-1">{metric.unit}</span>}
              </p>
            </div>
            
            <Badge 
              variant="outline" 
              className={`mt-2 text-xs ${
                metric.status === 'excellent' ? 'border-green-200 text-green-700' :
                metric.status === 'good' ? 'border-blue-200 text-blue-700' :
                metric.status === 'warning' ? 'border-yellow-200 text-yellow-700' :
                'border-red-200 text-red-700'
              }`}
            >
              {metric.status}
            </Badge>
          </CardContent>
        </Card>
      ))}
    </div>
  );
};

export default RealTimeMetricsOverlay;