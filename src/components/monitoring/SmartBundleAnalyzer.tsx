import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { 
  Package, 
  Zap, 
  TrendingDown, 
  TrendingUp, 
  AlertTriangle, 
  CheckCircle,
  Eye,
  Download,
  Trash2,
  RefreshCw,
  BarChart3
} from 'lucide-react';

interface BundleModule {
  name: string;
  size: number;
  gzipSize: number;
  percentage: number;
  type: 'vendor' | 'component' | 'service' | 'utility' | 'asset';
  loadTime: number;
  cached: boolean;
  essential: boolean;
}

interface BundleAnalysis {
  totalSize: number;
  gzipSize: number;
  modules: BundleModule[];
  chunks: Array<{
    name: string;
    size: number;
    modules: string[];
  }>;
  recommendations: Array<{
    type: 'optimization' | 'warning' | 'info';
    title: string;
    description: string;
    impact: 'high' | 'medium' | 'low';
    action?: string;
  }>;
  performance: {
    parseTime: number;
    evaluationTime: number;
    renderTime: number;
  };
}

interface SmartBundleAnalyzerProps {
  className?: string;
}

const SmartBundleAnalyzer: React.FC<SmartBundleAnalyzerProps> = ({ className }) => {
  const [analysis, setAnalysis] = useState<BundleAnalysis | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [selectedModule, setSelectedModule] = useState<BundleModule | null>(null);
  const [sortBy, setSortBy] = useState<'size' | 'name' | 'type'>('size');

  useEffect(() => {
    performAnalysis();
  }, []);

  const performAnalysis = async () => {
    setIsAnalyzing(true);
    
    try {
      // Simulate bundle analysis (in real implementation, this would analyze actual webpack/vite bundles)
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      const mockAnalysis: BundleAnalysis = {
        totalSize: 4255190, // 4.25MB from build output
        gzipSize: 1091570, // 1.09MB gzipped
        modules: [
          {
            name: '@xenova/transformers',
            size: 860250,
            gzipSize: 225610,
            percentage: 20.2,
            type: 'vendor',
            loadTime: 1200,
            cached: false,
            essential: true
          },
          {
            name: 'onnxruntime-web',
            size: 21596020,
            gzipSize: 5000000,
            percentage: 45.0,
            type: 'vendor',
            loadTime: 3500,
            cached: false,
            essential: true
          },
          {
            name: 'react + react-dom',
            size: 320000,
            gzipSize: 95000,
            percentage: 7.5,
            type: 'vendor',
            loadTime: 400,
            cached: true,
            essential: true
          },
          {
            name: '@radix-ui components',
            size: 180000,
            gzipSize: 45000,
            percentage: 4.2,
            type: 'vendor',
            loadTime: 300,
            cached: true,
            essential: true
          },
          {
            name: 'three.js + drei',
            size: 450000,
            gzipSize: 120000,
            percentage: 10.6,
            type: 'vendor',
            loadTime: 800,
            cached: false,
            essential: false
          },
          {
            name: 'recharts + d3',
            size: 250000,
            gzipSize: 70000,
            percentage: 5.9,
            type: 'vendor',
            loadTime: 500,
            cached: true,
            essential: true
          },
          {
            name: 'SmartScan Components',
            size: 85000,
            gzipSize: 22000,
            percentage: 2.0,
            type: 'component',
            loadTime: 150,
            cached: false,
            essential: true
          },
          {
            name: 'SmartScan Services',
            size: 45000,
            gzipSize: 12000,
            percentage: 1.1,
            type: 'service',
            loadTime: 80,
            cached: false,
            essential: true
          },
          {
            name: 'Other Components',
            size: 120000,
            gzipSize: 35000,
            percentage: 2.8,
            type: 'component',
            loadTime: 200,
            cached: true,
            essential: true
          },
          {
            name: 'Utility Libraries',
            size: 65000,
            gzipSize: 18000,
            percentage: 1.5,
            type: 'utility',
            loadTime: 100,
            cached: true,
            essential: false
          }
        ],
        chunks: [
          {
            name: 'ai-vendor',
            size: 22456270,
            modules: ['@xenova/transformers', 'onnxruntime-web']
          },
          {
            name: 'react-vendor',
            size: 320000,
            modules: ['react', 'react-dom', 'react-router-dom']
          },
          {
            name: 'ui-vendor',
            size: 180000,
            modules: ['@radix-ui/react-dialog', '@radix-ui/react-select']
          },
          {
            name: 'smartscan-components',
            size: 130000,
            modules: ['SmartScanAdminDashboard', 'SmartScanBulkProcessor', 'MLTrainingPipeline']
          }
        ],
        recommendations: [
          {
            type: 'optimization',
            title: 'Large AI Models Detected',
            description: 'ONNX runtime and Transformers.js are contributing significantly to bundle size.',
            impact: 'high',
            action: 'Consider lazy loading AI models or using CDN hosting for model files'
          },
          {
            type: 'optimization',
            title: 'Three.js Not Essential',
            description: 'Three.js library is loaded but may not be critical for initial page load.',
            impact: 'medium',
            action: 'Move Three.js to a separate chunk and load on-demand'
          },
          {
            type: 'warning',
            title: 'Large Main Bundle',
            description: 'Main bundle exceeds 1MB which may impact initial load time.',
            impact: 'high',
            action: 'Implement more aggressive code splitting'
          },
          {
            type: 'info',
            title: 'Good Cache Strategy',
            description: 'Vendor libraries are properly cached and chunked.',
            impact: 'low',
            action: 'Continue current caching strategy'
          }
        ],
        performance: {
          parseTime: 450,
          evaluationTime: 680,
          renderTime: 320
        }
      };

      setAnalysis(mockAnalysis);
    } catch (error) {
      console.error('Error performing bundle analysis:', error);
    } finally {
      setIsAnalyzing(false);
    }
  };

  const optimizeBundle = async (moduleName: string) => {
    console.log(`Optimizing module: ${moduleName}`);
    // In real implementation, this would trigger optimization strategies
  };

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'vendor': return 'bg-blue-100 text-blue-800';
      case 'component': return 'bg-green-100 text-green-800';
      case 'service': return 'bg-purple-100 text-purple-800';
      case 'utility': return 'bg-yellow-100 text-yellow-800';
      case 'asset': return 'bg-gray-100 text-gray-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getImpactColor = (impact: string) => {
    switch (impact) {
      case 'high': return 'text-red-600';
      case 'medium': return 'text-yellow-600';
      case 'low': return 'text-green-600';
      default: return 'text-gray-600';
    }
  };

  const sortModules = (modules: BundleModule[]) => {
    return [...modules].sort((a, b) => {
      switch (sortBy) {
        case 'size':
          return b.size - a.size;
        case 'name':
          return a.name.localeCompare(b.name);
        case 'type':
          return a.type.localeCompare(b.type);
        default:
          return 0;
      }
    });
  };

  if (isAnalyzing) {
    return (
      <Card className={className}>
        <CardContent className="p-6">
          <div className="flex items-center justify-center space-y-4">
            <div className="text-center">
              <RefreshCw className="h-8 w-8 animate-spin mx-auto mb-4 text-primary" />
              <p className="text-lg font-medium">Analyzing Bundle</p>
              <p className="text-muted-foreground">Examining modules and dependencies...</p>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!analysis) {
    return (
      <Card className={className}>
        <CardContent className="p-6">
          <div className="text-center">
            <Package className="h-12 w-12 mx-auto mb-4 text-gray-300" />
            <p className="text-muted-foreground">No bundle analysis available</p>
            <Button onClick={performAnalysis} className="mt-4">
              <BarChart3 className="h-4 w-4 mr-2" />
              Start Analysis
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold flex items-center gap-2">
            <Package className="h-6 w-6" />
            Smart Bundle Analyzer
          </h2>
          <p className="text-muted-foreground">
            Analyze and optimize application bundle size
          </p>
        </div>
        <Button onClick={performAnalysis} variant="outline">
          <RefreshCw className="h-4 w-4 mr-2" />
          Re-analyze
        </Button>
      </div>

      {/* Bundle Overview */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Total Size</p>
                <p className="text-2xl font-bold">
                  {(analysis.totalSize / 1024 / 1024).toFixed(1)} MB
                </p>
              </div>
              <Package className="h-8 w-8 text-blue-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Gzipped</p>
                <p className="text-2xl font-bold">
                  {(analysis.gzipSize / 1024 / 1024).toFixed(1)} MB
                </p>
              </div>
              <Zap className="h-8 w-8 text-green-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Modules</p>
                <p className="text-2xl font-bold">{analysis.modules.length}</p>
              </div>
              <TrendingUp className="h-8 w-8 text-purple-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Parse Time</p>
                <p className="text-2xl font-bold">{analysis.performance.parseTime}ms</p>
              </div>
              <TrendingDown className="h-8 w-8 text-orange-500" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Recommendations */}
      {analysis.recommendations.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Optimization Recommendations</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {analysis.recommendations.map((rec, index) => (
                <Alert key={index} variant={rec.type === 'warning' ? 'destructive' : 'default'}>
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        {rec.type === 'optimization' && <Zap className="h-4 w-4 text-blue-500" />}
                        {rec.type === 'warning' && <AlertTriangle className="h-4 w-4 text-yellow-500" />}
                        {rec.type === 'info' && <CheckCircle className="h-4 w-4 text-green-500" />}
                        <span className="font-medium">{rec.title}</span>
                        <Badge variant="outline" className={getImpactColor(rec.impact)}>
                          {rec.impact} impact
                        </Badge>
                      </div>
                      <AlertDescription>{rec.description}</AlertDescription>
                      {rec.action && (
                        <p className="text-sm text-muted-foreground mt-1">
                          <strong>Action:</strong> {rec.action}
                        </p>
                      )}
                    </div>
                  </div>
                </Alert>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Module Analysis */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>Module Breakdown</CardTitle>
            <div className="flex items-center gap-2">
              <span className="text-sm text-muted-foreground">Sort by:</span>
              <select 
                value={sortBy} 
                onChange={(e) => setSortBy(e.target.value as any)}
                className="text-sm border rounded px-2 py-1"
              >
                <option value="size">Size</option>
                <option value="name">Name</option>
                <option value="type">Type</option>
              </select>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {sortModules(analysis.modules).map((module, index) => (
              <div 
                key={index} 
                className="flex items-center justify-between p-3 border rounded-lg hover:bg-gray-50 cursor-pointer"
                onClick={() => setSelectedModule(module)}
              >
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    <span className="font-medium">{module.name}</span>
                    <Badge className={getTypeColor(module.type)}>
                      {module.type}
                    </Badge>
                    {module.essential && (
                      <Badge variant="outline">Essential</Badge>
                    )}
                    {module.cached && (
                      <Badge variant="outline" className="text-green-600">
                        Cached
                      </Badge>
                    )}
                  </div>
                  
                  <div className="space-y-1">
                    <div className="flex items-center justify-between text-sm">
                      <span>Size: {(module.size / 1024).toFixed(1)} KB</span>
                      <span>Gzipped: {(module.gzipSize / 1024).toFixed(1)} KB</span>
                      <span>{module.percentage.toFixed(1)}% of total</span>
                    </div>
                    <Progress value={module.percentage} className="h-1" />
                  </div>
                </div>

                <div className="flex items-center gap-2 ml-4">
                  <Button variant="ghost" size="sm" onClick={(e) => {
                    e.stopPropagation();
                    optimizeBundle(module.name);
                  }}>
                    <Zap className="h-4 w-4" />
                  </Button>
                  <Button variant="ghost" size="sm">
                    <Eye className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Chunk Analysis */}
      <Card>
        <CardHeader>
          <CardTitle>Chunk Distribution</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {analysis.chunks.map((chunk, index) => (
              <div key={index} className="p-3 border rounded-lg">
                <div className="flex items-center justify-between mb-2">
                  <span className="font-medium">{chunk.name}</span>
                  <span className="text-sm text-muted-foreground">
                    {(chunk.size / 1024 / 1024).toFixed(2)} MB
                  </span>
                </div>
                <div className="text-sm text-muted-foreground">
                  Modules: {chunk.modules.join(', ')}
                </div>
                <Progress 
                  value={(chunk.size / analysis.totalSize) * 100} 
                  className="h-1 mt-2" 
                />
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Performance Metrics */}
      <Card>
        <CardHeader>
          <CardTitle>Performance Impact</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="space-y-2">
              <span className="text-sm font-medium">Parse Time</span>
              <div className="text-2xl font-bold">{analysis.performance.parseTime}ms</div>
              <Progress value={(analysis.performance.parseTime / 1000) * 100} className="h-2" />
              <p className="text-xs text-muted-foreground">Time to parse JavaScript</p>
            </div>

            <div className="space-y-2">
              <span className="text-sm font-medium">Evaluation Time</span>
              <div className="text-2xl font-bold">{analysis.performance.evaluationTime}ms</div>
              <Progress value={(analysis.performance.evaluationTime / 1000) * 100} className="h-2" />
              <p className="text-xs text-muted-foreground">Time to evaluate code</p>
            </div>

            <div className="space-y-2">
              <span className="text-sm font-medium">Render Time</span>
              <div className="text-2xl font-bold">{analysis.performance.renderTime}ms</div>
              <Progress value={(analysis.performance.renderTime / 1000) * 100} className="h-2" />
              <p className="text-xs text-muted-foreground">Time to first render</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Selected Module Details */}
      {selectedModule && (
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle>Module Details: {selectedModule.name}</CardTitle>
              <Button variant="ghost" size="sm" onClick={() => setSelectedModule(null)}>
                ×
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-3">
                <div>
                  <span className="text-sm text-muted-foreground">Size</span>
                  <p className="font-mono">{(selectedModule.size / 1024).toFixed(1)} KB</p>
                </div>
                <div>
                  <span className="text-sm text-muted-foreground">Gzipped Size</span>
                  <p className="font-mono">{(selectedModule.gzipSize / 1024).toFixed(1)} KB</p>
                </div>
                <div>
                  <span className="text-sm text-muted-foreground">Compression Ratio</span>
                  <p className="font-mono">
                    {((1 - selectedModule.gzipSize / selectedModule.size) * 100).toFixed(1)}%
                  </p>
                </div>
              </div>

              <div className="space-y-3">
                <div>
                  <span className="text-sm text-muted-foreground">Load Time</span>
                  <p className="font-mono">{selectedModule.loadTime}ms</p>
                </div>
                <div>
                  <span className="text-sm text-muted-foreground">Type</span>
                  <Badge className={getTypeColor(selectedModule.type)}>
                    {selectedModule.type}
                  </Badge>
                </div>
                <div className="flex gap-2">
                  {selectedModule.essential && (
                    <Badge variant="outline">Essential</Badge>
                  )}
                  {selectedModule.cached && (
                    <Badge variant="outline" className="text-green-600">Cached</Badge>
                  )}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default SmartBundleAnalyzer;