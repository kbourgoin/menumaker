import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Card, CardHeader, CardContent } from "@/components/ui/card";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { useAuth } from "@/components/auth";
import {
  LoginForm,
  SignupForm,
  AuthHeader,
  ForgotPassword,
} from "@/components/auth";
import { toast } from "sonner";

const Auth = () => {
  const [tab, setTab] = useState<"login" | "signup">("login");
  const [showForgotPassword, setShowForgotPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [loginFormData, setLoginFormData] = useState({
    email: "",
    password: "",
  });
  const [signupFormData, setSignupFormData] = useState({
    email: "",
    password: "",
    confirmPassword: "",
  });

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

  const handleLoginInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setLoginFormData({
      ...loginFormData,
      [e.target.name]: e.target.value,
    });
  };

  const handleSignupInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSignupFormData({
      ...signupFormData,
      [e.target.name]: e.target.value,
    });
  };

  const handleTabChange = (value: string) => {
    setTab(value as "login" | "signup");
    setShowPassword(false); // Reset show password when switching tabs
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-sage-50">
      <Card className="w-full max-w-md shadow-lg">
        <CardHeader className="text-center">
          <AuthHeader />
        </CardHeader>

        {showForgotPassword ? (
          <CardContent>
            <ForgotPassword onBack={() => setShowForgotPassword(false)} />
          </CardContent>
        ) : (
          <>
            <Tabs defaultValue={tab} onValueChange={handleTabChange}>
              <CardContent className="pb-0">
                <TabsList className="grid grid-cols-2 mb-4">
                  <TabsTrigger value="login">Log In</TabsTrigger>
                  <TabsTrigger value="signup">Sign Up</TabsTrigger>
                </TabsList>
              </CardContent>

              <CardContent>
                <TabsContent value="login" className="mt-0">
                  <LoginForm
                    loading={loading}
                    setLoading={setLoading}
                    showPassword={showPassword}
                    setShowPassword={setShowPassword}
                    formData={loginFormData}
                    handleInputChange={handleLoginInputChange}
                    onForgotPassword={() => setShowForgotPassword(true)}
                  />
                </TabsContent>

                <TabsContent value="signup" className="mt-0">
                  <SignupForm
                    loading={loading}
                    setLoading={setLoading}
                    showPassword={showPassword}
                    setShowPassword={setShowPassword}
                    formData={signupFormData}
                    handleInputChange={handleSignupInputChange}
                    setActiveTab={tab => setTab(tab)}
                  />
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
