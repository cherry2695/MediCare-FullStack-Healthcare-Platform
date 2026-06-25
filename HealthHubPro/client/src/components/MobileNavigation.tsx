import { Link, useLocation } from "wouter";
import { cn } from "@/lib/utils";

export default function MobileNavigation() {
  const [location] = useLocation();

  const navItems = [
    { href: "/", icon: "fas fa-home", label: "Home" },
    { href: "/prescriptions", icon: "fas fa-prescription-bottle-alt", label: "Prescriptions" },
    { href: "/price-comparison", icon: "fas fa-rupee-sign", label: "Compare" },
    { href: "/profile", icon: "fas fa-user", label: "Profile" },
    { href: "/settings", icon: "fas fa-cog", label: "Settings" },
  ];

  return (
    <div className="md:hidden fixed bottom-0 left-0 right-0 bg-white dark:bg-gray-900 border-t border-gray-200 dark:border-gray-800 z-20">
      <div className="grid grid-cols-5 py-2">
        {navItems.map((item) => (
          <Link key={item.href} href={item.href}>
            <a className={cn(
              "flex flex-col items-center justify-center",
              location === item.href
                ? "text-primary"
                : "text-gray-500 dark:text-gray-400"
            )}>
              <i className={`${item.icon} text-lg`}></i>
              <span className="text-xs mt-1">{item.label}</span>
            </a>
          </Link>
        ))}
      </div>
    </div>
  );
}
