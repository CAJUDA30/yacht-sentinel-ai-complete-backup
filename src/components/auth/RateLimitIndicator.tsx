import { useState, useEffect } from 'react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Progress } from '@/components/ui/progress';
import { Shield, Clock, AlertTriangle } from 'lucide-react';

interface RateLimitIndicatorProps {
  attempts: number;
  maxAttempts: number;
  lockoutDuration?: number; // in seconds
  isLocked?: boolean;
  onLockoutEnd?: () => void;
}

const RateLimitIndicator: React.FC<RateLimitIndicatorProps> = ({
  attempts,
  maxAttempts,
  lockoutDuration = 300, // 5 minutes default
  isLocked = false,
  onLockoutEnd,
}) => {
  const [timeRemaining, setTimeRemaining] = useState(lockoutDuration);
  const [showWarning, setShowWarning] = useState(false);

  const remainingAttempts = maxAttempts - attempts;
  const progressValue = (attempts / maxAttempts) * 100;

  // Handle lockout countdown
  useEffect(() => {
    if (!isLocked) return;

    const timer = setInterval(() => {
      setTimeRemaining((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          onLockoutEnd?.();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [isLocked, onLockoutEnd]);

  // Show warning when approaching limit
  useEffect(() => {
    const shouldShow = attempts >= maxAttempts - 2 && attempts > 0 && !isLocked;
    setShowWarning(shouldShow);
  }, [attempts, maxAttempts, isLocked]);

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const getAlertVariant = () => {
    if (isLocked) return 'destructive';
    if (showWarning) return 'default';
    return 'default';
  };

  const getProgressColor = () => {
    if (progressValue >= 80) return 'bg-destructive';
    if (progressValue >= 60) return 'bg-yellow-500';
    return 'bg-primary';
  };

  if (attempts === 0 && !isLocked) return null;

  return (
    <div className="space-y-3">
      {/* Security Status Bar */}
      <div className="flex items-center justify-between text-xs text-muted-foreground">
        <div className="flex items-center gap-1">
          <Shield className="h-3 w-3" />
          <span>Security Level: {isLocked ? 'LOCKED' : showWarning ? 'WARNING' : 'MONITORING'}</span>
        </div>
        <div className="flex items-center gap-1">
          <span>{remainingAttempts} attempts remaining</span>
        </div>
      </div>

      {/* Progress Indicator */}
      <div className="space-y-1">
        <Progress 
          value={progressValue} 
          className="h-2"
        />
        <div className="flex justify-between text-xs text-muted-foreground">
          <span>Login Attempts</span>
          <span>{attempts}/{maxAttempts}</span>
        </div>
      </div>

      {/* Lockout Alert */}
      {isLocked && (
        <Alert variant="destructive" className="border-destructive/50 bg-destructive/5">
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription className="flex items-center justify-between">
            <div>
              <div className="font-medium">Account Temporarily Locked</div>
              <div className="text-sm">Too many failed login attempts detected</div>
            </div>
            <div className="flex items-center gap-1 text-sm font-mono">
              <Clock className="h-3 w-3" />
              {formatTime(timeRemaining)}
            </div>
          </AlertDescription>
        </Alert>
      )}

      {/* Warning Alert */}
      {showWarning && !isLocked && (
        <Alert variant="default" className="border-yellow-500/50 bg-yellow-50 dark:bg-yellow-900/10">
          <AlertTriangle className="h-4 w-4 text-yellow-600" />
          <AlertDescription>
            <div className="font-medium text-yellow-800 dark:text-yellow-200">
              Security Warning
            </div>
            <div className="text-sm text-yellow-700 dark:text-yellow-300">
              {remainingAttempts} {remainingAttempts === 1 ? 'attempt' : 'attempts'} remaining before temporary lockout
            </div>
          </AlertDescription>
        </Alert>
      )}

      {/* Security Tips */}
      {(showWarning || isLocked) && (
        <div className="text-xs text-muted-foreground space-y-1 p-2 bg-muted/30 rounded border">
          <div className="font-medium">Security Tips:</div>
          <ul className="space-y-0.5 ml-2">
            <li>• Check your email for correct spelling</li>
            <li>• Ensure Caps Lock is not enabled</li>
            <li>• Try using password reset if needed</li>
            <li>• Contact support if you're locked out repeatedly</li>
          </ul>
        </div>
      )}
    </div>
  );
};

export default RateLimitIndicator;