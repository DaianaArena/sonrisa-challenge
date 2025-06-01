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
  const canvasRef = useRef<HTMLCanvasElement>(null);
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
    // Aumentamos la sensibilidad ajustando los valores
    const normalizedScore = Math.min(Math.max((smileRatio - 1.1) * 200, 0), 100);
    return normalizedScore;
  };

  // Función para detectar la sonrisa en cada frame
  const detectSmile = async () => {
    if (!detector || !webcamRef.current) {
      console.log('Condiciones iniciales:', {
        detector: !!detector,
        webcamRef: !!webcamRef.current
      });
      return;
    }

    const video = webcamRef.current.video;
    if (!video) {
      console.log('No hay video disponible');
      return;
    }

    try {
      console.log('Intentando detectar caras...');
      const faces = await detector.estimateFaces(video);
      console.log('Faces detectadas:', faces.length);
      
      if (faces.length > 0) {
        console.log('Cara detectada, procesando landmarks...');
        const landmarks = faces[0].keypoints.map(point => [point.x, point.y]);
        console.log('Número de landmarks:', landmarks.length);
        
        const score = calculateSmileScore(landmarks);
        console.log('Score calculado:', score);
        setSmileScore(score);

        // Dibujar todos los puntos de la cara para debug
        const canvas = canvasRef.current;
        if (canvas) {
          const ctx = canvas.getContext('2d');
          if (ctx) {
            console.log('Dibujando en el canvas...');
            // Limpiar el canvas primero
            ctx.clearRect(0, 0, canvas.width, canvas.height);

            // Dibujar todos los puntos de la cara en azul claro
            faces[0].keypoints.forEach((point, index) => {
              ctx.beginPath();
              ctx.arc(point.x, point.y, 3, 0, 2 * Math.PI);
              ctx.fillStyle = 'rgba(0, 150, 255, 0.8)';
              ctx.fill();
            });

            // Dibujar los puntos específicos que usamos para la sonrisa en rojo
            const importantPoints = [61, 291, 13, 14];
            importantPoints.forEach(index => {
              const point = faces[0].keypoints[index];
              ctx.beginPath();
              ctx.arc(point.x, point.y, 6, 0, 2 * Math.PI);
              ctx.fillStyle = 'rgba(255, 0, 0, 0.8)';
              ctx.fill();
            });

            console.log('Puntos dibujados');
          } else {
            console.log('No se pudo obtener el contexto del canvas');
          }
        } else {
          console.log('No se encontró el elemento canvas');
        }

        // Solo verificar el score si el juego está activo
        if (isPlaying && score < 10) {
          console.log('Score muy bajo, terminando juego');
          setGameOver(true);
          setIsPlaying(false);
          if (smileScore > highScore) {
            setHighScore(smileScore);
            localStorage.setItem('smileGameHighScore', smileScore.toString());
          }
          return;
        }
      } else {
        console.log('No se detectó ninguna cara');
        // Solo mostrar mensaje de error si el juego está activo
        if (isPlaying) {
          const canvas = canvasRef.current;
          if (canvas) {
            const ctx = canvas.getContext('2d');
            if (ctx) {
              ctx.clearRect(0, 0, canvas.width, canvas.height);
              ctx.font = 'bold 24px Arial';
              ctx.fillStyle = 'red';
              ctx.textAlign = 'center';
              ctx.fillText('No se detecta cara', canvas.width / 2, canvas.height / 2);
            }
          }
          setGameOver(true);
          setIsPlaying(false);
          if (smileScore > highScore) {
            setHighScore(smileScore);
            localStorage.setItem('smileGameHighScore', smileScore.toString());
          }
        }
        return;
      }
    } catch (error) {
      console.error('Error detecting smile:', error);
      // Solo mostrar error si el juego está activo
      if (isPlaying) {
        const canvas = canvasRef.current;
        if (canvas) {
          const ctx = canvas.getContext('2d');
          if (ctx) {
            ctx.clearRect(0, 0, canvas.width, canvas.height);
            ctx.font = 'bold 24px Arial';
            ctx.fillStyle = 'red';
            ctx.textAlign = 'center';
            ctx.fillText('Error en la detección', canvas.width / 2, canvas.height / 2);
          }
        }
      }
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

  // Iniciar la detección cuando el componente se monte
  useEffect(() => {
    console.log('Componente montado, iniciando detección...');
    detectSmile();
    
    return () => {
      if (animationFrameRef.current) {
        console.log('Limpiando animation frame');
        cancelAnimationFrame(animationFrameRef.current);
      }
    };
  }, []);

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
    return <GameResult score={Math.round(smileScore)} highScore={highScore} onRestart={detectSmile} onBack={onBack} />;
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
          <canvas
            ref={canvasRef}
            className="absolute top-0 left-0 rounded-lg"
            style={{
              width: '640px',
              height: '480px',
              pointerEvents: 'none',
              border: '5px solid red',
              zIndex: 10
            }}
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
                {smileScore < 10 ? '¡Sonríe más!' : '¡Bien! Mantén la sonrisa'}
              </div>
              <div className="absolute top-4 left-1/2 transform -translate-x-1/2 bg-black bg-opacity-50 text-white px-4 py-2 rounded">
                Puntos detectados: {detector ? 'Sí' : 'No'}
              </div>
            </>
          )}
        </div>

        {!isPlaying && (
          <div className="text-center">
            <button
              onClick={detectSmile}
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