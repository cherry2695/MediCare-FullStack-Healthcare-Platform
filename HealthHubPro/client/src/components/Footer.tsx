import { motion } from "framer-motion";
import { Heart } from "lucide-react";

export default function Footer() {
  return (
    <footer className="py-4 px-4 sm:px-6 lg:px-8 border-t border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 w-full">
      <motion.div 
        className="flex flex-col md:flex-row items-center justify-between text-sm text-gray-500 dark:text-gray-400 max-w-7xl mx-auto"
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <div className="mb-2 md:mb-0">
          <p>© 2025 MediCare Assistant. All rights reserved.</p>
        </div>
        
        <div className="flex items-center">
          <span className="flex items-center">
            Made with <Heart className="h-3 w-3 mx-1 text-red-500" /> for better healthcare
          </span>
        </div>
      </motion.div>
    </footer>
  );
}