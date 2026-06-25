import { Link, useLocation } from "wouter";
import { useAuth } from "@/hooks/useAuth";
import { cn } from "@/lib/utils";

interface SidebarLinkProps {
  href: string;
  icon: string;
  label: string;
  active: boolean;
}

const SidebarLink = ({ href, icon, label, active }: SidebarLinkProps) => {
  return (
    <Link href={href}>
      <a className={cn(
        "group flex items-center px-2 py-2 text-sm font-medium rounded-md",
        active
          ? "text-gray-900 bg-gray-100 dark:text-white dark:bg-gray-800"
          : "text-gray-600 hover:bg-gray-50 hover:text-gray-900 dark:text-gray-400 dark:hover:bg-gray-800 dark:hover:text-white"
      )}>
        <i className={cn(
          icon,
          "mr-3 flex-shrink-0 h-5 w-5",
          active
            ? "text-primary"
            : "text-gray-500 dark:text-gray-400"
        )}></i>
        {label}
      </a>
    </Link>
  );
};

export default function Sidebar() {
  const [location] = useLocation();
  const { logout } = useAuth();

  const handleLogout = (e: React.MouseEvent) => {
    e.preventDefault();
    logout();
  };

  const navItems = [
    { href: "/", icon: "fas fa-home", label: "Dashboard" },
    { href: "/prescriptions", icon: "fas fa-prescription-bottle-alt", label: "My Prescriptions" },
    { href: "/price-comparison", icon: "fas fa-rupee-sign", label: "Price Comparison" },
    { href: "/profile", icon: "fas fa-user", label: "Profile" },
    { href: "/settings", icon: "fas fa-cog", label: "Settings" },
  ];

  return (
    <aside className="hidden md:flex md:flex-shrink-0">
      <div className="flex flex-col w-64 border-r border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900">
        <div className="h-0 flex-1 flex flex-col pt-0 pb-4 overflow-y-auto">
          <div className="flex items-center flex-shrink-0 px-4 mb-3 mt-2">
            <Link href="/">
              <a className="text-xl font-bold text-primary flex items-center">
                <div className="flex items-center">
                  <span className="bg-gradient-to-r from-primary to-blue-600 bg-clip-text text-transparent">MediCare Assistant</span>
                </div>
              </a>
            </Link>
          </div>
          <nav className="mt-1 flex-1 px-2 bg-white dark:bg-gray-900 space-y-1">
            {navItems.map((item) => (
              <SidebarLink
                key={item.href}
                href={item.href}
                icon={item.icon}
                label={item.label}
                active={location === item.href}
              />
            ))}
            
            <div className="pt-4 mt-4 border-t border-gray-200 dark:border-gray-800">
              <a 
                href="#" 
                onClick={handleLogout}
                className="text-gray-600 hover:bg-gray-50 hover:text-gray-900 dark:text-gray-400 dark:hover:bg-gray-800 dark:hover:text-white group flex items-center px-2 py-2 text-sm font-medium rounded-md"
              >
                <i className="fas fa-sign-out-alt mr-3 flex-shrink-0 h-5 w-5 text-gray-500 dark:text-gray-400"></i>
                Logout
              </a>
            </div>
          </nav>
        </div>
      </div>
    </aside>
  );
}
