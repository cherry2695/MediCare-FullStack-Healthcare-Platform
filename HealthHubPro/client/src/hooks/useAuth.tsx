import { createContext, useContext, useState, useEffect, ReactNode } from "react";
import { useLocation } from "wouter";
import { useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { LoginUser, InsertUser, User, UpdateUser } from "@shared/schema";
import { Loader2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface AuthContextType {
  user: User | null;
  isLoading: boolean;
  login: (data: LoginUser) => Promise<void>;
  register: (data: InsertUser) => Promise<void>;
  logout: () => Promise<void>;
  updateProfile: (data: Partial<User>) => void;
  deleteAccount: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [, navigate] = useLocation();
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const { toast } = useToast();
  
  // Check authentication status on component mount
  useEffect(() => {
    const checkAuth = async () => {
      try {
        setIsLoading(true);
        const response = await fetch('/api/users/profile', { 
          credentials: 'include'
        });
        
        if (response.ok) {
          const userData = await response.json();
          setUser(userData);
        } else {
          // If not authenticated (401/403), just set user to null
          setUser(null);
        }
      } catch (error) {
        console.error('Auth check error:', error);
        setUser(null);
      } finally {
        setIsLoading(false);
      }
    };
    
    checkAuth();
  }, []);

  const loginMutation = useMutation({
    mutationFn: async (data: LoginUser) => {
      const res = await apiRequest("POST", "/api/auth/login", data);
      return res.json();
    },
    onSuccess: (data) => {
      setUser(data);
      toast({
        title: "Login successful",
        description: "Welcome to MediCare Assistant"
      });
      navigate("/");
    },
    onError: (error) => {
      toast({
        title: "Login failed",
        description: error instanceof Error ? error.message : "Invalid credentials",
        variant: "destructive"
      });
    }
  });

  const registerMutation = useMutation({
    mutationFn: async (data: InsertUser) => {
      const res = await apiRequest("POST", "/api/auth/register", data);
      return res.json();
    },
    onSuccess: () => {
      toast({
        title: "Registration successful",
        description: "You can now log in with your credentials"
      });
      navigate("/login");
    },
    onError: (error) => {
      toast({
        title: "Registration failed",
        description: error instanceof Error ? error.message : "Could not create account",
        variant: "destructive"
      });
    }
  });

  const logoutMutation = useMutation({
    mutationFn: async () => {
      await apiRequest("POST", "/api/auth/logout", {});
    },
    onSuccess: () => {
      setUser(null);
      toast({
        title: "Logged out",
        description: "You have been logged out successfully"
      });
      navigate("/login");
    }
  });

  const deleteAccountMutation = useMutation({
    mutationFn: async () => {
      await apiRequest("DELETE", "/api/users/profile");
    },
    onSuccess: () => {
      setUser(null);
      toast({
        title: "Account deleted",
        description: "Your account has been deleted successfully"
      });
      navigate("/login");
    }
  });

  const login = async (data: LoginUser) => {
    return loginMutation.mutateAsync(data);
  };

  const register = async (data: InsertUser) => {
    return registerMutation.mutateAsync(data);
  };

  const logout = async () => {
    return logoutMutation.mutateAsync();
  };

  const deleteAccount = async () => {
    return deleteAccountMutation.mutateAsync();
  };

  const updateProfile = (data: Partial<User>) => {
    if (user) {
      setUser({ ...user, ...data });
    }
  };

  return (
    <AuthContext.Provider value={{ 
      user, 
      isLoading, 
      login, 
      register, 
      logout,
      updateProfile,
      deleteAccount,
    }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
