import PunchGame from "@/components/punch-game"

export default function Home() {
  
  return (
    <main className="flex min-h-screen flex-col items-center justify-center p-4 bg-gradient-to-b from-blue-100 to-white">
      <h1 className="text-4xl font-bold text-center mb-8">Attack Netanyahu</h1>
      <PunchGame />
    </main>
  )
}
