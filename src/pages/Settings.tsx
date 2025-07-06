
import React from "react";
import { Layout } from "@/components/layout";
import { SourceManager } from "@/components/shared";
import { AccountSettings } from "@/components/settings";
import { DataManagement } from "@/components/data/DataManagement";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Settings as SettingsIcon, BookOpen, UserCog, UtensilsCrossed, Tag } from "lucide-react";
import { CuisineSettings } from "@/components/settings";
import { TagManager } from "@/components/tags";
import { MigrationTrigger } from "@/components/data";

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
            <TabsTrigger value="account">Account</TabsTrigger>
            <TabsTrigger value="preferences">Preferences</TabsTrigger>
          </TabsList>
          
          <TabsContent value="data" className="mt-6">
            <Card>
              <CardHeader>
                <CardTitle>Data Management</CardTitle>
                <CardDescription>
                  Manage your meal data, recipe sources, and imports
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <MigrationTrigger />
                
                <div>
                  <h3 className="text-lg font-medium mb-2 flex items-center gap-2">
                    <BookOpen className="h-5 w-5 text-terracotta-500" />
                    Recipe Sources
                  </h3>
                  <p className="text-sm text-muted-foreground mb-4">
                    Organize and manage your recipe sources (books, websites, documents)
                  </p>
                  <SourceManager />
                </div>
                
                <Separator />
                
                <DataManagement />
              </CardContent>
            </Card>
          </TabsContent>
          
          <TabsContent value="account" className="mt-6">
            <Card>
              <CardHeader>
                <CardTitle>Account Settings</CardTitle>
                <CardDescription>
                  Manage your account information and credentials
                </CardDescription>
              </CardHeader>
              <CardContent>
                <AccountSettings />
              </CardContent>
            </Card>
          </TabsContent>
          
          <TabsContent value="preferences" className="mt-6">
            <Card>
              <CardHeader>
                <CardTitle>Preferences</CardTitle>
                <CardDescription>
                  Customize your app experience
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-6">
                  <div>
                    <h3 className="text-lg font-medium mb-2 flex items-center gap-2">
                      <Tag className="h-5 w-5 text-terracotta-500" />
                      Tag Management
                    </h3>
                    <p className="text-sm text-muted-foreground mb-4">
                      Create and manage tags to organize your recipes
                    </p>
                    <TagManager />
                  </div>
                  
                  <Separator />
                  
                  <div>
                    <h3 className="text-lg font-medium mb-2 flex items-center gap-2">
                      <UtensilsCrossed className="h-5 w-5 text-terracotta-500" />
                      Cuisine Settings
                    </h3>
                    <p className="text-sm text-muted-foreground mb-4">
                      Manage the cuisines available for your dishes
                    </p>
                    <CuisineSettings />
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </Layout>
  );
};

export default Settings;
