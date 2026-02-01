import Link from 'next/link'
import { ArrowLeft, Ghost } from 'lucide-react'

export default function NotFound() {
  return (
    <div className="h-screen w-full flex flex-col items-center justify-center bg-black text-white relative overflow-hidden">
      
      {/* Fondo Ambientación */}
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-purple-900/40 via-black to-black"></div>
      
      <div className="relative z-10 text-center px-4">
        <div className="inline-flex p-4 bg-zinc-900 rounded-full mb-6 border border-zinc-800 shadow-xl shadow-purple-900/20">
            <Ghost size={40} className="text-purple-500 animate-bounce" />
        </div>
        
        <h1 className="text-9xl font-black text-white tracking-tighter opacity-50 select-none">404</h1>
        <h2 className="text-2xl font-bold text-white -mt-4 mb-2">Aquí no está la fiesta</h2>
        <p className="text-zinc-400 max-w-md mx-auto mb-8">
            Parece que te perdiste en el backstage. Esta página no existe o fue eliminada.
        </p>

        <Link href="/">
            <button className="px-8 py-3 bg-white text-black font-bold rounded-xl hover:scale-105 transition-transform flex items-center gap-2 mx-auto">
                <ArrowLeft size={18} />
                Volver al Dashboard
            </button>
        </Link>
      </div>

    </div>
  )
}