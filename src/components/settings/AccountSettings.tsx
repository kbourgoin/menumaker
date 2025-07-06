
import React, { useState } from "react";
import { useForm } from "react-hook-form";
import { useAuth } from "@/components/auth";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Separator } from "@/components/ui/separator";
import { toast } from "sonner";
import { User, Mail, Key, LogOut } from "lucide-react";

type FormValues = {
  email: string;
  password: string;
  confirmPassword: string;
};

const AccountSettings = () => {
  const { session, signOut } = useAuth();
  const [isUpdating, setIsUpdating] = useState(false);
  
  const form = useForm<FormValues>({
    defaultValues: {
      email: session?.user?.email || "",
      password: "",
      confirmPassword: "",
    },
  });

  const handleUpdateEmail = async (email: string) => {
    if (!email || email === session?.user?.email) return;
    
    try {
      setIsUpdating(true);
      
      const { error } = await supabase.auth.updateUser({
        email: email,
      });
      
      if (error) throw error;
      
      toast.success("Verification email sent. Please check your inbox.");
    } catch (error: unknown) {
      console.error("Error updating email:", error);
      const errorMessage = error instanceof Error ? error.message : "Failed to update email";
      toast.error(errorMessage);
    } finally {
      setIsUpdating(false);
    }
  };

  const handleUpdatePassword = async (password: string, confirmPassword: string) => {
    if (!password) return;
    
    if (password !== confirmPassword) {
      toast.error("Passwords do not match");
      return;
    }
    
    try {
      setIsUpdating(true);
      
      const { error } = await supabase.auth.updateUser({
        password: password,
      });
      
      if (error) throw error;
      
      form.reset({
        email: form.getValues("email"),
        password: "",
        confirmPassword: "",
      });
      
      toast.success("Password updated successfully");
    } catch (error: unknown) {
      console.error("Error updating password:", error);
      const errorMessage = error instanceof Error ? error.message : "Failed to update password";
      toast.error(errorMessage);
    } finally {
      setIsUpdating(false);
    }
  };

  const onSubmit = (data: FormValues) => {
    const { email, password, confirmPassword } = data;
    
    // Check if email has changed
    if (email !== session?.user?.email) {
      handleUpdateEmail(email);
    }
    
    // Check if password has been set
    if (password) {
      handleUpdatePassword(password, confirmPassword);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <div className="flex items-center gap-2">
          <User className="h-5 w-5 text-terracotta-500" />
          <h3 className="text-lg font-medium">Account Information</h3>
        </div>
        <p className="text-sm text-muted-foreground mt-2 mb-4">
          Manage your account details and credentials
        </p>
        
        <Card>
          <CardContent className="pt-6">
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                <FormField
                  control={form.control}
                  name="email"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="flex items-center gap-2">
                        <Mail className="h-4 w-4" />
                        Email Address
                      </FormLabel>
                      <FormControl>
                        <Input placeholder="your@email.com" {...field} />
                      </FormControl>
                      <FormDescription>
                        Changing your email will require verification
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <Separator />
                
                <div>
                  <h4 className="text-sm font-medium mb-3 flex items-center gap-2">
                    <Key className="h-4 w-4" />
                    Change Password
                  </h4>
                  
                  <div className="grid gap-4">
                    <FormField
                      control={form.control}
                      name="password"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>New Password</FormLabel>
                          <FormControl>
                            <Input 
                              type="password" 
                              placeholder="••••••••" 
                              {...field} 
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    
                    <FormField
                      control={form.control}
                      name="confirmPassword"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Confirm Password</FormLabel>
                          <FormControl>
                            <Input 
                              type="password" 
                              placeholder="••••••••" 
                              {...field} 
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                </div>
                
                <div>
                  <Button type="submit" disabled={isUpdating}>
                    {isUpdating ? "Updating..." : "Save Changes"}
                  </Button>
                </div>
              </form>
            </Form>
          </CardContent>
        </Card>
      </div>
      
      <Separator />
      
      <div>
        <div className="flex items-center gap-2">
          <LogOut className="h-5 w-5 text-terracotta-500" />
          <h3 className="text-lg font-medium">Sign Out</h3>
        </div>
        <p className="text-sm text-muted-foreground mt-2 mb-4">
          Sign out from your account
        </p>
        
        <Button 
          variant="outline" 
          className="border-destructive text-destructive hover:bg-destructive hover:text-destructive-foreground"
          onClick={signOut}
        >
          <LogOut className="mr-2 h-4 w-4" />
          Sign Out
        </Button>
      </div>
    </div>
  );
};

export default AccountSettings;
