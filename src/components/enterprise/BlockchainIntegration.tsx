import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Progress } from '@/components/ui/progress';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { 
  Lock, 
  Coins, 
  FileCheck, 
  Users,
  Key,
  Link,
  Shield,
  Zap,
  TrendingUp,
  Clock,
  CheckCircle,
  AlertCircle,
  CreditCard,
  Package,
  Anchor,
  Globe,
  Activity,
  Database
} from 'lucide-react';

interface SmartContract {
  id: string;
  name: string;
  type: 'charter' | 'maintenance' | 'supply' | 'insurance' | 'crew';
  status: 'active' | 'pending' | 'completed' | 'expired';
  value: number;
  currency: string;
  parties: string[];
  createdAt: string;
  expiresAt: string;
  conditions: string[];
  executionProgress: number;
}

interface BlockchainTransaction {
  id: string;
  type: 'payment' | 'contract' | 'asset' | 'identity' | 'supply';
  hash: string;
  amount: number;
  currency: string;
  from: string;
  to: string;
  timestamp: string;
  status: 'confirmed' | 'pending' | 'failed';
  gasUsed: number;
  blockNumber: number;
}

interface CryptoWallet {
  id: string;
  currency: string;
  symbol: string;
  balance: number;
  usdValue: number;
  change24h: number;
  address: string;
}

interface SupplyChainItem {
  id: string;
  name: string;
  category: string;
  origin: string;
  currentLocation: string;
  destination: string;
  status: 'in-transit' | 'delivered' | 'delayed' | 'lost';
  verificationHash: string;
  timestamps: {
    ordered: string;
    shipped: string;
    transit: string;
    delivered?: string;
  };
}

export default function BlockchainIntegration() {
  const [smartContracts, setSmartContracts] = useState<SmartContract[]>([]);
  const [transactions, setTransactions] = useState<BlockchainTransaction[]>([]);
  const [wallets, setWallets] = useState<CryptoWallet[]>([]);
  const [supplyChain, setSupplyChain] = useState<SupplyChainItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadBlockchainData();
    loadTransactions();
    loadWallets();
    loadSupplyChain();
    
    // Set up real-time refresh every 45 seconds for blockchain data
    const interval = setInterval(() => {
      loadBlockchainData();
      loadTransactions();
      loadWallets();
      loadSupplyChain();
    }, 45000);

    return () => clearInterval(interval);
  }, []);

  const loadBlockchainData = async () => {
    setIsLoading(true);
    try {
      // Fetch real smart contracts from database
      const { data: contractsData, error: contractsError } = await supabase
        .from('smart_contracts')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(20);

      if (contractsError) {
        console.error('Error fetching smart contracts:', contractsError);
        return;
      }

      // Transform contracts data to component format
      const transformedContracts: SmartContract[] = (contractsData || []).map(contract => ({
        id: contract.id,
        name: contract.contract_name,
        type: contract.contract_type as SmartContract['type'],
        status: contract.status as SmartContract['status'],
        value: contract.contract_value,
        currency: contract.currency,
        parties: contract.parties || [],
        createdAt: contract.created_at,
        expiresAt: contract.expires_at,
        conditions: contract.conditions || [],
        executionProgress: contract.execution_progress
      }));

      setSmartContracts(transformedContracts);
    } catch (error) {
      console.error('Failed to load blockchain data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const loadTransactions = async () => {
    try {
      // Fetch real blockchain transactions from database
      const { data: transactionsData, error: transactionsError } = await supabase
        .from('blockchain_transactions')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(20);

      if (transactionsError) {
        console.error('Error fetching blockchain transactions:', transactionsError);
        return;
      }

      // Transform transactions data to component format
      const transformedTransactions: BlockchainTransaction[] = (transactionsData || []).map(tx => ({
        id: tx.id,
        type: tx.transaction_type as BlockchainTransaction['type'],
        hash: tx.transaction_hash,
        amount: tx.amount,
        currency: tx.currency,
        from: tx.from_address,
        to: tx.to_address,
        timestamp: tx.created_at,
        status: tx.status as BlockchainTransaction['status'],
        gasUsed: tx.gas_used,
        blockNumber: tx.block_number || 0
      }));

      setTransactions(transformedTransactions);
    } catch (error) {
      console.error('Failed to load transactions:', error);
    }
  };

  const loadWallets = async () => {
    try {
      // Fetch real crypto wallets from database
      const { data: walletsData, error: walletsError } = await supabase
        .from('crypto_wallets')
        .select('*')
        .eq('is_active', true)
        .order('usd_value', { ascending: false });

      if (walletsError) {
        console.error('Error fetching crypto wallets:', walletsError);
        return;
      }

      // Transform wallets data to component format
      const transformedWallets: CryptoWallet[] = (walletsData || []).map(wallet => ({
        id: wallet.id,
        currency: wallet.currency,
        symbol: wallet.symbol,
        balance: wallet.balance,
        usdValue: wallet.usd_value,
        change24h: wallet.change_24h,
        address: wallet.wallet_address
      }));

      setWallets(transformedWallets);
    } catch (error) {
      console.error('Failed to load wallets:', error);
    }
  };

  const loadSupplyChain = async () => {
    try {
      // Fetch real supply chain items from database
      const { data: supplyData, error: supplyError } = await supabase
        .from('supply_chain_items')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(20);

      if (supplyError) {
        console.error('Error fetching supply chain items:', supplyError);
        return;
      }

      // Transform supply chain data to component format
      const transformedSupply: SupplyChainItem[] = (supplyData || []).map(item => ({
        id: item.id,
        name: item.item_name,
        category: item.category,
        origin: item.origin_location,
        currentLocation: item.current_location,
        destination: item.destination_location,
        status: item.status as SupplyChainItem['status'],
        verificationHash: item.verification_hash,
        timestamps: item.timestamps || {
          ordered: item.created_at,
          shipped: item.created_at,
          transit: item.updated_at
        }
      }));

      setSupplyChain(transformedSupply);
    } catch (error) {
      console.error('Failed to load supply chain data:', error);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active':
      case 'confirmed':
      case 'delivered':
        return 'bg-green-100 text-green-800 border-green-200';
      case 'pending':
      case 'in-transit':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'completed':
        return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'expired':
      case 'failed':
      case 'lost':
        return 'bg-red-100 text-red-800 border-red-200';
      case 'delayed':
        return 'bg-orange-100 text-orange-800 border-orange-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getContractIcon = (type: string) => {
    switch (type) {
      case 'charter':
        return <Anchor className="w-4 h-4" />;
      case 'maintenance':
        return <Zap className="w-4 h-4" />;
      case 'supply':
        return <Package className="w-4 h-4" />;
      case 'insurance':
        return <Shield className="w-4 h-4" />;
      case 'crew':
        return <Users className="w-4 h-4" />;
      default:
        return <FileCheck className="w-4 h-4" />;
    }
  };

  const getTransactionIcon = (type: string) => {
    switch (type) {
      case 'payment':
        return <CreditCard className="w-4 h-4" />;
      case 'contract':
        return <FileCheck className="w-4 h-4" />;
      case 'asset':
        return <Package className="w-4 h-4" />;
      case 'identity':
        return <Users className="w-4 h-4" />;
      case 'supply':
        return <Link className="w-4 h-4" />;
      default:
        return <Activity className="w-4 h-4" />;
    }
  };

  const truncateHash = (hash: string, length: number = 10) => {
    return `${hash.slice(0, length)}...${hash.slice(-length)}`;
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
          <p className="mt-2 text-muted-foreground">Loading blockchain integration...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-foreground">Blockchain Integration</h2>
          <p className="text-muted-foreground">Blockchain-based transactions and smart contract automation</p>
        </div>
        <div className="flex items-center gap-2">
          <Badge className="bg-purple-100 text-purple-800 border-purple-200">
            <Lock className="w-4 h-4 mr-1" />
            Blockchain Secured
          </Badge>
          <Badge className="bg-green-100 text-green-800 border-green-200">
            <CheckCircle className="w-4 h-4 mr-1" />
            {smartContracts.filter(c => c.status === 'active').length} Active Contracts
          </Badge>
        </div>
      </div>

      {/* Overview Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center">
              <FileCheck className="h-4 w-4 text-muted-foreground" />
              <div className="ml-2">
                <p className="text-sm font-medium text-muted-foreground">Smart Contracts</p>
                <p className="text-2xl font-bold">{smartContracts.length}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center">
              <Activity className="h-4 w-4 text-muted-foreground" />
              <div className="ml-2">
                <p className="text-sm font-medium text-muted-foreground">Transactions</p>
                <p className="text-2xl font-bold">{transactions.length}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center">
              <Coins className="h-4 w-4 text-muted-foreground" />
              <div className="ml-2">
                <p className="text-sm font-medium text-muted-foreground">Total Portfolio</p>
                <p className="text-2xl font-bold">
                  ${wallets.reduce((sum, w) => sum + w.usdValue, 0).toLocaleString()}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center">
              <Link className="h-4 w-4 text-muted-foreground" />
              <div className="ml-2">
                <p className="text-sm font-medium text-muted-foreground">Supply Chain Items</p>
                <p className="text-2xl font-bold">{supplyChain.length}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="contracts" className="space-y-6">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="contracts">Smart Contracts</TabsTrigger>
          <TabsTrigger value="transactions">Transactions</TabsTrigger>
          <TabsTrigger value="wallets">Crypto Wallets</TabsTrigger>
          <TabsTrigger value="supply">Supply Chain</TabsTrigger>
        </TabsList>

        <TabsContent value="contracts" className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {smartContracts.map((contract) => (
              <Card key={contract.id} className="hover:shadow-lg transition-shadow">
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="p-2 bg-purple-100 rounded-lg">
                        {getContractIcon(contract.type)}
                      </div>
                      <div>
                        <CardTitle className="text-lg">{contract.name}</CardTitle>
                        <CardDescription className="capitalize">{contract.type} Contract</CardDescription>
                      </div>
                    </div>
                    <Badge className={getStatusColor(contract.status)} variant="outline">
                      {contract.status}
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <span className="text-sm text-muted-foreground">Contract Value</span>
                    <span className="text-xl font-bold">
                      {contract.value.toLocaleString()} {contract.currency}
                    </span>
                  </div>

                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span>Execution Progress</span>
                      <span className="font-medium">{contract.executionProgress}%</span>
                    </div>
                    <Progress value={contract.executionProgress} className="h-2" />
                  </div>

                  <div className="space-y-2">
                    <h4 className="text-sm font-medium">Contract Conditions</h4>
                    <ul className="space-y-1">
                      {contract.conditions.slice(0, 2).map((condition, index) => (
                        <li key={index} className="text-sm text-muted-foreground flex items-center gap-2">
                          <CheckCircle className="w-3 h-3 text-green-600 flex-shrink-0" />
                          {condition}
                        </li>
                      ))}
                      {contract.conditions.length > 2 && (
                        <li className="text-sm text-muted-foreground">
                          +{contract.conditions.length - 2} more conditions
                        </li>
                      )}
                    </ul>
                  </div>

                  <div className="grid grid-cols-2 gap-4 text-xs text-muted-foreground">
                    <div>
                      <span>Created:</span>
                      <div className="font-medium">{new Date(contract.createdAt).toLocaleDateString()}</div>
                    </div>
                    <div>
                      <span>Expires:</span>
                      <div className="font-medium">{new Date(contract.expiresAt).toLocaleDateString()}</div>
                    </div>
                  </div>

                  <div className="flex gap-2 pt-2 border-t">
                    <Button variant="outline" size="sm" className="flex-1">
                      View Details
                    </Button>
                    <Button variant="outline" size="sm" className="flex-1">
                      Execute
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="transactions" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Recent Blockchain Transactions</CardTitle>
              <CardDescription>Transaction history and blockchain activity</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {transactions.map((tx) => (
                  <div key={tx.id} className="flex items-center justify-between p-4 border rounded-lg hover:bg-gray-50">
                    <div className="flex items-center gap-4">
                      <div className={`p-2 rounded-lg ${getStatusColor(tx.status)}`}>
                        {getTransactionIcon(tx.type)}
                      </div>
                      <div>
                        <div className="font-medium capitalize">{tx.type} Transaction</div>
                        <div className="text-sm text-muted-foreground">
                          Hash: {truncateHash(tx.hash)}
                        </div>
                        <div className="text-sm text-muted-foreground">
                          From: {truncateHash(tx.from)} → To: {truncateHash(tx.to)}
                        </div>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="font-medium">
                        {tx.amount > 0 ? `${tx.amount.toLocaleString()} ${tx.currency}` : 'Contract Call'}
                      </div>
                      <div className="text-sm text-muted-foreground">
                        Block #{tx.blockNumber.toLocaleString()}
                      </div>
                      <Badge className={getStatusColor(tx.status)} variant="outline">
                        {tx.status}
                      </Badge>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="wallets" className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {wallets.map((wallet) => (
              <Card key={wallet.id} className="hover:shadow-lg transition-shadow">
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="p-2 bg-orange-100 rounded-lg">
                        <Coins className="w-5 h-5" />
                      </div>
                      <div>
                        <CardTitle className="text-lg">{wallet.currency}</CardTitle>
                        <CardDescription>{wallet.symbol} Wallet</CardDescription>
                      </div>
                    </div>
                    <Badge className={wallet.change24h >= 0 ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'} variant="outline">
                      {wallet.change24h >= 0 ? '+' : ''}{wallet.change24h}%
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="text-center p-4 bg-gray-50 rounded-lg">
                    <div className="text-3xl font-bold text-primary">
                      {wallet.balance.toFixed(6)}
                    </div>
                    <div className="text-sm text-muted-foreground">{wallet.symbol}</div>
                    <div className="text-lg font-medium text-green-600 mt-2">
                      ${wallet.usdValue.toLocaleString()}
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label className="text-sm">Wallet Address</Label>
                    <div className="p-2 bg-gray-100 rounded text-xs font-mono">
                      {wallet.address}
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-2">
                    <Button variant="outline" size="sm">
                      Send
                    </Button>
                    <Button variant="outline" size="sm">
                      Receive
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="supply" className="space-y-4">
          <div className="space-y-6">
            {supplyChain.map((item) => (
              <Card key={item.id} className="hover:shadow-lg transition-shadow">
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="p-2 bg-green-100 rounded-lg">
                        <Package className="w-5 h-5" />
                      </div>
                      <div>
                        <CardTitle className="text-lg">{item.name}</CardTitle>
                        <CardDescription>{item.category}</CardDescription>
                      </div>
                    </div>
                    <Badge className={getStatusColor(item.status)} variant="outline">
                      {item.status.replace('-', ' ')}
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-3 gap-4 text-center">
                    <div className="p-3 bg-blue-50 rounded-lg">
                      <div className="text-sm font-medium text-blue-700">Origin</div>
                      <div className="text-xs text-blue-600">{item.origin}</div>
                    </div>
                    <div className="p-3 bg-yellow-50 rounded-lg">
                      <div className="text-sm font-medium text-yellow-700">Current</div>
                      <div className="text-xs text-yellow-600">{item.currentLocation}</div>
                    </div>
                    <div className="p-3 bg-green-50 rounded-lg">
                      <div className="text-sm font-medium text-green-700">Destination</div>
                      <div className="text-xs text-green-600">{item.destination}</div>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span>Delivery Progress</span>
                      <span className="font-medium">
                        {item.status === 'delivered' ? '100%' : 
                         item.status === 'in-transit' ? '75%' : 
                         item.status === 'delayed' ? '60%' : '25%'}
                      </span>
                    </div>
                    <Progress value={
                      item.status === 'delivered' ? 100 : 
                      item.status === 'in-transit' ? 75 : 
                      item.status === 'delayed' ? 60 : 25
                    } className="h-2" />
                  </div>

                  <div className="space-y-2">
                    <Label className="text-sm">Blockchain Verification Hash</Label>
                    <div className="p-2 bg-gray-100 rounded text-xs font-mono">
                      {truncateHash(item.verificationHash, 20)}
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4 text-xs">
                    <div>
                      <span className="text-muted-foreground">Ordered:</span>
                      <div className="font-medium">{new Date(item.timestamps.ordered).toLocaleDateString()}</div>
                    </div>
                    <div>
                      <span className="text-muted-foreground">Shipped:</span>
                      <div className="font-medium">{new Date(item.timestamps.shipped).toLocaleDateString()}</div>
                    </div>
                    {item.timestamps.delivered && (
                      <div className="col-span-2">
                        <span className="text-muted-foreground">Delivered:</span>
                        <div className="font-medium">{new Date(item.timestamps.delivered).toLocaleDateString()}</div>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}