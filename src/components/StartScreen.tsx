import { useState } from 'react';
import { motion } from 'framer-motion';
import EmojiGame from './games/EmojiGame';
import SmileGame from './games/SmileGame';

type GameMode = 'none' | 'emoji' | 'smile';

export default function StartScreen() {
  const [gameMode, setGameMode] = useState<GameMode>('none');

  if (gameMode === 'emoji') return <EmojiGame onBack={() => setGameMode('none')} />;
  if (gameMode === 'smile') return <SmileGame onBack={() => setGameMode('none')} />;

  return (
    <motion.div
      className="card max-w-2xl mx-auto text-center"
      initial={{ scale: 0.9, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      transition={{ duration: 0.3 }}
    >
      <h1 className="text-4xl font-bold text-blue-600 mb-6">Sonrisa Challenge</h1>
      
      <p className="text-lg text-gray-600 mb-8">
        ¡Demuestra tu mejor sonrisa y diviértete con nuestros juegos!
      </p>

      <div className="space-y-4">
        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          className="btn-primary w-full max-w-sm"
          onClick={() => setGameMode('emoji')}
        >
          🎮 Modo Emoji
          <p className="text-sm opacity-80">Haz clic en los emojis sonrientes</p>
        </motion.button>

        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          className="btn-secondary w-full max-w-sm"
          onClick={() => setGameMode('smile')}
        >
          📸 Modo Sonrisa
          <p className="text-sm opacity-80">Sonríe frente a la cámara</p>
        </motion.button>
      </div>

      <div className="mt-8 text-sm text-gray-500">
        <p>¡Compite por la mejor puntuación!</p>
        {/*
        <p>
          Visita{' '}
          <a 
            href="https://expedicionsonrisa.com/apadrinar/" 
            target="_blank" 
            rel="noopener noreferrer" 
            className="text-blue-500 hover:underline"
          >
            Expedición Sonrisa
          </a>
        </p>
        */}
        
      </div>
    </motion.div>
  );
} 