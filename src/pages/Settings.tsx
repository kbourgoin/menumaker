
import React from "react";
import Layout from "@/components/Layout";
import CSVImport from "@/components/CSVImport";
import { ClearDataDialog } from "@/components/ClearDataDialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Settings as SettingsIcon } from "lucide-react";

const Settings = () => {
  return (
    <Layout>
      <div className="mb-8 animate-slide-down">
        <h1 className="text-3xl font-serif font-medium mb-6 flex items-center gap-2">
          <SettingsIcon className="h-6 w-6 text-terracotta-500" />
          Settings
        </h1>
        
        <Tabs defaultValue="data" className="w-full">
          <TabsList>
            <TabsTrigger value="data">Data Management</TabsTrigger>
            <TabsTrigger value="account" disabled>Account</TabsTrigger>
            <TabsTrigger value="preferences" disabled>Preferences</TabsTrigger>
          </TabsList>
          
          <TabsContent value="data" className="mt-6">
            <Card>
              <CardHeader>
                <CardTitle>Data Management</CardTitle>
                <CardDescription>
                  Import or clear your meal data
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div>
                  <h3 className="text-lg font-medium mb-2">Import Data</h3>
                  <p className="text-sm text-muted-foreground mb-4">
                    Import your meal history from a CSV file
                  </p>
                  <CSVImport />
                </div>
                
                <Separator />
                
                <div>
                  <h3 className="text-lg font-medium mb-2">Reset Data</h3>
                  <p className="text-sm text-muted-foreground mb-4">
                    Clear all your meal data from the app
                  </p>
                  <ClearDataDialog />
                </div>
              </CardContent>
            </Card>
          </TabsContent>
          
          <TabsContent value="account">
            <Card>
              <CardHeader>
                <CardTitle>Account Settings</CardTitle>
                <CardDescription>
                  Manage your account preferences (coming soon)
                </CardDescription>
              </CardHeader>
            </Card>
          </TabsContent>
          
          <TabsContent value="preferences">
            <Card>
              <CardHeader>
                <CardTitle>Preferences</CardTitle>
                <CardDescription>
                  Customize your app experience (coming soon)
                </CardDescription>
              </CardHeader>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </Layout>
  );
};

export default Settings;
