import { useState, useEffect, useCallback, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import GameResult from '../GameResult';

// Game configuration
const GAME_DURATION = 60; // seconds
const EMOJI_SPAWN_INTERVAL = 1000; // milliseconds
const MAX_EMOJIS = 5;

// Emoji configurations
const SMILING_EMOJIS = ['😊', '😄', '😁', '🥰', '😍'];
const NON_SMILING_EMOJIS = ['😐', '😑', '🤔', '😯', '😕'];

interface EmojiGameProps {
  onBack: () => void;
}

interface EmojiProps {
  emoji: string;
  position: { x: number; y: number };
  isSmiling: boolean;
  onClick: () => void;
}

// Single Emoji component
function Emoji({ emoji, position, onClick }: EmojiProps) {
  return (
    <motion.div
      className="absolute cursor-pointer text-4xl"
      style={{ left: position.x, top: position.y }}
      initial={{ scale: 0, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      exit={{ scale: 0, opacity: 0 }}
      onClick={onClick}
      whileHover={{ scale: 1.2 }}
      whileTap={{ scale: 0.9 }}
    >
      {emoji}
    </motion.div>
  );
}

export default function EmojiGame({ onBack }: EmojiGameProps) {
  const [score, setScore] = useState(0);
  const [gameOver, setGameOver] = useState(false);
  const [emojis, setEmojis] = useState<Array<{ id: number; emoji: string; position: { x: number; y: number }; isSmiling: boolean }>>([]);
  const [gameStarted, setGameStarted] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  // Load high score from localStorage
  const [highScore, setHighScore] = useState(() => {
    if (typeof window !== 'undefined') {
      return parseInt(localStorage.getItem('emojiGameHighScore') || '0');
    }
    return 0;
  });

  const handleGameOver = useCallback(() => {
    setGameOver(true);
    // Update high score if current score is higher
    if (score > highScore) {
      setHighScore(score);
      localStorage.setItem('emojiGameHighScore', score.toString());
    }
  }, [score, highScore]);

  const handleEmojiClick = (isSmiling: boolean, id: number) => {
    if (isSmiling) {
      setScore(prev => prev + 1);
      setEmojis(prev => prev.filter(emoji => emoji.id !== id));
    } else {
      handleGameOver();
    }
  };

  const startGame = () => {
    setGameStarted(true);
    setScore(0);
    setGameOver(false);
    setEmojis([]);
  };

  useEffect(() => {
    if (!gameStarted || gameOver || !containerRef.current) return;

    const spawnEmoji = () => {
      if (emojis.length >= MAX_EMOJIS) return;

      const container = containerRef.current;
      if (!container) return;

      const containerRect = container.getBoundingClientRect();
      const emojiSize = 48; // Tamaño aproximado del emoji en píxeles
      const padding = 20; // Padding para evitar que los emojis toquen los bordes

      const isSmiling = Math.random() > 0.4;
      const emoji = {
        id: Date.now(),
        emoji: isSmiling
          ? SMILING_EMOJIS[Math.floor(Math.random() * SMILING_EMOJIS.length)]
          : NON_SMILING_EMOJIS[Math.floor(Math.random() * NON_SMILING_EMOJIS.length)],
        position: {
          x: Math.random() * (containerRect.width - emojiSize - padding * 2) + padding,
          y: Math.random() * (containerRect.height - emojiSize - padding * 2) + padding
        },
        isSmiling
      };

      setEmojis(prev => [...prev, emoji]);

      // Remove emoji after a random time between 1-3 seconds
      setTimeout(() => {
        setEmojis(prev => prev.filter(e => e.id !== emoji.id));
      }, 1000 + Math.random() * 2000);
    };

    const spawnInterval = setInterval(spawnEmoji, EMOJI_SPAWN_INTERVAL);
    const gameTimer = setTimeout(handleGameOver, GAME_DURATION * 1000);

    return () => {
      clearInterval(spawnInterval);
      clearTimeout(gameTimer);
    };
  }, [gameStarted, gameOver, emojis.length, handleGameOver]);

  if (gameOver) {
    return <GameResult score={score} highScore={highScore} onRestart={startGame} onBack={onBack} />;
  }

  if (!gameStarted) {
    return (
      <motion.div
        className="card max-w-md mx-auto text-center"
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
      >
        <h2 className="text-2xl font-bold text-blue-600 mb-4">Modo Emoji</h2>
        <p className="text-gray-600 mb-6">
          ¡Haz clic en los emojis sonrientes lo más rápido que puedas! 
          Ten cuidado de no hacer clic en los que no sonríen.
        </p>
        <motion.button
          className="btn-primary"
          onClick={startGame}
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
        >
          Iniciar Juego
        </motion.button>
      </motion.div>
    );
  }

  return (
    <div 
      ref={containerRef}
      className="relative w-full h-[80vh] bg-gradient-to-br from-pink-50 to-blue-50 rounded-3xl overflow-hidden"
    >
      <div className="absolute top-4 left-4 text-2xl font-bold text-blue-600">
        Puntuación: {score}
      </div>
      <AnimatePresence>
        {emojis.map(({ id, emoji, position, isSmiling }) => (
          <Emoji
            key={id}
            emoji={emoji}
            position={position}
            isSmiling={isSmiling}
            onClick={() => handleEmojiClick(isSmiling, id)}
          />
        ))}
      </AnimatePresence>
    </div>
  );
} 