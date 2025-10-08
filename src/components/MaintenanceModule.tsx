import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Progress } from "@/components/ui/progress";
import { BarcodeScanner } from "@/components/inventory/BarcodeScanner";
import { useYacht } from "@/contexts/YachtContext";
import { useToast } from "@/hooks/use-toast";
import { 
  Wrench, 
  Plus, 
  AlertTriangle,
  CheckCircle,
  Clock,
  Calendar,
  Settings,
  TrendingUp,
  Battery,
  Thermometer,
  Gauge,
  Zap,
  Search,
  Filter,
  QrCode,
  Ship
} from "lucide-react";

interface MaintenanceTask {
  id: string;
  title: string;
  equipment: string;
  type: "scheduled" | "predictive" | "emergency" | "completed";
  priority: "low" | "medium" | "high" | "critical";
  dueDate: string;
  estimatedHours: number;
  assignedTo: string;
  status: "pending" | "in-progress" | "completed" | "overdue";
  description: string;
  lastService: string;
  nextService: string;
  cost: number;
}

interface SystemStatus {
  name: string;
  health: number;
  status: "healthy" | "warning" | "critical";
  lastCheck: string;
  nextMaintenance: string;
  issues: number;
}

const MaintenanceModule = () => {
  const { userYachtId: currentYachtId, userYacht: currentYacht } = useYacht();
  const { toast } = useToast();
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedType, setSelectedType] = useState("all");
  const [isScannerOpen, setIsScannerOpen] = useState(false);
  const [maintenanceTasks, setMaintenanceTasks] = useState<MaintenanceTask[]>([]);
  const [systemStatuses, setSystemStatuses] = useState<SystemStatus[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Load yacht-scoped maintenance data
  const loadMaintenanceData = async () => {
    if (!currentYachtId) {
      toast({
        title: "No Yacht Selected",
        description: "Please select a yacht to view maintenance data.",
        variant: "destructive"
      });
      return;
    }

    try {
      setIsLoading(true);

      // Fetch yacht-scoped maintenance work orders
      // For now, return empty data as the useYacht context doesn't have getYachtScopedData
      // const workOrders = await getYachtScopedData('maintenance_work_orders');
      const workOrders = [];
      
      // Fetch yacht-scoped equipment systems for status
      // const equipmentSystems = await getYachtScopedData('equipment_systems');
      const equipmentSystems = [];

      // Transform work orders to maintenance tasks
      const tasks: MaintenanceTask[] = workOrders.map((wo: any) => ({
        id: wo.id,
        title: wo.work_order_title || 'Maintenance Task',
        equipment: wo.equipment_name || 'Equipment',
        type: wo.priority === 'urgent' ? 'emergency' : 'scheduled',
        priority: wo.priority || 'medium',
        dueDate: wo.scheduled_date || new Date().toISOString().split('T')[0],
        estimatedHours: wo.estimated_hours || 2,
        assignedTo: wo.assigned_to || 'Crew Member',
        status: wo.status || 'pending',
        description: wo.description || '',
        lastService: wo.last_service_date || '',
        nextService: wo.next_service_date || '',
        cost: wo.estimated_cost || 0
      }));

      // Transform equipment systems to system statuses
      const statuses: SystemStatus[] = equipmentSystems.map((eq: any) => ({
        name: eq.equipment_name || 'System',
        health: eq.health_score || 85,
        status: eq.operational_status === 'operational' ? 'healthy' : 'warning',
        lastCheck: eq.last_inspection || '1 hour ago',
        nextMaintenance: eq.next_maintenance || 'Scheduled',
        issues: eq.active_issues || 0
      }));

      setMaintenanceTasks(tasks);
      setSystemStatuses(statuses);

    } catch (error) {
      console.error('Error loading maintenance data:', error);
      toast({
        title: "Error Loading Data",
        description: "Failed to load yacht maintenance data.",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  // Load data when yacht context changes
  useEffect(() => {
    if (currentYachtId) {
      loadMaintenanceData();
    } else {
      setIsLoading(false);
    }
  }, [currentYachtId]);

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case "low": return "bg-blue-500/10 text-blue-600 border-blue-200";
      case "medium": return "bg-yellow-500/10 text-yellow-600 border-yellow-200";
      case "high": return "bg-orange-500/10 text-orange-600 border-orange-200";
      case "critical": return "bg-red-500/10 text-red-600 border-red-200";
      default: return "bg-gray-500/10 text-gray-600 border-gray-200";
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "healthy": return "bg-green-500/10 text-green-600 border-green-200";
      case "warning": return "bg-yellow-500/10 text-yellow-600 border-yellow-200";
      case "critical": return "bg-red-500/10 text-red-600 border-red-200";
      default: return "bg-gray-500/10 text-gray-600 border-gray-200";
    }
  };

  const getTaskStatusIcon = (status: string) => {
    switch (status) {
      case "completed": return <CheckCircle className="h-4 w-4 text-green-500" />;
      case "in-progress": return <Clock className="h-4 w-4 text-blue-500" />;
      case "overdue": return <AlertTriangle className="h-4 w-4 text-red-500" />;
      default: return <Clock className="h-4 w-4 text-gray-500" />;
    }
  };

  const filteredTasks = maintenanceTasks.filter(task => {
    const matchesSearch = task.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         task.equipment.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesType = selectedType === "all" || task.type === selectedType;
    return matchesSearch && matchesType;
  });

  const totalTasks = maintenanceTasks.length;
  const completedTasks = maintenanceTasks.filter(t => t.status === "completed").length;
  const overdueTasks = maintenanceTasks.filter(t => t.status === "overdue").length;
  const avgSystemHealth = Math.round(systemStatuses.reduce((sum, s) => sum + s.health, 0) / systemStatuses.length);

  const handleMaintenanceScan = (productInfo: any, barcode: string) => {
    console.log('Maintenance part scanned:', { productInfo, barcode });
    // Handle maintenance part or equipment scanning
  };

  return (
    <div className="min-h-screen bg-gradient-wave p-4 md:p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Loading State */}
        {isLoading && (
          <div className="flex items-center justify-center p-8">
            <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary"></div>
          </div>
        )}

        {/* No Yacht Selected State */}
        {!currentYachtId && !isLoading && (
          <Card className="shadow-neumorphic border-border/50 bg-card/80 backdrop-blur-sm">
            <CardContent className="p-8 text-center">
              <Ship className="h-16 w-16 mx-auto text-muted-foreground mb-4" />
              <h3 className="text-lg font-semibold mb-2">No Yacht Selected</h3>
              <p className="text-muted-foreground">Please select a yacht to view maintenance data and manage equipment.</p>
            </CardContent>
          </Card>
        )}

        {/* Header */}
        {currentYachtId && !isLoading && (
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center space-y-4 md:space-y-0">
          <div className="space-y-2">
            <div className="flex items-center space-x-3">
              <div className="p-3 bg-gradient-ocean rounded-xl shadow-glow">
                <Wrench className="h-8 w-8 text-primary-foreground" />
              </div>
              <div>
                <div className="flex items-center gap-3">
                  <h1 className="text-3xl md:text-4xl font-bold text-foreground">
                    Maintenance & Predictive Analytics
                  </h1>
                  {currentYacht && (
                    <Badge variant="outline" className="flex items-center gap-1">
                      <Ship className="h-3 w-3" />
                      {currentYacht?.name || 'No Yacht Selected'}
                    </Badge>
                  )}
                </div>
                <p className="text-muted-foreground">
                  AI-powered maintenance scheduling and system health monitoring
                </p>
              </div>
            </div>
          </div>
          
          <div className="flex items-center space-x-3">
            <Button variant="ocean">
              <Plus className="h-4 w-4 mr-2" />
              New Task
            </Button>
            <Button variant="captain">
              <TrendingUp className="h-4 w-4 mr-2" />
              Analytics
            </Button>
            <Button variant="outline" onClick={() => setIsScannerOpen(true)}>
              <QrCode className="h-4 w-4 mr-2" />
              Scan Part
            </Button>
          </div>
        </div>
        )}

        {/* Stats Cards */}
        {currentYachtId && !isLoading && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <Card className="shadow-neumorphic border-border/50 bg-card/80 backdrop-blur-sm">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Total Tasks</p>
                  <p className="text-2xl font-bold text-foreground">{totalTasks}</p>
                </div>
                <Wrench className="h-5 w-5 text-primary" />
              </div>
            </CardContent>
          </Card>

          <Card className="shadow-neumorphic border-border/50 bg-card/80 backdrop-blur-sm">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Completed</p>
                  <p className="text-2xl font-bold text-green-600">{completedTasks}</p>
                </div>
                <CheckCircle className="h-5 w-5 text-green-500" />
              </div>
            </CardContent>
          </Card>

          <Card className="shadow-neumorphic border-border/50 bg-card/80 backdrop-blur-sm">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">System Health</p>
                  <p className="text-2xl font-bold text-foreground">{avgSystemHealth}%</p>
                </div>
                <Battery className="h-5 w-5 text-accent" />
              </div>
            </CardContent>
          </Card>

          <Card className="shadow-neumorphic border-border/50 bg-card/80 backdrop-blur-sm">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Critical Issues</p>
                  <p className="text-2xl font-bold text-red-600">
                    {systemStatuses.filter(s => s.status === "critical").length}
                  </p>
                </div>
                <AlertTriangle className="h-5 w-5 text-red-500" />
              </div>
            </CardContent>
          </Card>
        </div>
        )}

        {/* System Health Overview */}
        {currentYachtId && !isLoading && (
        <Card className="shadow-neumorphic border-border/50 bg-card/80 backdrop-blur-sm">
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Battery className="h-5 w-5" />
              <span>System Health Overview</span>
            </CardTitle>
            <CardDescription>
              Real-time monitoring of critical yacht systems
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {systemStatuses.map((system) => (
                <div 
                  key={system.name}
                  className="p-4 rounded-lg border border-border/50 bg-background/50 hover:bg-background/80 transition-colors"
                >
                  <div className="flex items-center justify-between mb-3">
                    <h3 className="font-medium text-foreground">{system.name}</h3>
                    <Badge className={`${getStatusColor(system.status)} border`}>
                      {system.status}
                    </Badge>
                  </div>
                  <div className="space-y-2">
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-muted-foreground">Health</span>
                      <span className="font-medium">{system.health}%</span>
                    </div>
                    <Progress value={system.health} className="h-2" />
                    <div className="flex justify-between text-xs text-muted-foreground">
                      <span>Last: {system.lastCheck}</span>
                      <span>Next: {system.nextMaintenance}</span>
                    </div>
                    {system.issues > 0 && (
                      <div className="flex items-center space-x-1 text-xs text-red-600">
                        <AlertTriangle className="h-3 w-3" />
                        <span>{system.issues} issue{system.issues > 1 ? 's' : ''}</span>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
        )}

        {/* Search and Filters */}
        {currentYachtId && !isLoading && (
        <Card className="shadow-neumorphic border-border/50 bg-card/80 backdrop-blur-sm">
          <CardContent className="p-6">
            <div className="flex flex-col md:flex-row space-y-4 md:space-y-0 md:space-x-4">
              <div className="flex-1">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    type="text"
                    placeholder="Search maintenance tasks..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-10"
                  />
                </div>
              </div>
              
              <div className="flex space-x-2">
                {["all", "scheduled", "predictive", "emergency", "completed"].map((type) => (
                  <Button
                    key={type}
                    variant={selectedType === type ? "default" : "outline"}
                    size="sm"
                    onClick={() => setSelectedType(type)}
                    className="whitespace-nowrap capitalize"
                  >
                    {type}
                  </Button>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>
        )}

        {/* Maintenance Tasks */}
        {currentYachtId && !isLoading && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {filteredTasks.map((task) => (
            <Card 
              key={task.id} 
              className="shadow-neumorphic border-border/50 bg-card/80 backdrop-blur-sm hover:shadow-glow transition-all duration-300 hover:-translate-y-1"
            >
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <CardTitle className="text-lg">{task.title}</CardTitle>
                    <CardDescription className="font-medium text-primary">
                      {task.equipment}
                    </CardDescription>
                  </div>
                  <div className="flex flex-col space-y-2">
                    <Badge className={`${getPriorityColor(task.priority)} border`}>
                      {task.priority}
                    </Badge>
                    <div className="flex items-center space-x-1">
                      {getTaskStatusIcon(task.status)}
                      <span className="text-xs capitalize">{task.status.replace("-", " ")}</span>
                    </div>
                  </div>
                </div>
              </CardHeader>
              
              <CardContent>
                <div className="space-y-3">
                  <p className="text-sm text-muted-foreground">{task.description}</p>
                  
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <span className="text-muted-foreground">Due Date:</span>
                      <p className="font-medium">{task.dueDate}</p>
                    </div>
                    <div>
                      <span className="text-muted-foreground">Estimated:</span>
                      <p className="font-medium">{task.estimatedHours}h</p>
                    </div>
                    <div>
                      <span className="text-muted-foreground">Assigned To:</span>
                      <p className="font-medium">{task.assignedTo}</p>
                    </div>
                    <div>
                      <span className="text-muted-foreground">Cost:</span>
                      <p className="font-medium">${task.cost.toLocaleString()}</p>
                    </div>
                  </div>

                  <div className="flex space-x-2 pt-2">
                    <Button variant="outline" size="sm" className="flex-1">
                      Edit
                    </Button>
                    {task.status === "pending" && (
                      <Button variant="captain" size="sm" className="flex-1">
                        Start Task
                      </Button>
                    )}
                    {task.status === "in-progress" && (
                      <Button variant="ocean" size="sm" className="flex-1">
                        Complete
                      </Button>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
        )}

        {/* Predictive Analytics Alert */}
        {currentYachtId && !isLoading && (
        <Card className="shadow-neumorphic border-border/50 bg-card/80 backdrop-blur-sm border-orange-200 bg-orange-50/50">
          <CardHeader>
            <CardTitle className="flex items-center space-x-2 text-orange-600">
              <TrendingUp className="h-5 w-5" />
              <span>AI Predictive Alert</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-start space-x-4">
              <div className="p-2 bg-orange-500/10 rounded-lg">
                <Gauge className="h-6 w-6 text-orange-600" />
              </div>
              <div className="flex-1">
                <h3 className="font-medium text-orange-700 mb-2">
                  Generator #1 Bearing Replacement Recommended
                </h3>
                <p className="text-sm text-orange-600 mb-3">
                  AI analysis detected vibration patterns indicating bearing wear. 
                  Failure probability increases to 85% within 48 hours without intervention.
                </p>
                <div className="flex space-x-2">
                  <Button variant="outline" size="sm">
                    View Analysis
                  </Button>
                  <Button variant="default" size="sm">
                    Schedule Maintenance
                  </Button>
                 </div>
               </div>
             </div>
           </CardContent>
         </Card>
        )}

         {/* Barcode Scanner */}
         <BarcodeScanner
           isOpen={isScannerOpen}
           onClose={() => setIsScannerOpen(false)}
           onProductDetected={handleMaintenanceScan}
         />
       </div>
     </div>
   );
 };

export default MaintenanceModule;