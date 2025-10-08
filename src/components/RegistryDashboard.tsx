import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import {
  Search,
  Plus,
  Ship,
  Building,
  Package,
  BarChart3,
  Star,
  Eye
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import {
  useYachtRegistry,
  useBusinessEntities,
  useProductServiceCatalog,
  useRegistryAnalytics,
  useGlobalRegistrySearch
} from '@/hooks/useRegistry';

interface RegistryDashboardProps {
  yachtId?: string;
}

const RegistryDashboard: React.FC<RegistryDashboardProps> = ({ yachtId }) => {
  const [activeTab, setActiveTab] = useState('overview');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedEntity, setSelectedEntity] = useState<any>(null);
  const { toast } = useToast();

  // Registry hooks
  const yachtRegistry = useYachtRegistry();
  const businessEntities = useBusinessEntities();
  const productCatalog = useProductServiceCatalog();
  const analytics = useRegistryAnalytics();
  const globalSearch = useGlobalRegistrySearch();

  // Load initial data
  useEffect(() => {
    const loadData = async () => {
      try {
        await Promise.all([
          yachtRegistry.list(),
          businessEntities.list({ status: 'active' }),
          productCatalog.list({ status: 'available' })
        ]);
      } catch (error) {
        console.error('Failed to load registry data:', error);
      }
    };

    loadData();
  }, []);

  const handleGlobalSearch = async () => {
    if (searchQuery.trim()) {
      await globalSearch.globalSearch(searchQuery, { semantic: true });
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Registry Management</h2>
          <p className="text-muted-foreground">
            Centralized registry for yachts, suppliers, clients, and business relationships
          </p>
        </div>
        <Button className="gap-2">
          <Plus className="h-4 w-4" />
          Add New
        </Button>
      </div>

      {/* Global Search */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex gap-4">
            <div className="flex-1">
              <Input
                placeholder="Search across all registry entries..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && handleGlobalSearch()}
              />
            </div>
            <Button onClick={handleGlobalSearch} disabled={globalSearch.loading}>
              <Search className="h-4 w-4 mr-2" />
              Search
            </Button>
          </div>
          
          {globalSearch.searchResults.total > 0 && (
            <GlobalSearchResults results={globalSearch.searchResults} />
          )}
        </CardContent>
      </Card>

      {/* Analytics Overview */}
      {analytics.analytics && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard
            title="Total Yachts"
            value={analytics.analytics.entity_counts?.yacht_registry || 0}
            icon={Ship}
            color="blue"
          />
          <StatCard
            title="Business Entities"
            value={analytics.analytics.entity_counts?.business_entities || 0}
            icon={Building}
            color="green"
          />
          <StatCard
            title="Products/Services"
            value={analytics.analytics.entity_counts?.product_service_catalog || 0}
            icon={Package}
            color="purple"
          />
          <StatCard
            title="Avg Quality Score"
            value={analytics.analytics.performance_metrics?.average_quality_score?.toFixed(1) || 'N/A'}
            icon={Star}
            color="yellow"
          />
        </div>
      )}

      {/* Main Registry Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="yachts">Yachts</TabsTrigger>
          <TabsTrigger value="entities">Entities</TabsTrigger>
          <TabsTrigger value="catalog">Catalog</TabsTrigger>
        </TabsList>

        {/* Overview Tab */}
        <TabsContent value="overview" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <RecentActivityCard />
            <QuickStatsCard 
              businessEntities={businessEntities.data}
              productCatalog={productCatalog.data}
            />
          </div>
        </TabsContent>

        {/* Yachts Tab */}
        <TabsContent value="yachts">
          <YachtRegistryTable
            yachts={yachtRegistry.data}
            loading={yachtRegistry.loading}
            onYachtSelect={setSelectedEntity}
          />
        </TabsContent>

        {/* Business Entities Tab */}
        <TabsContent value="entities">
          <BusinessEntitiesTable
            entities={businessEntities.data}
            loading={businessEntities.loading}
            onEntitySelect={setSelectedEntity}
          />
        </TabsContent>

        {/* Product Catalog Tab */}
        <TabsContent value="catalog">
          <ProductCatalogTable
            products={productCatalog.data}
            loading={productCatalog.loading}
            onProductSelect={setSelectedEntity}
          />
        </TabsContent>
      </Tabs>
    </div>
  );
};

// Stat Card Component
const StatCard: React.FC<{
  title: string;
  value: string | number;
  icon: React.ComponentType<any>;
  color: string;
}> = ({ title, value, icon: Icon, color }) => {
  const colorClasses = {
    blue: 'text-blue-500',
    green: 'text-green-500',
    purple: 'text-purple-500',
    yellow: 'text-yellow-500'
  };

  return (
    <Card>
      <CardContent className="flex items-center justify-between p-6">
        <div>
          <p className="text-sm font-medium text-muted-foreground">{title}</p>
          <p className="text-2xl font-bold">{value}</p>
        </div>
        <Icon className={`h-8 w-8 ${colorClasses[color]}`} />
      </CardContent>
    </Card>
  );
};

// Global Search Results Component
const GlobalSearchResults: React.FC<{ results: any }> = ({ results }) => {
  return (
    <div className="mt-4 space-y-4">
      <div className="flex items-center gap-2">
        <span className="text-sm font-medium">Search Results:</span>
        <Badge variant="outline">{results.total} total</Badge>
      </div>
      
      <div className="grid gap-4 md:grid-cols-3">
        {results.yachts.length > 0 && (
          <ResultCard title="Yachts" items={results.yachts} icon={Ship} />
        )}
        {results.entities.length > 0 && (
          <ResultCard title="Entities" items={results.entities} icon={Building} />
        )}
        {results.products.length > 0 && (
          <ResultCard title="Products" items={results.products} icon={Package} />
        )}
      </div>
    </div>
  );
};

const ResultCard: React.FC<{
  title: string;
  items: any[];
  icon: React.ComponentType<any>;
}> = ({ title, items, icon: Icon }) => {
  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-sm flex items-center gap-2">
          <Icon className="h-4 w-4" />
          {title} ({items.length})
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-2">
          {items.slice(0, 3).map((item: any) => (
            <div key={item.id} className="flex items-center justify-between">
              <span className="text-sm">
                {item.yacht_name || item.entity_name || item.item_name}
              </span>
              <Badge variant="outline">
                {item.yacht_type || item.entity_type || item.category}
              </Badge>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
};

// Recent Activity Card
const RecentActivityCard: React.FC = () => {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <BarChart3 className="h-5 w-5" />
          Recent Activity
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-sm">New yacht registered</span>
            <span className="text-xs text-muted-foreground">2 hours ago</span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-sm">Supplier updated catalog</span>
            <span className="text-xs text-muted-foreground">4 hours ago</span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-sm">New business entity added</span>
            <span className="text-xs text-muted-foreground">1 day ago</span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

// Quick Stats Card
const QuickStatsCard: React.FC<{
  businessEntities: any[];
  productCatalog: any[];
}> = ({ businessEntities, productCatalog }) => {
  const activeSuppliers = businessEntities.filter(
    e => e.entity_type === 'supplier' && e.account_status === 'active'
  ).length;
  
  const charterClients = businessEntities.filter(
    e => e.entity_type === 'charter_client'
  ).length;
  
  const availableProducts = productCatalog.filter(
    p => p.availability_status === 'available'
  ).length;

  return (
    <Card>
      <CardHeader>
        <CardTitle>Quick Stats</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-sm">Active Suppliers</span>
            <Badge variant="secondary">{activeSuppliers}</Badge>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-sm">Charter Clients</span>
            <Badge variant="secondary">{charterClients}</Badge>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-sm">Available Products</span>
            <Badge variant="secondary">{availableProducts}</Badge>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

// Yacht Registry Table
const YachtRegistryTable: React.FC<{
  yachts: any[];
  loading: boolean;
  onYachtSelect: (yacht: any) => void;
}> = ({ yachts, loading, onYachtSelect }) => {
  if (loading) {
    return <div className="text-center py-8">Loading yachts...</div>;
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Ship className="h-5 w-5" />
          Yacht Registry ({yachts.length})
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {yachts.map((yacht) => (
            <div key={yacht.id} className="flex items-center justify-between p-4 border rounded">
              <div>
                <h4 className="font-medium">{yacht.yacht_name}</h4>
                <p className="text-sm text-muted-foreground">
                  {yacht.yacht_type} • {yacht.length_overall_m}m • {yacht.year_built}
                </p>
              </div>
              <div className="flex items-center gap-2">
                <Badge variant={yacht.is_active ? 'default' : 'secondary'}>
                  {yacht.is_active ? 'Active' : 'Inactive'}
                </Badge>
                <Button size="sm" variant="outline" onClick={() => onYachtSelect(yacht)}>
                  <Eye className="h-4 w-4" />
                </Button>
              </div>
            </div>
          ))}
          
          {yachts.length === 0 && (
            <div className="text-center py-8 text-muted-foreground">
              No yachts found
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
};

// Business Entities Table
const BusinessEntitiesTable: React.FC<{
  entities: any[];
  loading: boolean;
  onEntitySelect: (entity: any) => void;
}> = ({ entities, loading, onEntitySelect }) => {
  if (loading) {
    return <div className="text-center py-8">Loading entities...</div>;
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Building className="h-5 w-5" />
          Business Entities ({entities.length})
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {entities.map((entity) => (
            <div key={entity.id} className="flex items-center justify-between p-4 border rounded">
              <div>
                <h4 className="font-medium">{entity.entity_name}</h4>
                <p className="text-sm text-muted-foreground">
                  {entity.entity_type} • {entity.industry_category?.join(', ')}
                </p>
              </div>
              <div className="flex items-center gap-2">
                <Badge variant={entity.account_status === 'active' ? 'default' : 'secondary'}>
                  {entity.account_status}
                </Badge>
                {entity.quality_rating && (
                  <div className="flex items-center gap-1">
                    <Star className="h-4 w-4 text-yellow-500" />
                    <span className="text-sm">{entity.quality_rating.toFixed(1)}</span>
                  </div>
                )}
                <Button size="sm" variant="outline" onClick={() => onEntitySelect(entity)}>
                  <Eye className="h-4 w-4" />
                </Button>
              </div>
            </div>
          ))}
          
          {entities.length === 0 && (
            <div className="text-center py-8 text-muted-foreground">
              No entities found
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
};

// Product Catalog Table
const ProductCatalogTable: React.FC<{
  products: any[];
  loading: boolean;
  onProductSelect: (product: any) => void;
}> = ({ products, loading, onProductSelect }) => {
  if (loading) {
    return <div className="text-center py-8">Loading products...</div>;
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Package className="h-5 w-5" />
          Product & Service Catalog ({products.length})
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {products.map((product) => (
            <div key={product.id} className="flex items-center justify-between p-4 border rounded">
              <div>
                <h4 className="font-medium">{product.item_name}</h4>
                <p className="text-sm text-muted-foreground">
                  {product.category} • {product.catalog_type}
                </p>
              </div>
              <div className="flex items-center gap-2">
                <Badge variant={product.availability_status === 'available' ? 'default' : 'secondary'}>
                  {product.availability_status}
                </Badge>
                {product.base_price && (
                  <span className="text-sm font-medium">
                    {product.base_price} {product.currency}
                  </span>
                )}
                <Button size="sm" variant="outline" onClick={() => onProductSelect(product)}>
                  <Eye className="h-4 w-4" />
                </Button>
              </div>
            </div>
          ))}
          
          {products.length === 0 && (
            <div className="text-center py-8 text-muted-foreground">
              No products found
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
};

export default RegistryDashboard;