import React from 'react';
import { motion } from 'framer-motion';

interface GameResultProps {
  score: number;
  highScore: number;
  onRestart: () => void;
  onBack: () => void;
}

const GameResult: React.FC<GameResultProps> = ({ score, highScore, onRestart, onBack }) => {
  return (
    <motion.div
      className="card max-w-md mx-auto text-center"
      initial={{ scale: 0.9, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
    >
      <h2 className="text-2xl font-bold text-blue-600 mb-4">¡Juego Terminado!</h2>
      
      <div className="mb-6">
        <p className="text-4xl font-bold text-gray-800 mb-2">{score}</p>
        <p className="text-gray-600">puntos</p>
      </div>

      {score > highScore && (
        <motion.div
          className="mb-6 text-green-600"
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ delay: 0.5 }}
        >
          <p className="text-xl font-bold">¡Nuevo récord!</p>
          <p className="text-sm">Puntuación anterior: {highScore}</p>
        </motion.div>
      )}

      <div className="space-y-4">
        <motion.button
          className="btn-primary w-full"
          onClick={onRestart}
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
        >
          Jugar de nuevo
        </motion.button>

        <motion.button
          className="btn-secondary w-full"
          onClick={onBack}
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
        >
          Volver al menú
        </motion.button>
      </div>
    </motion.div>
  );
};

export default GameResult; 