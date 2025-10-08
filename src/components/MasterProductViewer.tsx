import { FC } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { 
  Package, 
  Wrench, 
  Star, 
  Calendar, 
  User, 
  ExternalLink,
  FileText,
  Image as ImageIcon,
  Wrench as ToolIcon,
  Shield
} from 'lucide-react';
import { MasterProduct } from '@/hooks/useProductLibrary';

interface MasterProductViewerProps {
  product: MasterProduct;
  onUseProduct: (product: MasterProduct) => void;
  onImproveProduct: (product: MasterProduct) => void;
  compact?: boolean;
}

const MasterProductViewer: React.FC<MasterProductViewerProps> = ({
  product,
  onUseProduct,
  onImproveProduct,
  compact = false
}) => {
  const getTypeIcon = () => {
    return product.product_type === 'equipment' ? <Wrench className="h-4 w-4" /> : <Package className="h-4 w-4" />;
  };

  const getConfidenceColor = (score: number) => {
    if (score >= 0.8) return "bg-success";
    if (score >= 0.6) return "bg-warning";
    return "bg-destructive";
  };

  if (compact) {
    return (
      <Card className="hover:shadow-md transition-shadow">
        <CardContent className="p-4">
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-2">
                {getTypeIcon()}
                <h3 className="font-semibold text-sm">{product.product_name}</h3>
                <Badge variant="outline" className="text-xs">
                  {product.product_type}
                </Badge>
              </div>
              
              {product.brand && (
                <p className="text-muted-foreground text-xs mb-1">
                  {product.brand} {product.model && `- ${product.model}`}
                </p>
              )}
              
              <div className="flex items-center gap-2 mb-2">
                <div className="flex items-center gap-1">
                  <Star className="h-3 w-3 fill-current" />
                  <span className="text-xs">{(product.confidence_score * 100).toFixed(0)}%</span>
                </div>
                <Badge variant="secondary" className="text-xs">
                  Used {product.usage_count}x
                </Badge>
              </div>
            </div>
            
            <div className="flex flex-col gap-1">
              <Button size="sm" onClick={() => onUseProduct(product)}>
                Use
              </Button>
              <Button size="sm" variant="outline" onClick={() => onImproveProduct(product)}>
                Improve
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="w-full max-w-4xl">
      <CardHeader>
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-3">
            {getTypeIcon()}
            <div>
              <CardTitle className="text-xl">{product.product_name}</CardTitle>
              {product.brand && (
                <p className="text-muted-foreground mt-1">
                  {product.brand} {product.model && `- ${product.model}`}
                </p>
              )}
            </div>
          </div>
          
          <div className="flex items-center gap-2">
            <Badge variant="outline">
              {product.product_type}
            </Badge>
            <Badge 
              className={`${getConfidenceColor(product.confidence_score)} text-primary-foreground`}
            >
              {(product.confidence_score * 100).toFixed(0)}% confident
            </Badge>
          </div>
        </div>
      </CardHeader>

      <CardContent className="space-y-6">
        {/* Basic Information */}
        <div>
          <h3 className="font-semibold mb-3">Product Information</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {product.category && (
              <div>
                <label className="text-sm font-medium text-muted-foreground">Category</label>
                <p>{product.category} {product.subcategory && `/ ${product.subcategory}`}</p>
              </div>
            )}
            
            {product.part_number && (
              <div>
                <label className="text-sm font-medium text-muted-foreground">Part Number</label>
                <p>{product.part_number}</p>
              </div>
            )}
            
            {product.weight && (
              <div>
                <label className="text-sm font-medium text-muted-foreground">Weight</label>
                <p>{product.weight} kg</p>
              </div>
            )}
            
            {product.warranty_period_months && (
              <div>
                <label className="text-sm font-medium text-muted-foreground">Warranty</label>
                <p>{product.warranty_period_months} months</p>
              </div>
            )}
          </div>
        </div>

        {product.description && (
          <>
            <Separator />
            <div>
              <h3 className="font-semibold mb-2">Description</h3>
              <p className="text-muted-foreground">{product.description}</p>
            </div>
          </>
        )}

        {/* Specifications */}
        {product.specifications && Object.keys(product.specifications).length > 0 && (
          <>
            <Separator />
            <div>
              <h3 className="font-semibold mb-3">Specifications</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {Object.entries(product.specifications).map(([key, value]) => (
                  <div key={key}>
                    <label className="text-sm font-medium text-muted-foreground capitalize">
                      {key.replace(/([A-Z])/g, ' $1')}
                    </label>
                    <p>{String(value)}</p>
                  </div>
                ))}
              </div>
            </div>
          </>
        )}

        {/* Documentation Links */}
        {(product.owner_manual_url || product.technical_specs_url || product.datasheet_url) && (
          <>
            <Separator />
            <div>
              <h3 className="font-semibold mb-3 flex items-center gap-2">
                <FileText className="h-4 w-4" />
                Documentation
              </h3>
              <div className="flex flex-wrap gap-2">
                {product.owner_manual_url && (
                  <Button variant="outline" size="sm" asChild>
                    <a href={product.owner_manual_url} target="_blank" rel="noopener noreferrer">
                      Owner Manual <ExternalLink className="h-3 w-3 ml-1" />
                    </a>
                  </Button>
                )}
                {product.technical_specs_url && (
                  <Button variant="outline" size="sm" asChild>
                    <a href={product.technical_specs_url} target="_blank" rel="noopener noreferrer">
                      Technical Specs <ExternalLink className="h-3 w-3 ml-1" />
                    </a>
                  </Button>
                )}
                {product.datasheet_url && (
                  <Button variant="outline" size="sm" asChild>
                    <a href={product.datasheet_url} target="_blank" rel="noopener noreferrer">
                      Datasheet <ExternalLink className="h-3 w-3 ml-1" />
                    </a>
                  </Button>
                )}
              </div>
            </div>
          </>
        )}

        {/* Maintenance Schedule */}
        {product.maintenance_schedule && product.maintenance_schedule.length > 0 && (
          <>
            <Separator />
            <div>
              <h3 className="font-semibold mb-3 flex items-center gap-2">
                <ToolIcon className="h-4 w-4" />
                Maintenance Schedule
              </h3>
              <div className="space-y-2">
                {product.maintenance_schedule.map((item: any, index: number) => (
                  <div key={index} className="flex items-center justify-between p-2 bg-muted rounded">
                    <span>{item.task || item.name}</span>
                    <Badge variant="outline">{item.frequency}</Badge>
                  </div>
                ))}
              </div>
            </div>
          </>
        )}

        {/* Safety Instructions */}
        {product.safety_instructions && (
          <>
            <Separator />
            <div>
              <h3 className="font-semibold mb-2 flex items-center gap-2">
                <Shield className="h-4 w-4" />
                Safety Instructions
              </h3>
              <p className="text-muted-foreground">{product.safety_instructions}</p>
            </div>
          </>
        )}

        {/* Stats */}
        <Separator />
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
          <div>
            <div className="text-2xl font-bold text-primary">{product.scan_count}</div>
            <div className="text-sm text-muted-foreground">Times Scanned</div>
          </div>
          <div>
            <div className="text-2xl font-bold text-primary">{product.usage_count}</div>
            <div className="text-sm text-muted-foreground">Times Used</div>
          </div>
          <div>
            <div className="text-2xl font-bold text-primary">
              {(product.data_quality_score * 100).toFixed(0)}%
            </div>
            <div className="text-sm text-muted-foreground">Data Quality</div>
          </div>
          <div>
            <div className="text-2xl font-bold text-primary">
              {product.verification_status === 'verified' ? 'Verified' : 'Pending'}
            </div>
            <div className="text-sm text-muted-foreground">Status</div>
          </div>
        </div>

        {/* Actions */}
        <Separator />
        <div className="flex justify-between items-center">
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Calendar className="h-4 w-4" />
            <span>Created {new Date(product.created_at).toLocaleDateString()}</span>
            {product.created_by && (
              <>
                <span>•</span>
                <User className="h-4 w-4" />
                <span>by contributor</span>
              </>
            )}
          </div>
          
          <div className="flex gap-2">
            <Button variant="outline" onClick={() => onImproveProduct(product)}>
              Suggest Improvement
            </Button>
            <Button onClick={() => onUseProduct(product)}>
              Use This Product
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default MasterProductViewer;