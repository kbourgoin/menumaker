import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { CardContent, CardFooter } from "@/components/ui/card";
import { Mail } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";

interface ForgotPasswordProps {
  onBack: () => void;
}

const ForgotPassword = ({ onBack }: ForgotPasswordProps) => {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!email.trim()) {
      toast.error("Please enter your email address");
      return;
    }

    try {
      setLoading(true);

      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/auth?reset=true`,
      });

      if (error) throw error;

      setSubmitted(true);
      toast.success("Password reset link sent");
    } catch (error: unknown) {
      console.error("Password reset error:", error);
      const errorMessage =
        error instanceof Error ? error.message : "Failed to send reset link";
      toast.error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleResetPassword}>
      <CardContent className="space-y-4 pt-4">
        {submitted ? (
          <div className="text-center space-y-4">
            <div className="bg-sage-50 p-4 rounded-md">
              <p className="text-sm text-center mb-2">
                If an account exists with email <strong>{email}</strong>, you
                will receive a password reset link shortly.
              </p>
              <p className="text-xs text-muted-foreground">
                Please also check your spam folder.
              </p>
            </div>
          </div>
        ) : (
          <div className="space-y-2">
            <Label htmlFor="reset-email">Email</Label>
            <div className="relative">
              <Mail className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                id="reset-email"
                name="email"
                type="email"
                placeholder="you@example.com"
                className="pl-10"
                value={email}
                onChange={e => setEmail(e.target.value)}
                required
              />
            </div>
            <p className="text-xs text-muted-foreground pt-1">
              Enter your email address and we'll send you a link to reset your
              password.
            </p>
          </div>
        )}
      </CardContent>

      <CardFooter className="flex flex-col space-y-2">
        {submitted ? (
          <Button type="button" className="w-full" onClick={onBack}>
            Back to Login
          </Button>
        ) : (
          <>
            <Button
              type="submit"
              className="w-full bg-terracotta-500 hover:bg-terracotta-600"
              disabled={loading}
            >
              {loading ? "Sending link..." : "Send Reset Link"}
            </Button>
            <Button
              type="button"
              variant="ghost"
              className="w-full text-sm"
              onClick={onBack}
              disabled={loading}
            >
              Back to Login
            </Button>
          </>
        )}
      </CardFooter>
    </form>
  );
};

export default ForgotPassword;
