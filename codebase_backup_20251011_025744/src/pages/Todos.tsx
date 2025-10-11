import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { CheckSquare, Camera, Clock, Plus, Image, Timer, MapPin, User, AlertCircle, CheckCircle, Calendar } from "lucide-react";
import { useToast } from "@/components/ui/use-toast";
import UniversalSmartScan from "@/components/UniversalSmartScan";

interface Task {
  id: string;
  title: string;
  description: string;
  priority: 'low' | 'medium' | 'high' | 'urgent';
  status: 'pending' | 'in-progress' | 'completed' | 'verified';
  assignee: string;
  location: string;
  deadline: string;
  estimatedTime: number;
  actualTime?: number;
  beforePhotos: string[];
  afterPhotos: string[];
  createdAt: string;
  completedAt?: string;
  module: string;
}

const Todos = () => {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [showAddTask, setShowAddTask] = useState(false);
  const [showScanner, setShowScanner] = useState(false);
  const [newTask, setNewTask] = useState({
    title: '',
    description: '',
    priority: 'medium' as const,
    assignee: '',
    location: '',
    deadline: '',
    estimatedTime: 60,
    module: 'general'
  });
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);
  const { toast } = useToast();

  useEffect(() => {
    // Load mock tasks
    setTasks([
      {
        id: '1',
        title: 'Inspect Safety Equipment',
        description: 'Monthly inspection of life jackets and emergency equipment',
        priority: 'high',
        status: 'pending',
        assignee: 'John Smith',
        location: 'Safety Locker - Deck 2',
        deadline: '2024-01-15',
        estimatedTime: 120,
        beforePhotos: [],
        afterPhotos: [],
        createdAt: '2024-01-10',
        module: 'safety'
      },
      {
        id: '2',
        title: 'Engine Room Cleaning',
        description: 'Deep clean engine compartment and check for leaks',
        priority: 'medium',
        status: 'in-progress',
        assignee: 'Mike Johnson',
        location: 'Engine Room',
        deadline: '2024-01-12',
        estimatedTime: 240,
        actualTime: 120,
        beforePhotos: ['/placeholder.svg'],
        afterPhotos: [],
        createdAt: '2024-01-08',
        module: 'maintenance'
      }
    ]);
  }, []);

  const addTask = () => {
    const task: Task = {
      id: Date.now().toString(),
      ...newTask,
      status: 'pending',
      beforePhotos: [],
      afterPhotos: [],
      createdAt: new Date().toISOString(),
    };
    
    setTasks([...tasks, task]);
    setNewTask({
      title: '',
      description: '',
      priority: 'medium',
      assignee: '',
      location: '',
      deadline: '',
      estimatedTime: 60,
      module: 'general'
    });
    setShowAddTask(false);
    
    toast({
      title: "Task Created",
      description: "New task has been added successfully",
    });
  };

  const updateTaskStatus = (taskId: string, status: Task['status']) => {
    setTasks(tasks.map(task => 
      task.id === taskId 
        ? { 
            ...task, 
            status,
            completedAt: status === 'completed' ? new Date().toISOString() : task.completedAt
          }
        : task
    ));
    
    toast({
      title: "Task Updated",
      description: `Task status changed to ${status}`,
    });
  };

  const getPriorityColor = (priority: string) => {
    const colors = {
      low: 'bg-blue-500',
      medium: 'bg-yellow-500',
      high: 'bg-orange-500',
      urgent: 'bg-red-500'
    };
    return colors[priority as keyof typeof colors];
  };

  const getStatusIcon = (status: string) => {
    const icons = {
      pending: AlertCircle,
      'in-progress': Timer,
      completed: CheckCircle,
      verified: CheckSquare
    };
    const Icon = icons[status as keyof typeof icons];
    return Icon ? <Icon className="h-4 w-4" /> : null;
  };

  const handleScanComplete = (result: any) => {
    // Process scan result for task documentation
    console.log('Scan result:', result);
    setShowScanner(false);
    
    toast({
      title: "Photo Added",
      description: "Task documentation photo has been captured",
    });
  };

  const calculateProgress = () => {
    const completed = tasks.filter(t => t.status === 'completed' || t.status === 'verified').length;
    return tasks.length > 0 ? (completed / tasks.length) * 100 : 0;
  };

  return (
    <div className="min-h-screen bg-gradient-wave p-4 md:p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="p-3 bg-gradient-ocean rounded-xl shadow-glow">
              <CheckSquare className="h-8 w-8 text-primary-foreground" />
            </div>
            <div>
              <h1 className="text-3xl md:text-4xl font-bold text-foreground">To-Do Manager</h1>
              <p className="text-muted-foreground">Task management with before/after documentation</p>
            </div>
          </div>
          
          <Dialog open={showAddTask} onOpenChange={setShowAddTask}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="h-4 w-4 mr-2" />
                Add Task
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-md">
              <DialogHeader>
                <DialogTitle>Create New Task</DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                <Input
                  placeholder="Task title"
                  value={newTask.title}
                  onChange={(e) => setNewTask({...newTask, title: e.target.value})}
                />
                <Textarea
                  placeholder="Task description"
                  value={newTask.description}
                  onChange={(e) => setNewTask({...newTask, description: e.target.value})}
                />
                <div className="grid grid-cols-2 gap-2">
                  <Select value={newTask.priority} onValueChange={(value) => setNewTask({...newTask, priority: value as any})}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="low">Low</SelectItem>
                      <SelectItem value="medium">Medium</SelectItem>
                      <SelectItem value="high">High</SelectItem>
                      <SelectItem value="urgent">Urgent</SelectItem>
                    </SelectContent>
                  </Select>
                  <Input
                    type="date"
                    value={newTask.deadline}
                    onChange={(e) => setNewTask({...newTask, deadline: e.target.value})}
                  />
                </div>
                <Input
                  placeholder="Assignee"
                  value={newTask.assignee}
                  onChange={(e) => setNewTask({...newTask, assignee: e.target.value})}
                />
                <Input
                  placeholder="Location"
                  value={newTask.location}
                  onChange={(e) => setNewTask({...newTask, location: e.target.value})}
                />
                <Button onClick={addTask} className="w-full">Create Task</Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>

        {/* Progress Overview */}
        <Card className="shadow-neumorphic border-border/50 bg-card/80 backdrop-blur-sm">
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <span>Overall Progress</span>
              <Badge variant="outline">{Math.round(calculateProgress())}% Complete</Badge>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <Progress value={calculateProgress()} className="h-3" />
            <div className="flex justify-between text-sm text-muted-foreground mt-2">
              <span>{tasks.filter(t => t.status === 'completed' || t.status === 'verified').length} completed</span>
              <span>{tasks.filter(t => t.status === 'pending').length} pending</span>
              <span>{tasks.filter(t => t.status === 'in-progress').length} in progress</span>
            </div>
          </CardContent>
        </Card>

        {/* Task List */}
        <div className="grid gap-4">
          {tasks.map((task) => (
            <Card key={task.id} className="shadow-neumorphic border-border/50 bg-card/80 backdrop-blur-sm">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="flex items-center gap-2">
                    {getStatusIcon(task.status)}
                    {task.title}
                  </CardTitle>
                  <div className="flex items-center gap-2">
                    <div className={`w-3 h-3 rounded-full ${getPriorityColor(task.priority)}`} />
                    <Badge variant="outline">{task.priority}</Badge>
                    <Badge variant={task.status === 'completed' ? 'default' : 'secondary'}>
                      {task.status}
                    </Badge>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <p className="text-muted-foreground">{task.description}</p>
                
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                  <div className="flex items-center gap-2">
                    <User className="h-4 w-4" />
                    <span>{task.assignee}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <MapPin className="h-4 w-4" />
                    <span>{task.location}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Calendar className="h-4 w-4" />
                    <span>{task.deadline}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Clock className="h-4 w-4" />
                    <span>{task.estimatedTime}min</span>
                  </div>
                </div>

                <div className="flex items-center justify-between">
                  <div className="flex gap-2">
                    <Button 
                      size="sm" 
                      variant="outline"
                      onClick={() => setShowScanner(true)}
                    >
                      <Camera className="h-4 w-4 mr-1" />
                      Photo
                    </Button>
                    <Button 
                      size="sm" 
                      variant="outline"
                      onClick={() => updateTaskStatus(task.id, 'in-progress')}
                      disabled={task.status === 'completed'}
                    >
                      <Timer className="h-4 w-4 mr-1" />
                      Start
                    </Button>
                  </div>
                  
                  {task.status !== 'completed' && (
                    <Button 
                      size="sm"
                      onClick={() => updateTaskStatus(task.id, 'completed')}
                    >
                      <CheckCircle className="h-4 w-4 mr-1" />
                      Complete
                    </Button>
                  )}
                </div>

                {(task.beforePhotos.length > 0 || task.afterPhotos.length > 0) && (
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Image className="h-4 w-4" />
                    <span>
                      {task.beforePhotos.length} before, {task.afterPhotos.length} after photos
                    </span>
                  </div>
                )}
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Universal Smart Scan Modal */}
        <UniversalSmartScan
          isOpen={showScanner}
          onClose={() => setShowScanner(false)}
          onScanComplete={handleScanComplete}
          module="todos"
          context="task documentation"
          scanType="document"
        />
      </div>
    </div>
  );
};

export default Todos;