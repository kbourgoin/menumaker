
import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { useAuth } from "@/hooks/useAuth";
import { LoginForm, SignupForm, AuthHeader, ForgotPassword } from "@/components/auth";
import { toast } from "sonner"; // Import toast from sonner instead

const Auth = () => {
  const [tab, setTab] = useState<"login" | "signup">("login");
  const [showForgotPassword, setShowForgotPassword] = useState(false);
  const { isAuthenticated } = useAuth();
  const navigate = useNavigate();

  // Check URL for password reset parameter
  useEffect(() => {
    const url = new URL(window.location.href);
    const reset = url.searchParams.get("reset");
    
    if (reset === "true") {
      toast.success("You can now set your new password.");
    }
  }, []);

  // Redirect if user is already authenticated
  useEffect(() => {
    if (isAuthenticated) {
      navigate("/");
    }
  }, [isAuthenticated, navigate]);

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-sage-50">
      <Card className="w-full max-w-md shadow-lg">
        <CardHeader className="text-center">
          <AuthHeader />
        </CardHeader>
        
        {showForgotPassword ? (
          <CardContent>
            <ForgotPassword 
              onBack={() => setShowForgotPassword(false)} 
            />
          </CardContent>
        ) : (
          <>
            <Tabs defaultValue={tab} onValueChange={(value) => setTab(value as "login" | "signup")}>
              <CardContent className="pb-0">
                <TabsList className="grid grid-cols-2 mb-4">
                  <TabsTrigger value="login">Log In</TabsTrigger>
                  <TabsTrigger value="signup">Sign Up</TabsTrigger>
                </TabsList>
              </CardContent>
              
              <CardContent>
                <TabsContent value="login" className="mt-0">
                  <LoginForm onForgotPassword={() => setShowForgotPassword(true)} />
                </TabsContent>
                
                <TabsContent value="signup" className="mt-0">
                  <SignupForm />
                </TabsContent>
              </CardContent>
            </Tabs>
          </>
        )}
      </Card>
    </div>
  );
};

export default Auth;
