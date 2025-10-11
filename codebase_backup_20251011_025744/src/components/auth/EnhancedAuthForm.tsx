import { useEffect, useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { useSupabaseAuth } from "@/hooks/useSupabaseAuth";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useRateLimit } from "@/hooks/useRateLimit";
import RateLimitIndicator from "./RateLimitIndicator";
import { User, Lock, Eye, EyeOff, Mail, Loader2 } from "lucide-react";

interface Props {
  onAuthenticated?: () => void;
}

type Mode = "login" | "signup" | "reset" | "updatePassword";

const EnhancedAuthForm: React.FC<Props> = ({ onAuthenticated }) => {
  const [mode, setMode] = useState<Mode>("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [emailError, setEmailError] = useState("");
  const [passwordError, setPasswordError] = useState("");
  
  const { signIn, signUp } = useSupabaseAuth();
  const { toast } = useToast();
  const rateLimiter = useRateLimit({
    maxAttempts: 5,
    lockoutDuration: 300, // 5 minutes
    resetPeriod: 900, // 15 minutes
    storageKey: 'yacht_auth_rate_limit'
  });

  // Load remembered email
  useEffect(() => {
    const rememberedEmail = localStorage.getItem('rememberedEmail');
    if (rememberedEmail) {
      setEmail(rememberedEmail);
      setRememberMe(true);
    }
  }, []);

  // Detect password recovery redirect from Supabase
  useEffect(() => {
    if (window.location.hash.includes("type=recovery")) {
      setMode("updatePassword");
    }
  }, []);

  // Real-time email validation
  useEffect(() => {
    if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      setEmailError("Please enter a valid email address");
    } else {
      setEmailError("");
    }
  }, [email]);

  // Password strength validation
  useEffect(() => {
    if (mode === "signup" && password) {
      const hasUpperCase = /[A-Z]/.test(password);
      const hasLowerCase = /[a-z]/.test(password);
      const hasNumbers = /\d/.test(password);
      const hasSpecialChar = /[!@#$%^&*(),.?":{}|<>]/.test(password);
      const isLongEnough = password.length >= 8;

      if (!isLongEnough) {
        setPasswordError("Password must be at least 8 characters");
      } else if (!hasUpperCase || !hasLowerCase || !hasNumbers || !hasSpecialChar) {
        setPasswordError("Password must contain uppercase, lowercase, number, and special character");
      } else {
        setPasswordError("");
      }
    } else {
      setPasswordError("");
    }
  }, [password, mode]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (emailError || passwordError) return;
    
    // Check rate limiting for login attempts
    if (mode === "login" && !rateLimiter.canAttempt()) {
      toast({
        title: "Account Temporarily Locked",
        description: "Too many failed attempts. Please wait before trying again.",
        variant: "destructive"
      });
      return;
    }
    
    setSubmitting(true);
    try {
      if (mode === "login") {
        if (!email || !password) return;
        
        // Handle remember me
        if (rememberMe) {
          localStorage.setItem('rememberedEmail', email);
        } else {
          localStorage.removeItem('rememberedEmail');
        }
        
        const { error } = await signIn(email, password);
        
        // Record rate limit attempt
        rateLimiter.recordAttempt(!error);
        
        if (error) {
          // Send security alert for failed login
          if (rateLimiter.attempts >= 3) {
            await supabase.functions.invoke('yacht-auth-emails', {
              body: {
                type: 'security_alert',
                user_email: email,
                alert_type: 'suspicious_activity',
                details: {
                  timestamp: new Date().toISOString(),
                  action_taken: `Failed login attempt ${rateLimiter.attempts}/${rateLimiter.maxAttempts}`
                }
              },
              headers: { 'x-yacht-direct-call': 'true' }
            }).catch(console.error);
          }
          return;
        }
        
        onAuthenticated?.();
      } else if (mode === "signup") {
        if (!email || !password || emailError || passwordError) return;
        const { error } = await signUp(email, password);
        if (!error) {
          toast({ 
            title: "Account created!", 
            description: "Check your email to verify your account and complete signup." 
          });
          setMode("login");
        }
      } else if (mode === "reset") {
        if (!email || emailError) return;
        const redirectTo = `${window.location.origin}/auth`;
        const { error } = await supabase.auth.resetPasswordForEmail(email, { redirectTo });
        if (error) {
          toast({ title: "Reset failed", description: error.message, variant: "destructive" });
        } else {
          toast({ 
            title: "Reset email sent", 
            description: "Check your inbox for the password reset link." 
          });
          setMode("login");
        }
      } else if (mode === "updatePassword") {
        if (!password || password !== confirm || passwordError) {
          toast({ 
            title: "Passwords don't match", 
            description: "Please confirm your new password.", 
            variant: "destructive" 
          });
          return;
        }
        const { error } = await supabase.auth.updateUser({ password });
        if (error) {
          toast({ title: "Update failed", description: error.message, variant: "destructive" });
        } else {
          toast({ 
            title: "Password updated successfully", 
            description: "You can now sign in with your new password." 
          });
          setPassword("");
          setConfirm("");
          setMode("login");
        }
      }
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Card className="w-full max-w-md mx-auto bg-card/95 backdrop-blur-sm border-border/20 shadow-glow">
      <CardContent className="p-8">
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Email Field */}
          {mode !== "updatePassword" && (
            <div className="space-y-2">
              <div className="relative">
                <User className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  type="email"
                  placeholder="Enter username or email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className={`pl-10 bg-background/50 border-border/40 focus:border-primary ${emailError ? 'border-destructive' : ''}`}
                  required
                  autoComplete="email"
                  aria-label="Email address"
                  aria-describedby={emailError ? "email-error" : undefined}
                />
              </div>
              {emailError && (
                <p id="email-error" className="text-xs text-destructive" role="alert">
                  {emailError}
                </p>
              )}
            </div>
          )}

          {/* Password Field */}
          {(mode === "login" || mode === "signup") && (
            <div className="space-y-2">
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  type={showPassword ? "text" : "password"}
                  placeholder="Enter password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className={`pl-10 pr-10 bg-background/50 border-border/40 focus:border-primary ${passwordError ? 'border-destructive' : ''}`}
                  required
                  autoComplete={mode === "login" ? "current-password" : "new-password"}
                  aria-label="Password"
                  aria-describedby={passwordError ? "password-error" : undefined}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                  aria-label={showPassword ? "Hide password" : "Show password"}
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
              {passwordError && (
                <p id="password-error" className="text-xs text-destructive" role="alert">
                  {passwordError}
                </p>
              )}
            </div>
          )}

          {/* Update Password Fields */}
          {mode === "updatePassword" && (
            <div className="space-y-4">
              <div className="space-y-2">
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    type={showPassword ? "text" : "password"}
                    placeholder="New password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className={`pl-10 pr-10 bg-background/50 border-border/40 focus:border-primary ${passwordError ? 'border-destructive' : ''}`}
                    required
                    autoComplete="new-password"
                    aria-label="New password"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 transform -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                    aria-label={showPassword ? "Hide password" : "Show password"}
                  >
                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
                {passwordError && (
                  <p className="text-xs text-destructive" role="alert">
                    {passwordError}
                  </p>
                )}
              </div>
              
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  type={showConfirm ? "text" : "password"}
                  placeholder="Confirm new password"
                  value={confirm}
                  onChange={(e) => setConfirm(e.target.value)}
                  className="pl-10 pr-10 bg-background/50 border-border/40 focus:border-primary"
                  required
                  autoComplete="new-password"
                  aria-label="Confirm new password"
                />
                <button
                  type="button"
                  onClick={() => setShowConfirm(!showConfirm)}
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                  aria-label={showConfirm ? "Hide password confirmation" : "Show password confirmation"}
                >
                  {showConfirm ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>
          )}

          {/* Remember Me Checkbox */}
          {mode === "login" && (
            <div className="flex items-center space-x-2">
              <Checkbox
                id="remember"
                checked={rememberMe}
                onCheckedChange={(checked) => setRememberMe(checked as boolean)}
                aria-label="Remember me"
              />
              <label 
                htmlFor="remember" 
                className="text-sm text-muted-foreground cursor-pointer select-none"
              >
                Remember me
              </label>
            </div>
          )}

          {/* Rate Limiting Indicator */}
          {mode === "login" && (
            <RateLimitIndicator
              attempts={rateLimiter.attempts}
              maxAttempts={rateLimiter.maxAttempts}
              lockoutDuration={Math.ceil(rateLimiter.getRemainingLockoutTime() / 1000)}
              isLocked={rateLimiter.isLocked}
              onLockoutEnd={() => rateLimiter.reset()}
            />
          )}

          {/* Submit Button */}
          <Button 
            type="submit" 
            className="w-full bg-primary hover:bg-primary/90 text-primary-foreground font-medium py-3 shadow-lg hover:shadow-glow transition-all duration-200" 
            disabled={submitting || emailError !== "" || passwordError !== "" || (mode === "login" && rateLimiter.isLocked)}
          >
            {submitting ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                {mode === "login" ? "Signing in..." : 
                 mode === "signup" ? "Creating account..." : 
                 mode === "reset" ? "Sending..." : "Updating..."}
              </>
            ) : (
              <>
                {mode === "login" ? "Sign In" : 
                 mode === "signup" ? "Create Account" : 
                 mode === "reset" ? "Send Reset Link" : "Update Password"}
              </>
            )}
          </Button>

          {/* Mode Switchers */}
          <div className="text-center space-y-3">
            {mode === "login" && (
              <>
                <div className="text-sm text-muted-foreground">
                  Don't have an account?{" "}
                  <button 
                    type="button" 
                    className="text-primary hover:text-primary/80 underline font-medium transition-colors" 
                    onClick={() => setMode("signup")}
                  >
                    Create Account
                  </button>
                </div>
                <div className="text-sm">
                  <button 
                    type="button" 
                    className="text-primary hover:text-primary/80 underline font-medium transition-colors" 
                    onClick={() => setMode("reset")}
                  >
                    Forgot Password?
                  </button>
                </div>
              </>
            )}
            {mode === "signup" && (
              <div className="text-sm text-muted-foreground">
                Already have an account?{" "}
                <button 
                  type="button" 
                  className="text-primary hover:text-primary/80 underline font-medium transition-colors" 
                  onClick={() => setMode("login")}
                >
                  Sign In
                </button>
              </div>
            )}
            {mode === "reset" && (
              <div className="text-sm text-muted-foreground">
                Remembered your password?{" "}
                <button 
                  type="button" 
                  className="text-primary hover:text-primary/80 underline font-medium transition-colors" 
                  onClick={() => setMode("login")}
                >
                  Back to Sign In
                </button>
              </div>
            )}
          </div>
        </form>
      </CardContent>
    </Card>
  );
};

export default EnhancedAuthForm;