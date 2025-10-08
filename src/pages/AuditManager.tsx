import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/components/ui/use-toast';
import { AuditIntegrationProvider } from '@/contexts/AuditIntegrationContext';
import ImportExportManager from '@/components/audit/ImportExportManager';
import CrossModuleIntegration from '@/components/audit/CrossModuleIntegration';
import AuditSettings from '@/components/audit/AuditSettings';
import {
  Search,
  Plus,
  Filter,
  Eye,
  Edit,
  CheckCircle,
  XCircle,
  Clock,
  AlertTriangle,
  FileText,
  Users,
  Camera,
  Mic,
  BarChart3
} from 'lucide-react';

interface AuditCategory {
  id: string;
  name: string;
  description: string;
  icon: string;
  color: string;
  thumbnail_url?: string;
}

interface AuditInstance {
  id: string;
  name: string;
  description: string;
  status: string; // Allow any string from database
  priority: string; // Allow any string from database
  scheduled_date: string;
  compliance_score?: number;
  risk_level: string; // Allow any string from database
  template: {
    name: string;
    estimated_duration_minutes: number;
  };
  [key: string]: any; // Allow additional database fields
}

const statusColors = {
  draft: 'bg-secondary text-secondary-foreground',
  in_progress: 'bg-primary text-primary-foreground',
  completed: 'bg-accent text-accent-foreground',
  approved: 'bg-success text-success-foreground',
  rejected: 'bg-destructive text-destructive-foreground'
};

const priorityColors = {
  low: 'border-l-success',
  medium: 'border-l-warning',
  high: 'border-l-destructive',
  critical: 'border-l-destructive'
};

const AuditManager: React.FC = () => {
  const [categories, setCategories] = useState<AuditCategory[]>([]);
  const [audits, setAudits] = useState<AuditInstance[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const { toast } = useToast();

  useEffect(() => {
    loadCategories();
    loadAudits();
  }, []);

  const loadCategories = async () => {
    try {
      const { data, error } = await supabase
        .from('audit_categories')
        .select('*')
        .eq('is_active', true)
        .order('sort_order', { ascending: true });

      if (error) throw error;
      setCategories(data || []);
    } catch (error) {
      console.error('Error loading categories:', error);
      toast({
        title: 'Error',
        description: 'Failed to load audit categories',
        variant: 'destructive'
      });
    }
  };

  const loadAudits = async () => {
    try {
      const { data, error } = await supabase
        .from('audit_instances')
        .select(`
          *,
          template:audit_templates(name, estimated_duration_minutes)
        `)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setAudits(data || []);
    } catch (error) {
      console.error('Error loading audits:', error);
      toast({
        title: 'Error',
        description: 'Failed to load audits',
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  };

  const filteredAudits = audits.filter(audit => {
    const matchesSearch = audit.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         audit.description?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'all' || audit.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed': return <CheckCircle className="h-4 w-4" />;
      case 'approved': return <CheckCircle className="h-4 w-4 text-success" />;
      case 'rejected': return <XCircle className="h-4 w-4 text-destructive" />;
      case 'in_progress': return <Clock className="h-4 w-4 text-primary" />;
      default: return <FileText className="h-4 w-4" />;
    }
  };

  const getRiskIcon = (riskLevel: string) => {
    switch (riskLevel) {
      case 'high':
      case 'critical':
        return <AlertTriangle className="h-4 w-4 text-destructive" />;
      case 'medium':
        return <AlertTriangle className="h-4 w-4 text-warning" />;
      default:
        return <CheckCircle className="h-4 w-4 text-success" />;
    }
  };

  if (loading) {
    return (
      <div className="container mx-auto p-6">
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
        </div>
      </div>
    );
  }

  return (
    <AuditIntegrationProvider>
      <div className="container mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Enterprise Audit Manager</h1>
          <p className="text-muted-foreground">Multi-modal AI-powered audit management system</p>
        </div>
        <div className="flex items-center gap-3">
          <Button variant="outline" size="sm">
            <Camera className="h-4 w-4 mr-2" />
            Quick Scan
          </Button>
          <Button variant="outline" size="sm">
            <Mic className="h-4 w-4 mr-2" />
            Voice Command
          </Button>
          <Button>
            <Plus className="h-4 w-4 mr-2" />
            New Audit
          </Button>
        </div>
      </div>

      {/* Search and Filters */}
      <div className="flex items-center gap-4 p-4 bg-card rounded-lg border">
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search audits... (Type or speak)"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="px-3 py-2 bg-background border rounded-md text-sm"
        >
          <option value="all">All Status</option>
          <option value="draft">Draft</option>
          <option value="in_progress">In Progress</option>
          <option value="completed">Completed</option>
          <option value="approved">Approved</option>
          <option value="rejected">Rejected</option>
        </select>
        <Button variant="outline" size="sm">
          <Filter className="h-4 w-4 mr-2" />
          Advanced
        </Button>
      </div>

      <Tabs defaultValue="dashboard" className="space-y-6">
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="dashboard">Dashboard</TabsTrigger>
          <TabsTrigger value="audits">Active Audits</TabsTrigger>
          <TabsTrigger value="templates">Import/Export</TabsTrigger>
          <TabsTrigger value="analytics">Integration</TabsTrigger>
          <TabsTrigger value="settings">Settings</TabsTrigger>
        </TabsList>

        <TabsContent value="dashboard" className="space-y-6">
          {/* Category Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4">
            {categories.map((category) => (
              <Card key={category.id} className="cursor-pointer hover:shadow-md transition-shadow">
                <CardContent className="p-4 text-center">
                  <div 
                    className="w-12 h-12 mx-auto mb-3 rounded-lg flex items-center justify-center text-white text-xl"
                    style={{ backgroundColor: category.color }}
                  >
                    {category.icon}
                  </div>
                  <h3 className="font-semibold text-sm mb-1">{category.name}</h3>
                  <p className="text-xs text-muted-foreground">{category.description}</p>
                </CardContent>
              </Card>
            ))}
          </div>

          {/* Quick Stats */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">Total Audits</p>
                    <p className="text-2xl font-bold">{audits.length}</p>
                  </div>
                  <FileText className="h-8 w-8 text-primary" />
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">In Progress</p>
                    <p className="text-2xl font-bold">
                      {audits.filter(a => a.status === 'in_progress').length}
                    </p>
                  </div>
                  <Clock className="h-8 w-8 text-warning" />
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">Completed</p>
                    <p className="text-2xl font-bold">
                      {audits.filter(a => a.status === 'completed').length}
                    </p>
                  </div>
                  <CheckCircle className="h-8 w-8 text-success" />
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">Avg Score</p>
                    <p className="text-2xl font-bold">
                      {Math.round(audits.reduce((acc, a) => acc + (a.compliance_score || 0), 0) / audits.length || 0)}%
                    </p>
                  </div>
                  <BarChart3 className="h-8 w-8 text-accent" />
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="audits" className="space-y-4">
          <div className="grid gap-4">
            {filteredAudits.map((audit) => (
              <Card key={audit.id} className={`border-l-4 ${priorityColors[audit.priority]}`}>
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      {getStatusIcon(audit.status)}
                      <div>
                        <CardTitle className="text-lg">{audit.name}</CardTitle>
                        <CardDescription>{audit.description}</CardDescription>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      {getRiskIcon(audit.risk_level)}
                      <Badge className={statusColors[audit.status]}>
                        {audit.status.replace('_', ' ')}
                      </Badge>
                      <Badge variant="outline">
                        {audit.priority}
                      </Badge>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-6 text-sm text-muted-foreground">
                      <div className="flex items-center gap-1">
                        <Clock className="h-4 w-4" />
                        {audit.template?.estimated_duration_minutes}min
                      </div>
                      <div className="flex items-center gap-1">
                        <Users className="h-4 w-4" />
                        {audit.template?.name}
                      </div>
                      {audit.compliance_score && (
                        <div className="flex items-center gap-1">
                          <BarChart3 className="h-4 w-4" />
                          {audit.compliance_score}% Score
                        </div>
                      )}
                    </div>
                    <div className="flex items-center gap-2">
                      <Button variant="outline" size="sm">
                        <Eye className="h-4 w-4 mr-1" />
                        View
                      </Button>
                      <Button variant="outline" size="sm">
                        <Edit className="h-4 w-4 mr-1" />
                        Edit
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="templates" className="space-y-4">
          <ImportExportManager />
        </TabsContent>

        <TabsContent value="analytics" className="space-y-4">
          <CrossModuleIntegration />
        </TabsContent>

        <TabsContent value="settings" className="space-y-4">
          <AuditSettings />
        </TabsContent>
      </Tabs>
    </div>
    </AuditIntegrationProvider>
  );
};

export default AuditManager;