import { Moon, Sun } from "lucide-react";
import { useTheme } from "@/lib/theme-provider";
import { Button } from "@/components/ui/button";
import { motion } from "framer-motion";

export function ThemeToggle() {
  const { theme, setTheme } = useTheme();

  const toggleTheme = () => {
    setTheme(theme === "light" ? "dark" : "light");
  };

  return (
    <motion.div 
      whileHover={{ scale: 1.05 }} 
      whileTap={{ scale: 0.95 }}
    >
      <Button
        variant="outline"
        size="icon"
        className="rounded-full bg-background/80 backdrop-blur-sm border border-muted-foreground/20 shadow-md"
        onClick={toggleTheme}
        aria-label="Toggle theme"
      >
        <motion.div
          initial={{ rotate: 0 }}
          animate={{ rotate: theme === "light" ? 0 : 180 }}
          transition={{ type: "spring", stiffness: 300, damping: 15 }}
          className="h-full w-full flex items-center justify-center"
        >
          {theme === "light" ? (
            <Sun className="h-4 w-4 text-yellow-500" />
          ) : (
            <Moon className="h-4 w-4 text-blue-400" />
          )}
        </motion.div>
      </Button>
    </motion.div>
  );
}