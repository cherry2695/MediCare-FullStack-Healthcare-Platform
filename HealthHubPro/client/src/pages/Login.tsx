import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { LoginUser, loginUserSchema } from "@shared/schema";
import { motion } from "framer-motion";
import { ThemeToggle } from "@/components/ThemeToggle";
import { 
  Card, 
  CardContent, 
  CardHeader,
  CardTitle,
  CardDescription,
  CardFooter
} from "@/components/ui/card";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Loader2, Eye, EyeOff, Heart, Pill, Bell, User, Clock, AlertCircle, CheckCircle2, BarChart3 } from "lucide-react";

export default function Login() {
  const [, navigate] = useLocation();
  const { login } = useAuth();
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const form = useForm<LoginUser>({
    resolver: zodResolver(loginUserSchema),
    defaultValues: {
      username: "",
      password: "",
    },
  });

  const onSubmit = async (data: LoginUser) => {
    setIsLoading(true);
    try {
      await login(data);
      toast({
        title: "Login successful",
        description: "Welcome back to MediCare Assistant!",
      });
      navigate("/");
    } catch (error) {
      console.error("Login error:", error);
      toast({
        title: "Login failed",
        description: error instanceof Error ? error.message : "Invalid credentials",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  // Animation variants for staggered animations
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: { 
      opacity: 1,
      transition: { 
        staggerChildren: 0.1,
        delayChildren: 0.1
      }
    }
  };
  
  const itemVariants = {
    hidden: { y: 20, opacity: 0 },
    visible: {
      y: 0,
      opacity: 1,
      transition: { type: "spring", stiffness: 300, damping: 24 }
    }
  };

  // Animate icons in a loop
  const [activeIconIndex, setActiveIconIndex] = useState(0);
  const healthIcons = [
    <Heart className="h-6 w-6 text-red-500" key="heart" />,
    <Pill className="h-6 w-6 text-blue-500" key="pill" />,
    <Bell className="h-6 w-6 text-yellow-500" key="bell" />,
    <User className="h-6 w-6 text-green-500" key="user" />
  ];
  
  useEffect(() => {
    const interval = setInterval(() => {
      setActiveIconIndex(prev => (prev + 1) % healthIcons.length);
    }, 2000);
    
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="min-h-screen flex flex-col items-center px-4 py-16 bg-gradient-to-b from-gray-50 to-blue-50 dark:from-gray-900 dark:to-blue-950">
      {/* Theme toggle in top-right corner */}
      <div className="absolute top-4 right-4">
        <ThemeToggle />
      </div>
      
      {/* Floating shapes in background */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        {[...Array(6)].map((_, i) => (
          <motion.div
            key={i}
            className="absolute rounded-full bg-primary/5 dark:bg-primary/10"
            style={{
              width: `${Math.random() * 100 + 50}px`,
              height: `${Math.random() * 100 + 50}px`,
              left: `${Math.random() * 90}%`,
              top: `${Math.random() * 90}%`,
            }}
            animate={{
              x: [0, Math.random() * 40 - 20],
              y: [0, Math.random() * 40 - 20],
              scale: [1, Math.random() * 0.2 + 0.9]
            }}
            transition={{
              duration: Math.random() * 5 + 8,
              repeat: Infinity,
              repeatType: "reverse",
              ease: "easeInOut"
            }}
          />
        ))}
      </div>
      
      {/* Header section */}
      <div className="text-center mb-12 max-w-3xl">
        <motion.div 
          className="flex justify-center mb-6"
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ type: "spring", duration: 0.5 }}
        >
          <div className="h-24 w-24 rounded-full bg-blue-100 dark:bg-blue-900 flex items-center justify-center shadow-md">
            <motion.div
              animate={{ 
                rotate: [0, 360],
                scale: [1, 1.05, 1]
              }}
              transition={{ 
                duration: 6, 
                repeat: Infinity,
                repeatType: "loop"
              }}
              className="relative h-12 w-12"
            >
              {/* Animated health icon */}
              <motion.div
                key={activeIconIndex}
                initial={{ scale: 0, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0, opacity: 0 }}
                transition={{ duration: 0.3 }}
              >
                {healthIcons[activeIconIndex]}
              </motion.div>
            </motion.div>
          </div>
        </motion.div>
        
        <motion.h1
          className="text-4xl md:text-5xl font-bold bg-gradient-to-r from-primary to-blue-600 bg-clip-text text-transparent mb-4"
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2, duration: 0.6 }}
        >
          MediCare Assistant
        </motion.h1>
        
        <motion.p
          className="text-xl text-gray-600 dark:text-gray-300"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4, duration: 0.6 }}
        >
          Your personal healthcare companion for prescription management and medication reminders
        </motion.p>
      </div>
      
      {/* Main content with features and login form */}
      <div className="w-full max-w-6xl flex flex-col lg:flex-row gap-8 lg:gap-12 items-start">
        {/* Features section */}
        <motion.div 
          className="flex-1 space-y-6"
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.5, duration: 0.7 }}
        >
          <h2 className="text-2xl font-bold text-gray-800 dark:text-gray-100 mb-6">Key Features</h2>
          
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            <Card className="border-blue-100 dark:border-blue-900 bg-white/90 dark:bg-gray-900/90 hover:shadow-md transition-shadow">
              <CardHeader className="pb-2">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-full bg-primary/10 text-primary">
                    <Pill className="h-5 w-5" />
                  </div>
                  <CardTitle className="text-lg">Medication Management</CardTitle>
                </div>
              </CardHeader>
              <CardContent>
                <p className="text-gray-600 dark:text-gray-400 text-sm">
                  Easily track all your prescriptions in one place with detailed information about dosage, frequency, and instructions.
                </p>
              </CardContent>
            </Card>
            
            <Card className="border-blue-100 dark:border-blue-900 bg-white/90 dark:bg-gray-900/90 hover:shadow-md transition-shadow">
              <CardHeader className="pb-2">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-full bg-red-100 text-red-500 dark:bg-red-900/30 dark:text-red-400">
                    <Bell className="h-5 w-5" />
                  </div>
                  <CardTitle className="text-lg">Smart Reminders</CardTitle>
                </div>
              </CardHeader>
              <CardContent>
                <p className="text-gray-600 dark:text-gray-400 text-sm">
                  Never miss a dose with timely reminders that alert you when it's time to take your medication.
                </p>
              </CardContent>
            </Card>
            
            <Card className="border-blue-100 dark:border-blue-900 bg-white/90 dark:bg-gray-900/90 hover:shadow-md transition-shadow">
              <CardHeader className="pb-2">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-full bg-green-100 text-green-500 dark:bg-green-900/30 dark:text-green-400">
                    <BarChart3 className="h-5 w-5" />
                  </div>
                  <CardTitle className="text-lg">Price Comparison</CardTitle>
                </div>
              </CardHeader>
              <CardContent>
                <p className="text-gray-600 dark:text-gray-400 text-sm">
                  Compare medication prices across different pharmacies to find the best deals and save money.
                </p>
              </CardContent>
            </Card>
            
            <Card className="border-blue-100 dark:border-blue-900 bg-white/90 dark:bg-gray-900/90 hover:shadow-md transition-shadow">
              <CardHeader className="pb-2">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-full bg-yellow-100 text-yellow-600 dark:bg-yellow-900/30 dark:text-yellow-400">
                    <CheckCircle2 className="h-5 w-5" />
                  </div>
                  <CardTitle className="text-lg">Adherence Tracking</CardTitle>
                </div>
              </CardHeader>
              <CardContent>
                <p className="text-gray-600 dark:text-gray-400 text-sm">
                  Track your medication adherence with detailed reports and insights to help you stay on your treatment plan.
                </p>
              </CardContent>
            </Card>
          </div>
        </motion.div>
        
        {/* Login form */}
        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.7, delay: 0.6 }}
          className="w-full lg:w-1/3 lg:min-w-[350px]"
        >
          <Card className="shadow-xl border-blue-100 dark:border-blue-900 backdrop-blur-sm bg-white/90 dark:bg-gray-900/90">
            <CardHeader className="space-y-2 pb-4">
              <CardTitle className="text-2xl font-bold text-center">
                Sign In
              </CardTitle>
              <CardDescription className="text-center">
                Access your personal healthcare dashboard
              </CardDescription>
            </CardHeader>
            
            <CardContent>
              <Form {...form}>
                <motion.form 
                  onSubmit={form.handleSubmit(onSubmit)}
                  variants={containerVariants}
                  initial="hidden"
                  animate="visible"
                  className="space-y-4"
                >
                  <motion.div variants={itemVariants}>
                    <FormField
                      control={form.control}
                      name="username"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-gray-700 dark:text-gray-300">Username</FormLabel>
                          <FormControl>
                            <Input 
                              placeholder="Enter your username" 
                              {...field} 
                              disabled={isLoading}
                              className="h-11 bg-gray-50 dark:bg-gray-800 border-gray-200 dark:border-gray-700 focus:ring-2 focus:ring-primary/20"
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </motion.div>
                  
                  <motion.div variants={itemVariants}>
                    <FormField
                      control={form.control}
                      name="password"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-gray-700 dark:text-gray-300">Password</FormLabel>
                          <FormControl>
                            <div className="relative">
                              <Input 
                                type={showPassword ? "text" : "password"} 
                                placeholder="••••••••" 
                                {...field} 
                                disabled={isLoading}
                                className="h-11 pr-10 bg-gray-50 dark:bg-gray-800 border-gray-200 dark:border-gray-700 focus:ring-2 focus:ring-primary/20" 
                              />
                              <button
                                type="button"
                                onClick={() => setShowPassword(prev => !prev)}
                                aria-label={showPassword ? "Hide password" : "Show password"}
                                className="absolute inset-y-0 right-2 flex items-center text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300"
                                tabIndex={-1}
                              >
                                {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                              </button>
                            </div>
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </motion.div>
                  
                  <motion.div variants={itemVariants}>
                    <Button 
                      type="submit" 
                      className="w-full h-11 mt-2" 
                      disabled={isLoading}
                    >
                      {isLoading ? (
                        <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                      ) : (
                        "Sign In"
                      )}
                    </Button>
                  </motion.div>
                </motion.form>
              </Form>
            </CardContent>
            
            <CardFooter className="flex flex-col space-y-4">
              <motion.div 
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.8 }}
                className="text-center text-sm text-gray-600 dark:text-gray-400"
              >
                Don't have an account?{" "}
                <Button 
                  variant="link" 
                  className="p-0 font-medium text-primary hover:text-primary/80" 
                  onClick={() => navigate("/register")}
                >
                  Register
                </Button>
              </motion.div>
            </CardFooter>
          </Card>
        </motion.div>
      </div>
      
      {/* Footer section */}
      <motion.div 
        className="mt-16 text-center text-sm text-gray-500 dark:text-gray-400"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 1 }}
      >
        <p>© 2025 MediCare Assistant. All rights reserved.</p>
        <p className="mt-1">A comprehensive solution for healthcare management and medication reminders.</p>
      </motion.div>
    </div>
  );
}
