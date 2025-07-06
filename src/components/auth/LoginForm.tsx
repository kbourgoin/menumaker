import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { CardContent, CardFooter } from "@/components/ui/card";
import { Eye, EyeOff, Lock, Mail } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";

interface LoginFormProps {
  loading: boolean;
  setLoading: (loading: boolean) => void;
  showPassword: boolean;
  setShowPassword: (show: boolean) => void;
  formData: {
    email: string;
    password: string;
  };
  handleInputChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onForgotPassword: () => void;
}

const LoginForm = ({
  loading,
  setLoading,
  showPassword,
  setShowPassword,
  formData,
  handleInputChange,
  onForgotPassword,
}: LoginFormProps) => {
  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      setLoading(true);

      const { data: _data, error } = await supabase.auth.signInWithPassword({
        email: formData.email,
        password: formData.password,
      });

      if (error) throw error;

      // Navigate happens automatically via the auth state change listener
    } catch (error: unknown) {
      console.error("Login error:", error);
      const errorMessage =
        error instanceof Error ? error.message : "Failed to log in";
      toast.error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleLogin}>
      <CardContent className="space-y-4 pt-4">
        <div className="space-y-2">
          <Label htmlFor="email">Email</Label>
          <div className="relative">
            <Mail className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              id="email"
              name="email"
              type="email"
              placeholder="you@example.com"
              className="pl-10"
              value={formData.email}
              onChange={handleInputChange}
              required
            />
          </div>
        </div>

        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <Label htmlFor="password">Password</Label>
            <Button
              type="button"
              variant="link"
              className="px-0 text-xs font-normal text-terracotta-600 hover:text-terracotta-700"
              onClick={onForgotPassword}
            >
              Forgot password?
            </Button>
          </div>
          <div className="relative">
            <Lock className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              id="password"
              name="password"
              type={showPassword ? "text" : "password"}
              placeholder="••••••••"
              className="pl-10"
              value={formData.password}
              onChange={handleInputChange}
              required
            />
            <Button
              type="button"
              variant="ghost"
              size="sm"
              className="absolute right-1 top-1 h-8 w-8 p-0"
              onClick={() => setShowPassword(!showPassword)}
            >
              {showPassword ? (
                <EyeOff className="h-4 w-4" />
              ) : (
                <Eye className="h-4 w-4" />
              )}
              <span className="sr-only">
                {showPassword ? "Hide password" : "Show password"}
              </span>
            </Button>
          </div>
        </div>
      </CardContent>

      <CardFooter className="flex flex-col">
        <Button
          type="submit"
          className="w-full bg-terracotta-500 hover:bg-terracotta-600"
          disabled={loading}
        >
          {loading ? "Signing in..." : "Sign In"}
        </Button>
      </CardFooter>
    </form>
  );
};

export default LoginForm;
