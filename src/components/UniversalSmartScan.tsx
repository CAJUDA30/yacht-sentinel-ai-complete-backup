/**
 * UNIFIED UniversalSmartScan - Alias for SmartScanUploader
 * This component maintains backward compatibility while ensuring
 * all components use the unified SmartScanService with processor 4ab65e484eb85038
 */

import { FC } from 'react';
import SmartScanUploader from '@/components/smartscan/SmartScanUploader';

// Simple alias that forwards all props to the unified SmartScanUploader
const UniversalSmartScan: React.FC<any> = (props) => {
  return <SmartScanUploader {...props} />;
};

UniversalSmartScan.displayName = 'UniversalSmartScan';

export default UniversalSmartScan;