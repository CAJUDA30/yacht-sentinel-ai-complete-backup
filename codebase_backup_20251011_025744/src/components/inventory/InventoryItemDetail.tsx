import { FC } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Separator } from "@/components/ui/separator";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { 
  Package, 
  MapPin, 
  Calendar, 
  DollarSign, 
  AlertTriangle, 
  CheckCircle,
  Edit,
  Trash2,
  Copy,
  History,
  Tag,
  Barcode,
  QrCode,
  Weight,
  Ruler,
  User,
  Clock,
  TrendingUp,
  TrendingDown,
  Camera,
  FileText,
  ExternalLink
} from "lucide-react";
import { InventoryItemType } from "@/types/inventory";
import { useCurrency } from "@/contexts/CurrencyContext";

interface InventoryItemDetailProps {
  item: InventoryItemType;
  isOpen: boolean;
  onClose: () => void;
  onEdit: () => void;
  onDelete: () => void;
  onDuplicate: () => void;
}

export const InventoryItemDetail = ({
  item,
  isOpen,
  onClose,
  onEdit,
  onDelete,
  onDuplicate
}: InventoryItemDetailProps) => {
  const { formatPrice } = useCurrency();

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'in-stock':
        return 'bg-green-100 text-green-800 border-green-200';
      case 'low-stock':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'out-of-stock':
        return 'bg-red-100 text-red-800 border-red-200';
      case 'on-order':
        return 'bg-blue-100 text-blue-800 border-blue-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getPriorityColor = (priority?: string) => {
    switch (priority) {
      case 'critical':
        return 'bg-red-100 text-red-800 border-red-200';
      case 'high':
        return 'bg-orange-100 text-orange-800 border-orange-200';
      case 'medium':
        return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'low':
        return 'bg-gray-100 text-gray-800 border-gray-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const totalValue = (item.purchasePrice || 0) * (item.quantity || 0);
  const stockPercentage = item.minStock ? Math.min(100, (item.quantity / item.minStock) * 100) : 100;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto bg-background/95 backdrop-blur-sm">
        <DialogHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="p-2 rounded-lg bg-gradient-ocean">
                <Package className="h-6 w-6 text-primary-foreground" />
              </div>
              <div>
                <DialogTitle className="text-2xl font-bold text-foreground">
                  {item.name}
                </DialogTitle>
                <p className="text-muted-foreground">
                  {item.sku ? `SKU: ${item.sku}` : 'No SKU assigned'}
                </p>
              </div>
            </div>
            
            <div className="flex items-center space-x-2">
              <Button variant="outline" size="sm" onClick={onEdit}>
                <Edit className="h-4 w-4 mr-2" />
                Edit
              </Button>
              <Button variant="outline" size="sm" onClick={onDuplicate}>
                <Copy className="h-4 w-4 mr-2" />
                Duplicate
              </Button>
              <Button 
                variant="destructive" 
                size="sm" 
                onClick={() => {
                  if (window.confirm(`Are you sure you want to delete "${item.name}"? This action cannot be undone.`)) {
                    onDelete();
                  }
                }}
              >
                <Trash2 className="h-4 w-4 mr-2" />
                Delete
              </Button>
            </div>
          </div>
        </DialogHeader>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mt-6">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-6">
            
            {/* Item Photos */}
            {item.photos && item.photos.length > 0 && (
              <Card className="shadow-neumorphic border-border/50 bg-card/80 backdrop-blur-sm">
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2">
                    <Camera className="h-5 w-5" />
                    <span>Photos</span>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                    {item.photos.map((photo, index) => (
                      <div key={index} className="aspect-square rounded-lg overflow-hidden bg-muted">
                        <img 
                          src={photo} 
                          alt={`${item.name} - ${index + 1}`}
                          className="w-full h-full object-cover hover:scale-105 transition-transform duration-200"
                        />
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Description & Details */}
            <Card className="shadow-neumorphic border-border/50 bg-card/80 backdrop-blur-sm">
              <CardHeader>
                <CardTitle>Item Details</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {item.description && (
                  <div>
                    <Label className="text-sm font-medium text-muted-foreground">Description</Label>
                    <p className="text-foreground mt-1">{item.description}</p>
                  </div>
                )}
                
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label className="text-sm font-medium text-muted-foreground">Category</Label>
                    <p className="text-foreground mt-1">{item.folder || 'Uncategorized'}</p>
                  </div>
                  <div>
                    <Label className="text-sm font-medium text-muted-foreground">Condition</Label>
                    <Badge className={`mt-1 ${item.condition === 'new' ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'}`}>
                      {item.condition || 'Unknown'}
                    </Badge>
                  </div>
                </div>

                {(item.weight || item.dimensions) && (
                  <div className="grid grid-cols-2 gap-4">
                    {item.weight && (
                      <div className="flex items-center space-x-2">
                        <Weight className="h-4 w-4 text-muted-foreground" />
                        <span className="text-sm">Weight: {item.weight}kg</span>
                      </div>
                    )}
                    {item.dimensions && (
                      <div className="flex items-center space-x-2">
                        <Ruler className="h-4 w-4 text-muted-foreground" />
                        <span className="text-sm">
                          Dimensions: {item.dimensions.length}×{item.dimensions.width}×{item.dimensions.height} cm
                        </span>
                      </div>
                    )}
                  </div>
                )}

                {item.tags && item.tags.length > 0 && (
                  <div>
                    <Label className="text-sm font-medium text-muted-foreground">Tags</Label>
                    <div className="flex flex-wrap gap-2 mt-1">
                      {item.tags.map((tag, index) => (
                        <Badge key={index} variant="outline" className="bg-primary/10">
                          <Tag className="h-3 w-3 mr-1" />
                          {tag}
                        </Badge>
                      ))}
                    </div>
                  </div>
                )}

                {item.notes && (
                  <div>
                    <Label className="text-sm font-medium text-muted-foreground">Notes</Label>
                    <p className="text-foreground mt-1 text-sm bg-muted/50 p-3 rounded-lg">
                      {item.notes}
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Supplier Information */}
            {(item.supplier || item.supplierContact || item.supplierItemId) && (
              <Card className="shadow-neumorphic border-border/50 bg-card/80 backdrop-blur-sm">
                <CardHeader>
                  <CardTitle>Supplier Information</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  {item.supplier && (
                    <div>
                      <Label className="text-sm font-medium text-muted-foreground">Supplier</Label>
                      <p className="text-foreground mt-1">{item.supplier}</p>
                    </div>
                  )}
                  {item.supplierContact && (
                    <div>
                      <Label className="text-sm font-medium text-muted-foreground">Contact</Label>
                      <p className="text-foreground mt-1">{item.supplierContact}</p>
                    </div>
                  )}
                  {item.supplierItemId && (
                    <div>
                      <Label className="text-sm font-medium text-muted-foreground">Supplier Item ID</Label>
                      <p className="text-foreground mt-1">{item.supplierItemId}</p>
                    </div>
                  )}
                </CardContent>
              </Card>
            )}
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            
            {/* Stock Status */}
            <Card className="shadow-neumorphic border-border/50 bg-card/80 backdrop-blur-sm">
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Package className="h-5 w-5" />
                  <span>Stock Status</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="text-center">
                  <div className="text-3xl font-bold text-foreground">{item.quantity}</div>
                  <div className="text-sm text-muted-foreground">Current Stock</div>
                </div>
                
                {item.minStock && (
                  <div>
                    <div className="flex justify-between text-sm mb-2">
                      <span>Stock Level</span>
                      <span>{Math.round(stockPercentage)}%</span>
                    </div>
                    <Progress value={stockPercentage} className="h-2" />
                    <div className="flex justify-between text-xs text-muted-foreground mt-1">
                      <span>Min: {item.minStock}</span>
                      {item.maxStock && <span>Max: {item.maxStock}</span>}
                    </div>
                  </div>
                )}
                
                <div className="flex items-center justify-center">
                  <Badge className={`${getStatusColor(item.status)} border`}>
                    {item.status.replace('-', ' ').toUpperCase()}
                  </Badge>
                </div>

                {item.priority && (
                  <div className="flex items-center justify-center">
                    <Badge className={`${getPriorityColor(item.priority)} border`}>
                      {item.priority.toUpperCase()} PRIORITY
                    </Badge>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Financial Information */}
            <Card className="shadow-neumorphic border-border/50 bg-card/80 backdrop-blur-sm">
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <DollarSign className="h-5 w-5" />
                  <span>Financial</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {item.purchasePrice && (
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Unit Price</span>
                    <span className="font-medium">{formatPrice(item.purchasePrice)}</span>
                  </div>
                )}
                
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Total Value</span>
                  <span className="font-bold text-lg">{formatPrice(totalValue)}</span>
                </div>
                
                {item.unitCost && (
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Unit Cost</span>
                    <span className="font-medium">{formatPrice(item.unitCost)}</span>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Location & Tracking */}
            <Card className="shadow-neumorphic border-border/50 bg-card/80 backdrop-blur-sm">
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <MapPin className="h-5 w-5" />
                  <span>Location & Tracking</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div>
                  <Label className="text-sm font-medium text-muted-foreground">Location</Label>
                  <p className="text-foreground mt-1">{item.location}</p>
                </div>
                
                {item.sublocation && (
                  <div>
                    <Label className="text-sm font-medium text-muted-foreground">Sub-location</Label>
                    <p className="text-foreground mt-1">{item.sublocation}</p>
                  </div>
                )}

                {item.barcode && (
                  <div className="flex items-center space-x-2">
                    <Barcode className="h-4 w-4 text-muted-foreground" />
                    <span className="text-sm">{item.barcode}</span>
                  </div>
                )}

                {item.qrCode && (
                  <div className="flex items-center space-x-2">
                    <QrCode className="h-4 w-4 text-muted-foreground" />
                    <span className="text-sm">{item.qrCode}</span>
                  </div>
                )}

                {item.serialNumber && (
                  <div>
                    <Label className="text-sm font-medium text-muted-foreground">Serial Number</Label>
                    <p className="text-foreground mt-1">{item.serialNumber}</p>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Important Dates */}
            <Card className="shadow-neumorphic border-border/50 bg-card/80 backdrop-blur-sm">
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Calendar className="h-5 w-5" />
                  <span>Important Dates</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {item.purchaseDate && (
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Purchased</span>
                    <span className="text-sm">{new Date(item.purchaseDate).toLocaleDateString()}</span>
                  </div>
                )}
                
                {item.warrantyDate && (
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Warranty Expires</span>
                    <span className="text-sm">{new Date(item.warrantyDate).toLocaleDateString()}</span>
                  </div>
                )}
                
                {item.expiryDate && (
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Expires</span>
                    <span className="text-sm text-red-600">{new Date(item.expiryDate).toLocaleDateString()}</span>
                  </div>
                )}
                
                {item.lastMaintenanceDate && (
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Last Maintenance</span>
                    <span className="text-sm">{new Date(item.lastMaintenanceDate).toLocaleDateString()}</span>
                  </div>
                )}
                
                {item.nextMaintenanceDate && (
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Next Maintenance</span>
                    <span className="text-sm">{new Date(item.nextMaintenanceDate).toLocaleDateString()}</span>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};