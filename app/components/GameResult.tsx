'use client'

import { motion } from 'framer-motion'

interface GameResultProps {
  score: number
  highScore: number
  onRestart: () => void
  onBack: () => void
}

export default function GameResult({ score, highScore, onRestart, onBack }: GameResultProps) {
  const isNewHighScore = score > highScore

  return (
    <motion.div
      className="card max-w-md mx-auto text-center"
      initial={{ scale: 0.9, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      transition={{ duration: 0.3 }}
    >
      <h2 className="text-2xl font-bold text-blue-600 mb-4">Game Over!</h2>
      
      <div className="space-y-4 mb-8">
        <p className="text-xl">
          Your Score: <span className="font-bold text-pink-500">{score}</span>
        </p>
        
        {isNewHighScore ? (
          <motion.p
            className="text-lg text-green-500 font-bold"
            initial={{ scale: 1 }}
            animate={{ scale: [1, 1.2, 1] }}
            transition={{ duration: 0.5, repeat: 2 }}
          >
            🎉 New High Score! 🎉
          </motion.p>
        ) : (
          <p className="text-lg">
            High Score: <span className="font-bold text-blue-500">{highScore}</span>
          </p>
        )}
      </div>

      <div className="space-y-3">
        <motion.button
          className="btn-primary w-full"
          onClick={onRestart}
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
        >
          Play Again
        </motion.button>

        <motion.button
          className="btn-secondary w-full"
          onClick={onBack}
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
        >
          Back to Menu
        </motion.button>

        <a
          href="https://expedicionsonrisa.com/apadrinar/"
          target="_blank"
          rel="noopener noreferrer"
          className="block mt-6 text-blue-500 hover:underline"
        >
          Support Expedición Sonrisa
        </a>
      </div>
    </motion.div>
  )
} 