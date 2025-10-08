import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ChevronLeft, ChevronRight, Package, MapPin, Calendar, DollarSign } from "lucide-react";
import { InventoryItemType } from "@/types/inventory";

interface FolderCarouselProps {
  items: InventoryItemType[];
  title: string;
  maxItems?: number;
}

export const FolderCarousel = ({ items, title, maxItems = 6 }: FolderCarouselProps) => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const displayItems = items.slice(0, maxItems);
  const itemsPerView = 3;
  const maxIndex = Math.max(0, displayItems.length - itemsPerView);

  const goToNext = () => {
    setCurrentIndex(prev => Math.min(prev + 1, maxIndex));
  };

  const goToPrevious = () => {
    setCurrentIndex(prev => Math.max(prev - 1, 0));
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'in-stock': return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300';
      case 'low-stock': return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300';
      case 'out-of-stock': return 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300';
      case 'expired': return 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-300';
      default: return 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300';
    }
  };

  const getPriorityColor = (priority?: string) => {
    switch (priority) {
      case 'critical': return 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300';
      case 'high': return 'bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-300';
      case 'medium': return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300';
      case 'low': return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300';
      default: return 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-300';
    }
  };

  if (displayItems.length === 0) {
    return (
      <Card className="shadow-neumorphic border-border/50 bg-card/80 backdrop-blur-sm">
        <CardContent className="p-6 text-center">
          <Package className="h-8 w-8 text-muted-foreground mx-auto mb-2" />
          <p className="text-sm text-muted-foreground">No items in {title}</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="shadow-neumorphic border-border/50 bg-card/80 backdrop-blur-sm">
      <CardContent className="p-4">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-semibold text-foreground">{title}</h3>
          <Badge variant="outline">{items.length} items</Badge>
        </div>

        <div className="relative">
          <div className="flex items-center space-x-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={goToPrevious}
              disabled={currentIndex === 0}
              className="flex-shrink-0"
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>

            <div className="flex-1 overflow-hidden">
              <div 
                className="flex transition-transform duration-300 ease-in-out space-x-3"
                style={{ transform: `translateX(-${currentIndex * (100 / itemsPerView)}%)` }}
              >
                {displayItems.map((item) => (
                  <div key={item.id} className="flex-shrink-0 w-1/3">
                    <Card className="h-full bg-background/50 border-border/30 hover:shadow-md transition-shadow">
                      <CardContent className="p-3">
                        {/* Item Image */}
                        {item.photos && item.photos.length > 0 ? (
                          <div className="aspect-square mb-3 rounded-lg overflow-hidden bg-muted">
                            <img
                              src={item.photos[0]}
                              alt={item.name}
                              className="w-full h-full object-cover"
                            />
                          </div>
                        ) : (
                          <div className="aspect-square mb-3 rounded-lg bg-muted/50 flex items-center justify-center">
                            <Package className="h-8 w-8 text-muted-foreground" />
                          </div>
                        )}

                        {/* Item Details */}
                        <div className="space-y-2">
                          <h4 className="font-medium text-sm text-foreground line-clamp-1">
                            {item.name}
                          </h4>
                          
                          <div className="flex items-center justify-between">
                            <Badge className={`text-xs ${getStatusColor(item.status)}`}>
                              {item.status.replace('-', ' ')}
                            </Badge>
                            <span className="text-xs font-medium text-foreground">
                              Qty: {item.quantity}
                            </span>
                          </div>

                          {item.priority && (
                            <Badge className={`text-xs ${getPriorityColor(item.priority)}`}>
                              {item.priority}
                            </Badge>
                          )}

                          <div className="flex items-center text-xs text-muted-foreground">
                            <MapPin className="h-3 w-3 mr-1" />
                            <span className="truncate">{item.location}</span>
                          </div>

                          {item.purchasePrice && (
                            <div className="flex items-center text-xs text-muted-foreground">
                              <DollarSign className="h-3 w-3 mr-1" />
                              <span>${((item.purchasePrice || 0) * (item.quantity || 0)).toLocaleString()}</span>
                            </div>
                          )}

                          {item.expiryDate && (
                            <div className="flex items-center text-xs text-muted-foreground">
                              <Calendar className="h-3 w-3 mr-1" />
                              <span>Exp: {new Date(item.expiryDate).toLocaleDateString()}</span>
                            </div>
                          )}
                        </div>
                      </CardContent>
                    </Card>
                  </div>
                ))}
              </div>
            </div>

            <Button
              variant="ghost"
              size="sm"
              onClick={goToNext}
              disabled={currentIndex >= maxIndex}
              className="flex-shrink-0"
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>

          {/* Pagination Dots */}
          {maxIndex > 0 && (
            <div className="flex justify-center mt-3 space-x-1">
              {Array.from({ length: maxIndex + 1 }, (_, i) => (
                <button
                  key={i}
                  onClick={() => setCurrentIndex(i)}
                  className={`w-2 h-2 rounded-full transition-colors ${
                    i === currentIndex ? 'bg-primary' : 'bg-muted-foreground/30'
                  }`}
                />
              ))}
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
};