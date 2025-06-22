import React from 'react';
import { Zap } from 'lucide-react';
import { motion } from 'framer-motion';

const MadeWithBolt: React.FC = () => {
  return (
    <motion.a
      href="https://bolt.new"
      target="_blank"
      rel="noopener noreferrer"
      className="fixed bottom-4 right-4 bg-gradient-to-r from-blue-600 to-purple-600 text-white px-3 py-2 rounded-full shadow-lg flex items-center space-x-2 hover:shadow-xl z-50 group"
      whileHover={{ scale: 1.05 }}
      whileTap={{ scale: 0.95 }}
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      aria-label="Made with Bolt"
    >
      <Zap className="h-4 w-4 text-white group-hover:animate-pulse" />
      <span className="text-sm font-medium">Made with Bolt</span>
    </motion.a>
  );
};

export default MadeWithBolt;