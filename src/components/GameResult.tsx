import React from 'react';
import { motion } from 'framer-motion';

interface GameResultProps {
  score: number;
  highScore: number;
  onRestart: () => void;
  onBack: () => void;
  gameMode?: 'smile' | 'emoji';
}

export default function GameResult({ score, highScore, onRestart, onBack, gameMode = 'smile' }: GameResultProps) {
  const isNewRecord = score > highScore;
  const isPerfectScore = score === 100;

  const getMessage = () => {
    if (gameMode === 'emoji') {
      if (isNewRecord) {
        return "¡Nuevo récord! ¡Eres un maestro de los emojis! 🎉";
      }
      if (score > 50) {
        return "¡Excelente trabajo! ¡Eres muy rápido! 🚀";
      }
      if (score > 20) {
        return "¡Buen trabajo! Sigue practicando 💪";
      }
      return "¡Sigue intentando! ¡Puedes hacerlo mejor! 🌟";
    }

    // Mensajes para el modo sonrisa
    if (isNewRecord) {
      return "¡Nuevo récord! ¡Tu sonrisa es la mejor! 🎉";
    }
    if (isPerfectScore) {
      return "¡Sonrisa perfecta! ¡Eres un experto! 🌟";
    }
    if (score > 80) {
      return "¡Excelente sonrisa! ¡Casi perfecta! 😊";
    }
    if (score > 50) {
      return "¡Buena sonrisa! Sigue practicando 💪";
    }
    return "¡Sigue intentando! ¡Puedes sonreír mejor! 🌟";
  };

  return (
    <motion.div
      className="card max-w-md mx-auto text-center"
      initial={{ scale: 0.9, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
    >
      <h2 className="text-2xl font-bold text-blue-600 mb-4">
        {gameMode === 'emoji' ? '¡Juego Terminado!' : '¡Sonrisa Detectada!'}
      </h2>
      
      <div className="text-4xl font-bold text-blue-500 mb-4">
        {score} {gameMode === 'emoji' ? 'emojis' : 'puntos'}
      </div>

      {isNewRecord ? (
        <motion.div
          className="text-green-500 font-bold mb-4"
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ type: "spring", stiffness: 200 }}
        >
          ¡Nuevo Récord! 🏆
        </motion.div>
      ) : (
        <div className="text-gray-600 mb-4">
          Mejor puntuación: {highScore} {gameMode === 'emoji' ? 'emojis' : 'puntos'}
        </div>
      )}

      <p className="text-gray-600 mb-6">
        {getMessage()}
      </p>

      <div className="flex flex-col gap-4">
        <motion.button
          className="btn-primary"
          onClick={onRestart}
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
        >
          Jugar de nuevo
        </motion.button>
        <motion.button
          className="btn-secondary"
          onClick={onBack}
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
        >
          Volver al inicio
        </motion.button>
      </div>
    </motion.div>
  );
} 