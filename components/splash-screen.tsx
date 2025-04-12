"use client"

import { useEffect, useState } from "react"

interface SplashScreenProps {
  duration?: number
  onComplete: () => void
}

export function SplashScreen({ duration = 3000, onComplete }: SplashScreenProps) {
  const [progress, setProgress] = useState(0)

  useEffect(() => {
    const interval = setInterval(() => {
      setProgress((prev) => {
        const newProgress = prev + 1
        if (newProgress >= 100) {
          clearInterval(interval)
          setTimeout(onComplete, 200) // Small delay after progress completes
          return 100
        }
        return newProgress
      })
    }, duration / 100)

    return () => clearInterval(interval)
  }, [duration, onComplete])

  return (
    <div className="fixed inset-0 flex flex-col items-center justify-center bg-black z-50">
      <div className="text-center">
        <h1 className="text-5xl font-bold text-red-600 mb-8">Solidarity with Gaza</h1>
        <div className="w-64 h-2 bg-gray-800 rounded-full overflow-hidden">
          <div
            className="h-full bg-red-600 transition-all duration-300 ease-out"
            style={{ width: `${progress}%` }}
          ></div>
        </div>
        <p className="text-red-400 mt-4">Loading game...</p>
      </div>
    </div>
  )
}
