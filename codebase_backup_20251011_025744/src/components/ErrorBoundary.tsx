import { Component, ErrorInfo, ReactNode } from 'react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { AlertTriangle, RefreshCw, Bug, Download } from 'lucide-react';

interface ErrorBoundaryProps {
  children: ReactNode;
  fallback?: ReactNode;
  onError?: (error: Error, errorInfo: ErrorInfo) => void;
}

interface ErrorBoundaryState {
  hasError: boolean;
  error?: Error;
  errorInfo?: ErrorInfo;
  errorId?: string;
}

export class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  private retryCount = 0;
  private maxRetries = 3;

  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    const errorId = `error_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    return { 
      hasError: true, 
      error,
      errorId
    };
  }

  private reportError = (error: Error, errorInfo: ErrorInfo) => {
    // Enterprise error reporting (could integrate with external services)
    try {
      const errorReport = {
        message: error.message,
        stack: error.stack,
        componentStack: errorInfo.componentStack,
        timestamp: new Date().toISOString(),
        url: window.location.href,
        userAgent: navigator.userAgent,
        errorId: this.state.errorId
      };
      
      // Store in localStorage for offline reporting
      const existingErrors = JSON.parse(localStorage.getItem('yachtexcel_errors') || '[]');
      existingErrors.push(errorReport);
      localStorage.setItem('yachtexcel_errors', JSON.stringify(existingErrors.slice(-10))); // Keep last 10
    } catch (reportingError) {
      console.error('[ErrorBoundary] Failed to report error:', reportingError);
    }
  };

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    // Enhanced logging with more context
    console.error('[ErrorBoundary] Application error caught:', {
      error: error.message,
      stack: error.stack,
      componentStack: errorInfo.componentStack,
      errorBoundary: 'YachtExcel',
      timestamp: new Date().toISOString(),
      url: window.location.href,
      userAgent: navigator.userAgent
    });
    
    // Store error info for detailed display
    this.setState({ errorInfo });
    
    // Call optional error handler
    if (this.props.onError) {
      this.props.onError(error, errorInfo);
    }
    
    // Report to error tracking service (if configured)
    // Could integrate with Sentry, LogRocket, etc.
    this.reportError(error, errorInfo);
  }

  private handleReset = () => {
    // Implement smart retry logic
    if (this.retryCount < this.maxRetries) {
      this.retryCount++;
      console.log(`[ErrorBoundary] Retry attempt ${this.retryCount}/${this.maxRetries}`);
      this.setState({ hasError: false, error: undefined, errorInfo: undefined });
    } else {
      // Force page reload as last resort
      window.location.reload();
    }
  };

  private downloadErrorReport = () => {
    try {
      const errorReport = {
        error: this.state.error?.message,
        stack: this.state.error?.stack,
        componentStack: this.state.errorInfo?.componentStack,
        timestamp: new Date().toISOString(),
        url: window.location.href,
        errorId: this.state.errorId
      };
      
      const blob = new Blob([JSON.stringify(errorReport, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `yachtexcel-error-${this.state.errorId}.json`;
      a.click();
      URL.revokeObjectURL(url);
    } catch (downloadError) {
      console.error('[ErrorBoundary] Failed to download error report:', downloadError);
    }
  };

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }

      return (
        <Card className="w-full max-w-2xl mx-auto mt-8">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-destructive">
              <AlertTriangle className="h-5 w-5" />
              Application Error
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <Alert variant="destructive">
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription>
                {this.state.error?.message || 'An unexpected error occurred'}
              </AlertDescription>
            </Alert>
            
            {/* Error details for development */}
            {process.env.NODE_ENV === 'development' && this.state.error && (
              <details className="mt-4">
                <summary className="cursor-pointer text-sm font-medium text-muted-foreground">
                  <Bug className="inline h-4 w-4 mr-1" />
                  Technical Details
                </summary>
                <pre className="mt-2 text-xs bg-muted p-2 rounded overflow-auto max-h-32">
                  {this.state.error.stack}
                </pre>
              </details>
            )}
            
            <div className="flex gap-2">
              <Button 
                onClick={this.handleReset}
                className="flex-1"
                variant="outline"
              >
                <RefreshCw className="mr-2 h-4 w-4" />
                Try Again ({this.maxRetries - this.retryCount} attempts left)
              </Button>
              
              <Button 
                onClick={this.downloadErrorReport}
                variant="ghost"
                size="sm"
              >
                <Download className="h-4 w-4" />
              </Button>
            </div>
            
            <div className="text-center text-xs text-muted-foreground">
              Error ID: {this.state.errorId}
            </div>
          </CardContent>
        </Card>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;