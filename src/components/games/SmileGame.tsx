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
  const [isFaceDetected, setIsFaceDetected] = useState(false);
  const [isSmiling, setIsSmiling] = useState(false);
  const [highScore, setHighScore] = useState(() => {
    if (typeof window !== 'undefined') {
      return parseInt(localStorage.getItem('smileGameHighScore') || '0');
    }
    return 0;
  });
  const animationFrameRef = useRef<number>();
  const smileStartTimeRef = useRef<number | null>(null);

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
    if (!detector || !webcamRef.current) {
      return;
    }

    const video = webcamRef.current.video;
    if (!video || video.readyState !== 4) {
      return;
    }

    try {
      const faces = await detector.estimateFaces(video);
      const faceDetected = faces.length > 0;
      setIsFaceDetected(faceDetected);
      
      if (faceDetected) {
        const landmarks = faces[0].keypoints.map(point => [point.x, point.y]);
        const score = calculateSmileScore(landmarks);
        const isSmileDetected = score > 20;
        setIsSmiling(isSmileDetected);
        
        // Lógica para el score de sonrisa ininterrumpida
        if (isPlaying) {
          const now = Date.now();
          
          if (isSmileDetected) {
            // Si es la primera vez que detectamos la sonrisa, guardamos el tiempo
            if (smileStartTimeRef.current === null) {
              smileStartTimeRef.current = now;
            }
            
            // Si han pasado más de 1 segundo desde que empezó la sonrisa
            if (now - smileStartTimeRef.current >= 1000) {
              setSmileScore(prevScore => {
                const newScore = prevScore + 1;
                console.log('Incrementando score:', { prevScore, newScore });
                return newScore;
              });
              // Reiniciamos el tiempo para el siguiente punto
              smileStartTimeRef.current = now;
            }
          } else {
            // Si se interrumpe la sonrisa, reiniciamos el contador
            smileStartTimeRef.current = null;
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

        // Verificar si el juego debe terminar
        if (isPlaying && !isSmileDetected) {
          setGameOver(true);
          setIsPlaying(false);
          if (smileScore > highScore) {
            setHighScore(smileScore);
            localStorage.setItem('smileGameHighScore', smileScore.toString());
          }
          return;
        }
      } else if (isPlaying) {
        setGameOver(true);
        setIsPlaying(false);
        if (smileScore > highScore) {
          setHighScore(smileScore);
          localStorage.setItem('smileGameHighScore', smileScore.toString());
        }
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
      smileStartTimeRef.current = null; // Reiniciamos el contador de sonrisa al iniciar
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
            </>
          )}
          <div className="absolute top-4 left-1/2 transform -translate-x-1/2 bg-black bg-opacity-50 text-white px-4 py-2 rounded">
            Sonrisa detectada: {isSmiling ? 'Sí' : 'No'}
          </div>
        </div>

        {!isPlaying && (
          <div className="text-center">
            <button
              onClick={() => {
                setIsPlaying(true);
                setGameOver(false);
                setSmileScore(0);
                setTimeLeft(10);
              }}
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