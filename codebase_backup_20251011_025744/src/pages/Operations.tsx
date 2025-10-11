import React from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import RealTimeOperationsDashboard from '@/components/operations/RealTimeOperationsDashboard';
import PredictiveMaintenanceEngine from '@/components/operations/PredictiveMaintenanceEngine';

const Operations: React.FC = () => {
  return (
    <div className="container mx-auto p-6">
      <Tabs defaultValue="dashboard" className="space-y-4">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="dashboard">Real-Time Dashboard</TabsTrigger>
          <TabsTrigger value="predictive">Predictive Maintenance</TabsTrigger>
        </TabsList>

        <TabsContent value="dashboard">
          <RealTimeOperationsDashboard />
        </TabsContent>

        <TabsContent value="predictive">
          <PredictiveMaintenanceEngine />
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default Operations;