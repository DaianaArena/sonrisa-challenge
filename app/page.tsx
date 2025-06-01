'use client'

import { motion } from 'framer-motion'
import StartScreen from './components/StartScreen'

export default function Home() {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="flex flex-col items-center justify-center min-h-[80vh]"
    >
      <StartScreen />
    </motion.div>
  )
} 