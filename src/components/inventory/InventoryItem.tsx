import { InventoryItemType } from "@/types/inventory";
import { UnifiedInventoryCard } from "./UnifiedInventoryCard";
import { useCurrency } from "@/contexts/CurrencyContext";

interface InventoryItemProps {
  item: InventoryItemType;
  onEdit: (item: InventoryItemType) => void;
  onDelete: (id: string) => void;
  onDuplicate: (item: InventoryItemType) => void;
  onMove: (id: string, newLocation: string) => void;
  onViewHistory: (id: string) => void;
  onViewDetail?: (item: InventoryItemType) => void;
}

export const InventoryItem = ({ 
  item, 
  onEdit, 
  onDelete, 
  onDuplicate, 
  onMove, 
  onViewHistory,
  onViewDetail 
}: InventoryItemProps) => {
  const { formatPrice } = useCurrency();

  const itemCount = item.quantity || 0;
  const totalValue = (item.purchasePrice || 0) * itemCount;
  const imageUrl = item.photos && item.photos.length > 0 ? item.photos[0] : undefined;

  return (
    <UnifiedInventoryCard
      item={item}
      title={item.name}
      imageUrl={imageUrl}
      itemCount={itemCount}
      totalValue={totalValue}
      type="item"
      onClick={() => onViewDetail ? onViewDetail(item) : onEdit(item)}
      onEdit={onEdit}
      onDelete={onDelete}
      onDuplicate={onDuplicate}
      onMove={onMove}
      onViewHistory={onViewHistory}
    />
  );
};