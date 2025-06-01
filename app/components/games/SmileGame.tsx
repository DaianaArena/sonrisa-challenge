'use client'

import { useState, useEffect, useRef } from 'react'
import { motion } from 'framer-motion'
import Webcam from 'react-webcam'
import * as faceapi from 'face-api.js'
import GameResult from '../GameResult'

interface SmileGameProps {
  onBack: () => void
}

export default function SmileGame({ onBack }: SmileGameProps) {
  const webcamRef = useRef<Webcam>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [gameStarted, setGameStarted] = useState(false)
  const [score, setScore] = useState(0)
  const [gameOver, setGameOver] = useState(false)
  const [isCameraReady, setIsCameraReady] = useState(false)
  const [highScore, setHighScore] = useState(() => {
    if (typeof window !== 'undefined') {
      return parseInt(localStorage.getItem('smileGameHighScore') || '0')
    }
    return 0
  })

  // Load face-api models
  useEffect(() => {
    const loadModels = async () => {
      try {
        await Promise.all([
          faceapi.nets.tinyFaceDetector.loadFromUri('/models'),
          faceapi.nets.faceExpressionNet.loadFromUri('/models')
        ])
        setIsLoading(false)
      } catch (error) {
        console.error('Error loading models:', error)
      }
    }
    loadModels()

    // Cleanup function
    return () => {
      if (webcamRef.current?.video) {
        const stream = webcamRef.current.video.srcObject as MediaStream
        if (stream) {
          stream.getTracks().forEach(track => track.stop())
        }
      }
    }
  }, [])

  // Handle camera setup
  const handleUserMedia = () => {
    setIsCameraReady(true)
  }

  // Game logic
  useEffect(() => {
    if (!gameStarted || !webcamRef.current || !isCameraReady || gameOver) return

    let frameId: number | null = null
    let notSmilingCount = 0
    const MAX_NOT_SMILING = 30 // About 1 second of not smiling (assuming 30fps)

    const detectSmile = async () => {
      if (!webcamRef.current?.video) return

      try {
        const detections = await faceapi
          .detectSingleFace(webcamRef.current.video, new faceapi.TinyFaceDetectorOptions())
          .withFaceExpressions()

        if (detections) {
          const isSmiling = detections.expressions.happy > 0.7
          
          if (isSmiling) {
            notSmilingCount = 0
            setScore(prev => prev + 1)
          } else {
            notSmilingCount++
            if (notSmilingCount >= MAX_NOT_SMILING) {
              handleGameOver()
              return
            }
          }
        }

        frameId = requestAnimationFrame(detectSmile)
      } catch (error) {
        console.error('Error detecting smile:', error)
        frameId = requestAnimationFrame(detectSmile)
      }
    }

    detectSmile()

    return () => {
      if (frameId) cancelAnimationFrame(frameId)
    }
  }, [gameStarted, gameOver, isCameraReady])

  const handleGameOver = () => {
    setGameOver(true)
    if (score > highScore) {
      setHighScore(score)
      localStorage.setItem('smileGameHighScore', score.toString())
    }
  }

  const startGame = () => {
    setGameStarted(true)
    setScore(0)
    setGameOver(false)
  }

  if (isLoading) {
    return (
      <div className="card max-w-md mx-auto text-center">
        <p className="text-xl text-blue-600">Loading face detection models...</p>
      </div>
    )
  }

  if (gameOver) {
    return <GameResult score={score} highScore={highScore} onRestart={startGame} onBack={onBack} />
  }

  if (!gameStarted) {
    return (
      <motion.div
        className="card max-w-md mx-auto text-center"
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
      >
        <h2 className="text-2xl font-bold text-blue-600 mb-4">Smile Detection Mode</h2>
        <p className="text-gray-600 mb-6">
          Keep smiling to score points! 
          The game will end if you stop smiling for too long.
        </p>
        <motion.button
          className="btn-primary"
          onClick={startGame}
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
        >
          Start Game
        </motion.button>
      </motion.div>
    )
  }

  return (
    <div className="relative w-full max-w-2xl mx-auto">
      <div className="absolute top-4 left-4 z-10 text-2xl font-bold text-white drop-shadow-lg">
        Score: {score}
      </div>
      <Webcam
        ref={webcamRef}
        mirrored
        className="rounded-3xl w-full"
        screenshotFormat="image/jpeg"
        onUserMedia={handleUserMedia}
        videoConstraints={{
          facingMode: "user",
          width: 640,
          height: 480
        }}
      />
    </div>
  )
} 