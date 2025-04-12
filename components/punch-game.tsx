"use client"

import { useState, useEffect, useRef } from "react"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { useToast } from "@/hooks/use-toast"
import { Volume2, VolumeX } from "lucide-react"
import confetti from "canvas-confetti"

type AttackType = "punch" | "sandal" | null

// Define audio interface
interface AudioFiles {
  punch: HTMLAudioElement | null
  sandal: HTMLAudioElement | null
  gameStart: HTMLAudioElement | null
  gameOver: HTMLAudioElement | null
  milestone: HTMLAudioElement | null
  countdown: HTMLAudioElement | null
  background: HTMLAudioElement | null
  splash: HTMLAudioElement | null
}

// Initialize with null values to prevent SSR errors
const AUDIO: AudioFiles = {
  punch: null,
  sandal: null,
  gameStart: null,
  gameOver: null,
  milestone: null,
  countdown: null,
  background: null,
  splash: null,
}

export default function PunchGame() {
  const [showSplash, setShowSplash] = useState(true)
  const [score, setScore] = useState(0)
  const [isAnimating, setIsAnimating] = useState(false)
  const [position, setPosition] = useState({ x: 50, y: 50 })
  const [gameStarted, setGameStarted] = useState(false)
  const [timeLeft, setTimeLeft] = useState(30)
  const [highScore, setHighScore] = useState(0)
  const [selectedAttack, setSelectedAttack] = useState<AttackType>(null)
  const [attackEffect, setAttackEffect] = useState<string>("")
  const [weaponPosition, setWeaponPosition] = useState({ x: 0, y: 0 })
  const [weaponAnimating, setWeaponAnimating] = useState(false)
  const [soundEnabled, setSoundEnabled] = useState(true)
  const [bgMusicPlaying, setBgMusicPlaying] = useState(false)
  const [splashProgress, setSplashProgress] = useState(0)
  const [audioLoaded, setAudioLoaded] = useState(false)
  const [isSplashAudioPlaying, setIsSplashAudioPlaying] = useState(false)
  const [audioContext, setAudioContext] = useState<AudioContext | null>(null)
  const imageRef = useRef<HTMLImageElement>(null)
  const { toast } = useToast()

  // Initialize audio on first user interaction
  const [audioInitialized, setAudioInitialized] = useState(false)

  // Initialize audio objects on client-side only
  useEffect(() => {
    if (typeof window !== "undefined") {
      // Create audio objects
      AUDIO.punch = new Audio("/punch-sound.mp3")
      AUDIO.sandal = new Audio("/sandal-sound.mp3")
      AUDIO.gameStart = new Audio("/game-start.mp3")
      AUDIO.gameOver = new Audio("/game-over.mp3")
      AUDIO.milestone = new Audio("/milestone.mp3")
      AUDIO.countdown = new Audio("/countdown.mp3")
      AUDIO.background = new Audio("/background-music.mp3")
      AUDIO.splash = new Audio("/splash-audio.mp3")

      // Set loop and volume properties
      if (AUDIO.background) {
        AUDIO.background.loop = true
        AUDIO.background.volume = 0.2;
      }

      if (AUDIO.punch) AUDIO.punch.volume = 1
      if (AUDIO.sandal) AUDIO.sandal.volume = 1
      if (AUDIO.gameStart) AUDIO.gameStart.volume = 0.5
      if (AUDIO.gameOver) AUDIO.gameOver.volume = 0.5
      if (AUDIO.milestone) AUDIO.milestone.volume = 0.5
      if (AUDIO.countdown) AUDIO.countdown.volume = 0.4
      if (AUDIO.splash) {
        AUDIO.splash.volume = 0.4
        AUDIO.splash.loop = true
      }

      // Create AudioContext for better autoplay handling
      try {
        const context = new (window.AudioContext || (window as any).webkitAudioContext)()
        setAudioContext(context)
      } catch (e) {
        console.log("AudioContext not supported", e)
      }

      setAudioLoaded(true)

      // Add event listener to document for user interaction
      const handleUserInteraction = () => {
        if (!audioInitialized) {
          initializeAudio()

          // Try to play splash audio immediately after user interaction
          if (AUDIO.splash && showSplash && !isSplashAudioPlaying) {
            playSplashAudio()
          }

          // Resume AudioContext if it exists and is suspended
          if (audioContext && audioContext.state === "suspended") {
            audioContext.resume()
          }
        }
      }

      document.addEventListener("click", handleUserInteraction, { once: true })
      document.addEventListener("touchstart", handleUserInteraction, { once: true })
      document.addEventListener("keydown", handleUserInteraction, { once: true })

      return () => {
        document.removeEventListener("click", handleUserInteraction)
        document.removeEventListener("touchstart", handleUserInteraction)
        document.removeEventListener("keydown", handleUserInteraction)
      }
    }
  }, [])

  // Splash screen timer and audio
  useEffect(() => {
    if (showSplash && audioLoaded) {
      // Set up progress timer for 10 seconds
      const startTime = Date.now()
      const duration = 10000 // 10 seconds

      // Auto-initialize audio with a small delay after component mounts
      setTimeout(() => {
        // Initialize audio first
        initializeAudio()

        // Try to play splash audio
        if (AUDIO.splash && soundEnabled && !isSplashAudioPlaying) {
          playSplashAudio()
        }

        // Resume AudioContext if it exists and is suspended
        if (audioContext && audioContext.state === "suspended") {
          audioContext.resume().then(() => {
            console.log("AudioContext resumed successfully")
            // Try playing again after resuming context
            if (AUDIO.splash && soundEnabled && !isSplashAudioPlaying) {
              setTimeout(playSplashAudio, 300)
            }
          })
        }
      }, 500) // Reduced delay to 500ms

      const progressInterval = setInterval(() => {
        const elapsed = Date.now() - startTime
        const progress = Math.min(100, (elapsed / duration) * 100)
        setSplashProgress(progress)

        if (progress >= 100) {
          clearInterval(progressInterval)
          // Stop splash audio
          if (AUDIO.splash) {
            AUDIO.splash.pause()
            AUDIO.splash.currentTime = 0
            setIsSplashAudioPlaying(false)
          }
          // Hide splash screen
          setShowSplash(false)
        }
      }, 100)

      return () => {
        clearInterval(progressInterval)
        if (AUDIO.splash) {
          AUDIO.splash.pause()
          AUDIO.splash.currentTime = 0
          setIsSplashAudioPlaying(false)
        }
      }
    }
  }, [showSplash, audioLoaded])

  // Function to initialize audio (must be called on user interaction)
  const initializeAudio = () => {
    if (audioInitialized || !audioLoaded) return

    // Play and immediately pause all sounds to initialize them
    Object.values(AUDIO).forEach((audio) => {
      if (!audio) return

      audio.play().catch((e: any) => console.log("Audio initialization failed:", e))
      audio.pause()
      audio.currentTime = 0
    })

    setAudioInitialized(true)
    console.log("Audio initialized successfully")
  }

  // Handle splash audio specifically
  const playSplashAudio = () => {
    if (!AUDIO.splash || !soundEnabled || isSplashAudioPlaying) return

    // Use multiple approaches to try to get audio playing
    const playAudio = async () => {
      try {
        // First approach: direct play
        await AUDIO.splash!.play()
        setIsSplashAudioPlaying(true)
        console.log("Splash audio playing successfully")
      } catch (e) {
        console.log("First splash audio attempt failed, trying alternative approach:", e)

        try {
          // Second approach: create a new audio element
          const tempAudio = new Audio("/splash-audio.mp3")
          tempAudio.volume = 0.4
          tempAudio.loop = true

          // Replace the original audio with this one
          if (AUDIO.splash) {
            AUDIO.splash.pause()
            AUDIO.splash = tempAudio
          }

          await tempAudio.play()
          setIsSplashAudioPlaying(true)
          console.log("Splash audio playing with alternative approach")
        } catch (e2) {
          console.log("All splash audio attempts failed:", e2)
          setIsSplashAudioPlaying(false)
        }
      }
    }

    playAudio()
  }

  // Handle user interaction on splash screen
  const handleSplashInteraction = () => {
    // Initialize audio system first
    initializeAudio()

    // Resume AudioContext if it exists and is suspended
    if (audioContext && audioContext.state === "suspended") {
      audioContext.resume()
    }

    // After a short delay, try to play the splash audio
    setTimeout(() => {
      playSplashAudio()
    }, 100)
  }

  // Load high score from localStorage on component mount
  useEffect(() => {
    const savedHighScore = localStorage.getItem("netanyahuPunchHighScore")
    if (savedHighScore) {
      setHighScore(Number.parseInt(savedHighScore))
    }

    // Clean up audio on unmount
    return () => {
      Object.values(AUDIO).forEach((audio) => {
        if (!audio) return

        audio.pause()
        audio.currentTime = 0
      })
    }
  }, [])

  // Play sound utility function with retry mechanism
  const playSound = (soundType: keyof typeof AUDIO) => {
    if (!soundEnabled || !audioInitialized || !AUDIO[soundType]) return

    try {
      // Create a clone of the audio to allow overlapping sounds
      const sound = AUDIO[soundType]?.cloneNode(true) as HTMLAudioElement
      if (!sound) return

      // Play the sound with a promise and retry if it fails
      const playPromise = sound.play()

      if (playPromise !== undefined) {
        playPromise.catch((error) => {
          console.log(`Error playing ${soundType} sound:`, error)
          // Try again with the original audio
          setTimeout(() => {
            if (AUDIO[soundType]) {
              AUDIO[soundType]!.currentTime = 0
              AUDIO[soundType]!.play().catch((e) => console.log(`Retry failed for ${soundType}:`, e))
            }
          }, 100)
        })
      }
    } catch (error) {
      console.error(`Failed to play ${soundType} sound:`, error)
    }
  }

  // Toggle background music
  const toggleBackgroundMusic = () => {
    if (!audioInitialized) {
      initializeAudio()
    }

    if (!AUDIO.background) return

    if (bgMusicPlaying) {
      AUDIO.background.pause()
      AUDIO.background.currentTime = 0
      setBgMusicPlaying(false)
    } else {
      AUDIO.background.currentTime = 0
      AUDIO.background.play().catch((e) => console.log("Background music play failed:", e))
      setBgMusicPlaying(true)
    }
  }

  // Toggle sound effects
  const toggleSound = () => {
    // Initialize audio if this is the first interaction
    if (!audioInitialized) {
      initializeAudio()
    }

    setSoundEnabled(!soundEnabled)

    // If turning sound off, also pause background music
    if (soundEnabled && bgMusicPlaying && AUDIO.background) {
      AUDIO.background.pause()
      setBgMusicPlaying(false)
    }

    // Play a test sound when enabling sound
    if (!soundEnabled && AUDIO.milestone) {
      setTimeout(() => {
        if (AUDIO.milestone) {
          AUDIO.milestone.currentTime = 0
          AUDIO.milestone.play().catch((e) => console.log("Test sound failed:", e))
        }
      }, 100)
    }
  }

  // Game timer
  useEffect(() => {
    if (!gameStarted) return

    // Play countdown sound when time is running low
    if (timeLeft === 10) {
      playSound("countdown")
    }

    const timer = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          clearInterval(timer)
          endGame()
          return 0
        }
        return prev - 1
      })
    }, 1000)

    return () => clearInterval(timer)
  }, [gameStarted, timeLeft])

  // Move Netanyahu randomly
  useEffect(() => {
    if (!gameStarted) return

    const moveInterval = setInterval(() => {
      if (!isAnimating) {
        setPosition({
          x: Math.random() * 60 + 20, // Keep within 20-80% of container
          y: Math.random() * 60 + 20, // Keep within 20-80% of container
        })
      }
    }, 2000)

    return () => clearInterval(moveInterval)
  }, [gameStarted, isAnimating])

  const handleAttack = (attackType: AttackType) => {
    if (!gameStarted || isAnimating || !attackType) return

    // Initialize audio if this is the first interaction
    if (!audioInitialized) {
      initializeAudio()
    }

    setSelectedAttack(attackType)
    setWeaponAnimating(true)

    // Set weapon target position to Netanyahu's current position
    setWeaponPosition({
      x: position.x,
      y: position.y,
    })

    // Start the animation sequence
    setIsAnimating(true)

    // Play appropriate sound after a slight delay (when weapon hits)
    setTimeout(() => {
      // Play the attack sound
      if (attackType === "punch") {
        playSound("punch")
      } else {
        playSound("sandal")
      }

      // Set attack effect text
      setAttackEffect(attackType === "punch" ? "POW!" : "SLAP!")

      // Increment score based on attack type
      const pointsToAdd = attackType === "punch" ? 1 : 2 // Sandals worth more points
      setScore((prev) => prev + pointsToAdd)
    }, 300) // Delay for when weapon hits face

    // Reset animations after they complete
    setTimeout(() => {
      setWeaponAnimating(false)
      setIsAnimating(false)
      setSelectedAttack(null)
      setAttackEffect("")
    }, 1000)

    // Show confetti and play sound on milestone scores
    if ((score + 1) % 10 === 0) {
      // Check score+1 since we haven't updated state yet
      setTimeout(() => {
        confetti({
          particleCount: 100,
          spread: 70,
          origin: { y: 0.6 },
        })

        playSound("milestone")

        toast({
          title: "Milestone reached!",
          description: `You've attacked Netanyahu ${score + 1} times!`,
        })
      }, 500) // Delay milestone celebration slightly after hit
    }
  }

  const startGame = () => {
    // Initialize audio if this is the first interaction
    if (!audioInitialized) {
      initializeAudio()
    }
  
    setGameStarted(true)
    setScore(0)
    setTimeLeft(30)
  
    // Play start sound
    playSound("gameStart")
  
    // Stop any existing background music first to prevent doubling
    if (AUDIO.background) {
      AUDIO.background.pause()
      AUDIO.background.currentTime = 0
      setBgMusicPlaying(false)
    }
  
    // Start background music if sound is enabled
    if (soundEnabled && AUDIO.background) {
      setTimeout(() => {
        if (AUDIO.background) {
          AUDIO.background.currentTime = 0
          AUDIO.background.volume = 0.3; // Keep consistent with initial volume
          AUDIO.background.play().catch((e) => console.log("Background music play failed:", e))
          setBgMusicPlaying(true)
        }
      }, 200) // Short delay to ensure previous playback is fully stopped
    }
  }

  const endGame = () => {
    setGameStarted(false)

    // Play game over sound
    playSound("gameOver")

    // Pause background music
    if (bgMusicPlaying && AUDIO.background) {
      AUDIO.background.pause()
      AUDIO.background.currentTime = 0
      setBgMusicPlaying(false)
    }

    // Update high score if needed
    if (score > highScore) {
      setHighScore(score)
      localStorage.setItem("netanyahuPunchHighScore", score.toString())

      confetti({
        particleCount: 200,
        spread: 160,
        origin: { y: 0.6 },
      })

      toast({
        title: "New High Score!",
        description: `You set a new record with ${score} points!`,
        variant: "default",
      })
    } else {
      toast({
        title: "Game Over!",
        description: `You scored ${score} points!`,
        variant: "default",
      })
    }
  }

  // Render splash screen
  if (showSplash) {
    return (
      <div className="fixed inset-0 flex items-center justify-center bg-black z-50 p-4" onClick={handleSplashInteraction}>
        <div className="text-center max-w-md mx-auto">
          <h1 className="text-3xl sm:text-5xl font-bold text-red-600 mb-4 sm:mb-6">Solidarity with Gaza</h1>
          <h2 className="text-xl sm:text-3xl font-bold text-red-500 mb-6 sm:mb-8">
            #FreePalestine
            <br />
            #NoMoreLies
          </h2>
  
          <div className="w-full max-w-64 h-3 bg-gray-800 rounded-full overflow-hidden mx-auto mb-4">
            <div
              className="h-full bg-red-600 transition-all duration-300 ease-out"
              style={{ width: `${splashProgress}%` }}
            ></div>
          </div>
  
          <p className="text-red-400 mt-2 text-sm sm:text-base">
            {splashProgress < 100 ? `${Math.floor(10 - splashProgress / 10)} seconds remaining...` : "Loading game..."}
          </p>
  
          <div className="mt-4 sm:mt-6 flex flex-col gap-2 sm:gap-3">
            {!isSplashAudioPlaying && (
              <button
                className="mx-auto text-white bg-red-700 px-3 py-1.5 sm:px-4 sm:py-2 text-sm sm:text-base rounded-md hover:bg-red-800 transition-colors"
                onClick={(e) => {
                  e.stopPropagation()
                  handleSplashInteraction()
                }}
              >
                Enable Audio
              </button>
            )}
  
            <button
              className="mx-auto text-white bg-red-600 px-3 py-1.5 sm:px-4 sm:py-2 text-sm sm:text-base rounded-md hover:bg-red-800 transition-colors"
              onClick={(e) => {
                e.stopPropagation()
                
                // Make sure audio is initialized before skipping
                if (!audioInitialized) {
                  initializeAudio()
                }
                
                // Stop any current splash audio
                if (AUDIO.splash) {
                  AUDIO.splash.pause()
                  AUDIO.splash.currentTime = 0
                  setIsSplashAudioPlaying(false)
                }
                
                // Stop any background music that might have started too
                if (AUDIO.background) {
                  AUDIO.background.pause()
                  AUDIO.background.currentTime = 0
                  setBgMusicPlaying(false)
                }
                
                setShowSplash(false)
              }}
            >
              Skip to Game
            </button>
          </div>
  
          {isSplashAudioPlaying && <p className="text-green-400 mt-4 text-sm sm:text-base">✓ Audio playing</p>}
          
          {/* Credits on splash screen */}
          <div className="mt-6 sm:mt-8 text-center text-xs sm:text-sm text-gray-400">
            <p>
              {/* Created by Azizur Rahaman {" "} */}
              <a 
                href="https://facebook.com/AzizurRahamanFr" 
                target="_blank" 
                rel="noopener noreferrer"
                className="inline-block align-middle mx-1 text-blue-400 hover:text-blue-300 transition-colors"
                onClick={(e) => e.stopPropagation()}
                title="Facebook"
              >
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M9 8h-3v4h3v12h5v-12h3.642l.358-4h-4v-1.667c0-.955.192-1.333 1.115-1.333h2.885v-5h-3.808c-3.596 0-5.192 1.583-5.192 4.615v3.385z"/>
                </svg>
              </a>
              {" "}
              <a 
                href="https://www.linkedin.com/in/azizur-rahaman/" 
                target="_blank" 
                rel="noopener noreferrer"
                className="inline-block align-middle mx-1 text-blue-400 hover:text-blue-300 transition-colors"
                onClick={(e) => e.stopPropagation()}
                title="LinkedIn"
              >
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M4.98 3.5c0 1.381-1.11 2.5-2.48 2.5s-2.48-1.119-2.48-2.5c0-1.38 1.11-2.5 2.48-2.5s2.48 1.12 2.48 2.5zm.02 4.5h-5v16h5v-16zm7.982 0h-4.968v16h4.969v-8.399c0-4.67 6.029-5.052 6.029 0v8.399h4.988v-10.131c0-7.88-8.922-7.593-11.018-3.714v-2.155z"/>
                </svg>
              </a>
            </p>
          </div>
        </div>
      </div>
    )
  }
  return (

    <>

<Card className="w-full max-w-2xl p-6 flex flex-col items-center">
      <div className="flex justify-between w-full mb-4">
        <div className="text-xl font-bold">Score: {score}</div>
        <div className="text-xl font-bold">High Score: {highScore}</div>
        {gameStarted && <div className="text-xl font-bold">Time: {timeLeft}s</div>}
        <div className="flex gap-2">
          <Button
            variant="ghost"
            size="icon"
            onClick={toggleSound}
            className="ml-auto"
            title={soundEnabled ? "Mute sounds" : "Enable sounds"}
          >
            {soundEnabled ? <Volume2 size={20} /> : <VolumeX size={20} />}
          </Button>
          {soundEnabled && (
            <Button
              variant="ghost"
              size="sm"
              onClick={toggleBackgroundMusic}
              className="text-xs"
              title={bgMusicPlaying ? "Stop music" : "Play music"}
            >
              {bgMusicPlaying ? "Stop Music" : "Play Music"}
            </Button>
          )}
        </div>
      </div>

      <div className="relative w-full h-[400px] border-2 border-gray-200 rounded-lg overflow-hidden bg-blue-50">
        {gameStarted ? (
          <>
            {/* Left side - Punch */}
            <div
              className="absolute left-4 top-1/2 transform -translate-y-1/2 cursor-pointer z-10"
              onClick={() => !isAnimating && handleAttack("punch")}
            >
              <div className="relative">
                <img
                  src="/fist.png"
                  alt="Punch"
                  className={`w-20 h-20 object-contain ${
                    selectedAttack === "punch" && weaponAnimating ? "opacity-50" : "opacity-100"
                  }`}
                />
                <p className="text-center font-bold mt-2">Punch (1pt)</p>
              </div>
            </div>

            {/* Right side - Sandal */}
            <div
              className="absolute right-4 top-1/2 transform -translate-y-1/2 cursor-pointer z-10"
              onClick={() => !isAnimating && handleAttack("sandal")}
            >
              <div className="relative">
                <img
                  src="/sandal.png"
                  alt="Sandal"
                  className={`w-20 h-20 object-contain ${
                    selectedAttack === "sandal" && weaponAnimating ? "opacity-50" : "opacity-100"
                  }`}
                />
                <p className="text-center font-bold mt-2">Sandal (2pts)</p>
              </div>
            </div>

            {/* Animated weapon that flies to the target */}
            {weaponAnimating && selectedAttack && (
              <div
                className="absolute z-20 transition-all duration-300 ease-in-out"
                style={{
                  left: `${weaponPosition.x}%`,
                  top: `${weaponPosition.y}%`,
                  transform: "translate(-50%, -50%) scale(1.2)",
                  opacity: isAnimating ? 1 : 0,
                }}
              >
                <img
                  src={selectedAttack === "punch" ? "/fist.png" : "/sandal.png"}
                  alt={selectedAttack === "punch" ? "Punch" : "Sandal"}
                  className={`w-20 h-20 object-contain ${
                    selectedAttack === "sandal" ? "rotate-45" : ""
                  } animate-weapon-hit`}
                />
              </div>
            )}

            {/* Netanyahu */}
            <div
              className="absolute transition-all duration-300 ease-in-out"
              style={{
                left: `${position.x}%`,
                top: `${position.y}%`,
                transform: "translate(-50%, -50%)",
              }}
            >
              <img
                ref={imageRef}
                src="/netanyahu-caricature.png"
                alt="Benjamin Netanyahu"
                className={`w-32 h-32 object-contain transition-all duration-300`}
                style={{
                  filter: isAnimating ? "brightness(0.8)" : "brightness(1)",
                  transform: isAnimating
                    ? selectedAttack === "punch"
                      ? "translateX(20px) rotate(10deg) scale(0.9)"
                      : "translateX(-20px) rotate(-10deg) scale(0.9)"
                    : "translateX(0) rotate(0) scale(1)",
                }}
              />
              {isAnimating && attackEffect && (
                <div className="absolute top-0 left-0 w-full h-full flex items-center justify-center">
                  <div className="text-4xl font-bold text-red-600 animate-bounce">{attackEffect}</div>
                </div>
              )}
            </div>
          </>
        ) : (
          <div className="flex flex-col items-center justify-center h-full">
            <img src="/netanyahu-caricature.png" alt="Benjamin Netanyahu" className="w-40 h-40 object-contain mb-4" />
            <h2 className="text-2xl font-bold mb-4">Attack Netanyahu</h2>
            <p className="text-center mb-4">
              Use the punch or sandal to attack Netanyahu as many times as you can in 30 seconds!
            </p>
            <Button onClick={startGame} size="lg">
              {highScore > 0 ? "Play Again" : "Start Game"}
            </Button>
            <p className="text-sm text-gray-500 mt-4">Click the sound button to hear game sounds!</p>
          </div>
        )}
      </div>

      {gameStarted && (
        <div className="mt-4 text-center">
          <p>Click on the fist or sandal to attack Netanyahu!</p>
          <p className="text-sm text-gray-500 mt-1">Punch = 1 point, Sandal = 2 points</p>
        </div>
      )}

      {/* Debug sound button - for testing */}
      {/* <Button
        variant="outline"
        size="sm"
        className="mt-4"
        onClick={() => {
          initializeAudio()
          playSound("punch")
          setTimeout(() => playSound("sandal"), 500)
        }}
      >
        Test Sounds
      </Button> */}
    </Card>




    {/* Credits footer with icons */}
<div className="mt-4 pt-3 border-t border-gray-200 w-full text-center">
  <p className="text-xs sm:text-sm text-gray-500">
    Created by Azizur Rahaman {" "}
    <a 
      href="https://facebook.com/AzizurRahamanFr" 
      target="_blank" 
      rel="noopener noreferrer"
      className="inline-block align-middle mx-1 text-blue-600 hover:text-blue-800 transition-colors"
      title="Facebook"
    >
      <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" viewBox="0 0 24 24">
        <path d="M9 8h-3v4h3v12h5v-12h3.642l.358-4h-4v-1.667c0-.955.192-1.333 1.115-1.333h2.885v-5h-3.808c-3.596 0-5.192 1.583-5.192 4.615v3.385z"/>
      </svg>
    </a>
    {" "}
    <a 
      href="https://www.linkedin.com/in/azizur-rahaman" 
      target="_blank" 
      rel="noopener noreferrer"
      className="inline-block align-middle mx-1 text-blue-600 hover:text-blue-800 transition-colors"
      title="LinkedIn"
    >
      <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" viewBox="0 0 24 24">
        <path d="M4.98 3.5c0 1.381-1.11 2.5-2.48 2.5s-2.48-1.119-2.48-2.5c0-1.38 1.11-2.5 2.48-2.5s2.48 1.12 2.48 2.5zm.02 4.5h-5v16h5v-16zm7.982 0h-4.968v16h4.969v-8.399c0-4.67 6.029-5.052 6.029 0v8.399h4.988v-10.131c0-7.88-8.922-7.593-11.018-3.714v-2.155z"/>
      </svg>
    </a>
  </p>
</div>
    </>

    
  )
}
