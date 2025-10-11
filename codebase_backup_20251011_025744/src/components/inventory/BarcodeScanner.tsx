import { FC } from 'react';
import UniversalSmartScan from '@/components/UniversalSmartScan';

interface ProductInfo {
  name: string;
  description: string;
  category: string;
  weight?: number;
  dimensions?: {
    length: number;
    width: number;
    height: number;
    unit: string;
  };
  manufacturer?: string;
  model?: string;
  specifications?: Record<string, string>;
}

interface BarcodeScannerProps {
  isOpen: boolean;
  onClose: () => void;
  onProductDetected: (productInfo: ProductInfo, barcode: string, quantity?: number) => void;
}

export const BarcodeScanner = ({ isOpen, onClose, onProductDetected }: BarcodeScannerProps) => {
  const handleScanComplete = (result: any) => {
    if (result.extractedData) {
      const productInfo: ProductInfo = {
        name: result.extractedData.productName || 'Unknown Product',
        description: result.extractedData.description || '',
        category: result.extractedData.category || 'General',
        weight: result.extractedData.specifications?.weight ? parseFloat(result.extractedData.specifications.weight) : undefined,
        dimensions: result.extractedData.specifications?.dimensions ? {
          length: 0, width: 0, height: 0, unit: 'cm'
        } : undefined,
        manufacturer: result.extractedData.brand,
        model: result.extractedData.model,
        specifications: result.extractedData.specifications || {}
      };
      
      const barcode = result.extractedData.barcode || result.extractedData.sku || 'AI-GENERATED';
      const quantity = result.extractedData.quantity || 1;
      
      onProductDetected(productInfo, barcode, quantity);
      onClose();
    }
  };

  return (
    <UniversalSmartScan
      isOpen={isOpen}
      onClose={onClose}
      onScanComplete={handleScanComplete}
      module="inventory"
      context="barcode and product scanning for inventory management"
      scanType="product"
    />
  );
};