import { useAuth } from '@/hooks/useAuth';
import { Link } from 'wouter';
import { User, LogOut } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { ThemeToggle } from '@/components/ThemeToggle';
import NotificationCenter from '@/components/NotificationCenter';
import { useQuery } from '@tanstack/react-query';
import { Prescription } from '@shared/schema';
import { motion } from 'framer-motion';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

export default function TopNavBar() {
  const { user, logout } = useAuth();
  
  const { data: prescriptions = [] } = useQuery<Prescription[]>({
    queryKey: ['/api/prescriptions'],
    enabled: !!user,
  });

  return (
    <div className="w-full h-[50px] px-4 bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-800 fixed top-0 left-0 right-0 z-10 flex items-center justify-between shadow-sm bg-opacity-90 backdrop-blur-sm">
      <div className="flex items-center h-full">
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.5 }}
          className="h-full flex items-center"
        >
          <Link href="/">
            <a className="flex items-center h-full">
              <svg className="w-8 h-8 mr-2" viewBox="0 0 56 56" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M28 0c15.464 0 28 12.536 28 28S43.464 56 28 56 0 43.464 0 28 12.536 0 28 0zm0 4C14.745 4 4 14.745 4 28s10.745 24 24 24 24-10.745 24-24S41.255 4 28 4z" fill="#3B82F6"/>
                <path stroke="#3B82F6" strokeWidth="4" d="M12 22l6 6 8-10 8 12 6-8 4 6"/>
              </svg>
              <h1 className="text-lg md:text-xl font-bold bg-gradient-to-r from-primary to-blue-600 bg-clip-text text-transparent">
                MediCare Assistant
              </h1>
            </a>
          </Link>
        </motion.div>
      </div>
      
      <div className="flex items-center gap-3">
        {user && (
          <>
            <NotificationCenter prescriptions={prescriptions || []} />
            <ThemeToggle />
            
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="relative h-8 w-8 rounded-full">
                  <Avatar className="h-8 w-8">
                    <AvatarImage src="/avatar.png" alt={user.username} />
                    <AvatarFallback className="bg-primary/20 text-primary">
                      {user.username.substring(0, 2).toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent className="w-56" align="end" forceMount>
                <DropdownMenuLabel className="font-normal">
                  <div className="flex flex-col space-y-1">
                    <p className="text-sm font-medium leading-none">{user.username}</p>
                    <p className="text-xs leading-none text-muted-foreground">
                      {user.email}
                    </p>
                  </div>
                </DropdownMenuLabel>
                <DropdownMenuSeparator />
                <Link href="/profile">
                  <DropdownMenuItem className="cursor-pointer">
                    <User className="mr-2 h-4 w-4" />
                    <span>Profile</span>
                  </DropdownMenuItem>
                </Link>
                <Link href="/settings">
                  <DropdownMenuItem className="cursor-pointer">
                    <User className="mr-2 h-4 w-4" />
                    <span>Settings</span>
                  </DropdownMenuItem>
                </Link>
                <DropdownMenuSeparator />
                <DropdownMenuItem 
                  className="cursor-pointer text-red-500 focus:text-red-500"
                  onClick={() => logout()}
                >
                  <LogOut className="mr-2 h-4 w-4" />
                  <span>Log out</span>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </>
        )}
      </div>
    </div>
  );
}