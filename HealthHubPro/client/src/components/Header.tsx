import { Link } from "wouter";
import { useAuth } from "@/hooks/useAuth";
import { 
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Bell, Menu } from "lucide-react";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import Sidebar from "./Sidebar";

export default function Header() {
  const { user, logout } = useAuth();

  if (!user) {
    return null;
  }

  const userInitials = user.username
    .split(' ')
    .map(name => name[0])
    .join('')
    .toUpperCase()
    .substring(0, 2);

  return (
    <header className="bg-white dark:bg-gray-900 shadow-sm fixed top-0 left-0 right-0 z-10 border-b border-gray-200 dark:border-gray-800">
      <div className="mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          <div className="flex">
            <div className="flex-shrink-0 flex items-center">
              <Link href="/">
                <a className="text-2xl font-bold text-primary flex items-center">
                  <div className="flex items-center">
                    <svg className="w-7 h-7 mr-2" viewBox="0 0 56 56" fill="none" xmlns="http://www.w3.org/2000/svg">
                      <path d="M28 0c15.464 0 28 12.536 28 28S43.464 56 28 56 0 43.464 0 28 12.536 0 28 0zm0 4C14.745 4 4 14.745 4 28s10.745 24 24 24 24-10.745 24-24S41.255 4 28 4z" fill="#3B82F6"/>
                      <path stroke="#3B82F6" strokeWidth="4" d="M12 22l6 6 8-10 8 12 6-8 4 6"/>
                    </svg>
                    <span>MediCare<span className="text-gray-500 dark:text-gray-400 ml-1">Assistant</span></span>
                  </div>
                </a>
              </Link>
            </div>
          </div>

          <div className="hidden sm:ml-6 sm:flex sm:items-center">
            <Button variant="ghost" size="icon" className="relative">
              <Bell className="h-5 w-5 text-gray-500 dark:text-gray-400" />
              <span className="absolute top-1 right-1 inline-block w-2 h-2 bg-amber-500 rounded-full"></span>
            </Button>

            {/* Profile dropdown */}
            <div className="ml-3 relative">
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" className="relative h-8 w-8 rounded-full">
                    <Avatar className="h-8 w-8">
                      <AvatarFallback className="bg-primary text-white">
                        {userInitials}
                      </AvatarFallback>
                    </Avatar>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuLabel>My Account</DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem asChild>
                    <Link href="/profile">
                      <a className="cursor-pointer w-full">Profile</a>
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem asChild>
                    <Link href="/settings">
                      <a className="cursor-pointer w-full">Settings</a>
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={logout} className="cursor-pointer">
                    Logout
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>

          <div className="-mr-2 flex items-center sm:hidden">
            {/* Mobile menu button */}
            <Sheet>
              <SheetTrigger asChild>
                <Button variant="ghost" size="icon">
                  <Menu className="h-5 w-5 text-gray-500 dark:text-gray-400" />
                </Button>
              </SheetTrigger>
              <SheetContent side="left" className="w-72 p-0">
                <div className="py-4 px-4 flex items-center border-b border-gray-200 dark:border-gray-800">
                  <Link href="/">
                    <a className="text-xl font-bold text-primary flex items-center">
                      <div className="flex items-center">
                        <svg className="w-6 h-6 mr-2" viewBox="0 0 56 56" fill="none" xmlns="http://www.w3.org/2000/svg">
                          <path d="M28 0c15.464 0 28 12.536 28 28S43.464 56 28 56 0 43.464 0 28 12.536 0 28 0zm0 4C14.745 4 4 14.745 4 28s10.745 24 24 24 24-10.745 24-24S41.255 4 28 4z" fill="#3B82F6"/>
                          <path stroke="#3B82F6" strokeWidth="4" d="M12 22l6 6 8-10 8 12 6-8 4 6"/>
                        </svg>
                        <span>MediCare<span className="text-gray-500 dark:text-gray-400 ml-1">Assistant</span></span>
                      </div>
                    </a>
                  </Link>
                </div>
                <div className="overflow-y-auto py-4">
                  <Sidebar />
                </div>
              </SheetContent>
            </Sheet>
          </div>
        </div>
      </div>
    </header>
  );
}
