import React, { useState, useEffect, useRef } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { 
  Terminal, 
  Download, 
  Trash2, 
  Filter, 
  Search,
  ChevronDown,
  ChevronUp,
  Circle,
  AlertTriangle,
  Info,
  CheckCircle2,
  Bug,
  Copy,
  Pause,
  Play
} from 'lucide-react';
import { debugConsole, LogEntry, LogLevel } from '@/services/debugConsole';

interface DebugConsoleProps {
  providerId?: string;
  providerName?: string;
  className?: string;
}

export const DebugConsole: React.FC<DebugConsoleProps> = ({
  providerId,
  providerName,
  className = ''
}) => {
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [filteredLogs, setFilteredLogs] = useState<LogEntry[]>([]);
  const [selectedLevels, setSelectedLevels] = useState<Set<LogLevel>>(new Set([
    LogLevel.DEBUG, LogLevel.INFO, LogLevel.WARN, LogLevel.ERROR, LogLevel.SUCCESS
  ]));
  const [searchQuery, setSearchQuery] = useState('');
  const [isPaused, setIsPaused] = useState(false);
  const [autoScroll, setAutoScroll] = useState(true);
  const [newestFirst, setNewestFirst] = useState(true); // New state for log ordering
  const logContainerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // Subscribe to debug console updates
    const unsubscribe = debugConsole.subscribe((newLogs) => {
      if (!isPaused) {
        const relevantLogs = providerId 
          ? newLogs.filter(log => log.providerId === providerId)
          : newLogs;
        setLogs(relevantLogs);
      }
    });

    // Initial load
    const initialLogs = providerId 
      ? debugConsole.getLogsByProvider(providerId)
      : debugConsole.getLogs();
    setLogs(initialLogs);

    return unsubscribe;
  }, [providerId, isPaused]);

  useEffect(() => {
    // Filter logs based on level and search query
    let filtered = logs.filter(log => selectedLevels.has(log.level));
    
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(log => 
        log.message.toLowerCase().includes(query) ||
        log.category.toLowerCase().includes(query) ||
        (log.providerName && log.providerName.toLowerCase().includes(query))
      );
    }
    
    // Order logs based on user preference (newest first by default)
    if (newestFirst) {
      filtered.reverse();
    }
    
    setFilteredLogs(filtered);
  }, [logs, selectedLevels, searchQuery, newestFirst]);

  useEffect(() => {
    // Auto-scroll behavior based on log ordering
    if (autoScroll && logContainerRef.current) {
      if (newestFirst) {
        // Scroll to top to show newest logs
        logContainerRef.current.scrollTop = 0;
      } else {
        // Scroll to bottom to show newest logs (traditional console behavior)
        logContainerRef.current.scrollTop = logContainerRef.current.scrollHeight;
      }
    }
  }, [filteredLogs, autoScroll, newestFirst]);

  const getLevelIcon = (level: LogLevel) => {
    switch (level) {
      case LogLevel.DEBUG:
        return <Bug className="w-3 h-3 text-gray-500" />;
      case LogLevel.INFO:
        return <Info className="w-3 h-3 text-blue-500" />;
      case LogLevel.WARN:
        return <AlertTriangle className="w-3 h-3 text-yellow-500" />;
      case LogLevel.ERROR:
        return <Circle className="w-3 h-3 text-red-500 fill-current" />;
      case LogLevel.SUCCESS:
        return <CheckCircle2 className="w-3 h-3 text-green-500" />;
      default:
        return <Circle className="w-3 h-3 text-gray-500" />;
    }
  };

  const getLevelColor = (level: LogLevel) => {
    switch (level) {
      case LogLevel.DEBUG:
        return 'text-gray-600 bg-gray-50 border-gray-200';
      case LogLevel.INFO:
        return 'text-blue-600 bg-blue-50 border-blue-200';
      case LogLevel.WARN:
        return 'text-yellow-600 bg-yellow-50 border-yellow-200';
      case LogLevel.ERROR:
        return 'text-red-600 bg-red-50 border-red-200';
      case LogLevel.SUCCESS:
        return 'text-green-600 bg-green-50 border-green-200';
      default:
        return 'text-gray-600 bg-gray-50 border-gray-200';
    }
  };

  const getLevelName = (level: LogLevel) => {
    return LogLevel[level];
  };

  const toggleLevel = (level: LogLevel) => {
    const newSelectedLevels = new Set(selectedLevels);
    if (newSelectedLevels.has(level)) {
      newSelectedLevels.delete(level);
    } else {
      newSelectedLevels.add(level);
    }
    setSelectedLevels(newSelectedLevels);
  };

  const clearLogs = () => {
    if (providerId) {
      debugConsole.clearProviderLogs(providerId);
    } else {
      debugConsole.clearLogs();
    }
  };

  const exportLogs = () => {
    const logsData = debugConsole.exportLogs(providerId);
    const blob = new Blob([logsData], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `debug-logs-${providerId || 'all'}-${new Date().getTime()}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const copyLog = (log: LogEntry) => {
    const logText = `[${log.timestamp.toISOString()}] [${getLevelName(log.level)}] [${log.category}] ${log.message}${log.data ? '\n' + JSON.stringify(log.data, null, 2) : ''}`;
    navigator.clipboard.writeText(logText);
  };

  return (
    <Card className={`h-full flex flex-col ${className}`}>
      <CardHeader className="pb-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-gradient-to-br from-gray-100 to-gray-200 rounded-lg">
              <Terminal className="w-4 h-4 text-gray-600" />
            </div>
            <div>
              <CardTitle className="text-lg font-semibold flex items-center gap-2">
                Debug Console
                {providerId && (
                  <Badge variant="outline" className="text-xs">
                    {providerName}
                  </Badge>
                )}
              </CardTitle>
              <CardDescription>
                Real-time logging and debugging information (newest logs shown first)
              </CardDescription>
            </div>
          </div>
          
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setNewestFirst(!newestFirst)}
              className="flex items-center gap-1"
              title={newestFirst ? "Show oldest logs first" : "Show newest logs first"}
            >
              {newestFirst ? <ChevronDown className="w-3 h-3" /> : <ChevronUp className="w-3 h-3" />}
              {newestFirst ? 'Newest' : 'Oldest'}
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setIsPaused(!isPaused)}
              className="flex items-center gap-1"
            >
              {isPaused ? <Play className="w-3 h-3" /> : <Pause className="w-3 h-3" />}
              {isPaused ? 'Resume' : 'Pause'}
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={exportLogs}
              className="flex items-center gap-1"
            >
              <Download className="w-3 h-3" />
              Export
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={clearLogs}
              className="flex items-center gap-1"
            >
              <Trash2 className="w-3 h-3" />
              Clear
            </Button>
          </div>
        </div>

        {/* Filters */}
        <div className="flex items-center gap-4 pt-4 border-t">
          <div className="flex items-center gap-2">
            <Filter className="w-4 h-4 text-gray-500" />
            <span className="text-sm font-medium">Levels:</span>
            {Object.values(LogLevel).filter(v => typeof v === 'number').map((level) => (
              <Button
                key={level}
                variant={selectedLevels.has(level as LogLevel) ? "default" : "outline"}
                size="sm"
                onClick={() => toggleLevel(level as LogLevel)}
                className="h-6 px-2 text-xs"
              >
                {getLevelIcon(level as LogLevel)}
                <span className="ml-1">{getLevelName(level as LogLevel)}</span>
              </Button>
            ))}
          </div>
          
          <div className="flex-1 max-w-xs">
            <div className="relative">
              <Search className="absolute left-2 top-1/2 transform -translate-y-1/2 w-3 h-3 text-gray-400" />
              <Input
                placeholder="Search logs..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-7 h-6 text-xs"
              />
            </div>
          </div>
        </div>
      </CardHeader>

      <CardContent className="flex-1 overflow-hidden p-0">
        <div 
          ref={logContainerRef}
          className="h-full overflow-y-auto p-4 bg-gray-900 text-gray-100 font-mono text-xs"
          style={{ maxHeight: '400px' }}
        >
          {filteredLogs.length === 0 ? (
            <div className="text-center text-gray-500 py-8">
              <Terminal className="w-8 h-8 mx-auto mb-2 opacity-50" />
              <p>No logs to display</p>
              <p className="text-xs mt-1">
                {searchQuery ? 'Try adjusting your search or filters' : 'Logs will appear here when actions are performed'}
              </p>
            </div>
          ) : (
            <div className="space-y-1">
              {filteredLogs.map((log, index) => (
                <div 
                  key={log.id}
                  className={`group flex items-start gap-2 p-2 rounded border-l-2 hover:bg-gray-800 transition-colors ${
                    log.level === LogLevel.ERROR ? 'border-l-red-500 bg-red-900/10' :
                    log.level === LogLevel.WARN ? 'border-l-yellow-500 bg-yellow-900/10' :
                    log.level === LogLevel.SUCCESS ? 'border-l-green-500 bg-green-900/10' :
                    log.level === LogLevel.INFO ? 'border-l-blue-500 bg-blue-900/10' :
                    'border-l-gray-500'
                  }`}
                >
                  <div className="flex items-center gap-1 text-gray-400 text-xs min-w-0 flex-shrink-0">
                    <span>{log.timestamp.toLocaleTimeString()}</span>
                  </div>
                  
                  <div className="flex items-center gap-1 min-w-0 flex-shrink-0">
                    {getLevelIcon(log.level)}
                  </div>
                  
                  <div className="flex items-center gap-1 text-gray-300 text-xs min-w-0 flex-shrink-0">
                    <Badge variant="outline" className="text-xs px-1 py-0">
                      {log.category}
                    </Badge>
                  </div>
                  
                  <div className="flex-1 min-w-0">
                    <div className="text-gray-100 break-words">
                      {log.message}
                    </div>
                    {log.data && (
                      <details className="mt-1">
                        <summary className="text-gray-400 cursor-pointer hover:text-gray-300 text-xs">
                          Show details
                        </summary>
                        <pre className="mt-1 text-gray-300 text-xs overflow-x-auto bg-gray-800 p-2 rounded">
                          {JSON.stringify(log.data, null, 2)}
                        </pre>
                      </details>
                    )}
                  </div>
                  
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => copyLog(log)}
                    className="opacity-0 group-hover:opacity-100 transition-opacity h-6 w-6 p-0"
                  >
                    <Copy className="w-3 h-3" />
                  </Button>
                </div>
              ))}
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
};