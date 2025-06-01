import { motion } from 'framer-motion';
import { ReactNode } from 'react';

interface GameLayoutProps {
  children: ReactNode;
  onBack: () => void;
}

export default function GameLayout({ children, onBack }: GameLayoutProps) {
  return (
    <div className="relative w-full h-screen overflow-hidden">
      <motion.button
        className="fixed top-4 left-4 z-50 bg-white bg-opacity-80 hover:bg-opacity-100 text-blue-600 px-4 py-2 rounded-lg shadow-md flex items-center gap-2"
        onClick={onBack}
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
      >
        ← Volver
      </motion.button>
      <div className="w-full h-[calc(100vh-4rem)] mt-16 overflow-hidden">
        {children}
      </div>
    </div>
  );
} 