import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import MainLayout from "@/layouts/MainLayout";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { UpdateUser } from "@shared/schema";
import { 
  Card,
  CardContent, 
  CardDescription, 
  CardHeader, 
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { useTheme } from "@/lib/theme-provider";
import { Loader2, Moon, Sun } from "lucide-react";

export default function Settings() {
  const { user, updateProfile } = useAuth();
  const { theme, setTheme } = useTheme();
  const { toast } = useToast();

  const updateThemeMutation = useMutation({
    mutationFn: async (newTheme: "light" | "dark") => {
      const data: UpdateUser = { 
        theme: newTheme 
      };
      await apiRequest("PATCH", "/api/users/settings", data);
      return newTheme;
    },
    onSuccess: (newTheme) => {
      toast({
        title: "Theme updated",
        description: `Theme switched to ${newTheme} mode`,
      });
      // Update both the DOM and backend preference
      setTheme(newTheme);
      updateProfile({ theme: newTheme });
      // Invalidate user cache
      queryClient.invalidateQueries({ queryKey: ['/api/users/profile'] });
    },
    onError: (error) => {
      toast({
        title: "Update failed",
        description: error instanceof Error ? error.message : "Failed to update theme",
        variant: "destructive",
      });
    },
  });

  const toggleTheme = () => {
    const newTheme = theme === "light" ? "dark" : "light";
    updateThemeMutation.mutate(newTheme);
  };

  if (!user) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <MainLayout>
      <div className="pb-20">
        <div className="max-w-7xl mx-auto px-2 sm:px-4 md:px-6">
          <h1 className="text-2xl font-semibold text-gray-900 dark:text-white">Settings</h1>
          <p className="text-gray-600 dark:text-gray-400 mt-1">Customize your application preferences</p>
        </div>
        
        <div className="max-w-7xl mx-auto px-2 sm:px-4 md:px-6 mt-4">
          <Card>
            <CardHeader>
              <CardTitle>Appearance</CardTitle>
              <CardDescription>
                Customize how MediCare Assistant looks on your device
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label className="text-base">Dark Mode</Label>
                    <p className="text-sm text-gray-500 dark:text-gray-400">
                      Switch between light and dark themes
                    </p>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Sun className="h-5 w-5 text-gray-500 dark:text-gray-400" />
                    <Switch 
                      checked={theme === "dark"}
                      onCheckedChange={toggleTheme}
                      disabled={updateThemeMutation.isPending}
                    />
                    <Moon className="h-5 w-5 text-gray-500 dark:text-gray-400" />
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="mt-6">
            <CardHeader>
              <CardTitle>Notifications</CardTitle>
              <CardDescription>
                Configure how you receive medicine reminders
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label className="text-base">Voice Alerts</Label>
                    <p className="text-sm text-gray-500 dark:text-gray-400">
                      Enable spoken reminders for your medications
                    </p>
                  </div>
                  <Switch defaultChecked />
                </div>
                
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label className="text-base">Visual Alerts</Label>
                    <p className="text-sm text-gray-500 dark:text-gray-400">
                      Show popup notifications for medication reminders
                    </p>
                  </div>
                  <Switch defaultChecked />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="mt-6">
            <CardHeader>
              <CardTitle>About MediCare Assistant</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                MediCare Assistant is a healthcare and well-being application that helps you manage your prescriptions, 
                set voice reminders for medication, and compare medicine prices across Indian pharmacies.
                <br /><br />
                Version: 1.0.0
              </p>
            </CardContent>
          </Card>
        </div>
      </div>
    </MainLayout>
  );
}
