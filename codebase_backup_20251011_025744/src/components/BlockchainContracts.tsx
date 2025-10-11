import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Progress } from '@/components/ui/progress';
import { 
  FileText, 
  Shield, 
  Clock, 
  CheckCircle, 
  AlertTriangle,
  DollarSign,
  Users,
  Anchor,
  TrendingUp
} from 'lucide-react';
import { useToast } from '@/components/ui/use-toast';

interface SmartContract {
  id: string;
  type: 'charter' | 'crew' | 'maintenance' | 'insurance';
  status: 'active' | 'pending' | 'completed' | 'cancelled';
  parties: string[];
  value: number;
  currency: string;
  startDate: Date;
  endDate: Date;
  conditions: string[];
  autoExecuted: boolean;
  blockchainHash?: string;
}

interface ContractTemplate {
  id: string;
  name: string;
  type: string;
  description: string;
  template: string;
}

const BlockchainContracts: React.FC = () => {
  const { toast } = useToast();
  const [contracts, setContracts] = useState<SmartContract[]>([]);
  const [templates, setTemplates] = useState<ContractTemplate[]>([]);
  const [isCreating, setIsCreating] = useState(false);
  const [selectedTemplate, setSelectedTemplate] = useState<string>('');

  useEffect(() => {
    // Initialize sample data
    setContracts([
      {
        id: '1',
        type: 'charter',
        status: 'active',
        parties: ['Yacht Owner', 'Charter Guest'],
        value: 50000,
        currency: 'USD',
        startDate: new Date('2024-01-15'),
        endDate: new Date('2024-01-22'),
        conditions: ['Full payment received', 'Insurance verified', 'Crew briefed'],
        autoExecuted: true,
        blockchainHash: '0x7d1a2e3f4c5b6a9d8e7f2c1b0a9e8d7c6b5a4f3e2d1c0b9a8e7d6c5b4a3f2e1d0c'
      },
      {
        id: '2',
        type: 'crew',
        status: 'pending',
        parties: ['Yacht Management', 'Captain Smith'],
        value: 8000,
        currency: 'USD',
        startDate: new Date('2024-02-01'),
        endDate: new Date('2024-08-01'),
        conditions: ['Medical certificates', 'License verification', 'Background check'],
        autoExecuted: false
      },
      {
        id: '3',
        type: 'maintenance',
        status: 'completed',
        parties: ['Yacht Owner', 'Marina Service'],
        value: 15000,
        currency: 'EUR',
        startDate: new Date('2024-01-01'),
        endDate: new Date('2024-01-10'),
        conditions: ['Work completed', 'Quality inspection passed', 'Parts warranty'],
        autoExecuted: true,
        blockchainHash: '0x8a2b3c4d5e6f7a8b9c0d1e2f3a4b5c6d7e8f9a0b1c2d3e4f5a6b7c8d9e0f1a2b3c'
      }
    ]);

    setTemplates([
      {
        id: '1',
        name: 'Standard Charter Agreement',
        type: 'charter',
        description: 'Comprehensive charter contract with payment terms, cancellation policy, and liability clauses',
        template: 'CHARTER_TEMPLATE_V2'
      },
      {
        id: '2',
        name: 'Crew Employment Contract',
        type: 'crew',
        description: 'Employment agreement with salary, duties, and maritime law compliance',
        template: 'CREW_TEMPLATE_V1'
      },
      {
        id: '3',
        name: 'Maintenance Service Agreement',
        type: 'maintenance',
        description: 'Service contract with work scope, timeline, and warranty terms',
        template: 'MAINTENANCE_TEMPLATE_V1'
      }
    ]);
  }, []);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'bg-green-500';
      case 'pending': return 'bg-yellow-500';
      case 'completed': return 'bg-blue-500';
      case 'cancelled': return 'bg-red-500';
      default: return 'bg-gray-500';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'active': return <CheckCircle className="h-4 w-4" />;
      case 'pending': return <Clock className="h-4 w-4" />;
      case 'completed': return <CheckCircle className="h-4 w-4" />;
      case 'cancelled': return <AlertTriangle className="h-4 w-4" />;
      default: return <FileText className="h-4 w-4" />;
    }
  };

  const createContract = async () => {
    if (!selectedTemplate) {
      toast({
        title: "Template Required",
        description: "Please select a contract template first.",
        variant: "destructive",
      });
      return;
    }

    setIsCreating(true);
    
    // Simulate contract creation
    setTimeout(() => {
      const newContract: SmartContract = {
        id: Date.now().toString(),
        type: 'charter',
        status: 'pending',
        parties: ['Yacht Owner', 'New Client'],
        value: 45000,
        currency: 'USD',
        startDate: new Date(),
        endDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
        conditions: ['Payment pending', 'Documents review'],
        autoExecuted: false
      };

      setContracts(prev => [newContract, ...prev]);
      setIsCreating(false);
      
      toast({
        title: "Contract Created",
        description: "Smart contract has been generated and deployed to blockchain.",
      });
    }, 2000);
  };

  const executeContract = async (contractId: string) => {
    const contract = contracts.find(c => c.id === contractId);
    if (!contract) return;

    toast({
      title: "Executing Contract",
      description: "Processing smart contract execution...",
    });

    // Simulate blockchain execution
    setTimeout(() => {
      setContracts(prev => prev.map(c => 
        c.id === contractId 
          ? { 
              ...c, 
              status: 'active', 
              autoExecuted: true,
              blockchainHash: `0x${Math.random().toString(16).substr(2, 64)}`
            }
          : c
      ));
      
      toast({
        title: "Contract Executed",
        description: "Smart contract has been successfully executed on blockchain.",
      });
    }, 3000);
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Shield className="h-5 w-5" />
            Blockchain Smart Contracts
          </CardTitle>
          <CardDescription>
            Automated, secure, and transparent contract management for yacht operations
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="contracts" className="w-full">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="contracts">Active Contracts</TabsTrigger>
              <TabsTrigger value="templates">Templates</TabsTrigger>
              <TabsTrigger value="analytics">Analytics</TabsTrigger>
            </TabsList>

            <TabsContent value="contracts" className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold">Smart Contracts</h3>
                <Button 
                  onClick={createContract} 
                  disabled={isCreating}
                  className="flex items-center gap-2"
                >
                  {isCreating ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                      Creating...
                    </>
                  ) : (
                    <>
                      <FileText className="h-4 w-4" />
                      New Contract
                    </>
                  )}
                </Button>
              </div>

              <div className="grid gap-4">
                {contracts.map((contract) => (
                  <Card key={contract.id} className="border-l-4 border-l-primary">
                    <CardHeader>
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <Badge variant="outline" className="capitalize">
                            {contract.type}
                          </Badge>
                          <Badge 
                            className={`${getStatusColor(contract.status)} text-white`}
                          >
                            {getStatusIcon(contract.status)}
                            {contract.status}
                          </Badge>
                          {contract.autoExecuted && (
                            <Badge variant="secondary">
                              <Shield className="h-3 w-3 mr-1" />
                              Auto-Executed
                            </Badge>
                          )}
                        </div>
                        <div className="text-right">
                          <div className="font-semibold">
                            {contract.value.toLocaleString()} {contract.currency}
                          </div>
                          <div className="text-sm text-muted-foreground">
                            {contract.startDate.toLocaleDateString()} - {contract.endDate.toLocaleDateString()}
                          </div>
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-3">
                        <div>
                          <h4 className="font-medium mb-2">Parties</h4>
                          <div className="flex gap-2">
                            {contract.parties.map((party, index) => (
                              <Badge key={index} variant="outline">
                                <Users className="h-3 w-3 mr-1" />
                                {party}
                              </Badge>
                            ))}
                          </div>
                        </div>

                        <div>
                          <h4 className="font-medium mb-2">Conditions</h4>
                          <div className="space-y-1">
                            {contract.conditions.map((condition, index) => (
                              <div key={index} className="flex items-center gap-2 text-sm">
                                <CheckCircle className="h-3 w-3 text-green-500" />
                                {condition}
                              </div>
                            ))}
                          </div>
                        </div>

                        {contract.blockchainHash && (
                          <div>
                            <h4 className="font-medium mb-1">Blockchain Hash</h4>
                            <code className="text-xs bg-muted p-2 rounded block truncate">
                              {contract.blockchainHash}
                            </code>
                          </div>
                        )}

                        <div className="flex gap-2 pt-2">
                          {contract.status === 'pending' && (
                            <Button 
                              size="sm" 
                              onClick={() => executeContract(contract.id)}
                            >
                              Execute Contract
                            </Button>
                          )}
                          <Button size="sm" variant="outline">
                            View Details
                          </Button>
                          {contract.blockchainHash && (
                            <Button size="sm" variant="outline">
                              View on Blockchain
                            </Button>
                          )}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </TabsContent>

            <TabsContent value="templates" className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold">Contract Templates</h3>
                <Button variant="outline">
                  <FileText className="h-4 w-4 mr-2" />
                  Create Template
                </Button>
              </div>

              <div className="grid gap-4">
                {templates.map((template) => (
                  <Card 
                    key={template.id} 
                    className={`cursor-pointer transition-colors ${
                      selectedTemplate === template.id ? 'ring-2 ring-primary' : ''
                    }`}
                    onClick={() => setSelectedTemplate(template.id)}
                  >
                    <CardHeader>
                      <div className="flex items-center justify-between">
                        <CardTitle className="text-base">{template.name}</CardTitle>
                        <Badge variant="outline" className="capitalize">
                          {template.type}
                        </Badge>
                      </div>
                      <CardDescription>{template.description}</CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="flex items-center justify-between">
                        <code className="text-xs bg-muted px-2 py-1 rounded">
                          {template.template}
                        </code>
                        <div className="flex gap-2">
                          <Button size="sm" variant="outline">
                            Edit
                          </Button>
                          <Button size="sm" variant="outline">
                            Preview
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </TabsContent>

            <TabsContent value="analytics" className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Total Contracts</CardTitle>
                    <FileText className="h-4 w-4 text-muted-foreground" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">{contracts.length}</div>
                    <p className="text-xs text-muted-foreground">
                      +2 from last month
                    </p>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Contract Value</CardTitle>
                    <DollarSign className="h-4 w-4 text-muted-foreground" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">
                      {contracts.reduce((sum, c) => sum + c.value, 0).toLocaleString()}
                    </div>
                    <p className="text-xs text-muted-foreground">
                      Mixed currencies
                    </p>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Auto-Executed</CardTitle>
                    <TrendingUp className="h-4 w-4 text-muted-foreground" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">
                      {Math.round((contracts.filter(c => c.autoExecuted).length / contracts.length) * 100)}%
                    </div>
                    <p className="text-xs text-muted-foreground">
                      Automation rate
                    </p>
                  </CardContent>
                </Card>
              </div>

              <Card>
                <CardHeader>
                  <CardTitle>Contract Status Distribution</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {['active', 'pending', 'completed', 'cancelled'].map((status) => {
                      const count = contracts.filter(c => c.status === status).length;
                      const percentage = (count / contracts.length) * 100;
                      return (
                        <div key={status} className="space-y-1">
                          <div className="flex justify-between text-sm">
                            <span className="capitalize">{status}</span>
                            <span>{count} contracts</span>
                          </div>
                          <Progress value={percentage} className="h-2" />
                        </div>
                      );
                    })}
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
};

export default BlockchainContracts;