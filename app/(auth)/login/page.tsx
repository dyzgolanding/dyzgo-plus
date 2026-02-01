'use client'

import { useState, Suspense } from 'react'
import Link from 'next/link'
import { useSearchParams } from 'next/navigation'
import { ArrowRight, Lock, Mail, Sparkles, Loader2, Eye, EyeOff, AlertCircle } from 'lucide-react'
import { login } from './actions' 

// 1. Separamos la lógica del formulario en un componente interno
function LoginForm() {
  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading] = useState(false) 
  
  const searchParams = useSearchParams()
  const errorMsg = searchParams.get('error')

  const handleSubmit = async (formData: FormData) => {
    setLoading(true)
    // Next.js maneja la redirección lanzando un error, así que el setLoading(false)
    // podría no ejecutarse si redirige exitosamente, lo cual está bien.
    await login(formData) 
    setLoading(false)
  }

  return (
    <div className="min-h-screen w-full flex items-center justify-center bg-[#030005] font-sans text-white relative overflow-hidden selection:bg-[#FF007F]/30">
      
      {/* ==================================================================
          FONDO UNIFICADO
      ================================================================== */}
      <div className="fixed inset-0 z-0">
          <div className="absolute inset-0 bg-[url('https://images.unsplash.com/photo-1514525253440-b393452e3383?q=80&w=2500&auto=format&fit=crop')] bg-cover bg-center opacity-40 mix-blend-color-dodge grayscale" />
          <div className="absolute inset-0 bg-[#050208]/80 backdrop-blur-sm" />
          <div className="absolute top-[-10%] left-[-10%] w-[60vw] h-[60vw] bg-[#8A2BE2]/20 rounded-full blur-[120px] animate-pulse" />
          <div className="absolute bottom-[-10%] right-[-10%] w-[60vw] h-[60vw] bg-[#FF007F]/10 rounded-full blur-[120px]" />
      </div>

      {/* ==================================================================
          CONTENIDO FLOTANTE
      ================================================================== */}
      <div className="relative z-10 w-full max-w-5xl p-4 md:p-6">
        
        <div className="w-full grid lg:grid-cols-2 bg-white/5 backdrop-blur-3xl border border-white/10 rounded-[3rem] overflow-hidden shadow-2xl shadow-purple-900/30">
            
            {/* --- COLUMNA IZQUIERDA: FORMULARIO --- */}
            <div className="p-8 md:p-16 flex flex-col justify-center relative">
                
                <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-white/10 to-transparent" />

                <div className="mb-10">
                    <div className="inline-flex h-12 w-12 bg-gradient-to-br from-[#8A2BE2] to-[#FF007F] rounded-2xl items-center justify-center shadow-[0_0_20px_rgba(138,43,226,0.3)] mb-6 border border-white/20">
                        <Sparkles size={22} className="text-white drop-shadow-md" />
                    </div>
                    <h1 className="text-3xl font-black tracking-tight text-white mb-2">DyzGO<span className="text-transparent bg-clip-text bg-gradient-to-r from-[#FF007F] to-[#8A2BE2]">+</span></h1>
                    <p className="text-white/40 text-sm font-medium">Panel de Control Administrativo</p>
                </div>

                {/* MENSAJE DE ERROR DEL SERVIDOR */}
                {errorMsg && (
                    <div className="mb-6 p-4 bg-red-500/10 border border-red-500/20 rounded-2xl flex items-center gap-3 text-red-200 text-sm">
                        <AlertCircle size={18} className="text-red-500" />
                        {decodeURIComponent(errorMsg)}
                    </div>
                )}

                <form action={handleSubmit} className="space-y-5">
                    <div className="space-y-2">
                        <label className="text-[10px] font-bold text-white/30 uppercase tracking-[0.2em] ml-1">Email</label>
                        <div className="relative group">
                            <div className="absolute inset-0 bg-gradient-to-r from-[#8A2BE2] to-[#FF007F] rounded-2xl opacity-0 group-focus-within:opacity-20 transition-opacity blur-md duration-500" />
                            <Mail size={18} className="absolute left-5 top-4 text-white/30 group-focus-within:text-[#FF007F] transition-colors z-10" />
                            <input 
                                name="email"
                                type="email" 
                                required
                                placeholder="admin@dyzgo.com"
                                className="relative w-full bg-black/40 backdrop-blur-md border border-white/10 rounded-2xl py-3.5 pl-14 pr-4 text-white placeholder:text-white/10 focus:outline-none focus:border-white/20 focus:bg-black/60 transition-all font-medium"
                            />
                        </div>
                    </div>

                    <div className="space-y-2">
                        <label className="text-[10px] font-bold text-white/30 uppercase tracking-[0.2em] ml-1">Contraseña</label>
                        <div className="relative group">
                            <div className="absolute inset-0 bg-gradient-to-r from-[#8A2BE2] to-[#FF007F] rounded-2xl opacity-0 group-focus-within:opacity-20 transition-opacity blur-md duration-500" />
                            <Lock size={18} className="absolute left-5 top-4 text-white/30 group-focus-within:text-[#FF007F] transition-colors z-10" />
                            <input 
                                name="password"
                                type={showPassword ? "text" : "password"} 
                                required
                                placeholder="••••••••••••"
                                className="relative w-full bg-black/40 backdrop-blur-md border border-white/10 rounded-2xl py-3.5 pl-14 pr-12 text-white placeholder:text-white/10 focus:outline-none focus:border-white/20 focus:bg-black/60 transition-all font-medium"
                            />
                            <button 
                                type="button"
                                onClick={() => setShowPassword(!showPassword)}
                                className="absolute right-5 top-4 text-white/30 hover:text-white transition-colors focus:outline-none z-10"
                            >
                                {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                            </button>
                        </div>
                    </div>

                    <button 
                        type="submit"
                        disabled={loading}
                        className="w-full py-4 rounded-2xl font-bold text-xs uppercase tracking-widest text-white relative group overflow-hidden transition-all hover:scale-[1.01] active:scale-[0.99] disabled:opacity-50 mt-4 shadow-lg shadow-purple-900/20"
                    >
                        <div className="absolute inset-0 bg-gradient-to-r from-[#8A2BE2] to-[#FF007F] opacity-90 group-hover:opacity-100 transition-opacity" />
                        <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-20 mix-blend-overlay" />
                        <div className="relative flex items-center justify-center gap-3">
                            {loading ? (
                                <Loader2 className="animate-spin" size={18} />
                            ) : (
                                <>Entrar al Sistema <ArrowRight size={16} /></>
                            )}
                        </div>
                    </button>
                </form>

                <div className="mt-8 text-center">
                    <p className="text-xs text-white/30 font-medium">
                        ¿No tienes acceso? 
                        <Link 
                            href="/register" 
                            className="ml-2 text-white hover:text-[#FF007F] transition-colors underline decoration-white/20 hover:decoration-[#FF007F] underline-offset-4"
                        >
                            Solicitar invitación
                        </Link>
                    </p>
                </div>
            </div>

            {/* --- COLUMNA DERECHA: VISUAL --- */}
            <div className="hidden lg:flex relative bg-black/20 items-center justify-center p-12 overflow-hidden">
                <div className="absolute left-0 top-10 bottom-10 w-px bg-gradient-to-b from-transparent via-white/10 to-transparent" />
                <div className="relative z-10 max-w-sm">
                    <div className="absolute top-[-50px] left-[-50px] w-32 h-32 bg-[#FF007F] rounded-full blur-[80px] opacity-20" />
                    <div className="inline-flex items-center gap-3 px-4 py-2 rounded-full bg-white/5 backdrop-blur-md border border-white/10 text-[9px] font-bold tracking-[0.2em] uppercase mb-8 text-[#FF007F]">
                        <span className="relative flex h-1.5 w-1.5">
                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#FF007F] opacity-75"></span>
                        <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-[#FF007F]"></span>
                        </span>
                        Sistema v2.0
                    </div>
                    <h2 className="text-4xl md:text-5xl font-black mb-6 leading-tight tracking-tight text-white">
                        Gestión <br/>
                        <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#8A2BE2] to-[#FF007F]">Inteligente</span> <br/>
                        de Eventos.
                    </h2>
                    <p className="text-sm text-white/40 leading-relaxed font-medium">
                        Control de acceso en tiempo real, métricas avanzadas y gestión de staff en una sola plataforma unificada.
                    </p>
                    <div className="flex items-center gap-4 mt-10">
                        <div className="flex -space-x-3">
                            {[1,2,3].map(i => (
                                <div key={i} className="w-8 h-8 rounded-full border border-black/50 bg-[#1a1a1a] flex items-center justify-center text-[8px] font-bold text-white/30">
                                    <div className="w-full h-full bg-gradient-to-br from-white/10 to-transparent rounded-full" />
                                </div>
                            ))}
                        </div>
                        <div className="text-xs font-bold text-white/30 uppercase tracking-widest">
                            Trusted by Pros
                        </div>
                    </div>
                </div>
            </div>

        </div>
      </div>
    </div>
  )
}

// 2. Exportamos el componente envuelto en Suspense
// Esto es OBLIGATORIO en Next.js si usas useSearchParams en builds de producción
export default function LoginPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen w-full flex items-center justify-center bg-[#030005]">
        <Loader2 className="animate-spin text-[#FF007F]" size={32} />
      </div>
    }>
      <LoginForm />
    </Suspense>
  )
}