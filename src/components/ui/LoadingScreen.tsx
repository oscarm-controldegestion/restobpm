export default function LoadingScreen() {
  return (
    <div className="min-h-screen bg-brand-700 flex flex-col items-center justify-center">
      <div className="w-12 h-12 bg-white rounded-xl flex items-center justify-center mb-4 animate-pulse">
        <span className="text-brand-700 font-bold text-xl">R</span>
      </div>
      <p className="text-white/60 text-sm">Cargando RestoBPM...</p>
    </div>
  )
}
