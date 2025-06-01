import React, { useRef, useEffect, useState } from 'react';
import Webcam from 'react-webcam';
import * as faceLandmarksDetection from '@tensorflow-models/face-landmarks-detection';
import '@tensorflow/tfjs-core';
import '@tensorflow/tfjs-backend-webgl';
import GameResult from '../GameResult';
import GameLayout from '../GameLayout';

interface SmileGameProps {
  onBack: () => void;
}

const SmileGame: React.FC<SmileGameProps> = ({ onBack }) => {
  const webcamRef = useRef<Webcam>(null);
  const [isModelLoading, setIsModelLoading] = useState(true);
  const [detector, setDetector] = useState<faceLandmarksDetection.FaceLandmarksDetector | null>(null);
  const [smileScore, setSmileScore] = useState(0);
  const [timeLeft, setTimeLeft] = useState(10);
  const [isPlaying, setIsPlaying] = useState(false);
  const [gameOver, setGameOver] = useState(false);
  const [highScore, setHighScore] = useState(() => {
    if (typeof window !== 'undefined') {
      return parseInt(localStorage.getItem('smileGameHighScore') || '0');
    }
    return 0;
  });
  const startTimeRef = useRef<number>(0);
  const animationFrameRef = useRef<number>();

  // Cargar el modelo de detección de landmarks
  useEffect(() => {
    const loadModel = async () => {
      try {
        const model = faceLandmarksDetection.SupportedModels.MediaPipeFaceMesh;
        const detectorConfig: faceLandmarksDetection.MediaPipeFaceMeshTfjsModelConfig = {
          runtime: 'tfjs',
          refineLandmarks: true,
          maxFaces: 1
        };
        const detector = await faceLandmarksDetection.createDetector(model, detectorConfig);
        setDetector(detector);
        setIsModelLoading(false);
      } catch (error) {
        console.error('Error loading model:', error);
        setIsModelLoading(false);
      }
    };

    loadModel();
  }, []);

  // Función para calcular el score de sonrisa basado en los landmarks
  const calculateSmileScore = (landmarks: number[][]) => {
    // Índices de los landmarks para la boca
    const leftMouth = landmarks[61];  // Esquina izquierda de la boca
    const rightMouth = landmarks[291]; // Esquina derecha de la boca
    const topLip = landmarks[13];     // Labio superior
    const bottomLip = landmarks[14];  // Labio inferior

    // Calcular la distancia entre las esquinas de la boca
    const mouthWidth = Math.sqrt(
      Math.pow(rightMouth[0] - leftMouth[0], 2) +
      Math.pow(rightMouth[1] - leftMouth[1], 2)
    );

    // Calcular la distancia entre los labios
    const mouthHeight = Math.sqrt(
      Math.pow(bottomLip[0] - topLip[0], 2) +
      Math.pow(bottomLip[1] - topLip[1], 2)
    );

    // Calcular el ratio de sonrisa (width/height)
    const smileRatio = mouthWidth / mouthHeight;

    // Normalizar el score entre 0 y 100
    // Ajustamos los valores para hacer más sensible la detección
    const normalizedScore = Math.min(Math.max((smileRatio - 1.2) * 150, 0), 100);
    return normalizedScore;
  };

  // Función para detectar la sonrisa en cada frame
  const detectSmile = async () => {
    if (!detector || !webcamRef.current || !isPlaying) return;

    const video = webcamRef.current.video;
    if (!video) return;

    try {
      const faces = await detector.estimateFaces(video);
      
      if (faces.length > 0) {
        const landmarks = faces[0].keypoints.map(point => [point.x, point.y]);
        const score = calculateSmileScore(landmarks);
        setSmileScore(score);

        // Si el score es muy bajo (no hay sonrisa), terminar el juego
        if (score < 15) { // Reducimos el umbral para hacer más sensible la detección
          setGameOver(true);
          setIsPlaying(false);
          if (smileScore > highScore) {
            setHighScore(smileScore);
            localStorage.setItem('smileGameHighScore', smileScore.toString());
          }
          return;
        }
      } else {
        // Si no se detecta cara, terminar el juego
        setGameOver(true);
        setIsPlaying(false);
        if (smileScore > highScore) {
          setHighScore(smileScore);
          localStorage.setItem('smileGameHighScore', smileScore.toString());
        }
        return;
      }
    } catch (error) {
      console.error('Error detecting smile:', error);
    }

    // Solicitar el siguiente frame
    if (animationFrameRef.current) {
      cancelAnimationFrame(animationFrameRef.current);
    }
    animationFrameRef.current = requestAnimationFrame(detectSmile);
  };

  // Efecto para manejar el temporizador
  useEffect(() => {
    let timer: NodeJS.Timeout;
    
    if (isPlaying && !gameOver) {
      timer = setInterval(() => {
        setTimeLeft(prev => {
          if (prev <= 1) {
            setGameOver(true);
            setIsPlaying(false);
            if (smileScore > highScore) {
              setHighScore(smileScore);
              localStorage.setItem('smileGameHighScore', smileScore.toString());
            }
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }

    return () => {
      if (timer) {
        clearInterval(timer);
      }
    };
  }, [isPlaying, gameOver, smileScore, highScore]);

  // Iniciar el juego
  const startGame = () => {
    setIsPlaying(true);
    setGameOver(false);
    setSmileScore(0);
    setTimeLeft(10);
    startTimeRef.current = Date.now();
    
    // Cancelar cualquier frame anterior antes de iniciar
    if (animationFrameRef.current) {
      cancelAnimationFrame(animationFrameRef.current);
    }
    animationFrameRef.current = requestAnimationFrame(detectSmile);
  };

  // Limpiar el animation frame cuando el componente se desmonte o cuando el juego termine
  useEffect(() => {
    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    };
  }, [gameOver]); // Agregamos gameOver como dependencia para limpiar cuando el juego termine

  if (isModelLoading) {
    return (
      <GameLayout onBack={onBack}>
        <div className="flex items-center justify-center h-full">
          <div className="text-xl">Cargando modelo...</div>
        </div>
      </GameLayout>
    );
  }

  if (gameOver) {
    return <GameResult score={Math.round(smileScore)} highScore={highScore} onRestart={startGame} onBack={onBack} />;
  }

  return (
    <GameLayout onBack={onBack}>
      <div className="flex flex-col items-center justify-center w-full h-full gap-4">
        <div className="relative">
          <Webcam
            ref={webcamRef}
            audio={false}
            className="rounded-lg max-h-[calc(100vh-12rem)]"
            width={640}
            height={480}
          />
          {isPlaying && (
            <>
              <div className="absolute top-4 left-4 bg-black bg-opacity-50 text-white px-4 py-2 rounded">
                Tiempo: {timeLeft}s
              </div>
              <div className="absolute top-4 right-4 bg-black bg-opacity-50 text-white px-4 py-2 rounded">
                Score: {Math.round(smileScore)}
              </div>
              <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 bg-black bg-opacity-50 text-white px-4 py-2 rounded">
                {smileScore < 15 ? '¡Sonríe más!' : '¡Bien! Mantén la sonrisa'}
              </div>
            </>
          )}
        </div>

        {!isPlaying && (
          <div className="text-center">
            <button
              onClick={startGame}
              className="bg-blue-500 hover:bg-blue-600 text-white px-6 py-2 rounded-lg mb-4"
            >
              {timeLeft === 10 ? 'Iniciar Juego' : 'Reintentar'}
            </button>
            <p className="text-gray-600">
              Mantén una sonrisa durante 10 segundos.<br />
              El juego termina si dejas de sonreír o si no se detecta tu cara.
            </p>
          </div>
        )}
      </div>
    </GameLayout>
  );
};

export default SmileGame; 