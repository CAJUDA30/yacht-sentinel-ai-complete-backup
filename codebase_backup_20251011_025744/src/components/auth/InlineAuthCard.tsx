
import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useSupabaseAuth } from "@/hooks/useSupabaseAuth";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

interface Props {
  onAuthenticated?: () => void;
}

type Mode = "login" | "signup" | "reset" | "updatePassword";

const InlineAuthCard: React.FC<Props> = ({ onAuthenticated }) => {
  const [mode, setMode] = useState<Mode>("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const { signIn, signUp } = useSupabaseAuth();
  const [submitting, setSubmitting] = useState(false);
  const { toast } = useToast();

  // Detect password recovery redirect from Supabase
  useEffect(() => {
    if (window.location.hash.includes("type=recovery")) {
      setMode("updatePassword");
    }
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      if (mode === "login") {
        if (!email || !password) return;
        const { error } = await signIn(email, password);
        if (error) return;
        onAuthenticated?.();
      } else if (mode === "signup") {
        if (!email || !password) return;
        const { error } = await signUp(email, password);
        if (!error) {
          toast({ title: "Check your email", description: "Confirm your address to complete signup." });
          setMode("login");
        }
      } else if (mode === "reset") {
        if (!email) return;
        const redirectTo = `${window.location.origin}/superadmin`;
        const { error } = await supabase.auth.resetPasswordForEmail(email, { redirectTo });
        if (error) {
          toast({ title: "Reset failed", description: error.message, variant: "destructive" });
        } else {
          toast({ title: "Email sent", description: "Check your inbox for the reset link." });
          setMode("login");
        }
      } else if (mode === "updatePassword") {
        if (!password || password !== confirm) {
          toast({ title: "Passwords don't match", description: "Please confirm your new password.", variant: "destructive" });
          return;
        }
        const { error } = await supabase.auth.updateUser({ password });
        if (error) {
          toast({ title: "Update failed", description: error.message, variant: "destructive" });
        } else {
          toast({ title: "Password updated", description: "You can now sign in with your new password." });
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
    <Card className="max-w-md mx-auto">
      <CardHeader>
        <CardTitle>
          {mode === "login" && "Sign in to continue"}
          {mode === "signup" && "Create your account"}
          {mode === "reset" && "Reset your password"}
          {mode === "updatePassword" && "Set a new password"}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-3">
          {mode !== "updatePassword" && (
            <div className="space-y-2">
              {(mode === "login" || mode === "signup" || mode === "reset") && (
                <Input
                  type="email"
                  placeholder="you@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  autoComplete="email"
                />
              )}
              {(mode === "login" || mode === "signup") && (
                <Input
                  type="password"
                  placeholder="Password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  autoComplete={mode === "login" ? "current-password" : "new-password"}
                />
              )}
            </div>
          )}

          {mode === "updatePassword" && (
            <div className="space-y-2">
              <Input
                type="password"
                placeholder="New password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                autoComplete="new-password"
              />
              <Input
                type="password"
                placeholder="Confirm new password"
                value={confirm}
                onChange={(e) => setConfirm(e.target.value)}
                required
                autoComplete="new-password"
              />
            </div>
          )}

          <Button type="submit" className="w-full" disabled={submitting}>
            {submitting
              ? (mode === "login"
                ? "Signing in..."
                : mode === "signup"
                ? "Creating account..."
                : mode === "reset"
                ? "Sending..."
                : "Updating...")
              : (mode === "login"
                ? "Sign in"
                : mode === "signup"
                ? "Sign up"
                : mode === "reset"
                ? "Send reset link"
                : "Update password")}
          </Button>

          {/* Mode switchers */}
          <div className="text-sm text-muted-foreground text-center space-y-1">
            {mode === "login" && (
              <>
                <div>
                  Don’t have an account?{" "}
                  <button type="button" className="underline" onClick={() => setMode("signup")}>
                    Sign up
                  </button>
                </div>
                <div>
                  <button type="button" className="underline" onClick={() => setMode("reset")}>Forgot password?</button>
                </div>
              </>
            )}
            {mode === "signup" && (
              <div>
                Already have an account?{" "}
                <button type="button" className="underline" onClick={() => setMode("login")}>
                  Sign in
                </button>
              </div>
            )}
            {mode === "reset" && (
              <div>
                Remembered it?{" "}
                <button type="button" className="underline" onClick={() => setMode("login")}>
                  Back to sign in
                </button>
              </div>
            )}
          </div>
        </form>
      </CardContent>
    </Card>
  );
};

export default InlineAuthCard;

