import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import MainLayout from "@/layouts/MainLayout";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { UpdateUser, updateUserSchema } from "@shared/schema";
import { 
  Card,
  CardContent, 
  CardDescription, 
  CardFooter, 
  CardHeader, 
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Loader2, Save, Trash2 } from "lucide-react";

export default function Profile() {
  const { user, updateProfile, deleteAccount, logout } = useAuth();
  const { toast } = useToast();
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  
  const form = useForm<UpdateUser>({
    resolver: zodResolver(updateUserSchema),
    defaultValues: {
      username: user?.username || "",
      email: user?.email || "",
      password: "",
    },
  });

  const updateMutation = useMutation({
    mutationFn: async (data: UpdateUser) => {
      await apiRequest("PATCH", "/api/users/profile", data);
      return data;
    },
    onSuccess: (data) => {
      // Remove password from data displayed in toast
      const { password, ...displayData } = data;
      toast({
        title: "Profile updated",
        description: "Your profile has been updated successfully",
      });
      // Update local user data
      updateProfile(data);
      // Reset password field
      form.reset({ ...data, password: "" });
      // Invalidate user cache
      queryClient.invalidateQueries({ queryKey: ['/api/users/profile'] });
    },
    onError: (error) => {
      toast({
        title: "Update failed",
        description: error instanceof Error ? error.message : "Failed to update profile",
        variant: "destructive",
      });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async () => {
      await apiRequest("DELETE", "/api/users/profile");
    },
    onSuccess: () => {
      toast({
        title: "Account deleted",
        description: "Your account has been deleted successfully",
      });
      logout();
    },
    onError: (error) => {
      toast({
        title: "Deletion failed",
        description: error instanceof Error ? error.message : "Failed to delete account",
        variant: "destructive",
      });
      setShowDeleteDialog(false);
    },
  });

  const onSubmit = (data: UpdateUser) => {
    // Only include fields that have been changed
    const updatedFields: UpdateUser = {};
    
    if (data.username && data.username !== user?.username) {
      updatedFields.username = data.username;
    }
    
    if (data.email && data.email !== user?.email) {
      updatedFields.email = data.email;
    }
    
    if (data.password) {
      updatedFields.password = data.password;
    }

    if (Object.keys(updatedFields).length === 0) {
      toast({
        title: "No changes",
        description: "No changes were made to your profile",
      });
      return;
    }

    updateMutation.mutate(updatedFields);
  };

  const handleDeleteAccount = () => {
    deleteMutation.mutate();
  };

  if (!user) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  const userInitials = user.username
    .split(' ')
    .map(name => name[0])
    .join('')
    .toUpperCase()
    .substring(0, 2);

  return (
    <MainLayout>
      <div className="pb-20 md:pb-6">
        <div className="max-w-7xl mx-auto px-2 sm:px-4 md:px-6">
          <h1 className="text-2xl font-semibold text-gray-900 dark:text-white">Profile</h1>
          <p className="text-gray-600 dark:text-gray-400 mt-1">Manage your account information</p>
        </div>
        
        <div className="max-w-7xl mx-auto px-2 sm:px-4 md:px-6 mt-4">
          <div className="grid gap-6 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle>Account Information</CardTitle>
                <CardDescription>
                  Update your account details and password
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Form {...form}>
                  <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                    <div className="flex justify-center mb-6">
                      <Avatar className="h-24 w-24 text-lg">
                        <AvatarFallback className="bg-primary text-white">
                          {userInitials}
                        </AvatarFallback>
                      </Avatar>
                    </div>
                    
                    <FormField
                      control={form.control}
                      name="username"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Username</FormLabel>
                          <FormControl>
                            <Input placeholder="Enter username" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    
                    <FormField
                      control={form.control}
                      name="email"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Email</FormLabel>
                          <FormControl>
                            <Input type="email" placeholder="Enter email" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    
                    <FormField
                      control={form.control}
                      name="password"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>New Password</FormLabel>
                          <FormControl>
                            <Input 
                              type="password" 
                              placeholder="Enter new password (leave blank to keep current)" 
                              {...field} 
                            />
                          </FormControl>
                          <FormDescription>
                            Leave blank if you don't want to change your password
                          </FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    
                    <Button 
                      type="submit" 
                      className="w-full" 
                      disabled={updateMutation.isPending}
                    >
                      {updateMutation.isPending ? (
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      ) : (
                        <Save className="mr-2 h-4 w-4" />
                      )}
                      Save Changes
                    </Button>
                  </form>
                </Form>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader>
                <CardTitle>Danger Zone</CardTitle>
                <CardDescription>
                  Irreversible actions for your account
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="rounded-md border border-red-200 p-4 dark:border-red-900">
                    <h3 className="text-lg font-medium text-red-600 dark:text-red-400">Delete Account</h3>
                    <p className="mt-1 text-sm text-gray-600 dark:text-gray-400">
                      Once you delete your account, all your data including prescriptions and reminders will be permanently removed. This action cannot be undone.
                    </p>
                    <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
                      <AlertDialogTrigger asChild>
                        <Button variant="destructive" className="mt-4">
                          <Trash2 className="mr-2 h-4 w-4" />
                          Delete Account
                        </Button>
                      </AlertDialogTrigger>
                      <AlertDialogContent>
                        <AlertDialogHeader>
                          <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
                          <AlertDialogDescription>
                            This action cannot be undone. This will permanently delete your account and remove all your data from our servers.
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel disabled={deleteMutation.isPending}>Cancel</AlertDialogCancel>
                          <AlertDialogAction 
                            onClick={(e) => {
                              e.preventDefault();
                              handleDeleteAccount();
                            }}
                            disabled={deleteMutation.isPending}
                            className="bg-red-600 hover:bg-red-700"
                          >
                            {deleteMutation.isPending ? (
                              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                            ) : null}
                            Yes, delete my account
                          </AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </MainLayout>
  );
}
