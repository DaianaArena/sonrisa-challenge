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
  const [detectionScore, setDetectionScore] = useState(0);
  const [timeLeft, setTimeLeft] = useState(10);
  const [isPlaying, setIsPlaying] = useState(false);
  const [gameOver, setGameOver] = useState(false);
  const [isFaceDetected, setIsFaceDetected] = useState(false);
  const [isSmiling, setIsSmiling] = useState(false);
  const [highScore, setHighScore] = useState(() => {
    if (typeof window !== 'undefined') {
      return parseInt(localStorage.getItem('smileGameHighScore') || '0');
    }
    return 0;
  });
  const animationFrameRef = useRef<number>();
  const lastScoreUpdateRef = useRef<number>(0);
  const timerRef = useRef<NodeJS.Timeout>();

  // Agregar efecto para debug del score
  useEffect(() => {
    console.log('Estado smileScore actualizado:', smileScore);
    console.log('Estado detectionScore actualizado:', detectionScore);
  }, [smileScore, detectionScore]);

  // Cargar el modelo de detección de landmarks
  useEffect(() => {
    const loadModel = async () => {
      try {
        console.log('Cargando modelo de detección facial...');
        const model = faceLandmarksDetection.SupportedModels.MediaPipeFaceMesh;
        const detectorConfig: faceLandmarksDetection.MediaPipeFaceMeshTfjsModelConfig = {
          runtime: 'tfjs',
          refineLandmarks: true,
          maxFaces: 1
        };
        const detector = await faceLandmarksDetection.createDetector(model, detectorConfig);
        console.log('Modelo cargado exitosamente');
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
    // Puntos para el ancho de la boca (esquinas)
    const leftMouth = landmarks[61];
    const rightMouth = landmarks[291];

    // Puntos para la altura de la boca (centro superior e inferior)
    const topLip = landmarks[0];    // Centro del labio superior
    const bottomLip = landmarks[17]; // Centro del labio inferior

    const mouthWidth = Math.sqrt(
      Math.pow(rightMouth[0] - leftMouth[0], 2) +
      Math.pow(rightMouth[1] - leftMouth[1], 2)
    );

    const mouthHeight = Math.sqrt(
      Math.pow(bottomLip[0] - topLip[0], 2) +
      Math.pow(bottomLip[1] - topLip[1], 2)
    );

    // Si la altura de la boca es muy pequeña, retornamos 0
    if (mouthHeight < 20) {
      return 0;
    }

    const smileRatio = mouthWidth / mouthHeight;
    console.log('Métricas de sonrisa:', {
      mouthWidth: Math.round(mouthWidth),
      mouthHeight: Math.round(mouthHeight),
      smileRatio: smileRatio.toFixed(2),
      normalizedScore: Math.round(Math.min(Math.max((smileRatio - 1.5) * 100, 0), 100))
    });
    
    // Ajustamos los valores para que sean más sensibles a los cambios en el ratio
    const normalizedScore = Math.min(Math.max((smileRatio - 1.5) * 100, 0), 100);
    return normalizedScore;
  };

  // Iniciar la detección cuando el componente se monte
  useEffect(() => {
    console.log('Estado inicial:', {
      isModelLoading,
      detectorExists: !!detector,
      webcamRefExists: !!webcamRef.current,
      videoReady: webcamRef.current?.video?.readyState === 4
    });

    const startDetection = () => {
      if (!isModelLoading && detector && webcamRef.current?.video) {
        const video = webcamRef.current.video;
        if (video.readyState === 4) {
          console.log('Video listo, iniciando detección facial...');
          detectSmile();
        } else {
          console.log('Esperando a que el video esté listo...', {
            readyState: video.readyState
          });
          video.addEventListener('loadeddata', () => {
            console.log('Video cargado, iniciando detección...');
            detectSmile();
          });
        }
      } else {
        console.log('No se puede iniciar la detección:', {
          isModelLoading,
          detectorExists: !!detector,
          webcamRefExists: !!webcamRef.current,
          videoReady: webcamRef.current?.video?.readyState === 4
        });
      }
    };

    startDetection();
    
    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
      if (webcamRef.current?.video) {
        webcamRef.current.video.removeEventListener('loadeddata', detectSmile);
      }
    };
  }, [isModelLoading, detector]);

  // Función para detectar la sonrisa en cada frame
  const detectSmile = async () => {
    console.log('Ejecutando detectSmile...');
    if (!detector || !webcamRef.current) {
      console.log('No se puede detectar: detector o webcam no disponibles');
      return;
    }

    const video = webcamRef.current.video;
    if (!video || video.readyState !== 4) {
      console.log('Video no está listo:', video?.readyState);
      return;
    }

    try {
      console.log('Intentando detectar caras...');
      const faces = await detector.estimateFaces(video);
      console.log('Caras detectadas:', faces.length);
      
      const faceDetected = faces.length > 0;
      setIsFaceDetected(faceDetected);
      
      if (faceDetected) {
        console.log('Procesando landmarks de la cara...');
        const landmarks = faces[0].keypoints.map(point => [point.x, point.y]);
        const smileDetectionScore = calculateSmileScore(landmarks);
        console.log('Score de detección de sonrisa:', smileDetectionScore);
        const isSmileDetected = smileDetectionScore >= 50;
        console.log('¿Sonrisa detectada?:', isSmileDetected, 'Score:', smileDetectionScore);
        setIsSmiling(isSmileDetected);
        
        // Solo actualizamos el score si el juego está activo
        if (isPlaying) {
          const newScore = Math.round(smileDetectionScore);
          console.log('Intentando actualizar smileScore a:', newScore);
          setDetectionScore(newScore);
          setSmileScore(newScore);
        } else {
          // Si no estamos jugando, solo mostramos el score de detección
          setDetectionScore(Math.round(smileDetectionScore));
        }
        
        // Lógica para el score de sonrisa
        if (isPlaying) {
          const now = Date.now();
          
          if (isSmileDetected) {
            // Si han pasado 10ms desde la última actualización
            if (now - lastScoreUpdateRef.current >= 10) {
              console.log('Incrementando score - Sonrisa detectada >= 50');
              lastScoreUpdateRef.current = now;
            }
          }
        }

        // Dibujar los puntos
        const canvas = canvasRef.current;
        if (canvas) {
          const ctx = canvas.getContext('2d');
          if (ctx) {
            ctx.clearRect(0, 0, canvas.width, canvas.height);

            // Dibujar todos los puntos de la cara en azul claro
            faces[0].keypoints.forEach(point => {
              ctx.beginPath();
              ctx.arc(point.x, point.y, 3, 0, 2 * Math.PI);
              ctx.fillStyle = 'rgba(0, 150, 255, 0.8)';
              ctx.fill();
            });

            // Dibujar los puntos específicos que usamos para la sonrisa en rojo/verde
            const importantPoints = [61, 291, 0, 17];
            importantPoints.forEach(index => {
              const point = faces[0].keypoints[index];
              ctx.beginPath();
              ctx.arc(point.x, point.y, 6, 0, 2 * Math.PI);
              ctx.fillStyle = isSmileDetected ? 'rgba(0, 255, 0, 0.8)' : 'rgba(255, 0, 0, 0.8)';
              ctx.fill();
            });

            // Dibujar líneas entre los puntos de la sonrisa
            ctx.beginPath();
            ctx.moveTo(faces[0].keypoints[61].x, faces[0].keypoints[61].y);
            ctx.lineTo(faces[0].keypoints[291].x, faces[0].keypoints[291].y);
            ctx.strokeStyle = isSmileDetected ? 'rgba(0, 255, 0, 0.8)' : 'rgba(255, 0, 0, 0.8)';
            ctx.stroke();

            // Dibujar línea vertical para la altura
            ctx.beginPath();
            ctx.moveTo(faces[0].keypoints[0].x, faces[0].keypoints[0].y);
            ctx.lineTo(faces[0].keypoints[17].x, faces[0].keypoints[17].y);
            ctx.strokeStyle = isSmileDetected ? 'rgba(0, 255, 0, 0.8)' : 'rgba(255, 0, 0, 0.8)';
            ctx.stroke();
          }
        }
      } else {
        console.log('No se detectó ninguna cara');
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
    if (isPlaying && !gameOver) {
      console.log('Iniciando juego, reiniciando contadores');
      lastScoreUpdateRef.current = Date.now();
      setSmileScore(0);
      setDetectionScore(0);

      // Limpiamos cualquier timer existente
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }

      // Iniciamos el nuevo timer
      timerRef.current = setInterval(() => {
        // Solo decrementamos el tiempo si se detecta una sonrisa
        if (isSmiling) {
          setTimeLeft(prev => {
            console.log('Tiempo restante:', prev - 1);
            if (prev <= 1) {
              console.log('Tiempo terminado, finalizando juego');
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
        }
      }, 1000);
    }

    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
    };
  }, [isPlaying, gameOver, smileScore, highScore, isSmiling]);

  const startGame = () => {
    console.log('Iniciando nuevo juego');
    setIsPlaying(true);
    setGameOver(false);
    setSmileScore(0);
    setDetectionScore(0);
    setTimeLeft(10);
    lastScoreUpdateRef.current = Date.now();
  };

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
    return <GameResult score={Math.round(smileScore)} highScore={highScore} onRestart={() => {
      setIsPlaying(true);
      setGameOver(false);
      setSmileScore(0);
      setTimeLeft(10);
    }} onBack={onBack} />;
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
              zIndex: 10,
              border: '2px solid rgba(255, 0, 0, 0.5)'
            }}
            width={640}
            height={480}
          />
          <div className="absolute top-4 right-4 bg-black bg-opacity-50 text-white px-4 py-2 rounded">
            Score: {detectionScore}
          </div>
          {isPlaying && (
            <>
              <div className="absolute top-4 left-4 bg-black bg-opacity-50 text-white px-4 py-2 rounded">
                Tiempo: {timeLeft}s
              </div>
              <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 bg-black bg-opacity-50 text-white px-4 py-2 rounded">
                {detectionScore < 10 ? '¡Sonríe más!' : '¡Bien! Mantén la sonrisa'}
              </div>
            </>
          )}
          <div className="absolute top-4 left-1/2 transform -translate-x-1/2 bg-black bg-opacity-50 text-white px-4 py-2 rounded">
            Sonrisa detectada: {isSmiling ? 'Sí' : 'No'}
          </div>
        </div>

        {!isPlaying && (
          <div className="text-center">
            <button
              onClick={startGame}
              disabled={!isFaceDetected}
              className={`px-6 py-2 rounded-lg mb-4 ${
                isFaceDetected 
                  ? 'bg-blue-500 hover:bg-blue-600 text-white' 
                  : 'bg-gray-400 text-gray-200 cursor-not-allowed'
              }`}
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