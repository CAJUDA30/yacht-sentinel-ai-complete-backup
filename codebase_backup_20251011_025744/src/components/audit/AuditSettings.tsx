import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useAuditIntegration } from '@/contexts/AuditIntegrationContext';
import { useToast } from '@/components/ui/use-toast';
import {
  Settings,
  Package,
  DollarSign,
  FileText,
  Brain,
  Mail,
  Shield,
  TestTube,
  CheckCircle,
  XCircle,
  Loader2,
  Plus,
  Trash2,
  Save
} from 'lucide-react';

const AuditSettings: React.FC = () => {
  const { config, updateConfig, testConnection, loading } = useAuditIntegration();
  const [testingModule, setTestingModule] = useState<string | null>(null);
  const [saving, setSaving] = useState<string | null>(null);
  const { toast } = useToast();

  const handleUpdateConfig = async (module: keyof typeof config, settings: any) => {
    setSaving(module);
    try {
      await updateConfig(module, settings);
    } finally {
      setSaving(null);
    }
  };

  const handleTestConnection = async (module: keyof typeof config) => {
    setTestingModule(module);
    try {
      await testConnection(module);
    } finally {
      setTestingModule(null);
    }
  };

  const addEmailTemplate = (templateKey: string) => {
    const name = prompt('Enter template name:');
    if (name) {
      handleUpdateConfig('email', {
        ...config.email,
        templates: {
          ...config.email.templates,
          [templateKey]: name
        }
      });
    }
  };

  const removeEmailTemplate = (templateKey: string) => {
    const { [templateKey]: removed, ...remainingTemplates } = config.email.templates;
    handleUpdateConfig('email', {
      ...config.email,
      templates: remainingTemplates
    });
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Audit Integration Settings</h2>
          <p className="text-muted-foreground">
            Configure cross-module integrations for comprehensive audit workflows
          </p>
        </div>
        <Badge variant={Object.values(config).some(m => typeof m === 'object' && m.enabled) ? "default" : "secondary"}>
          {Object.values(config).filter(m => typeof m === 'object' && m.enabled).length} modules enabled
        </Badge>
      </div>

      <Tabs defaultValue="procurement" className="space-y-6">
        <TabsList className="grid w-full grid-cols-4 lg:grid-cols-7">
          <TabsTrigger value="procurement" className="flex items-center gap-1">
            <Package className="h-4 w-4" />
            <span className="hidden sm:inline">Procurement</span>
          </TabsTrigger>
          <TabsTrigger value="finance" className="flex items-center gap-1">
            <DollarSign className="h-4 w-4" />
            <span className="hidden sm:inline">Finance</span>
          </TabsTrigger>
          <TabsTrigger value="documents" className="flex items-center gap-1">
            <FileText className="h-4 w-4" />
            <span className="hidden sm:inline">Documents</span>
          </TabsTrigger>
          <TabsTrigger value="inventory" className="flex items-center gap-1">
            <Package className="h-4 w-4" />
            <span className="hidden sm:inline">Inventory</span>
          </TabsTrigger>
          <TabsTrigger value="ai" className="flex items-center gap-1">
            <Brain className="h-4 w-4" />
            <span className="hidden sm:inline">AI</span>
          </TabsTrigger>
          <TabsTrigger value="email" className="flex items-center gap-1">
            <Mail className="h-4 w-4" />
            <span className="hidden sm:inline">Email</span>
          </TabsTrigger>
          <TabsTrigger value="compliance" className="flex items-center gap-1">
            <Shield className="h-4 w-4" />
            <span className="hidden sm:inline">Compliance</span>
          </TabsTrigger>
        </TabsList>

        {/* Procurement Settings */}
        <TabsContent value="procurement" className="space-y-4">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="flex items-center gap-2">
                    <Package className="h-5 w-5" />
                    Procurement Integration
                  </CardTitle>
                  <CardDescription>
                    Automate supplier tasks and procurement workflows from audit results
                  </CardDescription>
                </div>
                <div className="flex items-center gap-2">
                  <Badge variant={config.procurement.enabled ? "default" : "secondary"}>
                    {config.procurement.enabled ? "Enabled" : "Disabled"}
                  </Badge>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleTestConnection('procurement')}
                    disabled={testingModule === 'procurement'}
                  >
                    {testingModule === 'procurement' ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <TestTube className="h-4 w-4" />
                    )}
                    Test
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center space-x-2">
                <Switch
                  checked={config.procurement.enabled}
                  onCheckedChange={(checked) => 
                    handleUpdateConfig('procurement', { ...config.procurement, enabled: checked })
                  }
                />
                <Label>Enable procurement integration</Label>
              </div>

              {config.procurement.enabled && (
                <>
                  <div className="flex items-center space-x-2">
                    <Switch
                      checked={config.procurement.autoCreateTasks}
                      onCheckedChange={(checked) => 
                        handleUpdateConfig('procurement', { ...config.procurement, autoCreateTasks: checked })
                      }
                    />
                    <Label>Automatically create tasks from audit results</Label>
                  </div>

                  <div className="space-y-2">
                    <Label>Supplier Email Addresses</Label>
                    <Textarea
                      placeholder="supplier1@example.com, supplier2@example.com"
                      value={config.procurement.supplierEmails.join(', ')}
                      onChange={(e) => 
                        handleUpdateConfig('procurement', {
                          ...config.procurement,
                          supplierEmails: e.target.value.split(',').map(email => email.trim()).filter(Boolean)
                        })
                      }
                    />
                    <p className="text-sm text-muted-foreground">
                      Comma-separated list of supplier email addresses
                    </p>
                  </div>
                </>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Finance Settings */}
        <TabsContent value="finance" className="space-y-4">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="flex items-center gap-2">
                    <DollarSign className="h-5 w-5" />
                    Finance Integration
                  </CardTitle>
                  <CardDescription>
                    Manage quote approvals, payments, and financial workflows
                  </CardDescription>
                </div>
                <div className="flex items-center gap-2">
                  <Badge variant={config.finance.enabled ? "default" : "secondary"}>
                    {config.finance.enabled ? "Enabled" : "Disabled"}
                  </Badge>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleTestConnection('finance')}
                    disabled={testingModule === 'finance'}
                  >
                    {testingModule === 'finance' ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <TestTube className="h-4 w-4" />
                    )}
                    Test
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center space-x-2">
                <Switch
                  checked={config.finance.enabled}
                  onCheckedChange={(checked) => 
                    handleUpdateConfig('finance', { ...config.finance, enabled: checked })
                  }
                />
                <Label>Enable finance integration</Label>
              </div>

              {config.finance.enabled && (
                <>
                  <div className="space-y-2">
                    <Label>Payment Gateway</Label>
                    <Select
                      value={config.finance.paymentGateway}
                      onValueChange={(value: 'stripe' | 'paypal') => 
                        handleUpdateConfig('finance', { ...config.finance, paymentGateway: value })
                      }
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="stripe">Stripe</SelectItem>
                        <SelectItem value="paypal">PayPal</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label>Deposit Percentage (%)</Label>
                    <Input
                      type="number"
                      min="0"
                      max="100"
                      value={config.finance.depositPercentage}
                      onChange={(e) => 
                        handleUpdateConfig('finance', {
                          ...config.finance,
                          depositPercentage: parseInt(e.target.value) || 30
                        })
                      }
                    />
                  </div>

                  <div className="space-y-2">
                    <Label>Auto-Approval Threshold ($)</Label>
                    <Input
                      type="number"
                      min="0"
                      value={config.finance.autoApprovalThreshold}
                      onChange={(e) => 
                        handleUpdateConfig('finance', {
                          ...config.finance,
                          autoApprovalThreshold: parseInt(e.target.value) || 1000
                        })
                      }
                    />
                    <p className="text-sm text-muted-foreground">
                      Quotes below this amount will be auto-approved
                    </p>
                  </div>
                </>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* AI Settings */}
        <TabsContent value="ai" className="space-y-4">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="flex items-center gap-2">
                    <Brain className="h-5 w-5" />
                    AI Integration
                  </CardTitle>
                  <CardDescription>
                    Configure AI-powered analysis and automation
                  </CardDescription>
                </div>
                <div className="flex items-center gap-2">
                  <Badge variant={config.ai.enabled ? "default" : "secondary"}>
                    {config.ai.enabled ? "Enabled" : "Disabled"}
                  </Badge>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleTestConnection('ai')}
                    disabled={testingModule === 'ai'}
                  >
                    {testingModule === 'ai' ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <TestTube className="h-4 w-4" />
                    )}
                    Test
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center space-x-2">
                <Switch
                  checked={config.ai.enabled}
                  onCheckedChange={(checked) => 
                    handleUpdateConfig('ai', { ...config.ai, enabled: checked })
                  }
                />
                <Label>Enable AI-powered analysis</Label>
              </div>

              {config.ai.enabled && (
                <>
                  <div className="flex items-center space-x-2">
                    <Switch
                      checked={config.ai.autoAnalysis}
                      onCheckedChange={(checked) => 
                        handleUpdateConfig('ai', { ...config.ai, autoAnalysis: checked })
                      }
                    />
                    <Label>Automatically analyze audit photos and comments</Label>
                  </div>

                  <div className="space-y-2">
                    <Label>Confidence Threshold ({(config.ai.confidenceThreshold * 100).toFixed(0)}%)</Label>
                    <input
                      type="range"
                      min="0.1"
                      max="1"
                      step="0.05"
                      value={config.ai.confidenceThreshold}
                      onChange={(e) => 
                        handleUpdateConfig('ai', {
                          ...config.ai,
                          confidenceThreshold: parseFloat(e.target.value)
                        })
                      }
                      className="w-full"
                    />
                    <p className="text-sm text-muted-foreground">
                      Minimum confidence level for AI recommendations
                    </p>
                  </div>
                </>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Email Settings */}
        <TabsContent value="email" className="space-y-4">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="flex items-center gap-2">
                    <Mail className="h-5 w-5" />
                    Email Integration
                  </CardTitle>
                  <CardDescription>
                    Configure SMTP settings and email templates
                  </CardDescription>
                </div>
                <div className="flex items-center gap-2">
                  <Badge variant={config.email.enabled ? "default" : "secondary"}>
                    {config.email.enabled ? "Enabled" : "Disabled"}
                  </Badge>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleTestConnection('email')}
                    disabled={testingModule === 'email'}
                  >
                    {testingModule === 'email' ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <TestTube className="h-4 w-4" />
                    )}
                    Test
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center space-x-2">
                <Switch
                  checked={config.email.enabled}
                  onCheckedChange={(checked) => 
                    handleUpdateConfig('email', { ...config.email, enabled: checked })
                  }
                />
                <Label>Enable email integration</Label>
              </div>

              {config.email.enabled && (
                <>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>SMTP Server</Label>
                      <Input
                        placeholder="smtp.gmail.com"
                        value={config.email.smtpServer}
                        onChange={(e) => 
                          handleUpdateConfig('email', { ...config.email, smtpServer: e.target.value })
                        }
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>SMTP Port</Label>
                      <Input
                        type="number"
                        value={config.email.smtpPort}
                        onChange={(e) => 
                          handleUpdateConfig('email', {
                            ...config.email,
                            smtpPort: parseInt(e.target.value) || 587
                          })
                        }
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label>Username</Label>
                    <Input
                      placeholder="your-email@example.com"
                      value={config.email.username}
                      onChange={(e) => 
                        handleUpdateConfig('email', { ...config.email, username: e.target.value })
                      }
                    />
                  </div>

                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <Label>Email Templates</Label>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => addEmailTemplate(`template_${Date.now()}`)}
                      >
                        <Plus className="h-4 w-4 mr-1" />
                        Add Template
                      </Button>
                    </div>
                    <div className="space-y-2">
                      {Object.entries(config.email.templates).map(([key, value]) => (
                        <div key={key} className="flex items-center gap-2">
                          <Input
                            value={value}
                            onChange={(e) => 
                              handleUpdateConfig('email', {
                                ...config.email,
                                templates: {
                                  ...config.email.templates,
                                  [key]: e.target.value
                                }
                              })
                            }
                          />
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => removeEmailTemplate(key)}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      ))}
                    </div>
                  </div>
                </>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Compliance Settings */}
        <TabsContent value="compliance" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Shield className="h-5 w-5" />
                Marine Compliance Standards
              </CardTitle>
              <CardDescription>
                Configure compliance with marine industry standards
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-4">
                <div className="flex items-center space-x-2">
                  <Switch
                    checked={config.compliance.sire20}
                    onCheckedChange={(checked) => 
                      handleUpdateConfig('compliance', { ...config.compliance, sire20: checked })
                    }
                  />
                  <Label>SIRE 2.0 CVIQ (Digital Tanker Inspections)</Label>
                </div>

                <div className="flex items-center space-x-2">
                  <Switch
                    checked={config.compliance.ismCode}
                    onCheckedChange={(checked) => 
                      handleUpdateConfig('compliance', { ...config.compliance, ismCode: checked })
                    }
                  />
                  <Label>ISM Code (Safety Management for vessels ≥500GT)</Label>
                </div>

                <div className="flex items-center space-x-2">
                  <Switch
                    checked={config.compliance.iso9001}
                    onCheckedChange={(checked) => 
                      handleUpdateConfig('compliance', { ...config.compliance, iso9001: checked })
                    }
                  />
                  <Label>ISO 9001 (Quality Management Systems)</Label>
                </div>
              </div>

              <div className="space-y-2">
                <Label>Custom Standards</Label>
                <Textarea
                  placeholder="Enter custom compliance standards, one per line"
                  value={config.compliance.customStandards.join('\n')}
                  onChange={(e) => 
                    handleUpdateConfig('compliance', {
                      ...config.compliance,
                      customStandards: e.target.value.split('\n').filter(Boolean)
                    })
                  }
                />
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default AuditSettings;