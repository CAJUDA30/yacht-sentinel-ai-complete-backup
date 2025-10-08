import React from 'react';
import { Microsoft365AIOperationsCenter } from './Microsoft365AIOperationsCenter';

export interface UnifiedAIOperationsProps {
  className?: string;
}

export const UnifiedAIOperations: React.FC<UnifiedAIOperationsProps> = ({ className }) => {
  return <Microsoft365AIOperationsCenter className={className} />;
};