import { useState, useEffect, useCallback, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import GameResult from '../GameResult';

// Game configuration
const GAME_DURATION = 60; // seconds
const INITIAL_SPAWN_INTERVAL = 1000; // milliseconds
const MIN_SPAWN_INTERVAL = 300; // milliseconds
const MAX_EMOJIS = 5;
const MAX_MISSED_SMILES = 3;

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
  const [missedSmiles, setMissedSmiles] = useState(0);
  const [spawnInterval, setSpawnInterval] = useState(INITIAL_SPAWN_INTERVAL);
  const [gameTime, setGameTime] = useState(0);
  const containerRef = useRef<HTMLDivElement>(null);

  // Load high score from localStorage
  const [highScore, setHighScore] = useState(() => {
    if (typeof window !== 'undefined') {
      return parseInt(localStorage.getItem('emojiGameHighScore') || '0');
    }
    return 0;
  });

  const handleGameOver = useCallback((reason: 'time' | 'missed' | 'wrong') => {
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
      handleGameOver('wrong');
    }
  };

  const startGame = () => {
    setGameStarted(true);
    setScore(0);
    setGameOver(false);
    setEmojis([]);
    setMissedSmiles(0);
    setSpawnInterval(INITIAL_SPAWN_INTERVAL);
    setGameTime(0);
  };

  // Timer effect
  useEffect(() => {
    if (!gameStarted || gameOver) return;

    const timer = setInterval(() => {
      setGameTime(prev => {
        const newTime = prev + 1;
        // Increase spawn rate every 10 seconds
        if (newTime % 10 === 0) {
          setSpawnInterval(prev => Math.max(MIN_SPAWN_INTERVAL, prev - 100));
        }
        return newTime;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [gameStarted, gameOver]);

  // Spawn emojis effect
  useEffect(() => {
    if (!gameStarted || gameOver || !containerRef.current) return;

    const spawnEmoji = () => {
      if (emojis.length >= MAX_EMOJIS) return;

      const container = containerRef.current;
      if (!container) return;

      const containerRect = container.getBoundingClientRect();
      const emojiSize = 48;
      const padding = 20;

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
        setEmojis(prev => {
          const emojiToRemove = prev.find(e => e.id === emoji.id);
          if (emojiToRemove?.isSmiling) {
            setMissedSmiles(prev => {
              const newMissed = prev + 1;
              if (newMissed >= MAX_MISSED_SMILES) {
                handleGameOver('missed');
              }
              return newMissed;
            });
          }
          return prev.filter(e => e.id !== emoji.id);
        });
      }, 1000 + Math.random() * 2000);
    };

    const spawnTimer = setInterval(spawnEmoji, spawnInterval);
    const gameTimer = setTimeout(() => handleGameOver('time'), GAME_DURATION * 1000);

    return () => {
      clearInterval(spawnTimer);
      clearTimeout(gameTimer);
    };
  }, [gameStarted, gameOver, emojis.length, handleGameOver, spawnInterval]);

  if (gameOver) {
    return <GameResult 
      score={score} 
      highScore={highScore} 
      onRestart={startGame} 
      onBack={onBack}
      gameMode="emoji"
    />;
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
          Si dejas pasar 3 emojis sonrientes, ¡pierdes!
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

  const currentSmilingEmojis = emojis.filter(e => e.isSmiling).length;

  return (
    <div 
      ref={containerRef}
      className="relative w-full h-[80vh] bg-gradient-to-br from-pink-50 to-blue-50 rounded-3xl overflow-hidden"
    >
      <div className="absolute top-4 left-4 text-2xl font-bold text-blue-600">
        Puntuación: {score}
      </div>
      <div className="absolute top-4 right-4 text-xl text-blue-600">
        Tiempo: {GAME_DURATION - gameTime}s
      </div>
      <div className="absolute top-16 left-4 text-lg text-blue-600">
        Emojis sonrientes: {currentSmilingEmojis}
      </div>
      <div className="absolute top-16 right-4 text-lg text-red-500">
        Emojis perdidos: {missedSmiles}/{MAX_MISSED_SMILES}
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